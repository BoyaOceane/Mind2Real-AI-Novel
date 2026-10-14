// Reuse the existing world dimensions, character dimensions, archive and API configuration.
const openingKey = 'pending_immersive_opening_v1';
let opening = null, openingTask = null, openingTicket = 0, entering = false, enterWhenReady = false;

function openingField(text, name) {
    return (text.match(new RegExp('^' + name + '[：:]\\s*([\\s\\S]*?)(?=^(?:小说名称|剧情简介|世界名称|底层逻辑|身份背景|起始冲突|追读主线)[：:]|(?![\\s\\S]))', 'm'))?.[1] || '').trim();
}

function showSynopsis(text) {
    const host = document.getElementById('openingHook');
    host.replaceChildren();
    const tagLine = text.match(/^【([^】\n]+)】[ \t]*(?:\n|$)/);
    if (tagLine) {
        const tags = document.createElement('div'); tags.className = 'opening-selling-tags';
        tagLine[1].split(/[+＋·、|｜]/).map(tag => tag.trim()).filter(Boolean).slice(0, 4).forEach(tag => {
            const chip = document.createElement('span'); chip.textContent = tag; tags.append(chip);
        });
        host.append(tags, document.createTextNode('\n'));
    }
    const body = tagLine ? text.slice(tagLine[0].length).trim() : text;
    const paragraphs = body.split(/\n\s*\n|\n/).map(line => line.trim()).filter(Boolean).flatMap(line => {
        if (line.length <= 42) return [line];
        const beats = [];
        let beat = '', quoted = false;
        for (const character of line) {
            if (character === '“') quoted = true;
            if (character === '”') quoted = false;
            beat += character;
            if (!quoted && (/[。！？]/.test(character) || /[。！？]”$/.test(beat))) {
                beats.push(beat.trim()); beat = '';
            }
        }
        if (beat.trim()) beats.push(beat.trim());
        return beats;
    });
    paragraphs.forEach((line, i) => {
        const paragraph = document.createElement('p'); paragraph.textContent = line;
        if (i === 0) paragraph.classList.add('opening-punchline');
        if (i === paragraphs.length - 1 && i > 0) paragraph.classList.add('opening-cliffhanger');
        host.append(paragraph, document.createTextNode('\n\n'));
    });
}

