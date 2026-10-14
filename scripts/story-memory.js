// Dynamic notes follow prose; established character personas remain authoritative.
window.JimoMemory = (() => {
    const fields = ['state', 'outline', 'clues', 'characters', 'relations'];
    const clean = value => typeof value === 'string' ? value.trim() : '';
    function sourced(row, history) {
        return row && Number.isInteger(row._seg) && row._seg >= 0 &&
            clean(row.evidence) && history[row._seg]?.content.includes(clean(row.evidence));
    }
    function traits(rows, history, framework = '') {
        const dimensions = window.JimoCharacters.dimensions;
        const standard = window.JimoCharacters.frameworks[framework];
        const valid = (Array.isArray(rows) ? rows : []).filter(row => sourced(row, history) &&
            Object.hasOwn(dimensions, clean(row.dimension)) && clean(row.label) &&
            (!dimensions[clean(row.dimension)].length ||
                (standard ? standard[clean(row.dimension)]?.includes(clean(row.label)) : dimensions[clean(row.dimension)].includes(clean(row.label)))))
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
            const framework = Object.hasOwn(window.JimoCharacters.frameworks, clean(row.framework)) ? clean(row.framework) : '';
            if (clean(row.id)) ids.set(row.id, id);
            return { id, name: clean(row.name), tag: clean(row.tag), desc: clean(row.desc),
                goal: clean(row.goal), knowledge: clean(row.knowledge), framework, traits: traits(row.traits, history, framework), ...note(row) };
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
            const existing = established.get(card.id);
            const framework = existing?.framework || (Object.hasOwn(window.JimoCharacters.frameworks, card.framework) ? card.framework : '');
            const incoming = traits(card.traits, history, framework);
            if (!card.id || !incoming.length) continue;
            const saved = existing || { id: card.id, name: card.name, tag: card.tag, framework, traits: [] };
            const dimensions = new Set(saved.traits.map(row => row.dimension));
            saved.traits.push(...incoming.filter(row => !dimensions.has(row.dimension)));
            established.set(card.id, saved);
        }
        return [...established.values()];
    }
    function personas(story) {
        return establishPersonas(story.characterCards || [], story.history, story.characterPersonas || []);
    }
    function missingTraits(persona) {
        const standard = window.JimoCharacters.requirements[persona.framework];
        if (!standard) return ['塑造体系'];
        return Object.entries(standard).filter(([dimension, count]) => {
            const labels = new Set((persona.traits || []).filter(row => row.dimension === dimension).map(row => row.label));
            return labels.size < count.min || labels.size > count.max;
        }).map(([dimension]) => dimension);
    }
    function completePersonas(cards, history, previous = []) {
        const result = establishPersonas(cards, history, previous);
        const byId = new Map(result.map(persona => [persona.id, persona]));
        for (const card of cards) {
            if (card.id && !byId.has(card.id)) {
                const persona = { id: card.id, name: card.name, tag: card.tag, framework: card.framework || '', traits: [] };
                result.push(persona); byId.set(card.id, persona);
            }
        }
        for (const persona of result) {
            if (!window.JimoCharacters.frameworks[persona.framework]) {
                const scores = Object.entries(window.JimoCharacters.frameworks).map(([name, standard]) => ({ name,
                    score: persona.traits.filter(row => standard[row.dimension]?.includes(row.label)).length }));
                const best = Math.max(...scores.map(row => row.score));
                const choices = scores.filter(row => row.score === best);
                persona.framework = choices[Math.floor(Math.random() * choices.length)].name;
            }
            const standard = window.JimoCharacters.frameworks[persona.framework];
            for (const [dimension, count] of Object.entries(window.JimoCharacters.requirements[persona.framework])) {
                const existing = new Set(persona.traits.filter(row => row.dimension === dimension).map(row => row.label));
                const candidates = standard[dimension].filter(label => !existing.has(label));
                while (existing.size < count.min && candidates.length) {
                    const [label] = candidates.splice(Math.floor(Math.random() * candidates.length), 1);
                    persona.traits.push({ dimension, label, origin: 'creation' });
                    existing.add(label);
                }
            }
        }
        return result;
    }
    function context(story) {
        if (story.metadataProcessedVersion !== (story.contentVersion || 0)) return {};
        const valid = rows => (rows || []).filter(row => sourced(row, story.history));
        return { state: valid(story.storyState), recentEvents: valid(story.storyOutline).slice(-12),
            clues: valid(story.storyClues), characters: valid(story.characterCards).map(row => ({ ...row, traits: traits(row.traits, story.history) })), relations: valid(story.characterRelations) };
    }
    return { snapshot, context, establishPersonas, personas, missingTraits, completePersonas };
})();
