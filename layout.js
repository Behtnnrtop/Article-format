/* ===========================
   Layout
=========================== */

function renderRichTextPreview(value, { sanitize = true } = {}) {
    const template = document.createElement("template");
    template.innerHTML = sanitize ? sanitizeRichText(value) : String(value == null ? "" : value);

    const paragraphs = [];
    let paragraph = document.createElement("div");
    const blockTags = new Set(["P", "DIV"]);

    function pushParagraph({ keepEmpty = false } = {}) {
        if (paragraph.childNodes.length || keepEmpty) {
            paragraphs.push(paragraph);
        }
        paragraph = document.createElement("div");
    }

    function appendNodes(nodes) {
        Array.from(nodes).forEach((child) => {
            if (child.nodeType === Node.ELEMENT_NODE && blockTags.has(child.tagName)) {
                pushParagraph();
                const beforeCount = paragraphs.length;
                appendNodes(child.childNodes);
                if (paragraph.childNodes.length) {
                    pushParagraph();
                } else if (!child.childNodes.length && paragraphs.length === beforeCount) {
                    pushParagraph({ keepEmpty: true });
                }
                return;
            }

            if (child.nodeType === Node.ELEMENT_NODE && child.tagName === "BR") {
                pushParagraph({ keepEmpty: true });
                return;
            }

            paragraph.appendChild(child.cloneNode(true));
        });
    }

    appendNodes(template.content.childNodes);

    if (paragraph.childNodes.length || !paragraphs.length) {
        paragraphs.push(paragraph);
    }

    return paragraphs
        .map((item) => renderPreviewBlock(item))
        .join("");
}

const TYPESET_ADJUST_STRATEGY = "spacing";
const TYPESET_FORBIDDEN_LINE_START = new Set(Array.from("，。、：；！？)]｝】）》〉」』”’\"':;/?"));
const TYPESET_FORBIDDEN_LINE_END = new Set(Array.from("([{｛【（《〈「『“‘\"'"));
const TYPESET_MAX_SCALE_SQUEEZE = 0.96;
const TYPESET_MIN_SPACING_SQUEEZE = -1.8;
const TYPESET_MAX_JUSTIFY_SPACING = 8;
const TYPESET_MAX_RENDERED_JUSTIFY_SPACING = 3;
const TYPESET_RENDERED_JUSTIFY_MAX_PASSES = 6;
const TYPESET_RENDERED_JUSTIFY_EDGE_TOLERANCE = 0.75;
const TYPESET_TRAILING_PUNCTUATION_MIN_SPACING = -2.8;
const TYPESET_TRAILING_PUNCTUATION_MIN_SCALE = 0.9;
const TYPESET_TRAILING_PUNCTUATION_EDGE_TOLERANCE = 1;
const TYPESET_MIN_JUSTIFY_FILL_RATIO = 0.72;
const TYPESET_MOBILE_MIN_RENDERED_FILL_RATIO = 0.9;
const TYPESET_MOBILE_MAX_WIDTH_CALIBRATION = 1.45;
const SUBTITLE_MIN_SINGLE_LINE_SPACING = -18;
const SUBTITLE_MIN_SINGLE_LINE_SCALE = 0.82;
const PREVIEW_RENDER_DELAY_MS = 180;
const DIVIDER_DRAG_RENDER_DELAY_MS = 160;
const STARTUP_TYPESET_IDLE_TIMEOUT_MS = 700;
const TYPESETTING_OVERLAY_DELAY_MS = 0;
const TYPESETTING_OVERLAY_MIN_VISIBLE_MS = 0;
const STATE_SAVE_DEBOUNCE_MS = 350;
const MOBILE_TEXT_INPUT_COMMIT_DELAY_MS = 520;
const CARD_IMAGE_SORT_AUTOSCROLL_EDGE_PX = 72;
const CARD_IMAGE_SORT_AUTOSCROLL_MAX_PX = 18;
const LONG_IMAGE_EXPORT_SCALE = 3;
const LONG_IMAGE_MIN_EXPORT_SCALE = 1;
const DESKTOP_LONG_IMAGE_SCALE_PIXEL_LIMIT = 36 * 1000 * 1000;
const MOBILE_LONG_IMAGE_SCALE_PIXEL_LIMIT = 24 * 1000 * 1000;

let typesetMeasureLayer = null;
let pendingPreviewRenderTimer = null;
let pendingPreviewRenderCallback = null;
const pendingCardPreviewIndexes = new Set();
const pendingDeferredCardPreviewIndexes = new Set();
let isCardSortMode = false;
let cardSortDragState = null;
let recentlyMovedCardIndex = null;
let recentlyMovedCardHighlightTimer = null;
let recentlyMovedCardImage = null;
let recentlyMovedCardImageHighlightTimer = null;
let cardImageSortDragState = null;
const pendingMobileTextInputs = new Map();
let pendingMobileTextInputTimer = null;
const pendingCardTypesetTasks = new Map();
let mobileTypesettingDirty = false;
let mobilePreviewTypesetReady = false;
let mobilePosterPreviewMode = false;
let mobileTypesettingBusyTimer = null;
let pendingPosterTypesetTask = null;
let pendingTypesettingOverlayTimer = null;
let pendingTypesettingOverlayHideTimer = null;
let typesettingOverlayShownAt = 0;
let posterTypesettingOverlay = null;
let posterBackgroundSyncFrame = null;
let pendingStateSaveTimer = null;
let lastSavedStateJson = "";
let stateSaveErrorShown = false;
let typesetMeasureCanvasContext = null;

function getTypesetMeasureLayer() {
    if (typesetMeasureLayer && document.body.contains(typesetMeasureLayer)) {
        return typesetMeasureLayer;
    }

    typesetMeasureLayer = document.createElement("div");
    typesetMeasureLayer.id = "typesetMeasureLayer";
    typesetMeasureLayer.style.position = "fixed";
    typesetMeasureLayer.style.left = "-99999px";
    typesetMeasureLayer.style.top = "0";
    typesetMeasureLayer.style.visibility = "hidden";
    typesetMeasureLayer.style.pointerEvents = "none";
    typesetMeasureLayer.style.whiteSpace = "nowrap";
    document.body.appendChild(typesetMeasureLayer);

    return typesetMeasureLayer;
}

function copyTypesetTextStyles(source, target) {
    const style = window.getComputedStyle(source);
    [
        "fontFamily",
        "fontSize",
        "fontWeight",
        "fontStyle",
        "fontVariant",
        "fontStretch",
        "letterSpacing",
        "textTransform",
        "textDecorationLine",
        "textDecorationStyle",
        "textDecorationColor",
        "color",
        "lineHeight"
    ].forEach((property) => {
        target.style[property] = style[property];
    });
}

function getTypesetTokenStyle(element, root) {
    const tokenStyle = {};
    let current = element && element.nodeType === Node.ELEMENT_NODE ? element : null;
    const styleChain = [];
    const decorationLines = [];

    function addDecorationLine(value) {
        if (!value || value === "none") return;

        String(value).split(/\s+/).forEach((item) => {
            if (item && item !== "none" && !decorationLines.includes(item)) {
                decorationLines.push(item);
            }
        });
    }

    while (current && current !== root) {
        if (current.nodeType === Node.ELEMENT_NODE) {
            styleChain.unshift(current);
        }

        current = current.parentElement;
    }

    styleChain.forEach((styleElement) => {
        const tagName = styleElement.tagName;
        const inlineStyle = styleElement.style || {};

        if (tagName === "B" || tagName === "STRONG") {
            tokenStyle.fontWeight = "bold";
        }
        if (inlineStyle.fontWeight) {
            tokenStyle.fontWeight = inlineStyle.fontWeight;
        }

        if (tagName === "I" || tagName === "EM") {
            tokenStyle.fontStyle = "italic";
        }
        if (inlineStyle.fontStyle) {
            tokenStyle.fontStyle = inlineStyle.fontStyle;
        }

        if (tagName === "U") {
            addDecorationLine("underline");
        }
        if (tagName === "S" || tagName === "STRIKE") {
            addDecorationLine("line-through");
        }

        if (inlineStyle.fontSize) {
            tokenStyle.fontSize = inlineStyle.fontSize;
        }
        if (inlineStyle.fontFamily) {
            tokenStyle.fontFamily = inlineStyle.fontFamily;
        }
        if (inlineStyle.color) {
            tokenStyle.color = inlineStyle.color;
        }
        if (inlineStyle.textDecorationLine) {
            addDecorationLine(inlineStyle.textDecorationLine);
        }
        if (inlineStyle.textDecorationStyle) {
            tokenStyle.textDecorationStyle = inlineStyle.textDecorationStyle;
        }
        if (inlineStyle.textDecorationColor) {
            tokenStyle.textDecorationColor = inlineStyle.textDecorationColor;
        }
        if (inlineStyle.textDecoration) {
            tokenStyle.textDecoration = inlineStyle.textDecoration;
        }
    });

    if (decorationLines.length) {
        tokenStyle.textDecorationLine = decorationLines.join(" ");
    }

    return tokenStyle;
}

function applyTypesetTokenStyle(element, style) {
    Object.entries(style).forEach(([property, value]) => {
        if (value) {
            element.style[property] = value;
            if (property === "color") {
                element.dataset.richTextExplicitColor = "true";
            }
        }
    });
}

