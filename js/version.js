const GAME_VERSION = "0.3.1";

window.addEventListener('DOMContentLoaded', () => {
    const versionElement = document.createElement('div');
    versionElement.id = 'version-display';
    versionElement.innerText = `BUILD v${GAME_VERSION}`;
    document.body.appendChild(versionElement);
});
