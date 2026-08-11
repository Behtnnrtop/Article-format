/* ===========================
   State
=========================== */

const STORAGE_KEY = "article-summary-state";
const STATE_SCHEMA_VERSION = 10;

let globalFont = {
    year: 78,  // 标题
    subtitle: 42,  // 副标题
    side: 128   //竖排
};

let backgroundColor = "#efefef";
let textColor = "#111111";
let fontFamily = '"Microsoft YaHei",sans-serif';
const CARD_TITLE_DEFAULT_FONT_FAMILY = '"Songti SC","STSong","SimSun",serif';
const INHERIT_FONT_VALUE = "__inherit__";
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
let showPhonePreview = false;
let phoneResolution = "1080x2376";
let phonePreviewScale = 1;
let subtitlePosition = "belowTitle";
const MAX_PREVIEW_FONT_SCALE = 0.42;
const MIN_PREVIEW_FONT_SCALE = 0.32;
const BASE_COPYRIGHT_FONT_SIZE = 13;
const BASE_RESOLUTION_WIDTH = 1080;
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
let phonePreviewFrame = null;
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

        if (typeof state.backgroundColor === "string") {
            backgroundColor = state.backgroundColor;
        }

        if (typeof state.textColor === "string") {
            textColor = state.textColor;
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

function autoResizeTextarea(element) {
    if (!element) return;

    element.style.height = "auto";
    element.style.height = `${element.scrollHeight}px`;
}

function saveState() {
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({
                globalFont,
                data,
                editorWidth,
                backgroundColor,
                textColor,
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
                showPhonePreview,
                phoneResolution,
                phonePreviewScale,
                subtitlePosition,
                yearTitle: document.getElementById("yearInput")?.value ?? "输入标题",
                sideHeader: document.getElementById("sideInput")?.value ?? "输入竖排标题",
                subtitle: document.getElementById("subtitleInput")?.value ?? "作者：",
                schemaVersion: STATE_SCHEMA_VERSION
            })
        );
    } catch (error) {
        // Ignore storage quota or availability issues.
    }
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

