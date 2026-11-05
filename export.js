/* ===========================
   Export
=========================== */

function preparePosterForExport(poster = document.getElementById("poster")) {
    const preview = document.getElementById("preview");

    if (!preview || !poster) return null;

    const isDesktopPoster = poster === document.getElementById("poster");
    const oldScrollTop = isDesktopPoster ? preview.scrollTop : 0;
    const previousWidth = poster.style.width;
    if (isDesktopPoster) {
        preview.scrollTop = 0;
        poster.style.width = poster.offsetWidth + "px";
    }

    return {
        preview,
        poster,
        oldScrollTop,
        previousWidth,
        isDesktopPoster
    };
}

function restorePosterAfterExport(exportState) {
    if (!exportState) return;

    exportState.poster.style.width = exportState.previousWidth;
    if (exportState.isDesktopPoster) {
        exportState.preview.scrollTop = exportState.oldScrollTop;
    }
}

async function capturePosterCanvas({ poster = document.getElementById("poster"), hideCopyright = false, scale = 3, beforeCapture = null, afterCapture = null, transparentPosterBackground = false, flushPending = true, captureY = null, captureHeight = null, expectedInkRanges = null } = {}) {
    if (flushPending) {
        await flushPendingPosterWork();
    }

    const exportState = preparePosterForExport(poster);
    if (!exportState) return Promise.reject(new Error("未找到预览区域，无法导出。"));

    try {
        if (document.fonts && document.fonts.ready) {
            await document.fonts.ready;
        }
        await waitForPosterImagesLoaded(exportState.poster);

        if (typeof beforeCapture === "function") {
            beforeCapture();
        }

        exportState.poster.dataset.captureTarget = "poster";
        const captureWidth = Math.max(
            1,
            Math.ceil(exportState.poster.scrollWidth || exportState.poster.offsetWidth || exportState.poster.getBoundingClientRect().width || 0)
        );
        const fullCaptureHeight = Math.max(
            1,
            Math.ceil(exportState.poster.scrollHeight || exportState.poster.offsetHeight || exportState.poster.getBoundingClientRect().height || 0)
        );
        const captureOptions = {
            backgroundColor: transparentPosterBackground ? null : backgroundColor,
            scale,
            width: captureWidth,
            height: fullCaptureHeight,
            windowWidth: Math.max(captureWidth, window.innerWidth || 0),
            windowHeight: Math.max(fullCaptureHeight, window.innerHeight || 0),
            useCORS: true,
            onclone: (clonedDoc) => {
                const clonedPoster = clonedDoc.querySelector('[data-capture-target="poster"]');
                if (clonedPoster) {
                    clonedPoster.setAttribute("lang", exportState.poster.getAttribute("lang") || getPosterLanguage());
                    const clonedPhoneRenderHost = clonedPoster.closest(".phoneRenderHost");
                    if (clonedPhoneRenderHost) {
                        clonedPhoneRenderHost.style.position = "absolute";
                        clonedPhoneRenderHost.style.left = "0";
                        clonedPhoneRenderHost.style.top = "0";
                        clonedPhoneRenderHost.style.zIndex = "0";
                        clonedPhoneRenderHost.style.visibility = "visible";
                        clonedPhoneRenderHost.style.opacity = "1";
                        clonedPhoneRenderHost.style.transform = "none";
                    }
                    clonedPoster.style.visibility = "visible";
                    clonedPoster.style.opacity = "1";
                    clonedPoster.style.transform = "none";
                    if (transparentPosterBackground) {
                        clonedPoster.style.backgroundColor = "transparent";
                        clonedPoster.style.backgroundImage = "none";
                        const clonedBackgroundCanvas = clonedPoster.querySelector(".posterBackgroundCanvas");
                        if (clonedBackgroundCanvas) {
                            clonedBackgroundCanvas.hidden = true;
                        }
                    }
                    clonedPoster.style.setProperty("--text-color", textColor);
                    clonedPoster.style.setProperty("--text-side-spacing", `${sideSpacing}px`);
                    clonedPoster.style.setProperty("--side-header-reserve", `${sideHeaderReserve}px`);
                    clonedPoster.style.setProperty("--card-title-spacing", `${paragraphTitleSpacing}px`);
                    clonedPoster.style.setProperty("--module-spacing", `${moduleSpacing}px`);
                    clonedPoster.classList.toggle("noTimeline", !showTimeline);
                    clonedPoster.classList.toggle("hideMonthTitles", !showMonthTitles);
                    clonedPoster.classList.toggle("hideMonthUnderlines", !showMonthUnderlines);
                    clonedPoster.classList.toggle("showParagraphDividers", showParagraphDividers);
                    clonedPoster.classList.toggle("hideSideHeader", !showSideHeader);
                    clonedPoster.classList.toggle("hideYearShadow", !showYearShadow);
                    clonedPoster.classList.toggle("subtitleVerticalLeft", subtitlePosition === "verticalLeft");
                }

                renderVerticalTextForExport(exportState.poster, clonedPoster, clonedDoc);

                if (hideCopyright) {
                    const copyright = getPosterPart(clonedPoster, "copyright");
                    if (copyright) {
                        copyright.style.visibility = "hidden";
                        copyright.style.marginTop = "0";
                        copyright.style.height = "0";
                        copyright.style.overflow = "hidden";
                    }
                }
            }
        };
        if (Number.isFinite(captureY)) {
            captureOptions.y = Math.max(0, captureY);
        }
        if (Number.isFinite(captureHeight)) {
            captureOptions.height = Math.max(1, captureHeight);
            captureOptions.windowHeight = Math.max(captureOptions.height, window.innerHeight || 0);
        }

        const canvas = await html2canvas(exportState.poster, captureOptions);
        const protectedRanges = expectedInkRanges == null ? getExpectedPosterInkRanges(canvas, exportState.poster) : expectedInkRanges;
        console.info("Poster capture result", {
            canvasWidth: canvas.width,
            canvasHeight: canvas.height,
            canvasPixels: canvas.width * canvas.height,
            posterWidth: exportState.poster.offsetWidth,
            posterHeight: exportState.poster.scrollHeight,
            scale,
            captureY: Number.isFinite(captureY) ? captureOptions.y : null,
            captureHeight: Number.isFinite(captureHeight) ? captureOptions.height : null,
            protectedRanges: protectedRanges.length,
            isPhoneRenderPoster: exportState.poster.classList.contains("phoneRenderPoster"),
            transparentPosterBackground
        });

        if (!canvasContainsExpectedPosterInk(canvas, exportState.poster, protectedRanges)) {
            console.warn("Poster capture ink validation failed", {
                canvasWidth: canvas.width,
                canvasHeight: canvas.height,
                canvasPixels: canvas.width * canvas.height,
                posterWidth: exportState.poster.offsetWidth,
                posterHeight: exportState.poster.scrollHeight,
                scale,
                captureY: Number.isFinite(captureY) ? captureOptions.y : null,
                captureHeight: Number.isFinite(captureHeight) ? captureOptions.height : null,
                protectedRanges: protectedRanges.length,
                firstProtectedRange: protectedRanges[0] || null,
                isPhoneRenderPoster: exportState.poster.classList.contains("phoneRenderPoster"),
                transparentPosterBackground
            });
            throw new Error("图片生成失败，请稍后再试。");
        }

        if (typeof afterCapture === "function") {
            afterCapture(canvas, exportState.poster);
        }

        return canvas;
    } finally {
        exportState.poster.removeAttribute("data-capture-target");
        restorePosterAfterExport(exportState);
    }
}

