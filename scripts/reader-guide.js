// One shared, replayable guide. Never displays, copies or transmits API keys.
globalThis.JimoGuide = (() => {
    const seenKey = 'reader_quickstart_seen_v1';
    const guide = document.createElement('dialog');
    guide.id = 'quickstartGuide';
    guide.className = 'quickstart-guide';
    guide.setAttribute('aria-labelledby', 'quickstartGuideTitle');
    guide.innerHTML = `<button type="button" class="panel-close" data-guide-close aria-label="关闭使用说明">关闭 ×</button>
        <h2 id="quickstartGuideTitle">三步开始，写你想看的故事</h2>
        <ol>
          <li><h3>设置自己的 API Key</h3><p>首页右上角点“API设置”。没有 Key？<a href="https://platform.deepseek.com/" target="_blank" rel="noopener noreferrer">去 DeepSeek 官方平台创建 ↗</a>，再回来粘贴。阅读页也能从“更多 → API 设置”修改。</p></li>
          <li><h3>说出想法，生成简介</h3><p>在首页“这次想看什么”写下想看的题材、人设或剧情，也可以留空随机开局。设置里点“保存并生成简介”，或在首页点“生成简介”。“仅保存”不会调用模型。</p></li>
          <li><h3>开始阅读，随时决定下一步</h3><p>喜欢书名和简介，就点“开始阅读”。“继续看”续写故事，“改走向”让你选择行动或说出想法。姓名、阅读偏好和测评都可以以后再填。</p></li>
        </ol>
        <p class="reader-note">生成使用你自己的 API 账户，按官方规则收费；体验包不附赠 Key 或额度。启动窗口请保持打开。</p>
        <details><summary>保存、升级和启动问题</summary><p>小说、偏好和 Key 保存在当前浏览器，不在体验包里。升级前用“更多 → 导出与备份”备份 JSON，保持原浏览器及 localhost:8080。运行环境缺失时，双击包内“修复运行环境”；生成失败按页面提示检查 Key、账户余额或网络。</p></details>
        <p class="reader-note">以后可从首页“使用说明”或阅读页“更多 → 使用说明”，随时重新打开这份指南。</p>
        <div class="reader-actions"><button type="button" class="reader-primary" id="guideOpenApi">去设置 API Key</button><button type="button" class="reader-secondary" data-guide-close>先看看</button></div>`;
    document.body.append(guide);
    function remember() { try { localStorage.setItem(seenKey, '1'); } catch {} }
    function close() { remember(); guide.close(); }
    guide.querySelectorAll('[data-guide-close]').forEach(button => button.addEventListener('click', close));
    guide.addEventListener('close', remember);
    guide.addEventListener('keydown', event => event.stopPropagation());
    guide.querySelector('#guideOpenApi').addEventListener('click', () => {
        close();
        if (typeof openApi === 'function') openApi();
        else if (typeof toggleApiPanel === 'function') toggleApiPanel();
    });
    function open() { if (!guide.open) guide.showModal(); }
    function firstVisit() {
        if (!document.getElementById('openingBookTitle')) return;
        try {
            if (!localStorage.getItem(seenKey) && !localStorage.getItem('deepseek_api_key') && !localStorage.getItem('current_story_session') && !JSON.parse(localStorage.getItem('story_history') || '[]').length) open();
        } catch { /* Existing or unavailable storage must not block reading. */ }
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', firstVisit, { once: true });
    else firstVisit();
    return { open, close };
})();
