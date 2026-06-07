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

        if (conn.type === 'speed' && conn.from.type === 'overclock' && conn.from.powered) {
            conn.to.overclocked = true;
        }


        if (conn.type === 'data' && conn.from.type !== 'splitter' && conn.from.data > 0) {
            if (conn.to.type === 'seller') {
                const amount = conn.from.data;
                conn.from.data = 0;
                processSale(amount, conn.to, conn.from.type);
            } else if (conn.to.type === 'storage' || conn.to.type === 'splitter') {
                conn.to.data += conn.from.data;
                conn.from.data = 0;
                conn.to.element.classList.add('active-flow');
            }
        }
    });

    chips.filter(c => c.type === 'splitter' && c.data > 0).forEach(splitter => {
        const outConns = connections.filter(conn => conn.from === splitter && conn.type === 'data');
        if (outConns.length > 0) {
            outConns.forEach(conn => {
                if (splitter.data > 0) {
                    splitter.data -= 1;
                    if (conn.to.type === 'seller') {
                        processSale(1, conn.to, 'splitter'); 
                    } else {
                        conn.to.data += 1;
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
        } else if (c.type === 'seller') {
            status.innerHTML = `<div class="status-dot on"></div> SELL`;
        } else if (c.type === 'storage') {
            status.innerHTML = `<div class="status-dot on"></div> ${c.data} units`;
        } else if (c.type === 'splitter') {
            status.innerHTML = `<div class="status-dot on"></div> ${c.data}d`;
        } else if (c.type === 'miner') {
            status.innerHTML = `<div class="status-dot ${c.powered ? 'on' : 'off'}"></div> ${c.data}c`;
        }
    });

    updateUI();
    renderConnections();
    checkAchievements();
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
    const valuePerUnit = (sourceChipType === 'miner') ? 10 : 1;
    const profit = amount * valuePerUnit;
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
