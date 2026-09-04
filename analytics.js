(function () {
    "use strict";

    const ANALYTICS_WORKER_BASE_URL = "https://article-format-api.article-format-api.workers.dev";
    const VISITOR_ID_STORAGE_KEY = "article-format-visitor-id";
    const DAILY_ACTIVE_STORAGE_KEY = "article-format-daily-active-day";
    const REPORT_DELAY_MS = 2000;
    const REPORT_TIMEOUT_MS = 3000;

    function isConfigured() {
        return /^https:\/\/.+/i.test(ANALYTICS_WORKER_BASE_URL);
    }

    function getLocalDay() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const day = String(now.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    }

    function getVisitorId() {
        let visitorId = "";
        try {
            visitorId = localStorage.getItem(VISITOR_ID_STORAGE_KEY) || "";
            if (!visitorId) {
                visitorId = crypto.randomUUID();
                localStorage.setItem(VISITOR_ID_STORAGE_KEY, visitorId);
            }
        } catch (_error) {
            visitorId = crypto.randomUUID();
        }
        return visitorId;
    }

    function hasReportedToday(today) {
        try {
            return localStorage.getItem(DAILY_ACTIVE_STORAGE_KEY) === today;
        } catch (_error) {
            return false;
        }
    }

    function markReportedToday(today) {
        try {
            localStorage.setItem(DAILY_ACTIVE_STORAGE_KEY, today);
        } catch (_error) {
            // Analytics should never affect the editor experience.
        }
    }

    async function reportDailyActive() {
        if (!isConfigured()) return;

        const today = getLocalDay();
        if (hasReportedToday(today)) return;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), REPORT_TIMEOUT_MS);
        try {
            const response = await fetch(`${ANALYTICS_WORKER_BASE_URL.replace(/\/+$/, "")}/analytics/active`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ visitorId: getVisitorId() }),
                keepalive: true,
                signal: controller.signal
            });
            if (response.ok) markReportedToday(today);
        } catch (_error) {
            // Best-effort only. Slow or blocked networks should stay invisible.
        } finally {
            clearTimeout(timeoutId);
        }
    }

    function scheduleDailyActiveReport() {
        if (!isConfigured()) return;
        const schedule = window.requestIdleCallback || ((callback) => setTimeout(callback, REPORT_DELAY_MS));
        schedule(reportDailyActive, { timeout: REPORT_DELAY_MS });
    }

    scheduleDailyActiveReport();
})();
