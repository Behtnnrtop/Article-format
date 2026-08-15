/* ===========================
   State
=========================== */

const STORAGE_KEY = "article-summary-state";
const STATE_SCHEMA_VERSION = 12;

let globalFont = {
    year: 78,  // 标题
    subtitle: 42,  // 副标题
    side: 128   //竖排
};

let backgroundColor = "#efefef";
let backgroundImageDataUrl = "";
let backgroundImageName = "";
let backgroundImageBlendEdge = 0;
let textColor = "#111111";
let fontFamily = '"Microsoft YaHei",sans-serif';
const CARD_TITLE_DEFAULT_FONT_FAMILY = '"Songti SC","STSong","SimSun",serif';
const INHERIT_FONT_VALUE = "__inherit__";
let yearFontFamily = INHERIT_FONT_VALUE;
let subtitleFontFamily = INHERIT_FONT_VALUE;
let sideFontFamily = INHERIT_FONT_VALUE;
let lineSpacing = 1.8;
let paragraphSpacing = 0;
let sideSpacing = 0;
let paragraphTitleSpacing = 0;
let moduleSpacing = 58;
let topPadding = 58;
let sideHeaderReserve = 0;
let showTimeline = true;
let showMonthTitles = true;
let showMonthUnderlines = true;
let showSideHeader = true;
let showBottomWatermark = true;
let showPhonePreview = false;
let phoneResolution = "1080x2376";
let phonePreviewScale = 1;
let subtitlePosition = "belowTitle";
const MAX_PREVIEW_FONT_SCALE = 0.42;
const MIN_PREVIEW_FONT_SCALE = 0.32;
const BASE_COPYRIGHT_FONT_SIZE = 13;
const BASE_RESOLUTION_WIDTH = 1080;
const MAX_BACKGROUND_IMAGE_FILE_SIZE = 6 * 1024 * 1024;
const MAX_BACKGROUND_IMAGE_BLEND_EDGE = 0;
const SUBTITLE_SETTINGS = Object.freeze({
    fontFamily: "inherit",
    fontWeight: "400",
    fontStyle: "normal",
    lineHeight: 1.2,
    desktop: {
        letterSpacingEm: 0.55,
        gapToTitlePx: 20,
        inlineTitleIndentPx: 18
    },
    mobile: {
        letterSpacingEm: 0.28,
        gapToTitlePx: 15,
        inlineTitleIndentPx: 12
    },
    verticalBottomAlignOffsetPx: -5
});

const phoneResolutions = {
    "1080x2376": { width: 1080, height: 2376, cssWidth: 360 },
    "1170x2532": { width: 1170, height: 2532, cssWidth: 390 },
    "1290x2796": { width: 1290, height: 2796, cssWidth: 430 },
    "1080x2400": { width: 1080, height: 2400, cssWidth: 360 }
};
let activeMobileEditorPanel = "style";

function getViewportSize() {
    const viewport = window.visualViewport;

    return {
        width: viewport?.width || window.innerWidth,
        height: viewport?.height || window.innerHeight
    };
}

function isMobileViewport() {
    return window.matchMedia("(max-width: 768px), (pointer: coarse) and (max-width: 1024px)").matches;
}

function applyResponsiveViewport() {
    const { width, height } = getViewportSize();
    const root = document.documentElement;

    root.style.setProperty("--app-viewport-height", `${height}px`);

    if (!isMobileViewport()) {
        root.style.removeProperty("--mobile-poster-width");
        root.style.removeProperty("--mobile-preview-height");
        return;
    }

    root.style.setProperty("--mobile-poster-width", `${Math.round(width)}px`);
    root.style.setProperty("--mobile-preview-height", `${Math.round(height * 0.58)}px`);
}

function setMobileEditorPanel(panelName = "style") {
    const nextPanel = ["style", "text", "blocks", "export"].includes(panelName) ? panelName : "style";
    activeMobileEditorPanel = nextPanel;

    document.querySelectorAll("[data-mobile-tab]").forEach((tab) => {
        const isActive = tab.dataset.mobileTab === nextPanel;
        tab.classList.toggle("active", isActive);
        tab.setAttribute("aria-selected", String(isActive));
    });

    document.querySelectorAll("[data-mobile-panel]").forEach((panel) => {
        panel.classList.toggle("mobilePanelActive", panel.dataset.mobilePanel === nextPanel);
    });
}

function getPreviewFontScale() {
    const resolution = phoneResolutions[phoneResolution] || phoneResolutions["1080x2376"];
    const resolutionScale = resolution.cssWidth / resolution.width;

    return Math.min(Math.max(resolutionScale, MIN_PREVIEW_FONT_SCALE), MAX_PREVIEW_FONT_SCALE);
}

function getResolutionDesignScale() {
    const resolution = phoneResolutions[phoneResolution] || phoneResolutions["1080x2376"];
    return resolution.width / BASE_RESOLUTION_WIDTH;
}

function getSubtitleSettings(previewFontScale = getPreviewFontScale()) {
    const responsiveSettings = isMobileViewport()
        ? SUBTITLE_SETTINGS.mobile
        : SUBTITLE_SETTINGS.desktop;
    const fontSizePx = globalFont.subtitle * previewFontScale;
    const letterSpacingEm = responsiveSettings.letterSpacingEm;

    return {
        fontFamily: SUBTITLE_SETTINGS.fontFamily,
        fontWeight: SUBTITLE_SETTINGS.fontWeight,
        fontStyle: SUBTITLE_SETTINGS.fontStyle,
        lineHeight: SUBTITLE_SETTINGS.lineHeight,
        fontSizePx,
        letterSpacing: `${letterSpacingEm}em`,
        verticalLetterSpacing: `${letterSpacingEm}em`,
        gapToTitlePx: responsiveSettings.gapToTitlePx,
        gapToSideTitlePx: responsiveSettings.gapToTitlePx,
        inlineTitleIndentPx: responsiveSettings.inlineTitleIndentPx,
        verticalBottomAlignOffsetPx: SUBTITLE_SETTINGS.verticalBottomAlignOffsetPx
    };
}

function applySubtitleSettings(element, previewFontScale = getPreviewFontScale()) {
    if (!element) return null;

    const settings = getSubtitleSettings(previewFontScale);
    element.style.setProperty("--subtitle-font-family", settings.fontFamily);
    element.style.setProperty("--subtitle-font-size", `${settings.fontSizePx}px`);
    element.style.setProperty("--subtitle-font-weight", settings.fontWeight);
    element.style.setProperty("--subtitle-font-style", settings.fontStyle);
    element.style.setProperty("--subtitle-line-height", String(settings.lineHeight));
    element.style.setProperty("--subtitle-letter-spacing", settings.letterSpacing);
    element.style.setProperty("--subtitle-gap-to-title", `${settings.gapToTitlePx}px`);
    element.style.setProperty("--subtitle-title-indent", `${settings.inlineTitleIndentPx}px`);
    element.style.setProperty("--vertical-text-letter-spacing", settings.verticalLetterSpacing);

    return settings;
}

const presetColors = [
    "#ffffff",
    "#d9d9d9",
    "#a6a6a6",
    "#4a4a4a",
    "#4f7cff",
    "#3bb76f",
    "#f5b400",
    "#f46363",
    "#a45adf"
];

const customColorPicker = document.getElementById("customColorPicker");
const backgroundImageInput = document.getElementById("backgroundImageInput");
const textColorPicker = document.getElementById("textColorPicker");
const subtitleInput = document.getElementById("subtitleInput");
const sideSpacingInput = document.getElementById("sideSpacingInput");
const paragraphTitleSpacingInput = document.getElementById("paragraphTitleSpacingInput");
const moduleSpacingInput = document.getElementById("moduleSpacingInput");
const topPaddingInput = document.getElementById("topPaddingInput");
const sideHeaderReserveInput = document.getElementById("sideHeaderReserveInput");

const fallbackFontOptions = [
    { label: "默认字体", value: '"Microsoft YaHei",sans-serif' },
    { label: "宋体", value: 'SimSun,"Songti SC","STSong",serif' }
];

let fontOptions = [...fallbackFontOptions];

const chineseFontLabels = new Map([
    ["microsoft yahei", "微软雅黑"],
    ["microsoft yahei ui", "微软雅黑 UI"],
    ["microsoft jhenghei", "微软正黑体"],
    ["microsoft jhenghei ui", "微软正黑体 UI"],
    ["simsun", "宋体"],
    ["simsun-extb", "宋体 ExtB"],
    ["simsun-extg", "宋体 ExtG"],
    ["nsimsun", "新宋体"],
    ["simhei", "黑体"],
    ["simkai", "楷体"],
    ["kaiti", "楷体"],
    ["fangsong", "仿宋"],
    ["dengxian", "等线"],
    ["dengxian light", "等线 Light"],
    ["youyuan", "幼圆"],
    ["lishu", "隶书"],
    ["stkaiti", "华文楷体"],
    ["stxingkai", "华文行楷"],
    ["stfangsong", "华文仿宋"],
    ["stxihei", "华文细黑"],
    ["stheiti", "华文黑体"],
    ["stsong", "华文宋体"],
    ["stzhongsong", "华文中宋"],
    ["stcaiyun", "华文彩云"],
    ["sthupo", "华文琥珀"],
    ["stliti", "华文隶书"],
    ["stxinwei", "华文新魏"],
    ["fzbiaosong-z05", "方正标宋"],
    ["fzshuti", "方正舒体"],
    ["fzyaoti", "方正姚体"],
    ["source han sans sc", "思源黑体"],
    ["source han serif sc", "思源宋体"],
    ["noto sans cjk sc", "Noto Sans CJK 简体中文"],
    ["noto serif cjk sc", "Noto Serif CJK 简体中文"],
    ["noto sans sc", "Noto Sans 简体中文"],
    ["noto serif sc", "Noto Serif 简体中文"],
    ["pingfang sc", "苹方"],
    ["hiragino sans gb", "冬青黑体简体中文"],
    ["songti sc", "宋体-简"],
    ["heiti sc", "黑体-简"],
    ["kaiti sc", "楷体-简"],
    ["weibei sc", "魏碑-简"],
    ["xingkai sc", "行楷-简"],
    ["yuanti sc", "圆体-简"],
    ["lxgw wenkai", "霞鹜文楷"],
    ["lxgw wenkai screen", "霞鹜文楷屏幕版"],
    ["lxgw marker gothic", "霞鹜漫黑"]
]);

let data = [
    {
        title: "段落一",
        text: "Loading...",
        titleSize: 70,  // 段落标题
        textSize: 48,   // 段落内容
        titleFontFamily: CARD_TITLE_DEFAULT_FONT_FAMILY,
        contentFontFamily: INHERIT_FONT_VALUE,
        contentFontToolbarValue: INHERIT_FONT_VALUE,
        hidden: false,
        lineSpacing: 1.8,
        paragraphSpacing: 0
    },
    {
        title: "段落二",
        text: "Loading...",
        titleSize: 70,
        textSize: 48,
        titleFontFamily: CARD_TITLE_DEFAULT_FONT_FAMILY,
        contentFontFamily: INHERIT_FONT_VALUE,
        contentFontToolbarValue: INHERIT_FONT_VALUE,
        hidden: false,
        lineSpacing: 1.8,
        paragraphSpacing: 0
    }
];

let editorWidth = null;
let editorCollapsed = false;
let phonePreviewFrame = null;
let isInitializing = true;
let editorRenderFrame = null;
let backgroundImageCanvasCache = {
    src: "",
    promise: null,
    image: null
};
const richTextSelections = new Map();

