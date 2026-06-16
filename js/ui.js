const uiStyles = document.createElement('style');
uiStyles.innerHTML = `
    @keyframes level-up-glow {
        0% { box-shadow: 0 0 20px rgba(255,0,255,0.2), 0 0 50px rgba(0,0,0,0.9); transform: translate(-50%, -50%) scale(1); }
        50% { box-shadow: 0 0 40px rgba(255,0,255,0.6), 0 0 50px rgba(0,0,0,0.9); transform: translate(-50%, -50%) scale(1.05); }
        100% { box-shadow: 0 0 20px rgba(255,0,255,0.2), 0 0 50px rgba(0,0,0,0.9); transform: translate(-50%, -50%) scale(1); }
    }
    @keyframes active-pulse {
        0% { filter: brightness(1); }
        50% { filter: brightness(1.4) drop-shadow(0 0 8px currentColor); }
        100% { filter: brightness(1); }
    }
    .active-flow {
        animation: active-pulse 0.8s infinite ease-in-out;
    }
    .stat-item { transition: transform 0.2s ease; cursor: default; }
    .stat-item:hover { transform: translateY(-2px); }
    
    .tool-item { 
        transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) !important;
        border: 1px solid rgba(255,255,255,0.05) !important;
        background: rgba(255,255,255,0.02) !important;
    }
    .tool-item:hover { transform: translateY(-3px); background: rgba(255,255,255,0.08) !important; border-color: rgba(255,255,255,0.2) !important; }
    .tool-item.active { 
        border-color: #00ff88 !important; 
        box-shadow: 0 0 15px rgba(0,255,136,0.2) !important;
        background: rgba(0,255,136,0.1) !important;
    }

    @keyframes chip-hop {
        0% { transform: scale(1); }
        50% { transform: scale(1.1) translateY(-10px); }
        100% { transform: scale(1); }
    }
    .chip-hop { animation: chip-hop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }

    .chip.selected {
        outline: 3px solid #00ff88 !important;
        outline-offset: 4px;
        box-shadow: 0 0 25px rgba(0, 255, 136, 0.6) !important;
        z-index: 2000 !important;
        animation: active-pulse 1s infinite alternate ease-in-out;
        filter: brightness(1.2);
    }

    #context-menu {
        background: rgba(10, 10, 10, 0.95) !important;
        border: 1px solid rgba(255, 255, 255, 0.1) !important;
        box-shadow: 0 15px 40px rgba(0,0,0,0.8) !important;
        padding: 6px !important;
        border-radius: 10px !important;
        min-width: 170px !important;
        backdrop-filter: blur(12px) !important;
        transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.1), opacity 0.15s !important;
        transform-origin: top left;
    }
    #context-menu div {
        padding: 10px 14px !important;
        font-size: 0.85em !important;
        font-weight: 700 !important;
        color: #999 !important;
        cursor: pointer !important;
        border-radius: 6px !important;
        transition: all 0.15s !important;
        display: flex !important;
        align-items: center !important;
        gap: 12px !important;
        letter-spacing: 0.5px !important;
    }
    #context-menu div:hover {
        background: rgba(255, 255, 255, 0.05) !important;
        color: #fff !important;
        transform: translateX(4px);
    }
    #menu-delete:hover { color: #ff4444 !important; background: rgba(255, 68, 68, 0.1) !important; }

    .status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        display: inline-block;
        margin-right: 6px;
        box-shadow: 0 0 8px currentColor;
    }
    .status-dot.on { background-color: #00ff88; color: #00ff88; }
    .status-dot.off { background-color: #ff4444; color: #ff4444; }
    
    .energy-bar-container {
        width: 70%;
        height: 4px;
        background: rgba(0,0,0,0.6);
        border-radius: 10px;
        margin-top: 8px;
        overflow: hidden;
        border: 1px solid rgba(255,255,255,0.05);
    }
    .energy-bar-fill {
        height: 100%;
        transition: width 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
`;
document.head.appendChild(uiStyles);

let mouseX = 0, mouseY = 0;
let activeMenuChip = null;
let lastMoney = money;
let lastTotalData = 0;
let moneyFlashTimeout = null;

window.addEventListener('mousemove', (e) => {
    const rect = gridElement.getBoundingClientRect();
    mouseX = (e.clientX - rect.left) / zoom;
    mouseY = (e.clientY - rect.top) / zoom;

    if (pendingPort) renderConnections();
    updatePlacementGhost();
});