async function exportDesktopLayoutImage() {
    const restoreOverlay = showExportOverlay("正在导出...");

    try {
        await waitForNextPaint();
        const resolution = phoneResolutions[phoneResolution] || phoneResolutions["1080x2376"];
        const poster = document.getElementById("poster");
        const exportScale = getLongImageExportScale(poster, resolution);
        const sourceCanvas = await capturePosterCanvas({
            scale: exportScale,
            beforeCapture: () => showTypesettingOverlayNow("正在导出..."),
            hideCopyright: !showBottomWatermark,
            transparentPosterBackground: Boolean(backgroundImageDataUrl)
        });
        const posterStyle = window.getComputedStyle(document.getElementById("poster"));
        const canvas = await composeLongImageCanvas(sourceCanvas, posterStyle.backgroundColor || backgroundColor);
        const blob = await canvasToBlob(canvas, "image/jpeg", 1);
        window.ArticleExportPreview.downloadBlob(blob, "年度总结.jpg");
    } catch (error) {
        console.error("Long image export failed", error);
        window.alert((error && error.message) || "导出失败，请稍后再试。");
    } finally {
        restoreOverlay();
    }
}

async function exportImage() {
    const restoreOverlay = showExportOverlay("正在导出...");
    const shouldMobilePreview = window.ArticleExportPreview.isLikelyMobileBrowser();
    const shouldDesktopPreview = window.ArticleExportPreview.shouldOpenDesktopExportPreview("previewExportBtn");

    try {
        await waitForNextPaint();
        const resolution = phoneResolutions[phoneResolution] || phoneResolutions["1080x2376"];
        await flushPendingPosterWork();
        const phonePoster = await ensurePhoneRenderLayout();
        if (!phonePoster) {
            throw new Error("未找到手机排版区域，无法导出。");
        }

        const preferredScale = getPhoneExportScale(resolution);
        const exportScale = getLongImageExportScale(phonePoster, resolution, preferredScale);
        const sourceCanvas = await capturePosterCanvas({
            poster: phonePoster,
            scale: exportScale,
            flushPending: false,
            beforeCapture: () => showTypesettingOverlayNow("正在导出..."),
            hideCopyright: !showBottomWatermark,
            transparentPosterBackground: Boolean(backgroundImageDataUrl)
        });
        const posterStyle = window.getComputedStyle(phonePoster);
        const canvas = await composeLongImageCanvas(sourceCanvas, posterStyle.backgroundColor || backgroundColor);
        console.info("Long image export output", {
            sourceCanvasWidth: sourceCanvas.width,
            sourceCanvasHeight: sourceCanvas.height,
            finalCanvasWidth: canvas.width,
            finalCanvasHeight: canvas.height,
            finalCanvasPixels: canvas.width * canvas.height,
            phonePosterWidth: phonePoster.offsetWidth,
            phonePosterHeight: phonePoster.scrollHeight,
            exportScale
        });
        const blob = await canvasToBlob(canvas, "image/jpeg", 1);
        if (shouldMobilePreview) {
            window.ArticleExportPreview.showMobileExportPreview({
                title: "长图导出预览",
                fileBlob: blob,
                downloadFilename: "年度总结.jpg",
                downloadLabel: "下载 JPG",
                cssWidth: getPhoneExportCssWidth(resolution),
                images: [{ blob }]
            });
        } else if (shouldDesktopPreview) {
            const previewWindow = window.ArticleExportPreview.openDesktopExportPreviewWindow("长图导出预览");
            window.ArticleExportPreview.showDesktopExportPreview(previewWindow, {
                title: "长图导出预览",
                fileBlob: blob,
                downloadFilename: "年度总结.jpg",
                downloadLabel: "下载 JPG",
                images: [{ blob }]
            });
        } else {
            window.ArticleExportPreview.downloadBlob(blob, "年度总结.jpg");
        }
    } catch (error) {
        console.error("Long image export failed", error);
        window.alert((error && error.message) || "导出失败，请稍后再试。");
    } finally {
        restoreOverlay();
    }
}

function getWatermarkSettings(scale) {
    const copyright = document.getElementById("copyright");
    const poster = document.getElementById("poster");
    const copyrightStyle = copyright ? window.getComputedStyle(copyright) : null;
    const posterStyle = poster ? window.getComputedStyle(poster) : null;
    const fontSize = parseFloat((copyrightStyle && copyrightStyle.fontSize) || "13") * scale;
    const fontWeight = (copyrightStyle && copyrightStyle.fontWeight) || "600";
    const family = (copyrightStyle && copyrightStyle.fontFamily) || fontFamily;
    const lineHeightValue = parseFloat((copyrightStyle && copyrightStyle.lineHeight) || "");
    const lineHeight = Number.isFinite(lineHeightValue) ? lineHeightValue * scale : fontSize * 1.3;

    return {
        text: (copyright && copyright.innerText) || "制图：Behtnnrtop",
        color: (copyrightStyle && copyrightStyle.color) || "#b3bac3",
        font: `${fontWeight} ${fontSize}px ${family}`,
        lineHeight,
        background: (posterStyle && posterStyle.backgroundColor) || backgroundColor
    };
}

function drawCenteredWatermark(ctx, settings, width, contentHeight, bandHeight, { fillBackground = true } = {}) {
    if (fillBackground) {
        ctx.fillStyle = settings.background;
        ctx.fillRect(0, contentHeight, width, bandHeight);
    }
    ctx.fillStyle = settings.color;
    ctx.font = settings.font;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(settings.text, width / 2, contentHeight + bandHeight / 2);
}

function getWatermarkBandHeight(resolution, scale, watermarkSettings) {
    return Math.max(
        Math.round(resolution.height * scale * 0.032),
        Math.ceil(watermarkSettings.lineHeight + 36 * scale)
    );
}

function getExportTopPaddingHeight(resolution, scale) {
    return Math.round(topPadding * scale);
}

async function composeLongImageCanvas(sourceCanvas, background) {
    if (!backgroundImageDataUrl) return sourceCanvas;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = sourceCanvas.width;
    canvas.height = sourceCanvas.height;
    await window.articleBackgroundRenderer.drawCanvasBackground(ctx, canvas.width, canvas.height, background);
    ctx.drawImage(sourceCanvas, 0, 0);

    return canvas;
}

function canvasToBlob(canvas, type = "image/jpeg", quality = 0.95) {
    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (blob) {
                resolve(blob);
            } else {
                reject(new Error("图片生成失败。"));
            }
        }, type, quality);
    });
}

function getCanvasScale(sourceCanvas, poster = document.getElementById("poster")) {
    if (!poster) return 1;

    return sourceCanvas.width / (poster.offsetWidth || sourceCanvas.width);
}

function clampCanvasY(value, sourceCanvas) {
    return Math.min(Math.max(Math.round(value), 0), sourceCanvas.height);
}

function getElementCanvasBounds(element, sourceCanvas, padding = 0, poster = document.getElementById("poster")) {
    if (!poster || !element) return null;

    const scale = getCanvasScale(sourceCanvas, poster);
    const posterRect = poster.getBoundingClientRect();
    const rect = element.getBoundingClientRect();
    const top = clampCanvasY((rect.top - posterRect.top) * scale - padding, sourceCanvas);
    const bottom = clampCanvasY((rect.bottom - posterRect.top) * scale + padding, sourceCanvas);

    if (bottom <= top) return null;

    return { top, bottom };
}

