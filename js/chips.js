function placeChip(index) {
    const coords = getCoords(index);
    
    if (selectedTool === 'move' && firstSelection) {
        if (isAreaFree(index, 4, 4)) {
            moveChip(firstSelection, index);
            selectTool('move');
        }
        return;
    }

    if (['pan', 'link', 'move'].includes(selectedTool)) return;
    
    const costs = { 'charger': 50, 'giver': 20, 'seller': 30, 'overclock': 80, 'storage': 40, 'splitter': 60, 'miner': 120, 'battery': 60 };
    const cost = costs[selectedTool];

    if (selectedTool === 'overclock' && level < 3) return;
    if (selectedTool === 'miner' && level < 4) return;
    if ((selectedTool === 'storage' || selectedTool === 'battery') && level < 2) return;
    if (selectedTool === 'splitter' && level < 2) return;

    if (cost && money >= cost && coords.y <= gridSize - 4 && coords.x <= gridSize - 4 && isAreaFree(index, 4, 4)) {
        money -= cost;
        createChip(selectedTool, index, 4, 4);
        updateUI();
    }
}

function createChip(type, index, w, h) {
    const coords = getCoords(index);
    const occupied = [];
    for (let i = 0; i < w; i++) {
        for (let j = 0; j < h; j++) {
            occupied.push((coords.y + j) * gridSize + (coords.x + i));
        }
    }

    const chipId = Date.now() + Math.random();
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
    if (type === 'seller')  portsHTML = '<div class="port in data"></div>';
    if (type === 'battery') portsHTML = '<div class="port in power"></div><div class="port out energy"></div>';
    if (type === 'overclock') portsHTML = '<div class="port in energy"></div><div class="port out speed"></div>';
    if (type === 'storage') portsHTML = '<div class="port in data"></div><div class="port out data"></div>';
    if (type === 'splitter') {
        portsHTML = '<div class="port in data"></div>' + 
                    '<div class="port out data" style="left: 30%"></div>' + 
                    '<div class="port out data" style="left: 70%"></div>';
    }

    let internalHTML = `<div style="pointer-events:none; z-index:1;">${type.toUpperCase()}<br><span class="status"></span></div>`;
    if (type === 'battery') {
        internalHTML += `<div class="energy-bar-container"><div class="energy-bar-fill" id="energy-${chipId}"></div></div>`;
    }
    div.innerHTML = portsHTML + internalHTML;

    if (type === 'splitter') {
        const btn = document.createElement('button');
        btn.className = 'add-port-btn';
        btn.innerText = '+';
        btn.title = "Add output ($20)";
        btn.onclick = (e) => {
            e.stopPropagation();
            if (money >= 20) {
                money -= 20;
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

    div.addEventListener('contextmenu', (e) => showContextMenu(e, chipObj));

    div.addEventListener('click', (e) => {
        if (e.target.classList.contains('port')) return;
        e.stopPropagation();
        handleChipClick(chipObj);
    });
    
    gridElement.appendChild(div);

    const chipObj = {
        id: chipId,
        type,
        element: div,
        occupiedIndices: occupied,
        bounds: { x: coords.x, y: coords.y, w, h },
        powered: false,
        data: 0,
        overclocked: false,
        energy: type === 'battery' ? 0 : undefined
    };
    chips.push(chipObj);
}

function moveChip(chip, newIndex) {
    const coords = getCoords(newIndex);
    const w = 4, h = 4;
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
    
    chip.element.oncontextmenu = (e) => showContextMenu(e, chip);

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
