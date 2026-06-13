document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    if (e.key === 'Control') {
        selectTool('pan');
    } else if (e.key === 'Shift') {
        selectTool('link');
    } else if (e.key.toLowerCase() === 'z') {
        selectTool('move');
    }
});