function getElementCanvasColumns(element, sourceCanvas, padding = 0, poster = document.getElementById("poster")) {
    if (!poster || !element) return null;

    const scale = getCanvasScale(sourceCanvas, poster);
    const posterRect = poster.getBoundingClientRect();
    const rect = element.getBoundingClientRect();
    const left = Math.max(0, Math.floor((rect.left - posterRect.left) * scale - padding));
    const right = Math.min(sourceCanvas.width, Math.ceil((rect.right - posterRect.left) * scale + padding));

    if (right <= left) return null;

    return { left, right };
}

function getTextNodeCanvasRanges(element, sourceCanvas, padding, poster = document.getElementById("poster")) {
    if (!poster || !element) return [];

    const scale = getCanvasScale(sourceCanvas, poster);
    const posterRect = poster.getBoundingClientRect();
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    const ranges = [];
    let node = walker.nextNode();

    while (node) {
        if (node.textContent.trim()) {
            const range = document.createRange();
            range.selectNodeContents(node);

            Array.from(range.getClientRects()).forEach((rect) => {
                const top = clampCanvasY((rect.top - posterRect.top) * scale - padding, sourceCanvas);
                const bottom = clampCanvasY((rect.bottom - posterRect.top) * scale + padding, sourceCanvas);

                if (bottom > top) {
                    ranges.push({ top, bottom });
                }
            });

            range.detach();
        }

        node = walker.nextNode();
    }

    return ranges;
}

function getElementCanvasRanges(elements, sourceCanvas, padding, poster = document.getElementById("poster")) {
    if (!poster || !sourceCanvas) return [];

    const scale = getCanvasScale(sourceCanvas, poster);
    const posterRect = poster.getBoundingClientRect();

    return Array.from(elements || [])
        .filter((element) => {
            const style = window.getComputedStyle(element);
            return style.display !== "none" && style.visibility !== "hidden";
        })
        .map((element) => element.getBoundingClientRect())
        .filter((rect) => rect.width > 0 && rect.height > 0)
        .map((rect) => ({
            top: clampCanvasY((rect.top - posterRect.top) * scale - padding, sourceCanvas),
            bottom: clampCanvasY((rect.bottom - posterRect.top) * scale + padding, sourceCanvas)
        }))
        .filter((range) => range.bottom > range.top);
}

function mergeCanvasRanges(ranges) {
    return ranges
        .filter((range) => range.bottom > range.top)
        .sort((a, b) => a.top - b.top)
        .reduce((merged, range) => {
            const last = merged[merged.length - 1];

            if (!last || range.top > last.bottom) {
                merged.push({ ...range });
            } else {
                last.bottom = Math.max(last.bottom, range.bottom);
            }

            return merged;
        }, []);
}

function getProtectedTextRanges(sourceCanvas, poster = document.getElementById("poster"), { textPadding = null, preferGeneratedLines = true } = {}) {
    const scale = getCanvasScale(sourceCanvas, poster);
    const resolvedTextPadding = textPadding == null ? Math.max(4, Math.round(8 * scale)) : textPadding;
    const lineRanges = preferGeneratedLines
        ? getElementCanvasRanges(
            Array.from((poster && poster.querySelectorAll(".typesetLine, .verticalTextLine")) || [])
                .filter((element) => element.textContent.trim()),
            sourceCanvas,
            resolvedTextPadding,
            poster
        )
        : [];
    const textSelectors = [".posterYear", ".posterSubtitle", ".cardTitle", ".info"];

    const ranges = textSelectors.flatMap((selector) =>
        Array.from((poster && poster.querySelectorAll(selector)) || [])
            .filter((element) => window.getComputedStyle(element).display !== "none")
            .flatMap((element) => {
                const elementRange = getElementCanvasRanges([element], sourceCanvas, 0, poster)[0];
                const generatedLineRanges = elementRange
                    ? lineRanges.filter((range) => range.bottom > elementRange.top && range.top < elementRange.bottom)
                    : [];

                if (generatedLineRanges.length) {
                    return generatedLineRanges;
                }

                const textRanges = getTextNodeCanvasRanges(element, sourceCanvas, resolvedTextPadding, poster);
                return textRanges;
            })
    );

    return ranges
        .filter((range) => range.bottom > range.top)
        .sort((a, b) => a.top - b.top);
}

function getGeneratedLineContentRanges(sourceCanvas, poster = document.getElementById("poster"), padding = 0) {
    const lineElements = Array.from((poster && poster.querySelectorAll(".typesetLineInner, .verticalTextLine")) || [])
        .filter((element) => element.textContent.trim());
    const lineGroupIds = new Map();
    const lineGroupIndexes = new Map();
    const lineRanges = lineElements.flatMap((element) => {
        const range = getElementCanvasRanges([element], sourceCanvas, padding, poster)[0];
        if (!range) return [];

        const lineGroup = element.closest(".typesetText") || element.parentElement;
        if (!lineGroupIds.has(lineGroup)) {
            lineGroupIds.set(lineGroup, lineGroupIds.size + 1);
            lineGroupIndexes.set(lineGroup, 0);
        }
        const lineIndex = lineGroupIndexes.get(lineGroup) || 0;
        lineGroupIndexes.set(lineGroup, lineIndex + 1);

        return [{
            ...range,
            generatedLineGroup: lineGroupIds.get(lineGroup),
            generatedLineIndex: lineIndex,
            isHorizontalGeneratedLine: element.classList.contains("typesetLineInner")
        }];
    });

    if (lineRanges.length) return lineRanges;

    return getProtectedTextRanges(sourceCanvas, poster, {
        textPadding: padding,
        preferGeneratedLines: false
    });
}

function getProtectedImageElements(poster = document.getElementById("poster")) {
    const elements = new Set();

    Array.from((poster && poster.querySelectorAll(".cardImage")) || [])
        .filter((element) => element.complete && element.naturalWidth > 0)
        .forEach((element) => {
            elements.add(element.closest(".cardImageWrap") || element);
        });

    return Array.from(elements);
}

function getProtectedImageRanges(sourceCanvas, poster = document.getElementById("poster"), { padding = 0, contentSliceHeight = null } = {}) {
    const ranges = getElementCanvasRanges(
        getProtectedImageElements(poster),
        sourceCanvas,
        padding,
        poster
    );

    return ranges.map((range) => ({
        ...range,
        type: "image",
        canSplit: Number.isFinite(contentSliceHeight) && range.bottom - range.top > contentSliceHeight
    }));
}

function getProtectedDividerRanges(sourceCanvas, poster = document.getElementById("poster")) {
    const scale = getCanvasScale(sourceCanvas, poster);
    const padding = Math.max(2, Math.round(3 * scale));

    return getElementCanvasRanges(
        (poster && poster.querySelectorAll(".paragraphDivider, .cardTitleUnderline")) || [],
        sourceCanvas,
        padding,
        poster
    );
}

function getExpectedPosterInkRanges(sourceCanvas, poster = document.getElementById("poster")) {
    return [
        ...getProtectedTextRanges(sourceCanvas, poster),
        ...getProtectedDividerRanges(sourceCanvas, poster),
        ...getProtectedImageRanges(sourceCanvas, poster)
    ].sort((a, b) => a.top - b.top);
}

