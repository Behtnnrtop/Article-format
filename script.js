/* ===========================
   State
=========================== */

const STORAGE_KEY = "article-summary-state";
const STATE_SCHEMA_VERSION = 8;

let globalFont = {
    year: 40,
    subtitle: 14,
    side: 50
};

let backgroundColor = "#efefef";
let textColor = "#111111";
let fontFamily = '"Microsoft YaHei",sans-serif';
let lineSpacing = 1.8;
let paragraphSpacing = 0;
let paragraphTitleSpacing = 0;
let moduleSpacing = 58;
let topPadding = 58;
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
const paragraphTitleSpacingInput = document.getElementById("paragraphTitleSpacingInput");
const moduleSpacingInput = document.getElementById("moduleSpacingInput");
const topPaddingInput = document.getElementById("topPaddingInput");

const fallbackFontOptions = [
    { label: "默认字体", value: '"Microsoft YaHei",sans-serif' },
    { label: "宋体", value: 'SimSun,"Songti SC","STSong",serif' }
];

let fontOptions = [...fallbackFontOptions];

let data = [
    {
        title: "一月",
        text: "Loading...",
        titleSize: 48,
        textSize: 18,
        lineSpacing: 1.8,
        paragraphSpacing: 0
    },
    {
        title: "二月",
        text: "Loading...",
        titleSize: 48,
        textSize: 18,
        lineSpacing: 1.8,
        paragraphSpacing: 0
    }
];

