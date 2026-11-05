(function () {
    "use strict";

    function createBackgroundRenderer(deps) {
        const getBackgroundState = deps && typeof deps.getBackgroundState === "function"
            ? deps.getBackgroundState
            : () => ({});
        const normalizeOpacity = deps && typeof deps.normalizeOpacity === "function"
            ? deps.normalizeOpacity
            : (value) => {
                const numericValue = Number(value);
                if (!Number.isFinite(numericValue)) return 1;
                return Math.min(Math.max(numericValue, 0), 1);
            };
        const createImage = deps && typeof deps.createImage === "function"
            ? deps.createImage
            : () => new Image();
        const requestFrame = deps && typeof deps.requestFrame === "function"
            ? deps.requestFrame
            : (callback) => window.requestAnimationFrame(callback);
        const cancelFrame = deps && typeof deps.cancelFrame === "function"
            ? deps.cancelFrame
            : (frame) => window.cancelAnimationFrame(frame);

        let imageCache = {
            src: "",
            promise: null,
            image: null
        };
        let posterSyncFrame = null;

        function readBackgroundState() {
            const state = getBackgroundState() || {};
            return {
                fallbackColor: state.fallbackColor || "#ffffff",
                imageSource: typeof state.imageSource === "string" ? state.imageSource : "",
                imageOpacity: normalizeOpacity(state.imageOpacity)
            };
        }

        function loadBackgroundImage(imageSource) {
            if (!imageSource) return Promise.resolve(null);

            if (imageCache.src === imageSource && imageCache.promise) {
                return imageCache.promise;
            }

            const nextCache = {
                src: imageSource,
                image: null,
                promise: null
            };
            nextCache.promise = new Promise((resolve, reject) => {
                const image = createImage();
                image.onload = () => {
                    nextCache.image = image;
                    resolve(image);
                };
                image.onerror = () => reject(new Error("背景图片加载失败，已使用背景颜色兜底。"));
                image.src = imageSource;
            });
            imageCache = nextCache;

            return imageCache.promise;
        }

        function drawMirroredRepeatedImageAtNaturalSize(ctx, image, width, height) {
            const sourceWidth = image.naturalWidth || image.width;
            const sourceHeight = image.naturalHeight || image.height;
            if (!sourceWidth || !sourceHeight || !width || !height) return;

            const baseX = Math.round((width - sourceWidth) / 2);
            const baseY = Math.round((height - sourceHeight) / 2);
            const firstColumn = Math.floor((0 - baseX) / sourceWidth);
            const lastColumn = Math.floor((width - 1 - baseX) / sourceWidth);
            const firstRow = Math.floor((0 - baseY) / sourceHeight);
            const lastRow = Math.floor((height - 1 - baseY) / sourceHeight);

            for (let row = firstRow; row <= lastRow; row += 1) {
                for (let column = firstColumn; column <= lastColumn; column += 1) {
                    const x = baseX + column * sourceWidth;
                    const y = baseY + row * sourceHeight;
                    const flipX = Math.abs(column) % 2 === 1;
                    const flipY = Math.abs(row) % 2 === 1;

                    ctx.save();
                    ctx.translate(flipX ? x + sourceWidth : x, flipY ? y + sourceHeight : y);
                    ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
                    ctx.drawImage(image, 0, 0, sourceWidth, sourceHeight);
                    ctx.restore();
                }
            }
        }

        async function drawCanvasBackground(ctx, width, height, fallbackColor = null) {
            if (!ctx) return;

            const state = readBackgroundState();
            ctx.fillStyle = fallbackColor || state.fallbackColor;
            ctx.fillRect(0, 0, width, height);

            if (!state.imageSource) return;

            try {
                const image = await loadBackgroundImage(state.imageSource);
                if (image) {
                    const previousAlpha = ctx.globalAlpha;
                    try {
                        ctx.globalAlpha = previousAlpha * state.imageOpacity;
                        drawMirroredRepeatedImageAtNaturalSize(ctx, image, width, height);
                    } finally {
                        ctx.globalAlpha = previousAlpha;
                    }
                }
            } catch (error) {
                console.warn(error);
            }
        }

        function ensureBackgroundCanvas(container, className) {
            if (!container) return null;

            let canvas = container.querySelector(`.${className}`);
            if (!canvas) {
                canvas = document.createElement("canvas");
                canvas.className = className;
                canvas.setAttribute("aria-hidden", "true");
                container.prepend(canvas);
            }

            return canvas;
        }

        function ensurePosterBackgroundCanvas(poster) {
            return ensureBackgroundCanvas(poster, "posterBackgroundCanvas");
        }

        async function syncPosterBackgroundCanvas(poster) {
            const canvas = ensurePosterBackgroundCanvas(poster);
            if (!canvas) return;

            const state = readBackgroundState();
            if (!state.imageSource) {
                canvas.hidden = true;
                canvas.style.height = "";
                return;
            }

            const width = Math.max(1, Math.round(poster.offsetWidth || poster.getBoundingClientRect().width || 0));
            const posterRect = poster.getBoundingClientRect();
            const minBottom = posterRect.top + (poster.clientHeight || posterRect.height || 0);
            const naturalBottom = Array.from(poster.children)
                .filter((child) => child !== canvas && !child.hidden)
                .reduce((bottom, child) => {
                    const rect = child.getBoundingClientRect();
                    return Math.max(bottom, rect.bottom);
                }, minBottom);
            const height = Math.max(1, Math.round(naturalBottom - posterRect.top));

            canvas.hidden = false;
            canvas.width = width;
            canvas.height = height;
            canvas.style.height = `${height}px`;

            const ctx = canvas.getContext("2d");
            if (!ctx) return;

            await drawCanvasBackground(ctx, width, height);
        }

        function schedulePosterBackgroundSync(poster) {
            if (!poster) return;

            if (posterSyncFrame !== null) {
                cancelFrame(posterSyncFrame);
            }

            posterSyncFrame = requestFrame(() => {
                posterSyncFrame = null;
                syncPosterBackgroundCanvas(poster);
            });
        }

        function ensurePhoneBackgroundCanvas(screen) {
            return ensureBackgroundCanvas(screen, "phoneBackgroundCanvas");
        }

        async function syncPhoneBackgroundCanvas(screen, resolution = null) {
            const canvas = ensurePhoneBackgroundCanvas(screen);
            if (!canvas) return;

            const state = readBackgroundState();
            if (!state.imageSource) {
                canvas.hidden = true;
                return;
            }

            const width = Math.max(1, Math.round((resolution && resolution.width) || screen.clientWidth || screen.getBoundingClientRect().width || 0));
            const height = Math.max(1, Math.round((resolution && resolution.height) || screen.clientHeight || screen.getBoundingClientRect().height || 0));

            canvas.hidden = false;
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext("2d");
            if (!ctx) return;

            await drawCanvasBackground(ctx, width, height);
        }

        return Object.freeze({
            drawCanvasBackground,
            ensurePosterBackgroundCanvas,
            syncPosterBackgroundCanvas,
            schedulePosterBackgroundSync,
            ensurePhoneBackgroundCanvas,
            syncPhoneBackgroundCanvas
        });
    }

    window.ArticleBackgroundRenderer = Object.freeze({
        createBackgroundRenderer
    });
})();