function getSlicedExportContentBottom(sourceCanvas, poster = document.getElementById("poster")) {
    if (!(sourceCanvas && sourceCanvas.height) || !poster) return (sourceCanvas && sourceCanvas.height) || 1;

    const selectors = [".posterYear", ".posterSubtitle", ".posterSide", ".card", ".paragraphDivider"];
    const posterRect = poster.getBoundingClientRect();
    const scale = getCanvasScale(sourceCanvas, poster);
    const visibleBottoms = selectors.flatMap((selector) =>
        Array.from(poster.querySelectorAll(selector))
            .filter((element) => {
                const style = window.getComputedStyle(element);
                return style.display !== "none" && style.visibility !== "hidden";
            })
            .map((element) => element.getBoundingClientRect())
            .filter((rect) => rect.width > 0 && rect.height > 0)
            .map((rect) => clampCanvasY((rect.bottom - posterRect.top) * scale, sourceCanvas))
    );
    const contentBottom = Math.max(...visibleBottoms, 0);

    if (contentBottom <= 0) return sourceCanvas.height;

    return Math.max(1, Math.min(sourceCanvas.height, Math.ceil(contentBottom)));
}

function isProtectedCutY(y, ranges) {
    return ranges.some((range) => y >= range.top && y <= range.bottom);
}

function isProtectedCutBand(y, ranges, clearance) {
    return ranges.some((range) => y + clearance >= range.top && y - clearance <= range.bottom);
}

function getCanvasPixelDistance(a, b) {
    return Math.abs(a[0] - b[0])
        + Math.abs(a[1] - b[1])
        + Math.abs(a[2] - b[2])
        + Math.abs((a[3] == null ? 255 : a[3]) - (b[3] == null ? 255 : b[3]));
}

function mergeCanvasColumns(columns) {
    return columns
        .filter((column) => column.right > column.left)
        .sort((a, b) => a.left - b.left)
        .reduce((merged, column) => {
            const last = merged[merged.length - 1];

            if (!last || column.left > last.right) {
                merged.push({ ...column });
            } else {
                last.right = Math.max(last.right, column.right);
            }

            return merged;
        }, []);
}

function getTextScanColumns(sourceCanvas, poster = document.getElementById("poster")) {
    const scale = getCanvasScale(sourceCanvas, poster);
    const padding = Math.max(3, Math.round(6 * scale));
    const selectors = [".posterYear", ".posterSubtitle", ".cardTitle", ".info", ".cardImageWrap"];
    const columns = selectors.flatMap((selector) =>
        Array.from((poster && poster.querySelectorAll(selector)) || [])
            .filter((element) => window.getComputedStyle(element).display !== "none")
            .map((element) => getElementCanvasColumns(element, sourceCanvas, padding, poster))
            .filter(Boolean)
    );

    return mergeCanvasColumns(columns.length ? columns : [{ left: 0, right: sourceCanvas.width }]);
}

function getCanvasBackgroundSample(sourceCanvas, ctx) {
    const points = [
        [0, 0],
        [sourceCanvas.width - 1, 0],
        [0, sourceCanvas.height - 1],
        [sourceCanvas.width - 1, sourceCanvas.height - 1]
    ];
    const samples = [];

    points.forEach(([x, y]) => {
        try {
            const pixel = ctx.getImageData(x, y, 1, 1).data;
            samples.push([pixel[0], pixel[1], pixel[2], pixel[3]]);
        } catch (error) {
            // Canvas may be tainted by a remote asset; fall back to DOM-only cut checks.
        }
    });

    if (!samples.length) return null;

    const sortedSamples = samples
        .sort((a, b) => (
            samples.filter((sample) => getCanvasPixelDistance(sample, a) < 18).length
            - samples.filter((sample) => getCanvasPixelDistance(sample, b) < 18).length
        ));
    return sortedSamples[sortedSamples.length - 1];
}

function createCanvasInkDetector(sourceCanvas, poster = document.getElementById("poster"), { precomputeRows = false } = {}) {
    const ctx = sourceCanvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;

    const background = getCanvasBackgroundSample(sourceCanvas, ctx);
    if (!background) return null;

    const scanColumns = getTextScanColumns(sourceCanvas, poster);
    const scannedWidth = scanColumns.reduce((total, column) => total + column.right - column.left, 0);
    const minInkPixels = Math.max(1, Math.round(scannedWidth * 0.0006));
    const colorThreshold = 10;

    if (precomputeRows) {
        const rowInkCounts = new Uint16Array(sourceCanvas.height);
        const rowChunkHeight = 512;

        try {
            for (const column of scanColumns) {
                const width = column.right - column.left;

                for (let chunkTop = 0; chunkTop < sourceCanvas.height; chunkTop += rowChunkHeight) {
                    const chunkHeight = Math.min(rowChunkHeight, sourceCanvas.height - chunkTop);
                    const imageData = ctx.getImageData(column.left, chunkTop, width, chunkHeight).data;

                    for (let row = 0; row < chunkHeight; row += 1) {
                        const globalRow = chunkTop + row;
                        if (rowInkCounts[globalRow] >= minInkPixels) continue;

                        const rowOffset = row * width * 4;
                        for (let index = rowOffset; index < rowOffset + width * 4; index += 4) {
                            const alpha = imageData[index + 3];
                            if (alpha < 12) continue;

                            const pixel = [imageData[index], imageData[index + 1], imageData[index + 2], alpha];
                            if (getCanvasPixelDistance(pixel, background) > colorThreshold) {
                                rowInkCounts[globalRow] += 1;
                                if (rowInkCounts[globalRow] >= minInkPixels) break;
                            }
                        }
                    }
                }
            }
        } catch (error) {
            console.warn("Sliced export ink pre-scan failed; falling back to DOM cut protection.", error);
            return null;
        }

        return function hasInkAtRow(y) {
            const rowY = Math.min(Math.max(Math.round(y), 0), sourceCanvas.height - 1);
            return rowInkCounts[rowY] >= minInkPixels;
        };
    }

    const rowCache = new Map();

    return function hasInkAtRow(y) {
        const rowY = Math.min(Math.max(Math.round(y), 0), sourceCanvas.height - 1);
        if (rowCache.has(rowY)) return rowCache.get(rowY);

        try {
            let inkPixels = 0;

            for (const column of scanColumns) {
                const width = column.right - column.left;
                const data = ctx.getImageData(column.left, rowY, width, 1).data;

                for (let index = 0; index < data.length; index += 4) {
                    const alpha = data[index + 3];
                    if (alpha < 12) continue;

                    const pixel = [data[index], data[index + 1], data[index + 2], alpha];
                    if (getCanvasPixelDistance(pixel, background) > colorThreshold) {
                        inkPixels += 1;
                        if (inkPixels >= minInkPixels) {
                            rowCache.set(rowY, true);
                            return true;
                        }
                    }
                }
            }
        } catch (error) {
            rowCache.set(rowY, false);
            return false;
        }

        rowCache.set(rowY, false);
        return false;
    };
}

