function focusSlideNavigation() {
    const slide = document.querySelector('.slide.active');
    slide?.focus({preventScroll: true});
}

// Within a form, arrows edit the field. Escape hands focus back to the slide.
function linkFrameKeys(frame) {
    try {
        const doc = frame.contentDocument;
        if (!doc || doc.documentElement.hasAttribute('data-stage-keys')) return;
        doc.documentElement.setAttribute('data-stage-keys', '');
        doc.addEventListener('keydown', (event) => {
            if (!shower.isFullMode || event.defaultPrevented || event.isComposing) return;
            if (!['Escape', 'PageUp', 'PageDown'].includes(event.key)) return;
            if (event.key === 'Escape' && doc.querySelector('dialog[open]')) return;
            event.preventDefault();
            if (event.key === 'PageDown') shower.next();
            if (event.key === 'PageUp') shower.prev();
            focusSlideNavigation();
        });
        doc.querySelectorAll('iframe').forEach(watchFrame);
    } catch { /* file:// can isolate local frames; the slide margin remains clickable. */ }
}
function watchFrame(frame) {
    frame.addEventListener('load', () => linkFrameKeys(frame));
    linkFrameKeys(frame);
}
document.querySelectorAll('iframe').forEach(watchFrame);
document.querySelectorAll('.slide').forEach(slide => {
    // Clicking Ribbon's ::after focuses its originating slide.
    slide.tabIndex = 0;
    if (!slide.classList.contains('demo')) return;
    const next = document.createElement('button');
    next.className = 'continue';
    next.textContent = '→';
    next.title = 'Следующий слайд';
    next.setAttribute('aria-label', next.title);
    next.addEventListener('click', (event) => {
        event.preventDefault();
        shower.next();
    });
    slide.append(next);
});
// Shower leaves focusable elements in charge of their own keystrokes.
document.addEventListener('keydown', (event) => {
    if (!event.target.matches('.slide') || !shower.isFullMode) return;
    if (event.defaultPrevented || event.ctrlKey || event.altKey || event.metaKey) return;
    const actions = {
        ArrowLeft: 'prev', ArrowUp: 'prev', PageUp: 'prev',
        ArrowRight: 'next', ArrowDown: 'next', PageDown: 'next',
        Home: 'first', End: 'last', Escape: 'exitFullMode',
        Enter: event.shiftKey ? 'prev' : 'next', ' ': event.shiftKey ? 'prev' : 'next'
    };
    const action = actions[event.key];
    if (!action) return;
    event.preventDefault();
    shower[action]();
    if (shower.isFullMode) focusSlideNavigation();
}, true);

shower.addEventListener('slidechange', () => {
    if (!shower.isFullMode) return;
    const active = document.activeElement;
    if (active && active !== document.body && !active.closest('.slide.active')) {
        active.blur();
        window.focus();
    }
});

// Mount the animated guest scenes on entry. Leaving the slide also stops their sound.
function syncLiveScene() {
    for (const frame of document.querySelectorAll('.slide > iframe[data-src]')) {
        const playing = shower.isFullMode && frame.closest('.slide').classList.contains('active');
        if (playing && !frame.hasAttribute('src')) frame.src = frame.dataset.src;
        if (!playing && frame.hasAttribute('src')) frame.removeAttribute('src');
    }
}
for (const event of ['start','slidechange','modechange']) shower.addEventListener(event,syncLiveScene);
if (shower.isStarted) syncLiveScene();
