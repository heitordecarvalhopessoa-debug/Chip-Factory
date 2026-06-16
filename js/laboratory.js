if (!document.getElementById('lab-animations-css')) {
    const labStyles = document.createElement('style');
    labStyles.id = 'lab-animations-css';
    labStyles.innerHTML = `
        .lab-research-card {
            transition: transform 0.2s ease-out, background 0.2s, border-color 0.2s !important;
            backface-visibility: hidden;
        }
        .lab-research-card:hover {
            transform: translateX(5px);
            background: rgba(0, 212, 255, 0.05) !important;
            border-color: rgba(0, 212, 255, 0.5) !important;
        }
    `;
    document.head.appendChild(labStyles);
}

function toggleLaboratoryMenu() {
    let overlay = document.getElementById('lab-overlay');
    let menu = document.getElementById('lab-menu');
    
    if (!menu || !overlay) {
        if (overlay) overlay.remove();
        if (menu) menu.remove();

        overlay = document.createElement('div');
        overlay.id = 'lab-overlay';
        Object.assign(overlay.style, {
            position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
            background: 'rgba(0,0,0,0.85)', zIndex: '4999', display: 'none',
            backdropFilter: 'blur(8px)', transition: 'opacity 0.3s ease'
        });
        overlay.onclick = () => toggleLaboratoryMenu();
        document.body.appendChild(overlay);

        menu = document.createElement('div');
        menu.id = 'lab-menu';
        Object.assign(menu.style, {
            position: 'fixed', left: '50%', top: '50%', width: '450px',
            maxWidth: '90vw', background: '#050505', border: '1px solid #00d4ff',
            zIndex: '5000', padding: '30px', borderRadius: '12px',
            boxShadow: '0 0 50px rgba(0,212,255,0.2)', color: 'white',
            transform: 'translate(-50%, -50%)', display: 'none', textAlign: 'center'
        });
        document.body.appendChild(menu);
    }

    const isVisible = menu.style.display === 'block';
    if (isVisible) {
        menu.style.display = 'none';
        overlay.style.display = 'none';
    } else {
        renderLaboratoryMenu();
        overlay.style.display = 'block';
        menu.style.display = 'block';
    }
}

function renderLaboratoryMenu() {
    const menu = document.getElementById('lab-menu');
    
    const itemsToResearch = shopItems.filter(item => item.needsResearch);

    itemsToResearch.sort((a, b) => {
        const aDone = researchedChips.includes(a.id);
        const bDone = researchedChips.includes(b.id);
        if (aDone !== bDone) return aDone ? 1 : -1;
        return a.minLevel - b.minLevel;
    });

    let itemsHtml = itemsToResearch.map(item => {
        const isResearched = researchedChips.includes(item.id);
        const canAfford = money >= item.researchCost;
        const costFormatted = new Intl.NumberFormat('en-US').format(item.researchCost);
        const catColor = typeof getCategoryColor === 'function' ? getCategoryColor(item.category) : '#00d4ff';
        
        return `
            <div class="lab-research-card" style="background: ${isResearched ? 'rgba(0, 255, 136, 0.02)' : 'rgba(255,255,255,0.03)'}; padding: 18px; border-radius: 10px; margin-bottom: 12px; border: 1px solid ${isResearched ? '#00ff8844' : 'rgba(255,255,255,0.08)'}; text-align: left;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 15px;">
                    <div style="flex: 1;">
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                            <span style="font-size: 0.6em; background: ${catColor}33; color: ${catColor}; border: 1px solid ${catColor}66; padding: 1px 5px; border-radius: 3px; font-weight: 900;">${item.category.toUpperCase()}</span>
                            <span style="font-weight: bold; color: ${isResearched ? '#00ff88' : 'white'}; font-size: 1.1em;">${item.name}</span>
                        </div>
                        <div style="font-size: 0.8em; color: #777; line-height: 1.3;">${item.desc}</div>
                    </div>
                    <div style="text-align: right; min-width: 120px;">
                        ${isResearched ? 
                            '<div style="color: #00ff88; font-weight: 900; font-size: 0.7em; letter-spacing: 1px; border: 1px solid #00ff8844; padding: 4px; border-radius: 4px; text-align: center;">COMPLETED</div>' : 
                            `<button onclick="buyResearch('${item.id}', ${item.researchCost})" 
                                ${!canAfford ? 'disabled' : ''} 
                                style="width: 100%; padding: 8px; background: ${canAfford ? '#00d4ff' : '#222'}; border: 1px solid ${canAfford ? '#00d4ff' : '#444'}; border-radius: 4px; color: ${canAfford ? 'black' : '#555'}; font-weight: 900; cursor: ${canAfford ? 'pointer' : 'not-allowed'}; font-size: 0.75em; transition: all 0.2s;">
                                RESEARCH<br>$${costFormatted}
                            </button>`
                        }
                    </div>
                </div>
            </div>
        `;
    }).join('');

    menu.innerHTML = `
        <div style="text-align: center; margin-bottom: 25px;">
            <h2 style="color: #00d4ff; margin: 0; letter-spacing: 4px; font-size: 1.5em; text-shadow: 0 0 15px rgba(0,212,255,0.3);">R&D CENTER</h2>
            <div style="width: 50px; height: 2px; background: #00d4ff; margin: 10px auto;"></div>
            <p style="color: #666; font-size: 0.75em; font-weight: bold; letter-spacing: 1px;">ADVANCED TECHNOLOGY DEVELOPMENT</p>
        </div>
        <div style="max-height: 450px; overflow-y: auto; padding-right: 10px; scrollbar-width: thin; scrollbar-color: #00d4ff #111;">
            ${itemsHtml}
        </div>
        <button onclick="toggleLaboratoryMenu()" style="width: 100%; margin-top: 20px; background: rgba(255,255,255,0.05); border: 1px solid #333; color: #888; padding: 12px; border-radius: 6px; cursor: pointer; font-weight: bold; transition: all 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.1)'; this.style.color='white'" onmouseout="this.style.background='rgba(255,255,255,0.05)'; this.style.color='#888'">CLOSE</button>
    `;
}

function buyResearch(chipId, cost) {
    if (money >= cost) {
        money -= cost;
        researchedChips.push(chipId);

        updateUI(); 
        renderLaboratoryMenu();
        
        if (typeof showFloatingText === 'function') {
            showFloatingText(document.getElementById('lab-menu'), "RESEARCH COMPLETE", "#00ff88");
        }
    }
}
