// Keep keyboard navigation inside the currently open settings/history dialog.
(() => {
    const panels = [...document.querySelectorAll('.api-panel-overlay, .api-modal')];
    const open = panel => panel.classList.contains('open') || panel.classList.contains('show');
    const controls = panel => [...panel.querySelectorAll('button, a[href], input, select, textarea, summary')].filter(el => !el.disabled && el.getClientRects().length);
    for (const panel of panels) {
        const dialog = panel.firstElementChild;
        dialog.setAttribute('role', 'dialog');
        dialog.setAttribute('aria-modal', 'true');
        dialog.setAttribute('aria-label', dialog.querySelector('h3, .api-panel-title, .history-panel-title')?.textContent || '设置');
        let trigger;
        new MutationObserver(() => {
            if (open(panel)) {
                trigger = document.activeElement;
                const preferred = panel.dataset.initialFocus && panel.querySelector(panel.dataset.initialFocus);
                (preferred || controls(panel)[0])?.focus({ preventScroll: true });
            } else if (trigger?.isConnected) {
                trigger.focus({ preventScroll: true });
                trigger = null;
            }
        }).observe(panel, { attributes: true, attributeFilter: ['class'] });
    }
    document.addEventListener('keydown', event => {
        if (event.key !== 'Tab') return;
        const panel = panels.find(open);
        if (!panel) return;
        const list = controls(panel), first = list[0], last = list.at(-1);
        if (!first) return;
        if (event.shiftKey && (document.activeElement === first || !panel.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && (document.activeElement === last || !panel.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
    });
})();
