function handleChipClick(chip) {
    if (selectedTool === 'link') {
        if (!firstSelection) {
            firstSelection = chip;
            chip.element.classList.add('selected');
        } else {
            createLink(firstSelection, chip);
            firstSelection.element.classList.remove('selected');
            firstSelection = null;
        }
    } else if (selectedTool === 'move') {
        document.querySelectorAll('.chip').forEach(c => c.classList.remove('selected'));
        firstSelection = chip;
        chip.element.classList.add('selected');
    }
}

function createLink(source, target) {
    const valid = (source.type === 'charger' && (target.type === 'giver' || target.type === 'battery' || target.type === 'processor')) ||
                  (source.type === 'battery' && (target.type === 'miner' || target.type === 'overclock')) ||
                  (source.type === 'giver' && (target.type === 'seller' || target.type === 'storage' || target.type === 'splitter' || target.type === 'processor')) ||
                  (source.type === 'miner' && (target.type === 'seller' || target.type === 'storage' || target.type === 'splitter' || target.type === 'processor')) ||
                  (source.type === 'storage' && (target.type === 'seller' || target.type === 'splitter' || target.type === 'processor')) ||
                  (source.type === 'splitter' && (target.type === 'seller' || target.type === 'storage' || target.type === 'splitter' || target.type === 'processor')) ||
                  (source.type === 'processor' && (target.type === 'seller' || target.type === 'storage' || target.type === 'splitter')) ||
                  (source.type === 'overclock' && (target.type === 'giver' || target.type === 'miner'));
    
    if (valid && !connections.find(c => c.from === source && c.to === target)) {
            
            const fromPort = source.element.querySelector('.port.out');
            const toPort = target.element.querySelector('.port.in');
            
            if (fromPort && toPort) {
                let type = 'data';
                if (fromPort.classList.contains('power')) type = 'power';
                if (fromPort.classList.contains('speed')) type = 'speed';
                if (fromPort.classList.contains('energy')) type = 'energy';

                connections.push({ 
                    from: source, 
                    fromPort: fromPort, 
                    to: target, 
                    toPort: toPort,
                    type: type
                });
                if (typeof renderConnections === 'function') renderConnections();
            }
        }
    }

document.addEventListener('click', (e) => {
    if (selectedTool !== 'link') return;
    
    const port = e.target.closest('.port');
    if (!port) return;

    const chipEl = port.parentElement;
    const chipId = chipEl.dataset.id;
    const chip = chips.find(c => c.id == chipId);
    const isOut = port.classList.contains('out');
    
    let type = 'data';
    if (port.classList.contains('power')) type = 'power';
    if (port.classList.contains('speed')) type = 'speed';
    if (port.classList.contains('energy')) type = 'energy';


    if (!pendingPort) {
        
        if (isOut) {
            pendingPort = { chip, type, element: port };
            port.style.outline = "2px solid white";
        }
    } else {
        
        if (!isOut && type === pendingPort.type && chip !== pendingPort.chip) {
            connections.push({
                from: pendingPort.chip,
                fromPort: pendingPort.element,
                to: chip,
                toPort: port,
                type: type
            });
            renderConnections();
        }
        pendingPort.element.style.outline = "none";
        pendingPort = null;
    }
});

function renderConnections() {
    const layer = document.getElementById('connections-layer');
    layer.innerHTML = '';
    const gridRect = gridElement.getBoundingClientRect();
    
    connections.forEach(conn => {
        const startRect = conn.fromPort.getBoundingClientRect();
        const endRect = conn.toPort.getBoundingClientRect();

        const x1 = (startRect.left - gridRect.left + startRect.width / 2) / zoom;
        const y1 = (startRect.top - gridRect.top + startRect.height / 2) / zoom;
        const x2 = (endRect.left - gridRect.left + endRect.width / 2) / zoom;
        const y2 = (endRect.top - gridRect.top + endRect.height / 2) / zoom;

        drawPath(x1, y1, x2, y2, conn.type, false, conn.from.type, conn.to.type, conn);
    });

    if (pendingPort) {
        const startRect = pendingPort.element.getBoundingClientRect();
        const x1 = (startRect.left - gridRect.left + startRect.width / 2) / zoom;
        const y1 = (startRect.bottom - gridRect.top) / zoom;
        
        drawPath(x1, y1, mouseX, mouseY, pendingPort.type, true, pendingPort.chip.type);
    }
}

function drawPath(x1, y1, x2, y2, type, isPending, fromType, toType, connRef) {
        const layer = document.getElementById('connections-layer');
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");

        const midX = x1 + (x2 - x1) / 2;
        const d = `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`;

        let color = type === 'power' ? '#00d4ff' : '#00ff88';

        if (type === 'speed') color = '#ffff00';
        if (type === 'energy') color = '#ff4444';
        
        if (fromType === 'giver' && toType === 'seller') {
            color = '#ffcc00';
        } else if (fromType === 'charger') {
            color = '#00d4ff';
        } else if (fromType === 'giver' && toType === 'giver') {
            color = '#00ff88';
        } else if (fromType === 'miner') {
            color = '#fbbf24';
        } else if (toType === 'storage' || fromType === 'storage') {
            color = '#a855f7';
        } else if (fromType === 'splitter' || toType === 'splitter') {
            color = '#2dd4bf';
        } else if (fromType === 'processor' || toType === 'processor') {
            color = '#f472b6';
        }

        path.setAttribute("d", d);
        path.setAttribute("fill", "none");
        path.setAttribute("stroke", color);
        path.setAttribute("stroke-width", "3");
        path.setAttribute("stroke-linejoin", "round");
        
        if (!isPending) {
            path.setAttribute("class", "connection-path");
            path.style.pointerEvents = "stroke";
            path.style.cursor = "pointer";
            path.addEventListener('click', (e) => {
                e.stopPropagation();
                connections = connections.filter(c => c !== connRef);
                renderConnections();
            });
        } else {
            path.style.opacity = "0.5";
            path.setAttribute("stroke-dasharray", "4");
        }
        
        path.style.filter = `drop-shadow(0 0 5px ${color})`;
        
        layer.appendChild(path);
}