function sampleDimensions(dimensions) {
    const keys = Object.keys(dimensions);
    for (let i = keys.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [keys[i], keys[j]] = [keys[j], keys[i]];
    }
    return Object.fromEntries(keys.slice(0, 3).map(k => [k, dimensions[k][Math.floor(Math.random() * dimensions[k].length)]]));
}
function saveOpening() {
    try { localStorage.setItem(openingKey, JSON.stringify(opening)); return true; }
    catch { showToast('开局未能保存到本机，请勿刷新'); return false; }
}
function showOpening(message = '') {
    const needsKey = !getApiConfig().apiKey;
    document.getElementById('openingBookTitle').textContent = (opening.storyTitle || opening.ready) ? JimoFiction.bookTitle(opening.storyTitle || opening.title) : opening.synopsis ? '书名尚未生成' : needsKey ? '你的故事，从这里开始' : '正在准备你的小说名…';
    document.getElementById('openingTags').textContent = Object.values(opening.tags).join(' · ');
    document.getElementById('openingTitle').textContent = opening.title || '你的下一个故事';
    showSynopsis(opening.synopsis || [opening.background, opening.conflict].filter(Boolean).join('\n\n') || (needsKey ? '先设置 API Key，再为你生成故事简介。也可以先写下想看的剧情。' : '正在准备你的故事简介…'));
    document.getElementById('openingDetails').textContent = [opening.rules, opening.background].filter(Boolean).join('\n\n');
    document.getElementById('openingStatus').textContent = message || (opening.ready ? '故事已准备好' : '正在准备故事简介…');
    document.getElementById('enterWorld').textContent = needsKey ? '设置 API Key，开始故事' : enterWhenReady ? '准备完成后进入 · 点击取消' : '开始阅读';
    document.getElementById('setupHint').hidden = true;
    document.getElementById('generateStoryIdea').textContent = needsKey ? '设置后生成简介' : '生成简介';
    document.getElementById('preferenceHint').textContent = needsKey ? '设置完成后即可开始，也可以先在右侧写下剧情想法' : JimoPreferences.prompt(opening.readerPreferencesSnapshot) ? '已使用这次剧情想法与阅读偏好' : '可以直接开始，也可以在右侧写下这次想看的剧情';
    document.getElementById('firstReadHint').hidden = !opening.ready || !!localStorage.getItem('current_story_session');
}
async function rollWorld(useCurrentIdea = false, previewOnly = false) {
    if (useCurrentIdea && !JimoHomeIdea.apply()) return false;
    globalThis.JimoGuide?.openingChanged(false);
    JimoSetup.clearHome();
    entering = false;
    enterWhenReady = false;
    const previous = opening?.ready ? structuredClone(opening) : null;
    openingTask?.abort();
    const ticket = ++openingTicket;
    const controller = new AbortController();
    openingTask = controller;
    let preview = {};
    const restored = !useCurrentIdea && opening && !opening.ready && !opening.rules && opening.resume;
    if (restored) opening.readerPreferencesSnapshot = JimoPreferences.snapshot();
    if (!restored) opening = {
        version: 1, tags: sampleDimensions(worldDims), playerGender: JimoPreferences.playerGender(), readerPreferencesSnapshot: JimoPreferences.snapshot(),
        characterTags: sampleDimensions(Math.random() < 0.5 ? protagonistChineseDims : protagonistWesternDims),
        title: '', storyTitle: '', synopsis: '', rules: '', background: '', conflict: '', ready: false
    };
    opening.synopsisFormatVersion = 21;
    delete opening.resume;
    saveOpening();
    showOpening();
    if (!getApiConfig().apiKey || previewOnly) {
        openingTask = null;
        opening.resume = true;
        saveOpening();
        showOpening(previewOnly ? '写下想法或留空随机，点“生成简介”开始。' : '标签已随机好。设置 API Key 后继续准备背景。');
        return;
    }
    const prompt = `世界标签：${JSON.stringify(opening.tags)}\n以上标签仅作随机灵感，先选定一个核心体验，只用相容的维度补足世界；冲突或无关的标签可舍弃，以读者期待为先，不强行融合全部标签。\n虚构角色创作维度：${JSON.stringify(opening.characterTags)}\n${getPrefPrompt()}\n${JimoPreferences.prompt(opening.readerPreferencesSnapshot)}${JimoPreferences.genderPrompt(opening.playerGender)}\n根据以上组合推演自洽世界与沉浸主角背景。不要生成主角姓名，用“你”。身份与规则支撑简介里的优势和回报，使用白话，不堆设定术语。\n${JimoFiction.synopsisGuide(opening)}`;
    let timeoutId, timedOut = false;
    const waitForResponse = delay => { clearTimeout(timeoutId); timeoutId = setTimeout(() => { timedOut = true; controller.abort(); }, delay); };
    try {
        waitForResponse(45000);
        const config = getApiConfig();
        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + config.apiKey },
            body: JSON.stringify({ model: config.model, stream: true, thinking: { type: 'disabled' }, messages: [
                { role: 'system', content: JimoFiction.worldSystem() }, { role: 'user', content: prompt }
            ] }), signal: controller.signal
        });
        const result = await JimoStream.read(response, text => {
            waitForResponse(30000);
            if (ticket !== openingTicket) return;
            const storyTitle = openingField(text, '小说名称');
            if (storyTitle) document.getElementById('openingBookTitle').textContent = JimoFiction.bookTitle(storyTitle);
            const synopsis = openingField(text, '剧情简介');
            if (synopsis) showSynopsis(synopsis);
            const title = openingField(text, '世界名称');
            if (title) document.getElementById('openingTitle').textContent = title;
            preview = { storyTitle, synopsis, title };
            document.getElementById('openingStatus').textContent = '故事简介正在生成…';
        });
        if (ticket !== openingTicket || controller.signal.aborted) return;
        JimoSetup.connected(config);
        const question = JimoFiction.canonQuestion(result.content);
        if (question) { const error = new Error(question); error.name = 'CanonQuestion'; throw error; }
        const field = name => openingField(result.content, name);
        const values = { storyTitle: field('小说名称'), synopsis: field('剧情简介'), title: field('世界名称'), rules: field('底层逻辑'), background: field('身份背景'), conflict: field('起始冲突') };
        if (Object.values(values).some(v => !v)) throw new Error('背景格式不完整，请重试');
        Object.assign(opening, values, { storyPromise: field('追读主线'), ready: true });
        globalThis.JimoGuide?.openingChanged(true);
        const record = addWorldRecord({ title: opening.title, storyTitle: opening.storyTitle, synopsis: opening.synopsis, content: opening.rules, tags: Object.values(opening.tags),
            playerBackground: opening.background, openingConflict: opening.conflict, storyPromise: opening.storyPromise, characterTags: opening.characterTags, prompt });
        opening.worldId = record.saved ? record.id : null;
        const saved = saveOpening();
        showOpening(saved && record.saved ? '' : '世界已准备好，但未保存到本机，请先导出备份');
        if (enterWhenReady) startCreating();
        return true;
    } catch (error) {
        if (ticket !== openingTicket || (error.name === 'AbortError' && !timedOut)) return;
        if (timedOut) error = Object.assign(new Error(), { name: 'TimeoutError' });
        JimoSetup.problem(error);
        const retainedPreview = !!preview.synopsis;
        if (retainedPreview) Object.assign(opening, preview, { ready: false, resume: true, rules: '', error: error.message });
        else if (previous) opening = previous;
        else { opening.resume = true; opening.error = error.message; }
        enterWhenReady = false;
        saveOpening();
        showOpening(JimoSetup.message(error) + (retainedPreview ? '；已保留新简介，背景尚未完成，请重试生成后再开始阅读' : error.name === 'CanonQuestion' ? '；请在剧情想法里补充后，再生成简介' + (previous ? '；已保留上一个世界' : '') : previous ? '；已保留上一个世界' : '；可点击重试生成'));
        return false;
    } finally { clearTimeout(timeoutId); if (ticket === openingTicket) openingTask = null; }
}
function startCreating() {
    if (entering) return;
    if (!opening.ready) {
        if (!getApiConfig().apiKey) { openApi(); return; }
        if (openingTask) { enterWhenReady = !enterWhenReady; showOpening(); }
        else { enterWhenReady = true; opening.resume = true; void rollWorld().then(() => { if (opening?.ready) startCreating(); }); }
        return;
    }
    const playerName = JimoPreferences.playerName();
    const session = {
        schemaVersion: 3, experienceVersion: 1, storyId: crypto.randomUUID(), contentVersion: 0,
        mode: 'immersive', quiz: false, playerName, playerGender: opening.playerGender ?? JimoPreferences.playerGender(), playerBackground: opening.background,
        openingConflict: opening.conflict, storySynopsis: opening.synopsis || '', storyPromise: opening.storyPromise || '', characterTags: opening.characterTags,
        title: opening.storyTitle || opening.title, worldTitle: opening.title, worldDesc: opening.rules, worldTags: Object.values(opening.tags), worldId: opening.worldId || null,
        protagonist: playerName || '你', protagonistDesc: opening.background, protagonistTags: Object.values(opening.characterTags || {}),
        narrative: '限知沉浸 · 短篇节拍', readerPreferencesSnapshot: opening.readerPreferencesSnapshot ?? JimoPreferences.snapshot(),
        history: [], storyOutline: [], storyClues: [], characterCards: [], characterRelations: [],
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
    };
    try {
        localStorage.setItem('current_story_session', JSON.stringify(session));
        // Keep a consumed marker so returning home prepares a new candidate.
        localStorage.setItem(openingKey, JSON.stringify({ ...opening, consumed: true }));
        entering = true;
        window.location.href = 'story.html';
    } catch { showToast('未能保存开局，请先导出备份再重试'); }
}
function useArchivedWorld(record) {
    ++openingTicket; openingTask?.abort(); openingTask = null; enterWhenReady = false;
    opening = { version: 1, ready: true, archived: true, title: record.title, storyTitle: record.storyTitle || '', rules: record.content,
        tags: Object.fromEntries((record.tags || []).map((v, i) => ['tag' + i, v])),
        synopsis: record.synopsis || '', storyPromise: record.storyPromise || '', background: record.playerBackground || '', conflict: record.openingConflict || '',
        characterTags: record.characterTags || sampleDimensions(protagonistChineseDims), worldId: record.id };
    saveOpening(); showOpening(); closeHistory();
}
function continueLastReading() {
    ++openingTicket; openingTask?.abort(); openingTask = null;
    const session = document.getElementById('resumeStory').dataset.storyId;
    if (session) loadHistoryItem('story', session, 0);
    else window.location.href = 'story.html';
}
function initReaderHome() {
    try {
        const value = JSON.parse(localStorage.getItem(openingKey));
        if (value?.version === 1 && value.tags && !value.consumed) opening = value;
    } catch { document.getElementById('openingStatus').textContent = '上次候选无法读取，将重新准备；书架不受影响。'; }
    if (opening?.ready && !opening.archived && (!opening.storyTitle || !opening.synopsis || opening.synopsisFormatVersion !== 21)) opening = null;
    if (opening && !opening.archived && (opening.playerGender || '') !== JimoPreferences.playerGender()) opening = null;
    if (opening && !opening.archived && JimoPreferences.prompt(opening.readerPreferencesSnapshot) !== JimoPreferences.prompt(JimoPreferences.snapshot())) opening = null;
    document.getElementById('preferenceHint').textContent = JimoPreferences.prompt(JimoPreferences.snapshot()) ? '已使用你保存的剧情想法与阅读偏好' : '可以直接进入，也可以在右侧写下这次想看的剧情';
    try {
        const current = JSON.parse(localStorage.getItem('current_story_session'));
        const stories = JSON.parse(localStorage.getItem('story_history') || '[]');
        const last = current?.mode === 'immersive' && (current.history?.length || current.draft) ? current : stories.find(s => s.mode === 'immersive');
        if (last) {
            const button = document.getElementById('resumeStory');
            button.hidden = false; button.textContent = '继续上次阅读 · ' + JimoFiction.bookTitle(last.title || last.worldTitle);
            button.dataset.storyId = last === current ? '' : last.id;
        }
    } catch { showToast('部分历史记录无法读取，请从书架检查或导出备份'); }
    if (opening?.ready) showOpening();
    else { if (opening) opening.resume = true; void rollWorld(false, ['api', 'idea', 'ready'].includes(localStorage.getItem('reader_walkthrough_v1'))); }
    window.addEventListener('pagehide', () => { ++openingTicket; openingTask?.abort(); });
}
initReaderHome();