function splitTypesetDecorationStyle(style = {}) {
    const tokenStyle = {};
    const decorationStyle = {};
    const decorationProperties = new Set([
        "textDecoration",
        "textDecorationLine",
        "textDecorationStyle",
        "textDecorationColor"
    ]);

    Object.entries(style).forEach(([property, value]) => {
        if (!value) return;

        if (decorationProperties.has(property)) {
            decorationStyle[property] = value;
        } else {
            tokenStyle[property] = value;
        }
    });

    return {
        tokenStyle,
        decorationStyle
    };
}

function getTypesetDecorationKey(style = {}) {
    const line = style.textDecorationLine || "";
    const shorthand = style.textDecoration || "";
    if (!line && !shorthand) return "";

    return [
        line,
        style.textDecorationStyle || "",
        style.textDecorationColor || "",
        shorthand
    ].join("|");
}

function createTypesetDecorationRun(style) {
    const run = document.createElement("span");
    const decorationLine = style.textDecorationLine || style.textDecoration || "";
    const decorationColor = style.textDecorationColor || "";
    run.className = "typesetDecorationRun";

    if (decorationLine) {
        run.dataset.decorationLines = decorationLine;
    }
    if (decorationColor) {
        run.style.setProperty("--typeset-decoration-color", decorationColor);
    }

    return run;
}

function collectTypesetTokens(root, node = root, tokens = []) {
    if (node.nodeType === Node.TEXT_NODE) {
        const style = getTypesetTokenStyle(node.parentElement || root, root);
        Array.from(node.textContent || "").forEach((char) => {
            if (char === "\r") return;
            tokens.push(char === "\n"
                ? { break: true }
                : { text: char, style });
        });
        return tokens;
    }

    if (node.nodeType !== Node.ELEMENT_NODE && node.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) {
        return tokens;
    }

    if (node.nodeType === Node.ELEMENT_NODE && node.tagName === "BR") {
        tokens.push({ break: true });
        return tokens;
    }

    if (node.nodeType === Node.ELEMENT_NODE && node.classList.contains("typesetLineShadow")) {
        return tokens;
    }

    Array.from(node.childNodes).forEach((child) => collectTypesetTokens(root, child, tokens));
    return tokens;
}

function createTypesetLineElement(tokens, adjustment = null, { includeShadow = false, align = "left" } = {}) {
    const line = document.createElement("span");
    const inner = document.createElement("span");
    const textAlign = normalizeTextAlign(align);
    let currentDecorationRun = null;
    let currentDecorationKey = "";
    line.className = "typesetLine";
    inner.className = "typesetLineInner";
    line.style.textAlign = textAlign;
    inner.style.transformOrigin = getTypesetTransformOrigin(textAlign);

    if (adjustment && adjustment.type === "scale") {
        inner.style.transform = `scaleX(${adjustment.scale})`;
    }

    if (includeShadow && tokens.length) {
        const shadow = document.createElement("span");
        shadow.className = "typesetLineShadow";
        shadow.setAttribute("aria-hidden", "true");
        shadow.textContent = tokens.map((token) => token.text === " " ? "\u00a0" : (token.text || "")).join("");
        inner.appendChild(shadow);
    }

    tokens.forEach((token, index) => {
        const span = document.createElement("span");
        const splitStyle = splitTypesetDecorationStyle(token.style);
        const decorationKey = getTypesetDecorationKey(splitStyle.decorationStyle);
        span.className = "typesetToken";
        span.textContent = token.text === " " ? "\u00a0" : token.text;
        applyTypesetTokenStyle(span, splitStyle.tokenStyle);

        if (adjustment && adjustment.type === "spacing" && index < tokens.length - 1 && isTypesetSpacingTarget(token)) {
            span.style.marginRight = `${adjustment.spacing}px`;
        }

        if (!decorationKey) {
            currentDecorationRun = null;
            currentDecorationKey = "";
            inner.appendChild(span);
            return;
        }

        if (!currentDecorationRun || currentDecorationKey !== decorationKey) {
            currentDecorationRun = createTypesetDecorationRun(splitStyle.decorationStyle);
            currentDecorationKey = decorationKey;
            inner.appendChild(currentDecorationRun);
        }

        currentDecorationRun.appendChild(span);
    });

    if (!tokens.length) {
        inner.appendChild(document.createElement("br"));
    }

    line.appendChild(inner);
    return line;
}

function measureTypesetTokens(tokens, root) {
    if (!tokens.length) return 0;

    const layer = getTypesetMeasureLayer();
    const line = createTypesetLineElement(tokens);
    copyTypesetTextStyles(root, line);
    layer.innerHTML = "";
    layer.appendChild(line);

    const width = line.firstElementChild.getBoundingClientRect().width;
    layer.innerHTML = "";
    return width;
}

function getTypesetMeasureCanvasContext() {
    if (typesetMeasureCanvasContext) {
        return typesetMeasureCanvasContext;
    }

    const canvas = document.createElement("canvas");
    typesetMeasureCanvasContext = canvas.getContext("2d");
    return typesetMeasureCanvasContext;
}

function getTypesetCanvasFont(style) {
    return [
        style.fontStyle || "normal",
        style.fontWeight || "400",
        style.fontSize || "16px",
        style.fontFamily || "sans-serif"
    ].join(" ");
}

function getTypesetLetterSpacing(style) {
    const value = parseFloat((style && style.letterSpacing) || "0");
    return Number.isFinite(value) ? value : 0;
}

function createFastTypesetRangeMeasurer(tokens, root) {
    const ctx = getTypesetMeasureCanvasContext();
    if (!ctx) return null;

    const rootStyle = window.getComputedStyle(root);
    const widthPrefix = new Array(tokens.length + 1).fill(0);
    const spacingPrefix = new Array(tokens.length + 1).fill(0);
    const widthCache = new Map();

    tokens.forEach((token, index) => {
        if (!token || !token.text) {
            widthPrefix[index + 1] = widthPrefix[index];
            spacingPrefix[index + 1] = spacingPrefix[index];
            return;
        }

        const style = token.style || rootStyle;
        const font = getTypesetCanvasFont(style);
        const cacheKey = `${font}\n${token.text}`;

        if (!widthCache.has(cacheKey)) {
            ctx.font = font;
            widthCache.set(cacheKey, ctx.measureText(token.text).width);
        }

        widthPrefix[index + 1] = widthPrefix[index] + widthCache.get(cacheKey);
        spacingPrefix[index + 1] = spacingPrefix[index] + getTypesetLetterSpacing(style);
    });

    return function measureRange(start, end) {
        if (end <= start) return 0;

        const textWidth = widthPrefix[end] - widthPrefix[start];
        const spacingWidth = end - start > 1
            ? spacingPrefix[end - 1] - spacingPrefix[start]
            : 0;

        return textWidth + spacingWidth;
    };
}

function createTypesetRangeMeasurer(tokens, root, { forceDomMeasure = false } = {}) {
    const shouldUseFastCanvasMeasure = typeof isMobileViewport !== "function" || !isMobileViewport();

    if (!forceDomMeasure && shouldUseFastCanvasMeasure && tokens.length > 160) {
        const fastMeasurer = createFastTypesetRangeMeasurer(tokens, root);
        if (fastMeasurer) return fastMeasurer;
    }

    const cache = new Map();

    return function measureRange(start, end) {
        if (end <= start) return 0;

        const key = `${start}:${end}`;
        if (cache.has(key)) {
            return cache.get(key);
        }

        const width = measureTypesetTokens(tokens.slice(start, end), root);
        cache.set(key, width);
        return width;
    };
}

function cancelPendingPreviewRender() {
    if (pendingPreviewRenderTimer === null) return;

    window.clearTimeout(pendingPreviewRenderTimer);
    pendingPreviewRenderTimer = null;
    pendingPreviewRenderCallback = null;
}

function schedulePreviewRender(delay = PREVIEW_RENDER_DELAY_MS, renderCallback = renderPreview) {
    cancelPendingPreviewRender();
    pendingPreviewRenderCallback = renderCallback;

    pendingPreviewRenderTimer = window.setTimeout(() => {
        const callback = pendingPreviewRenderCallback || renderPreview;
        pendingPreviewRenderTimer = null;
        pendingPreviewRenderCallback = null;
        callback();
    }, delay);
}

function getMobileTypesetRefreshButton() {
    return document.getElementById("mobileTypesetRefreshBtn");
}

function hasPendingMobileTextInput() {
    return pendingMobileTextInputs.size > 0;
}

function markMobilePreviewTypesetStale() {
    mobilePreviewTypesetReady = false;
}

function markMobilePreviewTypesetReady() {
    mobilePreviewTypesetReady = true;
}

function isMobilePreviewTypesetReady() {
    return mobilePreviewTypesetReady;
}

function updateMobileTypesetRefreshButton({ busy = false } = {}) {
    const button = getMobileTypesetRefreshButton();
    if (!button) return;

    const shouldShow = isMobileViewport();
    button.classList.toggle("visible", shouldShow);
    button.classList.toggle("dirty", mobileTypesettingDirty && !mobilePosterPreviewMode);
    button.classList.toggle("previewing", mobilePosterPreviewMode);
    button.classList.toggle("busy", busy);
    button.disabled = busy;
    button.setAttribute("aria-pressed", String(mobilePosterPreviewMode));
    button.innerText = busy
        ? "排版中..."
        : (mobilePosterPreviewMode ? "编辑" : "预览");
}