function updatePlacementGhost() {
    let ghost = document.getElementById('placement-ghost');
    
    let w = 4, h = 4;
    let isMoving = selectedTool === 'move' && firstSelection;
    const buildTools = shopItems.map(i => i.id);
    const isBuilding = selectedTool && buildTools.includes(selectedTool);

    if (!isBuilding && !isMoving) {
        if (ghost) ghost.remove();
        return;
    }

    if (isMoving) {
        w = firstSelection.bounds.w;
        h = firstSelection.bounds.h;
    }

    if (!ghost) {
        ghost = document.createElement('div');
        ghost.id = 'placement-ghost';
        Object.assign(ghost.style, {
            position: 'absolute',
            pointerEvents: 'none',
            zIndex: '1000',
            border: '2px dashed',
            boxSizing: 'border-box',
            borderRadius: '4px',
            transition: 'transform 0.05s ease-out'
        });
        gridElement.appendChild(ghost);
    }

    const gridX = Math.floor(mouseX / 52);
    const gridY = Math.floor(mouseY / 52);
    
    // Garante que o ghost fique dentro dos limites
    const clampedX = Math.min(Math.max(0, gridX), gridSize - 4);
    const clampedY = Math.min(Math.max(0, gridY), gridSize - 4);
    const index = clampedY * gridSize + clampedX;

    const free = isAreaFree(index, 4, 4);
    
    ghost.style.left = (clampedX * 52) + 'px';
    ghost.style.top = (clampedY * 52) + 'px';
    ghost.style.borderColor = free ? '#00ff88' : '#ff4444';
    ghost.style.background = free ? 'rgba(0, 255, 136, 0.15)' : 'rgba(255, 68, 68, 0.15)';
    ghost.style.boxShadow = free ? '0 0 15px rgba(0, 255, 136, 0.3)' : '0 0 15px rgba(255, 68, 68, 0.3)';
}

function getPlacementCoords(w = 4, h = 4) {
    const gridX = Math.floor(mouseX / 52);
    const gridY = Math.floor(mouseY / 52);
    const clampedX = Math.min(Math.max(0, gridX), gridSize - w);
    const clampedY = Math.min(Math.max(0, gridY), gridSize - h);
    return { index: clampedY * gridSize + clampedX };
}

function showContextMenu(e, chip) {
    e.preventDefault();
    e.stopPropagation();
    activeMenuChip = chip;
    const menu = document.getElementById('context-menu');
    menu.style.display = 'block';
    menu.style.left = e.clientX + 'px';
    menu.style.top = e.clientY + 'px';
    menu.style.opacity = '0';
    requestAnimationFrame(() => { menu.style.opacity = '1'; menu.style.transform = 'scale(1)'; });
}

document.getElementById('menu-move').onclick = () => {
    if (activeMenuChip) {
        selectTool('move');
        firstSelection = activeMenuChip;
        document.querySelectorAll('.chip').forEach(c => c.classList.remove('selected'));
        activeMenuChip.element.classList.add('selected');
    }
    document.getElementById('context-menu').style.display = 'none';
};

document.getElementById('menu-delete').onclick = () => {
    if (activeMenuChip) {
        removeChipAt(activeMenuChip.occupiedIndices[0]);
    }
    document.getElementById('context-menu').style.display = 'none';
};

function updateUI() {
    const moneyEl = document.getElementById('money');
    const dataEl = document.getElementById('data-count');
    const barFill = document.getElementById('xp-bar-fill');

    if (money > lastMoney) {
        moneyEl.style.color = "#00ff88";
        moneyEl.style.transform = "scale(1.1)";
        moneyEl.style.transition = "all 0.1s ease-out";
        clearTimeout(moneyFlashTimeout);
        moneyFlashTimeout = setTimeout(() => {
            moneyEl.style.color = "white";
            moneyEl.style.transform = "scale(1)";
        }, 400);
    }
    lastMoney = money;

    moneyEl.innerText = `$${new Intl.NumberFormat('en-US').format(money)}`;
    document.getElementById('level').innerText = level;
    document.getElementById('xp').innerText = xp;
    document.getElementById('xp-target').innerText = xpTarget;
    
    const xpPercent = Math.min(100, (xp / xpTarget) * 100);
    barFill.style.width = xpPercent + '%';
    barFill.style.transition = "width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)";
    barFill.style.boxShadow = `0 0 ${10 + (xpPercent/10)}px #ff00ff`;

    const totalData = chips.reduce((acc, c) => acc + (c.data || 0), 0);
    if (totalData !== lastTotalData) {
        dataEl.innerText = totalData;
        dataEl.style.color = totalData > 50 ? "#ff9900" : "#00ff88";
        dataEl.style.transform = "scale(1.2)";
        setTimeout(() => dataEl.style.transform = "scale(1)", 150);
        lastTotalData = totalData;
    }
    
    const prestigeInfo = document.getElementById('prestige-boost-info');
    if (prestigeInfo) {
        if (prestigeMultiplier > 1) {
            prestigeInfo.style.display = 'block';
            document.getElementById('prestige-boost-val').innerText = Math.round((prestigeMultiplier - 1) * 100);
        } else {
            prestigeInfo.style.display = 'none';
        }
    }

    const labBtn = document.getElementById('btn-lab');
    if (labBtn) {
        labBtn.style.display = level >= 5 ? 'block' : 'none';
    }

    if (typeof renderShop === 'function') renderShop();
    if (typeof updateGridHighlighting === 'function') updateGridHighlighting();
}

