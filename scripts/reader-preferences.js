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
    // Possible reading wishes, not a psychological profile or permission to invent facts.
    const tagExpectations = {
        '都市': '在熟悉生活里凭能力翻身，收入、工作机会与别人待你的方式实在变好。',
        '玄幻': '突破常人够不到的力量边界，用已设能力解决难题，让地位与选择权随成果增长。',
        '仙侠修真': '走自己的修行路，练成的本事真能护身破局，长生与自在通过阶段成长逐步可及。',
        '武侠': '有本事也有自己的规矩，出手能护住在乎的人，在江湖中凭行动赢得尊重与自由。',
        '科幻': '见识新技术改变生活和困局，聪明运用已设机制得到别人难以获得的机会。',
        '奇幻': '探索超出日常的世界，奇异规则有真实用途，发现与运用带来惊喜和掌控。',
        '悬疑': '从看得见的异常中抓住线索，逐步弄懂真相、拿回主动，不靠一直藏答案续篇。',
        '推理': '观察和判断有用，证据能串起来，每次推断得到验证或修正，破局能回看前文依据。',
        '历史': '在具体时代限制中做成一件事，知识、谋略与行动改变处境，不让古人集体降智。',
        '游戏': '熟悉规则后玩出主动权，操作、策略与合作换来真实战果、资源和探索机会。',
        '电竞': '在有分量的对局中证明实力，配合、判断和操作决定胜负，队友与对手据战绩改观。',
        '近代现代': '熟悉的日常、事业和关系能由自己推动，改变落在可感受到的生活选择里。',
        '古色古香': '进入有时代质感的生活，在相应礼俗与限制中获得尊重、亲近或自主，不只堆古雅词。',
        '架空历史': '在自洽时代里打开另一种可能，个人选择能影响身边生活或更大局势，有条件也有成果。',
        '幻想未来': '亲自用上未来生活的便利与新机会，技术和社会规则影响行动，不只是背景名词。',
        '星际': '在广阔星域拥有自己的本事与位置，航行、技术或战果打开新地方和更大的选择。',
        '西幻': '在异族、魔法与冒险中发现机会，按已设规则结盟和破局，让新世界值得继续探索。',
        '校园': '努力被看见、相处有回应，课堂、比赛或日常行动带来成长与珍贵关系，不只换个校服背景。',
        '末世': '别人受生存压力时自己有可靠办法，安全、资源与选择逐步到手，也能护住认可的人。',
        '年代': '在物资与机会有限的日子里越过越好，劳动、经营和互助换来吃穿、安稳与尊严。',
        '豪门世家': '面对资源与身份差距仍有分量，拿到实际支持或议价权，关系不能只靠血统口号成立。',
        '娱乐圈': '才华与作品有舞台，资源、观众反馈和待遇对应实际表现，不只有热搜与夸奖数字。',
        '古风': '享受符合人物身份的生活、情意与行动，时代氛围落在细节里，不牺牲顺口和推进。',
        '架空': '在新规则下体验现实难有的可能，先让关键规则可理解，再由行动取得优势与收获。',
        '言情': '在男女感情中被具体地选择、理解和珍惜，偏爱落在行动与取舍中，关系有双方意愿和进度。',
        '纯爱': '在男性之间体验认真相待与双向靠近，欣赏、信任和选择逐步成立，不把关系写成固定强弱模板。',
        '百合': '在女性之间体验看见彼此、欣赏和双向选择，亲近以各自行动与意愿成立，不抹去独立目标。',
        '无CP': '个人目标、事业和探索不被恋爱挤走，可以有深厚同伴关系，不强加爱情也不强制孤独。',
        '马甲': '拥有不必急着证明的底牌，能选择何时公开；实际成果让他人逐步重新认识，而非只等掉马。',
        '大佬': '关键时刻能解决别人办不到的事，有分量的人主动争取，实力与话语权有行动依据。',
        '龙傲天': '大胆主动争取更大的舞台，用明显优势赢得机会和决定权，不靠喊霸气或所有人失去判断。',
        '女强': '女性主角凭判断与能力掌握命运，事业和选择权不能被感情替代，也不等于拒绝一切帮助。',
        '强强': '彼此有本事、有独立目标，交锋与合作都能看见价值，关系不靠削弱一方成立。',
        '天才': '看得更准、学得更快的优势真能解决问题，挑战与懂行者的回应显出价值，不只贴聪明称号。',
        '学霸': '投入和理解带来可验证的成绩与解决能力，学习成果打开机会，不只罗列分数排名。',
        '万人迷': '被不同人物看见具体吸引力，亲近各有原因与表达，主角保有选择和拒绝的自由。',
        '美强惨': '有能力、有魅力的人不再只承受苦难，仍能选择和赢，理解与支持通过有依据的关系逐步到来。',
        '普通人成长': '从能理解的起点逐渐做成更难的事，积累留得住，小成果有用，别人认可随行动改变。',
        '扮猪吃虎': '不急着显露实力却始终有主动权，对方误判付出实际代价，不靠主角装笨或一直受气拖戏。',
        '真假千金': '身份与待遇争议得到有依据的澄清，拿回尊严和选择；价值不只由血缘决定，不自动妖魔化另一人。',
        '反派主角': '跳出被安排的坏人命运，用自己的立场与策略争主动，行动有后果，不默认虐待无辜才痛快。',
        '甜宠': '在关键取舍中被偏爱，也在日常被照顾，照顾解决实际需要且尊重主角意愿。',
        '甜文': '相处轻快安心，小行动有回应，关系持续带来快乐，不靠反复误会或只说宠你维持。',
        '团宠': '遇事有人撑腰、需求被认真对待，各人的支持有自己的表达，主角仍有能力与决定权。',
        '先婚后爱': '从已有关系框架中逐步发现对方值得信任，责任变为主动偏爱，不因婚姻就默认爱与同意。',
        '青梅竹马': '长期相伴的熟悉感在具体记忆、习惯和默契中有用，重新看见对方成长后的选择。',
        '欢喜冤家': '嘴上交锋、行动有默契，斗嘴带来趣味和靠近，不把羞辱与真正伤害当甜。',
        '破镜重圆': '旧问题得到正面处理和实际修复，重新选择有新依据，不重复旧伤后直接宣布和好。',
        '情有独钟': '在有分量的选择里被坚定珍惜，专属待遇有具体行动，不把执着写成剥夺自由。',
        '暗恋': '细小回应逐渐让靠近有希望，试探与被看见有进展，不连续误会或永远猜不出来。',
        '相爱相杀': '立场与情感都有分量，交锋、克制和取舍改变关系，不把伤害无条件解释成爱。',
        '宿敌变恋人': '竞争中认清彼此价值，信任通过行动增长，原有矛盾有解决过程，不突然改立场倒贴。',
        '救赎': '被理解、获得支持后重新拥有选择和行动能力，互助有进展，不靠反复受伤制造依赖。',
        '虐恋情深': '情感冲突有真实分量，主角有尊严和选择，付出得到回应或清楚后果，不无限拖欠补偿。',
        '追妻火葬场': '造成伤害的人承担后果、付出实际修复，是否回头由被伤害者决定，不用痛苦宣告抵消旧账。',
        '冒险': '走进未知后有新发现与实际收获，本事和同伴真派上用场，下一处目标因发现而值得去。',
        '逆袭': '从被低估的处境拿回主动，能力与积累改变资源和待遇，不换舞台就清零成果。',
        '成长': '经历让判断、能力或关系真的改变，新收获能用上，失败有修正，不原地重复试炼。',
        '群像': '不同人物各有目标和价值，选择相互影响，合作与分歧推动主线，不靠人数或资料表堆热闹。',
        '打脸': '错误判断被实际成果推翻，相关人物改条件或承担后果，不靠全员嘲讽和震惊口号。',
        '复仇': '有依据地追究伤害、拿回主动，行动针对责任者，阶段成果可感受，不牵连无辜或无限铺垫。',
        '虐渣': '伤害和利用不再占便宜，作恶者承担相称后果，主角拿回尊严与利益，不把普通分歧当恶行。',
        '宫斗宅斗': '在利益、人情与规矩中看懂局势，用线索、盟友和策略争到实际筹码，不靠无因害人或全员降智。',
        '系统': '行动有明确反馈，规则与奖励能理解、能使用，主角仍主动选择，不只被任务牵着走。',
        '重生': '重新选择曾经错过的机会，已赋予的经验真能改变处境，未来会受新行动影响，不自动知道所有事。',
        '穿越': '在陌生世界凭已拥有的经验找到立足点，新生活有可体验的机会，不让原住民集体愚蠢。',
        '穿书': '对故事的了解帮助避坑和争取新可能，按已有知情范围行动，改变会带来新局势，不预定所有人反应。',
        '快穿': '不同世界有不同值得体验的目标，阶段成果明确、每次用法有变化，不只换名字重复任务。',
        '无限流': '逐步看懂规则并主动破局，线索、能力与同伴换来可保留的收获，不为新关卡任意改规则。',
        '异能': '独有能力在具体场景中产生特殊用途与优势，边界清楚，不临时添万能功能。',
        '读心': '在已设条件下看见信息差，能用来判断和选择，不共享所有秘密或把想法当绝对事实。',
        '随身空间': '有自己的储备和安全余地，储存、种植等用途只按已设功能兑现，不默认无限复制或时间加速。',
        '金手指': '有别人缺少的实用优势，关键时刻能改变结果并带来好处，有来源和边界，不凭空救场。',
        '无敌': '实力可靠，遇事从容，能决定如何出手和保护谁，目标与选择仍有意义，不强行削弱制造困难。',
        '升级流': '努力与资源转化为看得见的新本事，进步带来新用途和机会，不只涨面板或重复打同一种敌人。',
        '爽文': '愿望得到痛快且有分量的兑现，主动权、回报与人物反应写出来，本集满足后还有更想体验的下一步。',
        '轻松': '问题能处理、相处不压抑，聪明应对和小趣味带来舒展，不等于没有目标或平淡过场。',
        '正剧': '人物选择与后果可信、有分量，胜利让人信服并留下实际改变，不把严肃等同持续受苦。',
        '治愈': '在具体照顾、互助和安稳日常里放松，困扰逐步减轻、行动能力回来，不空喊温暖或强迫原谅。',
        '日常': '普通生活也有值得在意的人和小目标，事情做成、关系有回应、成果能享受，不写流水账。',
        '轻松日常': '生活好过一点、相处自在一点，低压力的目标持续有回报，不靠突然大危机维持追读。',
        '搞笑': '人物性格与局面碰撞产生自然笑点，笑完事情继续推进，不硬塞梗或把所有人写笨。',
        '热血': '有值得争取的目标，努力、配合与主动担当带来突破，胜利有积累和感染力，不只喊口号。',
        '种田文': '劳动有收成、储备带来安稳，能亲自享受果蔬与闲暇，再自然期待扩种和新生活，不只有产量。',
        '经商': '看准需求、做成交易，利润能改善生活、增加选择，顾客反馈和议价显出价值，不凭空送钱。',
        '基建': '逐步把缺乏的地方建成丰富可住的生活，设施实际被使用、麻烦消失，有资源和工期依据，不列清单。',
        '美食': '做与吃都让人有食欲，香味口感符合食材做法，用吃的动作与反馈表现满足，不反复说好吃。',
        '神豪': '资源充足带来生活享受与决定权，钱花出具体好处和有依据的待遇，不只报余额或买一切人的心。',
        '囤货': '提前准备换来安心和选择，物资实际派上用场、能护住在乎的人，不只数库存或突然无限供应。',
        '养崽': '照顾中看见孩子逐渐安心、成长与回应，大人孩子都有变化，不把孩子只当卖萌工具。',
        '萌宝': '孩子的童真与小行动带来亲近和快乐，聪明可爱符合年龄，不靠幼儿全知或强行撮合大人。',
        '商战': '看懂利益与筹码，用策略取得订单、资源或主动权，对手有判断力，局势变化有因果。',
        '直播': '能力或生活分享得到即时且多样的观众反馈，互动带来实际机会，观众按看见的内容判断，不全员夸赞。'
    };
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
        if (!value?.generalPreference?.trim()) return value;
        const described = matchTags(value.generalPreference);
        return { ...value,
            tags: normalizeTags(value.tags).filter(tag => !described.excludedTags.includes(tag)),
            excludedTags: normalizeTags(value.excludedTags).filter(tag => !described.tags.includes(tag)) };
    }
    function snapshot(idea) {
        const stored = load();
        const value = stored && idea !== undefined ? { ...stored, generalPreference: idea } : stored;
        return value?.enabled || value?.storyEnabled ? effective({ version: 1, summary: value.enabled ? String(value.summary || '').slice(0, 1600) : '',
            tags: tags.filter(tag => value.tags?.includes(tag) && !value.excludedTags?.includes(tag)),
            excludedTags: tags.filter(tag => value.excludedTags?.includes(tag)),
            excludedPreference: String(value.excludedPreference || '').trim().slice(0, 600),
            selfSummary: value.enabled ? String(value.selfSummary || '').trim().slice(0, 1000) : '',
            generalPreference: String(value.generalPreference || '').trim().slice(0, 1200), updatedAt: value.updatedAt }) : null;
    }
    function prompt(value) {
        value = effective(value);
        const excluded = normalizeTags(value?.excludedTags);
        const wanted = normalizeTags(value?.tags).filter(tag => !excluded.includes(tag));
        const described = matchTags(value?.generalPreference || '');
        const expectationTags = normalizeTags([...described.tags, ...wanted]).filter(tag => !excluded.includes(tag) && !described.excludedTags.includes(tag));
        const text = [wanted.length ? '想看的题材与类型：' + wanted.join('、') : '',
            expectationTags.length ? '【标签背后的阅读期待；仅作创作参考】\n' + expectationTags.map(tag => tag + '：' + tagExpectations[tag]).join('\n') + '\n结合剧情想法与用户行动选择合适的理解，将期待落实为目标、行动、人物回应、可享受的结果和下一期待；不是用户真实心理或已发生事实，不逐项套桥段，明确意图与原著优先。' : '',
            excluded.length ? '不想看的题材与类型：' + excluded.join('、') : '',
            value?.excludedPreference ? '不想出现的内容：' + value.excludedPreference : '',
            value?.generalPreference ? '想看的剧情与自定义偏好：' + value.generalPreference + '\n即使没有匹配到标签，也结合这段原话与当前处境理解用户最想体验的结果、待遇或生活，将其落实成具体场面与有依据的回报；这是主线/后续方向，不是已经发生的事实。理解只补空白，不改变明确要求。' : '', value?.summary,
            value?.selfSummary ? '读者自述的代入人设：\n' + value.selfSummary + '\n这些是可修改的自述线索，不是心理诊断。用于主角的内心反应与关系互动，结合原有角色生成体系塑造身份、能力、缺陷和成长空间；不擅自推断未提供的性格，也不强迫读者按某种性格行动。' : ''].filter(Boolean).join('\n');
        return text ? `【剧情想法与阅读偏好共同生效】\n${text}\n剧情想法决定本次主线，阅读偏好中的题材、避雷、已启用的心理期待与代入人设共同补足体验，长期写法补足表达；不强行拼接所有标签。剧情偏好优先于阅读偏好，包括长期想看、不想看、避雷、心理期待、代入人设和写法；只在冲突的部分按本次剧情想法处理，其余阅读偏好继续生效。剧情想法自身明确不要的内容仍须遵守；没有冲突时，阅读偏好的排除项优先于想看标签与随机灵感，简介也须遵守。没有剧情想法时，完整使用阅读偏好及其排除。只调整本次生成的有效约束，不改写用户保存的长期设置。新开局先从读者剧情描述提炼主角优势、主线目标与基调，再据此写书名和简介；随机世界和角色维度只补足未指定的细节，不用随机灵感替换主线。主线描述中的成果作为后续看点，不全部写成已发生事实。已有故事不抹去已发生的排除内容，仅在后续避开新的相关情节；逐步靠近这些期待，保留既定世界规则与已发生事实，不突然切换世界、不把偏好本身写进正文。\n` : '';
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
    return { key, tags, tagGroups, tagExpectations, normalizeTags, matchTags, effective, questions, selfQuestions, load, save, summary, selfSummary, snapshot, prompt, playerName, playerGender, genderPrompt };
})();
