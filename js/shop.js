let shopFilter = 'all';
let shopSort = 'price-asc'; // Padrão: Barato -> Caro
let shopStatusFilter = 'all'; // Padrão: Todos

const shopItems = [
    { id: 'charger', category: 'energia', name: '⚡ Charger', price: 50, desc: 'Fonte de energia base para o sistema.', minLevel: 1, io: { in: [], out: ['⚡ Power'] } },
    { id: 'giver', category: 'produção', name: '📦 Giver', price: 20, desc: 'Gera 1 dado básico por segundo.', minLevel: 1, io: { in: ['⚡ Power', '🚀 Speed'], out: ['💾 Data'] } },
    { id: 'seller', category: 'vendas', name: '💰 Seller', price: 30, desc: 'Converte dados e cristais em dinheiro.', minLevel: 1, io: { in: ['💾 Data'], out: ['💵 Cash'] } },
    { id: 'storage', category: 'logística', name: '📦 Storage', price: 40, desc: 'Acumula dados para processamento posterior.', minLevel: 2, io: { in: ['💾 Data'], out: ['💾 Data'] } },
    { id: 'overclock', category: 'upgrade', name: '🚀 Overclock', price: 80, desc: 'Acelera a produção de chips adjacentes.', minLevel: 3, io: { in: ['⚡ Power'], out: ['🚀 Speed'] } },
    { id: 'splitter', category: 'logística', name: '🌿 Splitter', price: 60, desc: 'Divide um fluxo de dados em múltiplas saídas.', minLevel: 2, io: { in: ['💾 Data'], out: ['💾 Data (x2)'] } },
    { id: 'miner', category: 'produção', name: '⛏️ Miner', price: 120, desc: 'Extrai Cripto valiosa ($10/u). Alta demanda.', minLevel: 4, io: { in: ['⚡ Power', '🚀 Speed'], out: ['💎 Crypto'] } }
];

function setShopFilter(filter) {
    shopFilter = filter;
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('onclick').includes(filter));
    });
    renderShop();
}

function setShopSort(sort) {
    shopSort = sort;
    renderShop();
}

function setStatusFilter(status) {
    shopStatusFilter = status;
    renderShop();
}

function renderShop() {
    const container = document.getElementById('shop-items-container');
    if (!container) return;

    // Criar cabeçalho de filtros se não existir
    let controls = document.getElementById('shop-controls');
    if (!controls) {
        controls = document.createElement('div');
        controls.id = 'shop-controls';
        controls.style = "display: flex; flex-direction: column; gap: 8px; margin-bottom: 15px; padding: 10px; background: rgba(0,0,0,0.3); border-radius: 8px;";
        
        controls.innerHTML = `
            <div class="filter-row" style="display: flex; gap: 5px; flex-wrap: wrap;">
                <button class="filter-btn small ${shopStatusFilter==='all'?'active':''}" onclick="setStatusFilter('all')">Todos</button>
                <button class="filter-btn small ${shopStatusFilter==='unlocked'?'active':''}" onclick="setStatusFilter('unlocked')">🔓 Liberados</button>
                <button class="filter-btn small ${shopStatusFilter==='locked'?'active':''}" onclick="setStatusFilter('locked')">🔒 Bloqueados</button>
            </div>
            <select onchange="setShopSort(this.value)" style="background: #222; color: white; border: 1px solid #444; padding: 5px; border-radius: 4px; cursor: pointer;">
                <option value="price-asc" ${shopSort==='price-asc'?'selected':''}>💰 Menor Preço</option>
                <option value="price-desc" ${shopSort==='price-desc'?'selected':''}>💎 Maior Preço</option>
                <option value="level" ${shopSort==='level'?'selected':''}>📈 Nível Tecnológico</option>
            </select>
        `;
        container.parentElement.insertBefore(controls, container);
    }

    // Estilização do Container de Itens (Scrollbar Customizada via CSS seria melhor, mas mantemos JS)
    Object.assign(container.style, {
        maxHeight: "65vh",
        overflowY: "auto",
        paddingRight: "8px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        scrollbarWidth: "thin",
        scrollbarColor: "#00ff88 #222"
    });

    let items = [...shopItems];

    // Filtros
    if (shopFilter !== 'all') {
        items = items.filter(i => i.category === shopFilter);
    }

    // Filtro de Status (Desbloqueados/Bloqueados)
    if (shopStatusFilter === 'unlocked') {
        items = items.filter(i => i.minLevel <= level);
    } else if (shopStatusFilter === 'locked') {
        items = items.filter(i => i.minLevel > level);
    }

    // Ordenação Dinâmica
    items.sort((a, b) => {
        if (shopSort === 'price-asc') return a.price - b.price;
        if (shopSort === 'price-desc') return b.price - a.price;
        if (shopSort === 'level') return a.minLevel - b.minLevel;
        return 0;
    });

    container.innerHTML = '';
    items.forEach(item => {
        const isLocked = item.minLevel > level;
        const canAfford = money >= item.price;
        const div = document.createElement('div');
        // Adiciona classe visual se não tiver dinheiro suficiente
        div.className = `shop-item ${isLocked ? 'locked' : ''} ${!canAfford && !isLocked ? 'insufficient-funds' : ''} ${selectedTool === item.id ? 'active' : ''}`;
        div.id = `btn-${item.id}`;
        div.onclick = () => selectTool(item.id);
        
        div.innerHTML = `
            <div class="shop-item-header" style="display:flex; justify-content:space-between; font-size: 0.8em; opacity: 0.7;">
                <span class="item-category">${item.category.toUpperCase()}</span>
                <span class="item-price" style="font-weight:bold; color: ${canAfford ? '#2ecc71' : '#e74c3c'};">$${item.price}</span>
            </div>
            <div class="name" style="font-size: 1.1em; font-weight: bold; margin: 4px 0;">${item.name}</div>
            <div class="desc" style="font-size: 0.85em; margin-bottom: 8px;">${item.desc}</div>
            <div class="item-specs" style="font-size: 0.75em; background: rgba(0,0,0,0.2); padding: 4px; border-radius: 4px; margin-bottom: 8px;">
                <div><strong>Entrada:</strong> ${item.io.in.length > 0 ? item.io.in.join(', ') : 'Nenhuma'}</div>
                <div><strong>Saída:</strong> ${item.io.out.join(', ')}</div>
            </div>
            <div class="item-footer" style="font-size: 0.75em; border-top: 1px solid #444; pt-4 mt-2">
                ${isLocked ? `<span style="color:#e74c3c">🔒 Nível ${item.minLevel}</span>` : `<span style="color:#2ecc71">✅ Desbloqueado</span>`}
                <span style="float:right">📏 4x4</span>
            </div>
        `;
        container.appendChild(div);
    });
}