function canvasContainsExpectedPosterInk(sourceCanvas, poster = document.getElementById("poster"), expectedRanges = null) {
    if (!(sourceCanvas && sourceCanvas.width) || !sourceCanvas.height || !poster) return false;

    const protectedRanges = expectedRanges == null ? getExpectedPosterInkRanges(sourceCanvas, poster) : expectedRanges;
    if (!protectedRanges.length) {
        return true;
    }

    const hasInkAtRow = createCanvasInkDetector(sourceCanvas, poster);
    if (!hasInkAtRow) {
        return true;
    }

    return protectedRanges.some((range) => {
        const top = Math.max(0, Math.floor(range.top));
        const bottom = Math.min(sourceCanvas.height - 1, Math.ceil(range.bottom));

        for (let y = top; y <= bottom; y += 1) {
            if (hasInkAtRow(y)) return true;
        }

        return false;
    });
}

function isCanvasInkCutBand(y, hasInkAtRow, clearance) {
    if (!hasInkAtRow) return false;

    for (let row = y - clearance; row <= y + clearance; row += 1) {
        if (hasInkAtRow(row)) {
            return true;
        }
    }

    return false;
}

function isSafeBlankCutBand(y, protectedRanges, hasInkAtRow, clearance) {
    if (isProtectedCutBand(y, protectedRanges, clearance)) {
        return false;
    }

    return !isCanvasInkCutBand(y, hasInkAtRow, clearance);
}

function getCutBacktrackLimit(scale, maxContentHeight) {
    return Math.max(
        Math.round(72 * scale),
        Math.min(Math.round(240 * scale), Math.round(maxContentHeight * 0.18))
    );
}

function findNearestSafeCutY(idealCutY, minCutY, protectedRanges, hasInkAtRow, clearance, maxBacktrack) {
    const lowestCutY = Math.max(minCutY, Math.floor(idealCutY - maxBacktrack));

    for (let y = Math.floor(idealCutY); y >= lowestCutY; y -= 1) {
        if (isSafeBlankCutBand(y, protectedRanges, hasInkAtRow, clearance)) {
            return y;
        }
    }

    return null;
}

function findNearestCanvasCleanCutY(idealCutY, minCutY, hasInkAtRow, clearance, maxBacktrack) {
    if (!hasInkAtRow) return null;

    const lowestCutY = Math.max(minCutY, Math.floor(idealCutY - maxBacktrack));
    for (let y = Math.floor(idealCutY); y >= lowestCutY; y -= 1) {
        if (!isCanvasInkCutBand(y, hasInkAtRow, clearance)) {
            return y;
        }
    }

    return null;
}

function findLatestLineBoundaryCutY(idealCutY, minCutY, protectedRanges, clearance) {
    if (!Array.isArray(protectedRanges) || !protectedRanges.length) return null;

    const cutCeiling = Math.floor(idealCutY);
    const ranges = protectedRanges
        .filter((range) => range.bottom > range.top)
        .sort((a, b) => a.top - b.top);

    const candidates = [];

    for (let index = ranges.length - 1; index >= 0; index -= 1) {
        const range = ranges[index];
        const candidate = Math.floor(range.bottom) + Math.max(1, clearance);

        if (candidate > cutCeiling || candidate <= minCutY) continue;

        const nextRange = ranges[index + 1];
        if (nextRange && candidate + clearance >= nextRange.top) continue;
        if (isProtectedCutBand(candidate, ranges, clearance)) continue;

        candidates.push(candidate);
    }

    const horizontalLineGroups = new Map();
    ranges
        .filter((range) => range.isHorizontalGeneratedLine && Number.isFinite(range.generatedLineGroup))
        .forEach((range) => {
            if (!horizontalLineGroups.has(range.generatedLineGroup)) {
                horizontalLineGroups.set(range.generatedLineGroup, []);
            }
            horizontalLineGroups.get(range.generatedLineGroup).push(range);
        });

    horizontalLineGroups.forEach((groupRanges) => {
        groupRanges
            .sort((a, b) => a.generatedLineIndex - b.generatedLineIndex)
            .forEach((range, index) => {
                const nextRange = groupRanges[index + 1];
                if (!nextRange) return;

                const currentCenter = (range.top + range.bottom) / 2;
                const nextCenter = (nextRange.top + nextRange.bottom) / 2;
                if (nextCenter <= currentCenter) return;

                const candidate = Math.floor((currentCenter + nextCenter) / 2);
                if (candidate > cutCeiling || candidate <= minCutY) return;

                const crossesOtherProtectedContent = ranges.some((otherRange) => {
                    const isAdjacentLine = otherRange === range || otherRange === nextRange;
                    return !isAdjacentLine
                        && candidate >= otherRange.top
                        && candidate <= otherRange.bottom;
                });
                if (!crossesOtherProtectedContent) {
                    candidates.push(candidate);
                }
            });
    });

    return candidates.length ? Math.max(...candidates) : null;
}

function enforceCanvasCleanCutHeight(candidateHeight, sourceY, maxContentHeight, hasInkAtRow, scale, options = {}) {
    if (!hasInkAtRow) return candidateHeight;

    const cutY = sourceY + candidateHeight;
    const clearance = Number.isFinite(options.clearance)
        ? Math.max(0, Math.round(options.clearance))
        : Math.max(8, Math.round(14 * scale));
    if (!isCanvasInkCutBand(cutY, hasInkAtRow, clearance)) {
        return candidateHeight;
    }

    const minCutY = sourceY + Math.max(1, Math.round(12 * scale));
    const cleanCutY = findNearestCanvasCleanCutY(
        cutY,
        minCutY,
        hasInkAtRow,
        clearance,
        getCutBacktrackLimit(scale, maxContentHeight)
    );

    return cleanCutY === null ? candidateHeight : Math.max(1, cleanCutY - sourceY);
}

function getBestSafeCutCandidate(candidates, sourceY, maxContentHeight, hasInkAtRow, scale) {
    let bestCandidate = null;

    candidates
        .filter((candidate) => candidate && Number.isFinite(candidate.cutY))
        .forEach((candidate) => {
            const requestedHeight = Math.max(1, candidate.cutY - sourceY);
            const enforcedHeight = candidate.skipCanvasEnforcement
                ? requestedHeight
                : enforceCanvasCleanCutHeight(
                    requestedHeight,
                    sourceY,
                    maxContentHeight,
                    hasInkAtRow,
                    scale,
                    { clearance: candidate.canvasClearance }
                );

            if (enforcedHeight <= 0 || enforcedHeight > maxContentHeight) return;

            const enforcedCutY = sourceY + enforcedHeight;
            const normalizedCandidate = {
                ...candidate,
                cutY: enforcedCutY,
                height: enforcedHeight
            };

            if (!bestCandidate || normalizedCandidate.cutY > bestCandidate.cutY) {
                bestCandidate = normalizedCandidate;
            }
        });

    return bestCandidate;
}

function getLineBoundaryFallbackCutY(idealCutY, minCutY, protectedRanges, clearance, maxBacktrack) {
    const cutY = Math.floor(idealCutY);
    const blockingRanges = protectedRanges.filter((range) => cutY + clearance > range.top && cutY - clearance < range.bottom);

    if (!blockingRanges.length) return null;

    let fallbackCutY = Math.floor(Math.min(...blockingRanges.map((range) => range.top)) - clearance);
    let previousCutY = null;

    while (fallbackCutY > minCutY && fallbackCutY !== previousCutY) {
        const adjacentRanges = protectedRanges.filter((range) =>
            fallbackCutY + clearance > range.top && fallbackCutY - clearance < range.bottom
        );

        if (!adjacentRanges.length) break;

        previousCutY = fallbackCutY;
        fallbackCutY = Math.floor(Math.min(...adjacentRanges.map((range) => range.top)) - clearance);
    }

    if (
        fallbackCutY > minCutY
        && idealCutY - fallbackCutY <= maxBacktrack
        && !isProtectedCutBand(fallbackCutY, protectedRanges, clearance)
    ) {
        return fallbackCutY;
    }

    return null;
}