function cancelDelayedMobileTypesettingBusy() {
    if (mobileTypesettingBusyTimer === null) return;

    window.clearTimeout(mobileTypesettingBusyTimer);
    mobileTypesettingBusyTimer = null;
}

function scheduleDelayedMobileTypesettingBusy(delay = 500) {
    cancelDelayedMobileTypesettingBusy();

    mobileTypesettingBusyTimer = window.setTimeout(() => {
        mobileTypesettingBusyTimer = null;
        updateMobileTypesetRefreshButton({ busy: true });
    }, delay);
}

function clearMobileTypesettingBusy() {
    cancelDelayedMobileTypesettingBusy();
    updateMobileTypesetRefreshButton();
}

function markMobileTypesettingDirty() {
    if (!isMobileViewport()) return false;

    mobileTypesettingDirty = true;
    markMobilePreviewTypesetStale();
    updateMobileTypesetRefreshButton();
    return true;
}

function clearMobileTypesettingDirty() {
    mobileTypesettingDirty = false;
    updateMobileTypesetRefreshButton();
}

function scheduleMobileFastPreviewRender(delay = PREVIEW_RENDER_DELAY_MS) {
    if (!markMobileTypesettingDirty()) {
        scheduleDeferredFullPreviewRender(delay);
        return;
    }

    schedulePreviewRender(delay, () => renderPreview({
        deferTypesetting: true,
        scheduleDeferredTypesetting: false
    }));
}

function renderLayoutChangePreview({ deferEditor = false } = {}) {
    if (isMobileViewport()) {
        markMobileTypesettingDirty();
        render({
            deferEditor,
            previewOptions: {
                deferTypesetting: true,
                scheduleDeferredTypesetting: false
            }
        });
        return;
    }

    render({ deferEditor });
}

function renderOrderChangePreview() {
    flushPendingMobileTextInputs({ schedulePreview: false });

    if (isMobileViewport()) {
        markMobileTypesettingDirty();
    }

    renderEditor();
    schedulePreviewRender(PREVIEW_RENDER_DELAY_MS, () => renderPreview({
        deferTypesetting: true,
        scheduleDeferredTypesetting: !isMobileViewport()
    }));
    saveState();
}

async function flushMobileTypesettingIfNeeded({ force = false, showBusy = true } = {}) {
    if (!isMobileViewport()) return false;
    if (!force && !mobileTypesettingDirty && isMobilePreviewTypesetReady()) return false;

    flushPendingMobileTextInputs();
    await flushPendingPreviewRender();
    await flushDeferredCardTypesetting();
    await flushDeferredPosterTypesetting();

    if (showBusy) {
        updateMobileTypesetRefreshButton({ busy: true });
    }
    applyPosterTypesetting();
    syncCardsOffset();
    schedulePhonePreviewSync();
    schedulePosterBackgroundSync(document.getElementById("poster"));
    markMobilePreviewTypesetReady();
    clearMobileTypesettingDirty();
    clearMobileTypesettingBusy();
    saveState();
    return true;
}

async function flushPendingPreviewRender() {
    if (pendingPreviewRenderTimer === null) return;

    const callback = pendingPreviewRenderCallback || renderPreview;
    cancelPendingPreviewRender();
    await callback();
}

function clearPendingMobileTextInputTimer() {
    if (pendingMobileTextInputTimer === null) return;

    window.clearTimeout(pendingMobileTextInputTimer);
    pendingMobileTextInputTimer = null;
}

function flushPendingMobileTextInputs({ schedulePreview = true } = {}) {
    if (!pendingMobileTextInputs.size) return false;

    const pendingEntries = Array.from(pendingMobileTextInputs.entries());
    clearPendingMobileTextInputTimer();
    pendingMobileTextInputs.clear();

    pendingEntries.forEach(([index, value]) => {
        if (!data[index]) return;

        data[index].text = sanitizeRichText(value);

        if (schedulePreview) {
            pendingCardPreviewIndexes.add(index);
            pendingDeferredCardPreviewIndexes.add(index);
            markMobileTypesettingDirty();
        }
    });

    scheduleCurrentWordCountUpdate();

    if (schedulePreview && pendingCardPreviewIndexes.size) {
        schedulePreviewRender(0, flushPendingCardPreviewRenders);
    }

    return true;
}

function scheduleMobileTextInputCommit(index, value) {
    pendingMobileTextInputs.set(index, value);
    scheduleCurrentWordCountUpdate();
    clearPendingMobileTextInputTimer();

    pendingMobileTextInputTimer = window.setTimeout(() => {
        flushPendingMobileTextInputs();
    }, MOBILE_TEXT_INPUT_COMMIT_DELAY_MS);
}

function cancelDeferredCardTypesetting(index) {
    const task = pendingCardTypesetTasks.get(index);
    if (!task) return;

    if (task.type === "idle" && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(task.id);
    } else {
        window.clearTimeout(task.id);
    }

    pendingCardTypesetTasks.delete(index);
}

function runDeferredCardTypesetting(index) {
    cancelDeferredCardTypesetting(index);

    const card = document.querySelector(`#cards .card[data-card-index="${index}"]`);
    if (!card) return;

    applyCardTypesetting(card);
    syncCardsOffset();
    schedulePhonePreviewSync();
    schedulePosterBackgroundSync(document.getElementById("poster"));
}

function scheduleDeferredCardTypesetting(index) {
    cancelDeferredCardTypesetting(index);

    if (typeof window.requestIdleCallback === "function") {
        const id = window.requestIdleCallback(() => {
            runDeferredCardTypesetting(index);
        }, { timeout: STARTUP_TYPESET_IDLE_TIMEOUT_MS });
        pendingCardTypesetTasks.set(index, { type: "idle", id });
        return;
    }

    const id = window.setTimeout(() => {
        runDeferredCardTypesetting(index);
    }, 0);
    pendingCardTypesetTasks.set(index, { type: "timeout", id });
}

async function flushDeferredCardTypesetting() {
    if (!pendingCardTypesetTasks.size) return;

    const indexes = Array.from(pendingCardTypesetTasks.keys());
    indexes.forEach(runDeferredCardTypesetting);
}

function getPosterTypesettingOverlay() {
    if (posterTypesettingOverlay && document.body.contains(posterTypesettingOverlay)) {
        return posterTypesettingOverlay;
    }

    const preview = document.getElementById("preview");
    if (!preview) return null;

    posterTypesettingOverlay = document.getElementById("posterTypesettingOverlay");

    if (!posterTypesettingOverlay) {
        posterTypesettingOverlay = document.createElement("div");
        posterTypesettingOverlay.id = "posterTypesettingOverlay";
        posterTypesettingOverlay.className = "posterTypesettingOverlay";
        posterTypesettingOverlay.innerHTML = '<div class="posterTypesettingMessage">正在排版...</div>';
        preview.appendChild(posterTypesettingOverlay);
    }

    return posterTypesettingOverlay;
}

function showTypesettingOverlayNow(message = "正在排版...") {
    cancelPendingTypesettingOverlayHide();

    const overlay = getPosterTypesettingOverlay();
    if (!overlay) return;

    const messageElement = overlay.querySelector(".posterTypesettingMessage");
    if (messageElement) {
        messageElement.textContent = message;
    }

    overlay.classList.add("visible");
    overlay.setAttribute("aria-hidden", "false");
    typesettingOverlayShownAt = performance.now();
}

function cancelPendingTypesettingOverlay() {
    if (pendingTypesettingOverlayTimer === null) return;

    window.clearTimeout(pendingTypesettingOverlayTimer);
    pendingTypesettingOverlayTimer = null;
}

function cancelPendingTypesettingOverlayHide() {
    if (pendingTypesettingOverlayHideTimer === null) return;

    window.clearTimeout(pendingTypesettingOverlayHideTimer);
    pendingTypesettingOverlayHideTimer = null;
}

function scheduleTypesettingOverlay(message = "正在排版...") {
    cancelPendingTypesettingOverlay();
    cancelPendingTypesettingOverlayHide();

    pendingTypesettingOverlayTimer = window.setTimeout(() => {
        pendingTypesettingOverlayTimer = null;
        showTypesettingOverlayNow(message);
    }, TYPESETTING_OVERLAY_DELAY_MS);
}

function hideTypesettingOverlay() {
    cancelPendingTypesettingOverlay();
    cancelPendingTypesettingOverlayHide();

    const overlay = getPosterTypesettingOverlay();
    if (!overlay) return;

    if (overlay.classList.contains("visible")) {
        const visibleFor = performance.now() - typesettingOverlayShownAt;
        const remaining = TYPESETTING_OVERLAY_MIN_VISIBLE_MS - visibleFor;

        if (remaining > 0) {
            pendingTypesettingOverlayHideTimer = window.setTimeout(() => {
                pendingTypesettingOverlayHideTimer = null;
                hideTypesettingOverlay();
            }, remaining);
            return;
        }
    }

    overlay.classList.remove("visible");
    overlay.setAttribute("aria-hidden", "true");
    typesettingOverlayShownAt = 0;
}

