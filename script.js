/* ===========================
   State
=========================== */

const STORAGE_KEY = "article-summary-state";
const ARTICLE_INDEX_STORAGE_KEY = "article-summary-article-index";
const CURRENT_ARTICLE_ID_STORAGE_KEY = "article-summary-current-article-id";
const ARTICLE_STATE_KEY_PREFIX = "article-summary-article:";
const ARTICLE_INDEX_SCHEMA_VERSION = 1;
const STATE_SCHEMA_VERSION = 18;
const CONTENT_EDITOR_PLACEHOLDER = "输入段落内容...";
const CARD_TITLE_PLACEHOLDER = "输入段落标题...";

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
let recentBackgroundColors = [];
let recentTextColors = [];
let fontFamily = '"Microsoft YaHei",sans-serif';
const CARD_TITLE_DEFAULT_FONT_FAMILY = '"Songti SC","STSong","SimSun",serif';
const INHERIT_FONT_VALUE = "__inherit__";
let yearFontFamily = INHERIT_FONT_VALUE;
let subtitleFontFamily = INHERIT_FONT_VALUE;
let sideFontFamily = INHERIT_FONT_VALUE;
let yearTextAlign = "left";
let subtitleTextAlign = "left";
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
let showYearShadow = true;
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
    "720x1600": { width: 720, height: 1600, cssWidth: 360 },
    "1080x1920": { width: 1080, height: 1920, cssWidth: 360 },
    "1080x2376": { width: 1080, height: 2376, cssWidth: 360 },
    "1080x2400": { width: 1080, height: 2400, cssWidth: 360 },
    "1170x2532": { width: 1170, height: 2532, cssWidth: 390 },
    "1220x2712": { width: 1220, height: 2712, cssWidth: 407 },
    "1290x2796": { width: 1290, height: 2796, cssWidth: 430 },
    "1440x3200": { width: 1440, height: 3200, cssWidth: 480 }
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

    const mobilePreviewHeight = Math.min(Math.max(height * 0.34, 220), 320);
    root.style.setProperty("--mobile-poster-width", `${Math.round(width)}px`);
    root.style.setProperty("--mobile-preview-height", `${Math.round(mobilePreviewHeight)}px`);
}

