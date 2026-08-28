(function () {
    "use strict";

    const CARD_TYPE_TEXT = "text";
    const CARD_TYPE_IMAGE = "image";
    const CARD_TITLE_PLACEHOLDER = "输入段落标题...";
    const MAX_CARD_IMAGE_BYTES = 2 * 1024 * 1024;
    const MAX_CARD_IMAGE_EDGE = 2400;
    const MIN_CARD_IMAGE_EDGE = 240;
    const CARD_IMAGE_INITIAL_QUALITY = 0.88;
    const CARD_IMAGE_MIN_QUALITY = 0.64;
    const CARD_IMAGE_QUALITY_STEP = 0.06;
    const CARD_IMAGE_SCALE_STEP = 0.9;

    function createParagraphModule(deps) {
        const {
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
        } = deps;

        function createTextCard(overrides = {}) {
            return {
                type: CARD_TYPE_TEXT,
                title: "文字段落",
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
                paragraphSpacing: 0,
                ...overrides
            };
        }

        function createImageCard(overrides = {}) {
            return {
                type: CARD_TYPE_IMAGE,
                title: "图片段落",
                titlePlaceholder: CARD_TITLE_PLACEHOLDER,
                images: [],
                imageDataUrl: "",
                imageName: "",
                imageMimeType: "",
                imageOriginalMimeType: "",
                imageHasTransparency: false,
                imageBytes: 0,
                imageWidth: 0,
                imageHeight: 0,
                imageWidthPercent: 100,
                imageFit: "contain",
                titleSize: 70,
                titleFontFamily: CARD_TITLE_DEFAULT_FONT_FAMILY,
                titleAlign: "left",
                hidden: false,
                paragraphSpacing: 0,
                ...overrides
            };
        }

        function isImageCard(item) {
            return item?.type === CARD_TYPE_IMAGE;
        }

        function normalizeData(items, schemaVersion) {
            const shouldNormalizeFontSizes = !schemaVersion || schemaVersion < 4;
            const shouldEscapeText = !schemaVersion || schemaVersion < 5;

            return items.map((rawItem) => {
                const item = rawItem && typeof rawItem === "object" ? rawItem : {};
                const type = item.type === CARD_TYPE_IMAGE ? CARD_TYPE_IMAGE : CARD_TYPE_TEXT;
                const titleSize = typeof item.titleSize === "number" ? item.titleSize : 48;
                const textSize = typeof item.textSize === "number" ? item.textSize : 18;
                const text = typeof item.text === "string" ? item.text : "";

                const normalizedBase = {
                    ...item,
                    type,
                    titlePlaceholder: CARD_TITLE_PLACEHOLDER,
                    titleSize: shouldNormalizeFontSizes ? Math.max(titleSize, 48) : titleSize,
                    titleFontFamily: typeof item.titleFontFamily === "string" ? item.titleFontFamily : CARD_TITLE_DEFAULT_FONT_FAMILY,
                    titleAlign: normalizeTextAlign(item.titleAlign),
                    hidden: item.hidden === true
                };

                if (type === CARD_TYPE_IMAGE) {
                    const fallbackImageWidthPercent = [50, 75, 100].includes(item.imageWidthPercent) ? item.imageWidthPercent : 100;
                    const images = Array.isArray(item.images)
                        ? item.images
                        : (item.imageDataUrl ? [item] : []);
                    const normalizedImages = images
                        .filter((image) => {
                            if (!image || typeof image !== "object") return false;

                            const hasDataUrl = typeof image.imageDataUrl === "string" && image.imageDataUrl;
                            const hasStoreId = typeof image.imageStoreId === "string" && image.imageStoreId;
                            return hasDataUrl || hasStoreId;
                        })
                        .map((image, imageIndex) => ({
                            id: typeof image.id === "string" && image.id ? image.id : `image-${imageIndex}`,
                            imageStoreId: typeof image.imageStoreId === "string" ? image.imageStoreId : "",
                            imageDataUrl: typeof image.imageDataUrl === "string" ? image.imageDataUrl : "",
                            imageName: typeof image.imageName === "string" ? image.imageName : "",
                            imageMimeType: typeof image.imageMimeType === "string" ? image.imageMimeType : "",
                            imageOriginalMimeType: typeof image.imageOriginalMimeType === "string" ? image.imageOriginalMimeType : "",
                            imageHasTransparency: image.imageHasTransparency === true,
                            imageBytes: typeof image.imageBytes === "number" ? image.imageBytes : 0,
                            imageWidth: typeof image.imageWidth === "number" ? image.imageWidth : 0,
                            imageHeight: typeof image.imageHeight === "number" ? image.imageHeight : 0,
                            imageWidthPercent: [50, 75, 100].includes(image.imageWidthPercent) ? image.imageWidthPercent : fallbackImageWidthPercent,
                            imageAlign: normalizeTextAlign(image.imageAlign || "center")
                        }));

                    return createImageCard({
                        ...normalizedBase,
                        images: normalizedImages,
                        imageDataUrl: normalizedImages[0]?.imageDataUrl || "",
                        imageName: normalizedImages[0]?.imageName || "",
                        imageMimeType: normalizedImages[0]?.imageMimeType || "",
                        imageOriginalMimeType: normalizedImages[0]?.imageOriginalMimeType || "",
                        imageHasTransparency: normalizedImages[0]?.imageHasTransparency === true,
                        imageBytes: normalizedImages[0]?.imageBytes || 0,
                        imageWidth: normalizedImages[0]?.imageWidth || 0,
                        imageHeight: normalizedImages[0]?.imageHeight || 0,
                        imageWidthPercent: [50, 75, 100].includes(item.imageWidthPercent) ? item.imageWidthPercent : 100,
                        imageFit: item.imageFit === "cover" ? "cover" : "contain"
                    });
                }

                return createTextCard({
                    ...normalizedBase,
                    text: shouldEscapeText ? plainTextToRichText(text) : sanitizeRichText(text),
                    textSize: shouldNormalizeFontSizes ? Math.max(textSize, 18) : textSize,
                    contentFontFamily: typeof item.contentFontFamily === "string" ? item.contentFontFamily : INHERIT_FONT_VALUE,
                    contentFontToolbarValue: typeof item.contentFontToolbarValue === "string"
                        ? item.contentFontToolbarValue
                        : (typeof item.contentFontFamily === "string" ? item.contentFontFamily : INHERIT_FONT_VALUE),
                    textAlign: normalizeTextAlign(item.textAlign)
                });
            });
        }

        function getDataUrlByteSize(dataUrl) {
            const base64 = String(dataUrl || "").split(",")[1] || "";
            return Math.floor(base64.length * 0.75);
        }

        function formatBytes(bytes) {
            const value = Number(bytes) || 0;
            if (value >= 1024 * 1024) return `${(value / 1024 / 1024).toFixed(1)}MB`;
            if (value >= 1024) return `${Math.round(value / 1024)}KB`;
            return `${Math.round(value)}B`;
        }

        function supportsCanvasMimeType(mimeType) {
            const canvas = document.createElement("canvas");
            return canvas.toDataURL(mimeType).startsWith(`data:${mimeType}`);
        }

        function loadFileAsImage(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => {
                    if (typeof reader.result !== "string") {
                        reject(new Error("图片读取失败，请重试。"));
                        return;
                    }

                    const image = new Image();
                    image.onload = () => resolve({ image, dataUrl: reader.result });
                    image.onerror = () => reject(new Error("图片加载失败，请重试。"));
                    image.src = reader.result;
                };
                reader.onerror = () => reject(new Error("图片读取失败，请重试。"));
                reader.readAsDataURL(file);
            });
        }

        function drawImageToCanvas(image, width, height) {
            const canvas = document.createElement("canvas");
            canvas.width = Math.max(1, Math.round(width));
            canvas.height = Math.max(1, Math.round(height));

            const ctx = canvas.getContext("2d", { willReadFrequently: true });
            if (!ctx) throw new Error("当前浏览器无法处理图片，请重试。");

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
            return canvas;
        }

        function canvasHasTransparency(canvas) {
            const ctx = canvas.getContext("2d", { willReadFrequently: true });
            if (!ctx) return false;

            const chunkHeight = 256;
            for (let y = 0; y < canvas.height; y += chunkHeight) {
                const height = Math.min(chunkHeight, canvas.height - y);
                const data = ctx.getImageData(0, y, canvas.width, height).data;

                for (let index = 3; index < data.length; index += 4) {
                    if (data[index] < 255) return true;
                }
            }

            return false;
        }

        async function compressCardImageFile(file) {
            if (!file) return null;
            if (!file.type || !file.type.startsWith("image/")) {
                throw new Error("请选择图片文件。");
            }

            const { image, dataUrl } = await loadFileAsImage(file);
            const naturalWidth = image.naturalWidth || image.width;
            const naturalHeight = image.naturalHeight || image.height;
            if (!naturalWidth || !naturalHeight) {
                throw new Error("图片尺寸异常，请换一张图片。");
            }

            const originalBytes = file.size || getDataUrlByteSize(dataUrl);
            if (originalBytes <= MAX_CARD_IMAGE_BYTES) {
                return {
                    dataUrl,
                    bytes: originalBytes,
                    width: naturalWidth,
                    height: naturalHeight,
                    mimeType: file.type,
                    originalMimeType: file.type,
                    hasTransparency: false
                };
            }

            const initialScale = Math.min(1, MAX_CARD_IMAGE_EDGE / Math.max(naturalWidth, naturalHeight));
            let width = Math.max(1, Math.round(naturalWidth * initialScale));
            let height = Math.max(1, Math.round(naturalHeight * initialScale));
            const transparencyCanvas = drawImageToCanvas(image, width, height);
            const hasTransparency = canvasHasTransparency(transparencyCanvas);
            const preferredMimeType = hasTransparency && supportsCanvasMimeType("image/webp")
                ? "image/webp"
                : (hasTransparency ? "image/png" : "image/jpeg");
            let quality = CARD_IMAGE_INITIAL_QUALITY;

            while (width >= MIN_CARD_IMAGE_EDGE && height >= MIN_CARD_IMAGE_EDGE) {
                const canvas = width === transparencyCanvas.width && height === transparencyCanvas.height
                    ? transparencyCanvas
                    : drawImageToCanvas(image, width, height);
                const dataUrl = preferredMimeType === "image/png"
                    ? canvas.toDataURL(preferredMimeType)
                    : canvas.toDataURL(preferredMimeType, quality);
                const bytes = getDataUrlByteSize(dataUrl);

                if (bytes <= MAX_CARD_IMAGE_BYTES) {
                    return {
                        dataUrl,
                        bytes,
                        width: canvas.width,
                        height: canvas.height,
                        mimeType: preferredMimeType,
                        originalMimeType: file.type,
                        hasTransparency
                    };
                }

                if (preferredMimeType !== "image/png" && quality > CARD_IMAGE_MIN_QUALITY) {
                    quality = Math.max(CARD_IMAGE_MIN_QUALITY, quality - CARD_IMAGE_QUALITY_STEP);
                } else {
                    width = Math.max(1, Math.round(width * CARD_IMAGE_SCALE_STEP));
                    height = Math.max(1, Math.round(height * CARD_IMAGE_SCALE_STEP));
                }
            }

            throw new Error("图片过大，无法在保留画质的情况下压缩到 2MB 以内。");
        }

        function waitForPosterImagesLoaded(root) {
            const images = Array.from(root?.querySelectorAll("img") || []);
            if (!images.length) return Promise.resolve();

            return Promise.all(images.map((image) => {
                if (image.complete && image.naturalWidth > 0) return Promise.resolve();

                return new Promise((resolve) => {
                    image.onload = () => resolve();
                    image.onerror = () => resolve();
                });
            }));
        }

        function renderPreviewCard(item, index, previewFontScale) {
            const titleText = escapeHtml(item.title);
            const itemParagraphSpacing = getItemParagraphSpacing(item);
            const titleAlign = normalizeTextAlign(item.titleAlign);
            const cardStyle = `--card-paragraph-spacing:${itemParagraphSpacing}px`;
            const titleHtml = `<div class="cardTitle" data-text-align="${titleAlign}" style="font-size:${item.titleSize * previewFontScale}px;font-family:${escapeHtml(resolveCardTitleFontFamily(item))};text-align:${titleAlign};">${titleText}</div>`;

            if (isImageCard(item)) {
                const images = Array.isArray(item.images) ? item.images : (item.imageDataUrl ? [item] : []);
                const imageHtml = images.length
                    ? `<div class="cardImageList">${images.map((image) => `
                    <div class="cardImageWrap" data-image-align="${normalizeTextAlign(image.imageAlign || "center")}"><img class="cardImage" src="${escapeHtml(image.imageDataUrl)}" alt="${escapeHtml(image.imageName || item.title || "图片段落")}" style="width:${[50, 75, 100].includes(image.imageWidthPercent) ? image.imageWidthPercent : 100}%;object-fit:${escapeHtml(item.imageFit || "contain")};"></div>
                `).join("")}</div>`
                    : `<div class="cardImagePlaceholder">未上传图片</div>`;

                return `
        <div class="card imageCard" data-card-index="${index}" data-card-type="image" style="${cardStyle}">
            ${titleHtml}
            <div class="cardContent">
                ${imageHtml}
            </div>
        </div>
        `;
            }

            const textHtml = renderRichTextPreview(item.text, { sanitize: false });
            const itemLineSpacing = getItemLineSpacing(item);
            const textAlign = normalizeTextAlign(item.textAlign);

            return `
        <div class="card" data-card-index="${index}" data-card-type="text" style="${cardStyle}">
            ${titleHtml}
            <div class="cardContent">
                <div class="info" data-text-align="${textAlign}" style="font-size:${item.textSize * previewFontScale}px;font-family:${escapeHtml(resolveCardContentFontFamily(item))};--content-line-height:${itemLineSpacing};--content-paragraph-spacing:${itemParagraphSpacing}px;text-align:${textAlign};">${textHtml}</div>
            </div>
        </div>
        `;
        }

        function renderTextCardEditorBody(item, index, textHtml, contentFontOptions, contentFontToolbarValue) {
            const itemLineSpacing = getItemLineSpacing(item);
            const itemParagraphSpacing = getItemParagraphSpacing(item);

            return `
            <div class="blockSizeControlRow">
                <label class="inlineLabel">内容 <span class="sizeValue" data-card-index="${index}" data-size-type="text">${item.textSize}px</span></label>
                <div class="blockSizeButtons">
                    <button type="button" onclick="changeTextSize(${index},-2)">A-</button>
                    <button type="button" onclick="changeTextSize(${index},2)">A+</button>
                </div>
            </div>
            <div data-align-control-target="cardText:${index}">
                ${renderTextAlignControls(`cardText:${index}`, item.textAlign)}
            </div>
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
                    data-placeholder="输入段落内容..."
                    style="font-family:${escapeHtml(resolveCardContentFontFamily(item))};"
                    oninput="changeText(${index},this.innerHTML)"
                    onblur="normalizeRichTextEditorPlaceholder(this)"
                    onfocus="saveRichTextSelection(${index})"
                    onkeyup="saveRichTextSelection(${index})"
                    onmouseup="saveRichTextSelection(${index})"
                    onpaste="pastePlainText(event)">${textHtml}</div>
            </div>
        `;
        }

        function renderImageWidthOptions(selectedValue) {
            return [50, 75, 100]
                .map((value) => `<option value="${value}"${value === selectedValue ? " selected" : ""}>${value}%</option>`)
                .join("");
        }

        function renderImageAlignButtons(cardIndex, imageIndex, selectedValue) {
            const selectedAlign = normalizeTextAlign(selectedValue || "center");
            return ["left", "center", "right"]
                .map((value) => {
                    const label = value === "left" ? "左" : (value === "right" ? "右" : "中");
                    return `<button type="button" class="${value === selectedAlign ? "active" : ""}" data-card-image-align-value="${value}" aria-pressed="${value === selectedAlign ? "true" : "false"}" onclick="changeCardImageAlign(${cardIndex},${imageIndex},'${value}')">${label}</button>`;
                })
                .join("");
        }

        function renderImageCardEditorBody(item, index) {
            const itemParagraphSpacing = getItemParagraphSpacing(item);
            const images = Array.isArray(item.images) ? item.images : (item.imageDataUrl ? [item] : []);
            const totalBytes = images.reduce((sum, image) => sum + (Number(image.imageBytes) || 0), 0);
            const imageStatus = images.length
                ? `已上传 ${images.length} 张，合计 ${formatBytes(totalBytes)}`
                : "未上传图片";
            const imagePreviewHtml = images.length
                ? `<div class="cardImageEditorPreviewList">${images.map((image, imageIndex) => `
                    <div class="cardImageEditorPreviewItem">
                        <div class="cardImageEditorPreviewName">${imageIndex + 1}. ${escapeHtml(image.imageName || "图片")}，${formatBytes(image.imageBytes)}，${image.imageWidth || 0}×${image.imageHeight || 0}</div>
                        <div class="cardImageEditorPreviewBody">
                            <div class="cardImageEditorPreviewFrame">
                                <img class="cardImageEditorPreview" src="${escapeHtml(image.imageDataUrl)}" alt="">
                            </div>
                            <div class="cardImageEditorControls">
                                <button type="button" class="deleteBtn" onclick="removeCardImageAt(${index},${imageIndex})">移除</button>
                                <label>
                                    图片宽度
                                    <select onchange="changeCardImageWidth(${index},${imageIndex},this.value)">
                                        ${renderImageWidthOptions([50, 75, 100].includes(image.imageWidthPercent) ? image.imageWidthPercent : 100)}
                                    </select>
                                </label>
                                <div class="cardImageAlignControl" data-card-image-align-control="${index}:${imageIndex}" aria-label="图片对齐方式">
                                    ${renderImageAlignButtons(index, imageIndex, image.imageAlign)}
                                </div>
                            </div>
                        </div>
                    </div>
                `).join("")}</div>`
                : "";

            return `
            <div class="blockSizeControlRow">
                <label class="inlineLabel">图片</label>
            </div>
            <div class="cardImageUploadHint">请上传6MB以下的图片</div>
            <div class="blockSpacingControls">
                <label for="paragraphSpacingInput-${index}">
                    段间距
                    <input type="number" id="paragraphSpacingInput-${index}" min="0" max="80" step="2" value="${itemParagraphSpacing}" oninput="changeParagraphSpacing(${index},this.value)">
                </label>
                <div class="cardImageEditorActions">
                    <button type="button" onclick="openCardImagePicker(${index})">${images.length ? "继续添加" : "上传图片"}</button>
                    <button type="button" class="deleteBtn" onclick="removeCardImage(${index})"${images.length ? "" : " disabled"}>清空图片</button>
                </div>
            </div>
            <div class="cardImageEditor">
                <input type="file" id="cardImageInput-${index}" accept="image/*" multiple class="hiddenFileInput" onchange="changeCardImage(${index},this.files)">
                <div class="cardImageStatus">${imageStatus}</div>
                ${imagePreviewHtml}
            </div>
        `;
        }

        return {
            CARD_TYPE_TEXT,
            CARD_TYPE_IMAGE,
            createTextCard,
            createImageCard,
            isImageCard,
            normalizeData,
            getDataUrlByteSize,
            formatBytes,
            compressCardImageFile,
            waitForPosterImagesLoaded,
            renderPreviewCard,
            renderTextCardEditorBody,
            renderImageCardEditorBody
        };
    }

    window.ArticleParagraphs = {
        createParagraphModule
    };
})();