function showExportOverlay(message = "正在导出...") {
    const overlay = getPosterTypesettingOverlay();
    const wasVisible = (overlay && overlay.classList.contains("visible")) || false;
    const oldAriaHidden = (overlay && overlay.getAttribute("aria-hidden")) || "true";
    const messageElement = overlay ? overlay.querySelector(".posterTypesettingMessage") : null;
    const oldMessage = (messageElement && messageElement.textContent) || "正在排版...";

    showTypesettingOverlayNow(message);

    return () => {
        cancelPendingTypesettingOverlay();
        cancelPendingTypesettingOverlayHide();

        if (messageElement) {
            messageElement.textContent = oldMessage;
        }

        if (overlay && wasVisible) {
            overlay.classList.add("visible");
            overlay.setAttribute("aria-hidden", oldAriaHidden);
            return;
        }

        hideTypesettingOverlay();
    };
}

function waitForNextPaint() {
    return new Promise((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(resolve));
    });
}

async function runPosterTypesettingCompletion({ shouldSave = true, hideOverlay = true } = {}) {
    pendingPosterTypesetTask = null;
    applyPosterTypesetting();
    syncCardsOffset();
    syncPreviewExportActionsPosition();
    schedulePhonePreviewSync();

    await syncPosterBackgroundCanvas(document.getElementById("poster"));

    if (hideOverlay) {
        hideTypesettingOverlay();
    }

    if (shouldSave) {
        saveState();
    }
}

function cancelDeferredPosterTypesetting() {
    if (!pendingPosterTypesetTask) return;

    if (pendingPosterTypesetTask.type === "idle" && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(pendingPosterTypesetTask.id);
    } else {
        window.clearTimeout(pendingPosterTypesetTask.id);
    }

    pendingPosterTypesetTask = null;
}

function scheduleDeferredPosterTypesetting(options = {}) {
    cancelDeferredPosterTypesetting();

    if (typeof window.requestIdleCallback === "function") {
        const id = window.requestIdleCallback(() => {
            runPosterTypesettingCompletion(options);
        }, { timeout: STARTUP_TYPESET_IDLE_TIMEOUT_MS });
        pendingPosterTypesetTask = { type: "idle", id, options };
        return;
    }

    const id = window.setTimeout(() => {
        runPosterTypesettingCompletion(options);
    }, 0);
    pendingPosterTypesetTask = { type: "timeout", id, options };
}

async function flushDeferredPosterTypesetting() {
    if (!pendingPosterTypesetTask) return;

    const { options } = pendingPosterTypesetTask;
    cancelDeferredPosterTypesetting();
    await runPosterTypesettingCompletion({
        ...options,
        hideOverlay: true
    });
}

function getCssPixelValue(value) {
    const number = parseFloat(value || "");
    return Number.isFinite(number) ? number : null;
}

function getPosterYearAvailableWidth(element, padding) {
    const poster = element.closest(".posterRoot");
    const header = element.parentElement;
    const titleMaxWidth = poster
        ? getCssPixelValue(window.getComputedStyle(poster).getPropertyValue("--headline-title-max-width"))
        : null;
    const headerWidth = header
        ? header.getBoundingClientRect().width
        : null;

    return Math.max(1, (titleMaxWidth || headerWidth || element.getBoundingClientRect().width) - padding);
}

function getTypesetAvailableWidth(element) {
    const style = window.getComputedStyle(element);
    const padding = parseFloat(style.paddingLeft || "0") + parseFloat(style.paddingRight || "0");
    const ownWidth = element.getBoundingClientRect().width - padding;
    const parentWidth = element.parentElement
        ? element.parentElement.getBoundingClientRect().width - padding
        : ownWidth;

    if (element.matches(".posterYear")) {
        return getPosterYearAvailableWidth(element, padding);
    }

    return Math.max(1, Math.min(ownWidth || parentWidth, parentWidth || ownWidth));
}

function getPosterPart(poster, part) {
    if (!poster) return null;

    return poster.querySelector(`[data-poster-part="${part}"]`)
        || poster.querySelector(`.poster${part[0].toUpperCase()}${part.slice(1)}`);
}

function syncHeadlineTextWidths(poster = document.getElementById("poster")) {
    const side = getPosterPart(poster, "side");
    const subtitle = getPosterPart(poster, "subtitle");
    if (!poster) return;

    const posterStyle = window.getComputedStyle(poster);
    const paddingLeft = parseFloat(posterStyle.paddingLeft || "0");
    const paddingRight = parseFloat(posterStyle.paddingRight || "0");
    const contentWidth = Math.max(1, poster.clientWidth - paddingLeft - paddingRight);
    let leftLimit = showSideHeader ? sideSpacing : 0;
    let rightLimit = showSideHeader ? contentWidth - sideSpacing : contentWidth;

    if (showSideHeader && side && window.getComputedStyle(side).display !== "none") {
        const posterRect = poster.getBoundingClientRect();
        const sideRect = side.getBoundingClientRect();
        const sideLeftInContent = sideRect.left - posterRect.left - paddingLeft;
        rightLimit = sideLeftInContent - sideSpacing;
    }

    const titleOffset = Math.max(0, leftLimit);
    const titleMaxWidth = Math.max(1, rightLimit - titleOffset);
    poster.style.setProperty("--headline-title-offset", `${titleOffset}px`);
    poster.style.setProperty("--headline-title-max-width", `${titleMaxWidth}px`);

    if (subtitlePosition === "verticalLeft" || !subtitle) {
        poster.style.removeProperty("--headline-subtitle-max-width");
        return;
    }

    const subtitleMarginLeft = parseFloat(window.getComputedStyle(subtitle).marginLeft || "0");
    const subtitleMaxWidth = Math.max(1, rightLimit - subtitleMarginLeft);
    poster.style.setProperty("--headline-subtitle-max-width", `${subtitleMaxWidth}px`);
}

function isTypesetForbiddenLineStart(token) {
    return token && token.text && TYPESET_FORBIDDEN_LINE_START.has(token.text);
}

function isTypesetForbiddenLineEnd(token) {
    return token && token.text && TYPESET_FORBIDDEN_LINE_END.has(token.text);
}

function isTypesetSpacingTarget(token) {
    return token && token.text && !/\s/.test(token.text);
}

function getTypesetSpacingTargetCount(tokens) {
    return Math.max(0, tokens.slice(0, -1).filter(isTypesetSpacingTarget).length);
}

function adjustTypesetLine(tokens, width, maxWidth, strategy = TYPESET_ADJUST_STRATEGY) {
    if (width <= maxWidth) return null;

    if (strategy === "spacing") {
        const adjustableCount = getTypesetSpacingTargetCount(tokens);
        if (adjustableCount > 0) {
            const spacing = Math.max((maxWidth - width) / adjustableCount, TYPESET_MIN_SPACING_SQUEEZE);
            if (width + spacing * adjustableCount <= maxWidth + 1) {
                return { type: "spacing", spacing };
            }
        }
    }

    const scale = Math.max(maxWidth / width, TYPESET_MAX_SCALE_SQUEEZE);
    return { type: "scale", scale };
}

function getSingleLineAdjustment(tokens, width, maxWidth, { minSpacing = TYPESET_MIN_SPACING_SQUEEZE, minScale = TYPESET_MAX_SCALE_SQUEEZE } = {}) {
    if (width <= maxWidth) return null;

    const adjustableCount = getTypesetSpacingTargetCount(tokens);
    if (adjustableCount > 0) {
        const spacing = (maxWidth - width) / adjustableCount;
        if (spacing >= minSpacing) {
            return { type: "spacing", spacing };
        }
    }

    const scale = maxWidth / width;
    if (scale >= minScale) {
        return { type: "scale", scale };
    }

    return false;
}

function getJustifyTypesetLineAdjustment(line, maxWidth) {
    if (!line || line.adjustment || line.forcedBreakAfter || line.width <= 0 || line.width >= maxWidth) return null;
    if (line.width / maxWidth < TYPESET_MIN_JUSTIFY_FILL_RATIO) return null;

    const adjustableCount = getTypesetSpacingTargetCount(line.tokens);
    if (adjustableCount <= 0) return null;

    const spacing = (maxWidth - line.width) / adjustableCount;
    if (spacing <= 0 || spacing > TYPESET_MAX_JUSTIFY_SPACING) return null;

    return { type: "spacing", spacing };
}

function justifyTypesetLines(lines, maxWidth) {
    lines.forEach((line, index) => {
        if (index === lines.length - 1) return;

        const adjustment = getJustifyTypesetLineAdjustment(line, maxWidth);
        if (adjustment) {
            line.adjustment = adjustment;
        }
    });

    return lines;
}

function rebuildJustifyAdjustments(lines, maxWidth) {
    return lines.map((line) => ({
        ...line,
        adjustment: line.adjustment && line.adjustment.type === "scale"
            ? line.adjustment
            : null
    })).map((line, index, nextLines) => {
        if (index === nextLines.length - 1) return line;

        const adjustment = getJustifyTypesetLineAdjustment(line, maxWidth);
        return adjustment ? { ...line, adjustment } : line;
    });
}

function getTypesetSegmentFitEnd(tokens, start, end, maxWidth, measureRange) {
    if (start >= end) return start;
    if (measureRange(start, end) <= maxWidth) return end;

    let low = start + 1;
    let high = end;
    let fitEnd = start + 1;

    while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        const width = measureRange(start, mid);

        if (width <= maxWidth) {
            fitEnd = mid;
            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }

    return fitEnd;
}