function showFloatingText(parent, text, color) {
    const el = document.createElement('div');
    el.innerText = text;
    Object.assign(el.style, {
        position: 'absolute',
        color: color,
        fontWeight: '900',
        pointerEvents: 'none',
        zIndex: '100',
        fontSize: '1.2em',
        textShadow: '0 2px 10px rgba(0,0,0,0.9)',
        transition: 'all 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
    });
    
    const rect = parent.getBoundingClientRect();
    const gridRect = gridElement.getBoundingClientRect();
    
    const spread = (Math.random() - 0.5) * 40;
    el.style.left = (rect.left - gridRect.left + rect.width / 2) / zoom + spread + 'px';
    el.style.top = (rect.top - gridRect.top - 20) / zoom + 'px';
    
    gridElement.appendChild(el);
    
    requestAnimationFrame(() => {
        const tilt = (Math.random() - 0.5) * 20;
        el.style.transform = `translateY(-100px) scale(1.8) rotate(${tilt}deg)`;
        el.style.opacity = '0';
    });
    setTimeout(() => el.remove(), 800);
}

function showLevelUpNotification(newLevel, unlockedItems) {
    const notification = document.createElement('div');
    
    let unlocksHtml = '';
    if (unlockedItems.length > 0) {
        unlocksHtml = `
            <div style="margin-top: 15px; font-size: 0.9em; opacity: 0.9; color: #eee; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 10px;">
                <div style="margin-bottom: 5px; color: #aaa; font-size: 0.8em; letter-spacing: 1px;">NEW TECHNOLOGIES UNLOCKED:</div>
                ${unlockedItems.map(item => `<span style="color: #00ff88; font-weight: bold;">${item.name}</span>`).join(' • ')}
            </div>
        `;
    }

    notification.innerHTML = `
        <div style="font-size: 2.2em; font-weight: 900; color: #ff00ff; text-shadow: 0 0 15px rgba(255,0,255,0.6); letter-spacing: 4px;">
            LEVEL ${newLevel}
        </div>
        <div style="font-size: 0.8em; color: #00d4ff; font-weight: bold; margin-top: 5px; letter-spacing: 2px;">SYSTEM UPDATED</div>
        ${unlocksHtml}
    `;

    Object.assign(notification.style, {
        position: 'fixed',
        top: '30%',
        left: '50%',
        transform: 'translate(-50%, -50%) scale(0.7)',
        background: 'rgba(10, 10, 10, 0.95)',
        border: '2px solid #ff00ff',
        padding: '30px 60px',
        borderRadius: '2px',
        textAlign: 'center',
        zIndex: '5000',
        pointerEvents: 'none',
        opacity: '0',
        transition: 'all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        boxShadow: '0 0 50px rgba(0,0,0,0.9), 0 0 20px rgba(255,0,255,0.2)',
        animation: 'level-up-glow 2s infinite ease-in-out'
    });

    document.body.appendChild(notification);

    requestAnimationFrame(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translate(-50%, -50%) scale(1)';
    });

    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translate(-50%, -50%) scale(1.1)';
        setTimeout(() => notification.remove(), 600);
    }, 3500);
}

function showAchievementNotification(ach) {
    const notification = document.createElement('div');
    notification.innerHTML = `
        <div style="color: #ffd700; font-size: 0.7em; font-weight: bold; letter-spacing: 2px; margin-bottom: 5px;">🏆 ACHIEVEMENT UNLOCKED</div>
        <div style="font-size: 1.4em; font-weight: 900; color: white;">${ach.title}</div>
        <div style="font-size: 0.85em; color: #aaa; margin-top: 5px;">${ach.desc}</div>
    `;

    Object.assign(notification.style, {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        background: 'rgba(20, 20, 20, 0.95)',
        borderLeft: '4px solid #ffd700',
        padding: '20px',
        minWidth: '250px',
        zIndex: '6000',
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
        transform: 'translateX(120%)',
        transition: 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
    });

    document.body.appendChild(notification);
    requestAnimationFrame(() => notification.style.transform = 'translateX(0)');

    setTimeout(() => {
        notification.style.transform = 'translateX(120%)';
        setTimeout(() => notification.remove(), 600);
    }, 5000);
}

