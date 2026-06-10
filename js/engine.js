window.addEventListener('DOMContentLoaded', () => {
    if (typeof loadGame === 'function') loadGame();
});

setInterval(() => {
    chips.forEach(c => {
        c.powered = (c.type === 'charger');
        c.overclocked = false;
        c.element.classList.remove('active-flow');
    });

    connections.forEach(conn => {
        if (conn.type === 'power' && conn.from.powered) {
            conn.to.powered = true;
        }

        if (conn.type === 'power' && conn.from.powered && conn.to.type === 'battery') {
            if ((conn.to.energy || 0) >= 100) conn.to.isCharging = false;
            if ((conn.to.energy || 0) <= 0) conn.to.isCharging = true;
            if (conn.to.isCharging) {
                conn.to.energy = Math.min(100, (conn.to.energy || 0) + 10);
            }
        }

        if (conn.type === 'energy' && ((conn.from.type === 'battery' && conn.from.energy > 0) || (conn.from.type === 'nexus' && conn.from.powered))) {
            conn.to.powered = true;
            if (conn.from.type === 'battery') {
                conn.from.energy -= 2;
                if (conn.from.energy < 0) conn.from.energy = 0;
            }
        }

        if (conn.type === 'speed' && (conn.from.type === 'overclock' || conn.from.type === 'nexus') && conn.from.powered) {
            conn.to.overclocked = true;
        }

        
        if (conn.type === 'data' && conn.from.data > 0 && conn.from.type !== 'splitter' && (conn.from.type !== 'market' || conn.from.powered)) {
            
            let transferAmount = (conn.from.type === 'storage' || conn.from.type === 'market') ? Math.min(conn.from.data, 5) : conn.from.data;
            let spaceAvailable = (conn.to.maxData !== undefined) ? (conn.to.maxData - conn.to.data) : Infinity;
            let actualTransfer = Math.min(transferAmount, spaceAvailable);

            if ((conn.to.type === 'seller' || (conn.to.type === 'market' && conn.to.powered)) && transferAmount > 0) {
                conn.from.data -= transferAmount;
                processSale(transferAmount, conn.to, conn.from.type);
            } else if (conn.to.data !== undefined && actualTransfer > 0) {
                conn.from.data -= actualTransfer;
                conn.to.data += actualTransfer;
                conn.to.element.classList.add('active-flow');
            }
        }
    });

    chips.filter(c => c.type === 'autosell' && c.active).forEach(autoSellChip => {
        chips.forEach(targetChip => {
            if (targetChip.data > 0 && targetChip !== autoSellChip) {
                const amount = targetChip.data;
                targetChip.data = 0;
                processSale(amount, autoSellChip, targetChip.type);
                autoSellChip.element.classList.add('active-flow');
            }
        });
    });

    chips.filter(c => c.type === 'splitter' && c.data > 0).forEach(splitter => {
        const outConns = connections.filter(conn => conn.from === splitter && conn.type === 'data');
        if (outConns.length > 0) {
            outConns.forEach(conn => {
                if (splitter.data > 0) {
                    
                    const amountToSplit = 1;
                    splitter.data -= amountToSplit;
                    if (conn.to.type === 'seller') {
                        processSale(amountToSplit, conn.to, 'splitter'); 
                    } else if (conn.to.type === 'market' && conn.to.powered) {
                        processSale(amountToSplit, conn.to, 'splitter');
                    } else {
                        conn.to.data += amountToSplit;
                        conn.to.element.classList.add('active-flow');
                    }
                }
            });
        }
    });

    chips.filter(c => (c.type === 'giver' || c.type === 'miner') && c.powered).forEach(producer => {
        const baseRate = producer.type === 'miner' ? 3 : 1;
        const produceAmount = producer.overclocked ? baseRate * 2 : baseRate;
        producer.data += produceAmount;
        producer.element.classList.add('active-flow');
        showFloatingText(producer.element, `+${produceAmount} ${producer.type === 'miner' ? 'Crypto' : 'Data'}`, producer.overclocked ? "#ffff00" : (producer.type === 'miner' ? "#fbbf24" : "#0077ff"));
    });

    chips.forEach(c => {
        const status = c.element.querySelector('.status');
        if (c.type === 'giver') {
            status.innerHTML = `<div class="status-dot ${c.powered ? 'on' : 'off'}"></div> ${c.data}d`;
        } else if (c.type === 'charger') {
            status.innerHTML = `<div class="status-dot on"></div> OK`;
        } else if (c.type === 'overclock') {
            status.innerHTML = `<div class="status-dot ${c.powered ? 'on' : 'off'}"></div> ${c.powered ? 'BOOST' : 'IDLE'}`;
        } else if (c.type === 'battery') {
            status.innerHTML = `<div class="status-dot ${c.energy > 0 ? 'on' : 'off'}"></div> ${Math.floor(c.energy)}%`;
            if (!c.isCharging && c.energy > 0) status.innerHTML += " [DISCH]";
            if (c.isCharging && c.energy < 100) status.innerHTML += " [CHRG]";
            const bar = document.getElementById(`energy-${c.id}`);
            if (bar) bar.style.width = c.energy + '%';
        } else if (c.type === 'seller') {
            status.innerHTML = `<div class="status-dot on"></div> SELL`;
        } else if (c.type === 'storage') {
            status.innerHTML = `<div class="status-dot on"></div> ${c.data}/${c.maxData}`;
            const bar = document.getElementById(`data-bar-${c.id}`);
            if (bar) bar.style.width = Math.min(100, (c.data / c.maxData) * 100) + '%';
        } else if (c.type === 'splitter') {
            status.innerHTML = `<div class="status-dot on"></div> ${c.data}d`;
        } else if (c.type === 'processor') {
            status.innerHTML = `<div class="status-dot ${c.powered ? 'on' : 'off'}"></div> ${c.data}d`;
        } else if (c.type === 'miner') {
            status.innerHTML = `<div class="status-dot ${c.powered ? 'on' : 'off'}"></div> ${c.data}c`;
        } else if (c.type === 'market') {
            status.innerHTML = `<div class="status-dot ${c.powered ? 'on' : 'off'}"></div> ${c.data}d`;
        } else if (c.type === 'autosell') {
            status.innerHTML = c.active ? 'COLLECTING' : 'IDLE';
        }
    });

    updateUI();
    renderConnections();
    checkAchievements();

    if (typeof saveGame === 'function') saveGame();
}, 1000);

function checkAchievements() {
    achievements.forEach(ach => {
        if (!ach.achieved && ach.condition()) {
            ach.achieved = true;
            if (typeof showAchievementNotification === 'function') {
                showAchievementNotification(ach);
            }
        }
    });
}

function processSale(amount, sellerChip, sourceChipType) {
    let valuePerUnit = 1;
    if (sourceChipType === 'miner') valuePerUnit = 10;
    if (sourceChipType === 'processor') valuePerUnit = 5;
    
    const bonus = (sellerChip.type === 'market' || sourceChipType === 'market') ? 2.5 : 1;
    const profit = Math.floor(amount * valuePerUnit * bonus);
    money += profit;
    xp += profit;
    
    sellerChip.element.classList.add('active-flow');
    showFloatingText(sellerChip.element, `+$${profit}`, "#00ff66");

    if (xp >= xpTarget) {
        level++;
        xp = 0;
        xpTarget = Math.floor(xpTarget * 2.5);
        showFloatingText(sellerChip.element, "LEVEL UP!", "#ff00ff");

        const newUnlocks = shopItems.filter(item => item.minLevel === level);
        if (typeof showLevelUpNotification === 'function') {
            showLevelUpNotification(level, newUnlocks);
        }
    }
}
