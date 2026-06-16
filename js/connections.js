function canConnect(source, target, type) {
    if (source === target) return false;

    if (source.type === 'charger' && target.type === 'seller') return false;
    if (source.type === 'seller' && target.type === 'charger') return false;

    const rules = {
        'power': {
            from: ['charger'],
            to: ['giver', 'battery', 'processor', 'market', 'nexus']
        },
        'energy': {
            from: ['battery', 'nexus'],
            to: ['miner', 'overclock']
        },
        'speed': {
            from: ['overclock', 'nexus'],
            to: ['giver', 'miner']
        },
        'data': {
            from: ['giver', 'miner', 'market', 'storage', 'splitter', 'processor', 'vault'],
            to: ['seller', 'market', 'storage', 'splitter', 'processor', 'vault']
        }
    };

    const rule = rules[type];
    if (!rule) return false;

    return rule.from.includes(source.type) && rule.to.includes(target.type);
}

function handleChipClick(chip) {
    if (selectedTool === 'link') {
        if (!firstSelection) {
            firstSelection = chip;
            chip.element.classList.add('selected');
        } else {
            const sourceChip = firstSelection;
            const targetChip = chip;

            if (sourceChip === targetChip) {
                sourceChip.element.classList.remove('selected');
                firstSelection = null;
                return;
            }

            let connected = false;
            const sourceOutPorts = sourceChip.element.querySelectorAll('.port.out');
            const targetInPorts = targetChip.element.querySelectorAll('.port.in');

            for (const sPort of sourceOutPorts) {
                let sType = 'data';
                if (sPort.classList.contains('power')) sType = 'power';
                if (sPort.classList.contains('speed')) sType = 'speed';
                if (sPort.classList.contains('energy')) sType = 'energy';

                for (const tPort of targetInPorts) {
                    let tType = 'data';
                    if (tPort.classList.contains('power')) tType = 'power';
                    if (tPort.classList.contains('speed')) tType = 'speed';
                    if (tPort.classList.contains('energy')) tType = 'energy';

                    if (sType === tType && canConnect(sourceChip, targetChip, sType)) {
                        const existingConnection = connections.find(c => 
                            c.from === sourceChip && c.to === targetChip && 
                            c.fromPort === sPort && c.toPort === tPort
                        );
                        if (!existingConnection) {
                            connections.push({ from: sourceChip, fromPort: sPort, to: targetChip, toPort: tPort, type: sType });
                            connected = true;
                            break; 
                        }
                    }
                }
                if (connected) break; 
            }
            
            sourceChip.element.classList.remove('selected');
            firstSelection = null;
            renderConnections();
        }
    } else if (selectedTool === 'move') {
        document.querySelectorAll('.chip').forEach(c => c.classList.remove('selected'));
        if (firstSelection === chip) {
            firstSelection = null; // Cancela se clicar no mesmo chip
        } else {
            firstSelection = chip;
            chip.element.classList.add('selected');
        }
        if (typeof updatePlacementGhost === 'function') updatePlacementGhost();
        if (typeof updateGridHighlighting === 'function') updateGridHighlighting();
    }
}

function createLink(source, target) {
    const fromPort = source.element.querySelector('.port.out');
    const toPort = target.element.querySelector('.port.in');

    if (fromPort && toPort) {
        let type = 'data';
        if (fromPort.classList.contains('power')) type = 'power';
        if (fromPort.classList.contains('speed')) type = 'speed';
        if (fromPort.classList.contains('energy')) type = 'energy';

        if (canConnect(source, target, type) && !connections.find(c => c.from === source && c.to === target)) {
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
        
        if (!isOut && type === pendingPort.type && canConnect(pendingPort.chip, chip, type)) {
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

        let color = '#00ff88';
        if (type === 'power')  color = '#00d4ff';
        if (type === 'speed')  color = '#ffff00';
        if (type === 'energy') color = '#ff4444';

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