function loadState() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;

        const state = JSON.parse(raw);
        if (!state || typeof state !== "object") return;

        if (state.globalFont && typeof state.globalFont === "object") {
            globalFont = { ...globalFont, ...state.globalFont };
        }

        if (Array.isArray(state.data) && state.data.length > 0) {
            data = normalizeData(state.data, state.schemaVersion);
        }

        if (typeof state.editorWidth === "number") {
            editorWidth = state.editorWidth;
        }

        if (typeof state.editorCollapsed === "boolean") {
            editorCollapsed = state.editorCollapsed;
        }

        if (typeof state.backgroundColor === "string") {
            backgroundColor = state.backgroundColor;
        }

        if (typeof state.backgroundImageDataUrl === "string") {
            backgroundImageDataUrl = state.backgroundImageDataUrl;
        }

        if (typeof state.backgroundImageName === "string") {
            backgroundImageName = state.backgroundImageName;
        }

        if (typeof state.backgroundImageBlendEdge === "number") {
            backgroundImageBlendEdge = Math.min(Math.max(state.backgroundImageBlendEdge, 0), MAX_BACKGROUND_IMAGE_BLEND_EDGE);
        }

        if (typeof state.textColor === "string") {
            textColor = state.textColor;
        }

        if (typeof state.yearFontFamily === "string") {
            yearFontFamily = state.yearFontFamily;
        }

        if (typeof state.subtitleFontFamily === "string") {
            subtitleFontFamily = state.subtitleFontFamily;
        }

        if (typeof state.sideFontFamily === "string") {
            sideFontFamily = state.sideFontFamily;
        }

        if (typeof state.lineSpacing === "number") {
            lineSpacing = state.lineSpacing;
        }

        if (typeof state.paragraphSpacing === "number") {
            paragraphSpacing = state.paragraphSpacing;
        }

        if (typeof state.sideSpacing === "number") {
            sideSpacing = state.sideSpacing;
        } else if (Array.isArray(state.data) && typeof state.data[0]?.sideSpacing === "number") {
            sideSpacing = state.data[0].sideSpacing;
        }

        if (typeof state.paragraphTitleSpacing === "number") {
            paragraphTitleSpacing = state.paragraphTitleSpacing;
        }

        if (typeof state.moduleSpacing === "number") {
            moduleSpacing = state.moduleSpacing;
        } else if (typeof state.paragraphSpacing === "number") {
            moduleSpacing = state.paragraphSpacing;
            paragraphSpacing = 0;
        }

        if (typeof state.topPadding === "number") {
            topPadding = state.topPadding;
        }
        if (typeof state.sideHeaderReserve === "number") {
            sideHeaderReserve = state.sideHeaderReserve;
        }

        data = data.map((item) => ({
            ...item,
            lineSpacing: typeof item.lineSpacing === "number" ? item.lineSpacing : lineSpacing,
            paragraphSpacing: typeof item.paragraphSpacing === "number" ? item.paragraphSpacing : paragraphSpacing
        }));

        if (typeof state.subtitle === "string") {
            const subtitleEl = document.getElementById("subtitle");
            if (subtitleEl) {
                subtitleEl.innerText = state.subtitle;
            }
        }

        if (typeof state.yearTitle === "string") {
            const yearInput = document.getElementById("yearInput");
            if (yearInput) {
                yearInput.value = state.yearTitle;
            }
        }

        if (typeof state.sideHeader === "string") {
            const sideInput = document.getElementById("sideInput");
            if (sideInput) {
                sideInput.value = state.sideHeader;
            }
        }

        if (typeof state.showTimeline === "boolean") {
            showTimeline = state.showTimeline;
        }
        if (typeof state.showMonthTitles === "boolean") {
            showMonthTitles = state.showMonthTitles;
        }
        if (typeof state.showMonthUnderlines === "boolean") {
            showMonthUnderlines = state.showMonthUnderlines;
        }
        if (typeof state.showSideHeader === "boolean") {
            showSideHeader = state.showSideHeader;
        }
        if (typeof state.showBottomWatermark === "boolean") {
            showBottomWatermark = state.showBottomWatermark;
        }
        if (typeof state.showPhonePreview === "boolean") {
            showPhonePreview = state.showPhonePreview;
        }
        if (typeof state.phoneResolution === "string" && phoneResolutions[state.phoneResolution]) {
            phoneResolution = state.phoneResolution;
        }
        if (typeof state.phonePreviewScale === "number") {
            phonePreviewScale = Math.min(Math.max(state.phonePreviewScale, 0.75), 2);
        }
        if (["belowTitle", "verticalLeft"].includes(state.subtitlePosition)) {
            subtitlePosition = state.subtitlePosition;
        }
    } catch (error) {
        // Ignore malformed or unavailable storage.
    }
}

function normalizeData(items, schemaVersion) {
    const shouldNormalizeFontSizes = !schemaVersion || schemaVersion < 4;
    const shouldEscapeText = !schemaVersion || schemaVersion < 5;

    return items.map((item) => {
        const titleSize = typeof item.titleSize === "number" ? item.titleSize : 48;
        const textSize = typeof item.textSize === "number" ? item.textSize : 18;
        const text = typeof item.text === "string" ? item.text : "";

        return {
            ...item,
            text: shouldEscapeText ? plainTextToRichText(text) : sanitizeRichText(text),
            titleSize: shouldNormalizeFontSizes ? Math.max(titleSize, 48) : titleSize,
            textSize: shouldNormalizeFontSizes ? Math.max(textSize, 18) : textSize,
            titleFontFamily: typeof item.titleFontFamily === "string" ? item.titleFontFamily : CARD_TITLE_DEFAULT_FONT_FAMILY,
            contentFontFamily: typeof item.contentFontFamily === "string" ? item.contentFontFamily : INHERIT_FONT_VALUE,
            contentFontToolbarValue: typeof item.contentFontToolbarValue === "string"
                ? item.contentFontToolbarValue
                : (typeof item.contentFontFamily === "string" ? item.contentFontFamily : INHERIT_FONT_VALUE),
            hidden: item.hidden === true
        };
    });
}

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function plainTextToRichText(value) {
    return escapeHtml(value).replace(/\n/g, "<br>");
}

function sanitizeRichText(value) {
    const template = document.createElement("template");
    template.innerHTML = String(value ?? "");

    const allowedTags = new Set(["B", "STRONG", "I", "EM", "U", "S", "STRIKE", "BR", "DIV", "P", "SPAN"]);

    function cleanNode(node) {
        Array.from(node.childNodes).forEach((child) => {
            if (child.nodeType !== Node.ELEMENT_NODE) return;

            cleanNode(child);

            if (child.tagName === "FONT") {
                const fontFamilyValue = sanitizeFontFamilyValue(child.getAttribute("face"));

                if (fontFamilyValue) {
                    const span = document.createElement("span");
                    span.style.fontFamily = fontFamilyValue;
                    span.append(...Array.from(child.childNodes));
                    child.replaceWith(span);
                } else {
                    child.replaceWith(...Array.from(child.childNodes));
                }
                return;
            }

            if (!allowedTags.has(child.tagName)) {
                child.replaceWith(...Array.from(child.childNodes));
                return;
            }

            if (child.tagName === "SPAN") {
                const fontFamilyValue = sanitizeFontFamilyValue(child.style.fontFamily);
                Array.from(child.attributes).forEach((attribute) => {
                    child.removeAttribute(attribute.name);
                });

                if (fontFamilyValue) {
                    child.style.fontFamily = fontFamilyValue;
                } else {
                    child.replaceWith(...Array.from(child.childNodes));
                }
                return;
            }

            Array.from(child.attributes).forEach((attribute) => child.removeAttribute(attribute.name));
        });
    }

    cleanNode(template.content);
    return template.innerHTML;
}

function hasBoldAncestor(node, boundary) {
    let current = node.parentNode;

    while (current && current !== boundary) {
        if (current.nodeType === Node.ELEMENT_NODE && ["B", "STRONG"].includes(current.tagName)) {
            return true;
        }

        current = current.parentNode;
    }

    return false;
}

function isParagraphTitleElement(element) {
    if (!element.textContent.trim()) return false;

    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    let current = walker.nextNode();

    while (current) {
        if (current.textContent.trim() && !hasBoldAncestor(current, element)) {
            return false;
        }

        current = walker.nextNode();
    }

    return true;
}

function renderPreviewBlock(element) {
    const className = isParagraphTitleElement(element) ? ' class="contentHeading"' : "";
    return `<div${className}>${element.innerHTML || "<br>"}</div>`;
}

function ensurePosterBackgroundCanvas(poster) {
    if (!poster) return null;

    let canvas = poster.querySelector(".posterBackgroundCanvas");
    if (!canvas) {
        canvas = document.createElement("canvas");
        canvas.className = "posterBackgroundCanvas";
        canvas.setAttribute("aria-hidden", "true");
        poster.prepend(canvas);
    }

    return canvas;
}