function getImageStartCutHeight(sourceY, minCutY, blockingImage, clearance) {
    if (!blockingImage) return null;

    if (blockingImage.top > sourceY) {
        return Math.max(1, Math.floor(blockingImage.top) - sourceY);
    }

    const imageStartCutY = Math.floor(blockingImage.top - clearance);

    if (imageStartCutY > minCutY) {
        return Math.max(1, imageStartCutY - sourceY);
    }

    return null;
}

function getSafeContentSliceHeight(sourceCanvas, sourceY, maxContentHeight, protectedRanges, hasInkAtRow, poster = document.getElementById("poster"), { allowEndCut = true, fallbackProtectedRanges = null, tightFallbackProtectedRanges = null, imageRanges = [] } = {}) {
    const remainingHeight = sourceCanvas.height - sourceY;
    if (remainingHeight <= maxContentHeight && allowEndCut) return remainingHeight;

    const scale = getCanvasScale(sourceCanvas, poster);
    const idealCutY = sourceY + maxContentHeight;
    const minCutY = sourceY + Math.max(1, Math.round(12 * scale));
    const clearance = Math.max(6, Math.round(10 * scale));
    const maxBacktrack = getCutBacktrackLimit(scale, maxContentHeight);
    const blockingImage = imageRanges.find((range) =>
        range.top > sourceY + clearance
        && range.top < idealCutY
        && range.bottom > idealCutY
        && !range.canSplit
    );

    if (blockingImage) {
        const imageStartCutHeight = getImageStartCutHeight(sourceY, minCutY, blockingImage, clearance);
        if (imageStartCutHeight !== null) return imageStartCutHeight;
    }

    const continuingTallImage = imageRanges.find((range) =>
        range.canSplit
        && sourceY >= range.top - clearance
        && sourceY < range.bottom - clearance
    );

    if (continuingTallImage) {
        return Math.min(maxContentHeight, remainingHeight);
    }

    const safeCutY = findNearestSafeCutY(idealCutY, minCutY, protectedRanges, hasInkAtRow, clearance, maxBacktrack);

    const unsplittableImageRanges = imageRanges.filter((range) => !range.canSplit);
    const tightFallbackCutRanges = tightFallbackProtectedRanges
        ? [
            ...tightFallbackProtectedRanges,
            ...unsplittableImageRanges
        ].sort((a, b) => a.top - b.top)
        : null;
    const fallbackCutRanges = [
        ...(fallbackProtectedRanges || protectedRanges),
        ...unsplittableImageRanges
    ].sort((a, b) => a.top - b.top);

    const tightTextSafeCutY = tightFallbackCutRanges
        ? findNearestSafeCutY(
            idealCutY,
            minCutY,
            tightFallbackCutRanges,
            null,
            0,
            maxBacktrack
        )
        : null;
    const tightLineBoundaryCutY = tightFallbackCutRanges
        ? findLatestLineBoundaryCutY(
            idealCutY,
            minCutY,
            tightFallbackCutRanges,
            0
        )
        : null;
    const textSafeCutY = findNearestSafeCutY(
        idealCutY,
        minCutY,
        fallbackCutRanges,
        null,
        0,
        maxBacktrack
    );

    const bestCutCandidate = getBestSafeCutCandidate(
        [
            safeCutY === null ? null : {
                reason: "conservative-safe-band",
                cutY: safeCutY,
                skipCanvasEnforcement: true
            },
            tightTextSafeCutY === null ? null : {
                reason: "tight-generated-line-band",
                cutY: tightTextSafeCutY
            },
            tightLineBoundaryCutY === null ? null : {
                reason: "latest-generated-line-boundary",
                cutY: tightLineBoundaryCutY,
                canvasClearance: Math.max(1, Math.round(scale))
            },
            textSafeCutY === null ? null : {
                reason: "zero-padding-generated-line-band",
                cutY: textSafeCutY
            }
        ],
        sourceY,
        maxContentHeight,
        hasInkAtRow,
        scale
    );

    if (bestCutCandidate) {
        console.info("Sliced export cut decision", {
            reason: bestCutCandidate.reason,
            sourceY,
            idealCutY,
            selectedCutY: bestCutCandidate.cutY,
            selectedHeight: bestCutCandidate.height,
            safeCutY,
            tightTextSafeCutY,
            tightLineBoundaryCutY,
            textSafeCutY,
            maxContentHeight
        });
        return bestCutCandidate.height;
    }

    const fallbackCutY = getLineBoundaryFallbackCutY(idealCutY, minCutY, protectedRanges, clearance, maxBacktrack);

    if (fallbackCutY !== null) {
        return enforceCanvasCleanCutHeight(
            Math.max(1, fallbackCutY - sourceY),
            sourceY,
            maxContentHeight,
            hasInkAtRow,
            scale
        );
    }

    const blockingFallbackImage = unsplittableImageRanges.find((range) =>
        range.top > sourceY
        && range.top < idealCutY
        && range.bottom >= idealCutY
    );
    const fallbackImageStartCutHeight = getImageStartCutHeight(
        sourceY,
        minCutY,
        blockingFallbackImage,
        clearance
    );
    if (fallbackImageStartCutHeight !== null) return fallbackImageStartCutHeight;

    return enforceCanvasCleanCutHeight(
        maxContentHeight,
        sourceY,
        maxContentHeight,
        hasInkAtRow,
        scale
    );
}

const DESKTOP_SLICED_EXPORT_JPEG_QUALITY = 0.94;
const MOBILE_SLICED_EXPORT_JPEG_QUALITY = 0.82;
const DESKTOP_SLICED_CAPTURE_WINDOW_PIXEL_LIMIT = 60 * 1000 * 1000;
const MOBILE_SLICED_CAPTURE_WINDOW_PIXEL_LIMIT = 24 * 1000 * 1000;
const SLICED_CAPTURE_MAX_WINDOW_SLICES = 40;

function getSlicedCaptureWindowSlices(posterWidth, exportScale, contentSliceHeight) {
    const pixelLimit = window.ArticleExportPreview.isLikelyMobileBrowser()
        ? MOBILE_SLICED_CAPTURE_WINDOW_PIXEL_LIMIT
        : DESKTOP_SLICED_CAPTURE_WINDOW_PIXEL_LIMIT;
    const captureWidth = Math.max(1, Math.round(posterWidth * exportScale));
    const maxCaptureHeight = Math.max(1, Math.floor(pixelLimit / captureWidth));
    const slicesByPixelLimit = Math.floor(maxCaptureHeight / Math.max(1, contentSliceHeight));
    const windowSlices = Math.max(1, Math.min(SLICED_CAPTURE_MAX_WINDOW_SLICES, slicesByPixelLimit));

    console.info("Sliced export capture window", {
        windowSlices,
        maxWindowSlices: SLICED_CAPTURE_MAX_WINDOW_SLICES,
        captureWidth,
        contentSliceHeight,
        maxCaptureHeight,
        pixelLimit
    });

    return windowSlices;
}