function buildTypesetLines(tokens, root, maxWidth, { strategy = TYPESET_ADJUST_STRATEGY, justify = false, forceDomMeasure = false } = {}) {
    const lines = [];
    let segmentStart = null;
    const measureRange = createTypesetRangeMeasurer(tokens, root, { forceDomMeasure });

    function pushLine(start, end, { forcedBreakAfter = false } = {}) {
        const lineTokens = tokens.slice(start, end);
        const width = measureRange(start, end);
        lines.push({
            tokens: lineTokens,
            width,
            adjustment: adjustTypesetLine(lineTokens, width, maxWidth, strategy),
            forcedBreakAfter
        });
    }

    function pushEmptyLine({ forcedBreakAfter = false } = {}) {
        lines.push({
            tokens: [],
            width: 0,
            adjustment: null,
            forcedBreakAfter
        });
    }

    function pushSegment(start, end, { forcedBreakAfter = false } = {}) {
        if (start === null || end <= start) {
            pushEmptyLine({ forcedBreakAfter });
            return;
        }

        let lineStart = start;

        while (lineStart < end) {
            let lineEnd = getTypesetSegmentFitEnd(tokens, lineStart, end, maxWidth, measureRange);

            if (lineEnd < end && lineEnd > lineStart) {
                const overflowingToken = tokens[lineEnd];
                const currentLastToken = tokens[lineEnd - 1];

                if (isTypesetForbiddenLineStart(overflowingToken) || isTypesetForbiddenLineEnd(currentLastToken)) {
                    lineEnd += 1;

                    while (lineEnd < end && isTypesetForbiddenLineStart(tokens[lineEnd])) {
                        lineEnd += 1;
                    }
                }
            }

            if (lineEnd <= lineStart) {
                lineEnd = lineStart + 1;
            }

            pushLine(lineStart, lineEnd, { forcedBreakAfter: forcedBreakAfter && lineEnd >= end });
            lineStart = lineEnd;
        }
    }

    tokens.forEach((token, index) => {
        if (token.break) {
            pushSegment(segmentStart, index, { forcedBreakAfter: true });
            segmentStart = null;
            return;
        }

        if (segmentStart === null) {
            segmentStart = index;
        }
    });

    if (segmentStart !== null || !lines.length) {
        pushSegment(segmentStart, tokens.length);
    }

    return justify ? justifyTypesetLines(lines, maxWidth) : lines;
}

function renderTypesetLines(element, lines) {
    const fragment = document.createDocumentFragment();
    const includeShadow = element.matches(".posterYear");
    const align = normalizeTextAlign(window.getComputedStyle(element).textAlign);

    lines.forEach((line) => {
        const lineElement = createTypesetLineElement(line.tokens, line.adjustment, { includeShadow, align });
        if (line.forcedBreakAfter) {
            lineElement.dataset.typesetForcedBreakAfter = "true";
        }
        fragment.appendChild(lineElement);
    });

    element.innerHTML = "";
    element.classList.add("typesetText");
    element.appendChild(fragment);
    containTypesetLineOverflows(element);
}

function applyRenderedJustifySpacing(element) {
    if (!element || !element.matches(".info div, .info p")) return;

    const lines = Array.from(element.querySelectorAll(".typesetLine"));
    lines.forEach((line, index) => {
        if (index >= lines.length - 1 || line.dataset.typesetForcedBreakAfter === "true") return;

        const inner = line.querySelector(".typesetLineInner");
        if (!inner) return;

        const spacingTargets = Array.from(inner.querySelectorAll(".typesetToken")).filter((token, tokenIndex, tokens) => {
            return tokenIndex < tokens.length - 1 && isTypesetSpacingTarget({ text: token.textContent || "" });
        });
        if (!spacingTargets.length) return;

        const tokens = Array.from(inner.querySelectorAll(".typesetToken"));
        const lastToken = tokens.length ? tokens[tokens.length - 1] : null;
        if (!lastToken) return;

        clearRenderedLineAdjustment(tokens, spacingTargets);

        let spacing = 0;
        for (let pass = 0; pass < TYPESET_RENDERED_JUSTIFY_MAX_PASSES; pass += 1) {
            const gap = getRenderedLineRightGap(line, lastToken);
            if (!Number.isFinite(gap) || Math.abs(gap) <= TYPESET_RENDERED_JUSTIFY_EDGE_TOLERANCE) break;

            const nextSpacing = clampRenderedJustifySpacing(spacing + gap / spacingTargets.length);
            if (!Number.isFinite(nextSpacing) || Math.abs(nextSpacing - spacing) < 0.02) break;

            spacing = nextSpacing;
            applyTokenSpacing(spacingTargets, spacing);
        }

        containTrailingPunctuationOverflow(line, lastToken);
    });
}

function clearRenderedLineAdjustment(tokens, spacingTargets) {
    spacingTargets.forEach((token) => {
        token.style.marginRight = "";
    });

    tokens.forEach((token) => {
        token.style.position = "";
        token.style.left = "";
    });
}

function applyTokenSpacing(tokens, spacing) {
    tokens.forEach((token) => {
        token.style.marginRight = spacing ? `${spacing}px` : "";
    });
}

function clampRenderedJustifySpacing(spacing) {
    return Math.max(
        TYPESET_MIN_SPACING_SQUEEZE,
        Math.min(TYPESET_MAX_RENDERED_JUSTIFY_SPACING, spacing)
    );
}

function getRenderedLineRightGap(line, lastToken) {
    const lineRect = line.getBoundingClientRect();
    const tokenRect = lastToken.getBoundingClientRect();
    return lineRect.right - tokenRect.right;
}

function getInlineScaleX(element) {
    const transform = (element && element.style && element.style.transform) || "";
    const match = transform.match(/scaleX\(([^)]+)\)/);
    if (!match) return 1;

    const scale = parseFloat(match[1]);
    return Number.isFinite(scale) && scale > 0 ? scale : 1;
}

function applyInlineScaleX(element, scale) {
    if (!element || !Number.isFinite(scale) || scale <= 0) return;

    element.style.transform = scale === 1 ? "" : `scaleX(${scale})`;
}

function getCurrentMarginRight(element) {
    const value = parseFloat((element && element.style && element.style.marginRight) || "0");
    return Number.isFinite(value) ? value : 0;
}

function getLineTrailingOverflow(line, token) {
    if (!line || !token) return 0;

    const lineRect = line.getBoundingClientRect();
    const tokenRect = token.getBoundingClientRect();
    const overflow = tokenRect.right - lineRect.right;
    return Number.isFinite(overflow) ? overflow : 0;
}

function isTypesetTrailingPunctuation(text) {
    const chars = Array.from(String(text || ""));
    if (!chars.length) return false;

    const char = chars[chars.length - 1];
    if (/[\u3001\u3002\uff0c\uff0e\uff1a\uff1b\uff01\uff1f\uff09\uff3d\uff5d\u3009\u300b\u300d\u300f\u3011\u3015\u3017\u3019\u301b\u2019\u201d.,!?:;)\]}]/.test(char)) return true;
    return TYPESET_FORBIDDEN_LINE_START.has(char) || /[，。！？、：；）】》」』”’.,!?:;)\]}]/.test(char);
}

function containTrailingPunctuationOverflow(line, token) {
    if (!line || !token || !isTypesetTrailingPunctuation(token.textContent)) return;

    token.style.position = "";
    token.style.left = "";

    let overflow = getLineTrailingOverflow(line, token);
    if (overflow <= TYPESET_TRAILING_PUNCTUATION_EDGE_TOLERANCE) return;

    const inner = line.querySelector(".typesetLineInner");
    const tokens = inner ? Array.from(inner.querySelectorAll(".typesetToken")) : [];
    const spacingTargets = tokens.filter((item, index) => {
        return index < tokens.length - 1 && isTypesetSpacingTarget({ text: item.textContent || "" });
    });

    if (spacingTargets.length) {
        const extraSpacing = overflow / spacingTargets.length;
        spacingTargets.forEach((item) => {
            const nextSpacing = Math.max(
                getCurrentMarginRight(item) - extraSpacing,
                TYPESET_TRAILING_PUNCTUATION_MIN_SPACING
            );
            item.style.marginRight = nextSpacing ? `${nextSpacing}px` : "";
        });

        overflow = getLineTrailingOverflow(line, token);
        if (overflow <= TYPESET_TRAILING_PUNCTUATION_EDGE_TOLERANCE) return;
    }

    if (inner) {
        const innerRect = inner.getBoundingClientRect();
        const lineRect = line.getBoundingClientRect();
        const currentScale = getInlineScaleX(inner);
        const targetScale = innerRect.width > 0
            ? Math.max(currentScale * (lineRect.width / innerRect.width), TYPESET_TRAILING_PUNCTUATION_MIN_SCALE)
            : currentScale;

        if (targetScale < currentScale) {
            applyInlineScaleX(inner, targetScale);
            overflow = getLineTrailingOverflow(line, token);
            if (overflow <= TYPESET_TRAILING_PUNCTUATION_EDGE_TOLERANCE) return;
        }
    }

    const fontSize = parseFloat(window.getComputedStyle(token).fontSize || "0");
    const maxShift = Number.isFinite(fontSize) && fontSize > 0 ? fontSize * 0.45 : 8;
    const shift = Math.min(overflow, maxShift);

    token.style.position = "relative";
    token.style.left = `${-shift}px`;
}