function toggleAchievementMenu() {
    let overlay = document.getElementById('achievement-overlay');
    let menu = document.getElementById('achievement-menu');
    
    if (!menu) {
        overlay = document.createElement('div');
        overlay.id = 'achievement-overlay';
        Object.assign(overlay.style, {
            position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
            background: 'rgba(0,0,0,0.85)', zIndex: '3999', display: 'none',
            backdropFilter: 'blur(6px)', transition: 'opacity 0.3s ease'
        });
        overlay.onclick = toggleAchievementMenu;
        document.body.appendChild(overlay);

        menu = document.createElement('div');
        menu.id = 'achievement-menu';
        Object.assign(menu.style, {
            position: 'fixed',
            left: '50%',
            top: '50%',
            width: '650px',
            maxWidth: '90vw',
            maxHeight: '80vh',
            background: 'linear-gradient(180deg, #111 0%, #050505 100%)',
            border: '1px solid #444',
            zIndex: '4000',
            padding: '30px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.8), inset 0 0 20px rgba(255,215,0,0.05)',
            transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            transform: 'translate(-50%, -45%) scale(0.9)',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: '12px',
            opacity: '0',
            pointerEvents: 'none'
        });
        document.body.appendChild(menu);
    }

    const isVisible = menu.style.opacity === '1';
    if (isVisible) {
        menu.style.opacity = '0';
        menu.style.transform = 'translate(-50%, -45%) scale(0.9)';
        menu.style.pointerEvents = 'none';
        overlay.style.opacity = '0';
        setTimeout(() => overlay.style.display = 'none', 300);
    } else {
        renderAchievementMenu();
        overlay.style.display = 'block';
        overlay.style.opacity = '0';
        requestAnimationFrame(() => {
            overlay.style.opacity = '1';
            menu.style.opacity = '1';
            menu.style.transform = 'translate(-50%, -50%) scale(1)';
            menu.style.pointerEvents = 'auto';
        });
    }
}