async function addSliceToZip(zip, sourceCanvas, sourceY, sourceHeight, index, topPaddingHeight, watermarkBandHeight, watermarkSettings, outputHeight = null, shouldDrawWatermark = true, jpegQuality = DESKTOP_SLICED_EXPORT_JPEG_QUALITY) {
    const sliceOutputHeight = outputHeight == null ? topPaddingHeight + sourceHeight + watermarkBandHeight : outputHeight;
    const watermarkTop = sliceOutputHeight - watermarkBandHeight;
    const sliceCanvas = document.createElement("canvas");
    const ctx = sliceCanvas.getContext("2d");

    sliceCanvas.width = sourceCanvas.width;
    sliceCanvas.height = sliceOutputHeight;
    await window.articleBackgroundRenderer.drawCanvasBackground(ctx, sliceCanvas.width, sliceCanvas.height);
    ctx.drawImage(
        sourceCanvas,
        0,
        sourceY,
        sourceCanvas.width,
        sourceHeight,
        0,
        topPaddingHeight,
        sourceCanvas.width,
        sourceHeight
    );
    if (shouldDrawWatermark && watermarkBandHeight > 0) {
        drawCenteredWatermark(
            ctx,
            watermarkSettings,
            sliceCanvas.width,
            watermarkTop,
            watermarkBandHeight,
            { fillBackground: !backgroundImageDataUrl }
        );
    }

    const blob = await canvasToBlob(sliceCanvas, "image/jpeg", jpegQuality);
    const filename = `年度总结-${String(index).padStart(2, "0")}.jpg`;
    zip.file(filename, blob, { compression: "STORE" });
    return { filename, blob };
}

function setButtonBusy(button, busyText) {
    if (!button) return () => {};

    const oldText = button.innerText;
    const oldDisabled = button.disabled;
    button.disabled = true;
    if (typeof busyText === "string") {
        button.innerText = busyText;
    }

    return () => {
        button.disabled = oldDisabled;
        button.innerText = oldText;
    };
}

function getActiveExportButton(primaryId, fallbackId) {
    const primaryButton = document.getElementById(primaryId);
    if (window.ArticleExportPreview.isVisibleElement(primaryButton)) return primaryButton;

    return document.getElementById(fallbackId);
}

function getCroppedProtectedRanges(protectedRanges, cropY, cropHeight) {
    const cropBottom = cropY + cropHeight;

    return protectedRanges
        .filter((range) => range.bottom > cropY && range.top < cropBottom)
        .map((range) => ({
            ...range,
            top: Math.max(0, range.top - cropY),
            bottom: Math.min(cropHeight, range.bottom - cropY)
        }));
}

async function captureSlicedExportWindow({
    phonePoster,
    exportScale,
    sourceY,
    captureHeight,
    protectedRanges,
    expectedInkRanges,
    imageRanges,
    fallbackProtectedRanges,
    tightFallbackProtectedRanges,
    maxWindowSlices,
    contentSliceHeight,
    showOverlayBeforeCapture
}) {
    let lastError = null;

    for (let windowSlices = maxWindowSlices; windowSlices >= 1; windowSlices -= 1) {
        const requestedCaptureHeight = Math.min(captureHeight, contentSliceHeight * windowSlices);
        const localProtectedRanges = getCroppedProtectedRanges(
            protectedRanges,
            sourceY,
            requestedCaptureHeight
        );
        const localExpectedInkRanges = getCroppedProtectedRanges(
            expectedInkRanges,
            sourceY,
            requestedCaptureHeight
        );
        const localImageRanges = getCroppedProtectedRanges(
            imageRanges,
            sourceY,
            requestedCaptureHeight
        );

        try {
            const captureOptions = {
                poster: phonePoster,
                hideCopyright: true,
                scale: exportScale,
                flushPending: false,
                beforeCapture: showOverlayBeforeCapture,
                transparentPosterBackground: Boolean(backgroundImageDataUrl),
                captureY: sourceY / exportScale,
                captureHeight: requestedCaptureHeight / exportScale,
                expectedInkRanges: localExpectedInkRanges
            };
            const sourceCanvas = await capturePosterCanvas(captureOptions);
            const capturedHeight = Math.min(requestedCaptureHeight, sourceCanvas.height);
            if (capturedHeight <= 0) {
                throw new Error("图片生成失败，请稍后再试。");
            }

            return {
                sourceCanvas,
                capturedHeight,
                protectedRanges: getCroppedProtectedRanges(protectedRanges, sourceY, capturedHeight),
                imageRanges: getCroppedProtectedRanges(imageRanges, sourceY, capturedHeight),
                fallbackProtectedRanges: getCroppedProtectedRanges(fallbackProtectedRanges, sourceY, capturedHeight),
                tightFallbackProtectedRanges: getCroppedProtectedRanges(tightFallbackProtectedRanges, sourceY, capturedHeight),
                windowSlices,
                captureEngine: "html2canvas"
            };
        } catch (error) {
            lastError = error;
            console.warn("Sliced export window capture failed, retrying with a smaller window.", {
                captureEngine: "html2canvas",
                windowSlices,
                error
            });
        }
    }

    throw lastError || new Error("图片生成失败，请稍后再试。");
}

