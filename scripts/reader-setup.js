// Setup status is evidence of this session's request, never a stored promise of validity.
globalThis.JimoSetup = (() => {
    let verified = null, checkController = null;
    const input = () => ({ apiKey: document.getElementById('apiKeyInput').value.trim(), model: document.getElementById('apiModelSelect').value });
    const same = (a, b) => a && b && a.apiKey === b.apiKey && a.model === b.model;
    function status(text) { document.getElementById('apiSetupStatus').textContent = text; }
    function changed() {
        checkController?.abort();
        const draft = input();
        if (same(draft, verified)) status('本次连接成功，可以生成故事。');
        else if (!draft.apiKey) status('尚未设置 API Key。');
        else if (draft.apiKey === localStorage.getItem('deepseek_api_key') && draft.model === (localStorage.getItem('deepseek_model') || 'deepseek-flash')) status('已保存到本机；尚未确认本次连接。');
        else status('设置已修改，尚未保存或检查连接。');
    }
    function connected(config) { verified = { ...config }; if (same(input(), config)) status('本次连接成功，可以生成故事。'); }
    function message(error) {
        if (error.status === 401) return 'API Key 无效，请重新复制官方平台的 Key，在设置中保存后重试。';
        if (error.status === 402) return 'API 账户余额不足，请到 DeepSeek 官方平台检查余额后重试。';
        if (error.status === 429) return '请求太频繁，请稍后再试；不会自动反复调用。';
        if (error.status) return `模型服务暂不可用（${error.status}），请稍后重试；若持续出现，请检查模型设置。`;
        if (error.name === 'TimeoutError') return '等待模型响应超时，请检查网络后重试。你的剧情想法仍保留。';
        if (error.name === 'TypeError') return '未能连接模型服务，请检查网络或代理后重试；这不一定是 Key 错误。';
        return error.message || '生成未完成，请重试。';
    }
    function clearHome() { document.getElementById('setupProblem').hidden = true; }
    function problem(error) {
        if (!error.status && !['TimeoutError', 'TypeError'].includes(error.name)) return;
        verified = null;
        document.getElementById('setupProblemText').textContent = message(error);
        document.getElementById('setupProblem').hidden = false;
    }
    async function check(generate = false) {
        if (checkController) return;
        const config = input();
        if (!config.apiKey) { status('请先粘贴你的 API Key。'); return; }
        const controller = new AbortController();
        checkController = controller;
        let timedOut = false;
        const timer = setTimeout(() => { timedOut = true; controller.abort(); }, 20000);
        const buttons = ['apiTestBtn', 'apiTestGenerateBtn'].map(id => document.getElementById(id));
        buttons.forEach(button => button.disabled = true);
        status('正在用当前输入和所选模型检查连接…');
        try {
            const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
                method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + config.apiKey },
                body: JSON.stringify({ model: config.model, messages: [{ role: 'user', content: generate ? '请只回复：测试成功' : 'hi' }], max_tokens: generate ? 50 : 10, stream: false, thinking: { type: 'disabled' } }), signal: controller.signal
            });
            if (!response.ok) { const error = new Error(); error.status = response.status; throw error; }
            const data = await response.json();
            if (!data.choices?.[0]?.message?.content) throw new Error('服务返回空内容，连接尚未确认，请稍后重试。');
            if (!same(input(), config) || controller.signal.aborted) return;
            connected(config);
        } catch (error) {
            if (timedOut) error = Object.assign(new Error(), { name: 'TimeoutError' });
            if (error.name !== 'AbortError' && same(input(), config)) { verified = null; status(message(error)); }
        } finally {
            clearTimeout(timer); checkController = null;
            buttons.forEach(button => button.disabled = false);
        }
    }
    document.getElementById('apiKeyInput').addEventListener('input', changed);
    document.getElementById('apiModelSelect').addEventListener('change', changed);
    return { changed, status, connected, message, clearHome, problem, check };
})();