function containTypesetLineOverflows(element) {
    Array.from((element && element.querySelectorAll(".typesetLine")) || []).forEach((line) => {
        const tokens = Array.from(line.querySelectorAll(".typesetToken"));
        const lastToken = tokens.length ? tokens[tokens.length - 1] : null;
        containTrailingPunctuationOverflow(line, lastToken);
    });
}

function getRenderedJustifySpacingNeed(element) {
    if (!element || !element.matches(".info div, .info p")) return null;

    const lines = Array.from(element.querySelectorAll(".typesetLine"));
    let maxSpacing = 0;
    let overLimitCount = 0;
    let checkedLineCount = 0;

    lines.forEach((line, index) => {
        if (index >= lines.length - 1 || line.dataset.typesetForcedBreakAfter === "true") return;

        const inner = line.querySelector(".typesetLineInner");
        if (!inner) return;

        const spacingTargetCount = Array.from(inner.querySelectorAll(".typesetToken")).filter((token, tokenIndex, tokens) => {
            return tokenIndex < tokens.length - 1 && isTypesetSpacingTarget({ text: token.textContent || "" });
        }).length;
        if (!spacingTargetCount) return;

        const lineWidth = line.getBoundingClientRect().width;
        const innerWidth = inner.getBoundingClientRect().width;
        const gap = lineWidth - innerWidth;
        if (!Number.isFinite(gap) || gap <= 1) return;

        const spacing = gap / spacingTargetCount;
        if (!Number.isFinite(spacing) || spacing <= 0) return;

        checkedLineCount += 1;
        maxSpacing = Math.max(maxSpacing, spacing);
        if (spacing > TYPESET_MAX_RENDERED_JUSTIFY_SPACING) {
            overLimitCount += 1;
        }
    });

    return {
        checkedLineCount,
        overLimitCount,
        maxSpacing
    };
}

function getRenderedTypesetFillRatio(element, maxWidth) {
    if (!element || !maxWidth) return null;

    const ratios = Array.from(element.querySelectorAll(".typesetLine")).map((line, index, lines) => {
        if (index >= lines.length - 1) return null;

        const inner = line.querySelector(".typesetLineInner");
        if (!inner) return null;

        const width = inner.getBoundingClientRect().width;
        if (!Number.isFinite(width) || width <= 0 || width > maxWidth) return null;

        return width / maxWidth;
    }).filter((ratio) => ratio !== null);

    if (ratios.length < 3) return null;

    ratios.sort((a, b) => a - b);
    return ratios[Math.floor(ratios.length / 2)];
}

function hasOverflowingTypesetLine(element, maxWidth) {
    const tolerance = 1;

    return Array.from((element && element.querySelectorAll(".typesetLineInner")) || [])
        .some((line) => line.getBoundingClientRect().width > maxWidth + tolerance);
}

function typesetTextElement(element, { strategy = TYPESET_ADJUST_STRATEGY, justify = false } = {}) {
    if (!element || !element.textContent.trim()) return;

    const tokens = collectTypesetTokens(element);
    const maxWidth = getTypesetAvailableWidth(element);
    const options = { strategy, justify };
    const shouldUseMobileRenderedJustify = justify
        && typeof isMobileViewport === "function"
        && isMobileViewport()
        && element.matches(".info div, .info p");

    if (shouldUseMobileRenderedJustify) {
        let calibration = 1;
        const maxCalibration = Math.max(1, TYPESET_MOBILE_MAX_WIDTH_CALIBRATION);

        for (let attempt = 0; attempt < 4; attempt += 1) {
            const calibratedLines = buildTypesetLines(tokens, element, maxWidth * calibration, {
                ...options,
                justify: false
            });
            renderTypesetLines(element, calibratedLines);

            const renderedFillRatio = getRenderedTypesetFillRatio(element, maxWidth);
            const spacingNeed = getRenderedJustifySpacingNeed(element);
            const needsFillCalibration = renderedFillRatio && renderedFillRatio < TYPESET_MOBILE_MIN_RENDERED_FILL_RATIO;
            const needsSpacingCalibration = spacingNeed
                && spacingNeed.overLimitCount > 0
                && spacingNeed.maxSpacing > TYPESET_MAX_RENDERED_JUSTIFY_SPACING;

            if ((!needsFillCalibration && !needsSpacingCalibration) || calibration >= maxCalibration) {
                break;
            }

            const fillCalibration = needsFillCalibration
                ? Math.max(calibration, 1 / renderedFillRatio)
                : calibration;
            const spacingCalibration = needsSpacingCalibration
                ? calibration * Math.min(spacingNeed.maxSpacing / TYPESET_MAX_RENDERED_JUSTIFY_SPACING, 1.18)
                : calibration;
            const nextCalibration = Math.min(maxCalibration, Math.max(fillCalibration, spacingCalibration));

            if (nextCalibration <= calibration + 0.01) {
                break;
            }

            calibration = nextCalibration;
        }

        applyRenderedJustifySpacing(element);
        return;
    }

    const lines = buildTypesetLines(tokens, element, maxWidth, options);
    renderTypesetLines(element, lines);

    if (tokens.length > 160 && hasOverflowingTypesetLine(element, maxWidth)) {
        renderTypesetLines(
            element,
            buildTypesetLines(tokens, element, maxWidth, {
                ...options,
                forceDomMeasure: true
            })
        );
    }
}

function typesetSingleLineFirstElement(element, options = {}) {
    if (!element || !element.textContent.trim()) return;

    const tokens = collectTypesetTokens(element);
    if (tokens.some((token) => token.break)) {
        typesetTextElement(element, options);
        return;
    }

    const maxWidth = getTypesetAvailableWidth(element);
    const width = measureTypesetTokens(tokens, element);
    const adjustment = getSingleLineAdjustment(tokens, width, maxWidth, options);

    if (adjustment === false) {
        typesetTextElement(element, options);
        return;
    }

    element.innerHTML = "";
    element.classList.add("typesetText");
    element.appendChild(createTypesetLineElement(tokens, adjustment, {
        align: window.getComputedStyle(element).textAlign
    }));
}

function applyPosterTypesetting(poster = document.getElementById("poster")) {
    const year = getPosterPart(poster, "year");
    const subtitle = getPosterPart(poster, "subtitle");
    const cards = getPosterPart(poster, "cards");

    typesetTextElement(year);

    if (subtitlePosition !== "verticalLeft") {
        typesetSingleLineFirstElement(subtitle, {
            minSpacing: SUBTITLE_MIN_SINGLE_LINE_SPACING,
            minScale: SUBTITLE_MIN_SINGLE_LINE_SCALE
        });
    }

    if (cards) {
        cards.querySelectorAll(".card").forEach(applyCardTypesetting);
    }
}

function applyCardTypesetting(card) {
    if (!card) return;

    card.querySelectorAll(".cardTitle").forEach((element) => typesetTextElement(element));
    card.querySelectorAll(".info > div, .info > p").forEach((element) => {
        typesetTextElement(element, { justify: !element.classList.contains("contentHeading") });
    });
}

function getPhoneRenderSignature() {
    const yearInput = document.getElementById("yearInput");
    const sideInput = document.getElementById("sideInput");
    const subtitleInputElement = document.getElementById("subtitleInput");
    const resolution = phoneResolutions[phoneResolution] || phoneResolutions["1080x2376"];

    return JSON.stringify({
        globalFont,
        data,
        backgroundColor,
        textColor,
        fontFamily,
        yearFontFamily,
        subtitleFontFamily,
        sideFontFamily,
        yearTextAlign,
        subtitleTextAlign,
        lineSpacing,
        paragraphSpacing,
        sideSpacing,
        paragraphTitleSpacing,
        moduleSpacing,
        topPadding,
        sideHeaderReserve,
        showTimeline,
        showMonthTitles,
        showMonthUnderlines,
        showParagraphDividers,
        showSideHeader,
        showYearShadow,
        showBottomWatermark,
        subtitlePosition,
        phoneResolution,
        phoneCssWidth: getPhoneExportCssWidth(resolution),
        year: (yearInput && yearInput.value) || "",
        side: (sideInput && sideInput.value) || "",
        subtitle: (subtitleInputElement && subtitleInputElement.value) || ""
    });
}

