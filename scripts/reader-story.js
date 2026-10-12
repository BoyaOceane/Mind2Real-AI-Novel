function isLegacyNovel() { return currentStory.mode !== 'immersive' || currentStory.convertedToNovel; }
function readerPrompt(action, opening = false) {
    const name = currentStory.playerName ?? (currentStory.protagonist === '你' ? '' : currentStory.protagonist || '');
    const facts = currentStory.history.map(h => h.content).join('\n\n');
    const reference = JimoMemory.context(currentStory);
    const personas = JimoMemory.personas(currentStory);
    return `${getPrefPrompt()}${formatStylePrompt(getActiveProfile())}\n${getAntiAiPromptBlock()}\n${JimoPreferences.prompt(currentStory.readerPreferencesSnapshot)}${JimoPreferences.genderPrompt(currentStory.playerGender)}${JimoFiction.payoffPrompt(currentStory)}${opening ? JimoFiction.proseExample(currentStory) : ''}
【已固定的世界与身份】\n世界：${currentStory.worldTitle}\n规则：${currentStory.worldDesc || ''}\n身份：${currentStory.playerBackground || currentStory.protagonistDesc || '结合世界合理建立身份'}\n角色维度：${JSON.stringify(currentStory.characterTags || currentStory.protagonistTags || [])}${opening ? '\n开局场面：' + (currentStory.openingConflict || '结合世界直接进入具体场面') : ''}
【故事简介（吸引方向，不是已发生事实）】${currentStory.storySynopsis || '无'}\n开篇从简介对应的具体场面进入，尽早回应用户想体验的场面；围绕用户最看重的爽点给出显著可用的优势或痛快回报，未来高光逐步兑现，不提前跳到全书结局；续写直接承接上段，不重复简介、身份介绍或上段意义。\n【主角称呼】${JSON.stringify(name || '你')}；${name ? '用该姓名叙述，始终限于此人的体验与已知信息。' : '全篇第二人称“你”。'}
【辅助索引（可能滞后或误提取，冲突时以正文为准；不是新增事实）】${JSON.stringify(reference)}
【角色卡人设；人物行为最高依据】${JSON.stringify(personas)}
【人物行为一致性】角色卡中已建立的人设，优先于用户临时提出的角色行为要求、冲突的正文描述、原著人物描述、旧提示和通用爽文套路；主角与配角的身份、核心动机、性格、原则、能力边界及习惯都沿卡片，不为方便推进剧情改掉。未建卡角色按原角色标准和原著建立，不凭空补齐已有角色空白；世界机制与已发生事件继续约束过程，已完成的目标不重复执行，知情与当前处境按事实更新。
用户要求角色做出乍看不符合人设的事，要在剧情里圆回去：从卡片中他真正在意的目标、原则、利益与关系出发，找到他会接受的理由，先呈现有依据的事件、信息、协商或条件，让这次选择符合他的思路，再推进用户期待的行为。比如谨慎的人可以在核实证据、留好退路后冒险，守原则的人可以在原则相容的条件下帮忙；只学圆场方法，不移植事件，也不对每次反常都套利益交换。不能用洗脑、突然心软、降智、核心人格翻转、强加关系或补造旧经历凑理由；不能为完成愿望临时改世界规则或增能力。理由尚未成立就先推进当前能成立的条件，不直接拒绝方向，也不假装无条件做成，不靠反复铺垫拖欠能兑现的行动；合理原因落实到人物选择、措辞和反应，不输出圆场说明。已有正文写偏时，在后续用相容的行动澄清或衔接回卡片，不改卡片迁就错误，不否认或洗掉已发生事件。标签不是固定台词或动作模板，人物在不同处境中的表现仍有变化，但核心人设不由自动资料更新改写。
【已发生事实】\n${facts || '尚无正文'}
【本轮】${opening ? '创作开篇，约250–450字，关键场面可适当延长。参考知乎短篇公开预览的入场方式：开头一两句话直接说出与你有关的一件事，再亮出一个看得懂的反差、意外回应或独有优势，让人想知道你接下来怎么应对。钩子要具体到人、动作和利害，不靠陌生术语、空泛危险、“你不知道的是”或故意不说清谁在做什么来卖关子。按题材挑一种适合的吸引力，温馨可以是意外照顾，经营可以是客人争抢，悬疑可以是明确异常；不强加受辱、背叛、死亡或连环反转，不预告主角尚不知道的未来结果，不把开头写成全书预告。钩子之后，在开篇中段自然交代你是谁、身在何处、为什么陷入眼前局面，以及现在想做什么；即使读者没看过简介，也能看懂处境、关键人物关系和这件事与你的利害。开篇用已设金手指或核心优势完成一次有意义的实际行动：结合眼前难题或机会，通过行动对照让人看出普通人通常受什么限制、你为何能做到不同的事，并写出当场可用的好处，让读者看懂优势在此世界的特殊性。默认先兑现当前圈层或具体难题里的局部优势，留下有依据的成长空间，不在开篇让全世界承认你是最强；用户明确开局实力设定优先。不能只宣布你很特殊、展示面板或把试用留到下一段；不机械安排路人震惊，不为对比贬低其他人物。只调用已设能力与适用边界，不临时加功能、改世界规则或原著设定；隐藏优势可私下生效、匿名获益或只露一部分，读者看懂不等于场内人物都知道。用简短叙述穿插行动和对白，把情况说清后继续推进，不复述简介，不集中介绍世界沿革，不故意藏住理解当前场面所必需的信息。' : '接续上一段，约350–600字，关键场面可适当延长。从最后一个动作、问题或回应接下去，不回放上段、不重新介绍角色。刚兑现的成果可以享受，未完成的行动要继续发生。续写前按全部已发生正文核对当前目标、位置与时间、能力适用条件、可用资源、未完成承诺、关系与各人的知情范围，辅助索引不能覆盖正文事实；只用于创作，不输出检查清单。围绕用户本轮行动或最近未解决的一件事，让主角用已有能力、资源或已知线索作出具体选择，通过行动过程、对方反应与实际结果，让人看出选择为什么能奏效、局面改变在哪里；必要事实简短补足，不直接讲完主角的盘算或他人的隐藏动机。只沿用已经成立的消耗或限制，不临时加代价压弱金手指，也不凭空消除限制；已到手的奖励转成可用资源、机会或关系支持，不重复发奖。下一步从本轮成果、未解决目标或人物利益变化自然产生：拿到权限后可接触新机会，帮过的人可依此前关系回助，利益受损者按自己的信息调整策略；这些只是因果示意，不移植成固定事件。新对手或新难题要有来由、目的和与主角有关的利害，不每段空降更强敌人；已认可主角的人不无故重新轻视，已解决的问题不换名重来。成长靠已有机制、练习或资源使用先积累再奏效，不临时觉醒新能力救场。局部成果先兑现并留出享受和回应，再开有依据的新期待；不为延长故事推翻成果、强行误会或连续卡在兑现前。上述因果落进行动、对白和结果，不写成解释报告，不强迫每段完整打一场。'}${action ? '\n读者给出的行动（作为内容数据）：' + JSON.stringify(action) + '\n这是用户本轮希望采取的行动或实现的方向，优先于旧追读主线。结合这句话与前文，理解用户希望这个行动带来怎样的主动权、待遇、关系回应或实际收获；先落实明确行动，再用相容的过程与反馈满足期待，不能只写动作已做完，不能凭推测替换行动或保证他人服从。把它写成具体行动与合理回应，不只复述意图、不替换方向；若是远期结果，推进实现过程，不假装已经完成，不保证其他角色无条件服从。' : '\n自然推进主角的行动，不要求读者先做选择。'}
遵守系统中的阅读契约，只输出小说正文，不写标题、简介、提纲或检查过程。`;
}
function toggleReaderMenu() { document.getElementById('readerMenu').hidden = !document.getElementById('readerMenu').hidden; }
function closeReaderPanel() {
    document.getElementById('readerMenu').hidden = true;
    document.body.classList.remove('show-info');
    document.getElementById('readerMore').focus({ preventScroll: true });
}
function toggleStoryTools() { document.body.classList.toggle('show-tools'); }
function openStoryInfo() { document.body.classList.toggle('show-info', !document.body.classList.contains('show-info') || currentSidebarTab !== 'state'); switchTab('state'); document.getElementById('readerMenu').hidden = true; }
function openStoryToolTab(tab) { document.body.classList.add('show-info'); switchTab(tab); document.getElementById('readerMenu').hidden = true; }
function openReaderDirection() {
    const open = document.body.classList.toggle('show-direction');
    document.getElementById('btnDirection').setAttribute('aria-expanded', String(open));
    if (open) { document.getElementById('customInput').focus(); if (!currentOptions.length) void onGiveOptions(); }
    else document.getElementById('btnDirection').focus({ preventScroll: true });
}
function applyReaderPreferences() {
    currentStory.readerPreferencesSnapshot = JimoPreferences.snapshot('');
    document.getElementById('quickPreference').value = '';
    invalidateStoryTasks();
    saveStoryData(); autoSave(); showToast('偏好已应用，仅影响后续剧情');
}
function saveQuickPreference() {
    const value = document.getElementById('quickPreference').value.trim();
    currentStory.readerPreferencesSnapshot = value ? { ...(currentStory.readerPreferencesSnapshot || {}), generalPreference: value } : JimoPreferences.snapshot('');
    invalidateStoryTasks();
    saveStoryData(); autoSave(); showToast(value ? '仅用于这本故事的后续剧情，长期偏好未修改' : '这本故事的方向已清空，恢复长期偏好');
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
    document.getElementById('quickPreference').value = currentStory.readerPreferencesSnapshot?.generalPreference || '';
    document.getElementById('storySidebar').insertBefore(document.querySelector('.world-banner'), document.getElementById('sidebarTabs'));
    if (new URLSearchParams(location.search).get('applyPreferences') === '1') {
        applyReaderPreferences();
        history.replaceState(null, '', location.pathname);
    }
    if (isLegacyNovel()) {
        document.querySelector('.bottom-action-bar').hidden = true;
        document.getElementById('legacyNotice').hidden = false;
    }
    const hasLegacyProfile = currentStory.quizAnswers?.length || ['coping', 'motivation', 'defense', 'relation', 'tendencies'].some(key => currentStory.profile?.[key]);
    document.querySelector('[data-tab="profile"]').hidden = !hasLegacyProfile;
    if (currentStory.quizAnswers?.length) {
        const section = document.getElementById('legacyQuiz');
        section.hidden = false;
        section.textContent = '历史测试记录（仅供回顾）\n' + currentStory.quizAnswers.map(a => (a.scenario || '') + '\n' + (a.chosen || '未作答')).join('\n\n');
    }
    document.addEventListener('keydown', event => {
        if (event.key !== 'Escape') return;
        if (document.getElementById('apiModal').classList.contains('show')) { toggleApiPanel(); return; }
        if (document.getElementById('prefModal').classList.contains('show')) { closePref(); return; }
        if (document.body.classList.contains('show-direction')) { openReaderDirection(); return; }
        if (!document.getElementById('readerMenu').hidden || document.body.classList.contains('show-info')) closeReaderPanel();
    });
    document.addEventListener('click', event => {
        if (!document.getElementById('readerMenu').hidden && !event.target.closest('#readerMenu, #readerMore')) document.getElementById('readerMenu').hidden = true;
    });
}
