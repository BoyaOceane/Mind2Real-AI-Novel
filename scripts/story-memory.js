// Dynamic notes follow prose; established character personas remain authoritative.
window.JimoMemory = (() => {
    const fields = ['state', 'outline', 'clues', 'characters', 'relations'];
    const clean = value => typeof value === 'string' ? value.trim() : '';
    function sourced(row, history) {
        return row && Number.isInteger(row._seg) && row._seg >= 0 &&
            clean(row.evidence) && history[row._seg]?.content.includes(clean(row.evidence));
    }
    function traits(rows, history) {
        const dimensions = window.JimoCharacters.dimensions;
        const valid = (Array.isArray(rows) ? rows : []).filter(row => sourced(row, history) &&
            Object.hasOwn(dimensions, clean(row.dimension)) && clean(row.label) &&
            (!dimensions[clean(row.dimension)].length || dimensions[clean(row.dimension)].includes(clean(row.label))))
            .map(row => ({ dimension: clean(row.dimension), label: clean(row.label), _seg: row._seg, evidence: clean(row.evidence) }));
        return [...new Map(valid.map(row => [row.dimension + ':' + row.label, row])).values()];
    }
    function snapshot(meta, history) {
        if (!meta || fields.some(key => !Array.isArray(meta[key]))) throw new Error('故事资料格式不完整');
        const rows = key => meta[key].filter(row => sourced(row, history));
        const note = row => ({ _seg: row._seg, evidence: clean(row.evidence) });
        const unique = (rows, key) => [...new Map(rows.map(row => [key(row), row])).values()];
        const ids = new Map([['protagonist', 'protagonist']]);
        const characters = rows('characters').filter(row => clean(row.name)).map(row => {
            const id = row.tag === '主角' ? 'protagonist' : 'char:' + clean(row.name);
            if (clean(row.id)) ids.set(row.id, id);
            return { id, name: clean(row.name), tag: clean(row.tag), desc: clean(row.desc),
                goal: clean(row.goal), knowledge: clean(row.knowledge), traits: traits(row.traits, history), ...note(row) };
        });
        return {
            state: unique(rows('state').filter(row => clean(row.name) && clean(row.desc)).map(row =>
                ({ kind: clean(row.kind), name: clean(row.name), desc: clean(row.desc), ...note(row) })), row => row.kind + ':' + row.name),
            outline: unique(rows('outline').filter(row => clean(row.summary)).map(row =>
                ({ type: clean(row.type), importance: clean(row.importance), summary: clean(row.summary), ...note(row) })), row => row._seg + ':' + row.summary)
                .sort((a, b) => a._seg - b._seg),
            clues: unique(rows('clues').filter(row => clean(row.name)).map(row =>
                ({ kind: clean(row.kind), name: clean(row.name), stateChange: clean(row.stateChange), desc: clean(row.desc), importance: clean(row.importance), ...note(row) })), row => row.name),
            characters: unique(characters, row => row.id),
            relations: unique(rows('relations').filter(row => ids.has(row.source) && ids.has(row.target)).map(row =>
                ({ source: ids.get(row.source), target: ids.get(row.target), type: clean(row.type), scene: clean(row.scene), ...note(row) })), row => row.source + ':' + row.target)
        };
    }
    function establishPersonas(cards, history, previous = []) {
        const established = new Map(previous.map(row => [row.id, { ...row, traits: [...row.traits] }]));
        for (const card of cards) {
            const incoming = traits(card.traits, history);
            if (!card.id || !incoming.length) continue;
            const saved = established.get(card.id) || { id: card.id, name: card.name, tag: card.tag, traits: [] };
            const dimensions = new Set(saved.traits.map(row => row.dimension));
            saved.traits.push(...incoming.filter(row => !dimensions.has(row.dimension)));
            established.set(card.id, saved);
        }
        return [...established.values()];
    }
    function personas(story) {
        return establishPersonas(story.characterCards || [], story.history, story.characterPersonas || []);
    }
    function context(story) {
        if (story.metadataProcessedVersion !== (story.contentVersion || 0)) return {};
        const valid = rows => (rows || []).filter(row => sourced(row, story.history));
        return { state: valid(story.storyState), recentEvents: valid(story.storyOutline).slice(-12),
            clues: valid(story.storyClues), characters: valid(story.characterCards).map(row => ({ ...row, traits: traits(row.traits, story.history) })), relations: valid(story.characterRelations) };
    }
    return { snapshot, context, establishPersonas, personas };
})();
