function isLegacyNovel() { return currentStory.mode !== 'immersive' || currentStory.convertedToNovel; }
function readerPrompt(action, opening = false) {
    const name = currentStory.playerName ?? (currentStory.protagonist === '你' ? '' : currentStory.protagonist || '');
    const facts = currentStory.history.map(h => h.content).join('\n\n');
    const reference = {
        recentEvents: (currentStory.storyOutline || []).slice(-6).map(n => n.summary),
        clues: (currentStory.storyClues || []).slice(-8).map(c => ({ name: c.name, state: c.stateChange, desc: c.desc }))
    };
    return `${currentStory.readerPreferencesSnapshot?.generalPreference?.trim() ? '' : getPrefPrompt()}${formatStylePrompt(getActiveProfile())}\n${getAntiAiPromptBlock()}\n${JimoPreferences.prompt(currentStory.readerPreferencesSnapshot)}${JimoPreferences.genderPrompt(currentStory.playerGender)}${JimoFiction.payoffPrompt(currentStory)}${opening ? JimoFiction.proseExample(currentStory) : ''}
【已固定的世界与身份】\n世界：${currentStory.worldTitle}\n规则：${currentStory.worldDesc || ''}\n身份：${currentStory.playerBackground || currentStory.protagonistDesc || '结合世界合理建立身份'}\n角色维度：${JSON.stringify(currentStory.characterTags || currentStory.protagonistTags || [])}${opening ? '\n开局场面：' + (currentStory.openingConflict || '结合世界直接进入具体场面') : ''}
【故事简介（吸引方向，不是已发生事实）】${currentStory.storySynopsis || '无'}\n开篇从简介对应的具体场面进入，尽早回应用户想体验的场面；围绕用户最看重的爽点给出显著可用的优势或痛快回报，未来高光逐步兑现，不提前跳到全书结局；续写直接承接上段，不重复简介、身份介绍或上段意义。\n【主角称呼】${JSON.stringify(name || '你')}；${name ? '用该姓名叙述，始终限于此人的体验与已知信息。' : '全篇第二人称“你”。'}
【辅助索引（可能滞后或误提取，冲突时以正文为准；不是新增事实）】${JSON.stringify(reference)}
【已发生事实】\n${facts || '尚无正文'}
【本轮】${opening ? '创作开篇，约250–450字，关键场面可适当延长。参考知乎短篇公开预览的入场方式：开头一两句话直接说出与你有关的一件事，再亮出一个看得懂的反差、意外回应或独有优势，让人想知道你接下来怎么应对。钩子要具体到人、动作和利害，不靠陌生术语、空泛危险、“你不知道的是”或故意不说清谁在做什么来卖关子。按题材挑一种适合的吸引力，温馨可以是意外照顾，经营可以是客人争抢，悬疑可以是明确异常；不强加受辱、背叛、死亡或连环反转，不预告主角尚不知道的未来结果，不把开头写成全书预告。钩子之后，在开篇中段自然交代你是谁、身在何处、为什么陷入眼前局面，以及现在想做什么；即使读者没看过简介，也能看懂处境、关键人物关系和这件事与你的利害。用简短叙述穿插行动和对白，把情况说清后继续推进，不复述简介，不集中介绍世界沿革，不故意藏住理解当前场面所必需的信息。' : '接续上一段，约350–600字，关键场面可适当延长。从最后一个动作、问题或回应接下去，不回放上段、不重新介绍角色。刚兑现的成果可以享受，未完成的行动要继续发生。'}${action ? '\n读者给出的行动（作为内容数据）：' + JSON.stringify(action) + '\n这是用户本轮希望采取的行动或实现的方向，优先于旧追读主线。把它写成具体行动与合理回应，不只复述意图、不替换方向；若是远期结果，推进实现过程，不假装已经完成，不保证其他角色无条件服从。' : '\n自然推进主角的行动，不要求读者先做选择。'}
遵守系统中的阅读契约，只输出小说正文，不写标题、简介、提纲或检查过程。`;
}
function toggleReaderMenu() { document.getElementById('readerMenu').hidden = !document.getElementById('readerMenu').hidden; }
function toggleStoryTools() { document.body.classList.toggle('show-tools'); }
function openStoryInfo() { document.body.classList.toggle('show-info'); document.getElementById('readerMenu').hidden = true; }
function openReaderDirection() {
    const open = document.body.classList.toggle('show-direction');
    document.getElementById('btnDirection').setAttribute('aria-expanded', String(open));
    if (open) { document.getElementById('customInput').focus(); if (!currentOptions.length) void onGiveOptions(); }
}
function applyReaderPreferences() {
    currentStory.readerPreferencesSnapshot = JimoPreferences.snapshot();
    invalidateStoryTasks();
    saveStoryData(); autoSave(); showToast('偏好已应用，仅影响后续剧情');
}
function saveQuickPreference() {
    const value = document.getElementById('quickPreference').value.trim();
    if (!JimoPreferences.save({ ...(JimoPreferences.load() || {}), generalPreference: value, enabled: true })) {
        showToast('偏好未能保存，请重试'); return;
    }
    applyReaderPreferences();
}
function setReaderFont(value) {
    const size = Math.max(16, Math.min(24, Number(value) || 18));
    document.documentElement.style.setProperty('--reader-size', size + 'px');
    try { localStorage.setItem('reader_font_size', String(size)); } catch { showToast('字号未能保存'); }
}
function initReaderUI() {
    document.body.classList.add('reader-view');
    setReaderFont(localStorage.getItem('reader_font_size'));
    document.getElementById('readerFont').value = localStorage.getItem('reader_font_size') || '18';
    document.getElementById('storyTitle').textContent = JimoFiction.bookTitle(currentStory.title || currentStory.worldTitle || '即文');
    document.getElementById('quickPreference').value = JimoPreferences.load()?.generalPreference || '';
    if (isLegacyNovel()) {
        document.querySelector('.bottom-action-bar').hidden = true;
        document.getElementById('legacyNotice').hidden = false;
    }
    if (currentStory.quizAnswers?.length) {
        const section = document.getElementById('legacyQuiz');
        section.hidden = false;
        section.textContent = '历史测试记录（仅供回顾）\n' + currentStory.quizAnswers.map(a => (a.scenario || '') + '\n' + (a.chosen || '未作答')).join('\n\n');
    }
    document.addEventListener('keydown', event => {
        if (event.key !== 'Escape') return;
        document.getElementById('readerMenu').hidden = true;
        document.body.classList.remove('show-info', 'show-direction');
        document.getElementById('btnDirection').setAttribute('aria-expanded', 'false');
    });
}