function setMobileEditorPanel(panelName = "style") {
    const nextPanel = ["article", "style", "text", "blocks", "export"].includes(panelName) ? panelName : "style";
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

function getPhoneExportCssWidth(resolution = phoneResolutions[phoneResolution] || phoneResolutions["1080x2376"]) {
    const cssWidth = Number(resolution?.cssWidth);
    return Math.max(1, Math.round(Number.isFinite(cssWidth) ? cssWidth : 360));
}

function getPhoneExportScale(resolution = phoneResolutions[phoneResolution] || phoneResolutions["1080x2376"]) {
    return resolution.width / getPhoneExportCssWidth(resolution);
}

function getLongImageExportScale(
    poster,
    resolution = phoneResolutions[phoneResolution] || phoneResolutions["1080x2376"],
    preferredScale = LONG_IMAGE_EXPORT_SCALE
) {
    const posterWidth = poster?.offsetWidth || getPhoneExportCssWidth(resolution);
    const posterHeight = poster?.scrollHeight || poster?.offsetHeight || resolution.height;
    const outputPixels = posterWidth
        * (posterHeight + topPadding)
        * preferredScale
        * preferredScale;
    const pixelLimit = isLikelyMobileBrowser()
        ? MOBILE_LONG_IMAGE_SCALE_PIXEL_LIMIT
        : DESKTOP_LONG_IMAGE_SCALE_PIXEL_LIMIT;
    if (outputPixels <= pixelLimit) return preferredScale;

    const safeScale = Math.sqrt(pixelLimit / (posterWidth * (posterHeight + topPadding)));
    const exportScale = Math.min(preferredScale, Math.max(LONG_IMAGE_MIN_EXPORT_SCALE, safeScale));
    console.info("Long image export scale reduced", {
        preferredScale,
        exportScale,
        minScale: LONG_IMAGE_MIN_EXPORT_SCALE,
        posterWidth,
        posterHeight,
        estimatedPixelsAtPreferredScale: Math.round(outputPixels),
        pixelLimit
    });

    return exportScale;
}

function getResolutionDesignScale() {
    const resolution = phoneResolutions[phoneResolution] || phoneResolutions["1080x2376"];
    return resolution.width / BASE_RESOLUTION_WIDTH;
}

function getSubtitleSettings(previewFontScale = getPreviewFontScale(), element = null) {
    const isPhoneRender = Boolean(element?.closest(".phoneRenderPoster"));
    const responsiveSettings = isPhoneRender || isMobileViewport()
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

    const settings = getSubtitleSettings(previewFontScale, element);
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
const FIXED_PRESET_COLOR_COUNT = 4;
const MAX_RECENT_COLOR_COUNT = 5;

const backgroundImageInput = document.getElementById("backgroundImageInput");
const currentWordCountElements = document.querySelectorAll("[data-current-word-count]");
const subtitleInput = document.getElementById("subtitleInput");
const articleSelect = document.getElementById("articleSelect");
const deleteArticleBtn = document.getElementById("deleteArticleBtn");
const copyStyleModal = document.getElementById("copyStyleModal");
const copyStyleSourceLabel = document.getElementById("copyStyleSourceLabel");
const copyStyleArticleList = document.getElementById("copyStyleArticleList");
const sideSpacingInput = document.getElementById("sideSpacingInput");
const paragraphTitleSpacingInput = document.getElementById("paragraphTitleSpacingInput");
const moduleSpacingInput = document.getElementById("moduleSpacingInput");
const topPaddingInput = document.getElementById("topPaddingInput");
const sideHeaderReserveInput = document.getElementById("sideHeaderReserveInput");
const customColorModalBackdrop = document.getElementById("customColorModalBackdrop");
const colorPickerControls = {
    background: {
        panel: document.getElementById("backgroundCustomColorPanel"),
        field: document.getElementById("backgroundColorField"),
        hue: document.getElementById("backgroundHueRange"),
        chip: document.getElementById("backgroundColorPreviewChip"),
        hex: document.getElementById("backgroundHexInput"),
        red: document.getElementById("backgroundRedInput"),
        green: document.getElementById("backgroundGreenInput"),
        blue: document.getElementById("backgroundBlueInput"),
        getValue: () => backgroundColor,
        preview: applyBackgroundColorPreview,
        commit: commitBackgroundColorPreview,
        addRecent: (value) => {
            recentBackgroundColors = addRecentColor(recentBackgroundColors, value);
        }
    },
    text: {
        panel: document.getElementById("textCustomColorPanel"),
        field: document.getElementById("textColorField"),
        hue: document.getElementById("textHueRange"),
        chip: document.getElementById("textColorPreviewChip"),
        hex: document.getElementById("textHexInput"),
        red: document.getElementById("textRedInput"),
        green: document.getElementById("textGreenInput"),
        blue: document.getElementById("textBlueInput"),
        getValue: () => textColor,
        preview: applyTextColorPreview,
        commit: commitTextColorPreview,
        addRecent: (value) => {
            recentTextColors = addRecentColor(recentTextColors, value);
        }
    }
};
const customColorPickerState = {
    background: { hue: 0, saturation: 0, value: 0, originalColor: backgroundColor },
    text: { hue: 0, saturation: 0, value: 0, originalColor: textColor }
};
let activeCustomColorTarget = null;

function normalizeColorValue(value) {
    if (typeof value !== "string") return "";

    const color = value.trim().toLowerCase();
    return /^#[0-9a-f]{6}$/.test(color) ? color : "";
}

function normalizeRecentColors(colors) {
    if (!Array.isArray(colors)) return [];

    const seen = new Set();
    const normalized = [];

    colors.forEach((color) => {
        const normalizedColor = normalizeColorValue(color);
        if (!normalizedColor || seen.has(normalizedColor)) return;

        seen.add(normalizedColor);
        normalized.push(normalizedColor);
    });

    return normalized.slice(0, MAX_RECENT_COLOR_COUNT);
}

function addRecentColor(colors, value) {
    const normalizedColor = normalizeColorValue(value);
    if (!normalizedColor) return colors;

    return [
        normalizedColor,
        ...normalizeRecentColors(colors).filter((color) => color !== normalizedColor)
    ].slice(0, MAX_RECENT_COLOR_COUNT);
}

function clampNumber(value, min, max) {
    const number = Number(value);
    if (!Number.isFinite(number)) return min;

    return Math.min(Math.max(number, min), max);
}

function componentToHex(value) {
    return Math.round(clampNumber(value, 0, 255)).toString(16).padStart(2, "0");
}

function rgbToHex({ r, g, b }) {
    return `#${componentToHex(r)}${componentToHex(g)}${componentToHex(b)}`;
}

function hexToRgb(value) {
    const color = normalizeColorValue(value);
    if (!color) return null;

    return {
        r: parseInt(color.slice(1, 3), 16),
        g: parseInt(color.slice(3, 5), 16),
        b: parseInt(color.slice(5, 7), 16)
    };
}

function rgbToHsv({ r, g, b }) {
    const red = clampNumber(r, 0, 255) / 255;
    const green = clampNumber(g, 0, 255) / 255;
    const blue = clampNumber(b, 0, 255) / 255;
    const max = Math.max(red, green, blue);
    const min = Math.min(red, green, blue);
    const delta = max - min;
    let hue = 0;

    if (delta !== 0) {
        if (max === red) {
            hue = 60 * (((green - blue) / delta) % 6);
        } else if (max === green) {
            hue = 60 * ((blue - red) / delta + 2);
        } else {
            hue = 60 * ((red - green) / delta + 4);
        }
    }

    return {
        hue: Math.round((hue + 360) % 360),
        saturation: max === 0 ? 0 : Math.round((delta / max) * 100),
        value: Math.round(max * 100)
    };
}

function hsvToRgb({ hue, saturation, value }) {
    const h = clampNumber(hue, 0, 360);
    const s = clampNumber(saturation, 0, 100) / 100;
    const v = clampNumber(value, 0, 100) / 100;
    const chroma = v * s;
    const x = chroma * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = v - chroma;
    let red = 0;
    let green = 0;
    let blue = 0;

    if (h < 60) {
        red = chroma;
        green = x;
    } else if (h < 120) {
        red = x;
        green = chroma;
    } else if (h < 180) {
        green = chroma;
        blue = x;
    } else if (h < 240) {
        green = x;
        blue = chroma;
    } else if (h < 300) {
        red = x;
        blue = chroma;
    } else {
        red = chroma;
        blue = x;
    }

    return {
        r: Math.round((red + m) * 255),
        g: Math.round((green + m) * 255),
        b: Math.round((blue + m) * 255)
    };
}

function getCustomPickerColor(target) {
    return rgbToHex(hsvToRgb(customColorPickerState[target]));
}

function buildPaletteColors(recentColors) {
    const fixedColors = presetColors.slice(0, FIXED_PRESET_COLOR_COUNT);
    const normalizedRecentColors = normalizeRecentColors(recentColors);
    const fallbackColors = presetColors
        .slice(FIXED_PRESET_COLOR_COUNT)
        .filter((color) => !normalizedRecentColors.includes(color.toLowerCase()));
    const recentSlots = [
        ...normalizedRecentColors,
        ...fallbackColors
    ].slice(0, MAX_RECENT_COLOR_COUNT);

    return [
        ...fixedColors.map((color) => ({ color, isRecent: false })),
        ...recentSlots.map((color) => ({
            color,
            isRecent: normalizedRecentColors.includes(color.toLowerCase())
        }))
    ];
}

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

const DEFAULT_ARTICLE_DATA = [
    {
        type: "text",
        title: "文字段落一",
        titlePlaceholder: CARD_TITLE_PLACEHOLDER,
        text: "",
        titleSize: 70,  // 段落标题
        textSize: 48,   // 段落内容
        titleFontFamily: CARD_TITLE_DEFAULT_FONT_FAMILY,
        contentFontFamily: INHERIT_FONT_VALUE,
        contentFontToolbarValue: INHERIT_FONT_VALUE,
        titleAlign: "left",
        textAlign: "left",
        hidden: false,
        lineSpacing: 1.8,
        paragraphSpacing: 0
    },
    {
        type: "text",
        title: "文字段落二",
        titlePlaceholder: CARD_TITLE_PLACEHOLDER,
        text: "",
        titleSize: 70,
        textSize: 48,
        titleFontFamily: CARD_TITLE_DEFAULT_FONT_FAMILY,
        contentFontFamily: INHERIT_FONT_VALUE,
        contentFontToolbarValue: INHERIT_FONT_VALUE,
        titleAlign: "left",
        textAlign: "left",
        hidden: false,
        lineSpacing: 1.8,
        paragraphSpacing: 0
    }
];

function createDefaultArticleData() {
    return DEFAULT_ARTICLE_DATA.map((item) => ({ ...item }));
}

let data = createDefaultArticleData();
let articleIndex = { schemaVersion: ARTICLE_INDEX_SCHEMA_VERSION, articles: [] };
let currentArticleId = "";
let editorWidth = null;
let editorCollapsed = false;
let phonePreviewFrame = null;
let phonePreviewSyncInProgress = false;
let pendingPhonePreviewSync = false;
let phoneRenderPoster = null;
let phoneRenderLayoutSignature = "";
let phoneRenderLayoutPromise = null;
let isInitializing = true;
let editorRenderFrame = null;
let wordCountRenderFrame = null;
let backgroundImageCanvasCache = {
    src: "",
    promise: null,
    image: null
};
const richTextSelections = new Map();
const collapsedCardEditorIndexes = new Set();
const TEXT_ALIGN_VALUES = Object.freeze(["left", "center", "right"]);
const TEXT_ALIGN_LABELS = Object.freeze({
    left: "左对齐",
    center: "居中",
    right: "右对齐"
});
const COPY_STYLE_STATE_KEYS = Object.freeze([
    "globalFont",
    "backgroundColor",
    "textColor",
    "recentBackgroundColors",
    "recentTextColors",
    "yearFontFamily",
    "subtitleFontFamily",
    "sideFontFamily",
    "yearTextAlign",
    "subtitleTextAlign",
    "sideSpacing",
    "paragraphTitleSpacing",
    "moduleSpacing",
    "topPadding",
    "sideHeaderReserve",
    "showTimeline",
    "showMonthTitles",
    "showMonthUnderlines",
    "showSideHeader",
    "showYearShadow",
    "showBottomWatermark",
    "showPhonePreview",
    "phoneResolution",
    "phonePreviewScale",
    "subtitlePosition"
]);
const COPY_STYLE_CONTENT_KEYS = Object.freeze([
    "yearTitle",
    "subtitle",
    "sideHeader"
]);

const {
    CARD_TYPE_IMAGE,
    createTextCard,
    createImageCard,
    isImageCard,
    normalizeData,
    compressCardImageFile,
    waitForPosterImagesLoaded,
    renderPreviewCard,
    renderTextCardEditorBody,
    renderImageCardEditorBody
} = window.ArticleParagraphs.createParagraphModule({
    CARD_TITLE_DEFAULT_FONT_FAMILY,
    INHERIT_FONT_VALUE,
    escapeHtml,
    plainTextToRichText,
    sanitizeRichText,
    normalizeTextAlign,
    renderRichTextPreview,
    renderTextAlignControls,
    resolveCardTitleFontFamily,
    resolveCardContentFontFamily,
    getItemLineSpacing,
    getItemParagraphSpacing,
    renderFontOptionElements
});

const imageStore = window.ArticleImageStore || null;

function createArticleId() {
    const randomPart = Math.random().toString(36).slice(2, 8);
    return `article_${Date.now().toString(36)}_${randomPart}`;
}

function getArticleStorageKey(articleId) {
    return `${ARTICLE_STATE_KEY_PREFIX}${articleId}`;
}

function getFallbackArticleTitle(state = null) {
    const yearTitle = String(state?.yearTitle ?? document.getElementById("yearInput")?.value ?? "").trim();
    return yearTitle || "未命名文章";
}

function normalizeArticleMeta(meta) {
    if (!meta || typeof meta !== "object" || typeof meta.id !== "string" || !meta.id) return null;

    return {
        id: meta.id,
        title: typeof meta.title === "string" && meta.title.trim() ? meta.title.trim() : "未命名文章",
        titleLocked: meta.titleLocked === true,
        createdAt: Number.isFinite(meta.createdAt) ? meta.createdAt : Date.now(),
        updatedAt: Number.isFinite(meta.updatedAt) ? meta.updatedAt : Date.now()
    };
}

function loadArticleIndexFromStorage() {
    try {
        const raw = localStorage.getItem(ARTICLE_INDEX_STORAGE_KEY);
        if (!raw) return { schemaVersion: ARTICLE_INDEX_SCHEMA_VERSION, articles: [] };

        const parsed = JSON.parse(raw);
        const articles = Array.isArray(parsed?.articles)
            ? parsed.articles.map(normalizeArticleMeta).filter(Boolean)
            : [];

        return {
            schemaVersion: ARTICLE_INDEX_SCHEMA_VERSION,
            articles
        };
    } catch (error) {
        return { schemaVersion: ARTICLE_INDEX_SCHEMA_VERSION, articles: [] };
    }
}

function saveArticleIndexToStorage() {
    localStorage.setItem(ARTICLE_INDEX_STORAGE_KEY, JSON.stringify({
        schemaVersion: ARTICLE_INDEX_SCHEMA_VERSION,
        articles: articleIndex.articles
    }));
}

function saveCurrentArticleIdToStorage() {
    if (currentArticleId) {
        localStorage.setItem(CURRENT_ARTICLE_ID_STORAGE_KEY, currentArticleId);
    }
}

function getCurrentArticleMeta() {
    return articleIndex.articles.find((article) => article.id === currentArticleId) || null;
}

function createBlankPersistedState() {
    return {
        globalFont: { year: 78, subtitle: 42, side: 128 },
        data: serializeDataForState(createDefaultArticleData()),
        collapsedCardEditorIndexes: [],
        editorWidth: null,
        editorCollapsed: false,
        backgroundColor: "#efefef",
        backgroundImageDataUrl: "",
        backgroundImageName: "",
        backgroundImageBlendEdge: 0,
        textColor: "#111111",
        recentBackgroundColors: [],
        recentTextColors: [],
        yearFontFamily: INHERIT_FONT_VALUE,
        subtitleFontFamily: INHERIT_FONT_VALUE,
        sideFontFamily: INHERIT_FONT_VALUE,
        yearTextAlign: "left",
        subtitleTextAlign: "left",
        lineSpacing: 1.8,
        paragraphSpacing: 0,
        sideSpacing: 0,
        paragraphTitleSpacing: 0,
        moduleSpacing: 58,
        topPadding: 58,
        sideHeaderReserve: 0,
        showTimeline: true,
        showMonthTitles: true,
        showMonthUnderlines: true,
        showSideHeader: true,
        showYearShadow: true,
        showBottomWatermark: true,
        showPhonePreview: false,
        phoneResolution: "1080x2376",
        phonePreviewScale: 1,
        subtitlePosition: "belowTitle",
        yearTitle: "",
        sideHeader: "",
        subtitle: "",
        schemaVersion: STATE_SCHEMA_VERSION
    };
}

function initializeArticleWorkspace() {
    articleIndex = loadArticleIndexFromStorage();
    currentArticleId = localStorage.getItem(CURRENT_ARTICLE_ID_STORAGE_KEY) || "";

    if (!articleIndex.articles.length) {
        const articleId = createArticleId();
        const legacyRaw = localStorage.getItem(STORAGE_KEY);
        let title = "未命名文章";

        if (legacyRaw) {
            try {
                title = getFallbackArticleTitle(JSON.parse(legacyRaw));
            } catch (error) {
                title = "未命名文章";
            }
            localStorage.setItem(getArticleStorageKey(articleId), legacyRaw);
        } else {
            localStorage.setItem(getArticleStorageKey(articleId), JSON.stringify(createBlankPersistedState()));
        }

        const now = Date.now();
        articleIndex.articles = [{
            id: articleId,
            title,
            titleLocked: false,
            createdAt: now,
            updatedAt: now
        }];
        currentArticleId = articleId;
        saveArticleIndexToStorage();
        saveCurrentArticleIdToStorage();
        return;
    }

    if (!articleIndex.articles.some((article) => article.id === currentArticleId)) {
        currentArticleId = articleIndex.articles[0].id;
        saveCurrentArticleIdToStorage();
    }

    saveArticleIndexToStorage();
}

function resetRuntimeState() {
    globalFont = { year: 78, subtitle: 42, side: 128 };
    data = createDefaultArticleData();
    editorWidth = null;
    editorCollapsed = false;
    backgroundColor = "#efefef";
    backgroundImageDataUrl = "";
    backgroundImageName = "";
    backgroundImageBlendEdge = 0;
    textColor = "#111111";
    recentBackgroundColors = [];
    recentTextColors = [];
    yearFontFamily = INHERIT_FONT_VALUE;
    subtitleFontFamily = INHERIT_FONT_VALUE;
    sideFontFamily = INHERIT_FONT_VALUE;
    yearTextAlign = "left";
    subtitleTextAlign = "left";
    lineSpacing = 1.8;
    paragraphSpacing = 0;
    sideSpacing = 0;
    paragraphTitleSpacing = 0;
    moduleSpacing = 58;
    topPadding = 58;
    sideHeaderReserve = 0;
    showTimeline = true;
    showMonthTitles = true;
    showMonthUnderlines = true;
    showSideHeader = true;
    showYearShadow = true;
    showBottomWatermark = true;
    showPhonePreview = false;
    phoneResolution = "1080x2376";
    phonePreviewScale = 1;
    subtitlePosition = "belowTitle";
    collapsedCardEditorIndexes.clear();

    const yearInput = document.getElementById("yearInput");
    const sideInput = document.getElementById("sideInput");
    if (yearInput) yearInput.value = "";
    if (subtitleInput) subtitleInput.value = "";
    if (sideInput) sideInput.value = "";
}

function loadState() {
    try {
        const raw = localStorage.getItem(getArticleStorageKey(currentArticleId));
        if (!raw) return;

        const state = JSON.parse(raw);
        if (!state || typeof state !== "object") return;

        resetRuntimeState();

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

        recentBackgroundColors = normalizeRecentColors(state.recentBackgroundColors);
        recentTextColors = normalizeRecentColors(state.recentTextColors);

        if (typeof state.yearFontFamily === "string") {
            yearFontFamily = state.yearFontFamily;
        }

        if (typeof state.subtitleFontFamily === "string") {
            subtitleFontFamily = state.subtitleFontFamily;
        }

        if (typeof state.sideFontFamily === "string") {
            sideFontFamily = state.sideFontFamily;
        }

        yearTextAlign = normalizeTextAlign(state.yearTextAlign);
        subtitleTextAlign = normalizeTextAlign(state.subtitleTextAlign);

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

        collapsedCardEditorIndexes.clear();
        if (Array.isArray(state.collapsedCardEditorIndexes)) {
            state.collapsedCardEditorIndexes.forEach((index) => {
                if (Number.isInteger(index) && index >= 0 && index < data.length) {
                    collapsedCardEditorIndexes.add(index);
                }
            });
        }

        if (typeof state.subtitle === "string") {
            if (subtitleInput) {
                subtitleInput.value = state.subtitle;
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
        if (typeof state.showYearShadow === "boolean") {
            showYearShadow = state.showYearShadow;
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

function extractPlainTextFromRichText(value) {
    const template = document.createElement("template");
    template.innerHTML = String(value ?? "");
    const blockTags = new Set(["DIV", "P"]);

    function readNode(node) {
        if (node.nodeType === Node.TEXT_NODE) return node.nodeValue || "";
        if (node.nodeType !== Node.ELEMENT_NODE && node.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) return "";
        if (node.nodeType === Node.ELEMENT_NODE && node.tagName === "BR") return "\n";

        const text = Array.from(node.childNodes).map(readNode).join("");
        if (node.nodeType === Node.ELEMENT_NODE && blockTags.has(node.tagName)) {
            return `${text}\n`;
        }

        return text;
    }

    return readNode(template.content).replace(/\n$/, "");
}

function countTextUnits(value) {
    const text = String(value ?? "");
    const tokens = text.match(/[A-Za-z0-9]+|[\s\S]/g);
    return tokens ? tokens.length : 0;
}

function getCurrentParagraphWordCount() {
    return data.reduce((total, item, index) => {
        if (item?.hidden || isImageCard(item)) return total;

        const pendingText = pendingMobileTextInputs.has(index)
            ? pendingMobileTextInputs.get(index)
            : item?.text;

        return total + countTextUnits(extractPlainTextFromRichText(pendingText));
    }, 0);
}

function updateCurrentWordCount() {
    if (!currentWordCountElements.length) return;

    const text = `当前字符数：${getCurrentParagraphWordCount()}`;
    currentWordCountElements.forEach((element) => {
        element.textContent = text;
    });
}

function scheduleCurrentWordCountUpdate() {
    if (!currentWordCountElements.length || wordCountRenderFrame !== null) return;

    wordCountRenderFrame = requestAnimationFrame(() => {
        wordCountRenderFrame = null;
        updateCurrentWordCount();
    });
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

function autoResizeTextarea(element) {
    if (!element) return;

    element.style.height = "auto";
    element.style.height = `${element.scrollHeight}px`;
}

function getImageStoreId(image) {
    if (!image || typeof image !== "object") return "";
    if (typeof image.imageStoreId === "string" && image.imageStoreId) return image.imageStoreId;
    return "";
}

function serializeImageForState(image) {
    const persistedImage = { ...image };

    if (getImageStoreId(persistedImage)) {
        persistedImage.imageDataUrl = "";
    }

    return persistedImage;
}

function serializeImageCardForState(item) {
    const images = getCardImages(item).map(serializeImageForState);
    const primary = images[0] || {};

    return {
        ...item,
        images,
        imageDataUrl: primary.imageDataUrl || "",
        imageName: primary.imageName || "",
        imageMimeType: primary.imageMimeType || "",
        imageOriginalMimeType: primary.imageOriginalMimeType || "",
        imageHasTransparency: primary.imageHasTransparency === true,
        imageBytes: primary.imageBytes || 0,
        imageWidth: primary.imageWidth || 0,
        imageHeight: primary.imageHeight || 0
    };
}

function serializeDataForState(items) {
    return items.map((item) => isImageCard(item) ? serializeImageCardForState(item) : item);
}

function buildPersistedState() {
    return {
        globalFont,
        data: serializeDataForState(data),
        collapsedCardEditorIndexes: Array.from(collapsedCardEditorIndexes)
            .filter((index) => Number.isInteger(index) && index >= 0 && index < data.length),
        editorWidth,
        editorCollapsed,
        backgroundColor,
        backgroundImageDataUrl,
        backgroundImageName,
        backgroundImageBlendEdge,
        textColor,
        recentBackgroundColors,
        recentTextColors,
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
        showSideHeader,
        showYearShadow,
        showBottomWatermark,
        showPhonePreview,
        phoneResolution,
        phonePreviewScale,
        subtitlePosition,
        yearTitle: document.getElementById("yearInput")?.value ?? "",
        sideHeader: document.getElementById("sideInput")?.value ?? "",
        subtitle: document.getElementById("subtitleInput")?.value ?? "",
        schemaVersion: STATE_SCHEMA_VERSION
    };
}

function loadPersistedArticleState(articleId) {
    try {
        const raw = localStorage.getItem(getArticleStorageKey(articleId));
        if (!raw) return null;

        const state = JSON.parse(raw);
        return state && typeof state === "object" ? state : null;
    } catch (error) {
        return null;
    }
}

function copyArticleStyleState(sourceState, targetState) {
    const nextState = targetState && typeof targetState === "object"
        ? { ...targetState }
        : createBlankPersistedState();
    const preservedContent = {};

    COPY_STYLE_CONTENT_KEYS.forEach((key) => {
        if (Object.prototype.hasOwnProperty.call(nextState, key)) {
            preservedContent[key] = nextState[key];
        }
    });

    COPY_STYLE_STATE_KEYS.forEach((key) => {
        if (Object.prototype.hasOwnProperty.call(sourceState, key)) {
            nextState[key] = sourceState[key];
        }
    });

    COPY_STYLE_CONTENT_KEYS.forEach((key) => {
        if (Object.prototype.hasOwnProperty.call(preservedContent, key)) {
            nextState[key] = preservedContent[key];
        }
    });

    if (Array.isArray(targetState?.data) && Array.isArray(sourceState.data)) {
        nextState.data = targetState.data.map((targetItem, index) => {
            const sourceItem = sourceState.data[index];
            if (!targetItem || typeof targetItem !== "object" || !sourceItem || typeof sourceItem !== "object") {
                return targetItem;
            }

            return typeof sourceItem.titleSize === "number"
                ? { ...targetItem, titleSize: sourceItem.titleSize }
                : targetItem;
        });
    }

    nextState.schemaVersion = STATE_SCHEMA_VERSION;
    return nextState;
}

function getArticleStylePreviewText(state) {
    if (!state || typeof state !== "object") return "暂无可预览内容";

    const blockCount = Array.isArray(state.data) ? state.data.length : 0;
    return blockCount ? `${blockCount} 个段落` : "暂无可预览内容";
}

function renderCopyStyleArticleList() {
    if (!copyStyleArticleList) return;

    const sourceArticle = getCurrentArticleMeta();
    const sourceState = buildPersistedState();
    const targetArticles = articleIndex.articles.filter((article) => article.id !== currentArticleId);

    if (copyStyleSourceLabel) {
        copyStyleSourceLabel.textContent = `来源：${sourceArticle?.title || getFallbackArticleTitle(sourceState)}`;
    }

    if (!targetArticles.length) {
        copyStyleArticleList.innerHTML = '<div class="copyStyleEmpty">暂无其他文章可复制。</div>';
        return;
    }

    copyStyleArticleList.innerHTML = targetArticles
        .map((article) => {
            const state = loadPersistedArticleState(article.id);
            const preview = getArticleStylePreviewText(state);
            return `
                <label class="copyStyleArticleOption">
                    <input type="checkbox" value="${escapeHtml(article.id)}">
                    <span class="copyStyleArticleText">
                        <strong>${escapeHtml(article.title)}</strong>
                        <span>${escapeHtml(preview)}</span>
                    </span>
                </label>
            `;
        })
        .join("");
}

function openCopyStyleModal() {
    if (!copyStyleModal) return;

    flushPendingInputAndState();
    renderCopyStyleArticleList();
    copyStyleModal.hidden = false;
}

function closeCopyStyleModal() {
    if (!copyStyleModal) return;

    copyStyleModal.hidden = true;
}

function confirmCopyStyleToArticles() {
    if (!copyStyleArticleList) return;

    const targetIds = Array.from(copyStyleArticleList.querySelectorAll('input[type="checkbox"]:checked'))
        .map((input) => input.value)
        .filter((articleId) => articleId && articleId !== currentArticleId);

    if (!targetIds.length) {
        window.alert("请选择要复制到的文章。");
        return;
    }

    flushPendingInputAndState();
    const sourceState = buildPersistedState();
    const now = Date.now();
    let copiedCount = 0;

    targetIds.forEach((articleId) => {
        const targetState = loadPersistedArticleState(articleId) || createBlankPersistedState();
        const nextState = copyArticleStyleState(sourceState, targetState);
        localStorage.setItem(getArticleStorageKey(articleId), JSON.stringify(nextState));

        const article = articleIndex.articles.find((item) => item.id === articleId);
        if (article) {
            article.updatedAt = now;
        }
        copiedCount += 1;
    });

    saveArticleIndexToStorage();
    renderArticleManager();
    closeCopyStyleModal();
    window.alert(`已复制样式到 ${copiedCount} 篇文章。`);
}

function renderArticleManager() {
    if (!articleSelect) return;

    articleSelect.innerHTML = articleIndex.articles
        .map((article) => `<option value="${escapeHtml(article.id)}">${escapeHtml(article.title)}</option>`)
        .join("");
    articleSelect.value = currentArticleId;

    if (deleteArticleBtn) {
        deleteArticleBtn.disabled = articleIndex.articles.length <= 1;
    }
}

function updateCurrentArticleMetaFromState(state) {
    const article = getCurrentArticleMeta();
    if (!article) return;

    if (!article.titleLocked) {
        article.title = getFallbackArticleTitle(state);
    }
    article.updatedAt = Date.now();
    saveArticleIndexToStorage();
    renderArticleManager();
}

function commitStateSave() {
    if (isInitializing) return;

    try {
        const json = JSON.stringify(buildPersistedState());
        if (json === lastSavedStateJson) return;

        localStorage.setItem(getArticleStorageKey(currentArticleId), json);
        lastSavedStateJson = json;
        updateCurrentArticleMetaFromState(JSON.parse(json));
    } catch (error) {
        console.warn("State save failed", error);
        if (!stateSaveErrorShown) {
            stateSaveErrorShown = true;
            window.alert("本地保存失败，可能是浏览器存储空间已满。请减少图片或清理浏览器存储后重试。");
        }
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

function flushPendingInputAndState() {
    const hadPendingInput = flushPendingMobileTextInputs({ schedulePreview: false });

    if (hadPendingInput) {
        saveState({ immediate: true });
        return;
    }

    flushPendingStateSave();
}

function syncControlsFromRuntimeState() {
    setMobileEditorPanel(activeMobileEditorPanel);
    updateMobileTypesetRefreshButton();

    if (typeof editorWidth === "number") {
        editor.style.width = editorWidth + "px";
    } else {
        editor.style.width = "";
    }

    applyEditorCollapsedState({ shouldSave: false, shouldRerender: false });

    setCustomPickerFromColor("background", backgroundColor, { preview: false });
    setCustomPickerFromColor("text", textColor, { preview: false });

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

    renderArticleManager();
}

async function loadCurrentArticleIntoEditor({ saveAfterHydrate = false } = {}) {
    isInitializing = true;
    loadState();
    const didHydrateStoredImages = await hydrateStoredCardImages();
    syncControlsFromRuntimeState();
    isInitializing = false;

    if (saveAfterHydrate && didHydrateStoredImages) {
        saveState({ immediate: true });
    }

    return didHydrateStoredImages;
}

async function switchArticle(articleId) {
    if (!articleId || articleId === currentArticleId) {
        renderArticleManager();
        return;
    }

    if (!articleIndex.articles.some((article) => article.id === articleId)) {
        renderArticleManager();
        return;
    }

    flushPendingInputAndState();
    currentArticleId = articleId;
    saveCurrentArticleIdToStorage();
    lastSavedStateJson = "";

    await loadCurrentArticleIntoEditor();
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
    syncPhonePreview();
}

async function createArticle() {
    flushPendingInputAndState();

    const articleId = createArticleId();
    const now = Date.now();
    const state = createBlankPersistedState();

    articleIndex.articles.unshift({
        id: articleId,
        title: "未命名文章",
        titleLocked: false,
        createdAt: now,
        updatedAt: now
    });
    currentArticleId = articleId;
    localStorage.setItem(getArticleStorageKey(articleId), JSON.stringify(state));
    saveArticleIndexToStorage();
    saveCurrentArticleIdToStorage();
    lastSavedStateJson = "";

    await loadCurrentArticleIntoEditor();
    renderAuxiliaryControls();
    render({
        deferEditor: true,
        previewOptions: { updateControls: false, shouldSave: false, hideOverlayWhenReady: true }
    });
}

async function duplicateArticle() {
    flushPendingInputAndState();

    const sourceState = buildPersistedState();
    const sourceMeta = getCurrentArticleMeta();
    const articleId = createArticleId();
    const now = Date.now();
    const title = `${sourceMeta?.title || getFallbackArticleTitle(sourceState)} 副本`;

    articleIndex.articles.unshift({
        id: articleId,
        title,
        titleLocked: true,
        createdAt: now,
        updatedAt: now
    });
    currentArticleId = articleId;
    localStorage.setItem(getArticleStorageKey(articleId), JSON.stringify(sourceState));
    saveArticleIndexToStorage();
    saveCurrentArticleIdToStorage();
    lastSavedStateJson = "";

    await loadCurrentArticleIntoEditor();
    renderAuxiliaryControls();
    render({
        deferEditor: true,
        previewOptions: { updateControls: false, shouldSave: false, hideOverlayWhenReady: true }
    });
}

function renameArticle() {
    const article = getCurrentArticleMeta();
    if (!article) return;

    const nextTitle = window.prompt("文章名称", article.title);
    if (nextTitle === null) return;

    const normalizedTitle = nextTitle.trim();
    if (!normalizedTitle) {
        window.alert("文章名称不能为空。");
        return;
    }

    article.title = normalizedTitle;
    article.titleLocked = true;
    article.updatedAt = Date.now();
    saveArticleIndexToStorage();
    renderArticleManager();
}

async function deleteArticle() {
    if (articleIndex.articles.length <= 1) {
        window.alert("至少保留一篇文章。");
        return;
    }

    const article = getCurrentArticleMeta();
    if (!article) return;

    const ok = window.confirm(`确定要删除“${article.title}”吗？`);
    if (!ok) return;

    localStorage.removeItem(getArticleStorageKey(article.id));
    articleIndex.articles = articleIndex.articles.filter((item) => item.id !== article.id);
    currentArticleId = articleIndex.articles[0]?.id || "";
    saveArticleIndexToStorage();
    saveCurrentArticleIdToStorage();
    lastSavedStateJson = "";

    await loadCurrentArticleIntoEditor();
    renderAuxiliaryControls();
    render({
        deferEditor: true,
        previewOptions: { updateControls: false, shouldSave: false, hideOverlayWhenReady: true }
    });
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

function normalizeTextAlign(value) {
    return TEXT_ALIGN_VALUES.includes(value) ? value : "left";
}

function applyTextAlign(element, align) {
    if (!element) return;

    const textAlign = normalizeTextAlign(align);
    element.style.textAlign = textAlign;
    element.dataset.textAlign = textAlign;
}

function getTypesetTransformOrigin(align) {
    const textAlign = normalizeTextAlign(align);
    if (textAlign === "right") return "right center";
    if (textAlign === "center") return "center center";
    return "left center";
}

function applyTypesetLineAlignment(element, align) {
    if (!element) return;

    const textAlign = normalizeTextAlign(align);
    applyTextAlign(element, textAlign);
    element.querySelectorAll(".typesetLine").forEach((line) => {
        line.style.textAlign = textAlign;
    });
    element.querySelectorAll(".typesetLineInner").forEach((inner) => {
        inner.style.transformOrigin = getTypesetTransformOrigin(textAlign);
    });
}

function renderHeadlineAlignControl(target) {
    const container = document.getElementById(`${target}AlignControls`);
    if (!container) return;

    const align = target === "year" ? yearTextAlign : subtitleTextAlign;
    container.innerHTML = renderTextAlignControls(target, align, {
        disabled: target === "subtitle" && subtitlePosition === "verticalLeft"
    });
}

function applyHeadlineTextAlignPreview(target) {
    const element = target === "year"
        ? document.getElementById("year")
        : document.getElementById("subtitle");
    const align = target === "year"
        ? yearTextAlign
        : (subtitlePosition === "verticalLeft" ? "left" : subtitleTextAlign);

    applyTypesetLineAlignment(element, align);
    renderHeadlineAlignControl(target);
    schedulePhonePreviewSync();
    saveState();
}

function renderCardAlignControl(target) {
    const [type, rawIndex] = String(target || "").split(":");
    const index = Number(rawIndex);
    if (!Number.isInteger(index) || !data[index]) return;

    const block = document.querySelector(`.block[data-card-editor-index="${index}"]`);
    const container = block?.querySelector(`[data-align-control-target="${target}"]`);
    if (!container) return;

    const align = type === "cardTitle" ? data[index].titleAlign : data[index].textAlign;
    container.innerHTML = renderTextAlignControls(target, align);
}

function applyCardTextAlignPreview(index, type) {
    const card = document.querySelector(`#cards .card[data-card-index="${index}"]`);
    if (!card) {
        scheduleCardPreviewRender(index);
        return;
    }

    const selector = type === "cardTitle" ? ".cardTitle" : ".info";
    const element = card.querySelector(selector);
    const align = type === "cardTitle" ? data[index]?.titleAlign : data[index]?.textAlign;
    if (!element || !align) {
        scheduleCardPreviewRender(index);
        return;
    }

    applyTypesetLineAlignment(element, align);
    renderCardAlignControl(`${type}:${index}`);
    schedulePhonePreviewSync();
    saveState();
}

function renderTextAlignControls(target, selectedValue, { disabled = false } = {}) {
    const selectedAlign = normalizeTextAlign(selectedValue);
    const disabledAttribute = disabled ? " disabled" : "";

    return `
        <div class="textAlignControls" role="group" aria-label="对齐方式">
            ${TEXT_ALIGN_VALUES.map((align) => `
                <button
                    type="button"
                    class="${align === selectedAlign ? "active" : ""}"
                    title="${TEXT_ALIGN_LABELS[align]}"
                    aria-label="${TEXT_ALIGN_LABELS[align]}"
                    onclick="changeTextAlign('${target}','${align}')"
                    ${disabledAttribute}>${TEXT_ALIGN_LABELS[align]}</button>
            `).join("")}
        </div>
    `;
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

function renderPosterCards(poster, previewFontScale = getPreviewFontScale()) {
    const cards = getPosterPart(poster, "cards");
    if (!cards) return;

    cards.innerHTML = data
        .map((item, index) => item.hidden ? "" : renderPreviewCard(item, index, previewFontScale))
        .join("");
    bindCardImageLoadHandlers(cards);
}

function handleCardImageLoaded() {
    syncCardsOffset();
    schedulePosterBackgroundSync(document.getElementById("poster"));
    schedulePhonePreviewSync();
    saveState();
}

function bindCardImageLoadHandlers(root) {
    Array.from(root?.querySelectorAll(".cardImage") || []).forEach((image) => {
        if (image.dataset.loadHandlerBound === "true") return;

        image.dataset.loadHandlerBound = "true";
        image.addEventListener("load", handleCardImageLoaded, { once: true });
        if (image.complete && image.naturalWidth > 0) {
            handleCardImageLoaded();
        }
    });
}

function renderPreviewCardByIndex(index, { deferTypesetting = false } = {}) {
    const item = data[index];
    const existingCard = document.querySelector(`#cards .card[data-card-index="${index}"]`);

    if (!item || item.hidden || !existingCard) {
        renderPreview();
        return;
    }

    const template = document.createElement("template");
    template.innerHTML = renderPreviewCard(item, index, getPreviewFontScale()).trim();
    const nextCard = template.content.firstElementChild;

    if (!nextCard) {
        renderPreview();
        return;
    }

    existingCard.replaceWith(nextCard);
    bindCardImageLoadHandlers(nextCard);

    if (deferTypesetting) {
        markMobileTypesettingDirty();
    } else {
        cancelDeferredCardTypesetting(index);
        applyCardTypesetting(nextCard);
        schedulePhonePreviewSync();
    }

    syncCardsOffset();
    schedulePosterBackgroundSync(document.getElementById("poster"));
    saveState();
}

function flushPendingCardPreviewRenders() {
    const indexes = Array.from(pendingCardPreviewIndexes);
    pendingCardPreviewIndexes.clear();

    indexes.forEach((index) => {
        const deferTypesetting = pendingDeferredCardPreviewIndexes.has(index);
        pendingDeferredCardPreviewIndexes.delete(index);
        renderPreviewCardByIndex(index, { deferTypesetting });
    });
}

function scheduleCardPreviewRender(index) {
    pendingCardPreviewIndexes.add(index);

    if (isMobileViewport()) {
        pendingDeferredCardPreviewIndexes.add(index);
        markMobileTypesettingDirty();
    }

    schedulePreviewRender(PREVIEW_RENDER_DELAY_MS, flushPendingCardPreviewRenders);
}

function scheduleDeferredFullPreviewRender(delay = PREVIEW_RENDER_DELAY_MS) {
    if (isMobileViewport()) {
        scheduleMobileFastPreviewRender(delay);
        return;
    }

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
        applyTextAlign(yearElement, yearTextAlign);
    }

    if (subtitleElement) {
        subtitleElement.classList.remove("typesetText");
        subtitleElement.style.fontFamily = resolveSubtitleFontFamily();
        subtitleElement.style.color = textColor;
        applySubtitleSettings(subtitleElement, previewFontScale);
        applyTextAlign(subtitleElement, subtitlePosition === "verticalLeft" ? "left" : subtitleTextAlign);
        renderVerticalTextTarget("subtitle");
    }

    if (sideElement) {
        sideElement.style.fontFamily = resolveSideFontFamily();
        sideElement.style.fontSize = globalFont.side * previewFontScale + "px";
        renderVerticalTextTarget("side");
    }

    scheduleMobileFastPreviewRender();
}

function renderAuxiliaryControls() {
    renderBackgroundPalette();
    renderBackgroundImageControls();
    renderTextColorPalette();
    updateTimelineButtons();
}

function applyPosterContainerState(poster) {
    if (!poster) return;

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
    poster.classList.toggle("hideYearShadow", !showYearShadow);
    poster.classList.toggle("subtitleVerticalLeft", subtitlePosition === "verticalLeft");
}

async function renderPreview({ updateControls = false, shouldSave = true, deferTypesetting = false, hideOverlayWhenReady = false, scheduleDeferredTypesetting = true, schedulePhonePreview = true } = {}) {
    const shouldManualMobileTypeset = isMobileViewport() && deferTypesetting;

    cancelDeferredPosterTypesetting();
    cancelPendingPreviewRender();
    pendingCardPreviewIndexes.clear();
    pendingDeferredCardPreviewIndexes.clear();
    Array.from(pendingCardTypesetTasks.keys()).forEach(cancelDeferredCardTypesetting);
    applyResponsiveViewport();

    const previewFontScale = getPreviewFontScale();
    const resolutionDesignScale = getResolutionDesignScale();

    const yearElement = document.getElementById("year");
    const yearText = document.getElementById("yearInput").value;
    yearElement.classList.remove("typesetText");
    yearElement.innerText = yearText;
    yearElement.dataset.shadowText = yearText;
    yearElement.style.fontFamily = resolveYearFontFamily();
    yearElement.style.color = textColor;
    applyTextAlign(yearElement, yearTextAlign);

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
        applyPosterContainerState(poster);
    }

    const subtitleElement = document.getElementById("subtitle");
    if (subtitleElement) {
        const subtitleText = subtitleInput?.value ?? subtitleElement.innerText;
        subtitleElement.classList.remove("typesetText");
        subtitleElement.innerText = subtitleText;
        subtitleElement.style.fontFamily = resolveSubtitleFontFamily();
        subtitleElement.style.color = textColor;
        applySubtitleSettings(subtitleElement, previewFontScale);
        applyTextAlign(subtitleElement, subtitlePosition === "verticalLeft" ? "left" : subtitleTextAlign);
    }

    renderVerticalTextTarget("subtitle");
    syncHeadlineTextWidths();

    const copyrightEl = document.getElementById("copyright");
    if (copyrightEl) {
        copyrightEl.style.fontSize = `${BASE_COPYRIGHT_FONT_SIZE * resolutionDesignScale}px`;
        copyrightEl.style.display = showBottomWatermark ? "" : "none";
    }

    renderPosterCards(poster, previewFontScale);

    if (deferTypesetting) {
        if (shouldManualMobileTypeset) {
            markMobileTypesettingDirty();
        } else if (scheduleDeferredTypesetting) {
            scheduleDeferredPosterTypesetting({ shouldSave });
        }
    } else {
        applyPosterTypesetting();
        clearMobileTypesettingDirty();
    }

    syncCardsOffset();

    if (subtitlePosition === "verticalLeft") {
        requestAnimationFrame(() => {
            syncCardsOffset();
        });
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
    if (!deferTypesetting && schedulePhonePreview) {
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

async function flushPendingPosterWork() {
    flushPendingMobileTextInputs();
    await flushPendingPreviewRender();
    await flushDeferredCardTypesetting();
    await flushDeferredPosterTypesetting();
    await flushMobileTypesettingIfNeeded();
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
    flushPendingMobileTextInputs({ schedulePreview: false });
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
    syncCardSortModeButton();

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
        const cardBodyHtml = isImageCard(item)
            ? renderImageCardEditorBody(item, index)
            : renderTextCardEditorBody(item, index, textHtml, contentFontOptions, contentFontToolbarValue);
        const isCollapsed = isCardSortMode || isCardEditorCollapsed(index);
        const isMobileSortMode = isCardSortMode && isMobileViewport();
        const collapseLabel = isCardSortMode ? "拖动排序" : (isCollapsed ? "展开段落" : "收起段落");
        let collapseButtonHtml = `<button type="button" class="cardCollapseToggle" title="${collapseLabel}" aria-label="${collapseLabel}" aria-expanded="${isCollapsed ? "false" : "true"}" onclick="toggleCardEditorCollapsed(${index})">&gt;</button>`;
        if (isCardSortMode && isMobileSortMode) {
            collapseButtonHtml = `
                    <span class="cardSortStepControls" aria-label="移动段落">
                        <button type="button" title="上移段落" aria-label="上移段落" onclick="moveCardByStep(${index},-1)"${index === 0 ? " disabled" : ""}>↑</button>
                        <button type="button" title="下移段落" aria-label="下移段落" onclick="moveCardByStep(${index},1)"${index === data.length - 1 ? " disabled" : ""}>↓</button>
                    </span>`;
        } else if (isCardSortMode) {
            collapseButtonHtml = `<button type="button" class="cardCollapseToggle cardSortHandle" title="${collapseLabel}" aria-label="${collapseLabel}" onpointerdown="startCardSortDrag(event,${index})" onclick="event.preventDefault()">≡</button>`;
        }
        const cardTitleLabel = titleText || (isImageCard(item) ? "图片段落" : "文字段落");

        html += `
        <div class="block${item.hidden ? " hiddenBlock" : ""}${isCollapsed ? " collapsedBlock" : ""}${isCardSortMode ? " sortModeBlock" : ""}${recentlyMovedCardIndex === index ? " recentlyMovedSortBlock" : ""}" data-card-editor-index="${index}">
            <div class="blockHeader">
                <div class="blockHeaderTitle">
                    ${collapseButtonHtml}
                    <h3>第 ${index + 1} 段${isCardSortMode ? `：${cardTitleLabel}` : ""}${item.hidden ? "（已隐藏）" : ""}</h3>
                </div>
                <div class="blockHeaderActions">
                    <button type="button" class="hideBtn" onclick="toggleCardHidden(${index})">${item.hidden ? "显示段落" : "隐藏段落"}</button>
                    <button type="button" class="deleteBtn" onclick="deleteCard(${index})">删除段落</button>
                </div>
            </div>
            <div class="blockBody"${isCollapsed ? " hidden" : ""}>
                <div class="blockSizeControlRow">
                    <label class="inlineLabel">标题 <span class="sizeValue" data-card-index="${index}" data-size-type="title">${item.titleSize}px</span></label>
                    <div class="blockSizeButtons">
                        <button type="button" onclick="changeTitleSize(${index},-2)">A-</button>
                        <button type="button" onclick="changeTitleSize(${index},2)">A+</button>
                    </div>
                </div>
                <div class="headlineFontRow">
                    <select class="fontSelect blockFontSelect" style="font-family:${escapeHtml(titleFontFamily)};" onchange="changeCardTitleFont(${index},this.value,this)">
                        ${titleFontOptions}
                    </select>
                    <div class="headlineAlignControls" data-align-control-target="cardTitle:${index}">
                        ${renderTextAlignControls(`cardTitle:${index}`, item.titleAlign)}
                    </div>
                </div>
                <textarea rows="2" class="cardTitleInput" placeholder="${escapeHtml(item.titlePlaceholder || CARD_TITLE_PLACEHOLDER)}" style="font-family:${escapeHtml(titleFontFamily)};" oninput="autoResizeTextarea(this);changeTitle(${index},this.value)">${titleText}</textarea>
                ${cardBodyHtml}
            </div>
        </div>
        `;
    });

    document.getElementById("cardEditor").innerHTML = html;
    document.querySelectorAll("#cardEditor textarea").forEach(autoResizeTextarea);
    document.querySelectorAll("#cardEditor .richTextEditor").forEach((editorEl) => {
        editorEl.dataset.placeholder = CONTENT_EDITOR_PLACEHOLDER;
        normalizeRichTextEditorPlaceholder(editorEl);
    });
    updateCurrentWordCount();
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

    const yearAlignControls = document.getElementById("yearAlignControls");
    if (yearAlignControls) {
        yearAlignControls.innerHTML = renderTextAlignControls("year", yearTextAlign);
    }

    const subtitleAlignControls = document.getElementById("subtitleAlignControls");
    if (subtitleAlignControls) {
        subtitleAlignControls.innerHTML = renderTextAlignControls("subtitle", subtitleTextAlign, {
            disabled: subtitlePosition === "verticalLeft"
        });
    }
}

function renderBackgroundPalette() {
    const palette = document.getElementById("bgPalette");
    if (!palette) return;

    palette.innerHTML = buildPaletteColors(recentBackgroundColors)
        .map(({ color }) => {
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

    syncCustomPickerFromColor("background", backgroundColor);
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

    palette.innerHTML = buildPaletteColors(recentTextColors)
        .map(({ color }) => {
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

    syncCustomPickerFromColor("text", textColor);
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

    const yearShadowButton = document.getElementById("yearShadowToggleBtn");
    if (yearShadowButton) {
        yearShadowButton.innerText = showYearShadow ? "隐藏标题阴影" : "显示标题阴影";
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

async function syncPhonePreview() {
    phonePreviewFrame = null;
    if (phonePreviewSyncInProgress) {
        pendingPhonePreviewSync = true;
        return;
    }

    phonePreviewSyncInProgress = true;

    try {
        const panel = document.getElementById("phonePreviewPanel");
        const canvas = document.getElementById("phoneCanvas");
        const canvasWrap = document.getElementById("phoneCanvasWrap");
        const screen = document.getElementById("phoneScreen");
        const topPaddingLayer = document.getElementById("phoneTopPadding");
        const watermark = document.getElementById("phoneWatermark");
        const mockup = document.querySelector(".phoneMockup");
        const scaleValue = document.getElementById("phonePreviewScaleValue");

        if (!showPhonePreview || !panel || !canvas || !canvasWrap || !screen || !topPaddingLayer || !watermark) return;

        await flushPendingPosterWork();
        const resolution = phoneResolutions[phoneResolution] || phoneResolutions["1080x2376"];
        const phonePoster = await ensurePhoneRenderLayout();
        if (!phonePoster) return;

        const imageWidth = getPhoneExportCssWidth(resolution);
        const clone = phonePoster.cloneNode(true);
        const background = window.getComputedStyle(phonePoster).backgroundColor || backgroundColor;
        const watermarkSettings = getWatermarkSettings(1);
        const topPaddingHeight = getExportTopPaddingHeight(resolution, 1);
        const watermarkBandHeight = showBottomWatermark
            ? getWatermarkBandHeight(resolution, 1, watermarkSettings)
            : topPaddingHeight;

        screen.style.aspectRatio = `${resolution.width} / ${resolution.height}`;
        screen.style.backgroundColor = background;
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

        const clonedCopyright = getPosterPart(clone, "copyright");
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
            const scaledFontSize = parseFloat(window.getComputedStyle(getPosterPart(phonePoster, "copyright") || document.body).fontSize || "13") * scale;
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
    } finally {
        phonePreviewSyncInProgress = false;
        if (pendingPhonePreviewSync) {
            pendingPhonePreviewSync = false;
            schedulePhonePreviewSync();
        }
    }
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
    if (!showPhonePreview) return;
    if (phonePreviewSyncInProgress) {
        pendingPhonePreviewSync = true;
        return;
    }
    if (phonePreviewFrame !== null) return;

    phonePreviewFrame = requestAnimationFrame(syncPhonePreview);
}

/* ===========================
   Edit Actions
=========================== */

function changeTextAlign(target, value) {
    const align = normalizeTextAlign(value);

    if (target === "year") {
        yearTextAlign = align;
        applyHeadlineTextAlignPreview("year");
        return;
    }

    if (target === "subtitle") {
        subtitleTextAlign = align;
        applyHeadlineTextAlignPreview("subtitle");
        return;
    }

    const [type, rawIndex] = String(target || "").split(":");
    const index = Number(rawIndex);
    if (!Number.isInteger(index) || !data[index]) return;

    if (type === "cardTitle") {
        data[index].titleAlign = align;
    } else if (type === "cardText") {
        data[index].textAlign = align;
    } else {
        return;
    }

    applyCardTextAlignPreview(index, type);
}

function changeTitle(index, value) {
    data[index].title = value;

    if (isMobileViewport()) {
        scheduleCardPreviewRender(index);
        return;
    }

    scheduleCardPreviewRender(index);
}

function changeText(index, value) {
    if (!data[index]) return;

    const normalizedValue = normalizeEmptyRichText(value);

    if (isMobileViewport()) {
        scheduleMobileTextInputCommit(index, normalizedValue);
        return;
    }

    data[index].text = sanitizeRichText(normalizedValue);
    scheduleCurrentWordCountUpdate();
    schedulePreviewRender(PREVIEW_RENDER_DELAY_MS, () => renderPreview({ deferTypesetting: true }));
}

function normalizeEmptyRichText(value) {
    const html = sanitizeRichText(value);
    return extractPlainTextFromRichText(html).trim() ? html : "";
}

function normalizeRichTextEditorPlaceholder(element) {
    if (!element) return;

    const html = normalizeEmptyRichText(element.innerHTML);
    if (html === element.innerHTML) return;

    element.innerHTML = html;
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

    if (isMobileViewport()) {
        pendingCardPreviewIndexes.add(index);
        pendingDeferredCardPreviewIndexes.add(index);
        markMobileTypesettingDirty();
        schedulePreviewRender(0, flushPendingCardPreviewRenders);
        return;
    }

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

function createPlainTextPasteFragment(text, doc = document) {
    const fragment = doc.createDocumentFragment();
    const normalizedText = String(text ?? "")
        .replace(/\r\n?/g, "\n")
        .replace(/\u00a0/g, " ")
        .replace(/[\u200B-\u200D\uFEFF]/g, "");

    if (!normalizedText.includes("\n")) {
        if (normalizedText) {
            fragment.appendChild(doc.createTextNode(normalizedText));
        }
        return fragment;
    }

    normalizedText
        .split("\n")
        .forEach((line) => {
            const paragraph = doc.createElement("div");
            if (line) {
                paragraph.appendChild(doc.createTextNode(line));
            } else {
                paragraph.appendChild(doc.createElement("br"));
            }
            fragment.appendChild(paragraph);
        });

    return fragment;
}

function dispatchRichTextInput(editorEl, text) {
    const event = typeof InputEvent === "function"
        ? new InputEvent("input", {
            bubbles: true,
            inputType: "insertText",
            data: text
        })
        : new Event("input", { bubbles: true });

    editorEl.dispatchEvent(event);
}

function insertPlainTextIntoEditor(editorEl, text) {
    if (!editorEl) return false;

    const selection = window.getSelection();
    let range = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;

    if (!isRangeInsideElement(range, editorEl)) {
        range = document.createRange();
        range.selectNodeContents(editorEl);
        range.collapse(false);
    }

    const marker = document.createTextNode("");
    const fragment = createPlainTextPasteFragment(text);
    fragment.appendChild(marker);

    range.deleteContents();
    range.insertNode(fragment);
    range.setStartBefore(marker);
    range.collapse(true);
    marker.remove();

    if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
    }

    return true;
}

function pastePlainText(event) {
    event.preventDefault();

    const editorEl = event.currentTarget;
    const text = event.clipboardData?.getData("text/plain") ?? "";
    if (insertPlainTextIntoEditor(editorEl, text)) {
        dispatchRichTextInput(editorEl, text);
    }
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

function getCustomPickerConfig(target) {
    return colorPickerControls[target] || null;
}

function updateCustomPickerUi(target, { preview = true } = {}) {
    const config = getCustomPickerConfig(target);
    const state = customColorPickerState[target];
    if (!config || !state) return;

    const rgb = hsvToRgb(state);
    const hex = rgbToHex(rgb);
    const hue = Math.round(clampNumber(state.hue, 0, 360));
    const saturation = Math.round(clampNumber(state.saturation, 0, 100));
    const value = Math.round(clampNumber(state.value, 0, 100));

    config.panel?.style.setProperty("--picker-hue", String(hue));
    config.panel?.style.setProperty("--picker-saturation", String(saturation));
    config.panel?.style.setProperty("--picker-value", String(value));
    config.panel?.style.setProperty("--picker-color", hex);

    if (config.hue && config.hue.value !== String(hue)) {
        config.hue.value = String(hue);
    }
    if (config.hex && config.hex.value.toLowerCase() !== hex) {
        config.hex.value = hex;
    }
    if (config.red && config.red.value !== String(rgb.r)) {
        config.red.value = String(rgb.r);
    }
    if (config.green && config.green.value !== String(rgb.g)) {
        config.green.value = String(rgb.g);
    }
    if (config.blue && config.blue.value !== String(rgb.b)) {
        config.blue.value = String(rgb.b);
    }

    if (preview) {
        config.preview(hex);
    }
}

function setCustomPickerFromColor(target, color, options = {}) {
    const rgb = hexToRgb(color);
    const state = customColorPickerState[target];
    if (!rgb || !state) return false;

    const nextHsv = rgbToHsv(rgb);
    state.hue = nextHsv.saturation === 0 ? state.hue : nextHsv.hue;
    state.saturation = nextHsv.saturation;
    state.value = nextHsv.value;
    updateCustomPickerUi(target, options);
    return true;
}

function syncCustomPickerFromColor(target, color) {
    const config = getCustomPickerConfig(target);
    if (!config || !config.panel?.hidden) return;

    setCustomPickerFromColor(target, color, { preview: false });
}

function closeCustomColorPanels() {
    Object.values(colorPickerControls).forEach((control) => {
        if (!control.panel) return;

        control.panel.hidden = true;
        control.panel.classList.remove("mobileCustomColorModal");
    });

    if (customColorModalBackdrop) {
        customColorModalBackdrop.hidden = true;
    }

    activeCustomColorTarget = null;
}

function openCustomColorPanel(target) {
    const config = getCustomPickerConfig(target);
    const state = customColorPickerState[target];
    if (!config || !state) return;

    closeCustomColorPanels();

    state.originalColor = config.getValue();
    setCustomPickerFromColor(target, state.originalColor, { preview: false });
    if (config.panel) {
        config.panel.classList.toggle("mobileCustomColorModal", isMobileViewport());
        config.panel.hidden = false;
    }
    if (customColorModalBackdrop) {
        customColorModalBackdrop.hidden = !isMobileViewport();
    }
    activeCustomColorTarget = target;
}

function cancelCustomColor(target) {
    const config = getCustomPickerConfig(target);
    const state = customColorPickerState[target];
    if (!config || !state) return;

    config.preview(state.originalColor);
    closeCustomColorPanels();
    config.commit();
}

function confirmCustomColor(target) {
    const config = getCustomPickerConfig(target);
    if (!config) return;

    const color = getCustomPickerColor(target);
    config.preview(color);
    config.addRecent(color);
    closeCustomColorPanels();
    config.commit();
}

function changeBackgroundColor(value) {
    applyBackgroundColorPreview(value);
    renderBackgroundPalette();
    if (isMobileViewport()) {
        pendingCardPreviewIndexes.add(index);
        pendingDeferredCardPreviewIndexes.add(index);
        markMobileTypesettingDirty();
        schedulePreviewRender(0, flushPendingCardPreviewRenders);
        return;
    }

    renderPreview();
}

function confirmBackgroundCustomColor() {
    confirmCustomColor("background");
}

function cancelBackgroundCustomColor() {
    cancelCustomColor("background");
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
    const ok = window.confirm("确定要移除背景图片吗？");
    if (!ok) return;

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
    scheduleMobileFastPreviewRender();
}

function changeSubtitleFont(value, selectEl = null) {
    subtitleFontFamily = value || INHERIT_FONT_VALUE;
    updateHeadlineFontSelect(selectEl, "subtitleInput", subtitleFontFamily, resolveSubtitleFontFamily());
    scheduleMobileFastPreviewRender();
}

function changeSideFont(value, selectEl = null) {
    sideFontFamily = value || INHERIT_FONT_VALUE;
    updateHeadlineFontSelect(selectEl, "sideInput", sideFontFamily, resolveSideFontFamily());
    scheduleMobileFastPreviewRender();
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
    scheduleCardPreviewRender(index);
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

    document.querySelectorAll("#year, #subtitle, #side, .cardTitle, .info, .cardImagePlaceholder").forEach(applyTextColorToElementTree);
}

function commitTextColorPreview() {
    renderTextColorPalette();
    schedulePhonePreviewSync();
    saveState();
}

function changeTextColor(value) {
    applyTextColorPreview(value);
    renderTextColorPalette();
    schedulePhonePreviewSync();
    saveState();
}

function confirmTextCustomColor() {
    confirmCustomColor("text");
}

function cancelTextCustomColor() {
    cancelCustomColor("text");
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
    scheduleMobileFastPreviewRender();
}

function toggleMonthTitles() {
    showMonthTitles = !showMonthTitles;
    updateTimelineButtons();
    scheduleMobileFastPreviewRender();
}

function toggleMonthUnderlines() {
    showMonthUnderlines = !showMonthUnderlines;
    updateTimelineButtons();
    scheduleMobileFastPreviewRender();
}

function toggleSideHeader() {
    showSideHeader = !showSideHeader;
    updateTimelineButtons();
    scheduleMobileFastPreviewRender();
}

function toggleYearShadow() {
    showYearShadow = !showYearShadow;
    updateTimelineButtons();
    document.querySelectorAll(".posterRoot").forEach(applyPosterContainerState);
    schedulePhonePreviewSync();
    saveState();
}

function toggleBottomWatermark() {
    showBottomWatermark = !showBottomWatermark;
    updateTimelineButtons();
    renderPreview();
}

function toggleSubtitlePosition() {
    subtitlePosition = subtitlePosition === "verticalLeft" ? "belowTitle" : "verticalLeft";
    renderHeadlineFontControls();
    scheduleMobileFastPreviewRender();
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
    updateTimelineButtons();
    schedulePhonePreviewSync();
    saveState();
}

function changePhonePreviewScale(delta) {
    phonePreviewScale = Math.min(Math.max(phonePreviewScale + delta, 0.75), 2);
    phonePreviewScale = Math.round(phonePreviewScale * 10) / 10;
    schedulePhonePreviewSync();
    saveState();
}

function openCustomColorPicker() {
    openCustomColorPanel("background");
}

function openTextColorPicker() {
    openCustomColorPanel("text");
}

function updateCustomPickerFromFieldEvent(target, event) {
    const config = getCustomPickerConfig(target);
    const state = customColorPickerState[target];
    const rect = config?.field?.getBoundingClientRect();
    if (!rect || !state) return;

    state.saturation = clampNumber(((event.clientX - rect.left) / rect.width) * 100, 0, 100);
    state.value = clampNumber((1 - (event.clientY - rect.top) / rect.height) * 100, 0, 100);
    updateCustomPickerUi(target);
}

function bindCustomColorField(target) {
    const config = getCustomPickerConfig(target);
    if (!config?.field) return;

    config.field.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        config.field.setPointerCapture?.(event.pointerId);
        updateCustomPickerFromFieldEvent(target, event);
    });

    config.field.addEventListener("pointermove", (event) => {
        if (event.buttons !== 1 && event.pressure === 0) return;
        updateCustomPickerFromFieldEvent(target, event);
    });
}

function bindCustomColorPanel(target) {
    const config = getCustomPickerConfig(target);
    const state = customColorPickerState[target];
    if (!config || !state) return;

    bindCustomColorField(target);

    config.hue?.addEventListener("input", () => {
        state.hue = clampNumber(config.hue.value, 0, 360);
        updateCustomPickerUi(target);
    });

    config.hex?.addEventListener("input", () => {
        const value = config.hex.value.trim();
        if (/^#[0-9a-fA-F]{6}$/.test(value)) {
            setCustomPickerFromColor(target, value);
        }
    });

    [config.red, config.green, config.blue].forEach((input) => {
        input?.addEventListener("input", () => {
            const hex = rgbToHex({
                r: config.red?.value,
                g: config.green?.value,
                b: config.blue?.value
            });
            setCustomPickerFromColor(target, hex);
        });
    });

    setCustomPickerFromColor(target, config.getValue(), { preview: false });
}

function syncCustomColorModalMode() {
    if (!activeCustomColorTarget) return;

    const config = getCustomPickerConfig(activeCustomColorTarget);
    if (!config?.panel || config.panel.hidden) return;

    const mobile = isMobileViewport();
    config.panel.classList.toggle("mobileCustomColorModal", mobile);
    if (customColorModalBackdrop) {
        customColorModalBackdrop.hidden = !mobile;
    }
}

function addTextCard() {
    data.push(createTextCard());
    renderLayoutChangePreview();
}

function addImageCard() {
    data.push(createImageCard());
    renderLayoutChangePreview();
}

function addCard() {
    addTextCard();
}

function openCardImagePicker(index) {
    const input = document.getElementById(`cardImageInput-${index}`);
    if (!input) return;

    input.value = "";
    input.click();
}

function createCardImageId() {
    return `image-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function canUseImageStore() {
    return Boolean(imageStore?.isAvailable?.());
}

async function saveCardImageDataToStore(image) {
    if (!canUseImageStore() || !image?.imageDataUrl) return image;

    const imageStoreId = getImageStoreId(image) || image.id || createCardImageId();

    await imageStore.putImage({
        id: imageStoreId,
        dataUrl: image.imageDataUrl,
        imageName: image.imageName || "",
        imageMimeType: image.imageMimeType || "",
        imageOriginalMimeType: image.imageOriginalMimeType || "",
        imageHasTransparency: image.imageHasTransparency === true,
        imageBytes: image.imageBytes || 0,
        imageWidth: image.imageWidth || 0,
        imageHeight: image.imageHeight || 0
    });

    return {
        ...image,
        id: image.id || imageStoreId,
        imageStoreId
    };
}

async function deleteCardImagesFromStore(images) {
    if (!canUseImageStore()) return;

    const ids = (images || []).map(getImageStoreId).filter(Boolean);
    if (!ids.length) return;

    try {
        await imageStore.deleteImages(ids);
    } catch (error) {
        console.warn("Card image cleanup failed", error);
    }
}

async function hydrateStoredCardImages() {
    if (!canUseImageStore()) return false;

    let changed = false;

    for (const item of data) {
        if (!isImageCard(item)) continue;

        const images = [];

        for (const image of getCardImages(item)) {
            let nextImage = image;
            const imageStoreId = getImageStoreId(nextImage);

            if (nextImage.imageDataUrl) {
                if (!imageStoreId) {
                    try {
                        nextImage = await saveCardImageDataToStore(nextImage);
                        changed = true;
                    } catch (error) {
                        console.warn("Legacy card image migration failed", error);
                    }
                }
            } else if (imageStoreId) {
                try {
                    const storedImage = await imageStore.getImage(imageStoreId);
                    if (storedImage?.dataUrl) {
                        nextImage = {
                            ...nextImage,
                            imageDataUrl: storedImage.dataUrl
                        };
                        changed = true;
                    }
                } catch (error) {
                    console.warn("Stored card image load failed", error);
                }
            }

            images.push(nextImage);
        }

        item.images = images;
        syncImageCardLegacyFields(item);
    }

    return changed;
}

function getCardImages(item) {
    if (!item || !isImageCard(item)) return [];
    if (Array.isArray(item.images)) return item.images;
    return item.imageDataUrl ? [item] : [];
}

function getPrimaryCardImage(images) {
    return images[0] || {};
}

function syncImageCardLegacyFields(item) {
    const images = getCardImages(item);
    const primary = getPrimaryCardImage(images);

    item.images = images;
    item.imageDataUrl = primary.imageDataUrl || "";
    item.imageName = primary.imageName || "";
    item.imageMimeType = primary.imageMimeType || "";
    item.imageOriginalMimeType = primary.imageOriginalMimeType || "";
    item.imageHasTransparency = primary.imageHasTransparency === true;
    item.imageBytes = primary.imageBytes || 0;
    item.imageWidth = primary.imageWidth || 0;
    item.imageHeight = primary.imageHeight || 0;
}

function updateCardImageAt(index, imageIndex, updater) {
    if (!data[index] || !isImageCard(data[index])) return false;

    const images = getCardImages(data[index]);
    if (!images[imageIndex]) return false;

    data[index].images = images.map((image, currentIndex) =>
        currentIndex === imageIndex ? updater(image) : image
    );
    syncImageCardLegacyFields(data[index]);
    return true;
}

async function changeCardImage(index, fileList) {
    if (!data[index] || !isImageCard(data[index]) || !fileList) return;

    const files = Array.from(fileList).filter(Boolean);
    if (!files.length) return;

    try {
        const nextImages = [];

        for (const file of files) {
            const compressed = await compressCardImageFile(file);
            if (!compressed) continue;

            const nextImage = {
                id: createCardImageId(),
                imageDataUrl: compressed.dataUrl,
                imageName: file.name || "图片",
                imageMimeType: compressed.mimeType,
                imageOriginalMimeType: compressed.originalMimeType,
                imageHasTransparency: compressed.hasTransparency,
                imageBytes: compressed.bytes,
                imageWidth: compressed.width,
                imageHeight: compressed.height,
                imageWidthPercent: 100,
                imageAlign: "center"
            };

            try {
                nextImages.push(await saveCardImageDataToStore(nextImage));
            } catch (error) {
                console.warn("Card image IndexedDB save failed", error);
                nextImages.push(nextImage);
            }
        }

        if (!nextImages.length) return;

        data[index] = {
            ...data[index],
            images: [
                ...getCardImages(data[index]),
                ...nextImages
            ]
        };
        syncImageCardLegacyFields(data[index]);
        renderLayoutChangePreview();
    } catch (error) {
        window.alert(error?.message || "图片处理失败，请重试。");
    }
}

function removeCardImage(index) {
    if (!data[index] || !isImageCard(data[index])) return;

    const ok = window.confirm("确定要清空这个段落的所有图片吗？");
    if (!ok) return;

    const removedImages = getCardImages(data[index]);
    data[index] = createImageCard({
        ...data[index],
        images: [],
        imageDataUrl: "",
        imageName: "",
        imageMimeType: "",
        imageOriginalMimeType: "",
        imageHasTransparency: false,
        imageBytes: 0,
        imageWidth: 0,
        imageHeight: 0
    });
    deleteCardImagesFromStore(removedImages);
    renderLayoutChangePreview();
}

function removeCardImageAt(index, imageIndex) {
    if (!data[index] || !isImageCard(data[index])) return;

    const ok = window.confirm("确定要移除这张图片吗？");
    if (!ok) return;

    const previousImages = getCardImages(data[index]);
    const removedImages = previousImages.filter((_, currentIndex) => currentIndex === imageIndex);
    const images = previousImages.filter((_, currentIndex) => currentIndex !== imageIndex);
    data[index] = createImageCard({
        ...data[index],
        images
    });
    syncImageCardLegacyFields(data[index]);
    deleteCardImagesFromStore(removedImages);
    renderLayoutChangePreview();
}

function changeCardImageWidth(index, imageIndex, value) {
    const nextValue = Number(value);
    if (![50, 75, 100].includes(nextValue)) return;

    if (!updateCardImageAt(index, imageIndex, (image) => ({
        ...image,
        imageWidthPercent: nextValue
    }))) return;

    scheduleCardPreviewRender(index);
}

function syncCardImageAlignControl(index, imageIndex, selectedValue) {
    const control = document.querySelector(`[data-card-image-align-control="${index}:${imageIndex}"]`);
    if (!control) return;

    const selectedAlign = normalizeTextAlign(selectedValue || "center");
    control.querySelectorAll("[data-card-image-align-value]").forEach((button) => {
        const active = button.dataset.cardImageAlignValue === selectedAlign;
        button.classList.toggle("active", active);
        button.setAttribute("aria-pressed", active ? "true" : "false");
    });
}

function changeCardImageAlign(index, imageIndex, value) {
    const nextValue = normalizeTextAlign(value || "center");

    if (!updateCardImageAt(index, imageIndex, (image) => ({
        ...image,
        imageAlign: nextValue
    }))) return;

    syncCardImageAlignControl(index, imageIndex, nextValue);
    scheduleCardPreviewRender(index);
}

function moveCardImage(index, fromImageIndex, toImageIndex) {
    if (!data[index] || !isImageCard(data[index])) return false;

    const images = getCardImages(data[index]);
    if (
        fromImageIndex === toImageIndex
        || fromImageIndex < 0
        || toImageIndex < 0
        || fromImageIndex >= images.length
        || toImageIndex >= images.length
    ) {
        return false;
    }

    const nextImages = images.slice();
    const [image] = nextImages.splice(fromImageIndex, 1);
    nextImages.splice(toImageIndex, 0, image);
    data[index] = createImageCard({
        ...data[index],
        images: nextImages
    });
    syncImageCardLegacyFields(data[index]);
    return true;
}

function markRecentlyMovedCardImage(index, imageIndex) {
    recentlyMovedCardImage = { cardIndex: index, imageIndex };
    renderOrderChangePreview();
    revealRecentlyMovedCardImage(index, imageIndex);
}

function moveCardImageByStep(index, imageIndex, step) {
    const toIndex = imageIndex + step;
    if (!moveCardImage(index, imageIndex, toIndex)) return;

    markRecentlyMovedCardImage(index, toIndex);
}

function clearRecentlyMovedCardImageHighlight() {
    if (recentlyMovedCardImageHighlightTimer !== null) {
        window.clearTimeout(recentlyMovedCardImageHighlightTimer);
        recentlyMovedCardImageHighlightTimer = null;
    }
    recentlyMovedCardImage = null;
}

function revealRecentlyMovedCardImage(index, imageIndex) {
    if (recentlyMovedCardImageHighlightTimer !== null) {
        window.clearTimeout(recentlyMovedCardImageHighlightTimer);
        recentlyMovedCardImageHighlightTimer = null;
    }

    requestAnimationFrame(() => {
        const item = document.querySelector(`#cardEditor .cardImageEditorPreviewItem[data-card-image-editor-index="${index}:${imageIndex}"]`);
        item?.scrollIntoView({
            behavior: "smooth",
            block: "center",
            inline: "nearest"
        });
    });

    recentlyMovedCardImageHighlightTimer = window.setTimeout(() => {
        if (
            recentlyMovedCardImage?.cardIndex !== index
            || recentlyMovedCardImage?.imageIndex !== imageIndex
        ) {
            return;
        }

        recentlyMovedCardImage = null;
        recentlyMovedCardImageHighlightTimer = null;
        renderEditor();
    }, 1200);
}

function getCardImageEditorItemFromPoint(clientX, clientY, cardIndex) {
    const element = document.elementFromPoint(clientX, clientY);
    const item = element?.closest?.("#cardEditor .cardImageEditorPreviewItem");
    if (!item) return null;

    const [itemCardIndex] = String(item.dataset.cardImageEditorIndex || "").split(":").map(Number);
    return itemCardIndex === cardIndex ? item : null;
}

function updateCardImageSortDropTarget(cardIndex, targetImageIndex) {
    document.querySelectorAll(`#cardEditor .cardImageEditorPreviewItem[data-card-image-editor-index^="${cardIndex}:"]`).forEach((item) => {
        const [, imageIndex] = String(item.dataset.cardImageEditorIndex || "").split(":").map(Number);
        item.classList.toggle("cardImageSortDropTarget", imageIndex === targetImageIndex);
    });
}

function updateCardImageSortTargetFromPoint(clientX, clientY) {
    if (!cardImageSortDragState) return;

    const { cardIndex } = cardImageSortDragState;
    const item = getCardImageEditorItemFromPoint(clientX, clientY, cardIndex);
    const [, imageIndex] = String(item?.dataset.cardImageEditorIndex || "").split(":").map(Number);
    if (!Number.isInteger(imageIndex)) return;

    cardImageSortDragState.targetImageIndex = imageIndex;
    updateCardImageSortDropTarget(cardIndex, imageIndex);
}

function getCardImageSortScrollElement() {
    const editor = document.getElementById("editor");
    if (editor && editor.scrollHeight > editor.clientHeight) {
        return editor;
    }

    return document.scrollingElement || document.documentElement;
}

function getCardImageSortAutoScrollDelta(clientY) {
    const scrollElement = getCardImageSortScrollElement();
    const rect = scrollElement === document.scrollingElement || scrollElement === document.documentElement
        ? { top: 0, bottom: window.innerHeight }
        : scrollElement.getBoundingClientRect();
    const topDistance = clientY - rect.top;
    const bottomDistance = rect.bottom - clientY;

    if (topDistance >= 0 && topDistance < CARD_IMAGE_SORT_AUTOSCROLL_EDGE_PX) {
        const strength = 1 - (topDistance / CARD_IMAGE_SORT_AUTOSCROLL_EDGE_PX);
        return { scrollElement, delta: -Math.max(4, Math.round(strength * CARD_IMAGE_SORT_AUTOSCROLL_MAX_PX)) };
    }

    if (bottomDistance >= 0 && bottomDistance < CARD_IMAGE_SORT_AUTOSCROLL_EDGE_PX) {
        const strength = 1 - (bottomDistance / CARD_IMAGE_SORT_AUTOSCROLL_EDGE_PX);
        return { scrollElement, delta: Math.max(4, Math.round(strength * CARD_IMAGE_SORT_AUTOSCROLL_MAX_PX)) };
    }

    return { scrollElement, delta: 0 };
}

function runCardImageSortAutoScroll() {
    if (!cardImageSortDragState) return;

    const { autoScrollDelta, autoScrollElement, lastClientX, lastClientY } = cardImageSortDragState;
    if (!autoScrollDelta || !autoScrollElement) {
        cardImageSortDragState.autoScrollFrame = null;
        return;
    }

    if (autoScrollElement === document.scrollingElement || autoScrollElement === document.documentElement) {
        window.scrollBy(0, autoScrollDelta);
    } else {
        autoScrollElement.scrollTop += autoScrollDelta;
    }

    updateCardImageSortTargetFromPoint(lastClientX, lastClientY);
    cardImageSortDragState.autoScrollFrame = window.requestAnimationFrame(runCardImageSortAutoScroll);
}

function updateCardImageSortAutoScroll(clientX, clientY) {
    if (!cardImageSortDragState) return;

    const { scrollElement, delta } = getCardImageSortAutoScrollDelta(clientY);
    cardImageSortDragState.lastClientX = clientX;
    cardImageSortDragState.lastClientY = clientY;
    cardImageSortDragState.autoScrollElement = scrollElement;
    cardImageSortDragState.autoScrollDelta = delta;

    if (delta !== 0 && cardImageSortDragState.autoScrollFrame === null) {
        cardImageSortDragState.autoScrollFrame = window.requestAnimationFrame(runCardImageSortAutoScroll);
    }
}

function stopCardImageSortAutoScroll() {
    if (cardImageSortDragState?.autoScrollFrame !== null && cardImageSortDragState?.autoScrollFrame !== undefined) {
        window.cancelAnimationFrame(cardImageSortDragState.autoScrollFrame);
    }

    if (cardImageSortDragState) {
        cardImageSortDragState.autoScrollFrame = null;
        cardImageSortDragState.autoScrollDelta = 0;
        cardImageSortDragState.autoScrollElement = null;
    }
}

function cleanupCardImageSortDrag() {
    stopCardImageSortAutoScroll();
    document.removeEventListener("pointermove", handleCardImageSortPointerMove);
    document.removeEventListener("pointerup", finishCardImageSortDrag);
    document.removeEventListener("pointercancel", cancelCardImageSortDrag);
    document.body.classList.remove("cardImageSortDragging");
    document.querySelectorAll("#cardEditor .cardImageEditorPreviewItem").forEach((item) => {
        item.classList.remove("cardImageSortDraggingItem", "cardImageSortDropTarget");
    });
    cardImageSortDragState?.ghost?.remove();
    cardImageSortDragState = null;
}

function startCardImageSortDrag(event, cardIndex, imageIndex) {
    if (isMobileViewport() || !data[cardIndex] || !isImageCard(data[cardIndex])) return;

    const images = getCardImages(data[cardIndex]);
    if (images.length < 2 || !images[imageIndex]) return;

    event.preventDefault();
    const item = event.currentTarget.closest(".cardImageEditorPreviewItem");
    if (!item) return;

    const rect = item.getBoundingClientRect();
    const ghost = item.cloneNode(true);
    ghost.classList.add("cardImageSortGhost");
    ghost.style.width = `${rect.width}px`;
    ghost.style.height = `${rect.height}px`;
    ghost.style.left = "0px";
    ghost.style.top = "0px";
    ghost.style.transform = `translate(${Math.round(rect.left)}px, ${Math.round(rect.top)}px)`;
    document.body.appendChild(ghost);

    cardImageSortDragState = {
        cardIndex,
        fromImageIndex: imageIndex,
        targetImageIndex: imageIndex,
        pointerId: event.pointerId,
        offsetX: event.clientX - rect.left,
        offsetY: event.clientY - rect.top,
        ghost,
        lastClientX: event.clientX,
        lastClientY: event.clientY,
        autoScrollFrame: null,
        autoScrollDelta: 0,
        autoScrollElement: null
    };

    event.currentTarget.setPointerCapture?.(event.pointerId);
    document.body.classList.add("cardImageSortDragging");
    item.classList.add("cardImageSortDraggingItem");
    updateCardImageSortDropTarget(cardIndex, imageIndex);
    document.addEventListener("pointermove", handleCardImageSortPointerMove);
    document.addEventListener("pointerup", finishCardImageSortDrag);
    document.addEventListener("pointercancel", cancelCardImageSortDrag);
}

function handleCardImageSortPointerMove(event) {
    if (!cardImageSortDragState) return;

    event.preventDefault();
    const { cardIndex, offsetX, offsetY, ghost } = cardImageSortDragState;
    ghost.style.transform = `translate(${Math.round(event.clientX - offsetX)}px, ${Math.round(event.clientY - offsetY)}px)`;

    updateCardImageSortTargetFromPoint(event.clientX, event.clientY);
    updateCardImageSortAutoScroll(event.clientX, event.clientY);
}

function finishCardImageSortDrag(event) {
    if (!cardImageSortDragState) return;

    event.preventDefault();
    const { cardIndex, fromImageIndex, targetImageIndex } = cardImageSortDragState;
    cleanupCardImageSortDrag();

    if (moveCardImage(cardIndex, fromImageIndex, targetImageIndex)) {
        markRecentlyMovedCardImage(cardIndex, targetImageIndex);
    }
}

function cancelCardImageSortDrag() {
    cleanupCardImageSortDrag();
}

function isCardEditorCollapsed(index) {
    return collapsedCardEditorIndexes.has(index);
}

function syncCardSortModeButton() {
    const button = document.getElementById("cardSortModeBtn");
    if (!button) return;

    button.innerText = isCardSortMode ? "完成排序" : "调整段落顺序";
    button.classList.toggle("active", isCardSortMode);
    button.setAttribute("aria-pressed", isCardSortMode ? "true" : "false");
}

function toggleCardSortMode() {
    isCardSortMode = !isCardSortMode;
    cleanupCardSortDrag();
    if (!isCardSortMode) {
        clearRecentlyMovedCardHighlight();
    }
    clearRecentlyMovedCardImageHighlight();
    renderEditor();
}

function toggleCardEditorCollapsed(index) {
    if (!data[index] || isCardSortMode) return;

    if (collapsedCardEditorIndexes.has(index)) {
        collapsedCardEditorIndexes.delete(index);
    } else {
        collapsedCardEditorIndexes.add(index);
    }

    renderEditor();
    saveState();
}

function moveCard(fromIndex, toIndex) {
    if (
        fromIndex === toIndex
        || fromIndex < 0
        || toIndex < 0
        || fromIndex >= data.length
        || toIndex >= data.length
    ) {
        return false;
    }

    const collapsedFlags = data.map((_, index) => collapsedCardEditorIndexes.has(index));
    const [item] = data.splice(fromIndex, 1);
    const [collapsed] = collapsedFlags.splice(fromIndex, 1);
    data.splice(toIndex, 0, item);
    collapsedFlags.splice(toIndex, 0, collapsed);

    collapsedCardEditorIndexes.clear();
    collapsedFlags.forEach((isCollapsed, index) => {
        if (isCollapsed) {
            collapsedCardEditorIndexes.add(index);
        }
    });

    return true;
}

function moveCardByStep(index, step) {
    const toIndex = index + step;
    if (!isCardSortMode || !moveCard(index, toIndex)) return;

    recentlyMovedCardIndex = toIndex;
    renderOrderChangePreview();
    revealRecentlyMovedCard(toIndex);
}

function clearRecentlyMovedCardHighlight() {
    if (recentlyMovedCardHighlightTimer !== null) {
        window.clearTimeout(recentlyMovedCardHighlightTimer);
        recentlyMovedCardHighlightTimer = null;
    }
    recentlyMovedCardIndex = null;
}

function revealRecentlyMovedCard(index) {
    if (recentlyMovedCardHighlightTimer !== null) {
        window.clearTimeout(recentlyMovedCardHighlightTimer);
        recentlyMovedCardHighlightTimer = null;
    }

    requestAnimationFrame(() => {
        const block = document.querySelector(`#cardEditor .block[data-card-editor-index="${index}"]`);
        block?.scrollIntoView({
            behavior: "smooth",
            block: "center",
            inline: "nearest"
        });
    });

    recentlyMovedCardHighlightTimer = window.setTimeout(() => {
        if (recentlyMovedCardIndex !== index) return;

        recentlyMovedCardIndex = null;
        recentlyMovedCardHighlightTimer = null;
        renderEditor();
    }, 1200);
}

function getCardEditorBlockFromPoint(clientX, clientY) {
    const element = document.elementFromPoint(clientX, clientY);
    return element?.closest?.("#cardEditor .block") || null;
}

function updateCardSortDropTarget(targetIndex) {
    document.querySelectorAll("#cardEditor .block").forEach((block) => {
        const index = Number(block.dataset.cardEditorIndex);
        block.classList.toggle("cardSortDropTarget", index === targetIndex);
    });
}

function cleanupCardSortDrag() {
    document.removeEventListener("pointermove", handleCardSortPointerMove);
    document.removeEventListener("pointerup", finishCardSortDrag);
    document.removeEventListener("pointercancel", cancelCardSortDrag);
    document.body.classList.remove("cardSortDragging");
    document.querySelectorAll("#cardEditor .block").forEach((block) => {
        block.classList.remove("cardSortDraggingBlock", "cardSortDropTarget");
    });
    cardSortDragState?.ghost?.remove();
    cardSortDragState = null;
}

function startCardSortDrag(event, index) {
    if (!isCardSortMode || isMobileViewport() || !data[index]) return;

    event.preventDefault();
    const block = event.currentTarget.closest(".block");
    if (!block) return;

    const rect = block.getBoundingClientRect();
    const ghost = block.cloneNode(true);
    ghost.classList.add("cardSortGhost");
    ghost.style.width = `${rect.width}px`;
    ghost.style.height = `${rect.height}px`;
    ghost.style.left = "0px";
    ghost.style.top = "0px";
    ghost.style.transform = `translate(${Math.round(rect.left)}px, ${Math.round(rect.top)}px)`;
    document.body.appendChild(ghost);

    cardSortDragState = {
        fromIndex: index,
        targetIndex: index,
        pointerId: event.pointerId,
        offsetX: event.clientX - rect.left,
        offsetY: event.clientY - rect.top,
        ghost
    };

    event.currentTarget.setPointerCapture?.(event.pointerId);
    document.body.classList.add("cardSortDragging");
    block?.classList.add("cardSortDraggingBlock");
    updateCardSortDropTarget(index);
    document.addEventListener("pointermove", handleCardSortPointerMove);
    document.addEventListener("pointerup", finishCardSortDrag);
    document.addEventListener("pointercancel", cancelCardSortDrag);
}

function handleCardSortPointerMove(event) {
    if (!cardSortDragState) return;

    event.preventDefault();
    cardSortDragState.ghost.style.transform = `translate(${Math.round(event.clientX - cardSortDragState.offsetX)}px, ${Math.round(event.clientY - cardSortDragState.offsetY)}px)`;
    const block = getCardEditorBlockFromPoint(event.clientX, event.clientY);
    const index = Number(block?.dataset.cardEditorIndex);
    if (!Number.isInteger(index) || !data[index]) return;

    cardSortDragState.targetIndex = index;
    updateCardSortDropTarget(index);
}

function finishCardSortDrag(event) {
    if (!cardSortDragState) return;

    event.preventDefault();
    const { fromIndex, targetIndex } = cardSortDragState;
    cleanupCardSortDrag();

    if (moveCard(fromIndex, targetIndex)) {
        recentlyMovedCardIndex = targetIndex;
        renderOrderChangePreview();
        revealRecentlyMovedCard(targetIndex);
    }
}

function cancelCardSortDrag() {
    cleanupCardSortDrag();
}

function shiftCollapsedCardEditorIndexesAfterDelete(deletedIndex) {
    const nextIndexes = new Set();

    collapsedCardEditorIndexes.forEach((index) => {
        if (index < deletedIndex) {
            nextIndexes.add(index);
        } else if (index > deletedIndex) {
            nextIndexes.add(index - 1);
        }
    });

    collapsedCardEditorIndexes.clear();
    nextIndexes.forEach((index) => collapsedCardEditorIndexes.add(index));
}

function toggleCardHidden(index) {
    if (!data[index]) return;

    data[index].hidden = !data[index].hidden;
    renderLayoutChangePreview();
}

function deleteCard(index) {
    const ok = window.confirm("确定要删除这个段落吗？");
    if (!ok) return;

    data.splice(index, 1);
    shiftCollapsedCardEditorIndexesAfterDelete(index);
    renderLayoutChangePreview();
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

bindCustomColorPanel("background");
bindCustomColorPanel("text");

if (customColorModalBackdrop) {
    customColorModalBackdrop.onclick = function () {
        if (activeCustomColorTarget) {
            cancelCustomColor(activeCustomColorTarget);
        }
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
    syncCustomColorModalMode();

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
    updateMobileTypesetRefreshButton();
}

const previewScrollContainer = document.getElementById("preview");
if (previewScrollContainer) {
    previewScrollContainer.addEventListener("scroll", syncPhoneScroll);
}

window.addEventListener("resize", handleViewportChange);
window.addEventListener("beforeunload", flushPendingInputAndState);

if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", handleViewportChange);
}

async function initializeApp() {
    initializeArticleWorkspace();
    const didHydrateStoredImages = await loadCurrentArticleIntoEditor();

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
        if (didHydrateStoredImages) {
            saveState({ immediate: true });
        }
    });
}

initializeApp();