let editorWidth = null;
let phonePreviewFrame = null;

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

        if (typeof state.fontFamily === "string") {
            fontFamily = state.fontFamily;
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
            textSize: shouldNormalizeFontSizes ? Math.max(textSize, 18) : textSize
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

    const allowedTags = new Set(["B", "STRONG", "I", "EM", "U", "S", "STRIKE", "BR", "DIV", "P"]);

    function cleanNode(node) {
        Array.from(node.childNodes).forEach((child) => {
            if (child.nodeType !== Node.ELEMENT_NODE) return;

            cleanNode(child);

            if (!allowedTags.has(child.tagName)) {
                child.replaceWith(...Array.from(child.childNodes));
                return;
            }

            Array.from(child.attributes).forEach((attribute) => {
                child.removeAttribute(attribute.name);
            });
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
                fontFamily,
                textColor,
                lineSpacing,
                paragraphSpacing,
                paragraphTitleSpacing,
                moduleSpacing,
                topPadding,
                showTimeline,
                showMonthTitles,
                showMonthUnderlines,
                showSideHeader,
                showPhonePreview,
                phoneResolution,
                phonePreviewScale,
                subtitlePosition,
                yearTitle: document.getElementById("yearInput")?.value ?? "文手年度总结",
                sideHeader: document.getElementById("sideInput")?.value ?? "2025",
                subtitle: document.getElementById("subtitle")?.innerText ?? "yearly summary",
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

function setFontStatus(message) {
    const fontStatus = document.getElementById("fontStatus");
    if (fontStatus) {
        fontStatus.innerText = message;
    }
}

function renderFontSelectOptions() {
    const fontSelect = document.getElementById("fontSelect");
    if (!fontSelect) return;

    const hasCurrentFont = fontOptions.some((option) => option.value === fontFamily);
    const options = hasCurrentFont
        ? fontOptions
        : [{ label: "当前字体", value: fontFamily }, ...fontOptions];

    fontSelect.innerHTML = options
        .map((option) => {
            const optionValue = escapeHtml(option.value);
            return `<option value="${optionValue}" style="font-family:${optionValue};">${escapeHtml(option.label)}</option>`;
        })
        .join("");
    fontSelect.value = fontFamily;
    fontSelect.style.fontFamily = fontFamily;
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
        const systemFontOptions = Array.from(
            new Map(
                fonts
                    .map((font) => font.family)
                    .filter(Boolean)
                    .sort((a, b) => a.localeCompare(b, "zh-Hans-CN"))
                    .map((family) => [family, { label: family, value: quoteCssFontFamily(family) }])
            ).values()
        );

        const fallbackValues = new Set(fallbackFontOptions.map((option) => option.value));
        fontOptions = [
            ...fallbackFontOptions,
            ...systemFontOptions.filter((option) => !fallbackValues.has(option.value))
        ];

        renderFontSelectOptions();
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

    document.getElementById("year").innerText =
        document.getElementById("yearInput").value;

    document.getElementById("side").innerText =
        document.getElementById("sideInput").value;

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
        poster.style.setProperty("--card-title-spacing", `${paragraphTitleSpacing}px`);
        poster.style.setProperty("--module-spacing", `${moduleSpacing}px`);
        poster.classList.toggle("noTimeline", !showTimeline);
        poster.classList.toggle("hideMonthTitles", !showMonthTitles);
        poster.classList.toggle("hideMonthUnderlines", !showMonthUnderlines);
        poster.classList.toggle("hideSideHeader", !showSideHeader);
        poster.classList.toggle("subtitleVerticalLeft", subtitlePosition === "verticalLeft");
    }

    if (subtitleInput) {
        const subtitleEl = document.getElementById("subtitle");
        if (subtitleEl && subtitleEl.innerText !== subtitleInput.value) {
            subtitleEl.innerText = subtitleInput.value;
        }
    }

    const subtitleEl = document.getElementById("subtitle");
    if (subtitleEl) {
        subtitleEl.style.fontSize = `${globalFont.subtitle * previewFontScale}px`;
    }

    const copyrightEl = document.getElementById("copyright");
    if (copyrightEl) {
        copyrightEl.style.fontSize = `${BASE_COPYRIGHT_FONT_SIZE * resolutionDesignScale}px`;
    }

    let html = "";

    data.forEach((item) => {
        const titleText = escapeHtml(item.title);
        const textHtml = renderRichTextPreview(item.text);
        const itemLineSpacing = getItemLineSpacing(item);
        const itemParagraphSpacing = getItemParagraphSpacing(item);

        html += `
        <div class="card">
            <div class="cardTitle" style="font-size:${item.titleSize * previewFontScale}px;">${titleText}</div>
            <div class="cardContent">
                <div class="info" style="font-size:${item.textSize * previewFontScale}px;--content-line-height:${itemLineSpacing};--content-paragraph-spacing:${itemParagraphSpacing}px;">${textHtml}</div>
            </div>
        </div>
        `;
    });

    document.getElementById("cards").innerHTML = html;

    syncCardsOffset();

    const fontSelect = document.getElementById("fontSelect");
    if (fontSelect && fontSelect.value !== fontFamily) {
        fontSelect.value = fontFamily;
    }

    if (subtitleInput) {
        const subtitleEl = document.getElementById("subtitle");
        if (subtitleEl && subtitleInput.value !== subtitleEl.innerText) {
            subtitleInput.value = subtitleEl.innerText;
        }
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
        const subtitleStyle = window.getComputedStyle(subtitle);
        const authorGap = parseFloat(subtitleStyle.marginTop || "0") || 0;
        const subtitleTop = Math.max(sideRect.bottom - subtitleRect.height - posterRect.top, 0);
        const subtitleRight = Math.max(posterRect.right - sideRect.left + authorGap, 0);
        poster.style.setProperty("--subtitle-vertical-top", `${subtitleTop}px`);
        poster.style.setProperty("--subtitle-vertical-right", `${subtitleRight}px`);
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

        html += `
        <div class="block">
            <div class="blockHeader">
                <h3>第 ${index + 1} 段</h3>
                <button class="deleteBtn" onclick="deleteCard(${index})">删除作品</button>
            </div>
            <label class="inlineLabel">标题 <span class="sizeValue">${item.titleSize}px</span></label>
            <button onclick="changeTitleSize(${index},-2)">A-</button>
            <button onclick="changeTitleSize(${index},2)">A+</button>
            <textarea rows="2" oninput="autoResizeTextarea(this);changeTitle(${index},this.value)">${titleText}</textarea>
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
                <div class="richTextToolbar" onmousedown="event.preventDefault()">
                    <button type="button" title="粗体" onclick="formatCardText(${index}, 'bold')"><strong>B</strong></button>
                    <button type="button" title="斜体" onclick="formatCardText(${index}, 'italic')"><em>I</em></button>
                    <button type="button" title="下划线" onclick="formatCardText(${index}, 'underline')"><u>U</u></button>
                    <button type="button" title="删除线" onclick="formatCardText(${index}, 'strikeThrough')"><s>S</s></button>
                </div>
                <div
                    id="contentEditor-${index}"
                    class="richTextEditor"
                    contenteditable="true"
                    oninput="changeText(${index},this.innerHTML)"
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
        titleButton.innerText = showMonthTitles ? "隐藏月份标题" : "显示月份标题";
    }

    const underlineButton = document.getElementById("underlineToggleBtn");
    if (underlineButton) {
        underlineButton.innerText = showMonthUnderlines ? "隐藏横线" : "显示横线";
    }

    const sideHeaderButton = document.getElementById("sideHeaderToggleBtn");
    if (sideHeaderButton) {
        sideHeaderButton.innerText = showSideHeader ? "隐藏竖排版头" : "显示竖排版头";
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

function formatCardText(index, command) {
    const editorEl = document.getElementById(`contentEditor-${index}`);
    if (!editorEl) return;

    document.execCommand(command, false, null);
    editorEl.focus();

    data[index].text = sanitizeRichText(editorEl.innerHTML);
    editorEl.innerHTML = data[index].text;
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

function changeFontFamily(value) {
    fontFamily = value;
    const fontSelect = document.getElementById("fontSelect");
    if (fontSelect) {
        fontSelect.style.fontFamily = fontFamily;
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

function changeSubtitle(value) {
    const subtitleEl = document.getElementById("subtitle");
    if (subtitleEl) {
        subtitleEl.innerText = value;
    }
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
        lineSpacing: 1.8,
        paragraphSpacing: 0
    });
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

const fontSelect = document.getElementById("fontSelect");
if (fontSelect) {
    fontSelect.onchange = function () {
        changeFontFamily(this.value);
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

function fixSideHeaderForExport(clonedDoc) {
    const side = clonedDoc.getElementById("side");
    const clonedPoster = clonedDoc.getElementById("poster");
    if (side && !clonedPoster?.classList.contains("hideSideHeader")) {
        const sourceSide = document.getElementById("side");
        const sourceStyle = sourceSide ? window.getComputedStyle(sourceSide) : null;

        side.style.writingMode = "horizontal-tb";
        side.style.display = "block";
        side.style.position = "absolute";
        side.style.whiteSpace = "nowrap";
        side.style.top = sourceStyle?.top || "40px";
        side.style.right = sourceStyle?.right || "50px";
        side.style.transform = "translateX(50%) rotate(90deg)";
        side.style.transformOrigin = "center center";
    }
}

function fixSubtitleForExport(clonedDoc) {
    const subtitle = clonedDoc.getElementById("subtitle");
    const clonedPoster = clonedDoc.getElementById("poster");
    if (subtitle && clonedPoster?.classList.contains("subtitleVerticalLeft")) {
        subtitle.style.writingMode = "horizontal-tb";
        subtitle.style.display = "block";
        subtitle.style.whiteSpace = "pre-wrap";
        subtitle.style.transform = "rotate(90deg)";
        subtitle.style.transformOrigin = "top left";
    }
}

function capturePosterCanvas({ hideCopyright = false } = {}) {
    const exportState = preparePosterForExport();
    if (!exportState) return Promise.reject(new Error("未找到预览区域，无法导出。"));

    return html2canvas(exportState.poster, {
        backgroundColor: backgroundColor,
        scale: 3,
        useCORS: true,
        onclone: (clonedDoc) => {
            fixSideHeaderForExport(clonedDoc);
            fixSubtitleForExport(clonedDoc);

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
    }).finally(() => {
        restorePosterAfterExport(exportState);
    });
}

async function exportImage() {
    try {
        const sourceCanvas = await capturePosterCanvas();
        const resolution = phoneResolutions[phoneResolution] || phoneResolutions["1080x2376"];
        const scale = sourceCanvas.width / (document.getElementById("poster")?.offsetWidth || sourceCanvas.width);
        const posterStyle = window.getComputedStyle(document.getElementById("poster"));
        const topPaddingHeight = getExportTopPaddingHeight(resolution, scale);
        const canvas = addCanvasTopPadding(sourceCanvas, topPaddingHeight, posterStyle.backgroundColor || backgroundColor);
        const link = document.createElement("a");
        link.download = "年度总结.jpg";
        link.href = canvas.toDataURL("image/jpeg", 1);
        link.click();
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
    const padding = Math.max(6, Math.round(8 * scale));
    const textSelectors = [
        "#year",
        "#subtitle",
        "#side",
        ".cardTitle",
        ".info"
    ];

    const ranges = textSelectors.flatMap((selector) =>
        Array.from(document.querySelectorAll(selector))
            .filter((element) => window.getComputedStyle(element).display !== "none")
            .flatMap((element) => {
                const textRanges = getTextNodeCanvasRanges(element, sourceCanvas, padding);
                return textRanges.length ? textRanges : [getElementCanvasBounds(element, sourceCanvas, padding)].filter(Boolean);
            })
    );

    return mergeCanvasRanges(ranges);
}

function isProtectedCutY(y, ranges) {
    return ranges.some((range) => y >= range.top && y <= range.bottom);
}

function getSafeContentSliceHeight(sourceCanvas, sourceY, maxContentHeight, protectedRanges) {
    const remainingHeight = sourceCanvas.height - sourceY;
    if (remainingHeight <= maxContentHeight) return remainingHeight;

    const scale = getCanvasScale(sourceCanvas);
    const idealCutY = sourceY + maxContentHeight;
    const minCutY = sourceY + Math.max(Math.round(maxContentHeight * 0.48), Math.round(240 * scale));

    for (let y = Math.floor(idealCutY); y >= minCutY; y -= 1) {
        if (!isProtectedCutY(y, protectedRanges)) {
            return y - sourceY;
        }
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

async function addSliceToZip(zip, sourceCanvas, sourceY, sourceHeight, index, topPaddingHeight, watermarkBandHeight, watermarkSettings) {
    const outputHeight = topPaddingHeight + sourceHeight + watermarkBandHeight;
    const sliceCanvas = document.createElement("canvas");
    const ctx = sliceCanvas.getContext("2d");

    sliceCanvas.width = sourceCanvas.width;
    sliceCanvas.height = outputHeight;
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
        topPaddingHeight + sourceHeight,
        watermarkBandHeight
    );

    const blob = await canvasToBlob(sliceCanvas, "image/jpeg", 0.95);
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

        const sourceCanvas = await capturePosterCanvas({ hideCopyright: true });
        const resolution = phoneResolutions[phoneResolution] || phoneResolutions["1080x2376"];
        const scale = sourceCanvas.width / (document.getElementById("poster")?.offsetWidth || sourceCanvas.width);
        const watermarkSettings = getWatermarkSettings(scale);
        const watermarkBandHeight = getWatermarkBandHeight(resolution, scale, watermarkSettings);
        const topPaddingHeight = getExportTopPaddingHeight(resolution, scale);
        const sliceHeight = Math.round(sourceCanvas.width * (resolution.height / resolution.width));
        const contentSliceHeight = Math.max(sliceHeight - topPaddingHeight - watermarkBandHeight, 1);
        const zip = new JSZip();

        let sourceY = 0;
        let index = 1;

        if (showTimeline) {
            const cardBounds = getTimelineCardSliceBounds(sourceCanvas);

            for (const bounds of cardBounds) {
                await addSliceToZip(
                    zip,
                    sourceCanvas,
                    bounds.top,
                    bounds.bottom - bounds.top,
                    index,
                    topPaddingHeight,
                    watermarkBandHeight,
                    watermarkSettings
                );
                index += 1;
            }
        } else {
            const protectedRanges = getProtectedTextRanges(sourceCanvas);

            while (sourceY < sourceCanvas.height) {
                const currentContentHeight = getSafeContentSliceHeight(
                    sourceCanvas,
                    sourceY,
                    contentSliceHeight,
                    protectedRanges
                );

                await addSliceToZip(
                    zip,
                    sourceCanvas,
                    sourceY,
                    currentContentHeight,
                    index,
                    topPaddingHeight,
                    watermarkBandHeight,
                    watermarkSettings
                );

                sourceY += currentContentHeight;
                index += 1;
            }
        }

        button.innerText = "正在打包...";
        const zipBlob = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(zipBlob);
        const link = document.createElement("a");
        link.download = "年度总结-已切图jpg.zip";
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
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

if (moduleSpacingInput) {
    moduleSpacingInput.value = String(moduleSpacing);
}

if (topPaddingInput) {
    topPaddingInput.value = String(topPadding);
}

if (fontSelect) {
    renderFontSelectOptions();
}

render();
