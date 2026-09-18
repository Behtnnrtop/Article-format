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

    function createVisitorId() {
        if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
            return crypto.randomUUID();
        }

        const bytes = new Uint8Array(16);
        if (typeof crypto !== "undefined" && crypto.getRandomValues) {
            crypto.getRandomValues(bytes);
        } else {
            for (let index = 0; index < bytes.length; index += 1) {
                bytes[index] = Math.floor(Math.random() * 256);
            }
        }

        bytes[6] = (bytes[6] & 0x0f) | 0x40;
        bytes[8] = (bytes[8] & 0x3f) | 0x80;
        const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"));
        return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex.slice(6, 8).join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10, 16).join("")}`;
    }

    function getVisitorId() {
        let visitorId = "";
        try {
            visitorId = localStorage.getItem(VISITOR_ID_STORAGE_KEY) || "";
            if (!visitorId) {
                visitorId = createVisitorId();
                localStorage.setItem(VISITOR_ID_STORAGE_KEY, visitorId);
            }
        } catch (_error) {
            visitorId = createVisitorId();
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

    function createRequestTimeout() {
        if (typeof AbortController === "undefined") {
            return {
                signal: undefined,
                clear: function () {}
            };
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), REPORT_TIMEOUT_MS);
        return {
            signal: controller.signal,
            clear: function () {
                clearTimeout(timeoutId);
            }
        };
    }

    async function reportDailyActive() {
        if (!isConfigured()) return;

        const today = getLocalDay();
        if (hasReportedToday(today)) return;

        const timeout = createRequestTimeout();
        try {
            const response = await fetch(`${ANALYTICS_WORKER_BASE_URL.replace(/\/+$/, "")}/analytics/active`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ visitorId: getVisitorId() }),
                keepalive: true,
                signal: timeout.signal
            });
            if (response.ok) markReportedToday(today);
        } catch (_error) {
            // Best-effort only. Slow or blocked networks should stay invisible.
        } finally {
            timeout.clear();
        }
    }

    async function reportSupportClick() {
        if (!isConfigured()) return;

        const timeout = createRequestTimeout();
        try {
            await fetch(`${ANALYTICS_WORKER_BASE_URL.replace(/\/+$/, "")}/analytics/support-click`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ visitorId: getVisitorId() }),
                keepalive: true,
                signal: timeout.signal
            });
        } catch (_error) {
            // Best-effort only. The support link should open regardless of analytics.
        } finally {
            timeout.clear();
        }
    }

    window.handleSupportSiteClick = function () {
        window.open("https://share.mubu.com/doc/5UcQ7YVxdct", "_blank", "noopener,noreferrer");
        reportSupportClick();
    };

    function scheduleDailyActiveReport() {
        if (!isConfigured()) return;
        const schedule = window.requestIdleCallback || ((callback) => setTimeout(callback, REPORT_DELAY_MS));
        schedule(reportDailyActive, { timeout: REPORT_DELAY_MS });
    }

    scheduleDailyActiveReport();
})();
