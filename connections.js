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
    const valid = (source.type === 'charger' && (target.type === 'giver' || target.type === 'overclock' || target.type === 'miner')) ||
                  (source.type === 'giver' && (target.type === 'seller' || target.type === 'storage' || target.type === 'splitter')) ||
                  (source.type === 'miner' && (target.type === 'seller' || target.type === 'storage' || target.type === 'splitter')) ||
                  (source.type === 'storage' && (target.type === 'seller' || target.type === 'splitter')) ||
                  (source.type === 'splitter' && (target.type === 'seller' || target.type === 'storage' || target.type === 'splitter')) ||
                  (source.type === 'overclock' && (target.type === 'giver' || target.type === 'miner'));
    
    if (valid) {
        if (!connections.find(c => c.from === source && c.to === target)) {
            // Encontra portas padrão para manter compatibilidade com o sistema de renderização por porta
            const fromPort = source.element.querySelector('.port.out');
            const toPort = target.element.querySelector('.port.in');
            
            if (fromPort && toPort) {
                let type = 'data';
                if (fromPort.classList.contains('power')) type = 'power';
                if (fromPort.classList.contains('speed')) type = 'speed';

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
}

// Gerenciamento de Cliques em Portas
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


    if (!pendingPort) {
        // Só começa a conexão se for uma porta de saída
        if (isOut) {
            pendingPort = { chip, type, element: port };
            port.style.outline = "2px solid white";
        }
    } else {
        // Finaliza a conexão se for uma porta de entrada do mesmo tipo e chip diferente
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
    
    // Desenha conexões salvas
    connections.forEach(conn => {
        const startRect = conn.fromPort.getBoundingClientRect();
        const endRect = conn.toPort.getBoundingClientRect();

        const x1 = (startRect.left - gridRect.left + startRect.width / 2) / zoom;
        const y1 = (startRect.top - gridRect.top + startRect.height / 2) / zoom;
        const x2 = (endRect.left - gridRect.left + endRect.width / 2) / zoom;
        const y2 = (endRect.top - gridRect.top + endRect.height / 2) / zoom;

        drawPath(x1, y1, x2, y2, conn.type, false, conn.from.type, conn.to.type, conn);
    });

    // Desenha o fio temporário (Rubber Band)
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

        // Roteamento Manhattan (H-V-H) para manter os pontos de quebra nas verticais
        const midX = x1 + (x2 - x1) / 2;
        const d = `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`;

        // Cores baseadas no que está sendo conectado (Lógica de Fluxo)
        let color = type === 'power' ? '#00d4ff' : '#00ff88';

        if (type === 'speed') color = '#ffff00'; // Amarelo para Overclock
        
        if (fromType === 'giver' && toType === 'seller') {
            color = '#ffcc00'; // Dourado para fluxo de venda/dinheiro
        } else if (fromType === 'charger') {
            color = '#00d4ff'; // Ciano vibrante para energia pura
        } else if (fromType === 'giver' && toType === 'giver') {
            color = '#00ff88'; // Verde neon para transferência de dados
        } else if (fromType === 'miner') { // Nova cor para fluxo de cripto
            color = '#fbbf24'; // Dourado para cripto
        } else if (toType === 'storage' || fromType === 'storage') {
            color = '#a855f7'; // Roxo para fluxo de armazenamento
        } else if (fromType === 'splitter' || toType === 'splitter') {
            color = '#2dd4bf'; // Teal para o divisor
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