function setPosterSharedState(poster, previewFontScale = getPreviewFontScale()) {
    if (!poster) return;

    applyPosterContainerState(poster);

    const year = getPosterPart(poster, "year");
    const side = getPosterPart(poster, "side");
    const subtitle = getPosterPart(poster, "subtitle");
    const copyright = getPosterPart(poster, "copyright");
    const yearInput = document.getElementById("yearInput");
    const sideInput = document.getElementById("sideInput");
    const subtitleInputElement = document.getElementById("subtitleInput");

    if (year) {
        year.innerText = (yearInput && yearInput.value) || "";
        year.dataset.shadowText = (yearInput && yearInput.value) || "";
        year.style.fontFamily = resolveYearFontFamily();
        year.style.color = textColor;
        year.style.fontSize = `${globalFont.year * previewFontScale}px`;
        applyTextAlign(year, yearTextAlign);
        year.classList.remove("typesetText");
    }

    if (subtitle) {
        subtitle.innerText = (subtitleInputElement && subtitleInputElement.value) || "";
        subtitle.style.fontFamily = resolveSubtitleFontFamily();
        subtitle.style.color = textColor;
        applySubtitleSettings(subtitle, previewFontScale);
        applyTextAlign(subtitle, subtitlePosition === "verticalLeft" ? "left" : subtitleTextAlign);
        subtitle.classList.remove("typesetText");
        renderVerticalTextTarget("subtitle", (subtitleInputElement && subtitleInputElement.value) || "", poster);
    }

    if (side) {
        side.innerText = (sideInput && sideInput.value) || "";
        side.style.fontFamily = resolveSideFontFamily();
        side.style.color = textColor;
        side.style.fontSize = `${globalFont.side * previewFontScale}px`;
        renderVerticalTextTarget("side", (sideInput && sideInput.value) || "", poster);
    }

    if (copyright) {
        copyright.style.fontSize = `${BASE_COPYRIGHT_FONT_SIZE * getResolutionDesignScale()}px`;
        copyright.style.display = showBottomWatermark ? "" : "none";
    }

    renderPosterCards(poster, previewFontScale);
}

async function ensurePhoneRenderLayout() {
    const sourcePoster = document.getElementById("poster");
    if (!sourcePoster) return null;

    const resolution = phoneResolutions[phoneResolution] || phoneResolutions["1080x2376"];
    const width = getPhoneExportCssWidth(resolution);
    const signature = getPhoneRenderSignature();
    if (phoneRenderPoster && phoneRenderLayoutSignature === signature) {
        return phoneRenderPoster;
    }

    if (phoneRenderLayoutPromise) {
        const pendingLayout = phoneRenderLayoutPromise;
        await pendingLayout;
        if (phoneRenderLayoutPromise === pendingLayout) {
            phoneRenderLayoutPromise = null;
        }
        return ensurePhoneRenderLayout();
    }

    const layoutPromise = (async () => {
        if (document.fonts && document.fonts.ready) {
            await document.fonts.ready;
        }

        const host = document.getElementById("phoneRenderHost");
        if (!host) {
            throw new Error("未找到手机排版容器。");
        }
        host.style.width = `${width}px`;
        const nextPoster = sourcePoster.cloneNode(true);
        nextPoster.classList.add("phoneRenderPoster");
        nextPoster.style.width = `${width}px`;
        nextPoster.style.minHeight = "0";
        nextPoster.style.backgroundColor = backgroundColor;
        nextPoster.removeAttribute("id");
        nextPoster.querySelectorAll("[id]").forEach((element) => element.removeAttribute("id"));

        host.replaceChildren(nextPoster);
        setPosterSharedState(nextPoster);
        await waitForPosterImagesLoaded(nextPoster);
        syncHeadlineTextWidths(nextPoster);
        applyPosterTypesetting(nextPoster);
        syncCardsOffset(nextPoster);

        phoneRenderPoster = nextPoster;
        phoneRenderLayoutSignature = signature;
        return nextPoster;
    })();
    phoneRenderLayoutPromise = layoutPromise;

    try {
        return await layoutPromise;
    } finally {
        if (phoneRenderLayoutPromise === layoutPromise) {
            phoneRenderLayoutPromise = null;
        }
    }
}

function syncCardsOffset(poster = document.getElementById("poster")) {
    const cards = getPosterPart(poster, "cards");
    const side = getPosterPart(poster, "side");
    const subtitle = getPosterPart(poster, "subtitle");
    const header = getPosterPart(poster, "header");

    if (!poster || !cards || !side) return;

    if (subtitle) {
        applySubtitleSettings(subtitle);
    }

    cards.style.marginTop = "0px";

    if (!showSideHeader) {
        poster.style.removeProperty("--subtitle-vertical-right");
        poster.style.removeProperty("--subtitle-vertical-top");
        return;
    }

    const posterRect = poster.getBoundingClientRect();
    let subtitleRect = subtitle ? subtitle.getBoundingClientRect() : null;
    const headerRect = header ? header.getBoundingClientRect() : null;
    const sideRect = side.getBoundingClientRect();
    if (subtitlePosition === "verticalLeft" && subtitle) {
        const subtitleSettings = getSubtitleSettings(getPreviewFontScale(), subtitle);
        const initialSubtitleTop = Math.max(sideRect.bottom - subtitleRect.height - posterRect.top, 0);
        const subtitleRight = Math.max(posterRect.right - sideRect.left + subtitleSettings.gapToSideTitlePx, 0);
        poster.style.setProperty("--subtitle-vertical-top", `${initialSubtitleTop}px`);
        poster.style.setProperty("--subtitle-vertical-right", `${subtitleRight}px`);
        subtitleRect = subtitle.getBoundingClientRect();

        const sideTextRect = getElementTextBounds(side);
        const subtitleTextRect = getElementTextBounds(subtitle);
        if (sideTextRect && subtitleTextRect) {
            const subtitleTop = Math.max(
                initialSubtitleTop + sideTextRect.bottom - subtitleTextRect.bottom + subtitleSettings.verticalBottomAlignOffsetPx,
                0
            );
            poster.style.setProperty("--subtitle-vertical-top", `${subtitleTop}px`);
        }

        subtitleRect = subtitle.getBoundingClientRect();
    } else {
        poster.style.removeProperty("--subtitle-vertical-top");
        poster.style.removeProperty("--subtitle-vertical-right");
    }
    const safeGap = 24;
    const baseTop = subtitlePosition === "verticalLeft"
        ? (headerRect ? headerRect.bottom : posterRect.top + 40)
        : (subtitleRect ? subtitleRect.bottom : posterRect.top + 40);
    const headerBottom = subtitlePosition === "verticalLeft" && subtitleRect
        ? Math.max(sideRect.bottom, subtitleRect.bottom)
        : sideRect.bottom;
    const requiredGap = Math.max(headerBottom - baseTop + safeGap, 0);

    cards.style.marginTop = `${requiredGap}px`;
}

function getElementTextBounds(element) {
    if (!element) return null;

    const range = document.createRange();
    range.selectNodeContents(element);

    const rects = Array.from(range.getClientRects())
        .filter((rect) => rect.width > 0 && rect.height > 0);
    range.detach();

    if (!rects.length) return null;

    return rects.reduce((bounds, rect) => ({
        top: Math.min(bounds.top, rect.top),
        right: Math.max(bounds.right, rect.right),
        bottom: Math.max(bounds.bottom, rect.bottom),
        left: Math.min(bounds.left, rect.left)
    }), {
        top: rects[0].top,
        right: rects[0].right,
        bottom: rects[0].bottom,
        left: rects[0].left
    });
}

const ROTATED_VERTICAL_MARKS = new Set(Array.from("【】（）()《》〈〉「」『』[]［］{}｛｝〔〕：/；:;"));
const VERTICAL_BRACKET_EDGE_OFFSET_EM = 0.18;
const VERTICAL_PARENTHESIS_ADJUSTMENTS = {
    "【": { xEm: 0, yEm: -VERTICAL_BRACKET_EDGE_OFFSET_EM },
    "（": { xEm: 0.1, yEm: -VERTICAL_BRACKET_EDGE_OFFSET_EM },
    "(": { xEm: 0.1, yEm: -VERTICAL_BRACKET_EDGE_OFFSET_EM },
    "《": { xEm: 0, yEm: -VERTICAL_BRACKET_EDGE_OFFSET_EM },
    "〈": { xEm: 0, yEm: -VERTICAL_BRACKET_EDGE_OFFSET_EM },
    "「": { xEm: 0, yEm: -VERTICAL_BRACKET_EDGE_OFFSET_EM },
    "『": { xEm: 0, yEm: -VERTICAL_BRACKET_EDGE_OFFSET_EM },
    "[": { xEm: 0, yEm: -VERTICAL_BRACKET_EDGE_OFFSET_EM },
    "［": { xEm: 0, yEm: -VERTICAL_BRACKET_EDGE_OFFSET_EM },
    "{": { xEm: 0, yEm: -VERTICAL_BRACKET_EDGE_OFFSET_EM },
    "｛": { xEm: 0, yEm: -VERTICAL_BRACKET_EDGE_OFFSET_EM },
    "〔": { xEm: 0, yEm: -VERTICAL_BRACKET_EDGE_OFFSET_EM },
    "】": { xEm: 0, yEm: VERTICAL_BRACKET_EDGE_OFFSET_EM },
    "）": { xEm: 0.1, yEm: VERTICAL_BRACKET_EDGE_OFFSET_EM  },
    ")": { xEm: 0, yEm: VERTICAL_BRACKET_EDGE_OFFSET_EM },
    "》": { xEm: 0, yEm: VERTICAL_BRACKET_EDGE_OFFSET_EM },
    "〉": { xEm: 0, yEm: VERTICAL_BRACKET_EDGE_OFFSET_EM },
    "」": { xEm: 0, yEm: VERTICAL_BRACKET_EDGE_OFFSET_EM },
    "』": { xEm: 0, yEm: VERTICAL_BRACKET_EDGE_OFFSET_EM },
    "]": { xEm: 0, yEm: VERTICAL_BRACKET_EDGE_OFFSET_EM },
    "］": { xEm: 0, yEm: VERTICAL_BRACKET_EDGE_OFFSET_EM },
    "}": { xEm: 0, yEm: VERTICAL_BRACKET_EDGE_OFFSET_EM },
    "｝": { xEm: 0, yEm: VERTICAL_BRACKET_EDGE_OFFSET_EM },
    "〕": { xEm: 0, yEm: VERTICAL_BRACKET_EDGE_OFFSET_EM }
};

