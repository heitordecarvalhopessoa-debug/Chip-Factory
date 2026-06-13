const PRESTIGE_REQ_LEVEL = 10;

function togglePrestigeMenu() {
    let overlay = document.getElementById('prestige-overlay');
    let menu = document.getElementById('prestige-menu');
    
    if (!menu) {
        overlay = document.createElement('div');
        overlay.id = 'prestige-overlay';
        Object.assign(overlay.style, {
            position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
            background: 'rgba(5,0,10,0.9)', zIndex: '4999', display: 'none',
            backdropFilter: 'blur(8px)', transition: 'opacity 0.3s ease'
        });
        overlay.onclick = togglePrestigeMenu;
        document.body.appendChild(overlay);

        menu = document.createElement('div');
        menu.id = 'prestige-menu';
        Object.assign(menu.style, {
            position: 'fixed', left: '50%', top: '50%', width: '450px',
            maxWidth: '90vw', background: '#050505', border: '1px solid #ff00ff',
            zIndex: '5000', padding: '30px', borderRadius: '12px',
            boxShadow: '0 0 60px rgba(255,0,255,0.15), inset 0 0 20px rgba(255,0,255,0.05)', color: 'white',
            transform: 'translate(-50%, -50%)', display: 'none', textAlign: 'center'
        });
        document.body.appendChild(menu);
    }

    const isVisible = menu.style.display === 'block';
    if (isVisible) {
        menu.style.display = 'none';
        overlay.style.display = 'none';
    } else {
        renderPrestigeMenu();
        overlay.style.display = 'block';
        menu.style.display = 'block';
    }
}

function calculatePotentialPoints() {
    if (level < PRESTIGE_REQ_LEVEL) return 0;
    return Math.floor((level - 9) + (money / 5000));
}

function renderPrestigeMenu() {
    const menu = document.getElementById('prestige-menu');
    const potential = calculatePotentialPoints();
    const canPrestige = level >= PRESTIGE_REQ_LEVEL;

    menu.innerHTML = `
        <h2 style="color: #ff00ff; margin-top: 0; letter-spacing: 3px;">SYSTEM RESET</h2>
        <p style="color: #aaa; font-size: 0.9em;">Rebuild the factory from scratch to gain permanent quantum stability.</p>
        
        <div style="background: rgba(255,0,255,0.03); padding: 25px; border-radius: 12px; margin: 20px 0; border: 1px solid rgba(255,0,255,0.1);">
            <div style="font-size: 0.8em; color: #888;">CURRENT BONUS</div>
            <div style="font-size: 1.5em; color: #00ff88; font-weight: bold;">x${prestigeMultiplier.toFixed(2)} Efficiency</div>
            <div style="font-size: 0.8em; color: #888; margin-top: 10px;">POTENTIAL POINTS</div>
            <div style="font-size: 2em; color: #ff00ff; font-weight: 900;">+${potential}</div>
        </div>

        <div style="text-align: left; font-size: 0.85em; margin-bottom: 20px;">
            <div style="color: ${canPrestige ? '#00ff88' : '#ff4444'}">
                ${canPrestige ? '✅' : '❌'} Reached Level ${PRESTIGE_REQ_LEVEL}
            </div>
            <div style="color: #888; margin-top: 5px;">
                ℹ️ Each point increases all income and XP gain by 10%.
            </div>
        </div>

        <button id="prestige-confirm" 
            ${!canPrestige ? 'disabled' : ''} 
            style="width: 100%; padding: 15px; border: none; border-radius: 4px; 
            background: ${canPrestige ? 'linear-gradient(45deg, #ff00ff, #8b5cf6)' : '#333'}; 
            color: white; font-weight: bold; cursor: ${canPrestige ? 'pointer' : 'not-allowed'};
            transition: transform 0.2s;"
            onclick="executePrestige()">
            ASCEND NOW
        </button>
        <p style="font-size: 0.7em; color: #555; margin-top: 10px;">This will reset money, chips, and levels.</p>
    `;
}

function executePrestige() {
    const points = calculatePotentialPoints();
    if (points <= 0) return;

    if (confirm("Are you sure? All current progress will be lost in exchange for permanent power.")) {
        prestigePoints += points;
        prestigeMultiplier = 1 + (prestigePoints * 0.1);

        money = 100;
        level = 1;
        xp = 0;
        xpTarget = 100;

        chips.forEach(chip => {
            if (chip.element) chip.element.remove();
        });
        chips = [];
        
        connections = [];
        const connLayer = document.getElementById('connections-layer');
        if (connLayer) connLayer.innerHTML = '';

        togglePrestigeMenu();
        updateUI();
        
        if (typeof renderConnections === 'function') renderConnections();
        
        const overlay = document.createElement('div');
        Object.assign(overlay.style, {
            position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
            background: 'white', zIndex: '10000', pointerEvents: 'none', opacity: '1',
            transition: 'opacity 1s ease-out'
        });
        document.body.appendChild(overlay);
        setTimeout(() => {
            overlay.style.opacity = '0';
            setTimeout(() => overlay.remove(), 1000);
        }, 100);

        if (typeof showFloatingText === 'function') {
            showFloatingText(document.body, "SYSTEM EVOLVED", "#ff00ff");
        }
    }
}