function renderAchievementMenu() {
    const menu = document.getElementById('achievement-menu');
    if (!menu) return;

    const total = achievements.length;
    const completed = achievements.filter(a => a.achieved).length;

    menu.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 10px;">
            <h2 style="margin:0; font-size: 1.6em; color: #ffd700; text-shadow: 0 0 15px rgba(255,215,0,0.4); letter-spacing: 2px;">MERIT ARCHIVE</h2>
            <button onclick="toggleAchievementMenu()" style="background:none; border:none; color:#555; cursor:pointer; font-size: 1.8em; transition:color 0.2s;" onmouseover="this.style.color='white'" onmouseout="this.style.color='#555'">&times;</button>
        </div>
        
        <div style="margin-bottom: 25px; font-size: 0.85em; color: #888; border-bottom: 1px solid #333; padding-bottom: 20px;">
            CAREER STATUS: <span style="color:#ffd700; font-weight:bold;">${completed} / ${total} COMPLETED</span>
            <div style="width:100%; height:4px; background:#222; margin-top:8px; border-radius:2px; overflow:hidden;">
                <div style="width:${(completed/total)*100}%; height:100%; background:#ffd700; box-shadow: 0 0 10px #ffd700;"></div>
            </div>
        </div>

        <div style="flex:1; overflow-y:auto; display:grid; grid-template-columns: 1fr 1fr; gap:10px; padding-right: 10px; scrollbar-width: thin;">
            ${achievements.map(ach => {
                let progressHtml = '';
                if (!ach.achieved && ach.progressCondition) {
                    const { current, target } = ach.progressCondition();
                    const percent = Math.min(100, Math.floor((current / target) * 100));
                    progressHtml = `
                        <div style="margin-top: 10px;">
                            <div style="display:flex; justify-content:space-between; font-size: 0.7em; color: #666; margin-bottom: 4px;">
                                <span>PROGRESS</span>
                                <span>${percent}%</span>
                            </div>
                            <div style="width:100%; height:3px; background:#111; border-radius:2px; overflow:hidden;">
                                <div style="width:${percent}%; height:100%; background:#444;"></div>
                            </div>
                        </div>
                    `;
                }

                return `
                    <div style="background: ${ach.achieved ? 'linear-gradient(135deg, rgba(255,215,0,0.1) 0%, rgba(0,0,0,0) 100%)' : '#1a1a1a'}; 
                                border: 1px solid ${ach.achieved ? '#ffd700' : '#333'}; 
                                padding: 12px; border-radius: 6px; transition: all 0.3s;
                                position: relative; overflow: hidden;
                                opacity: ${ach.achieved ? '1' : '0.7'}">
                        
                        ${ach.achieved ? '<div style="position:absolute; right:-5px; top:-5px; font-size:2.5em; opacity:0.1; color:#ffd700; pointer-events:none;">🏆</div>' : ''}

                        <div style="display:flex; align-items:center; gap:10px; margin-bottom: 5px;">
                            <div style="font-size: 1em;">${ach.achieved ? '✅' : '🔒'}</div>
                            <div>
                                <div style="font-weight: 900; font-size: 0.8em; letter-spacing: 0.5px; color: ${ach.achieved ? '#ffd700' : '#eee'};">
                                    ${ach.title.toUpperCase()}
                                </div>
                                <div style="font-size: 0.7em; color: #999; line-height: 1.1; margin-top: 2px;">${ach.desc}</div>
                            </div>
                        </div>
                        ${progressHtml}
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

function addAchievementButton() {
    if (document.getElementById('btn-achievements')) return;
    const btn = document.createElement('button');
    btn.id = 'btn-achievements';
    btn.innerHTML = '🏆';
    btn.title = 'Achievements';
    btn.onclick = () => toggleAchievementMenu();
    Object.assign(btn.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: '3000',
        padding: '10px',
        background: '#222',
        border: '1px solid #444',
        borderRadius: '50%',
        cursor: 'pointer',
        fontSize: '1.2em'
    });
    document.body.appendChild(btn);
}

function addPrestigeButton() {
    if (document.getElementById('btn-prestige')) return;
    const btn = document.createElement('button');
    btn.id = 'btn-prestige';
    btn.innerHTML = '⚛️';
    btn.title = 'Prestige System';
    btn.onclick = () => togglePrestigeMenu();
    Object.assign(btn.style, {
        position: 'fixed',
        top: '75px',
        right: '20px',
        zIndex: '3000',
        padding: '10px',
        background: '#222',
        border: '1px solid #ff00ff',
        borderRadius: '50%',
        cursor: 'pointer',
        fontSize: '1.2em',
        boxShadow: '0 0 10px rgba(255, 0, 255, 0.2)'
    });
    document.body.appendChild(btn);
}

function addLaboratoryButton() {
    if (document.getElementById('btn-lab')) return;
    const btn = document.createElement('button');
    btn.id = 'btn-lab';
    btn.innerHTML = '🧪';
    btn.title = 'Research Lab';
    btn.onclick = () => toggleLaboratoryMenu();
    Object.assign(btn.style, {
        position: 'fixed',
        top: '130px',
        right: '20px',
        zIndex: '3000',
        padding: '10px',
        background: '#222',
        border: '1px solid #00d4ff',
        borderRadius: '50%',
        width: '45px',
        height: '45px',
        cursor: 'pointer',
        fontSize: '1.2em',
        boxShadow: '0 0 10px rgba(0, 212, 255, 0.2)',
        display: 'none'
    });
    document.body.appendChild(btn);
}

window.addEventListener('contextmenu', (e) => e.preventDefault());

document.addEventListener('click', (e) => {
    const menu = document.getElementById('context-menu');
    if (!e.target.closest('#context-menu')) menu.style.display = 'none';
});

window.addEventListener('contextmenu', (e) => e.preventDefault());

const ws = document.getElementById('workspace');
ws.onmousedown = (e) => {
    if(selectedTool === 'pan') {
        isPanning = true;
        document.body.style.cursor = 'grabbing';
    }
};
window.onmouseup = () => {
    isPanning = false;
    if (selectedTool === 'pan') document.body.style.cursor = 'grab';
};
window.addEventListener('mousemove', (e) => {
    if (isPanning && selectedTool === 'pan') {
        camX += e.movementX;
        camY += e.movementY;
        updateViewport();
    }
});

ws.onwheel = (e) => {
    e.preventDefault();
    changeZoom(e.deltaY > 0 ? -0.1 : 0.1);
};

selectTool('pan');
addAchievementButton();
addPrestigeButton();
addLaboratoryButton();
updateUI();
