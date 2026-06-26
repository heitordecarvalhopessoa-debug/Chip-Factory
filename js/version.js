const GAME_VERSION = "1.0.0";

window.addEventListener('DOMContentLoaded', () => {
    const versionElement = document.createElement('div');
    versionElement.id = 'version-display';
    versionElement.innerText = `VERSION v${GAME_VERSION}`;
    document.body.appendChild(versionElement);
});