const VERTICAL_TEXT_TARGETS = {
    side: {
        elementId: "side",
        inputId: "sideInput",
        isPreviewActive: () => true,
        isExportActive: (poster) => !poster.classList.contains("hideSideHeader")
    },
    subtitle: {
        elementId: "subtitle",
        inputId: "subtitleInput",
        applySettings: (element) => applySubtitleSettings(element),
        isPreviewActive: () => subtitlePosition === "verticalLeft",
        isExportActive: (poster) => poster.classList.contains("subtitleVerticalLeft")
    }
};

function shouldRotateVerticalChar(char) {
    return ROTATED_VERTICAL_MARKS.has(char) || /^[A-Za-z0-9!-~]$/.test(char);
}

function getVerticalParenthesisAdjustment(char) {
    return VERTICAL_PARENTHESIS_ADJUSTMENTS[char] || null;
}

function createVerticalTextLayout(value) {
    const columns = String(value == null ? "" : value)
        .split("\n")
        .map((line) => {
            const chars = Array.from(line || " ").map((char) => {
                const parenthesisAdjustment = getVerticalParenthesisAdjustment(char);

                return {
                    char,
                    rotate: shouldRotateVerticalChar(char),
                    parenthesisAdjustment
                };
            });

            return { chars };
        });

    return {
        columns,
        maxRows: Math.max(1, ...columns.map((column) => column.chars.length))
    };
}

function createVerticalTextCharElement(doc, charInfo, className = "verticalTextChar") {
    const span = doc.createElement("span");
    span.textContent = charInfo.char;
    const classes = [className];
    if (charInfo.rotate) {
        classes.push("rotateVerticalChar");
    }
    if (charInfo.parenthesisAdjustment) {
        classes.push("adjustVerticalParenthesisChar");
        span.style.setProperty("--vertical-parenthesis-offset-x", `${charInfo.parenthesisAdjustment.xEm}em`);
        span.style.setProperty("--vertical-parenthesis-offset-y", `${charInfo.parenthesisAdjustment.yEm}em`);
    }
    span.className = classes.join(" ");
    return span;
}

function renderVerticalTextFlow(element, value, doc = document) {
    if (!element) return;

    const layout = createVerticalTextLayout(value);
    element.classList.remove("typesetText");
    element.innerHTML = "";

    layout.columns.forEach((column) => {
        const line = doc.createElement("span");
        line.className = "verticalTextLine";

        column.chars.forEach((charInfo) => {
            line.appendChild(createVerticalTextCharElement(doc, charInfo));
        });

        element.appendChild(line);
    });
}

function getVerticalTextTargetConfig(target) {
    return typeof target === "string" ? VERTICAL_TEXT_TARGETS[target] : target;
}

function getVerticalTextTargetValue(config, fallbackElement = null) {
    const input = document.getElementById(config.inputId);
    if (input && input.value != null) return input.value;
    if (fallbackElement && fallbackElement.innerText != null) return fallbackElement.innerText;
    return "";
}

function renderVerticalTextTarget(target, value = null, poster = document.getElementById("poster")) {
    const config = getVerticalTextTargetConfig(target);
    if (!config) return;

    const element = getPosterPart(poster, config.elementId === "side" ? "side" : "subtitle");
    if (!element) return;

    if (typeof config.applySettings === "function") {
        config.applySettings(element);
    }

    const text = value == null ? getVerticalTextTargetValue(config, element) : value;
    if (typeof config.isPreviewActive === "function" && !config.isPreviewActive()) {
        if (element.innerText !== text) {
            element.innerText = text;
        }
        return;
    }

    renderVerticalTextFlow(element, text);
}

function applyVerticalTextExportContainerStyles(clone, metrics) {
    clone.style.visibility = "visible";
    clone.style.position = "absolute";
    clone.style.display = "block";
    clone.style.flexDirection = "initial";
    clone.style.alignItems = "initial";
    clone.style.writingMode = "horizontal-tb";
    clone.style.textOrientation = "mixed";
    clone.style.whiteSpace = "normal";
    clone.style.overflow = "visible";
    clone.style.width = `${metrics.width}px`;
    clone.style.height = `${metrics.height}px`;
    clone.style.color = metrics.color;
    clone.innerHTML = "";
}

function applyVerticalTextExportCharStyles(span, charInfo, metrics, columnIndex, rowIndex, topOffset) {
    const centerX = metrics.width - metrics.fontSize / 2 - columnIndex * metrics.columnAdvance;
    const centerY = topOffset + metrics.fontSize / 2 + rowIndex * metrics.charAdvance;

    span.removeAttribute("class");
    span.style.position = "absolute";
    span.style.left = `${centerX - metrics.fontSize / 2}px`;
    span.style.top = `${centerY - metrics.fontSize / 2}px`;
    span.style.width = `${metrics.fontSize}px`;
    span.style.height = `${metrics.fontSize}px`;
    span.style.display = "inline-flex";
    span.style.alignItems = "center";
    span.style.justifyContent = "center";
    span.style.margin = "0";
    span.style.padding = "0";
    span.style.color = metrics.color;
    span.style.fontFamily = metrics.fontFamily;
    span.style.fontSize = metrics.fontSizeText;
    span.style.fontWeight = metrics.fontWeight;
    span.style.fontStyle = metrics.fontStyle;
    span.style.writingMode = "horizontal-tb";
    span.style.textOrientation = "mixed";
    span.style.lineHeight = "1";
    span.style.letterSpacing = "0";
    span.style.transformOrigin = "center center";

    if (charInfo.parenthesisAdjustment) {
        span.style.left = `${centerX - metrics.fontSize / 2 + charInfo.parenthesisAdjustment.xEm * metrics.fontSize}px`;
        span.style.top = `${centerY - metrics.fontSize / 2 + charInfo.parenthesisAdjustment.yEm * metrics.fontSize}px`;
    }

    if (charInfo.rotate) {
        span.style.transform = "rotate(90deg)";
    }
}

function getVerticalTextExportMetrics(source, clone, clonedDoc) {
    const sourceRect = source.getBoundingClientRect();
    const sourceStyle = window.getComputedStyle(source);
    const cloneStyle = clonedDoc.defaultView.getComputedStyle(clone);
    const fontSize = parseFloat(sourceStyle.fontSize || cloneStyle.fontSize || "48");
    const lineHeightValue = parseFloat(sourceStyle.lineHeight || cloneStyle.lineHeight || "");
    const letterSpacingValue = parseFloat(sourceStyle.letterSpacing || cloneStyle.letterSpacing || "");
    const letterSpacing = Number.isFinite(letterSpacingValue) ? letterSpacingValue : 0;

    return {
        fontSize,
        fontSizeText: sourceStyle.fontSize,
        fontFamily: sourceStyle.fontFamily,
        fontWeight: sourceStyle.fontWeight,
        fontStyle: sourceStyle.fontStyle,
        color: sourceStyle.color || textColor,
        width: Math.max(sourceRect.width, fontSize),
        height: Math.max(sourceRect.height, fontSize),
        columnAdvance: Number.isFinite(lineHeightValue) ? lineHeightValue : fontSize * 1.2,
        charAdvance: fontSize + Math.max(letterSpacing, 0)
    };
}

function renderVerticalTextAbsolute(clone, value, metrics, clonedDoc) {
    const layout = createVerticalTextLayout(value);
    applyVerticalTextExportContainerStyles(clone, metrics);

    layout.columns.forEach((column, columnIndex) => {
        const topOffset = Math.max(layout.maxRows - column.chars.length, 0) * metrics.charAdvance;

        column.chars.forEach((charInfo, rowIndex) => {
            const span = createVerticalTextCharElement(clonedDoc, charInfo);
            applyVerticalTextExportCharStyles(span, charInfo, metrics, columnIndex, rowIndex, topOffset);
            clone.appendChild(span);
        });
    });
}

function renderVerticalTextCloneElement(sourcePoster, clonedPoster, clonedDoc, target) {
    const config = getVerticalTextTargetConfig(target);
    if (!config) return;

    const part = config.elementId === "side" ? "side" : "subtitle";
    const source = getPosterPart(sourcePoster, part);
    const clone = getPosterPart(clonedPoster, part);
    if (!source || !clone || window.getComputedStyle(source).display === "none") return;

    const text = getVerticalTextTargetValue(config, source);
    if (!text.trim()) return;

    renderVerticalTextAbsolute(
        clone,
        text,
        getVerticalTextExportMetrics(source, clone, clonedDoc),
        clonedDoc
    );
}

function renderVerticalTextForExport(sourcePoster, clonedPoster, clonedDoc) {
    if (!clonedPoster) return;

    Object.values(VERTICAL_TEXT_TARGETS).forEach((config) => {
        if (typeof config.isExportActive === "function" && !config.isExportActive(clonedPoster)) return;
        renderVerticalTextCloneElement(sourcePoster, clonedPoster, clonedDoc, config);
    });
}