async function syncPosterBackgroundCanvas(poster) {
    const canvas = ensurePosterBackgroundCanvas(poster);
    if (!canvas) return;

    if (!backgroundImageDataUrl) {
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

    await drawFullSliceBackground(ctx, width, height);
}

function schedulePosterBackgroundSync(poster = document.getElementById("poster")) {
    if (!poster) return;

    if (posterBackgroundSyncFrame !== null) {
        cancelAnimationFrame(posterBackgroundSyncFrame);
    }

    posterBackgroundSyncFrame = requestAnimationFrame(() => {
        posterBackgroundSyncFrame = null;
        syncPosterBackgroundCanvas(poster);
    });
}

function syncPreviewExportActionsPosition() {
    const preview = document.getElementById("preview");
    if (!preview) return;

    const previewRect = preview.getBoundingClientRect();
    const rightInset = Math.max(18, Math.round(window.innerWidth - previewRect.right + 18));
    document.documentElement.style.setProperty("--preview-actions-right", `${rightInset}px`);
}

function ensurePhoneBackgroundCanvas(screen) {
    if (!screen) return null;

    let canvas = screen.querySelector(".phoneBackgroundCanvas");
    if (!canvas) {
        canvas = document.createElement("canvas");
        canvas.className = "phoneBackgroundCanvas";
        canvas.setAttribute("aria-hidden", "true");
        screen.prepend(canvas);
    }

    return canvas;
}

async function syncPhoneBackgroundCanvas(screen, resolution = null) {
    const canvas = ensurePhoneBackgroundCanvas(screen);
    if (!canvas) return;

    if (!backgroundImageDataUrl) {
        canvas.hidden = true;
        return;
    }

    const width = Math.max(1, Math.round(resolution?.width || screen.clientWidth || screen.getBoundingClientRect().width || 0));
    const height = Math.max(1, Math.round(resolution?.height || screen.clientHeight || screen.getBoundingClientRect().height || 0));

    canvas.hidden = false;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    await drawFullSliceBackground(ctx, width, height);
}

function getItemLineSpacing(item) {
    return typeof item.lineSpacing === "number" ? item.lineSpacing : lineSpacing;
}

function getItemParagraphSpacing(item) {
    return typeof item.paragraphSpacing === "number" ? item.paragraphSpacing : paragraphSpacing;
}

function renderRichTextPreview(value) {
    const template = document.createElement("template");
    template.innerHTML = sanitizeRichText(value);

    const paragraphs = [];
    let paragraph = document.createElement("div");

    Array.from(template.content.childNodes).forEach((child) => {
        if (child.nodeType === Node.ELEMENT_NODE && ["P", "DIV"].includes(child.tagName)) {
            if (paragraph.childNodes.length) {
                paragraphs.push(paragraph);
                paragraph = document.createElement("div");
            }

            paragraphs.push(child.cloneNode(true));
            return;
        }

        if (child.nodeType === Node.ELEMENT_NODE && child.tagName === "BR") {
            paragraphs.push(paragraph);
            paragraph = document.createElement("div");
            return;
        }

        paragraph.appendChild(child.cloneNode(true));
    });

    paragraphs.push(paragraph);

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
const TYPESET_MIN_JUSTIFY_FILL_RATIO = 0.72;
const SUBTITLE_MIN_SINGLE_LINE_SPACING = -18;
const SUBTITLE_MIN_SINGLE_LINE_SCALE = 0.82;
const PREVIEW_RENDER_DELAY_MS = 180;
const DIVIDER_DRAG_RENDER_DELAY_MS = 160;
const STARTUP_TYPESET_IDLE_TIMEOUT_MS = 700;
const TYPESETTING_OVERLAY_DELAY_MS = 0;
const TYPESETTING_OVERLAY_MIN_VISIBLE_MS = 0;
const STATE_SAVE_DEBOUNCE_MS = 350;

let typesetMeasureLayer = null;
let pendingPreviewRenderTimer = null;
let pendingPreviewRenderCallback = null;
const pendingCardPreviewIndexes = new Set();
let pendingPosterTypesetTask = null;
let pendingTypesettingOverlayTimer = null;
let pendingTypesettingOverlayHideTimer = null;
let typesettingOverlayShownAt = 0;
let posterTypesettingOverlay = null;
let posterBackgroundSyncFrame = null;
let pendingStateSaveTimer = null;
let lastSavedStateJson = "";
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
    const style = window.getComputedStyle(element.nodeType === Node.ELEMENT_NODE ? element : root);
    return {
        fontFamily: style.fontFamily,
        fontSize: style.fontSize,
        fontWeight: style.fontWeight,
        fontStyle: style.fontStyle,
        fontVariant: style.fontVariant,
        fontStretch: style.fontStretch,
        letterSpacing: style.letterSpacing,
        textDecorationLine: style.textDecorationLine,
        textDecorationStyle: style.textDecorationStyle,
        textDecorationColor: style.textDecorationColor,
        color: style.color
    };
}

function applyTypesetTokenStyle(element, style) {
    Object.entries(style).forEach(([property, value]) => {
        if (value) {
            element.style[property] = value;
        }
    });
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

    Array.from(node.childNodes).forEach((child) => collectTypesetTokens(root, child, tokens));
    return tokens;
}

function createTypesetLineElement(tokens, adjustment = null) {
    const line = document.createElement("span");
    const inner = document.createElement("span");
    line.className = "typesetLine";
    inner.className = "typesetLineInner";

    if (adjustment?.type === "scale") {
        inner.style.transform = `scaleX(${adjustment.scale})`;
    }

    tokens.forEach((token, index) => {
        const span = document.createElement("span");
        span.className = "typesetToken";
        span.textContent = token.text === " " ? "\u00a0" : token.text;
        applyTypesetTokenStyle(span, token.style);

        if (adjustment?.type === "spacing" && index < tokens.length - 1 && isTypesetSpacingTarget(token)) {
            span.style.marginRight = `${adjustment.spacing}px`;
        }

        inner.appendChild(span);
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
    const value = parseFloat(style?.letterSpacing || "0");
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
        if (!token?.text) {
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

function createTypesetRangeMeasurer(tokens, root) {
    if (tokens.length > 160) {
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

async function flushPendingPreviewRender() {
    if (pendingPreviewRenderTimer === null) return;

    const callback = pendingPreviewRenderCallback || renderPreview;
    cancelPendingPreviewRender();
    await callback();
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

function getTypesetAvailableWidth(element) {
    const style = window.getComputedStyle(element);
    const padding = parseFloat(style.paddingLeft || "0") + parseFloat(style.paddingRight || "0");
    const ownWidth = element.getBoundingClientRect().width - padding;
    const parentWidth = element.parentElement
        ? element.parentElement.getBoundingClientRect().width - padding
        : ownWidth;

    return Math.max(1, Math.min(ownWidth || parentWidth, parentWidth || ownWidth));
}

function syncHeadlineTextWidths() {
    const poster = document.getElementById("poster");
    const side = document.getElementById("side");
    const subtitle = document.getElementById("subtitle");
    if (!poster) return;

    const posterStyle = window.getComputedStyle(poster);
    const paddingLeft = parseFloat(posterStyle.paddingLeft || "0");
    const paddingRight = parseFloat(posterStyle.paddingRight || "0");
    const contentWidth = Math.max(1, poster.clientWidth - paddingLeft - paddingRight);
    let rightLimit = contentWidth - sideSpacing;

    if (showSideHeader && side && window.getComputedStyle(side).display !== "none") {
        const posterRect = poster.getBoundingClientRect();
        const sideRect = side.getBoundingClientRect();
        const sideLeftInContent = sideRect.left - posterRect.left - paddingLeft;
        rightLimit = sideLeftInContent - sideSpacing;
    }

    const titleMaxWidth = Math.max(1, rightLimit - sideSpacing);
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
    return token?.text && TYPESET_FORBIDDEN_LINE_START.has(token.text);
}

function isTypesetForbiddenLineEnd(token) {
    return token?.text && TYPESET_FORBIDDEN_LINE_END.has(token.text);
}

function isTypesetSpacingTarget(token) {
    return token?.text && !/\s/.test(token.text);
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

function buildTypesetLines(tokens, root, maxWidth, { strategy = TYPESET_ADJUST_STRATEGY, justify = false } = {}) {
    const lines = [];
    let segmentStart = null;
    const measureRange = createTypesetRangeMeasurer(tokens, root);

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

function typesetTextElement(element, { strategy = TYPESET_ADJUST_STRATEGY, justify = false } = {}) {
    if (!element || !element.textContent.trim()) return;

    const tokens = collectTypesetTokens(element);
    const maxWidth = getTypesetAvailableWidth(element);
    const lines = buildTypesetLines(tokens, element, maxWidth, { strategy, justify });
    const fragment = document.createDocumentFragment();

    lines.forEach((line) => {
        fragment.appendChild(createTypesetLineElement(line.tokens, line.adjustment));
    });

    element.innerHTML = "";
    element.classList.add("typesetText");
    element.appendChild(fragment);
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
    element.appendChild(createTypesetLineElement(tokens, adjustment));
}

function applyPosterTypesetting() {
    typesetTextElement(document.getElementById("year"));

    if (subtitlePosition !== "verticalLeft") {
        typesetSingleLineFirstElement(document.getElementById("subtitle"), {
            minSpacing: SUBTITLE_MIN_SINGLE_LINE_SPACING,
            minScale: SUBTITLE_MIN_SINGLE_LINE_SCALE
        });
    }

    document.querySelectorAll(".card").forEach(applyCardTypesetting);
}

function applyCardTypesetting(card) {
    if (!card) return;

    card.querySelectorAll(".cardTitle").forEach((element) => typesetTextElement(element));
    card.querySelectorAll(".info > div, .info > p").forEach((element) => {
        typesetTextElement(element, { justify: !element.classList.contains("contentHeading") });
    });
}

function autoResizeTextarea(element) {
    if (!element) return;

    element.style.height = "auto";
    element.style.height = `${element.scrollHeight}px`;
}

function buildPersistedState() {
    return {
        globalFont,
        data,
        editorWidth,
        editorCollapsed,
        backgroundColor,
        backgroundImageDataUrl,
        backgroundImageName,
        backgroundImageBlendEdge,
        textColor,
        yearFontFamily,
        subtitleFontFamily,
        sideFontFamily,
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
        showSideHeader,
        showBottomWatermark,
        showPhonePreview,
        phoneResolution,
        phonePreviewScale,
        subtitlePosition,
        yearTitle: document.getElementById("yearInput")?.value ?? "输入标题",
        sideHeader: document.getElementById("sideInput")?.value ?? "输入竖排标题",
        subtitle: document.getElementById("subtitleInput")?.value ?? "作者：",
        schemaVersion: STATE_SCHEMA_VERSION
    };
}

function commitStateSave() {
    if (isInitializing) return;

    try {
        const json = JSON.stringify(buildPersistedState());
        if (json === lastSavedStateJson) return;

        localStorage.setItem(STORAGE_KEY, json);
        lastSavedStateJson = json;
    } catch (error) {
        // Ignore storage quota or availability issues.
    }
}

function saveState({ immediate = false } = {}) {
    if (isInitializing) return;

    if (pendingStateSaveTimer !== null) {
        window.clearTimeout(pendingStateSaveTimer);
        pendingStateSaveTimer = null;
    }

    if (immediate) {
        commitStateSave();
        return;
    }

    pendingStateSaveTimer = window.setTimeout(() => {
        pendingStateSaveTimer = null;
        commitStateSave();
    }, STATE_SAVE_DEBOUNCE_MS);
}

function flushPendingStateSave() {
    if (pendingStateSaveTimer === null) return;

    window.clearTimeout(pendingStateSaveTimer);
    pendingStateSaveTimer = null;
    commitStateSave();
}

function quoteCssFontFamily(value) {
    return `"${String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function normalizeFontFamilyName(value) {
    return String(value ?? "")
        .replace(/^["']|["']$/g, "")
        .trim()
        .toLowerCase();
}

function normalizeFontFamilyForCompare(value) {
    return String(value ?? "")
        .replace(/["']/g, "")
        .replace(/\s+/g, "")
        .toLowerCase();
}

function getPrimaryFontFamily(value) {
    return String(value ?? "")
        .split(",")[0]
        .replace(/^["']|["']$/g, "")
        .trim();
}

function getAllowedFontFamilyValues() {
    return [
        fontFamily,
        yearFontFamily,
        subtitleFontFamily,
        sideFontFamily,
        CARD_TITLE_DEFAULT_FONT_FAMILY,
        ...fontOptions.map((option) => option.value)
    ];
}

function sanitizeFontFamilyValue(value) {
    const normalizedValue = normalizeFontFamilyForCompare(value);
    if (!normalizedValue) return "";

    const knownValue = getAllowedFontFamilyValues().find((allowedValue) => {
        const normalizedAllowed = normalizeFontFamilyForCompare(allowedValue);
        const normalizedAllowedPrimary = normalizeFontFamilyForCompare(getPrimaryFontFamily(allowedValue));

        return normalizedValue === normalizedAllowed || normalizedValue === normalizedAllowedPrimary;
    });

    if (knownValue) return knownValue;

    const rawValue = String(value).trim();
    return /^[\u4e00-\u9fff\w\s"',.\-]+$/.test(rawValue) ? rawValue : "";
}

function getFontDisplayLabel(family, fullNames = []) {
    const normalizedFamily = normalizeFontFamilyName(family);
    const localizedName = fullNames.find((name) => /[\u4e00-\u9fff]/.test(name));

    return chineseFontLabels.get(normalizedFamily) || localizedName || family;
}

function resolveCardTitleFontFamily(item) {
    return item?.titleFontFamily || CARD_TITLE_DEFAULT_FONT_FAMILY;
}

function resolvePosterTextFontFamily(value) {
    return value && value !== INHERIT_FONT_VALUE ? value : fontFamily;
}

function resolveYearFontFamily() {
    return resolvePosterTextFontFamily(yearFontFamily);
}

function resolveSubtitleFontFamily() {
    return resolvePosterTextFontFamily(subtitleFontFamily);
}

function resolveSideFontFamily() {
    return resolvePosterTextFontFamily(sideFontFamily);
}

function resolveCardContentFontFamily(item) {
    return item?.contentFontFamily && item.contentFontFamily !== INHERIT_FONT_VALUE
        ? item.contentFontFamily
        : fontFamily;
}

function renderFontOptionElements(selectedValue, extraOptions = []) {
    const optionMap = new Map();

    [...extraOptions, ...fontOptions].forEach((option) => {
        if (!option?.value || optionMap.has(option.value)) return;
        optionMap.set(option.value, option);
    });

    if (selectedValue && selectedValue !== INHERIT_FONT_VALUE && !optionMap.has(selectedValue)) {
        optionMap.set(selectedValue, { label: "当前字体", value: selectedValue });
    }

    return Array.from(optionMap.values())
        .map((option) => {
            const optionValue = escapeHtml(option.value);
            const fontStyle = option.value === INHERIT_FONT_VALUE ? fontFamily : option.value;
            const selected = option.value === selectedValue ? " selected" : "";

            return `<option value="${optionValue}" style="font-family:${escapeHtml(fontStyle)};"${selected}>${escapeHtml(option.label)}</option>`;
        })
        .join("");
}

function setFontStatus(message) {
    const fontStatus = document.getElementById("fontStatus");
    if (fontStatus) {
        fontStatus.innerText = message;
    }
}

async function loadSystemFonts() {
    const loadFontsBtn = document.getElementById("loadFontsBtn");

    if (!("queryLocalFonts" in window)) {
        setFontStatus("当前浏览器不支持读取本机字体，请使用新版 Chrome 或 Edge。手机端不支持。");
        return;
    }

    try {
        if (loadFontsBtn) {
            loadFontsBtn.disabled = true;
            loadFontsBtn.innerText = "读取中...";
        }
        setFontStatus("正在请求本机字体权限...");

        const fonts = await window.queryLocalFonts();
        const fontGroups = new Map();

        fonts.forEach((font) => {
            if (!font.family) return;

            if (!fontGroups.has(font.family)) {
                fontGroups.set(font.family, []);
            }

            if (font.fullName) {
                fontGroups.get(font.family).push(font.fullName);
            }
        });

        const systemFontOptions = Array.from(fontGroups.entries())
            .map(([family, fullNames]) => ({
                label: getFontDisplayLabel(family, fullNames),
                value: quoteCssFontFamily(family)
            }))
            .sort((a, b) => a.label.localeCompare(b.label, "zh-Hans-CN"));

        const fallbackValues = new Set(fallbackFontOptions.map((option) => option.value));
        fontOptions = [
            ...fallbackFontOptions,
            ...systemFontOptions.filter((option) => !fallbackValues.has(option.value))
        ];

        renderEditor();
        setFontStatus(`已读取 ${systemFontOptions.length} 个本机字体。`);
    } catch (error) {
        const denied = error && (error.name === "NotAllowedError" || error.name === "SecurityError");
        setFontStatus(denied ? "没有获得本机字体权限，已保留默认字体列表。" : "读取本机字体失败，已保留默认字体列表。");
    } finally {
        if (loadFontsBtn) {
            loadFontsBtn.disabled = false;
            loadFontsBtn.innerText = "读取本机字体";
        }
    }
}

/* ===========================
   Render
=========================== */

function renderPreviewCard(item, index, previewFontScale = getPreviewFontScale()) {
    const titleText = escapeHtml(item.title);
    const textHtml = renderRichTextPreview(item.text);
    const itemLineSpacing = getItemLineSpacing(item);
    const itemParagraphSpacing = getItemParagraphSpacing(item);

    return `
        <div class="card" data-card-index="${index}">
            <div class="cardTitle" style="font-size:${item.titleSize * previewFontScale}px;font-family:${escapeHtml(resolveCardTitleFontFamily(item))};">${titleText}</div>
            <div class="cardContent">
                <div class="info" style="font-size:${item.textSize * previewFontScale}px;font-family:${escapeHtml(resolveCardContentFontFamily(item))};--content-line-height:${itemLineSpacing};--content-paragraph-spacing:${itemParagraphSpacing}px;">${textHtml}</div>
            </div>
        </div>
        `;
}

function renderPreviewCardByIndex(index) {
    const item = data[index];
    const existingCard = document.querySelector(`#cards .card[data-card-index="${index}"]`);

    if (!item || item.hidden || !existingCard) {
        renderPreview();
        return;
    }

    const template = document.createElement("template");
    template.innerHTML = renderPreviewCard(item, index).trim();
    const nextCard = template.content.firstElementChild;

    if (!nextCard) {
        renderPreview();
        return;
    }

    existingCard.replaceWith(nextCard);
    applyCardTypesetting(nextCard);
    syncCardsOffset();
    schedulePhonePreviewSync();
    schedulePosterBackgroundSync(document.getElementById("poster"));
    saveState();
}

function flushPendingCardPreviewRenders() {
    const indexes = Array.from(pendingCardPreviewIndexes);
    pendingCardPreviewIndexes.clear();

    indexes.forEach(renderPreviewCardByIndex);
}

function scheduleCardPreviewRender(index) {
    pendingCardPreviewIndexes.add(index);
    schedulePreviewRender(PREVIEW_RENDER_DELAY_MS, flushPendingCardPreviewRenders);
}

function scheduleDeferredFullPreviewRender(delay = PREVIEW_RENDER_DELAY_MS) {
    schedulePreviewRender(delay, () => renderPreview({ deferTypesetting: true }));
}

function renderHeaderInputPreview() {
    cancelDeferredPosterTypesetting();

    const previewFontScale = getPreviewFontScale();
    const yearElement = document.getElementById("year");
    const yearInput = document.getElementById("yearInput");
    const subtitleElement = document.getElementById("subtitle");
    const sideElement = document.getElementById("side");

    if (yearElement && yearInput) {
        const yearText = yearInput.value;
        yearElement.classList.remove("typesetText");
        yearElement.innerText = yearText;
        yearElement.dataset.shadowText = yearText;
        yearElement.style.fontFamily = resolveYearFontFamily();
        yearElement.style.color = textColor;
        yearElement.style.fontSize = globalFont.year * previewFontScale + "px";
    }

    if (subtitleElement) {
        subtitleElement.classList.remove("typesetText");
        subtitleElement.style.fontFamily = resolveSubtitleFontFamily();
        subtitleElement.style.color = textColor;
        applySubtitleSettings(subtitleElement, previewFontScale);
        renderVerticalTextTarget("subtitle");
    }

    if (sideElement) {
        sideElement.style.fontFamily = resolveSideFontFamily();
        sideElement.style.fontSize = globalFont.side * previewFontScale + "px";
        renderVerticalTextTarget("side");
    }

    schedulePreviewRender(PREVIEW_RENDER_DELAY_MS, () => renderPreview({ deferTypesetting: true }));
}

function renderAuxiliaryControls() {
    renderBackgroundPalette();
    renderBackgroundImageControls();
    renderTextColorPalette();
    updateTimelineButtons();
}

async function renderPreview({ updateControls = false, shouldSave = true, deferTypesetting = false, hideOverlayWhenReady = false, scheduleDeferredTypesetting = true } = {}) {
    cancelDeferredPosterTypesetting();
    cancelPendingPreviewRender();
    pendingCardPreviewIndexes.clear();
    applyResponsiveViewport();

    const previewFontScale = getPreviewFontScale();
    const resolutionDesignScale = getResolutionDesignScale();

    const yearElement = document.getElementById("year");
    const yearText = document.getElementById("yearInput").value;
    yearElement.innerText = yearText;
    yearElement.dataset.shadowText = yearText;
    yearElement.style.fontFamily = resolveYearFontFamily();
    yearElement.style.color = textColor;

    const sideElement = document.getElementById("side");
    sideElement.style.fontFamily = resolveSideFontFamily();
    sideElement.style.fontSize = globalFont.side * previewFontScale + "px";

    renderVerticalTextTarget("side");

    document.getElementById("year").style.fontSize =
        globalFont.year * previewFontScale + "px";

    const yearSizeValue = document.getElementById("yearSizeValue");
    if (yearSizeValue) {
        yearSizeValue.innerText = `${globalFont.year}px`;
    }

    const subtitleSizeValue = document.getElementById("subtitleSizeValue");
    if (subtitleSizeValue) {
        subtitleSizeValue.innerText = `${globalFont.subtitle}px`;
    }

    const sideSizeValue = document.getElementById("sideSizeValue");
    if (sideSizeValue) {
        sideSizeValue.innerText = `${globalFont.side}px`;
    }

    const poster = document.getElementById("poster");
    if (poster) {
        ensurePosterBackgroundCanvas(poster);
        poster.style.backgroundColor = backgroundColor;
        poster.style.backgroundImage = "";
        poster.style.backgroundSize = "";
        poster.style.backgroundPosition = "";
        poster.style.backgroundRepeat = "";
        poster.style.fontFamily = fontFamily;
        poster.style.setProperty("--text-color", textColor);
        poster.style.setProperty("--text-side-spacing", `${sideSpacing}px`);
        poster.style.setProperty("--side-header-reserve", `${sideHeaderReserve}px`);
        poster.style.setProperty("--card-title-spacing", `${paragraphTitleSpacing}px`);
        poster.style.setProperty("--module-spacing", `${moduleSpacing}px`);
        poster.classList.toggle("noTimeline", !showTimeline);
        poster.classList.toggle("hideMonthTitles", !showMonthTitles);
        poster.classList.toggle("hideMonthUnderlines", !showMonthUnderlines);
        poster.classList.toggle("hideSideHeader", !showSideHeader);
        poster.classList.toggle("subtitleVerticalLeft", subtitlePosition === "verticalLeft");
    }

    const subtitleElement = document.getElementById("subtitle");
    if (subtitleElement) {
        const subtitleText = subtitleInput?.value ?? subtitleElement.innerText;
        subtitleElement.classList.remove("typesetText");
        subtitleElement.innerText = subtitleText;
        subtitleElement.style.fontFamily = resolveSubtitleFontFamily();
        subtitleElement.style.color = textColor;
        applySubtitleSettings(subtitleElement, previewFontScale);
    }

    renderVerticalTextTarget("subtitle");
    syncHeadlineTextWidths();

    const copyrightEl = document.getElementById("copyright");
    if (copyrightEl) {
        copyrightEl.style.fontSize = `${BASE_COPYRIGHT_FONT_SIZE * resolutionDesignScale}px`;
        copyrightEl.style.display = showBottomWatermark ? "" : "none";
    }

    let html = "";

    data.forEach((item, index) => {
        if (item.hidden) return;

        html += renderPreviewCard(item, index, previewFontScale);
    });

    document.getElementById("cards").innerHTML = html;

    if (deferTypesetting) {
        if (scheduleDeferredTypesetting) {
            scheduleDeferredPosterTypesetting({ shouldSave });
        }
    } else {
        applyPosterTypesetting();
    }

    syncCardsOffset();

    if (subtitlePosition === "verticalLeft") {
        requestAnimationFrame(() => {
            syncCardsOffset();
        });
    }

    if (subtitleInput) {
        const subtitleEl = document.getElementById("subtitle");
        if (subtitlePosition !== "verticalLeft" && subtitleEl && subtitleInput.value !== subtitleEl.innerText) {
            subtitleInput.value = subtitleEl.innerText;
        }
    }

    if (sideSpacingInput && Number(sideSpacingInput.value) !== sideSpacing) {
        sideSpacingInput.value = String(sideSpacing);
    }

    if (paragraphTitleSpacingInput && Number(paragraphTitleSpacingInput.value) !== paragraphTitleSpacing) {
        paragraphTitleSpacingInput.value = String(paragraphTitleSpacing);
    }

    if (moduleSpacingInput && Number(moduleSpacingInput.value) !== moduleSpacing) {
        moduleSpacingInput.value = String(moduleSpacing);
    }

    if (topPaddingInput && Number(topPaddingInput.value) !== topPadding) {
        topPaddingInput.value = String(topPadding);
    }

    if (sideHeaderReserveInput && Number(sideHeaderReserveInput.value) !== sideHeaderReserve) {
        sideHeaderReserveInput.value = String(sideHeaderReserve);
    }

    if (updateControls) {
        renderAuxiliaryControls();
    }

    syncPreviewExportActionsPosition();
    if (!deferTypesetting) {
        schedulePhonePreviewSync();
    }

    if (hideOverlayWhenReady) {
        await syncPosterBackgroundCanvas(poster);
        hideTypesettingOverlay();
    } else {
        schedulePosterBackgroundSync(poster);
    }

    if (!deferTypesetting && !hideOverlayWhenReady) {
        hideTypesettingOverlay();
    }

    if (shouldSave) {
        saveState();
    }
}

function syncCardsOffset() {
    const poster = document.getElementById("poster");
    const cards = document.getElementById("cards");
    const side = document.getElementById("side");
    const subtitle = document.getElementById("subtitle");
    const header = document.getElementById("header");

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
        const subtitleSettings = getSubtitleSettings();
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

function scheduleEditorRender() {
    if (editorRenderFrame !== null) {
        cancelAnimationFrame(editorRenderFrame);
    }

    editorRenderFrame = requestAnimationFrame(() => {
        editorRenderFrame = null;
        renderEditor();
    });
}

function render({ deferEditor = false, previewOptions = {} } = {}) {
    renderPreview(previewOptions);

    if (deferEditor) {
        scheduleEditorRender();
        return;
    }

    if (editorRenderFrame !== null) {
        cancelAnimationFrame(editorRenderFrame);
        editorRenderFrame = null;
    }

    renderEditor();
}

function renderEditor() {
    richTextSelections.clear();
    renderHeadlineFontControls();

    let html = "";

    data.forEach((item, index) => {
        const titleText = escapeHtml(item.title);
        const textHtml = sanitizeRichText(item.text);
        const itemLineSpacing = getItemLineSpacing(item);
        const itemParagraphSpacing = getItemParagraphSpacing(item);
        const titleFontFamily = resolveCardTitleFontFamily(item);
        const contentFontToolbarValue = item.contentFontToolbarValue || item.contentFontFamily || INHERIT_FONT_VALUE;
        const titleFontOptions = renderFontOptionElements(titleFontFamily, [
            { label: "默认标题字体", value: CARD_TITLE_DEFAULT_FONT_FAMILY }
        ]);
        const contentFontOptions = renderFontOptionElements(contentFontToolbarValue, [
            { label: "默认内容字体", value: INHERIT_FONT_VALUE }
        ]);

        html += `
        <div class="block${item.hidden ? " hiddenBlock" : ""}">
            <div class="blockHeader">
                <h3>第 ${index + 1} 段${item.hidden ? "（已隐藏）" : ""}</h3>
                <div class="blockHeaderActions">
                    <button type="button" class="hideBtn" onclick="toggleCardHidden(${index})">${item.hidden ? "显示段落" : "隐藏段落"}</button>
                    <button type="button" class="deleteBtn" onclick="deleteCard(${index})">删除段落</button>
                </div>
            </div>
            <label class="inlineLabel">标题 <span class="sizeValue" data-card-index="${index}" data-size-type="title">${item.titleSize}px</span></label>
            <button onclick="changeTitleSize(${index},-2)">A-</button>
            <button onclick="changeTitleSize(${index},2)">A+</button>
            <select class="fontSelect blockFontSelect" style="font-family:${escapeHtml(titleFontFamily)};" onchange="changeCardTitleFont(${index},this.value,this)">
                ${titleFontOptions}
            </select>
            <textarea rows="2" style="font-family:${escapeHtml(titleFontFamily)};" oninput="autoResizeTextarea(this);changeTitle(${index},this.value)">${titleText}</textarea>
            <label class="inlineLabel">内容 <span class="sizeValue" data-card-index="${index}" data-size-type="text">${item.textSize}px</span></label>
            <button onclick="changeTextSize(${index},-2)">A-</button>
            <button onclick="changeTextSize(${index},2)">A+</button>
            <div class="blockSpacingControls">
                <label for="lineSpacingInput-${index}">
                    行间距
                    <input type="number" id="lineSpacingInput-${index}" min="1" max="3" step="0.1" value="${itemLineSpacing}" oninput="changeLineSpacing(${index},this.value)">
                </label>
                <label for="paragraphSpacingInput-${index}">
                    段间距
                    <input type="number" id="paragraphSpacingInput-${index}" min="0" max="80" step="2" value="${itemParagraphSpacing}" oninput="changeParagraphSpacing(${index},this.value)">
                </label>
            </div>
            <div class="richTextBox">
                <div class="richTextToolbar">
                    <button type="button" title="粗体" onmousedown="event.preventDefault()" onclick="formatCardText(${index}, 'bold')"><strong>B</strong></button>
                    <button type="button" title="斜体" onmousedown="event.preventDefault()" onclick="formatCardText(${index}, 'italic')"><em>I</em></button>
                    <button type="button" title="下划线" onmousedown="event.preventDefault()" onclick="formatCardText(${index}, 'underline')"><u>U</u></button>
                    <button type="button" title="删除线" onmousedown="event.preventDefault()" onclick="formatCardText(${index}, 'strikeThrough')"><s>S</s></button>
                    <select
                        class="fontSelect richTextFontSelect"
                        style="font-family:${escapeHtml(contentFontToolbarValue === INHERIT_FONT_VALUE ? resolveCardContentFontFamily(item) : contentFontToolbarValue)};"
                        title="选中文字字体"
                        onmousedown="saveRichTextSelection(${index})"
                        onchange="applyRichTextFont(${index},this.value,this)">
                        ${contentFontOptions}
                    </select>
                </div>
                <div
                    id="contentEditor-${index}"
                    class="richTextEditor"
                    contenteditable="true"
                    style="font-family:${escapeHtml(resolveCardContentFontFamily(item))};"
                    oninput="changeText(${index},this.innerHTML)"
                    onfocus="saveRichTextSelection(${index})"
                    onkeyup="saveRichTextSelection(${index})"
                    onmouseup="saveRichTextSelection(${index})"
                    onpaste="pastePlainText(event)">${textHtml}</div>
            </div>
        </div>
        `;
    });

    document.getElementById("cardEditor").innerHTML = html;
    document.querySelectorAll("#cardEditor textarea").forEach(autoResizeTextarea);
}

function renderHeadlineFontControls() {
    const controls = [
        {
            selectId: "yearFontSelect",
            inputId: "yearInput",
            selectedValue: yearFontFamily,
            resolvedFontFamily: resolveYearFontFamily(),
            defaultLabel: "默认标题字体"
        },
        {
            selectId: "subtitleFontSelect",
            inputId: "subtitleInput",
            selectedValue: subtitleFontFamily,
            resolvedFontFamily: resolveSubtitleFontFamily(),
            defaultLabel: "默认副标题字体"
        },
        {
            selectId: "sideFontSelect",
            inputId: "sideInput",
            selectedValue: sideFontFamily,
            resolvedFontFamily: resolveSideFontFamily(),
            defaultLabel: "默认竖排标题字体"
        }
    ];

    controls.forEach((control) => {
        const selectEl = document.getElementById(control.selectId);
        const inputEl = document.getElementById(control.inputId);

        if (selectEl) {
            selectEl.innerHTML = renderFontOptionElements(control.selectedValue, [
                { label: control.defaultLabel, value: INHERIT_FONT_VALUE }
            ]);
            selectEl.value = control.selectedValue;
            selectEl.style.fontFamily = control.resolvedFontFamily;
        }

        if (inputEl) {
            inputEl.style.fontFamily = control.resolvedFontFamily;
        }
    });
}

function renderBackgroundPalette() {
    const palette = document.getElementById("bgPalette");
    if (!palette) return;

    palette.innerHTML = presetColors
        .map((color) => {
            const active = color.toLowerCase() === backgroundColor.toLowerCase();
            return `
                <button
                    type="button"
                    class="colorSwatch${active ? " active" : ""}"
                    style="--swatch:${color};"
                    aria-label="背景颜色 ${color}"
                    title="${color}"
                    onclick="changeBackgroundColor('${color}')">
                    ${active ? '<span class="colorCheck">✓</span>' : ""}
                </button>
            `;
        })
        .join("")
        + `
            <button
                type="button"
                class="colorSwatch customSwatch"
                aria-label="自定义颜色"
                title="自定义颜色"
                onclick="openCustomColorPicker()">
                <span class="plusMark">+</span>
            </button>
        `;

    if (customColorPicker && customColorPicker.value !== backgroundColor) {
        customColorPicker.value = backgroundColor;
    }
}

function renderBackgroundImageControls() {
    const status = document.getElementById("backgroundImageStatus");
    const preview = document.getElementById("backgroundImagePreview");
    const removeButton = document.getElementById("removeBackgroundImageBtn");

    if (status) {
        status.innerText = backgroundImageDataUrl
            ? `已上传：${backgroundImageName || "背景图片"}，镜像平铺`
            : "未上传背景图片";
    }

    if (preview) {
        preview.hidden = !backgroundImageDataUrl;
        preview.style.backgroundImage = backgroundImageDataUrl ? `url("${backgroundImageDataUrl}")` : "";
    }

    if (removeButton) {
        removeButton.disabled = !backgroundImageDataUrl;
    }
}

function renderTextColorPalette() {
    const palette = document.getElementById("textColorPalette");
    if (!palette) return;

    palette.innerHTML = presetColors
        .map((color) => {
            const active = color.toLowerCase() === textColor.toLowerCase();
            return `
                <button
                    type="button"
                    class="colorSwatch${active ? " active" : ""}"
                    style="--swatch:${color};"
                    aria-label="字体颜色 ${color}"
                    title="${color}"
                    onclick="changeTextColor('${color}')">
                    ${active ? '<span class="colorCheck">✓</span>' : ""}
                </button>
            `;
        })
        .join("")
        + `
            <button
                type="button"
                class="colorSwatch customSwatch"
                aria-label="自定义字体颜色"
                title="自定义字体颜色"
                onclick="openTextColorPicker()">
                <span class="plusMark">+</span>
            </button>
        `;

    if (textColorPicker && textColorPicker.value !== textColor) {
        textColorPicker.value = textColor;
    }
}

function updateTimelineButton() {
    const button = document.getElementById("timelineToggleBtn");
    if (button) {
        button.innerText = showTimeline ? "隐藏时间轴" : "显示时间轴";
    }
}

function updateTimelineButtons() {
    const timelineButton = document.getElementById("timelineToggleBtn");
    if (timelineButton) {
        timelineButton.innerText = showTimeline ? "隐藏时间轴" : "显示时间轴";
    }

    const watermarkButton = document.getElementById("bottomWatermarkToggleBtn");
    if (watermarkButton) {
        watermarkButton.innerText = showBottomWatermark ? "隐藏底部水印" : "显示底部水印";
    }

    const titleButton = document.getElementById("monthTitleToggleBtn");
    if (titleButton) {
        titleButton.innerText = showMonthTitles ? "隐藏段落标题" : "显示段落标题";
    }

    const underlineButton = document.getElementById("underlineToggleBtn");
    if (underlineButton) {
        underlineButton.innerText = showMonthUnderlines ? "隐藏段落标题横线" : "显示段落标题横线";
    }

    const sideHeaderButton = document.getElementById("sideHeaderToggleBtn");
    if (sideHeaderButton) {
        sideHeaderButton.innerText = showSideHeader ? "隐藏竖排标题" : "显示竖排标题";
    }

    const subtitlePositionButton = document.getElementById("subtitlePositionToggleBtn");
    if (subtitlePositionButton) {
        subtitlePositionButton.innerText = subtitlePosition === "verticalLeft" ? "跟随标题下方" : "竖排左侧";
    }

    const phonePreviewButton = document.getElementById("phonePreviewToggleBtn");
    if (phonePreviewButton) {
        phonePreviewButton.innerText = showPhonePreview ? "隐藏手机预览" : "显示手机预览";
    }

    const phonePreviewPanel = document.getElementById("phonePreviewPanel");
    if (phonePreviewPanel) {
        phonePreviewPanel.hidden = !showPhonePreview;
    }

    const phoneResolutionSelect = document.getElementById("phoneResolutionSelect");
    if (phoneResolutionSelect && phoneResolutionSelect.value !== phoneResolution) {
        phoneResolutionSelect.value = phoneResolution;
    }
}

function syncPhonePreview() {
    phonePreviewFrame = null;

    const panel = document.getElementById("phonePreviewPanel");
    const canvas = document.getElementById("phoneCanvas");
    const canvasWrap = document.getElementById("phoneCanvasWrap");
    const screen = document.getElementById("phoneScreen");
    const topPaddingLayer = document.getElementById("phoneTopPadding");
    const watermark = document.getElementById("phoneWatermark");
    const poster = document.getElementById("poster");
    const mockup = document.querySelector(".phoneMockup");
    const scaleValue = document.getElementById("phonePreviewScaleValue");

    if (!showPhonePreview || !panel || !canvas || !canvasWrap || !screen || !topPaddingLayer || !watermark || !poster) return;

    const resolution = phoneResolutions[phoneResolution] || phoneResolutions["1080x2376"];
    const imageWidth = poster.offsetWidth || resolution.width;
    const watermarkSettings = getWatermarkSettings(1);
    const topPaddingHeight = getExportTopPaddingHeight(resolution, 1);
    const watermarkBandHeight = showBottomWatermark
        ? getWatermarkBandHeight(resolution, 1, watermarkSettings)
        : topPaddingHeight;
    const clone = poster.cloneNode(true);
    const posterStyle = window.getComputedStyle(poster);

    screen.style.aspectRatio = `${resolution.width} / ${resolution.height}`;
    screen.style.backgroundColor = posterStyle.backgroundColor || backgroundColor;
    panel.style.setProperty("--phone-preview-scale", phonePreviewScale);
    if (mockup) {
        mockup.style.setProperty("--phone-preview-scale", phonePreviewScale);
    }
    if (scaleValue) {
        scaleValue.innerText = `${Math.round(phonePreviewScale * 100)}%`;
    }

    clone.classList.add("phonePosterClone");
    clone.style.width = `${imageWidth}px`;
    clone.style.minHeight = "0";
    clone.style.backgroundColor = "transparent";

    const clonedBackgroundCanvas = clone.querySelector(".posterBackgroundCanvas");
    if (clonedBackgroundCanvas) {
        clonedBackgroundCanvas.hidden = true;
    }

    const clonedCopyright = clone.querySelector("#copyright");
    if (clonedCopyright) {
        clonedCopyright.style.visibility = "hidden";
        clonedCopyright.style.marginTop = "0";
        clonedCopyright.style.height = "0";
        clonedCopyright.style.overflow = "hidden";
    }

    canvas.innerHTML = "";
    canvas.style.width = `${imageWidth}px`;
    canvas.style.minHeight = "0";
    canvas.style.marginTop = "0";
    canvas.appendChild(clone);

    canvasWrap.innerHTML = "";
    canvasWrap.style.backgroundColor = "transparent";
    canvasWrap.appendChild(canvas);

    watermark.innerText = watermarkSettings.text;
    watermark.style.backgroundColor = backgroundImageDataUrl ? "transparent" : watermarkSettings.background;
    watermark.style.color = watermarkSettings.color;
    watermark.hidden = !showBottomWatermark;

    requestAnimationFrame(() => {
        syncPhoneBackgroundCanvas(screen, resolution);
        const scale = screen.clientWidth / imageWidth;
        const scaledTopPadding = topPaddingHeight * scale;
        const scaledWatermarkHeight = watermarkBandHeight * scale;
        const scaledFontSize = parseFloat(window.getComputedStyle(document.getElementById("copyright")).fontSize || "13") * scale;
        topPaddingLayer.style.height = `${scaledTopPadding}px`;
        topPaddingLayer.style.backgroundColor = backgroundImageDataUrl ? "transparent" : watermarkSettings.background;
        canvasWrap.style.top = `${scaledTopPadding}px`;
        canvasWrap.style.bottom = `${scaledWatermarkHeight}px`;
        canvasWrap.style.height = "";
        const availableContentHeight = Math.max(screen.clientHeight - scaledTopPadding - scaledWatermarkHeight, 0);
        const contentHeight = Math.max(clone.scrollHeight * scale, availableContentHeight);
        canvas.style.transform = `scale(${scale})`;
        canvas.style.height = `${contentHeight}px`;
        watermark.style.height = `${scaledWatermarkHeight}px`;
        watermark.style.font = watermarkSettings.font;
        watermark.style.fontSize = `${scaledFontSize}px`;
        syncPhoneScroll();
    });
}

function syncPhoneScroll() {
    const preview = document.getElementById("preview");
    const screen = document.getElementById("phoneCanvasWrap");

    if (!showPhonePreview || !preview || !screen) return;

    const sourceMax = preview.scrollHeight - preview.clientHeight;
    const targetMax = screen.scrollHeight - screen.clientHeight;

    if (sourceMax <= 0 || targetMax <= 0) {
        screen.scrollTop = 0;
        return;
    }

    screen.scrollTop = targetMax * (preview.scrollTop / sourceMax);
}

function schedulePhonePreviewSync() {
    if (!showPhonePreview || phonePreviewFrame !== null) return;

    phonePreviewFrame = requestAnimationFrame(syncPhonePreview);
}

/* ===========================
   Edit Actions
=========================== */

function changeTitle(index, value) {
    data[index].title = value;
    renderPreview();
}

function changeText(index, value) {
    data[index].text = sanitizeRichText(value);
    schedulePreviewRender(PREVIEW_RENDER_DELAY_MS, () => renderPreview({ deferTypesetting: true }));
}

function getRichTextEditor(index) {
    return document.getElementById(`contentEditor-${index}`);
}

function isRangeInsideElement(range, element) {
    if (!range || !element) return false;

    const startNode = range.startContainer.nodeType === Node.TEXT_NODE
        ? range.startContainer.parentNode
        : range.startContainer;
    const endNode = range.endContainer.nodeType === Node.TEXT_NODE
        ? range.endContainer.parentNode
        : range.endContainer;

    return (element.contains(startNode) || element === startNode)
        && (element.contains(endNode) || element === endNode);
}

function saveRichTextSelection(index) {
    const editorEl = getRichTextEditor(index);
    const selection = window.getSelection();

    if (!editorEl || !selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const commonAncestor = range.commonAncestorContainer;
    const selectionNode = commonAncestor.nodeType === Node.TEXT_NODE
        ? commonAncestor.parentNode
        : commonAncestor;

    if (editorEl.contains(selectionNode) || editorEl === selectionNode) {
        richTextSelections.set(index, range.cloneRange());
    }
}

function restoreRichTextSelection(index) {
    const range = richTextSelections.get(index);
    const selection = window.getSelection();
    const editorEl = getRichTextEditor(index);

    if (!range || !selection || !isRangeInsideElement(range, editorEl)) return false;

    selection.removeAllRanges();
    selection.addRange(range);
    return true;
}

function getSavedRichTextRange(index) {
    const range = richTextSelections.get(index);
    const editorEl = getRichTextEditor(index);

    return isRangeInsideElement(range, editorEl) ? range : null;
}

function stripRichTextFontSpans(element) {
    if (!element) return;

    Array.from(element.querySelectorAll("span")).forEach((span) => {
        if (span.style.fontFamily) {
            span.replaceWith(...Array.from(span.childNodes));
        }
    });
}

function formatCardText(index, command) {
    const editorEl = getRichTextEditor(index);
    if (!editorEl) return;

    editorEl.focus();
    restoreRichTextSelection(index);
    document.execCommand(command, false, null);

    data[index].text = sanitizeRichText(editorEl.innerHTML);
    editorEl.innerHTML = data[index].text;
    saveRichTextSelection(index);
    renderPreview();
}

function applyRichTextFont(index, value, selectEl = null) {
    const editorEl = getRichTextEditor(index);
    if (!editorEl || !data[index]) return;

    const selectedValue = value || INHERIT_FONT_VALUE;
    const nextFontFamily = selectedValue !== INHERIT_FONT_VALUE ? selectedValue : fontFamily;
    const savedRange = getSavedRichTextRange(index);
    const hasSelectedText = Boolean(savedRange && !savedRange.collapsed && String(savedRange).length > 0);

    editorEl.focus();

    if (hasSelectedText) {
        restoreRichTextSelection(index);
        document.execCommand("fontName", false, getPrimaryFontFamily(nextFontFamily) || nextFontFamily);
    } else {
        data[index].contentFontFamily = selectedValue;
        stripRichTextFontSpans(editorEl);
        editorEl.style.fontFamily = resolveCardContentFontFamily(data[index]);
    }

    data[index].contentFontToolbarValue = selectedValue;
    data[index].text = sanitizeRichText(editorEl.innerHTML);
    editorEl.innerHTML = data[index].text;
    saveRichTextSelection(index);

    if (selectEl) {
        selectEl.value = selectedValue;
        selectEl.style.fontFamily = selectedValue === INHERIT_FONT_VALUE ? resolveCardContentFontFamily(data[index]) : selectedValue;
    }

    renderPreview();
}

function pastePlainText(event) {
    event.preventDefault();

    const text = event.clipboardData?.getData("text/plain") ?? "";
    document.execCommand("insertText", false, text);
}

function updateCardSizeValue(index, type, value) {
    const selector = `[data-card-index="${index}"][data-size-type="${type}"]`;
    const valueElement = document.querySelector(selector);

    if (valueElement) {
        valueElement.innerText = `${value}px`;
    }
}

function changeTitleSize(index, delta) {
    data[index].titleSize += delta;
    if (data[index].titleSize < 6) {
        data[index].titleSize = 6;
    }
    updateCardSizeValue(index, "title", data[index].titleSize);
    scheduleCardPreviewRender(index);
}

function changeTextSize(index, delta) {
    data[index].textSize += delta;
    if (data[index].textSize < 6) {
        data[index].textSize = 6;
    }
    updateCardSizeValue(index, "text", data[index].textSize);
    scheduleCardPreviewRender(index);
}

function changeYearSize(delta) {
    globalFont.year += delta;
    scheduleDeferredFullPreviewRender();
}

function changeSubtitleSize(delta) {
    globalFont.subtitle += delta;
    if (globalFont.subtitle < 6) {
        globalFont.subtitle = 6;
    }
    scheduleDeferredFullPreviewRender();
}

function changeSideSize(delta) {
    globalFont.side += delta;
    scheduleDeferredFullPreviewRender();
}

function applyBackgroundColorPreview(value) {
    backgroundColor = value;

    const poster = document.getElementById("poster");
    if (poster) {
        poster.style.backgroundColor = backgroundColor;
    }
}

function commitBackgroundColorPreview() {
    renderBackgroundPalette();
    schedulePosterBackgroundSync(document.getElementById("poster"));
    schedulePhonePreviewSync();
    saveState();
}

function changeBackgroundColor(value) {
    applyBackgroundColorPreview(value);
    renderBackgroundPalette();
    renderPreview();
}

function openBackgroundImagePicker() {
    if (backgroundImageInput) {
        backgroundImageInput.value = "";
        backgroundImageInput.click();
    }
}

function changeBackgroundImage(file) {
    if (!file) return;

    if (!file.type || !file.type.startsWith("image/")) {
        window.alert("请选择图片文件作为背景。");
        return;
    }

    if (file.size > MAX_BACKGROUND_IMAGE_FILE_SIZE) {
        window.alert("背景图片不能超过 6MB，请压缩后再上传。");
        return;
    }

    const reader = new FileReader();
    reader.onload = () => {
        if (typeof reader.result !== "string") {
            window.alert("背景图片读取失败，请重试。");
            return;
        }

        backgroundImageDataUrl = reader.result;
        backgroundImageName = file.name || "背景图片";
        renderBackgroundImageControls();
        renderPreview();
    };
    reader.onerror = () => {
        window.alert("背景图片读取失败，请重试。");
    };
    reader.readAsDataURL(file);
}

function removeBackgroundImage() {
    backgroundImageDataUrl = "";
    backgroundImageName = "";
    if (backgroundImageInput) {
        backgroundImageInput.value = "";
    }
    renderBackgroundImageControls();
    renderPreview();
}

function updateHeadlineFontSelect(selectEl, inputId, selectedValue, resolvedFontFamily) {
    if (selectEl) {
        selectEl.value = selectedValue;
        selectEl.style.fontFamily = resolvedFontFamily;
    }

    const inputEl = document.getElementById(inputId);
    if (inputEl) {
        inputEl.style.fontFamily = resolvedFontFamily;
    }
}

function changeYearFont(value, selectEl = null) {
    yearFontFamily = value || INHERIT_FONT_VALUE;
    updateHeadlineFontSelect(selectEl, "yearInput", yearFontFamily, resolveYearFontFamily());
    renderPreview();
}

function changeSubtitleFont(value, selectEl = null) {
    subtitleFontFamily = value || INHERIT_FONT_VALUE;
    updateHeadlineFontSelect(selectEl, "subtitleInput", subtitleFontFamily, resolveSubtitleFontFamily());
    renderPreview();
}

function changeSideFont(value, selectEl = null) {
    sideFontFamily = value || INHERIT_FONT_VALUE;
    updateHeadlineFontSelect(selectEl, "sideInput", sideFontFamily, resolveSideFontFamily());
    renderPreview();
}

function changeCardTitleFont(index, value, selectEl = null) {
    if (!data[index]) return;

    data[index].titleFontFamily = value || CARD_TITLE_DEFAULT_FONT_FAMILY;
    if (selectEl) {
        const nextFontFamily = resolveCardTitleFontFamily(data[index]);
        selectEl.style.fontFamily = nextFontFamily;
        const titleInput = selectEl.closest(".block")?.querySelector("textarea");
        if (titleInput) {
            titleInput.style.fontFamily = nextFontFamily;
        }
    }
    renderPreview();
}

function applyTextColorToElementTree(element) {
    if (!element) return;

    element.style.color = textColor;
    element.querySelectorAll(".typesetLine, .typesetLineInner, .typesetToken, .verticalTextLine, .verticalTextChar").forEach((child) => {
        child.style.color = textColor;
    });
}

function applyTextColorPreview(value) {
    textColor = value;

    const poster = document.getElementById("poster");
    if (poster) {
        poster.style.setProperty("--text-color", textColor);
    }

    document.querySelectorAll("#year, #subtitle, #side, .cardTitle, .info").forEach(applyTextColorToElementTree);
}

function commitTextColorPreview() {
    renderTextColorPalette();
    schedulePhonePreviewSync();
    saveState();
}

function changeTextColor(value) {
    applyTextColorPreview(value);
    renderTextColorPalette();
    renderPreview();
}

function changeLineSpacing(index, value) {
    const nextValue = Number(value);
    if (!data[index] || Number.isNaN(nextValue)) return;

    data[index].lineSpacing = Math.min(Math.max(nextValue, 1), 3);
    scheduleCardPreviewRender(index);
}

function changeParagraphSpacing(index, value) {
    const nextValue = Number(value);
    if (!data[index] || Number.isNaN(nextValue)) return;

    data[index].paragraphSpacing = Math.min(Math.max(nextValue, 0), 80);
    scheduleCardPreviewRender(index);
}

function changeSideSpacing(value) {
    const nextValue = Number(value);
    if (Number.isNaN(nextValue)) return;

    sideSpacing = Math.min(Math.max(nextValue, -120), 240);
    scheduleDeferredFullPreviewRender();
}

function changeParagraphTitleSpacing(value) {
    const nextValue = Number(value);
    if (Number.isNaN(nextValue)) return;

    paragraphTitleSpacing = Math.min(Math.max(nextValue, -40), 80);
    scheduleDeferredFullPreviewRender();
}

function changeModuleSpacing(value) {
    const nextValue = Number(value);
    if (Number.isNaN(nextValue)) return;

    moduleSpacing = Math.min(Math.max(nextValue, 0), 160);
    scheduleDeferredFullPreviewRender();
}

function changeTopPadding(value) {
    const nextValue = Number(value);
    if (Number.isNaN(nextValue)) return;

    topPadding = Math.min(Math.max(nextValue, 0), 240);
    scheduleDeferredFullPreviewRender();
}

function changeSideHeaderReserve(value) {
    const nextValue = Number(value);
    if (Number.isNaN(nextValue)) return;

    sideHeaderReserve = Math.min(Math.max(nextValue, 0), 240);
    scheduleDeferredFullPreviewRender();
}

function changeSubtitle(value) {
    renderHeaderInputPreview();
}

function toggleTimeline() {
    showTimeline = !showTimeline;
    updateTimelineButtons();
    renderPreview();
}

function toggleMonthTitles() {
    showMonthTitles = !showMonthTitles;
    updateTimelineButtons();
    renderPreview();
}

function toggleMonthUnderlines() {
    showMonthUnderlines = !showMonthUnderlines;
    updateTimelineButtons();
    renderPreview();
}

function toggleSideHeader() {
    showSideHeader = !showSideHeader;
    updateTimelineButtons();
    renderPreview();
}

function toggleBottomWatermark() {
    showBottomWatermark = !showBottomWatermark;
    updateTimelineButtons();
    renderPreview();
}

function toggleSubtitlePosition() {
    subtitlePosition = subtitlePosition === "verticalLeft" ? "belowTitle" : "verticalLeft";
    renderPreview();
}

function togglePhonePreview() {
    showPhonePreview = !showPhonePreview;
    updateTimelineButtons();
    syncPreviewExportActionsPosition();
    schedulePhonePreviewSync();
    saveState();
}

function changePhoneResolution(value) {
    if (!phoneResolutions[value]) return;

    phoneResolution = value;
    renderPreview();
}

function changePhonePreviewScale(delta) {
    phonePreviewScale = Math.min(Math.max(phonePreviewScale + delta, 0.75), 2);
    phonePreviewScale = Math.round(phonePreviewScale * 10) / 10;
    schedulePhonePreviewSync();
    saveState();
}

function openCustomColorPicker() {
    if (customColorPicker) {
        customColorPicker.click();
    }
}

function openTextColorPicker() {
    if (textColorPicker) {
        textColorPicker.click();
    }
}

function addCard() {
    data.push({
        title: "新的作品",
        text: "Loading...",
        titleSize: 70,
        textSize: 48,
        titleFontFamily: CARD_TITLE_DEFAULT_FONT_FAMILY,
        contentFontFamily: INHERIT_FONT_VALUE,
        contentFontToolbarValue: INHERIT_FONT_VALUE,
        hidden: false,
        lineSpacing: 1.8,
        paragraphSpacing: 0
    });
    render();
}

function toggleCardHidden(index) {
    if (!data[index]) return;

    data[index].hidden = !data[index].hidden;
    render();
}

function deleteCard(index) {
    const ok = window.confirm("确定要删除这部作品吗？");
    if (!ok) return;

    data.splice(index, 1);
    render();
}

/* ===========================
   Editor Width Drag
=========================== */

const dragBar = document.getElementById("dragBar");
const editor = document.getElementById("editor");

let dragging = false;
let posterWidthRerenderFrame = null;
let viewportResizeRenderFrame = null;
let viewportResizeCompletionTimer = null;

function getCurrentEditorWidth() {
    const width = parseInt(editor?.style.width || "", 10);
    if (!Number.isNaN(width)) return width;

    const measuredWidth = Math.round(editor?.getBoundingClientRect().width || 0);
    return measuredWidth || 420;
}

function schedulePosterWidthRerender() {
    if (dragging) {
        schedulePreviewRender(DIVIDER_DRAG_RENDER_DELAY_MS);
        return;
    }

    if (posterWidthRerenderFrame !== null) return;

    posterWidthRerenderFrame = requestAnimationFrame(() => {
        posterWidthRerenderFrame = null;
        renderPreview();
    });
}

function finalizePosterWidthRerender() {
    if (posterWidthRerenderFrame !== null) {
        cancelAnimationFrame(posterWidthRerenderFrame);
        posterWidthRerenderFrame = null;
    }

    cancelPendingPreviewRender();
    renderPreview({ deferTypesetting: true });
}

function updateEditorCollapseButton() {
    const button = document.getElementById("editorCollapseBtn");
    if (!button) return;

    button.innerText = editorCollapsed ? "‹" : "›";
    button.title = editorCollapsed ? "展开编辑器" : "收起编辑器";
    button.setAttribute("aria-label", button.title);
}

function applyEditorCollapsedState({ shouldSave = false, shouldRerender = true } = {}) {
    document.body.classList.toggle("editorCollapsed", editorCollapsed);
    updateEditorCollapseButton();
    syncPreviewExportActionsPosition();

    if (shouldRerender) {
        schedulePosterWidthRerender();
    }

    if (shouldSave) {
        saveState();
    }
}

function toggleEditorCollapsed(event = null) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }

    if (isMobileViewport()) return;

    if (!editorCollapsed) {
        editorWidth = getCurrentEditorWidth();
    } else if (typeof editorWidth === "number") {
        editor.style.width = `${editorWidth}px`;
    }

    editorCollapsed = !editorCollapsed;
    applyEditorCollapsedState({ shouldSave: true, shouldRerender: true });
}

const editorCollapseBtn = document.getElementById("editorCollapseBtn");
if (editorCollapseBtn) {
    editorCollapseBtn.addEventListener("mousedown", (event) => {
        event.stopPropagation();
    });
}

dragBar.addEventListener("mousedown", function () {
    if (isMobileViewport()) return;

    if (editorCollapsed) {
        editorCollapsed = false;
        if (typeof editorWidth === "number") {
            editor.style.width = `${editorWidth}px`;
        }
        applyEditorCollapsedState({ shouldSave: true });
    }

    dragging = true;
    document.body.style.userSelect = "none";
});

document.addEventListener("mouseup", function () {
    const wasDragging = dragging;
    dragging = false;
    document.body.style.userSelect = "auto";

    if (!wasDragging || editorCollapsed) return;

    finalizePosterWidthRerender();

    const width = parseInt(editor.style.width, 10);
    if (!Number.isNaN(width)) {
        editorWidth = width;
        saveState();
    }
});

document.addEventListener("mousemove", function (e) {
    if (!dragging || isMobileViewport()) return;

    const phonePreviewPanel = document.getElementById("phonePreviewPanel");
    const phonePreviewWidth = phonePreviewPanel && !phonePreviewPanel.hidden
        ? phonePreviewPanel.offsetWidth
        : 0;
    let width = window.innerWidth - e.clientX - phonePreviewWidth;
    if (width < 300) width = 300;
    if (width > 900) width = 900;

    editor.style.width = width + "px";
    editorWidth = width;

    syncPreviewExportActionsPosition();
    schedulePosterWidthRerender();
});

/* ===========================
   Input Bindings
=========================== */

document.getElementById("yearInput").oninput = function () {
    autoResizeTextarea(this);
    renderHeaderInputPreview();
};
document.getElementById("sideInput").oninput = function () {
    autoResizeTextarea(this);
    renderHeaderInputPreview();
};

if (subtitleInput) {
    subtitleInput.oninput = function () {
        autoResizeTextarea(this);
        changeSubtitle(this.value);
    };
}

if (textColorPicker) {
    textColorPicker.oninput = function () {
        applyTextColorPreview(this.value);
    };
    textColorPicker.onchange = function () {
        applyTextColorPreview(this.value);
        commitTextColorPreview();
    };
}

if (customColorPicker) {
    customColorPicker.oninput = function () {
        applyBackgroundColorPreview(this.value);
    };
    customColorPicker.onchange = function () {
        applyBackgroundColorPreview(this.value);
        commitBackgroundColorPreview();
    };
}

if (backgroundImageInput) {
    backgroundImageInput.onchange = function () {
        changeBackgroundImage(this.files?.[0] || null);
    };
}

if (paragraphTitleSpacingInput) {
    paragraphTitleSpacingInput.oninput = function () {
        changeParagraphTitleSpacing(this.value);
    };
}

if (sideSpacingInput) {
    sideSpacingInput.oninput = function () {
        changeSideSpacing(this.value);
    };
}

if (moduleSpacingInput) {
    moduleSpacingInput.oninput = function () {
        changeModuleSpacing(this.value);
    };
}

if (topPaddingInput) {
    topPaddingInput.oninput = function () {
        changeTopPadding(this.value);
    };
}

if (sideHeaderReserveInput) {
    sideHeaderReserveInput.oninput = function () {
        changeSideHeaderReserve(this.value);
    };
}

const loadFontsBtn = document.getElementById("loadFontsBtn");
if (loadFontsBtn) {
    loadFontsBtn.onclick = loadSystemFonts;
}

const phoneResolutionSelect = document.getElementById("phoneResolutionSelect");
if (phoneResolutionSelect) {
    phoneResolutionSelect.onchange = function () {
        changePhoneResolution(this.value);
    };
}

function scheduleViewportResizeCompletion() {
    if (viewportResizeCompletionTimer !== null) {
        window.clearTimeout(viewportResizeCompletionTimer);
    }

    viewportResizeCompletionTimer = window.setTimeout(() => {
        viewportResizeCompletionTimer = null;
        renderPreview({ deferTypesetting: true });
    }, DIVIDER_DRAG_RENDER_DELAY_MS);
}

function handleViewportChange() {
    if (viewportResizeRenderFrame === null) {
        viewportResizeRenderFrame = requestAnimationFrame(() => {
            viewportResizeRenderFrame = null;
            renderPreview({
                deferTypesetting: true,
                scheduleDeferredTypesetting: false,
                shouldSave: false
            });
        });
    }

    scheduleViewportResizeCompletion();
    syncPreviewExportActionsPosition();
}

const previewScrollContainer = document.getElementById("preview");
if (previewScrollContainer) {
    previewScrollContainer.addEventListener("scroll", syncPhoneScroll);
}

window.addEventListener("resize", handleViewportChange);
window.addEventListener("beforeunload", flushPendingStateSave);

if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", handleViewportChange);
}

/* ===========================
   Export JPG
=========================== */

function preparePosterForExport() {
    const preview = document.getElementById("preview");
    const poster = document.getElementById("poster");

    if (!preview || !poster) return null;

    const oldScrollTop = preview.scrollTop;
    preview.scrollTop = 0;

    poster.style.width = poster.offsetWidth + "px";

    return {
        preview,
        poster,
        oldScrollTop
    };
}

function restorePosterAfterExport(exportState) {
    if (!exportState) return;

    exportState.poster.style.width = "";
    exportState.preview.scrollTop = exportState.oldScrollTop;
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
    const columns = String(value ?? "")
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
    return input?.value ?? fallbackElement?.innerText ?? "";
}

function renderVerticalTextTarget(target, value = null) {
    const config = getVerticalTextTargetConfig(target);
    if (!config) return;

    const element = document.getElementById(config.elementId);
    if (!element) return;

    if (typeof config.applySettings === "function") {
        config.applySettings(element);
    }

    const text = value ?? getVerticalTextTargetValue(config, element);
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

function renderVerticalTextCloneElement(clonedDoc, target) {
    const config = getVerticalTextTargetConfig(target);
    if (!config) return;

    const source = document.getElementById(config.elementId);
    const clone = clonedDoc.getElementById(config.elementId);
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

function renderVerticalTextForExport(clonedDoc) {
    const clonedPoster = clonedDoc.getElementById("poster");
    if (!clonedPoster) return;

    Object.values(VERTICAL_TEXT_TARGETS).forEach((config) => {
        if (typeof config.isExportActive === "function" && !config.isExportActive(clonedPoster)) return;
        renderVerticalTextCloneElement(clonedDoc, config);
    });
}

async function capturePosterCanvas({ hideCopyright = false, scale = 3, afterCapture = null, transparentPosterBackground = false } = {}) {
    await flushPendingPreviewRender();
    await flushDeferredPosterTypesetting();

    const exportState = preparePosterForExport();
    if (!exportState) return Promise.reject(new Error("未找到预览区域，无法导出。"));

    try {
        if (document.fonts?.ready) {
            await document.fonts.ready;
        }

        const canvas = await html2canvas(exportState.poster, {
            backgroundColor: transparentPosterBackground ? null : backgroundColor,
            scale,
            useCORS: true,
            onclone: (clonedDoc) => {
                const clonedPoster = clonedDoc.getElementById("poster");
                if (clonedPoster) {
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
                    clonedPoster.classList.toggle("hideSideHeader", !showSideHeader);
                    clonedPoster.classList.toggle("subtitleVerticalLeft", subtitlePosition === "verticalLeft");
                }

                renderVerticalTextForExport(clonedDoc);

                if (hideCopyright) {
                    const copyright = clonedDoc.getElementById("copyright");
                    if (copyright) {
                        copyright.style.visibility = "hidden";
                        copyright.style.marginTop = "0";
                        copyright.style.height = "0";
                        copyright.style.overflow = "hidden";
                    }
                }
            }
        });

        if (typeof afterCapture === "function") {
            afterCapture(canvas);
        }

        return canvas;
    } finally {
        restorePosterAfterExport(exportState);
    }
}

async function exportImage() {
    try {
        const sourceCanvas = await capturePosterCanvas({
            hideCopyright: !showBottomWatermark,
            transparentPosterBackground: Boolean(backgroundImageDataUrl)
        });
        const resolution = phoneResolutions[phoneResolution] || phoneResolutions["1080x2376"];
        const scale = sourceCanvas.width / (document.getElementById("poster")?.offsetWidth || sourceCanvas.width);
        const posterStyle = window.getComputedStyle(document.getElementById("poster"));
        const topPaddingHeight = getExportTopPaddingHeight(resolution, scale);
        const canvas = await addCanvasTopPadding(sourceCanvas, topPaddingHeight, posterStyle.backgroundColor || backgroundColor);
        const blob = await canvasToBlob(canvas, "image/jpeg", 1);
        downloadBlob(blob, "年度总结.jpg");
    } catch (error) {
        window.alert(error?.message || "导出失败，请稍后再试。");
    }
}

function getWatermarkSettings(scale) {
    const copyright = document.getElementById("copyright");
    const poster = document.getElementById("poster");
    const copyrightStyle = copyright ? window.getComputedStyle(copyright) : null;
    const posterStyle = poster ? window.getComputedStyle(poster) : null;
    const fontSize = parseFloat(copyrightStyle?.fontSize || "13") * scale;
    const fontWeight = copyrightStyle?.fontWeight || "600";
    const family = copyrightStyle?.fontFamily || fontFamily;
    const lineHeightValue = parseFloat(copyrightStyle?.lineHeight || "");
    const lineHeight = Number.isFinite(lineHeightValue) ? lineHeightValue * scale : fontSize * 1.3;

    return {
        text: copyright?.innerText || "制图：Behtnnrtop",
        color: copyrightStyle?.color || "#b3bac3",
        font: `${fontWeight} ${fontSize}px ${family}`,
        lineHeight,
        background: posterStyle?.backgroundColor || backgroundColor
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

async function addCanvasTopPadding(sourceCanvas, paddingHeight, background) {
    if (paddingHeight <= 0) return sourceCanvas;

    const paddedCanvas = document.createElement("canvas");
    const ctx = paddedCanvas.getContext("2d");

    paddedCanvas.width = sourceCanvas.width;
    paddedCanvas.height = sourceCanvas.height + paddingHeight;
    await drawFullSliceBackground(ctx, paddedCanvas.width, paddedCanvas.height, background);
    ctx.drawImage(sourceCanvas, 0, paddingHeight);

    return paddedCanvas;
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

function isLikelyMobileBrowser() {
    return isMobileViewport() || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function downloadBlob(blob, filename, { fallbackWindow = null } = {}) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.rel = "noopener";
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    link.remove();

    window.setTimeout(() => {
        if (fallbackWindow && !fallbackWindow.closed) {
            fallbackWindow.location.href = url;
        }

        window.setTimeout(() => URL.revokeObjectURL(url), 60 * 1000);
    }, 250);
}

function getCanvasScale(sourceCanvas) {
    const poster = document.getElementById("poster");
    if (!poster) return 1;

    return sourceCanvas.width / (poster.offsetWidth || sourceCanvas.width);
}

function clampCanvasY(value, sourceCanvas) {
    return Math.min(Math.max(Math.round(value), 0), sourceCanvas.height);
}

function getElementCanvasBounds(element, sourceCanvas, padding = 0) {
    const poster = document.getElementById("poster");
    if (!poster || !element) return null;

    const scale = getCanvasScale(sourceCanvas);
    const posterRect = poster.getBoundingClientRect();
    const rect = element.getBoundingClientRect();
    const top = clampCanvasY((rect.top - posterRect.top) * scale - padding, sourceCanvas);
    const bottom = clampCanvasY((rect.bottom - posterRect.top) * scale + padding, sourceCanvas);

    if (bottom <= top) return null;

    return { top, bottom };
}

function getElementCanvasColumns(element, sourceCanvas, padding = 0) {
    const poster = document.getElementById("poster");
    if (!poster || !element) return null;

    const scale = getCanvasScale(sourceCanvas);
    const posterRect = poster.getBoundingClientRect();
    const rect = element.getBoundingClientRect();
    const left = Math.max(0, Math.floor((rect.left - posterRect.left) * scale - padding));
    const right = Math.min(sourceCanvas.width, Math.ceil((rect.right - posterRect.left) * scale + padding));

    if (right <= left) return null;

    return { left, right };
}

function getTextNodeCanvasRanges(element, sourceCanvas, padding) {
    const poster = document.getElementById("poster");
    if (!poster || !element) return [];

    const scale = getCanvasScale(sourceCanvas);
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

function getProtectedTextRanges(sourceCanvas) {
    const scale = getCanvasScale(sourceCanvas);
    const textPadding = Math.max(2, Math.round(3 * scale));
    const textSelectors = [
        "#year",
        "#subtitle",
        ".cardTitle",
        ".info"
    ];

    const ranges = textSelectors.flatMap((selector) =>
        Array.from(document.querySelectorAll(selector))
            .filter((element) => window.getComputedStyle(element).display !== "none")
            .flatMap((element) => {
                const textRanges = getTextNodeCanvasRanges(element, sourceCanvas, textPadding);
                return textRanges;
            })
    );

    return ranges
        .filter((range) => range.bottom > range.top)
        .sort((a, b) => a.top - b.top);
}

function isProtectedCutY(y, ranges) {
    return ranges.some((range) => y > range.top && y < range.bottom);
}

function isProtectedCutBand(y, ranges, clearance) {
    return ranges.some((range) => y + clearance > range.top && y - clearance < range.bottom);
}

function getCanvasPixelDistance(a, b) {
    return Math.abs(a[0] - b[0])
        + Math.abs(a[1] - b[1])
        + Math.abs(a[2] - b[2])
        + Math.abs((a[3] ?? 255) - (b[3] ?? 255));
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

function getTextScanColumns(sourceCanvas) {
    const scale = getCanvasScale(sourceCanvas);
    const padding = Math.max(3, Math.round(6 * scale));
    const selectors = [
        "#year",
        "#subtitle",
        ".cardTitle",
        ".info"
    ];
    const columns = selectors.flatMap((selector) =>
        Array.from(document.querySelectorAll(selector))
            .filter((element) => window.getComputedStyle(element).display !== "none")
            .map((element) => getElementCanvasColumns(element, sourceCanvas, padding))
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

    return samples
        .sort((a, b) => (
            samples.filter((sample) => getCanvasPixelDistance(sample, a) < 18).length
            - samples.filter((sample) => getCanvasPixelDistance(sample, b) < 18).length
        ))
        .at(-1);
}

function createCanvasInkDetector(sourceCanvas) {
    const ctx = sourceCanvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;

    const background = getCanvasBackgroundSample(sourceCanvas, ctx);
    if (!background) return null;

    const scanColumns = getTextScanColumns(sourceCanvas);
    const rowCache = new Map();
    const scannedWidth = scanColumns.reduce((total, column) => total + column.right - column.left, 0);
    const minInkPixels = Math.max(3, Math.round(scannedWidth * 0.001));
    const colorThreshold = 18;

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
    if (hasInkAtRow) {
        return !isCanvasInkCutBand(y, hasInkAtRow, clearance);
    }

    return !isProtectedCutBand(y, protectedRanges, clearance);
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

function getLineBoundaryFallbackCutY(idealCutY, minCutY, protectedRanges, clearance, maxBacktrack) {
    const cutY = Math.floor(idealCutY);
    const blockingRanges = protectedRanges.filter((range) => cutY + clearance > range.top && cutY - clearance < range.bottom);

    if (!blockingRanges.length) return null;

    const fallbackCutY = Math.floor(Math.min(...blockingRanges.map((range) => range.top)) - clearance);

    if (fallbackCutY > minCutY && idealCutY - fallbackCutY <= maxBacktrack) {
        return fallbackCutY;
    }

    return null;
}

function getSafeContentSliceHeight(sourceCanvas, sourceY, maxContentHeight, protectedRanges, hasInkAtRow) {
    const remainingHeight = sourceCanvas.height - sourceY;
    if (remainingHeight <= maxContentHeight) return remainingHeight;

    const scale = getCanvasScale(sourceCanvas);
    const idealCutY = sourceY + maxContentHeight;
    const minCutY = sourceY + Math.max(1, Math.round(12 * scale));
    const clearance = Math.max(4, Math.round(6 * scale));
    const maxBacktrack = getCutBacktrackLimit(scale, maxContentHeight);
    const safeCutY = findNearestSafeCutY(idealCutY, minCutY, protectedRanges, hasInkAtRow, clearance, maxBacktrack);

    if (safeCutY !== null) {
        return Math.max(1, safeCutY - sourceY);
    }

    const fallbackCutY = getLineBoundaryFallbackCutY(idealCutY, minCutY, protectedRanges, clearance, maxBacktrack);

    if (fallbackCutY !== null) {
        return Math.max(1, fallbackCutY - sourceY);
    }

    return maxContentHeight;
}

function getTimelineCardSliceBounds(sourceCanvas) {
    const scale = getCanvasScale(sourceCanvas);
    const padding = Math.max(18, Math.round(18 * scale));

    return Array.from(document.querySelectorAll(".card"))
        .map((card) => getElementCanvasBounds(card, sourceCanvas, padding))
        .filter(Boolean);
}

function loadBackgroundImageForCanvas() {
    if (!backgroundImageDataUrl) return Promise.resolve(null);

    if (backgroundImageCanvasCache.src === backgroundImageDataUrl && backgroundImageCanvasCache.promise) {
        return backgroundImageCanvasCache.promise;
    }

    backgroundImageCanvasCache = {
        src: backgroundImageDataUrl,
        image: null,
        promise: new Promise((resolve, reject) => {
            const image = new Image();
            image.onload = () => {
                backgroundImageCanvasCache.image = image;
                resolve(image);
            };
            image.onerror = () => reject(new Error("背景图片加载失败，已使用背景颜色兜底。"));
            image.src = backgroundImageDataUrl;
        })
    };

    return backgroundImageCanvasCache.promise;
}

function drawMirroredRepeatedImageAtNaturalSize(ctx, image, width, height) {
    const sourceWidth = image.naturalWidth || image.width;
    const sourceHeight = image.naturalHeight || image.height;
    if (!sourceWidth || !sourceHeight || !width || !height) return;

    // Mirror tiling softens seams while keeping the image at its natural size.
    // backgroundImageBlendEdge is reserved for a later cross-fade edge blend.
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

async function drawFullSliceBackground(ctx, width, height, fallbackBackground = backgroundColor) {
    ctx.fillStyle = fallbackBackground || backgroundColor;
    ctx.fillRect(0, 0, width, height);

    if (!backgroundImageDataUrl) return;

    try {
        const image = await loadBackgroundImageForCanvas();
        if (image) {
            drawMirroredRepeatedImageAtNaturalSize(ctx, image, width, height);
        }
    } catch (error) {
        console.warn(error);
    }
}

async function addSliceToZip(zip, sourceCanvas, sourceY, sourceHeight, index, topPaddingHeight, watermarkBandHeight, watermarkSettings, outputHeight = null, shouldDrawWatermark = true) {
    const sliceOutputHeight = outputHeight ?? topPaddingHeight + sourceHeight + watermarkBandHeight;
    const watermarkTop = sliceOutputHeight - watermarkBandHeight;
    const sliceCanvas = document.createElement("canvas");
    const ctx = sliceCanvas.getContext("2d");

    sliceCanvas.width = sourceCanvas.width;
    sliceCanvas.height = sliceOutputHeight;
    await drawFullSliceBackground(ctx, sliceCanvas.width, sliceCanvas.height);
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

    const blob = await canvasToBlob(sliceCanvas, "image/jpeg", 1);
    zip.file(`年度总结-${String(index).padStart(2, "0")}.jpg`, blob);
}

function setButtonBusy(button, busyText) {
    if (!button) return () => {};

    const oldText = button.innerText;
    const oldDisabled = button.disabled;
    button.disabled = true;
    button.innerText = busyText;

    return () => {
        button.disabled = oldDisabled;
        button.innerText = oldText;
    };
}

function isVisibleElement(element) {
    return Boolean(element && element.offsetParent !== null);
}

function getActiveExportButton(primaryId, fallbackId) {
    const primaryButton = document.getElementById(primaryId);
    if (isVisibleElement(primaryButton)) return primaryButton;

    return document.getElementById(fallbackId);
}

async function exportSlicedImagesZip() {
    const button = getActiveExportButton("previewExportSlicesBtn", "exportSlicesBtn");
    const restoreButton = setButtonBusy(button, "正在切图...");

    try {
        if (typeof JSZip === "undefined") {
            throw new Error("JSZip 加载失败，请检查网络后重试。");
        }

        const resolution = phoneResolutions[phoneResolution] || phoneResolutions["1080x2376"];
        const poster = document.getElementById("poster");
        const posterWidth = poster?.offsetWidth || resolution.width;
        const exportScale = resolution.width / posterWidth;
        let protectedRanges = [];
        const sourceCanvas = await capturePosterCanvas({
            hideCopyright: true,
            scale: exportScale,
            transparentPosterBackground: Boolean(backgroundImageDataUrl),
            afterCapture: (canvas) => {
                protectedRanges = getProtectedTextRanges(canvas);
            }
        });
        const scale = sourceCanvas.width / posterWidth;
        const watermarkSettings = getWatermarkSettings(scale);
        const topPaddingHeight = getExportTopPaddingHeight(resolution, scale);
        const watermarkBandHeight = showBottomWatermark
            ? getWatermarkBandHeight(resolution, scale, watermarkSettings)
            : topPaddingHeight;
        const sliceHeight = resolution.height;
        const contentSliceHeight = Math.max(sliceHeight - topPaddingHeight - watermarkBandHeight, 1);
        const hasInkAtRow = createCanvasInkDetector(sourceCanvas);
        const zip = new JSZip();

        let sourceY = 0;
        let index = 1;

        while (sourceY < sourceCanvas.height) {
            const remainingHeight = sourceCanvas.height - sourceY;
            const isLastSlice = remainingHeight <= contentSliceHeight;
            const currentContentHeight = isLastSlice
                ? remainingHeight
                : getSafeContentSliceHeight(sourceCanvas, sourceY, contentSliceHeight, protectedRanges, hasInkAtRow);

            await addSliceToZip(
                zip,
                sourceCanvas,
                sourceY,
                currentContentHeight,
                index,
                topPaddingHeight,
                watermarkBandHeight,
                watermarkSettings,
                sliceHeight,
                showBottomWatermark
            );

            sourceY += currentContentHeight;
            index += 1;
        }

        if (button) {
            button.innerText = "正在打包...";
        }
        const zipBlob = await zip.generateAsync({ type: "blob" });
        const filename = "年度总结-已切图jpg.zip";
        downloadBlob(zipBlob, filename);
    } catch (error) {
        window.alert(error?.message || "切图导出失败，请稍后再试。");
    } finally {
        restoreButton();
    }
}

/* ===========================
   Init
=========================== */

loadState();
setMobileEditorPanel(activeMobileEditorPanel);

if (typeof editorWidth === "number") {
    editor.style.width = editorWidth + "px";
}

applyEditorCollapsedState({ shouldSave: false, shouldRerender: false });

if (customColorPicker) {
    customColorPicker.value = backgroundColor;
}

if (textColorPicker) {
    textColorPicker.value = textColor;
}

if (subtitleInput) {
    const subtitleEl = document.getElementById("subtitle");
    if (subtitleEl) {
        subtitleInput.value = subtitleEl.innerText;
    }
}

document.querySelectorAll("textarea").forEach(autoResizeTextarea);

if (paragraphTitleSpacingInput) {
    paragraphTitleSpacingInput.value = String(paragraphTitleSpacing);
}

if (sideSpacingInput) {
    sideSpacingInput.value = String(sideSpacing);
}

if (moduleSpacingInput) {
    moduleSpacingInput.value = String(moduleSpacing);
}

if (topPaddingInput) {
    topPaddingInput.value = String(topPadding);
}

if (sideHeaderReserveInput) {
    sideHeaderReserveInput.value = String(sideHeaderReserve);
}

scheduleTypesettingOverlay("正在排版...");
renderAuxiliaryControls();
render({
    deferEditor: true,
    previewOptions: {
        updateControls: false,
        shouldSave: false,
        hideOverlayWhenReady: true
    }
});

requestAnimationFrame(() => {
    isInitializing = false;
});
