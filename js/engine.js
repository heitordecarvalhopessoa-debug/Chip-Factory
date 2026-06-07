// Loop do Jogo (1 segundo)
setInterval(() => {
    chips.forEach(c => {
        c.powered = (c.type === 'charger');
        c.overclocked = false;
        c.element.classList.remove('active-flow');
    });

    connections.forEach(conn => {
        // Transmissão de Energia (Cyan)
        if (conn.type === 'power' && conn.from.powered) {
            conn.to.powered = true;
        }

        // Transmissão de Overclock (Yellow)
        if (conn.type === 'speed' && conn.from.type === 'overclock' && conn.from.powered) {
            conn.to.overclocked = true;
        }

        // Fluxo de Dados (Verde/Roxo/Dourado)
        // O Splitter é ignorado aqui pois tem sua própria lógica de divisão justa abaixo
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

    // Processamento do Splitter (Distribuir dados igualmente entre conexões de saída)
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
        // Se estiver overclockado, produz 2 de data em vez de 1
        const baseRate = producer.type === 'miner' ? 3 : 1;
        const produceAmount = producer.overclocked ? baseRate * 2 : baseRate;
        producer.data += produceAmount;
        producer.element.classList.add('active-flow'); // Adiciona a classe para feedback visual
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
            // Mostra 'c' para crypto
            status.innerHTML = `<div class="status-dot ${c.powered ? 'on' : 'off'}"></div> ${c.data}c`;
        }
    });

    updateUI();
    renderConnections(); // Mantém os fios alinhados se algo se mover
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
    const valuePerUnit = (sourceChipType === 'miner') ? 10 : 1; // Miner vende por $10, outros por $1
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

        // Busca itens que acabaram de ser desbloqueados neste nível
        const newUnlocks = shopItems.filter(item => item.minLevel === level);
        if (typeof showLevelUpNotification === 'function') {
            showLevelUpNotification(level, newUnlocks);
        }
    }
}
