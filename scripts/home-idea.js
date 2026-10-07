// Homepage story ideas reuse the reader preference fields; editing never requests a model.
(() => {
    const draftKey = 'reader_story_draft_v1';
    let stored = JimoPreferences.load();
    let saved = stored;
    try {
        const draft = JSON.parse(localStorage.getItem(draftKey));
        if (draft && draft.baseUpdatedAt === (stored?.updatedAt || 0)) saved = draft;
    } catch { /* An unreadable draft does not hide saved preferences. */ }
    const form = document.getElementById('storyIdeaForm');
    const status = document.getElementById('storyIdeaStatus');
    const mainline = document.getElementById('generalPreference');
    mainline.value = saved?.generalPreference || '';
    if (saved !== stored) status.textContent = '已恢复未应用的想法。点“生成简介”，更新左侧故事。';
    function changed() {
        status.textContent = '想法已修改。点“生成简介”，更新左侧故事。';
        try { localStorage.setItem(draftKey, JSON.stringify({ generalPreference: mainline.value.trim(), baseUpdatedAt: stored?.updatedAt || 0 })); }
        catch { status.textContent = '草稿未能保存到本机，请勿刷新；仍可尝试生成。'; }
    }
    mainline.addEventListener('input', changed);
    function clearIdea() {
        const latest = JimoPreferences.load();
        if (!JimoPreferences.save({ ...(latest || {}), generalPreference: '', storyEnabled: true, enabled: latest?.enabled ?? true })) {
            status.textContent = '旧想法未能清除，请检查本机存储后重试。'; return;
        }
        mainline.value = ''; stored = JimoPreferences.load(); localStorage.removeItem(draftKey);
        if (opening?.readerPreferencesSnapshot?.generalPreference) {
            ++openingTicket; openingTask?.abort(); openingTask = null; enterWhenReady = false;
            opening.ready = false; opening.resume = true; opening.rules = ''; saveOpening();
            showOpening('旧想法已停用。生成新简介或点击进入，将按阅读偏好准备新故事。');
        }
        status.textContent = '想法已清空并停用，后续生成恢复阅读偏好。';
    }
    mainline.addEventListener('input', () => { if (!mainline.value.trim()) clearIdea(); });
    document.getElementById('clearStoryIdea').addEventListener('click', clearIdea);
    form.addEventListener('submit', async event => {
        event.preventDefault();
        const button = document.getElementById('generateStoryIdea');
        if (button.disabled) return;
        const latest = JimoPreferences.load();
        const submittedIdea = mainline.value.trim();
        if (!JimoPreferences.save({ ...(latest || {}), generalPreference: submittedIdea, storyEnabled: true, enabled: latest?.enabled ?? true })) {
            status.textContent = '想法未能保存，请检查本机存储后重试。'; return;
        }
        localStorage.removeItem(draftKey);
        stored = JimoPreferences.load();
        button.disabled = true; button.textContent = '正在生成…';
        status.textContent = '正在把你的想法变成简介…';
        try {
            const generated = await rollWorld();
            if (JimoPreferences.load()?.generalPreference !== submittedIdea || mainline.value.trim() !== submittedIdea) return;
            status.textContent = generated ? '想法已应用。看看左侧简介，喜欢就进入故事。' : '想法已保存；生成情况见左侧提示。';
        } finally { button.disabled = false; button.textContent = '生成简介'; }
    });
})();
