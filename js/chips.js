function placeChip(clickedIndex) {
    let w = 4, h = 4;
    if (selectedTool === 'move' && firstSelection) {
        w = firstSelection.bounds.w;
        h = firstSelection.bounds.h;
    }

    const placement = typeof getPlacementCoords === 'function' ? getPlacementCoords(w, h) : null;
    const index = placement ? placement.index : clickedIndex;
    const coords = getCoords(index);
    
    if (selectedTool === 'move' && firstSelection) {
        if (isAreaFree(index, w, h, firstSelection.id)) {
            moveChip(firstSelection, index);
            firstSelection = null;
            document.querySelectorAll('.chip').forEach(c => c.classList.remove('selected'));
            updateUI();
        } else {
            showFloatingText(gridElement.children[index], "BLOCKED", "#ff4444");
        }
        return;
    }

    if (['pan', 'link', 'move'].includes(selectedTool)) return;
    
    const costs = { 'charger': 50, 'giver': 20, 'seller': 30, 'overclock': 80, 'storage': 40, 'splitter': 60, 'miner': 120, 'battery': 60, 'processor': 100, 'nexus': 250, 'market': 200, 'autosell': 300, 'vault': 150 };
    const cost = costs[selectedTool];

    if (selectedTool === 'nexus' && level < 6) return;
    if (selectedTool === 'market' && level < 5) return;
    if (selectedTool === 'overclock' && level < 3) return;
    if (selectedTool === 'miner' && level < 4) return;
    if (selectedTool === 'autosell' && level < 7) return;
    if ((selectedTool === 'storage' || selectedTool === 'battery') && level < 2) return;
    if (selectedTool === 'splitter' && level < 2) return;
    if (selectedTool === 'processor' && level < 3) return;
    if (selectedTool === 'vault' && level < 4) return;

    if (cost && money >= cost && coords.y <= gridSize - h && coords.x <= gridSize - w && isAreaFree(index, w, h)) {
        money -= cost;
        createChip(selectedTool, index, 4, 4);
        showFloatingText(gridElement.children[index], `-$${cost}`, "#ff4444");
        updateUI();
    }
}