async function addWindowedSlicedPosterToZip(zip, phonePoster, resolution, exportScale, jpegQuality = DESKTOP_SLICED_EXPORT_JPEG_QUALITY, previewImages = null) {
    const exportStartedAt = performance.now();
    await waitForPosterImagesLoaded(phonePoster);
    const posterWidth = getPhoneExportCssWidth(resolution);
    const posterHeight = Math.max(phonePoster.scrollHeight, phonePoster.offsetHeight, 1);
    const sourceCanvasMetrics = {
        width: Math.max(1, Math.round(posterWidth * exportScale)),
        height: Math.max(1, Math.ceil(posterHeight * exportScale))
    };
    sourceCanvasMetrics.height = getSlicedExportContentBottom(sourceCanvasMetrics, phonePoster);
    const protectedTextRanges = getProtectedTextRanges(sourceCanvasMetrics, phonePoster);
    const dividerRanges = getProtectedDividerRanges(sourceCanvasMetrics, phonePoster);
    const tightFallbackPadding = Math.max(2, Math.round(2 * exportScale));
    const tightFallbackProtectedRanges = getGeneratedLineContentRanges(
        sourceCanvasMetrics,
        phonePoster,
        tightFallbackPadding
    ).concat(dividerRanges).sort((a, b) => a.top - b.top);
    const fallbackProtectedRanges = getGeneratedLineContentRanges(sourceCanvasMetrics, phonePoster, 0)
        .concat(dividerRanges)
        .sort((a, b) => a.top - b.top);
    const watermarkSettings = getWatermarkSettings(exportScale);
    const topPaddingHeight = getExportTopPaddingHeight(resolution, exportScale);
    const watermarkBandHeight = showBottomWatermark
        ? getWatermarkBandHeight(resolution, exportScale, watermarkSettings)
        : topPaddingHeight;
    const sliceHeight = resolution.height;
    const contentSliceHeight = Math.max(sliceHeight - topPaddingHeight - watermarkBandHeight, 1);
    const imageRanges = getProtectedImageRanges(sourceCanvasMetrics, phonePoster, {
        contentSliceHeight
    });
    const protectedRanges = [
        ...protectedTextRanges,
        ...dividerRanges,
        ...imageRanges.filter((range) => !range.canSplit)
    ].sort((a, b) => a.top - b.top);
    const expectedInkRanges = [
        ...protectedTextRanges,
        ...dividerRanges,
        ...imageRanges
    ].sort((a, b) => a.top - b.top);
    const initialWindowSlices = getSlicedCaptureWindowSlices(posterWidth, exportScale, contentSliceHeight);

    let sourceY = Math.min(topPaddingHeight, sourceCanvasMetrics.height);
    let index = 1;
    let maxWindowSlices = Math.max(1, Math.floor(initialWindowSlices));
    let didShowOverlayBeforeCapture = false;
    let capturedWindowCount = 0;
    let captureMs = 0;
    let inkPreScanMs = 0;
    let sliceComposeMs = 0;
    const captureEngines = new Set();

    while (sourceY < sourceCanvasMetrics.height) {
        const remainingHeight = sourceCanvasMetrics.height - sourceY;
        const captureStartedAt = performance.now();
        const captureResult = await captureSlicedExportWindow({
            phonePoster,
            exportScale,
            sourceY,
            captureHeight: remainingHeight,
            protectedRanges,
            expectedInkRanges,
            imageRanges,
            fallbackProtectedRanges,
            tightFallbackProtectedRanges,
            maxWindowSlices,
            contentSliceHeight,
            showOverlayBeforeCapture: didShowOverlayBeforeCapture
                ? null
                : () => {
                    didShowOverlayBeforeCapture = true;
                    showTypesettingOverlayNow("正在导出...");
                }
        });
        captureMs += performance.now() - captureStartedAt;
        capturedWindowCount += 1;
        const {
            sourceCanvas,
            capturedHeight,
            protectedRanges: localProtectedRanges,
            imageRanges: localImageRanges,
            fallbackProtectedRanges: localFallbackProtectedRanges,
            tightFallbackProtectedRanges: localTightFallbackProtectedRanges,
            windowSlices,
            captureEngine
        } = captureResult;
        if (captureEngine) {
            captureEngines.add(captureEngine);
        }
        const inkPreScanStartedAt = performance.now();
        const localHasInkAtRow = createCanvasInkDetector(sourceCanvas, phonePoster, { precomputeRows: true });
        inkPreScanMs += performance.now() - inkPreScanStartedAt;
        maxWindowSlices = windowSlices;

        let localY = 0;
        while (localY < capturedHeight && sourceY < sourceCanvasMetrics.height) {
            const globalRemainingHeight = sourceCanvasMetrics.height - sourceY;
            const localRemainingHeight = capturedHeight - localY;
            if (localY > 0 && globalRemainingHeight > localRemainingHeight && localRemainingHeight < contentSliceHeight) {
                break;
            }

            const maxContentHeight = Math.min(contentSliceHeight, localRemainingHeight, globalRemainingHeight);
            const isLastSlice = globalRemainingHeight <= maxContentHeight;
            const currentContentHeight = isLastSlice
                ? maxContentHeight
                : getSafeContentSliceHeight(
                    sourceCanvas,
                    localY,
                    maxContentHeight,
                    localProtectedRanges,
                    localHasInkAtRow,
                    phonePoster,
                    {
                        allowEndCut: isLastSlice,
                        fallbackProtectedRanges: localFallbackProtectedRanges,
                        tightFallbackProtectedRanges: localTightFallbackProtectedRanges,
                        imageRanges: localImageRanges
                    }
                );

            if (currentContentHeight <= 0) {
                throw new Error("图片生成失败，请稍后再试。");
            }

            const sliceComposeStartedAt = performance.now();
            const sliceImage = await addSliceToZip(
                zip,
                sourceCanvas,
                localY,
                currentContentHeight,
                index,
                topPaddingHeight,
                watermarkBandHeight,
                watermarkSettings,
                sliceHeight,
                showBottomWatermark,
                jpegQuality
            );
            if (Array.isArray(previewImages)) {
                previewImages.push(sliceImage);
            }
            sliceComposeMs += performance.now() - sliceComposeStartedAt;

            sourceY += currentContentHeight;
            localY += currentContentHeight;
            index += 1;
        }

        sourceCanvas.width = 0;
        sourceCanvas.height = 0;
    }

    console.info("Sliced export timing", {
        totalMs: Math.round(performance.now() - exportStartedAt),
        captureMs: Math.round(captureMs),
        inkPreScanMs: Math.round(inkPreScanMs),
        sliceComposeMs: Math.round(sliceComposeMs),
        capturedWindowCount,
        outputSliceCount: index - 1,
        captureEngines: Array.from(captureEngines),
        exportScale,
        jpegQuality,
        sourceCanvasPixels: sourceCanvasMetrics.width * sourceCanvasMetrics.height
    });
}

async function exportSlicedImagesZip() {
    const button = getActiveExportButton("previewExportSlicesBtn", "exportSlicesBtn");
    const restoreButton = setButtonBusy(button);
    const restoreOverlay = showExportOverlay("正在导出...");
    const shouldMobilePreview = window.ArticleExportPreview.isLikelyMobileBrowser();
    const shouldDesktopPreview = window.ArticleExportPreview.shouldOpenDesktopExportPreview("previewExportSlicesBtn");
    const shouldPreview = shouldMobilePreview || shouldDesktopPreview;

    try {
        await waitForNextPaint();
        if (typeof JSZip === "undefined") {
            throw new Error("JSZip 加载失败，请检查网络后重试。");
        }

        const resolution = phoneResolutions[phoneResolution] || phoneResolutions["1080x2376"];
        const exportScale = getPhoneExportScale(resolution);
        await flushPendingPosterWork();
        const phonePoster = await ensurePhoneRenderLayout();
        if (!phonePoster) {
            throw new Error("未找到手机排版区域，无法切图导出。");
        }

        const zip = new JSZip();
        const slicedJpegQuality = window.ArticleExportPreview.isLikelyMobileBrowser()
            ? MOBILE_SLICED_EXPORT_JPEG_QUALITY
            : DESKTOP_SLICED_EXPORT_JPEG_QUALITY;
        const previewImages = shouldPreview ? [] : null;
        await addWindowedSlicedPosterToZip(zip, phonePoster, resolution, exportScale, slicedJpegQuality, previewImages);

        const zipBlob = await zip.generateAsync({ type: "blob", compression: "STORE" });
        const filename = "年度总结-已切图jpg.zip";
        if (shouldMobilePreview) {
            window.ArticleExportPreview.showMobileExportPreview({
                title: "切图导出预览",
                fileBlob: zipBlob,
                downloadFilename: filename,
                downloadLabel: "下载 ZIP",
                cssWidth: getPhoneExportCssWidth(resolution),
                images: previewImages
            });
        } else if (shouldDesktopPreview) {
            const previewWindow = window.ArticleExportPreview.openDesktopExportPreviewWindow("切图导出预览");
            window.ArticleExportPreview.showDesktopExportPreview(previewWindow, {
                title: "切图导出预览",
                fileBlob: zipBlob,
                downloadFilename: filename,
                downloadLabel: "下载 ZIP",
                images: previewImages
            });
        } else {
            window.ArticleExportPreview.downloadBlob(zipBlob, filename);
        }
    } catch (error) {
        console.error("Sliced image export failed", error);
        window.alert((error && error.message) || "切图导出失败，请稍后再试。");
    } finally {
        restoreOverlay();
        restoreButton();
    }
}

/* ===========================
   Init
=========================== */
