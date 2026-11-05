(function (global) {
    "use strict";

    let mobileExportPreviewState = null;

    function isVisibleElement(element) {
        return Boolean(element && element.offsetParent !== null);
    }

    function isLikelyMobileBrowser() {
        const mobileViewport = typeof global.isMobileViewport === "function"
            && global.isMobileViewport();
        return mobileViewport || /Android|iPhone|iPad|iPod/i.test(global.navigator.userAgent);
    }

    function shouldOpenDesktopExportPreview(primaryButtonId) {
        return !isLikelyMobileBrowser()
            && isVisibleElement(global.document.getElementById(primaryButtonId));
    }

    function downloadBlob(blob, filename, { fallbackWindow = null } = {}) {
        const url = global.URL.createObjectURL(blob);
        const link = global.document.createElement("a");
        link.href = url;
        link.download = filename;
        link.rel = "noopener";
        link.style.display = "none";
        global.document.body.appendChild(link);
        link.click();
        link.remove();

        global.setTimeout(() => {
            if (fallbackWindow && !fallbackWindow.closed) {
                fallbackWindow.location.href = url;
            }

            global.setTimeout(() => global.URL.revokeObjectURL(url), 60 * 1000);
        }, 250);
    }

    function updateMobileExportPreviewImage({ resetScroll = true } = {}) {
        if (!mobileExportPreviewState) return;

        const state = mobileExportPreviewState;
        const image = global.document.getElementById("mobileExportPreviewImage");
        const pageValue = global.document.getElementById("mobileExportPreviewPageValue");
        const previousButton = global.document.getElementById("mobileExportPreviewPrevBtn");
        const nextButton = global.document.getElementById("mobileExportPreviewNextBtn");
        const stage = global.document.getElementById("mobileExportPreviewStage");
        const scaleValue = global.document.getElementById("mobileExportPreviewScaleValue");
        const decreaseButton = global.document.getElementById("mobileExportPreviewScaleDecreaseBtn");
        const increaseButton = global.document.getElementById("mobileExportPreviewScaleIncreaseBtn");

        if (!image || !pageValue || !previousButton || !nextButton) return;

        image.src = state.imageUrls[state.currentImageIndex];
        image.style.setProperty("--mobile-export-preview-css-width", `${state.cssWidth * state.previewScale}px`);
        image.alt = state.imageUrls.length === 1
            ? "导出图片预览"
            : `第 ${state.currentImageIndex + 1} 张切图预览`;
        pageValue.textContent = `${state.currentImageIndex + 1}/${state.imageUrls.length}`;
        previousButton.disabled = state.currentImageIndex <= 0;
        nextButton.disabled = state.currentImageIndex >= state.imageUrls.length - 1;
        if (scaleValue) scaleValue.textContent = `${Math.round(state.previewScale * 100)}%`;
        if (decreaseButton) decreaseButton.disabled = state.previewScale <= 0.5;
        if (increaseButton) increaseButton.disabled = state.previewScale >= 1.5;
        if (stage && resetScroll) {
            stage.scrollTop = 0;
            stage.scrollLeft = 0;
        }
    }

    function showMobileExportPreview({ title, fileBlob, downloadFilename, downloadLabel, cssWidth, images }) {
        closeMobileExportPreview({ restoreFocus: false });

        const preview = global.document.getElementById("mobileExportPreview");
        const titleElement = global.document.getElementById("mobileExportPreviewTitle");
        const meta = global.document.getElementById("mobileExportPreviewMeta");
        const pager = global.document.getElementById("mobileExportPreviewPager");
        const downloadButton = global.document.getElementById("mobileExportPreviewDownloadBtn");
        const closeButton = global.document.getElementById("mobileExportPreviewCloseBtn");
        if (!preview || !titleElement || !meta || !pager || !downloadButton) {
            downloadBlob(fileBlob, downloadFilename);
            return;
        }

        const imageUrls = images.map((image) => global.URL.createObjectURL(image.blob));
        mobileExportPreviewState = {
            fileBlob,
            downloadFilename,
            cssWidth: Math.max(1, Math.round(Number(cssWidth) || 360)),
            imageUrls,
            currentImageIndex: 0,
            previewScale: 1,
            returnFocusElement: global.document.activeElement
        };

        titleElement.textContent = title;
        meta.textContent = imageUrls.length === 1 ? "1 张图片" : `${imageUrls.length} 张切图`;
        pager.hidden = imageUrls.length <= 1;
        downloadButton.textContent = downloadLabel;
        preview.hidden = false;
        global.document.body.classList.add("mobileExportPreviewOpen");
        updateMobileExportPreviewImage();
        if (closeButton) closeButton.focus();
    }

    function changeMobileExportPreviewImage(delta) {
        if (!mobileExportPreviewState) return;

        mobileExportPreviewState.currentImageIndex = Math.min(
            mobileExportPreviewState.imageUrls.length - 1,
            Math.max(0, mobileExportPreviewState.currentImageIndex + delta)
        );
        updateMobileExportPreviewImage();
    }

    function changeMobileExportPreviewScale(delta) {
        if (!mobileExportPreviewState) return;

        mobileExportPreviewState.previewScale = Math.min(
            1.5,
            Math.max(0.5, Math.round((mobileExportPreviewState.previewScale + delta) * 10) / 10)
        );
        updateMobileExportPreviewImage({ resetScroll: false });
    }

    function downloadMobileExportPreview() {
        if (!mobileExportPreviewState) return;
        downloadBlob(mobileExportPreviewState.fileBlob, mobileExportPreviewState.downloadFilename);
    }

    function closeMobileExportPreview({ restoreFocus = true } = {}) {
        const preview = global.document.getElementById("mobileExportPreview");
        const image = global.document.getElementById("mobileExportPreviewImage");
        const previousState = mobileExportPreviewState;

        if (image) {
            image.removeAttribute("src");
            image.style.removeProperty("--mobile-export-preview-css-width");
        }
        if (preview) preview.hidden = true;
        global.document.body.classList.remove("mobileExportPreviewOpen");
        mobileExportPreviewState = null;

        if (!previousState) return;
        previousState.imageUrls.forEach((url) => global.URL.revokeObjectURL(url));
        if (restoreFocus
            && previousState.returnFocusElement
            && typeof previousState.returnFocusElement.focus === "function") {
            previousState.returnFocusElement.focus();
        }
    }

    function openDesktopExportPreviewWindow(title = "导出预览") {
        const previewWindow = global.open("", "_blank");
        if (!previewWindow) return null;
        previewWindow.opener = null;

        previewWindow.document.open();
        previewWindow.document.write(`<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width,initial-scale=1.0">
    <title>${title}</title>
    <style>
        *{box-sizing:border-box}
        body{margin:0;min-height:100vh;background:#f4f4f1;color:#1f1f1f;font-family:"Microsoft YaHei",Arial,sans-serif}
        .exportPreviewShell{min-height:100vh;padding:24px 32px 104px}
        .exportPreviewHeader{position:sticky;top:0;z-index:2;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:16px;margin:-24px -32px 24px;padding:16px 32px;border-bottom:1px solid rgba(0,0,0,.08);background:rgba(244,244,241,.92);backdrop-filter:blur(12px)}
        .exportPreviewTitle{font-size:16px;font-weight:700}
        .exportPreviewTools{display:flex;align-items:center;justify-content:flex-end;gap:14px}
        .exportPreviewMeta{font-size:13px;color:#666}
        .exportPreviewPager{display:flex;align-items:center;gap:10px;padding:4px;border:1px solid rgba(0,0,0,.1);border-radius:6px;background:rgba(255,255,255,.72)}
        .exportPreviewPager[hidden]{display:none}
        .exportPreviewPagerBtn{min-width:72px;height:28px;border:0;border-radius:4px;background:transparent;color:#222;font-size:13px;cursor:pointer}
        .exportPreviewPagerBtn:hover{background:rgba(0,0,0,.08)}
        .exportPreviewPagerBtn:disabled{color:#aaa;cursor:not-allowed}
        .exportPreviewPagerValue{min-width:72px;text-align:center;color:#333;font-size:13px;font-variant-numeric:tabular-nums}
        .exportPreviewZoom{display:flex;align-items:center;gap:8px;padding:4px;border:1px solid rgba(0,0,0,.1);border-radius:6px;background:rgba(255,255,255,.72)}
        .exportPreviewZoomBtn{width:28px;height:28px;border:0;border-radius:4px;background:transparent;color:#222;font-size:18px;line-height:1;cursor:pointer}
        .exportPreviewZoomBtn:hover{background:rgba(0,0,0,.08)}
        .exportPreviewZoomBtn:disabled{color:#aaa;cursor:not-allowed}
        .exportPreviewZoomValue{min-width:44px;text-align:center;color:#333;font-size:13px;font-variant-numeric:tabular-nums}
        .exportPreviewStage{display:flex;flex-direction:column;align-items:center;gap:22px}
        .exportPreviewImage{display:block;width:min(100%,calc(720px * var(--export-preview-zoom,1)));height:auto;box-shadow:0 12px 40px rgba(0,0,0,.18);background:#fff}
        .exportPreviewSlices{width:min(100%,calc(720px * var(--export-preview-zoom,1)));display:flex;flex-direction:column;gap:22px}
        .exportPreviewSlice{display:none;width:100%;height:auto;box-shadow:0 12px 40px rgba(0,0,0,.18);background:#fff}
        .exportPreviewSlice.active{display:block}
        .exportPreviewLoading{min-height:45vh;display:flex;align-items:center;justify-content:center;color:#666;font-size:15px}
        .exportPreviewDownload{position:fixed;right:28px;bottom:28px;z-index:5;border:0;border-radius:6px;padding:13px 18px;color:#fff;background:#1f1f1f;font-size:15px;font-weight:700;box-shadow:0 10px 28px rgba(0,0,0,.24);cursor:pointer}
        .exportPreviewDownload:hover{background:#000}
    </style>
</head>
<body>
    <div class="exportPreviewShell">
        <div class="exportPreviewHeader">
            <div class="exportPreviewTitle">${title}</div>
            <div class="exportPreviewPager" hidden aria-label="切图切换">
                <button class="exportPreviewPagerBtn" type="button" data-preview-prev>上一张</button>
                <span class="exportPreviewPagerValue" data-preview-page-value>1/1</span>
                <button class="exportPreviewPagerBtn" type="button" data-preview-next>下一张</button>
            </div>
            <div class="exportPreviewTools">
                <div class="exportPreviewMeta">正在生成预览...</div>
                <div class="exportPreviewZoom" aria-label="预览缩放">
                    <button class="exportPreviewZoomBtn" type="button" data-preview-zoom-out aria-label="缩小预览">-</button>
                    <span class="exportPreviewZoomValue" data-preview-zoom-value>100%</span>
                    <button class="exportPreviewZoomBtn" type="button" data-preview-zoom-in aria-label="放大预览">+</button>
                </div>
            </div>
        </div>
        <div class="exportPreviewLoading">正在生成预览...</div>
    </div>
</body>
</html>`);
        previewWindow.document.close();
        return previewWindow;
    }

    function showDesktopExportPreview(previewWindow, { title, fileBlob, downloadFilename, downloadLabel, images }) {
        if (!previewWindow || previewWindow.closed) {
            downloadBlob(fileBlob, downloadFilename);
            return;
        }

        const doc = previewWindow.document;
        const objectUrls = [];
        const downloadUrl = global.URL.createObjectURL(fileBlob);
        objectUrls.push(downloadUrl);
        const imageItems = images.map((image) => {
            const url = global.URL.createObjectURL(image.blob);
            objectUrls.push(url);
            return { ...image, url };
        });

        const stageHtml = imageItems.length === 1
            ? `<img class="exportPreviewImage" src="${imageItems[0].url}" alt="导出图片预览">`
            : `<div class="exportPreviewSlices">${imageItems.map((image, index) => `<img class="exportPreviewSlice${index === 0 ? " active" : ""}" src="${image.url}" alt="第 ${index + 1} 张切图预览">`).join("")}</div>`;

        doc.body.innerHTML = `
            <div class="exportPreviewShell">
                <div class="exportPreviewHeader">
                    <div class="exportPreviewTitle">${title}</div>
                    <div class="exportPreviewPager" ${imageItems.length > 1 ? "" : "hidden"} aria-label="切图切换">
                        <button class="exportPreviewPagerBtn" type="button" data-preview-prev>上一张</button>
                        <span class="exportPreviewPagerValue" data-preview-page-value>1/${imageItems.length}</span>
                        <button class="exportPreviewPagerBtn" type="button" data-preview-next>下一张</button>
                    </div>
                    <div class="exportPreviewTools">
                        <div class="exportPreviewMeta">${imageItems.length === 1 ? "1 张图片" : `${imageItems.length} 张切图`}</div>
                        <div class="exportPreviewZoom" aria-label="预览缩放">
                            <button class="exportPreviewZoomBtn" type="button" data-preview-zoom-out aria-label="缩小预览">-</button>
                            <span class="exportPreviewZoomValue" data-preview-zoom-value>100%</span>
                            <button class="exportPreviewZoomBtn" type="button" data-preview-zoom-in aria-label="放大预览">+</button>
                        </div>
                    </div>
                </div>
                <div class="exportPreviewStage">${stageHtml}</div>
                <button class="exportPreviewDownload" type="button">${downloadLabel}</button>
            </div>`;

        if (imageItems.length > 1) {
            let currentImageIndex = 0;
            const previousButton = doc.querySelector("[data-preview-prev]");
            const nextButton = doc.querySelector("[data-preview-next]");
            const pageValue = doc.querySelector("[data-preview-page-value]");
            const sliceImages = Array.from(doc.querySelectorAll(".exportPreviewSlice"));
            const updateCurrentPreviewImage = () => {
                sliceImages.forEach((image, index) => {
                    image.classList.toggle("active", index === currentImageIndex);
                });
                pageValue.textContent = `${currentImageIndex + 1}/${imageItems.length}`;
                previousButton.disabled = currentImageIndex <= 0;
                nextButton.disabled = currentImageIndex >= imageItems.length - 1;
                global.setTimeout(() => previewWindow.scrollTo({ top: 0, behavior: "smooth" }), 0);
            };
            previousButton.addEventListener("click", () => {
                currentImageIndex = Math.max(0, currentImageIndex - 1);
                updateCurrentPreviewImage();
            });
            nextButton.addEventListener("click", () => {
                currentImageIndex = Math.min(imageItems.length - 1, currentImageIndex + 1);
                updateCurrentPreviewImage();
            });
            updateCurrentPreviewImage();
        }

        let previewZoom = 1;
        const minPreviewZoom = 0.1;
        const maxPreviewZoom = 2;
        const zoomStep = 0.1;
        const zoomOutButton = doc.querySelector("[data-preview-zoom-out]");
        const zoomInButton = doc.querySelector("[data-preview-zoom-in]");
        const zoomValue = doc.querySelector("[data-preview-zoom-value]");
        const updatePreviewZoom = () => {
            const roundedZoom = Math.round(previewZoom * 10) / 10;
            previewZoom = Math.min(maxPreviewZoom, Math.max(minPreviewZoom, roundedZoom));
            doc.documentElement.style.setProperty("--export-preview-zoom", String(previewZoom));
            zoomValue.textContent = `${Math.round(previewZoom * 100)}%`;
            zoomOutButton.disabled = previewZoom <= minPreviewZoom;
            zoomInButton.disabled = previewZoom >= maxPreviewZoom;
        };
        zoomOutButton.addEventListener("click", () => {
            previewZoom -= zoomStep;
            updatePreviewZoom();
        });
        zoomInButton.addEventListener("click", () => {
            previewZoom += zoomStep;
            updatePreviewZoom();
        });
        updatePreviewZoom();

        const button = doc.querySelector(".exportPreviewDownload");
        button.addEventListener("click", () => {
            const link = doc.createElement("a");
            link.href = downloadUrl;
            link.download = downloadFilename;
            link.rel = "noopener";
            doc.body.appendChild(link);
            link.click();
            link.remove();
        });

        previewWindow.addEventListener("beforeunload", () => {
            objectUrls.forEach((url) => global.URL.revokeObjectURL(url));
        }, { once: true });
    }

    global.document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && mobileExportPreviewState) {
            closeMobileExportPreview();
        }
    });

    global.ArticleExportPreview = {
        changeMobileExportPreviewImage,
        changeMobileExportPreviewScale,
        closeMobileExportPreview,
        downloadBlob,
        downloadMobileExportPreview,
        isLikelyMobileBrowser,
        isVisibleElement,
        openDesktopExportPreviewWindow,
        shouldOpenDesktopExportPreview,
        showDesktopExportPreview,
        showMobileExportPreview
    };
})(window);