function createChip(type, index, w, h, existingId = null, extraPorts = 0) {
    const coords = getCoords(index);
    const occupied = [];
    for (let i = 0; i < w; i++) {
        for (let j = 0; j < h; j++) {
            occupied.push((coords.y + j) * gridSize + (coords.x + i));
        }
    }

    const chipId = existingId || (Date.now() + Math.random());
    const div = document.createElement('div');
    div.className = `chip ${type}`;
    div.dataset.id = chipId;
    div.style.width = (50 * w + (w - 1) * 2) + 'px';
    div.style.height = (50 * h + (h - 1) * 2) + 'px';
    div.style.left = (coords.x * 52) + 'px';
    div.style.top = (coords.y * 52) + 'px';
    div.style.backgroundImage = "url('assets/imgs/chip.png')";
    div.style.backgroundSize = "100% 100%";
    div.style.display = "flex";
    div.style.flexDirection = "column";
    div.style.alignItems = "center";
    div.style.justifyContent = "center";
    div.style.textAlign = "center";
    div.style.color = "white";
    div.style.textShadow = "1px 1px 3px rgba(0,0,0,0.8)";

    let portsHTML = '';
    if (type === 'charger') portsHTML = '<div class="port out power"></div>';
    if (type === 'giver')   portsHTML = '<div class="port in power"></div><div class="port in speed"></div><div class="port out data"></div>';
    if (type === 'miner')   portsHTML = '<div class="port in energy"></div><div class="port in speed"></div><div class="port out data"></div>';
    if (type === 'seller')  portsHTML = '<div class="port in power"></div><div class="port in data"></div>';
    if (type === 'market')  portsHTML = '<div class="port in power"></div><div class="port in data"></div><div class="port out data"></div>';
    if (type === 'battery') portsHTML = '<div class="port in power"></div><div class="port out energy"></div>';
    if (type === 'overclock') portsHTML = '<div class="port in energy"></div><div class="port out speed"></div>';
    if (type === 'processor') portsHTML = '<div class="port in power" style="left:30%"></div><div class="port in data" style="left:70%"></div><div class="port out data"></div>';
    if (type === 'storage') portsHTML = '<div class="port in data"></div><div class="port out data"></div>';
    if (type === 'vault') portsHTML = '<div class="port in data"></div><div class="port out data"></div>';
    if (type === 'nexus') portsHTML = '<div class="port in power"></div><div class="port out energy" style="left:30%"></div><div class="port out speed" style="left:70%"></div>';
    if (type === 'splitter') {
        portsHTML = '<div class="port in data"></div>';
        const totalOuts = 2 + extraPorts;
        for (let i = 0; i < totalOuts; i++) {
            const pos = ((i + 1) * 100 / (totalOuts + 1)) + '%';
            portsHTML += `<div class="port out data" style="left: ${pos}"></div>`;
        }
    }
    if (type === 'autosell') portsHTML = '';

    let internalHTML = `
        <div style="pointer-events:none; z-index:1; display: flex; flex-direction: column; align-items: center; gap: 2px;">
            <div style="font-size: 0.6em; opacity: 0.5; font-weight: 900; letter-spacing: 1.5px;">${type.toUpperCase()}</div>
            <div class="status" style="font-size: 0.7em; font-weight: bold; display: flex; align-items: center;"></div>
        </div>`;
    if (type === 'battery') {
        internalHTML += `<div class="energy-bar-container"><div class="energy-bar-fill" id="energy-${chipId}"></div></div>`;
    }
    if (type === 'storage') {
        internalHTML += `<div class="energy-bar-container" style="border-color: #a855f7;"><div class="energy-bar-fill" id="data-bar-${chipId}" style="background: #a855f7;"></div></div>`;
    }
    if (type === 'vault') {
        internalHTML += `<div class="energy-bar-container" style="border-color: #00d4ff;"><div class="energy-bar-fill" id="data-bar-${chipId}" style="background: #00d4ff;"></div></div>`;
    }
    div.innerHTML = portsHTML + internalHTML;

    const chipObj = {
        id: chipId,
        type,
        element: div,
        occupiedIndices: occupied,
        bounds: { x: coords.x, y: coords.y, w, h },
        powered: false,
        data: 0,
        overclocked: false,
        energy: type === 'battery' ? 0 : undefined,
        maxData: type === 'storage' ? 200 : (type === 'vault' ? 1000 : undefined),
        isCharging: type === 'battery' ? true : undefined,
        active: type === 'autosell' ? false : undefined,
        extraPorts: type === 'splitter' ? extraPorts : undefined
    };

    if (type === 'splitter') {
        const btn = document.createElement('button');
        btn.className = 'add-port-btn';
        btn.innerText = '+';
        btn.title = "Add output ($20)";
        btn.onclick = (e) => {
            e.stopPropagation();
            if (money >= 20) {
                money -= 20;
                chipObj.extraPorts = (chipObj.extraPorts || 0) + 1;
                const newPort = document.createElement('div');
                newPort.className = 'port out data';
                div.appendChild(newPort);
                
                const outs = div.querySelectorAll('.port.out');
                outs.forEach((p, i) => {
                    p.style.left = ((i + 1) * 100 / (outs.length + 1)) + '%';
                });
                updateUI();
                renderConnections();
            }
        };
        div.appendChild(btn);
    }

    if (type === 'autosell') {
        const btn = document.createElement('button');
        btn.className = 'add-port-btn'; 
        btn.innerText = 'OFF';
        btn.style.position = 'relative';
        btn.style.left = 'auto';
        btn.style.marginTop = '10px';
        btn.onclick = (e) => {
            e.stopPropagation();
            chipObj.active = !chipObj.active;
            btn.innerText = chipObj.active ? 'ON' : 'OFF';
            btn.style.background = chipObj.active ? '#00ff88' : '#444';
        };
        div.appendChild(btn);
    }

    div.addEventListener('contextmenu', (e) => showContextMenu(e, chipObj));

    div.addEventListener('click', (e) => {
        if (e.target.classList.contains('port')) return;
        e.stopPropagation();
        handleChipClick(chipObj);
    });
    
    div.classList.add('chip-hop');
    setTimeout(() => div.classList.remove('chip-hop'), 400);

    gridElement.appendChild(div);

    chips.push(chipObj);
}

function moveChip(chip, newIndex) {
    const coords = getCoords(newIndex);
    const { w, h } = chip.bounds;
    const occupied = [];
    for (let i = 0; i < w; i++) {
        for (let j = 0; j < h; j++) {
            occupied.push((coords.y + j) * gridSize + (coords.x + i));
        }
    }

    chip.occupiedIndices = occupied;
    chip.bounds = { x: coords.x, y: coords.y, w, h };
    chip.element.style.left = (coords.x * 52) + 'px';
    chip.element.style.top = (coords.y * 52) + 'px';

    chip.element.classList.add('chip-hop');
    setTimeout(() => chip.element.classList.remove('chip-hop'), 400);

    chip.element.classList.remove('selected');
    chip.element.oncontextmenu = (e) => showContextMenu(e, chip);
    
    if (typeof updatePlacementGhost === 'function') updatePlacementGhost();

    renderConnections();
    updateUI();
}

function removeChipAt(index) {
    const chipIndex = chips.findIndex(c => c.occupiedIndices.includes(index));
    if (chipIndex !== -1) {
        const chip = chips[chipIndex];
        connections = connections.filter(conn => conn.from !== chip && conn.to !== chip);
        chip.element.remove();
        money += 10;
        chips.splice(chipIndex, 1);
        renderConnections();
        updateUI();
    }
}
