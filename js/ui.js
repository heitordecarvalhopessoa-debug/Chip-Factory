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
});

function showContextMenu(e, chip) {
    e.preventDefault();
    e.stopPropagation();
    activeMenuChip = chip;
    const menu = document.getElementById('context-menu');
    menu.style.display = 'block';
    menu.style.left = e.clientX + 'px';
    menu.style.top = e.clientY + 'px';
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
    
    if (typeof renderShop === 'function') renderShop();
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
        textShadow: '0 0 8px rgba(0,0,0,0.8)',
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
        el.style.transform = `translateY(-60px) scale(1.4) rotate(${tilt}deg)`;
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
        boxShadow: '0 0 50px rgba(0,0,0,0.9), 0 0 20px rgba(255,0,255,0.2)'
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
    btn.onclick = toggleAchievementMenu;
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

function toggleMainMenu() {
    let overlay = document.getElementById('main-menu-overlay');
    let menu = document.getElementById('main-menu');
    
    if (!menu) {
        overlay = document.createElement('div');
        overlay.id = 'main-menu-overlay';
        Object.assign(overlay.style, {
            position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
            background: 'rgba(0,0,0,0.85)', zIndex: '4999', display: 'none',
            backdropFilter: 'blur(8px)', transition: 'opacity 0.3s ease'
        });
        overlay.onclick = toggleMainMenu;
        document.body.appendChild(overlay);

        menu = document.createElement('div');
        menu.id = 'main-menu';
        Object.assign(menu.style, {
            position: 'fixed', left: '50%', top: '50%', width: '320px',
            background: 'linear-gradient(180deg, #0a0a0a 0%, #000 100%)',
            border: '1px solid #00d4ff', zIndex: '5000', padding: '40px 20px',
            boxShadow: '0 0 40px rgba(0, 212, 255, 0.15)',
            transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            transform: 'translate(-50%, -45%) scale(0.9)',
            display: 'flex', flexDirection: 'column', gap: '10px',
            borderRadius: '4px', opacity: '0', pointerEvents: 'none', textAlign: 'center'
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
        renderMainMenu();
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

function renderMainMenu() {
    const menu = document.getElementById('main-menu');
    menu.innerHTML = `
        <div style="color: #00d4ff; font-weight: 900; letter-spacing: 5px; font-size: 1.2em; margin-bottom: 20px;">SYSTEM CORE</div>
        <button class="main-menu-btn" onclick="toggleMainMenu()">CONTINUE</button>
        <button class="main-menu-btn" onclick="alert('Progress Saved to Local Storage')">SAVE DATA</button>
        <button class="main-menu-btn" style="border-color: #500; margin-top: 10px;" onclick="if(confirm('Format system? All progress will be lost.')) location.reload()">HARD RESET</button>
        <div style="margin-top: 25px; color: #444; font-size: 0.65em; letter-spacing: 2px;">BUILD v1.0.42</div>
        <style>
            .main-menu-btn {
                background: #050505; border: 1px solid #333; color: #aaa;
                padding: 15px; cursor: pointer; font-weight: bold;
                transition: all 0.2s; letter-spacing: 3px; font-size: 0.75em;
            }
            .main-menu-btn:hover {
                border-color: #00d4ff; color: #fff; background: rgba(0, 212, 255, 0.05);
            }
        </style>
    `;
}

function addMenuButton() {
    if (document.getElementById('btn-main-menu')) return;
    const btn = document.createElement('button');
    btn.id = 'btn-main-menu';
    btn.innerHTML = '⚙️';
    btn.title = 'System Settings';
    btn.onclick = toggleMainMenu;
    Object.assign(btn.style, {
        position: 'fixed', top: '20px', right: '70px', zIndex: '3000',
        padding: '10px', background: '#222', border: '1px solid #444',
        borderRadius: '50%', cursor: 'pointer', fontSize: '1.2em'
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
updateUI();
addAchievementButton();
addMenuButton();
