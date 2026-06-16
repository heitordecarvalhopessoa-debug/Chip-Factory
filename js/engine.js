window.addEventListener('DOMContentLoaded', () => {
    if (typeof loadGame === 'function') loadGame();
    if (typeof initTutorial === 'function') initTutorial();
});

setInterval(() => {
    // Update income history
    incomeHistory.push(currentTickIncome);
    if (incomeHistory.length > 30) incomeHistory.shift();
    currentTickIncome = 0;

    chips.forEach(c => {
        c.powered = (c.type === 'charger');
        c.overclocked = false;
        c.element.classList.remove('active-flow');
        if (c.type === 'bridge') c.currentType = null;
    });

    connections.forEach(conn => {
        if (conn.to.type === 'bridge') {
            if (conn.type === 'power' && conn.from.powered) conn.to.currentType = 'power';
            if (conn.type === 'data' && conn.from.data > 0) conn.to.currentType = 'data';
            if (conn.type === 'speed' && conn.from.overclocked) conn.to.currentType = 'speed';
            if (conn.type === 'energy' && (conn.from.energy > 0 || (conn.from.type === 'nexus' && conn.from.powered))) conn.to.currentType = 'energy';
        }

        if (conn.type === 'power' && (conn.from.powered || (conn.from.type === 'bridge' && conn.from.currentType === 'power'))) {
            conn.to.powered = true;
        }

        if (conn.type === 'power' && conn.from.powered && conn.to.type === 'battery') {
            if ((conn.to.energy || 0) >= 100) conn.to.isCharging = false;
            if ((conn.to.energy || 0) <= 0) conn.to.isCharging = true;
            if (conn.to.isCharging) {
                conn.to.energy = Math.min(100, (conn.to.energy || 0) + 10);
            }
        }

        if (conn.type === 'energy' && ((conn.from.type === 'battery' && conn.from.energy > 0) || (conn.from.type === 'nexus' && conn.from.powered) || (conn.from.type === 'bridge' && conn.from.currentType === 'energy'))) {
            conn.to.powered = true;
            if (conn.from.type === 'battery') {
                conn.from.energy -= 2;
                if (conn.from.energy < 0) conn.from.energy = 0;
            }
        }

        if (conn.type === 'speed' && (conn.from.type === 'overclock' || conn.from.type === 'nexus' || (conn.from.type === 'bridge' && conn.from.currentType === 'speed')) && (conn.from.powered || conn.from.type === 'bridge')) {
            conn.to.overclocked = true;
        }

        
        if (conn.type === 'data' && conn.from.data > 0 && conn.from.type !== 'splitter' && (conn.from.type !== 'market' || conn.from.powered)) {
            
            let rate = 5;
            if (conn.from.type === 'vault') rate = 20;
            if (conn.from.type === 'market') rate = 10;
            
            let transferAmount = (conn.from.type === 'storage' || conn.from.type === 'vault' || conn.from.type === 'market') ? Math.min(conn.from.data, rate) : conn.from.data;
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

    chips.forEach(c => {
        if (c.type === 'autosell' && c.active) {
            chips.forEach(targetChip => {
                if (targetChip.data > 0 && targetChip !== c) {
                    const amount = targetChip.data;
                    targetChip.data = 0;
                    processSale(amount, c, targetChip.type);
                    c.element.classList.add('active-flow');
                }
            });
        }

        if (c.type === 'splitter' && c.data > 0) {
            const outConns = connections.filter(conn => conn.from === c && conn.type === 'data');
            if (outConns.length > 0) {
                outConns.forEach(conn => {
                    if (c.data > 0) {
                        const amountToSplit = 1;
                        c.data -= amountToSplit;
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
        }

        if ((c.type === 'giver' || c.type === 'miner') && c.powered) {
            let baseRate = 1;
            if (c.type === 'miner') baseRate = 3;

            const produceAmount = Math.floor((c.overclocked ? baseRate * 2 : baseRate) * prestigeMultiplier);
            c.data += produceAmount;
            c.element.classList.add('active-flow');
            showFloatingText(c.element, `+${produceAmount} ${c.type === 'miner' ? 'Crypto' : 'Data'}`, c.overclocked ? "#ffff00" : (c.type === 'miner' ? "#fbbf24" : "#0077ff"));
        }
    });

    chips.forEach(c => refreshChipStatus(c));

    updateUI();
    renderConnections();
    checkAchievements();

    if (typeof saveGame === 'function') saveGame();
}, 1000);

function refreshChipStatus(c) {
    const status = c.element.querySelector('.status');
    if (!status) return;
    
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
    } else if (c.type === 'vault') {
        status.innerHTML = `<div class="status-dot on" style="background:#00d4ff"></div> ${c.data}/${c.maxData}`;
        const bar = document.getElementById(`data-bar-${c.id}`);
        if (bar) bar.style.width = Math.min(100, (c.data / c.maxData) * 100) + '%';
    } else if (c.type === 'splitter') {
        status.innerHTML = `<div class="status-dot on"></div> ${c.data}d`;
    } else if (c.type === 'processor') {
        status.innerHTML = `<div class="status-dot ${c.powered ? 'on' : 'off'}"></div> ${c.data}d`;
    } else if (c.type === 'bridge') {
        const ports = c.element.querySelectorAll('.port');
        ports.forEach(p => {
            p.classList.remove('neutral', 'power', 'data', 'speed', 'energy');
            if (c.currentType) {
                p.classList.add(c.currentType);
            } else {
                p.classList.add('neutral');
            }
        });
        let dotColor = '#eee';
        if (c.currentType === 'data') dotColor = '#00ff88';
        if (c.currentType === 'power') dotColor = '#00d4ff';
        if (c.currentType === 'speed') dotColor = '#ffff00';
        if (c.currentType === 'energy') dotColor = '#ff4444';
        status.innerHTML = `<div class="status-dot on" style="background:${dotColor}"></div> ${c.data}d`;
    } else if (c.type === 'miner') {
        status.innerHTML = `<div class="status-dot ${c.powered ? 'on' : 'off'}"></div> ${c.data}c`;
    } else if (c.type === 'market') {
        status.innerHTML = `<div class="status-dot ${c.powered ? 'on' : 'off'}"></div> ${c.data}d`;
    } else if (c.type === 'autosell') {
        status.innerHTML = c.active ? 'COLLECTING' : 'IDLE';
    } else if (c.type === 'analytics') {
        const canvas = document.getElementById(`graph-${c.id}`);
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            if (c.powered && incomeHistory.length > 1) {
                const max = Math.max(...incomeHistory, 10);
                const current = incomeHistory[incomeHistory.length - 1] || 0;

                // Cálculo de cor baseado na performance relativa
                let color = '#00ff88'; // Verde (Bom)
                if (current < max * 0.3) color = '#ff4444'; // Vermelho (Baixo)
                else if (current < max * 0.7) color = '#ffff00'; // Amarelo (Médio)

                ctx.strokeStyle = color;
                ctx.lineWidth = 3;
                ctx.lineJoin = 'round';
                ctx.lineCap = 'round';
                ctx.shadowBlur = 8;
                ctx.shadowColor = color;

                const step = canvas.width / (incomeHistory.length - 1);
                ctx.beginPath();
                incomeHistory.forEach((val, i) => {
                    const x = i * step;
                    const y = canvas.height - (val / max * (canvas.height - 10)) - 5;
                    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
                });
                ctx.stroke();

                // Preenchimento de área sob a linha para estética moderna
                ctx.shadowBlur = 0;
                ctx.lineTo(canvas.width, canvas.height);
                ctx.lineTo(0, canvas.height);
                ctx.fillStyle = color + '22'; // Cor com 13% de opacidade
                ctx.fill();

                // Atualiza o texto e o ponto de status com a cor correspondente
                status.innerHTML = `<div class="status-dot" style="background:${color}; box-shadow: 0 0 8px ${color}"></div> MAX: $${max}`;
                status.style.color = color;
            } else {
                status.innerHTML = `<div class="status-dot off"></div> NO POWER`;
            status.style.color = '';
            }
        }
    }
}

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
    const profit = Math.floor(amount * valuePerUnit * bonus * prestigeMultiplier);
    currentTickIncome += profit;
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
