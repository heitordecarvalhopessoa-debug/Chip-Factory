function saveGame() {
    const gameData = {
        money: money,
        level: level,
        xp: xp,
        xpTarget: xpTarget,
        chips: chips.map(c => ({
            id: c.id,
            type: c.type,
            bounds: c.bounds,
            data: c.data,
            energy: c.energy,
            active: c.active
        })),
        connections: connections.map(conn => ({
            fromId: conn.from.id,
            toId: conn.to.id,
            type: conn.type,
            fromPortIndex: Array.from(conn.from.element.querySelectorAll('.port.out')).indexOf(conn.fromPort),
            toPortIndex: Array.from(conn.to.element.querySelectorAll('.port.in')).indexOf(conn.toPort)
        }))
    };
    localStorage.setItem('chipFactory_saveData', JSON.stringify(gameData));
}

function loadGame() {
    const saved = localStorage.getItem('chipFactory_saveData');
    if (!saved) return;

    try {
        const data = JSON.parse(saved);
        
        chips.forEach(c => c.element.remove());
        chips.length = 0;
        connections.length = 0;

        money = Math.floor(data.money || 0);
        level = data.level;
        xp = data.xp;
        xpTarget = data.xpTarget;

        data.chips.forEach(c => {
            const index = c.bounds.y * gridSize + c.bounds.x;
            createChip(c.type, index, c.bounds.w, c.bounds.h, c.id);
            const newChip = chips.find(chip => chip.id === c.id);
            if (newChip) {
                newChip.data = c.data || 0;
                newChip.energy = c.energy;
                if (c.active !== undefined) newChip.active = c.active;
            }
        });

        data.connections.forEach(connData => {
            const source = chips.find(c => c.id === connData.fromId);
            const target = chips.find(c => c.id === connData.toId);
            
            if (source && target) {
                const outPorts = source.element.querySelectorAll('.port.out');
                const inPorts = target.element.querySelectorAll('.port.in');
                
                if (outPorts[connData.fromPortIndex] && inPorts[connData.toPortIndex]) {
                    connections.push({
                        from: source,
                        fromPort: outPorts[connData.fromPortIndex],
                        to: target,
                        toPort: inPorts[connData.toPortIndex],
                        type: connData.type
                    });
                }
            }
        });

        updateUI();
        renderConnections();
        console.log("Game loaded successfully!");
    } catch (e) {
        console.error("Error loading game:", e);
    }
}

function clearSave() {
    localStorage.removeItem('chipFactory_saveData');
    location.reload();
}
