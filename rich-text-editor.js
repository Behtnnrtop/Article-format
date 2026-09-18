(function () {
    "use strict";

    function createRichTextEditor(deps) {
        const richTextSelections = new Map();

        function getData() {
            return deps.getData();
        }

        function getRichTextEditor(index) {
            return document.getElementById(`contentEditor-${index}`);
        }

        function clearSelections() {
            richTextSelections.clear();
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

        function saveCurrentRichTextSelectionIfInside(index) {
            const editorEl = getRichTextEditor(index);
            const selection = window.getSelection();

            if (!editorEl || !selection || selection.rangeCount === 0) return false;

            const range = selection.getRangeAt(0);
            if (!isRangeInsideElement(range, editorEl)) return false;

            richTextSelections.set(index, range.cloneRange());
            return true;
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

        function clearRichTextColorStyles(element) {
            if (!element) return;

            Array.from(element.querySelectorAll("span")).forEach((span) => {
                if (span.style.color) {
                    span.style.removeProperty("color");
                }
            });
        }

        function unwrapRichTextSpanIfEmpty(span) {
            if (!span || span.tagName !== "SPAN" || span.attributes.length > 0) return;

            span.replaceWith(...Array.from(span.childNodes));
        }

        function unwrapEmptyRichTextSpans(element) {
            if (!element) return;

            Array.from(element.querySelectorAll("span")).reverse().forEach(unwrapRichTextSpanIfEmpty);
        }

        function wrapRichTextRangeTextNodes(range, editorEl, styleProperty, styleValue) {
            if (!range || !editorEl || !isRangeInsideElement(range, editorEl)) return false;

            editorEl.focus();
            if (!restoreRichTextSelectionFromRange(range)) return false;

            try {
                document.execCommand("styleWithCSS", false, true);
            } catch (_error) {
                // Some browsers ignore styleWithCSS; foreColor still applies via font tags.
            }
            document.execCommand("foreColor", false, styleValue);
            return true;
        }

        function restoreRichTextSelectionFromRange(range) {
            const selection = window.getSelection();
            if (!range || !selection) return false;

            selection.removeAllRanges();
            selection.addRange(range);
            return true;
        }

        function splitRichTextRangeBoundaries(range) {
            if (!range) return null;

            const nextRange = range.cloneRange();

            if (nextRange.startContainer === nextRange.endContainer && nextRange.startContainer.nodeType === Node.TEXT_NODE) {
                const textNode = nextRange.startContainer;
                const start = nextRange.startOffset;
                const end = nextRange.endOffset;

                if (end > 0 && end < textNode.length) {
                    textNode.splitText(end);
                }

                const selectedNode = start > 0 ? textNode.splitText(start) : textNode;
                const selectedRange = document.createRange();
                selectedRange.setStartBefore(selectedNode);
                selectedRange.setEndAfter(selectedNode);
                return selectedRange;
            }

            if (nextRange.endContainer.nodeType === Node.TEXT_NODE) {
                const endNode = nextRange.endContainer;
                const end = nextRange.endOffset;

                if (end > 0 && end < endNode.length) {
                    endNode.splitText(end);
                }
                nextRange.setEnd(endNode, endNode.length);
            }

            if (nextRange.startContainer.nodeType === Node.TEXT_NODE) {
                const startNode = nextRange.startContainer;
                const start = nextRange.startOffset;

                if (start > 0 && start < startNode.length) {
                    const selectedStartNode = startNode.splitText(start);
                    nextRange.setStart(selectedStartNode, 0);
                }
            }

            return nextRange;
        }

        function getRichTextRangeTextNodes(range, root) {
            if (!range || !root) return [];

            const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
                acceptNode(node) {
                    if (!node.nodeValue || !range.intersectsNode(node)) return NodeFilter.FILTER_REJECT;
                    return NodeFilter.FILTER_ACCEPT;
                }
            });
            const nodes = [];

            while (walker.nextNode()) {
                nodes.push(walker.currentNode);
            }

            return nodes;
        }

        function clearRichTextRangeColor(range, editorEl) {
            if (!range || !editorEl || !isRangeInsideElement(range, editorEl)) return false;

            const boundedRange = splitRichTextRangeBoundaries(range);
            const textNodes = getRichTextRangeTextNodes(boundedRange, editorEl);
            const touchedSpans = new Set();

            textNodes.forEach((textNode) => {
                let current = textNode.parentElement;
                while (current && current !== editorEl) {
                    if (current.tagName === "SPAN" && current.style && current.style.color) {
                        current.style.removeProperty("color");
                        touchedSpans.add(current);
                    }
                    current = current.parentElement;
                }
            });

            Array.from(touchedSpans).reverse().forEach(unwrapRichTextSpanIfEmpty);
            unwrapEmptyRichTextSpans(editorEl);
            return true;
        }

        function getRichTextSelectionOffsets(editorEl) {
            const selection = window.getSelection();
            if (!editorEl || !selection || selection.rangeCount === 0) return null;

            const range = selection.getRangeAt(0);
            if (!isRangeInsideElement(range, editorEl)) return null;

            return {
                start: getRichTextBoundaryOffset(editorEl, range.startContainer, range.startOffset),
                end: getRichTextBoundaryOffset(editorEl, range.endContainer, range.endOffset),
                collapsed: range.collapsed
            };
        }

        function isRichTextBlockElement(node) {
            return node && node.nodeType === Node.ELEMENT_NODE && (node.tagName === "DIV" || node.tagName === "P");
        }

        function isRichTextSingleBreakBlock(node) {
            return isRichTextBlockElement(node)
                && node.childNodes.length === 1
                && node.firstChild
                && node.firstChild.nodeType === Node.ELEMENT_NODE
                && node.firstChild.tagName === "BR";
        }

        function getRichTextNodeTextLength(node, root) {
            if (!node) return 0;

            if (node.nodeType === Node.TEXT_NODE) {
                return node.nodeValue.length;
            }

            if (node.nodeType === Node.ELEMENT_NODE && node.tagName === "BR") {
                return 1;
            }

            if (node.nodeType !== Node.ELEMENT_NODE && node.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) {
                return 0;
            }

            let length = 0;
            Array.from(node.childNodes).forEach((child) => {
                length += getRichTextNodeTextLength(child, root);
            });

            if (node !== root && isRichTextBlockElement(node) && !isRichTextSingleBreakBlock(node)) {
                length += 1;
            }

            return length;
        }

        function getRichTextBoundaryOffset(root, container, offset) {
            if (!root || !container) return 0;

            if (container === root) {
                return Array.from(root.childNodes)
                    .slice(0, offset)
                    .reduce((total, child) => total + getRichTextNodeTextLength(child, root), 0);
            }

            let total = 0;
            let found = false;

            function walk(node) {
                if (!node || found) return;

                if (node === container) {
                    if (node.nodeType === Node.TEXT_NODE) {
                        total += Math.max(0, Math.min(offset, node.nodeValue.length));
                    } else {
                        total += Array.from(node.childNodes)
                            .slice(0, offset)
                            .reduce((sum, child) => sum + getRichTextNodeTextLength(child, root), 0);
                    }
                    found = true;
                    return;
                }

                if (node.nodeType === Node.TEXT_NODE || (node.nodeType === Node.ELEMENT_NODE && node.tagName === "BR")) {
                    total += getRichTextNodeTextLength(node, root);
                    return;
                }

                if (node.nodeType !== Node.ELEMENT_NODE && node.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) {
                    return;
                }

                const beforeChildren = total;
                Array.from(node.childNodes).forEach(walk);
                if (found) return;

                if (node !== root && isRichTextBlockElement(node) && !isRichTextSingleBreakBlock(node)) {
                    total += 1;
                }

                if (node !== root && isRichTextSingleBreakBlock(node) && total === beforeChildren) {
                    total += 1;
                }
            }

            walk(root);
            return total;
        }

        function getRichTextPositionAtOffset(editorEl, offset) {
            const targetOffset = Math.max(0, Number(offset) || 0);
            let currentOffset = 0;
            let fallback = {
                node: editorEl,
                offset: editorEl.childNodes.length
            };

            function positionAfterNode(node) {
                const parent = node.parentNode || editorEl;
                return {
                    node: parent,
                    offset: Array.prototype.indexOf.call(parent.childNodes, node) + 1
                };
            }

            function walk(node) {
                if (!node) return null;

                if (node.nodeType === Node.TEXT_NODE) {
                    const nextOffset = currentOffset + node.nodeValue.length;
                    fallback = {
                        node,
                        offset: node.nodeValue.length
                    };

                    if (targetOffset <= nextOffset) {
                        return {
                            node,
                            offset: Math.max(0, targetOffset - currentOffset)
                        };
                    }

                    currentOffset = nextOffset;
                    return null;
                }

                if (node.nodeType === Node.ELEMENT_NODE && node.tagName === "BR") {
                    const nextOffset = currentOffset + 1;
                    fallback = positionAfterNode(node);

                    if (targetOffset <= nextOffset) {
                        return fallback;
                    }

                    currentOffset = nextOffset;
                    return null;
                }

                if (node.nodeType !== Node.ELEMENT_NODE && node.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) {
                    return null;
                }

                const beforeChildren = currentOffset;
                const children = Array.from(node.childNodes);
                for (let index = 0; index < children.length; index += 1) {
                    const result = walk(children[index]);
                    if (result) return result;
                }

                if (node !== editorEl && isRichTextBlockElement(node) && !isRichTextSingleBreakBlock(node)) {
                    const nextOffset = currentOffset + 1;
                    fallback = positionAfterNode(node);

                    if (targetOffset <= nextOffset) {
                        return fallback;
                    }

                    currentOffset = nextOffset;
                }

                if (node !== editorEl && isRichTextSingleBreakBlock(node) && currentOffset === beforeChildren) {
                    const nextOffset = currentOffset + 1;
                    fallback = positionAfterNode(node);

                    if (targetOffset <= nextOffset) {
                        return fallback;
                    }

                    currentOffset = nextOffset;
                }

                return null;
            }

            return walk(editorEl) || fallback;
        }

        function restoreRichTextSelectionOffsets(editorEl, offsets) {
            const selection = window.getSelection();
            if (!editorEl || !selection || !offsets) return false;

            const start = getRichTextPositionAtOffset(editorEl, offsets.start);
            const end = offsets.collapsed
                ? start
                : getRichTextPositionAtOffset(editorEl, offsets.end);
            const range = document.createRange();

            range.setStart(start.node, start.offset);
            range.setEnd(end.node, end.offset);
            selection.removeAllRanges();
            selection.addRange(range);
            return true;
        }

        function finishRichTextEditorChange(index, editorEl, selectionOffsets = null) {
            const data = getData();
            if (!editorEl || !data[index]) return;

            const nextSelectionOffsets = selectionOffsets || getRichTextSelectionOffsets(editorEl);
            data[index].text = deps.sanitizeRichText(editorEl.innerHTML);
            editorEl.innerHTML = data[index].text;
            restoreRichTextSelectionOffsets(editorEl, nextSelectionOffsets);
            saveRichTextSelection(index);
            deps.afterChange(index);
        }

        function normalizeRichTextCommandSelection(editorEl) {
            const selection = window.getSelection();
            if (!editorEl || !selection || selection.rangeCount === 0) return false;

            const range = selection.getRangeAt(0);
            if (!isRangeInsideElement(range, editorEl) || range.collapsed) return false;

            const textNodes = getRichTextRangeTextNodes(range, editorEl);
            if (!textNodes.length) return false;

            const firstTextNode = textNodes[0];
            const lastTextNode = textNodes[textNodes.length - 1];
            const nextRange = document.createRange();
            const startsInsideText = range.startContainer.nodeType === Node.TEXT_NODE;
            const endsInsideText = range.endContainer.nodeType === Node.TEXT_NODE;

            nextRange.setStart(
                startsInsideText ? range.startContainer : firstTextNode,
                startsInsideText ? range.startOffset : 0
            );
            nextRange.setEnd(
                endsInsideText ? range.endContainer : lastTextNode,
                endsInsideText ? range.endOffset : lastTextNode.nodeValue.length
            );

            selection.removeAllRanges();
            selection.addRange(nextRange);
            return true;
        }

        function getRichTextCommandConfig(command) {
            const configs = {
                bold: {
                    tagName: "B",
                    matchingTags: ["B", "STRONG"]
                },
                italic: {
                    tagName: "I",
                    matchingTags: ["I", "EM"]
                },
                underline: {
                    tagName: "U",
                    matchingTags: ["U"]
                },
                strikeThrough: {
                    tagName: "S",
                    matchingTags: ["S", "STRIKE"]
                }
            };

            return configs[command] || null;
        }

        function getClosestRichTextCommandAncestor(node, config, editorEl) {
            let current = node && node.parentElement;
            const matchingTags = config ? config.matchingTags : [];

            while (current && current !== editorEl) {
                if (matchingTags.includes(current.tagName)) {
                    return current;
                }
                current = current.parentElement;
            }

            return null;
        }

        function hasRichTextCommandStyle(node, config, editorEl) {
            return Boolean(getClosestRichTextCommandAncestor(node, config, editorEl));
        }

        function splitElementAroundChild(element, child) {
            if (!element || !child || child.parentNode !== element) return;

            const parent = element.parentNode;
            if (!parent) return;

            const before = element.cloneNode(false);
            const after = element.cloneNode(false);

            while (element.firstChild && element.firstChild !== child) {
                before.appendChild(element.firstChild);
            }

            while (child.nextSibling) {
                after.appendChild(child.nextSibling);
            }

            if (before.childNodes.length) {
                parent.insertBefore(before, element);
            }
            if (after.childNodes.length) {
                parent.insertBefore(after, element.nextSibling);
            }
        }

        function unwrapRichTextCommandAncestorForNode(textNode, commandElement, editorEl) {
            if (!textNode || !commandElement || !editorEl || !editorEl.contains(commandElement)) return;

            let branch = textNode;
            let parent = branch.parentNode;

            while (parent && parent !== commandElement) {
                splitElementAroundChild(parent, branch);
                branch = parent;
                parent = branch.parentNode;
            }

            if (parent !== commandElement) return;

            splitElementAroundChild(commandElement, branch);
            commandElement.parentNode.insertBefore(branch, commandElement);
            commandElement.remove();
        }

        function wrapRichTextNodeWithCommand(textNode, config) {
            if (!textNode || !textNode.nodeValue || !config) return;

            const wrapper = document.createElement(config.tagName);
            textNode.parentNode.insertBefore(wrapper, textNode);
            wrapper.appendChild(textNode);
        }

        function removeEmptyRichTextInlineElements(editorEl) {
            if (!editorEl) return;

            Array.from(editorEl.querySelectorAll("b,strong,i,em,u,s,strike,span")).reverse().forEach((element) => {
                if (element.childNodes.length === 0 || !element.textContent) {
                    element.replaceWith(...Array.from(element.childNodes));
                }
            });
        }

        function toggleRichTextCommandRange(editorEl, command) {
            const selection = window.getSelection();
            const config = getRichTextCommandConfig(command);
            if (!editorEl || !selection || selection.rangeCount === 0 || !config) return false;

            const range = selection.getRangeAt(0);
            if (!isRangeInsideElement(range, editorEl) || range.collapsed) return false;

            const boundedRange = splitRichTextRangeBoundaries(range);
            const textNodes = getRichTextRangeTextNodes(boundedRange, editorEl)
                .filter((node) => node.nodeValue && node.nodeValue.length > 0);
            if (!textNodes.length) return false;

            const shouldRemove = textNodes.every((node) => hasRichTextCommandStyle(node, config, editorEl));

            if (shouldRemove) {
                textNodes.forEach((textNode) => {
                    const commandElement = getClosestRichTextCommandAncestor(textNode, config, editorEl);
                    if (commandElement) {
                        unwrapRichTextCommandAncestorForNode(textNode, commandElement, editorEl);
                    }
                });
            } else {
                textNodes.forEach((textNode) => {
                    if (!hasRichTextCommandStyle(textNode, config, editorEl)) {
                        wrapRichTextNodeWithCommand(textNode, config);
                    }
                });
            }

            removeEmptyRichTextInlineElements(editorEl);
            return true;
        }

        function formatCardText(index, command) {
            const editorEl = getRichTextEditor(index);
            if (!editorEl) return;

            saveCurrentRichTextSelectionIfInside(index);
            editorEl.focus();
            restoreRichTextSelection(index);
            const selectionOffsets = getRichTextSelectionOffsets(editorEl);
            if (toggleRichTextCommandRange(editorEl, command)) {
                finishRichTextEditorChange(index, editorEl, selectionOffsets);
            }
        }

        function applyRichTextFont(index, value, selectEl = null) {
            const data = getData();
            const editorEl = getRichTextEditor(index);
            if (!editorEl || !data[index]) return;

            const selectedValue = value || deps.inheritFontValue;
            const nextFontFamily = selectedValue !== deps.inheritFontValue ? selectedValue : deps.getGlobalFontFamily();
            const savedRange = getSavedRichTextRange(index);
            const hasSelectedText = Boolean(savedRange && !savedRange.collapsed && String(savedRange).length > 0);

            editorEl.focus();

            if (hasSelectedText) {
                restoreRichTextSelection(index);
                document.execCommand("fontName", false, deps.getPrimaryFontFamily(nextFontFamily) || nextFontFamily);
            } else {
                data[index].contentFontFamily = selectedValue;
                stripRichTextFontSpans(editorEl);
                editorEl.style.fontFamily = deps.resolveCardContentFontFamily(data[index]);
            }

            data[index].contentFontToolbarValue = selectedValue;

            if (selectEl) {
                selectEl.value = selectedValue;
                selectEl.style.fontFamily = selectedValue === deps.inheritFontValue
                    ? deps.resolveCardContentFontFamily(data[index])
                    : selectedValue;
            }

            finishRichTextEditorChange(index, editorEl);
        }

        function applyRichTextSelectedColor(index, range, value) {
            const data = getData();
            const editorEl = getRichTextEditor(index);
            const selectedValue = deps.normalizeColorValue(value);
            if (!editorEl || !data[index] || !selectedValue || !range || range.collapsed) return false;

            if (!isRangeInsideElement(range, editorEl)) return false;

            editorEl.focus();
            wrapRichTextRangeTextNodes(range, editorEl, "color", selectedValue);
            finishRichTextEditorChange(index, editorEl);
            return true;
        }

        function applyRichTextParagraphColor(index, value) {
            const data = getData();
            const editorEl = getRichTextEditor(index);
            const selectedValue = deps.normalizeColorValue(value);
            if (!editorEl || !data[index] || !selectedValue) return false;

            data[index].contentColor = selectedValue;
            editorEl.style.color = selectedValue;
            finishRichTextEditorChange(index, editorEl);
            return true;
        }

        function resetRichTextColor(index) {
            const data = getData();
            const editorEl = getRichTextEditor(index);
            if (!editorEl || !data[index]) return;

            const savedRange = getSavedRichTextRange(index);
            const hasSelectedText = Boolean(savedRange && !savedRange.collapsed && String(savedRange).length > 0);

            editorEl.focus();

            if (hasSelectedText) {
                clearRichTextRangeColor(savedRange, editorEl);
            } else {
                data[index].contentColor = "";
                clearRichTextColorStyles(editorEl);
                unwrapEmptyRichTextSpans(editorEl);
                editorEl.style.color = deps.getTextColor();
            }

            finishRichTextEditorChange(index, editorEl);
        }

        function resetRichTextColorWithContext(context) {
            const data = getData();
            if (!context || !data[context.index]) return;

            const editorEl = getRichTextEditor(context.index);
            if (!editorEl) return;

            editorEl.focus();

            if (context.hasSelectedText && context.range) {
                clearRichTextRangeColor(context.range, editorEl);
            } else {
                data[context.index].contentColor = "";
                clearRichTextColorStyles(editorEl);
                unwrapEmptyRichTextSpans(editorEl);
                editorEl.style.color = deps.getTextColor();
            }

            finishRichTextEditorChange(context.index, editorEl);
        }

        function createPlainTextPasteFragment(text, doc = document) {
            const fragment = doc.createDocumentFragment();
            const normalizedText = String(text == null ? "" : text)
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
            const text = event.clipboardData ? event.clipboardData.getData("text/plain") : "";
            if (insertPlainTextIntoEditor(editorEl, text)) {
                dispatchRichTextInput(editorEl, text);
            }
        }

        return {
            clearSelections,
            getRichTextEditor,
            isRangeInsideElement,
            saveRichTextSelection,
            saveCurrentRichTextSelectionIfInside,
            restoreRichTextSelection,
            getSavedRichTextRange,
            stripRichTextFontSpans,
            clearRichTextColorStyles,
            unwrapRichTextSpanIfEmpty,
            unwrapEmptyRichTextSpans,
            wrapRichTextRangeTextNodes,
            restoreRichTextSelectionFromRange,
            splitRichTextRangeBoundaries,
            getRichTextRangeTextNodes,
            clearRichTextRangeColor,
            finishRichTextEditorChange,
            formatCardText,
            applyRichTextFont,
            applyRichTextSelectedColor,
            applyRichTextParagraphColor,
            resetRichTextColor,
            resetRichTextColorWithContext,
            createPlainTextPasteFragment,
            dispatchRichTextInput,
            insertPlainTextIntoEditor,
            pastePlainText
        };
    }

    window.RichTextEditor = {
        createRichTextEditor
    };
})();
