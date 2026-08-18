(function registerSlicedZipDelivery() {
    "use strict";

    const EXPORT_API_BASE_URL = "https://article-format.com";
    const DEVICE_ID_STORAGE_KEY = "articleSummaryExportDeviceId";
    const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    let sessionDeviceId = "";

    function isMobileExportTarget() {
        return window.matchMedia?.("(max-width: 768px)")?.matches
            || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    }

    function createUuid() {
        if (typeof crypto.randomUUID === "function") {
            return crypto.randomUUID();
        }

        const bytes = crypto.getRandomValues(new Uint8Array(16));
        bytes[6] = (bytes[6] & 0x0f) | 0x40;
        bytes[8] = (bytes[8] & 0x3f) | 0x80;
        const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"));
        return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex.slice(6, 8).join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10).join("")}`;
    }

    function getDeviceId() {
        if (sessionDeviceId) return sessionDeviceId;

        try {
            const storedDeviceId = window.localStorage.getItem(DEVICE_ID_STORAGE_KEY) || "";
            if (UUID_PATTERN.test(storedDeviceId)) {
                sessionDeviceId = storedDeviceId;
                return sessionDeviceId;
            }

            sessionDeviceId = createUuid();
            window.localStorage.setItem(DEVICE_ID_STORAGE_KEY, sessionDeviceId);
            return sessionDeviceId;
        } catch (error) {
            console.warn("Unable to persist the export device identifier", error);
            sessionDeviceId = createUuid();
            return sessionDeviceId;
        }
    }

    function getApiBaseUrl() {
        if (EXPORT_API_BASE_URL.includes("REPLACE_WITH_YOUR_SUBDOMAIN")) {
            throw new Error("切图导出失败，请稍后再试。");
        }

        return new URL(EXPORT_API_BASE_URL);
    }

    async function deliver({ blob }) {
        if (!isMobileExportTarget()) return false;
        if (!(blob instanceof Blob) || blob.size <= 0) {
            throw new Error("切图导出失败，请稍后再试。");
        }

        const apiBaseUrl = getApiBaseUrl();
        const zipBlob = blob.type === "application/zip"
            ? blob
            : new Blob([blob], { type: "application/zip" });

        let response;
        try {
            response = await fetch(new URL("/exports", apiBaseUrl), {
                method: "POST",
                headers: {
                    "Content-Type": "application/zip",
                    "X-Export-Device-ID": getDeviceId(),
                    "X-Export-Size": String(zipBlob.size)
                },
                body: zipBlob,
                cache: "no-store"
            });
        } catch (error) {
            console.error("Sliced ZIP delivery request failed", error);
            throw new Error("切图导出失败，请稍后再试。");
        }

        let payload = null;
        try {
            payload = await response.json();
        } catch (error) {
            console.error("Sliced ZIP delivery returned an invalid response", error);
        }

        if (!response.ok || typeof payload?.downloadUrl !== "string") {
            console.error("Sliced ZIP delivery was rejected", response.status, payload);
            throw new Error("切图导出失败，请稍后再试。");
        }

        const downloadUrl = new URL(payload.downloadUrl);
        if (downloadUrl.origin !== apiBaseUrl.origin || !downloadUrl.pathname.startsWith("/exports/")) {
            console.error("Sliced ZIP delivery returned an unexpected URL", downloadUrl.href);
            throw new Error("切图导出失败，请稍后再试。");
        }

        window.location.assign(downloadUrl.href);
        return true;
    }

    window.slicedZipDelivery = Object.freeze({ deliver });
})();
