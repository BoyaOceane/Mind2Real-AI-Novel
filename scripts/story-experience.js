// Story lifecycle: foreground text, independent auxiliary requests, recoverable drafts.
let activeGeneration = null;
let optionRequest = 0;
let profileRequest = 0;
let metadataRequest = 0;
let recoveryTimer = null;
const helperControllers = {};
const helperStates = { profile: '', metadata: '' };

function setHelperStatus(kind, message) {
    helperStates[kind] = message;
    document.getElementById('helperStatus').textContent = Object.values(helperStates).filter(Boolean).join(' · ');
    if (kind === 'metadata' && document.getElementById('memoryStatus')) renderState();
}

function helperSignal(kind) {
    helperControllers[kind]?.abort();
    helperControllers[kind] = new AbortController();
    return helperControllers[kind].signal;
}

function storyVersion() { return `${currentStory.storyId}:${currentStory.contentVersion || 0}`; }
function invalidateStoryTasks() {
    currentStory.contentVersion = (currentStory.contentVersion || 0) + 1;
    optionRequest++;
    profileRequest++;
    metadataRequest++;
    Object.values(helperControllers).forEach(controller => controller.abort());
    clearBranches();
    clearOptions();
    document.getElementById('btnRefresh').disabled = isLoading || !!currentStory.draft;
    setHelperStatus('profile', '');
    setHelperStatus('metadata', '');
}
function storageNotice(ok) {
    document.getElementById('saveStatus').classList.toggle('save-failed', !ok);
    document.getElementById('saveStatus').textContent = ok ? '已保存到本机' : '未能保存到本机，请先导出备份';
}
function writeLocal(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch { storageNotice(false); return false; }
}
function recoveryKey() { return `jimo_draft_${currentStory.storyId}`; }
function persistRecovery() {
    clearTimeout(recoveryTimer);
    recoveryTimer = null;
    return writeLocal(recoveryKey(), currentStory.draft || null);
}
function scheduleRecovery() {
    if (!recoveryTimer) recoveryTimer = setTimeout(() => { recoveryTimer = null; persistRecovery(); }, 250);
}
function updateLatestButton() {
    const area = document.querySelector('.story-content');
    document.getElementById('backToLatest').hidden = area.scrollHeight - area.scrollTop - area.clientHeight < 60;
}
function scrollLatest() {
    const area = document.querySelector('.story-content');
    area.scrollTo({ top: area.scrollHeight, behavior: 'instant' });
    updateLatestButton();
}
function toggleMobileSidebar() {
    const open = document.getElementById('storySidebar').classList.toggle('mobile-open');
    const button = document.getElementById('btnSidebar');
    button.setAttribute('aria-expanded', String(open));
    button.textContent = open ? '返回正文' : '辅助信息';
}
function initExperience() {
    const area = document.querySelector('.story-content');
    area.addEventListener('scroll', updateLatestButton);
    document.getElementById('backToLatest').onclick = scrollLatest;
    updateLatestButton();
    const input = document.getElementById('customInput');
    input.value = currentStory.pendingInput || '';
    input.addEventListener('input', () => { currentStory.pendingInput = input.value; saveStoryData(); });

    const resize = () => {
        if (window.visualViewport) document.body.style.height = `${window.visualViewport.height}px`;
        if (document.activeElement === input) {
            const bar = document.querySelector('.bottom-action-bar');
            bar.scrollTop = bar.scrollHeight;
        }
    };
    window.visualViewport?.addEventListener('resize', resize);
    resize();
    window.addEventListener('pagehide', () => { persistRecovery(); saveStoryData(); });
}
function renderDraft() {
    const draft = currentStory.draft;
    const panel = document.getElementById('draftPanel');
    panel.hidden = !draft;
    if (!draft) return;
    document.getElementById('draftText').textContent = draft.needsCanon ? '请在“更多 → 这本故事的后续方向”中补充原著信息并保存，再点“重新生成本段”。原行动和已有剧情已保留。' : draft.content || '尚未收到正文，原行动已保留。';
    document.getElementById('draftReason').textContent = draft.error || '未完成草稿';
    document.getElementById('acceptDraft').hidden = !draft.content?.trim();
    setLoadingState(false);
}
function showStreamText(text) {
    if (JimoFiction.canonQuestion(text) || ['原著确认：', '原著确认:'].some(prefix => prefix.startsWith(text.trim()))) return;
    let stream = document.getElementById('streamSegment');
    if (!stream) {
        stream = document.createElement('div');
        stream.id = 'streamSegment';
        stream.className = 'story-segment';
        document.getElementById('storyText').appendChild(stream);
    }
    stream.innerHTML = textToHtml(text);
    updateLatestButton();
}
function commitGeneration(draft, content, reasoning) {
    const question = JimoFiction.canonQuestion(content);
    if (question) {
        draft.needsCanon = true; draft.content = '';
        throw new Error('原著确认：' + question);
    }
    const raw = content;
    const body = stripStructuredMeta(raw);
    const displayText = cleanAiFlavor(body);
    if (!displayText.trim()) throw new Error('未收到有效正文，请重试');
    currentStory.history.push({
        id: draft.id, content: displayText, original: raw, rawOutput: raw,
        action: draft.action, systemAction: !draft.action, kind: draft.kind,
        reasoning: reasoning || undefined, timestamp: Date.now()
    });
    currentStory.draft = null;
    invalidateStoryTasks();
    updateConvertButton(); updateSkipQuizButton();
    displayFullStory();
    document.getElementById('draftPanel').hidden = true;
    persistRecovery();
    saveStoryData();
    autoSave();
    updateLatestButton();
}
function refreshStoryHelpers() { void extractMetadata(); }
async function runStoryGeneration(prompt, systemPrompt, action, kind, thinking, retry = null) {
    if (isLoading) return;
    if (!getApiConfig().apiKey) { showToast('请先填写 API Key'); toggleApiPanel(); return; }
    invalidateStoryTasks();
    const draft = retry || {
        id: crypto.randomUUID(), kind, action, prompt, systemPrompt, thinking,
        baseLength: currentStory.history.length, content: '', reasoning: ''
    };
    currentStory.draft = draft;
    draft.content = ''; draft.error = ''; draft.needsCanon = false;
    const input = document.getElementById('customInput');
    if (input.value.trim() === action) { input.value = ''; currentStory.pendingInput = ''; }
    persistRecovery(); saveStoryData();
    document.getElementById('draftPanel').hidden = true;
    if (!currentStory.history.length) displayFullStory();
    setLoadingState(true, '等待故事回应…');
    const controller = new AbortController();
    activeGeneration = { controller, draft };
    const started = performance.now();
    let first = null;
    const slow = setTimeout(() => {
        if (activeGeneration?.draft === draft && !draft.content) document.getElementById('storyStatus').textContent = '回应较慢，可以继续等待或停止';
    }, 10000);
    try {
        const result = await callDeepSeek(prompt, systemPrompt, text => {
            if (controller.signal.aborted) return;
            first ??= performance.now();
            draft.content = JimoFiction.canonQuestion(text) || ['原著确认：', '原著确认:'].some(prefix => prefix.startsWith(text.trim())) ? '' : text;
            document.getElementById('storyStatus').textContent = '正在写入正文…';
            showStreamText(text);
            scheduleRecovery();
        }, thinking, null, null, controller.signal);
        if (controller.signal.aborted) throw new DOMException('Stopped', 'AbortError');
        draft.reasoning = result.reasoning;
        commitGeneration(draft, result.content, result.reasoning);
        currentStory.lastTiming = { firstTextMs: first === null ? null : Math.round(first - started), bodyMs: Math.round(performance.now() - started) };
    } catch (error) {
        draft.error = error.name === 'AbortError' ? '已停止 · 未完成草稿' : error.name === 'TypeError' ? '网络连接异常，请检查网络后重试' : error.name === 'SyntaxError' ? '生成响应格式异常，已保留草稿' : (error.message || '网络异常，请重试');
        currentStory.draft = draft;
        persistRecovery(); saveStoryData();
        document.getElementById('streamSegment')?.remove();
        renderDraft();
    } finally {
        clearTimeout(slow);
        activeGeneration = null;
        setLoadingState(false);
    }
    if (!currentStory.draft) refreshStoryHelpers();
}
function retryDraft() {
    const draft = currentStory.draft;
    if (!draft || isLoading) return;
    if (draft.needsCanon) draft.prompt = readerPrompt(draft.action, draft.kind === 'opening');
    void runStoryGeneration(draft.prompt, draft.systemPrompt, draft.action, draft.kind, draft.thinking, draft);
}
function acceptDraft() {
    if (isLoading || !currentStory.draft?.content?.trim()) return;
    try {
        const draft = currentStory.draft;
        draft.acceptedPartial = true;
        commitGeneration(draft, draft.content, draft.reasoning);
        setLoadingState(false);
        refreshStoryHelpers();
    } catch (e) { showToast(e.message); renderDraft(); }
}
async function prepareOptions() {
    if (isLoading || currentStory.draft) return;
    const ticket = ++optionRequest, version = storyVersion();
    const signal = helperSignal('options');
    const panel = document.getElementById('branchPanel');
    panel.textContent = '正在准备选项，你也可以直接输入';
    panel.classList.add('active');
    document.getElementById('btnRefresh').disabled = true;
    const options = await generateOptions(signal);
    if (ticket !== optionRequest || version !== storyVersion()) return;
    document.getElementById('btnRefresh').disabled = false;
    if (!options.length) { panel.textContent = '选项暂未生成，可以重试或直接输入'; return; }
    currentOptions = options;
    renderOptions(options);
}