function renderPreview() {
    applyResponsiveViewport();

    const previewFontScale = getPreviewFontScale();
    const resolutionDesignScale = getResolutionDesignScale();

    const yearElement = document.getElementById("year");
    const yearText = document.getElementById("yearInput").value;
    yearElement.innerText = yearText;
    yearElement.dataset.shadowText = yearText;

    renderVerticalTextTarget("side");

    document.getElementById("year").style.fontSize =
        globalFont.year * previewFontScale + "px";

    document.getElementById("side").style.fontSize =
        globalFont.side * previewFontScale + "px";

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
        poster.style.backgroundColor = backgroundColor;
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

    renderVerticalTextTarget("subtitle");

    const copyrightEl = document.getElementById("copyright");
    if (copyrightEl) {
        copyrightEl.style.fontSize = `${BASE_COPYRIGHT_FONT_SIZE * resolutionDesignScale}px`;
    }

    let html = "";

    data.forEach((item) => {
        if (item.hidden) return;

        const titleText = escapeHtml(item.title);
        const textHtml = renderRichTextPreview(item.text);
        const itemLineSpacing = getItemLineSpacing(item);
        const itemParagraphSpacing = getItemParagraphSpacing(item);

        html += `
        <div class="card">
            <div class="cardTitle" style="font-size:${item.titleSize * previewFontScale}px;font-family:${escapeHtml(resolveCardTitleFontFamily(item))};">${titleText}</div>
            <div class="cardContent">
                <div class="info" style="font-size:${item.textSize * previewFontScale}px;font-family:${escapeHtml(resolveCardContentFontFamily(item))};--content-line-height:${itemLineSpacing};--content-paragraph-spacing:${itemParagraphSpacing}px;">${textHtml}</div>
            </div>
        </div>
        `;
    });

    document.getElementById("cards").innerHTML = html;

    syncCardsOffset();

    if (subtitlePosition === "verticalLeft") {
        requestAnimationFrame(syncCardsOffset);
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

    renderBackgroundPalette();
    renderTextColorPalette();
    updateTimelineButtons();
    syncPhonePreview();
    saveState();
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

function render() {
    renderPreview();
    renderEditor();
}

function renderEditor() {
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
            <label class="inlineLabel">标题 <span class="sizeValue">${item.titleSize}px</span></label>
            <button onclick="changeTitleSize(${index},-2)">A-</button>
            <button onclick="changeTitleSize(${index},2)">A+</button>
            <select class="fontSelect blockFontSelect" style="font-family:${escapeHtml(titleFontFamily)};" onchange="changeCardTitleFont(${index},this.value,this)">
                ${titleFontOptions}
            </select>
            <textarea rows="2" style="font-family:${escapeHtml(titleFontFamily)};" oninput="autoResizeTextarea(this);changeTitle(${index},this.value)">${titleText}</textarea>
            <label class="inlineLabel">内容 <span class="sizeValue">${item.textSize}px</span></label>
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
    const watermarkBandHeight = getWatermarkBandHeight(resolution, 1, watermarkSettings);
    const clone = poster.cloneNode(true);
    const posterStyle = window.getComputedStyle(poster);

    screen.style.aspectRatio = `${resolution.width} / ${resolution.height}`;
    panel.style.setProperty("--phone-preview-scale", phonePreviewScale);
    if (mockup) {
        mockup.style.setProperty("--phone-preview-scale", phonePreviewScale);
    }
    if (scaleValue) {
        scaleValue.innerText = `${Math.round(phonePreviewScale * 100)}%`;
    }

    clone.classList.add("phonePosterClone");
    clone.style.width = `${imageWidth}px`;
    clone.style.minHeight = `${Math.max(poster.scrollHeight, poster.offsetHeight, resolution.height)}px`;

    const clonedCopyright = clone.querySelector("#copyright");
    if (clonedCopyright) {
        clonedCopyright.style.visibility = "hidden";
        clonedCopyright.style.marginTop = "0";
        clonedCopyright.style.height = "0";
        clonedCopyright.style.overflow = "hidden";
    }

    canvas.innerHTML = "";
    canvas.style.width = `${imageWidth}px`;
    canvas.style.minHeight = `${Math.max(poster.scrollHeight, poster.offsetHeight, resolution.height)}px`;
    canvas.style.marginTop = "0";
    canvas.appendChild(clone);

    canvasWrap.innerHTML = "";
    canvasWrap.style.backgroundColor = posterStyle.backgroundColor || backgroundColor;
    canvasWrap.appendChild(canvas);

    watermark.innerText = watermarkSettings.text;
    watermark.style.backgroundColor = watermarkSettings.background;
    watermark.style.color = watermarkSettings.color;

    requestAnimationFrame(() => {
        const scale = screen.clientWidth / imageWidth;
        const scaledTopPadding = topPaddingHeight * scale;
        const scaledWatermarkHeight = watermarkBandHeight * scale;
        const scaledFontSize = parseFloat(window.getComputedStyle(document.getElementById("copyright")).fontSize || "13") * scale;
        const contentHeight = Math.max(clone.scrollHeight, poster.scrollHeight, poster.offsetHeight) * scale;

        topPaddingLayer.style.height = `${scaledTopPadding}px`;
        topPaddingLayer.style.backgroundColor = watermarkSettings.background;
        canvasWrap.style.top = `${scaledTopPadding}px`;
        canvasWrap.style.bottom = `${scaledWatermarkHeight}px`;
        canvasWrap.style.height = "";
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
    renderPreview();
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

function changeTitleSize(index, delta) {
    data[index].titleSize += delta;
    if (data[index].titleSize < 6) {
        data[index].titleSize = 6;
    }
    render();
}

function changeTextSize(index, delta) {
    data[index].textSize += delta;
    if (data[index].textSize < 6) {
        data[index].textSize = 6;
    }
    render();
}

function changeYearSize(delta) {
    globalFont.year += delta;
    renderPreview();
}

function changeSubtitleSize(delta) {
    globalFont.subtitle += delta;
    if (globalFont.subtitle < 6) {
        globalFont.subtitle = 6;
    }
    renderPreview();
}

function changeSideSize(delta) {
    globalFont.side += delta;
    renderPreview();
}

function changeBackgroundColor(value) {
    backgroundColor = value;
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

function changeTextColor(value) {
    textColor = value;
    renderPreview();
}

function changeLineSpacing(index, value) {
    const nextValue = Number(value);
    if (!data[index] || Number.isNaN(nextValue)) return;

    data[index].lineSpacing = Math.min(Math.max(nextValue, 1), 3);
    renderPreview();
}

function changeParagraphSpacing(index, value) {
    const nextValue = Number(value);
    if (!data[index] || Number.isNaN(nextValue)) return;

    data[index].paragraphSpacing = Math.min(Math.max(nextValue, 0), 80);
    renderPreview();
}

function changeSideSpacing(value) {
    const nextValue = Number(value);
    if (Number.isNaN(nextValue)) return;

    sideSpacing = Math.min(Math.max(nextValue, -120), 240);
    renderPreview();
}

function changeParagraphTitleSpacing(value) {
    const nextValue = Number(value);
    if (Number.isNaN(nextValue)) return;

    paragraphTitleSpacing = Math.min(Math.max(nextValue, -40), 80);
    renderPreview();
}

function changeModuleSpacing(value) {
    const nextValue = Number(value);
    if (Number.isNaN(nextValue)) return;

    moduleSpacing = Math.min(Math.max(nextValue, 0), 160);
    renderPreview();
}

function changeTopPadding(value) {
    const nextValue = Number(value);
    if (Number.isNaN(nextValue)) return;

    topPadding = Math.min(Math.max(nextValue, 0), 240);
    renderPreview();
}

function changeSideHeaderReserve(value) {
    const nextValue = Number(value);
    if (Number.isNaN(nextValue)) return;

    sideHeaderReserve = Math.min(Math.max(nextValue, 0), 240);
    renderPreview();
}

function changeSubtitle(value) {
    renderVerticalTextTarget("subtitle", value);
    syncCardsOffset();
    schedulePhonePreviewSync();
    saveState();
}

function toggleTimeline() {
    showTimeline = !showTimeline;
    renderPreview();
}

function toggleMonthTitles() {
    showMonthTitles = !showMonthTitles;
    renderPreview();
}

function toggleMonthUnderlines() {
    showMonthUnderlines = !showMonthUnderlines;
    renderPreview();
}

function toggleSideHeader() {
    showSideHeader = !showSideHeader;
    renderPreview();
}

function toggleSubtitlePosition() {
    subtitlePosition = subtitlePosition === "verticalLeft" ? "belowTitle" : "verticalLeft";
    renderPreview();
}

function togglePhonePreview() {
    showPhonePreview = !showPhonePreview;
    updateTimelineButtons();
    syncPhonePreview();
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
    syncPhonePreview();
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
        titleSize: 48,
        textSize: 18,
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

dragBar.addEventListener("mousedown", function () {
    if (isMobileViewport()) return;

    dragging = true;
    document.body.style.userSelect = "none";
});

document.addEventListener("mouseup", function () {
    dragging = false;
    document.body.style.userSelect = "auto";

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

    syncCardsOffset();
    schedulePhonePreviewSync();
});

/* ===========================
   Input Bindings
=========================== */

document.getElementById("yearInput").oninput = function () {
    autoResizeTextarea(this);
    renderPreview();
};
document.getElementById("sideInput").oninput = function () {
    autoResizeTextarea(this);
    renderPreview();
};

if (subtitleInput) {
    subtitleInput.oninput = function () {
        autoResizeTextarea(this);
        changeSubtitle(this.value);
    };
}

if (textColorPicker) {
    textColorPicker.oninput = function () {
        changeTextColor(this.value);
    };
}

if (customColorPicker) {
    customColorPicker.oninput = function () {
        changeBackgroundColor(this.value);
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

function handleViewportChange() {
    applyResponsiveViewport();
    syncCardsOffset();
    syncPhonePreview();
}

const previewScrollContainer = document.getElementById("preview");
if (previewScrollContainer) {
    previewScrollContainer.addEventListener("scroll", syncPhoneScroll);
}

window.addEventListener("resize", handleViewportChange);

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

async function capturePosterCanvas({ hideCopyright = false, scale = 3, afterCapture = null } = {}) {
    const exportState = preparePosterForExport();
    if (!exportState) return Promise.reject(new Error("未找到预览区域，无法导出。"));

    try {
        if (document.fonts?.ready) {
            await document.fonts.ready;
        }

        const canvas = await html2canvas(exportState.poster, {
            backgroundColor: backgroundColor,
            scale,
            useCORS: true,
            onclone: (clonedDoc) => {
                const clonedPoster = clonedDoc.getElementById("poster");
                if (clonedPoster) {
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
    const mobileFallbackWindow = isLikelyMobileBrowser() ? window.open("", "_blank") : null;

    try {
        const sourceCanvas = await capturePosterCanvas();
        const resolution = phoneResolutions[phoneResolution] || phoneResolutions["1080x2376"];
        const scale = sourceCanvas.width / (document.getElementById("poster")?.offsetWidth || sourceCanvas.width);
        const posterStyle = window.getComputedStyle(document.getElementById("poster"));
        const topPaddingHeight = getExportTopPaddingHeight(resolution, scale);
        const canvas = addCanvasTopPadding(sourceCanvas, topPaddingHeight, posterStyle.backgroundColor || backgroundColor);
        const blob = await canvasToBlob(canvas, "image/jpeg", 1);
        downloadBlob(blob, "年度总结.jpg", { fallbackWindow: mobileFallbackWindow });
    } catch (error) {
        if (mobileFallbackWindow && !mobileFallbackWindow.closed) {
            mobileFallbackWindow.close();
        }

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

function drawCenteredWatermark(ctx, settings, width, contentHeight, bandHeight) {
    ctx.fillStyle = settings.background;
    ctx.fillRect(0, contentHeight, width, bandHeight);
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

function addCanvasTopPadding(sourceCanvas, paddingHeight, background) {
    if (paddingHeight <= 0) return sourceCanvas;

    const paddedCanvas = document.createElement("canvas");
    const ctx = paddedCanvas.getContext("2d");

    paddedCanvas.width = sourceCanvas.width;
    paddedCanvas.height = sourceCanvas.height + paddingHeight;
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, paddedCanvas.width, paddedCanvas.height);
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
        } else if (isLikelyMobileBrowser()) {
            window.open(url, "_blank", "noopener");
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
    return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);
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
            samples.push([pixel[0], pixel[1], pixel[2]]);
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

                    const pixel = [data[index], data[index + 1], data[index + 2]];
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

async function addSliceToZip(zip, sourceCanvas, sourceY, sourceHeight, index, topPaddingHeight, watermarkBandHeight, watermarkSettings, outputHeight = null) {
    const sliceOutputHeight = outputHeight ?? topPaddingHeight + sourceHeight + watermarkBandHeight;
    const watermarkTop = sliceOutputHeight - watermarkBandHeight;
    const sliceCanvas = document.createElement("canvas");
    const ctx = sliceCanvas.getContext("2d");

    sliceCanvas.width = sourceCanvas.width;
    sliceCanvas.height = sliceOutputHeight;
    ctx.fillStyle = watermarkSettings.background;
    ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
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
    drawCenteredWatermark(
        ctx,
        watermarkSettings,
        sliceCanvas.width,
        watermarkTop,
        watermarkBandHeight
    );

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

async function exportSlicedImagesZip() {
    const button = document.getElementById("exportSlicesBtn");
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
            afterCapture: (canvas) => {
                protectedRanges = getProtectedTextRanges(canvas);
            }
        });
        const scale = sourceCanvas.width / posterWidth;
        const watermarkSettings = getWatermarkSettings(scale);
        const watermarkBandHeight = getWatermarkBandHeight(resolution, scale, watermarkSettings);
        const topPaddingHeight = getExportTopPaddingHeight(resolution, scale);
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
                sliceHeight
            );

            sourceY += currentContentHeight;
            index += 1;
        }

        button.innerText = "正在打包...";
        const zipBlob = await zip.generateAsync({ type: "blob" });
        downloadBlob(zipBlob, "年度总结-已切图jpg.zip");
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

if (typeof editorWidth === "number") {
    editor.style.width = editorWidth + "px";
}

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

render();
