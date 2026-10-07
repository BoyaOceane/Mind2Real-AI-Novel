// Optional, local self-reported preferences; never infer a reader from fictional actions.
window.JimoPreferences = (() => {
    const key = 'reader_preferences_v1';
    const tagGroups = [
        ['作品类型', ['都市', '玄幻', '仙侠修真', '武侠', '科幻', '奇幻', '悬疑', '推理', '历史', '游戏', '电竞']],
        ['时代与背景', ['近代现代', '古色古香', '架空历史', '幻想未来', '星际', '西幻', '校园', '末世', '年代', '豪门世家', '娱乐圈', '古风', '架空']],
        ['感情方向', ['言情', '纯爱', '百合', '无CP']],
        ['角色与人设', ['马甲', '大佬', '龙傲天', '女强', '强强', '天才', '学霸', '万人迷', '美强惨', '普通人成长', '扮猪吃虎', '真假千金', '反派主角']],
        ['情节与关系', ['甜宠', '甜文', '团宠', '先婚后爱', '青梅竹马', '欢喜冤家', '破镜重圆', '情有独钟', '暗恋', '相爱相杀', '宿敌变恋人', '救赎', '虐恋情深', '追妻火葬场', '冒险', '逆袭', '成长', '群像', '打脸', '复仇', '虐渣', '宫斗宅斗']],
        ['设定与机制', ['系统', '重生', '穿越', '穿书', '快穿', '无限流', '异能', '读心', '随身空间', '金手指', '无敌', '升级流']],
        ['风格与口味', ['爽文', '轻松', '正剧', '治愈', '日常', '轻松日常', '搞笑', '热血']],
        ['生活与事业', ['种田文', '经商', '基建', '美食', '神豪', '囤货', '养崽', '萌宝', '商战', '直播']]
    ];
    const tags = tagGroups.flatMap(([, choices]) => choices);
    // Keep saved choices when adopting common platform names.
    const tagAliases = { '修仙': '仙侠修真', '双强': '强强', '虐恋': '虐恋情深', '空间': '随身空间', '无敌流': '无敌', '种田': '种田文' };
    function normalizeTags(values = []) {
        const mapped = (values || []).map(tag => tagAliases[tag] || tag);
        return tags.filter(tag => mapped.includes(tag));
    }
    function matchTags(description, exclusions = '') {
        const wanted = new Set(), unwanted = new Set();
        const words = [...tags.map(tag => [tag, tag]), ...Object.entries(tagAliases)];
        for (const [text, excludeAll] of [[description, false], [exclusions, true]]) {
            for (const clause of text.split(/[，,。；;！？!?\n]|但是|不过|但|而是|而且/)) {
                for (const [word, tag] of words) {
                    const position = clause.toLowerCase().indexOf(word.toLowerCase());
                    if (position < 0) continue;
                    const before = clause.slice(0, position);
                    const negative = [...before.matchAll(/不要|不想(?:看|要)?|不喜欢|避免|排除|拒绝|别(?:写|加|来|安排)|不是|不(?:写|要|看|加)|不带|不含/g)].at(-1)?.index ?? -1;
                    const positive = [...before.matchAll(/想看|想要|喜欢|希望|而要/g)].filter(match => match.index === 0 || before[match.index - 1] !== '不').at(-1)?.index ?? -1;
                    (excludeAll || negative > positive ? unwanted : wanted).add(tag);
                }
            }
        }
        return { tags: tags.filter(tag => wanted.has(tag) && !unwanted.has(tag)), excludedTags: tags.filter(tag => unwanted.has(tag)) };
    }
    const questions = [
        ['最期待得到什么？', ['被认可', '掌握主动权', '自由', '守护与连接']],
        ['遇到不公平，你期待怎样应对？', ['直接反击', '策略破局', '留好后手', '结盟求助']],
        ['哪种胜利最让你满足？', ['能力压制', '智谋赢局', '逆境成长', '关系兑现']],
        ['你希望怎样面对风险？', ['稳步掌控', '有准备的冒险', '强刺激']],
        ['关系中最看重什么？', ['信任', '独立', '被理解', '共同承担']],
        ['能接受多久的受挫铺垫？', ['尽快反击', '短暂受挫', '多段积累']]
    ];
    const labels = ['情绪回报', '应对期待', '胜利方式', '风险强度', '关系回报', '受挫节拍'];
    const selfQuestions = [
        ['做重要决定时，你通常更像哪种？', ['先分析再行动', '相信直觉', '边做边调整', '先听取他人意见']],
        ['进入陌生群体时，你通常会？', ['先观察再靠近', '主动认识别人', '找一个聊得来的人', '保留独立空间']],
        ['压力很大时，你更常怎样应对？', ['拆成小事逐步处理', '先独处整理情绪', '找信任的人倾诉', '立即行动找回掌控']],
        ['什么最容易触动你？', ['努力被看见', '拥有选择的自由', '被信任和理解', '保护在乎的人']]
    ];
    function selfSummary(answers = [], customAnswers = []) {
        const labels = ['决定方式', '相处方式', '压力应对', '在意的事'];
        return selfQuestions.map((q, i) => {
            const value = answers[i] === '自定义' ? String(customAnswers[i] || '').trim().slice(0, 200) : q[1].includes(answers[i]) ? answers[i] : '';
            return value ? labels[i] + '：' + value : '';
        }).filter(Boolean).join('\n');
    }
    function load() {
        try {
            const value = JSON.parse(localStorage.getItem(key));
            if (value?.version !== 1) return null;
            const excludedTags = normalizeTags(value.excludedTags);
            return { ...value, tags: normalizeTags(value.tags).filter(tag => !excludedTags.includes(tag)), excludedTags };
        }
        catch { return null; }
    }
    function save(value) {
        const excludedTags = normalizeTags(value.excludedTags);
        const wantedTags = normalizeTags(value.tags).filter(tag => !excludedTags.includes(tag));
        const gender = value.playerGender ?? playerGender();
        try { localStorage.setItem(key, JSON.stringify({ ...value, tags: wantedTags, excludedTags, playerGender: ['男', '女'].includes(gender) ? gender : '', playerName: String(value.playerName ?? load()?.playerName ?? '').trim().slice(0, 20), version: 1, updatedAt: Date.now() })); return true; }
        catch { return false; }
    }
    function summary(answers, customAnswers = []) {
        const lines = questions.map((q, i) => {
            const value = answers[i] === '自定义' ? String(customAnswers[i] || '').trim().slice(0, 200) : q[1].includes(answers[i]) ? answers[i] : '';
            return value ? `${labels[i]}：${value}` : '';
        });
        if (lines[1] && lines[2]) { lines[1] += '；' + lines[2]; lines[2] = ''; }
        return lines.filter(Boolean).join('\n');
    }
    function effective(value) {
        return value?.generalPreference?.trim() ? { ...value, tags: [], excludedTags: [], excludedPreference: '', summary: '', selfSummary: '' } : value;
    }
    function snapshot() {
        const value = load();
        return value?.enabled || value?.storyEnabled ? effective({ version: 1, summary: value.enabled ? String(value.summary || '').slice(0, 1600) : '',
            tags: tags.filter(tag => value.tags?.includes(tag) && !value.excludedTags?.includes(tag)),
            excludedTags: tags.filter(tag => value.excludedTags?.includes(tag)),
            excludedPreference: String(value.excludedPreference || '').trim().slice(0, 600),
            selfSummary: value.enabled ? String(value.selfSummary || '').trim().slice(0, 1000) : '',
            generalPreference: String(value.generalPreference || '').trim().slice(0, 1200), updatedAt: value.updatedAt }) : null;
    }
    function prompt(value) {
        if (value?.generalPreference?.trim()) return `【本次剧情想法：覆盖阅读偏好】\n${value.generalPreference.trim()}\n本次只以这段想法确定主线、题材、基调与禁用内容，不叠加长期想看/不想看标签、避雷描述、心理摘要或代入人设；想法中的排除要求仍须遵守。长期偏好仅保存，不作为本次限制。新开局先从读者剧情描述提炼主角优势、主线目标与基调，再写书名和简介，随机世界与角色维度只补足未指定的细节。描述中的后续成果不是全部已发生的事实；已有故事保留既定世界、身份和已发生事实，在此基础上调整后续方向，不突然切换世界。\n`;
        const excluded = normalizeTags(value?.excludedTags);
        const wanted = normalizeTags(value?.tags).filter(tag => !excluded.includes(tag));
        const text = [wanted.length ? '想看的题材与类型：' + wanted.join('、') : '',
            excluded.length ? '不想看的题材与类型：' + excluded.join('、') : '',
            value?.excludedPreference ? '不想出现的内容：' + value.excludedPreference : '',
            value?.generalPreference ? '想看的剧情与自定义偏好：' + value.generalPreference : '', value?.summary,
            value?.selfSummary ? '读者自述的代入人设：\n' + value.selfSummary + '\n这些是可修改的自述线索，不是心理诊断。用于主角的内心反应与关系互动，结合原有角色生成体系塑造身份、能力、缺陷和成长空间；不擅自推断未提供的性格，也不强迫读者按某种性格行动。' : ''].filter(Boolean).join('\n');
        return text ? `【读者主动表达的叙事期待】\n${text}\n不想看的题材和内容属于明确排除项，优先于想看标签、剧情描述、心理摘要和随机灵感；冲突时选择符合排除项的组合，不自行取消排除。不引入或重点展开被排除的题材、关系和桥段，简介也须遵守。本次剧情描述优先于长期想看标签，明确排除项始终最高；描述与长期口味冲突时，以本次描述确定主线与题材，不改写用户保存的标签。新开局先从读者剧情描述提炼主角优势、主线目标与基调，再据此写书名和简介；随机世界和角色维度只补足未指定的细节，不用随机灵感替换主线。主线描述中的成果作为后续看点，不全部写成已发生事实。已有故事不抹去已发生的排除内容，仅在后续避开新的相关情节；逐步靠近这些期待，保留既定世界规则与已发生事实，不突然切换世界、不把偏好本身写进正文。\n` : '';
    }
    // Move the old candidate's name once; existing story sessions keep their own name.
    try {
        const pending = JSON.parse(localStorage.getItem('pending_immersive_opening_v1'));
        const stored = load();
        if (pending?.playerName !== undefined) {
            if (stored?.playerName !== undefined || save({ ...(stored || {}), playerName: pending.playerName, enabled: stored?.enabled ?? false })) {
                delete pending.playerName;
                localStorage.setItem('pending_immersive_opening_v1', JSON.stringify(pending));
            }
        }
    } catch { /* An unreadable candidate must not prevent editing preferences. */ }
    function playerName() { return String(load()?.playerName || '').trim().slice(0, 20); }
    function playerGender() { const value = load()?.playerGender; return ['男', '女'].includes(value) ? value : ''; }
    function genderPrompt(value) {
        return ['男', '女'].includes(value) ? `【主角性别】${value}；身份与称谓须一致，不据此推断性格、能力或恋爱对象。\n` : '【主角性别】未指定，不根据姓名猜测，沿用故事已建立的事实。\n';
    }
    return { key, tags, tagGroups, normalizeTags, matchTags, effective, questions, selfQuestions, load, save, summary, selfSummary, snapshot, prompt, playerName, playerGender, genderPrompt };
})();
