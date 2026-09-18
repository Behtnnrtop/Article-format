(function () {
    "use strict";

    function createArticleWorkspace(deps) {
        const storage = deps.storage;
        const keys = deps.keys;
        const articleIndexSchemaVersion = deps.articleIndexSchemaVersion;
        const stateSchemaVersion = deps.stateSchemaVersion;
        const copyStyleStateKeys = deps.copyStyleStateKeys;
        const copyStyleContentKeys = deps.copyStyleContentKeys;

        function getArticleIndex() {
            return deps.getArticleIndex();
        }

        function setArticleIndex(index) {
            deps.setArticleIndex(index);
        }

        function getCurrentArticleId() {
            return deps.getCurrentArticleId();
        }

        function setCurrentArticleId(articleId) {
            deps.setCurrentArticleId(articleId);
        }

        function createArticleId() {
            const randomPart = Math.random().toString(36).slice(2, 8);
            return `article_${Date.now().toString(36)}_${randomPart}`;
        }

        function getArticleStorageKey(articleId) {
            return `${keys.articleStatePrefix}${articleId}`;
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
                const raw = storage.getItem(keys.articleIndex);
                if (!raw) return { schemaVersion: articleIndexSchemaVersion, articles: [] };

                const parsed = JSON.parse(raw);
                const articles = Array.isArray(parsed && parsed.articles)
                    ? parsed.articles.map(normalizeArticleMeta).filter(Boolean)
                    : [];

                return {
                    schemaVersion: articleIndexSchemaVersion,
                    articles
                };
            } catch (error) {
                return { schemaVersion: articleIndexSchemaVersion, articles: [] };
            }
        }

        function saveArticleIndexToStorage() {
            storage.setItem(keys.articleIndex, JSON.stringify({
                schemaVersion: articleIndexSchemaVersion,
                articles: getArticleIndex().articles
            }));
        }

        function saveCurrentArticleIdToStorage() {
            const articleId = getCurrentArticleId();
            if (articleId) {
                storage.setItem(keys.currentArticleId, articleId);
            }
        }

        function getCurrentArticleMeta() {
            const currentArticleId = getCurrentArticleId();
            return getArticleIndex().articles.find((article) => article.id === currentArticleId) || null;
        }

        function initializeArticleWorkspace() {
            const loadedArticleIndex = loadArticleIndexFromStorage();
            let currentArticleId = storage.getItem(keys.currentArticleId) || "";
            setArticleIndex(loadedArticleIndex);
            setCurrentArticleId(currentArticleId);

            if (!loadedArticleIndex.articles.length) {
                const articleId = createArticleId();
                const legacyRaw = storage.getItem(keys.legacyState);
                let title = "未命名文章";

                if (legacyRaw) {
                    try {
                        title = deps.getFallbackArticleTitle(JSON.parse(legacyRaw));
                    } catch (error) {
                        title = "未命名文章";
                    }
                    storage.setItem(getArticleStorageKey(articleId), legacyRaw);
                } else {
                    storage.setItem(getArticleStorageKey(articleId), JSON.stringify(deps.createBlankPersistedState()));
                }

                const now = Date.now();
                setArticleIndex({
                    schemaVersion: articleIndexSchemaVersion,
                    articles: [{
                        id: articleId,
                        title,
                        titleLocked: false,
                        createdAt: now,
                        updatedAt: now
                    }]
                });
                setCurrentArticleId(articleId);
                saveArticleIndexToStorage();
                saveCurrentArticleIdToStorage();
                return;
            }

            currentArticleId = getCurrentArticleId();
            if (!loadedArticleIndex.articles.some((article) => article.id === currentArticleId)) {
                setCurrentArticleId(loadedArticleIndex.articles[0].id);
                saveCurrentArticleIdToStorage();
            }

            saveArticleIndexToStorage();
        }

        function loadPersistedArticleState(articleId) {
            try {
                const raw = storage.getItem(getArticleStorageKey(articleId));
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
                : deps.createBlankPersistedState();
            const preservedContent = {};

            copyStyleContentKeys.forEach((key) => {
                if (Object.prototype.hasOwnProperty.call(nextState, key)) {
                    preservedContent[key] = nextState[key];
                }
            });

            copyStyleStateKeys.forEach((key) => {
                if (Object.prototype.hasOwnProperty.call(sourceState, key)) {
                    nextState[key] = sourceState[key];
                }
            });

            copyStyleContentKeys.forEach((key) => {
                if (Object.prototype.hasOwnProperty.call(preservedContent, key)) {
                    nextState[key] = preservedContent[key];
                }
            });

            if (Array.isArray(targetState && targetState.data) && Array.isArray(sourceState.data)) {
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

            nextState.schemaVersion = stateSchemaVersion;
            return nextState;
        }

        function updateCurrentArticleMetaFromState(state) {
            const article = getCurrentArticleMeta();
            if (!article) return;

            if (!article.titleLocked) {
                article.title = deps.getFallbackArticleTitle(state);
            }
            article.updatedAt = Date.now();
            saveArticleIndexToStorage();
        }

        function saveCurrentArticleState(state) {
            storage.setItem(getArticleStorageKey(getCurrentArticleId()), JSON.stringify(state));
            updateCurrentArticleMetaFromState(state);
        }

        function canSwitchArticle(articleId) {
            return Boolean(
                articleId
                && articleId !== getCurrentArticleId()
                && getArticleIndex().articles.some((article) => article.id === articleId)
            );
        }

        function switchArticle(articleId) {
            if (!canSwitchArticle(articleId)) return false;

            setCurrentArticleId(articleId);
            saveCurrentArticleIdToStorage();
            return true;
        }

        function createArticle() {
            const articleId = createArticleId();
            const now = Date.now();
            const index = getArticleIndex();

            index.articles.unshift({
                id: articleId,
                title: "未命名文章",
                titleLocked: false,
                createdAt: now,
                updatedAt: now
            });
            setCurrentArticleId(articleId);
            storage.setItem(getArticleStorageKey(articleId), JSON.stringify(deps.createBlankPersistedState()));
            saveArticleIndexToStorage();
            saveCurrentArticleIdToStorage();
            return articleId;
        }

        function duplicateArticle(sourceState, title) {
            const articleId = createArticleId();
            const now = Date.now();
            const index = getArticleIndex();

            index.articles.unshift({
                id: articleId,
                title,
                titleLocked: true,
                createdAt: now,
                updatedAt: now
            });
            setCurrentArticleId(articleId);
            storage.setItem(getArticleStorageKey(articleId), JSON.stringify(sourceState));
            saveArticleIndexToStorage();
            saveCurrentArticleIdToStorage();
            return articleId;
        }

        function renameCurrentArticle(title) {
            const article = getCurrentArticleMeta();
            if (!article) return false;

            article.title = title;
            article.titleLocked = true;
            article.updatedAt = Date.now();
            saveArticleIndexToStorage();
            return true;
        }

        function deleteCurrentArticle() {
            const index = getArticleIndex();
            if (index.articles.length <= 1) return false;

            const article = getCurrentArticleMeta();
            if (!article) return false;

            storage.removeItem(getArticleStorageKey(article.id));
            index.articles = index.articles.filter((item) => item.id !== article.id);
            setArticleIndex(index);
            setCurrentArticleId((index.articles[0] && index.articles[0].id) || "");
            saveArticleIndexToStorage();
            saveCurrentArticleIdToStorage();
            return true;
        }

        function copyStyleToArticles(targetIds, sourceState) {
            const currentArticleId = getCurrentArticleId();
            const normalizedTargetIds = Array.from(new Set((targetIds || [])
                .filter((articleId) => articleId && articleId !== currentArticleId)));
            const now = Date.now();
            let copiedCount = 0;

            normalizedTargetIds.forEach((articleId) => {
                const targetState = loadPersistedArticleState(articleId) || deps.createBlankPersistedState();
                const nextState = copyArticleStyleState(sourceState, targetState);
                storage.setItem(getArticleStorageKey(articleId), JSON.stringify(nextState));

                const article = getArticleIndex().articles.find((item) => item.id === articleId);
                if (article) {
                    article.updatedAt = now;
                }
                copiedCount += 1;
            });

            if (copiedCount) {
                saveArticleIndexToStorage();
            }

            return copiedCount;
        }

        return {
            createArticleId,
            getArticleStorageKey,
            normalizeArticleMeta,
            loadArticleIndexFromStorage,
            saveArticleIndexToStorage,
            saveCurrentArticleIdToStorage,
            getCurrentArticleMeta,
            initializeArticleWorkspace,
            loadPersistedArticleState,
            copyArticleStyleState,
            updateCurrentArticleMetaFromState,
            saveCurrentArticleState,
            canSwitchArticle,
            switchArticle,
            createArticle,
            duplicateArticle,
            renameCurrentArticle,
            deleteCurrentArticle,
            copyStyleToArticles
        };
    }

    window.ArticleWorkspace = {
        createArticleWorkspace
    };
})();
