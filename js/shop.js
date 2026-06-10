let shopFilter = 'all';
let shopSort = 'price-asc';
let shopStatusFilter = 'all';

const shopItems = [
    { id: 'charger', category: 'energy', name: '⚡ Charger', price: 50, desc: 'Base power source for the system.', minLevel: 1, io: { in: [], out: ['⚡ Power'] } },
    { id: 'giver', category: 'production', name: '📦 Giver', price: 20, desc: 'Generates 1 basic data per second.', minLevel: 1, io: { in: ['⚡ Power', '🚀 Speed'], out: ['💾 Data'] } },
    { id: 'seller', category: 'sales', name: '💰 Seller', price: 30, desc: 'Converts data and crystals into cash.', minLevel: 1, io: { in: ['💾 Data'], out: ['💵 Cash'] } },
    { id: 'battery', category: 'energy', name: '🔋 Battery', price: 60, desc: 'Required to power Miners. Stores energy.', minLevel: 2, io: { in: ['⚡ Power'], out: ['🔋 Energy'] } },
    { id: 'storage', category: 'logistics', name: '📦 Storage', price: 40, desc: 'Accumulates data for later processing.', minLevel: 2, io: { in: ['💾 Data'], out: ['💾 Data'] } },
    { id: 'overclock', category: 'upgrade', name: '🚀 Overclock', price: 80, desc: 'Speeds up the production of adjacent chips.', minLevel: 3, io: { in: ['⚡ Power'], out: ['🚀 Speed'] } },
    { id: 'splitter', category: 'logistics', name: '🌿 Splitter', price: 60, desc: 'Divides a data stream into multiple outputs.', minLevel: 2, io: { in: ['💾 Data'], out: ['💾 Data (x2)'] } },
    { id: 'miner', category: 'production', name: '⛏️ Miner', price: 120, desc: 'Extracts valuable Crypto ($10/u). High demand.', minLevel: 4, io: { in: ['⚡ Power', '🚀 Speed'], out: ['💎 Crypto'] } },
    { id: 'processor', category: 'upgrade', name: '⚙️ Processor', price: 100, desc: 'Refines data to increase its value (x5).', minLevel: 3, io: { in: ['⚡ Power', '💾 Data'], out: ['💾 Data'] } },
    { id: 'nexus', category: 'upgrade', name: '💠 Nexus', price: 250, desc: 'Late-game core. High cost, high reward.', minLevel: 6, io: { in: ['⚡ Power'], out: ['🔋 Energy', '🚀 Speed'] } },
    { id: 'market', category: 'sales', name: '🏪 Market Core', price: 200, desc: 'Stores data. When powered, sells through Sellers with 2.5x value.', minLevel: 5, io: { in: ['⚡ Power', '💾 Data'], out: ['💾 Data (Boosted)'] } },
    { id: 'autosell', category: 'sales', name: '🕹️ Auto Sell', price: 300, desc: 'Global Toggle: Sells all data in the system instantly when active.', minLevel: 7, io: { in: [], out: [] } }
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

    let controls = document.getElementById('shop-controls');
    if (!controls) {
        controls = document.createElement('div');
        controls.id = 'shop-controls';
        controls.style = "display: flex; flex-direction: column; gap: 8px; margin-bottom: 15px; padding: 10px; background: rgba(0,0,0,0.3); border-radius: 8px;";
        
        controls.innerHTML = `
            <div class="filter-row" style="display: flex; gap: 5px; flex-wrap: wrap;">
                <button class="filter-btn small ${shopStatusFilter==='all'?'active':''}" onclick="setStatusFilter('all')">All</button>
                <button class="filter-btn small ${shopStatusFilter==='unlocked'?'active':''}" onclick="setStatusFilter('unlocked')">🔓 Unlocked</button>
                <button class="filter-btn small ${shopStatusFilter==='locked'?'active':''}" onclick="setStatusFilter('locked')">🔒 Locked</button>
            </div>
            <select onchange="setShopSort(this.value)" style="background: #222; color: white; border: 1px solid #444; padding: 5px; border-radius: 4px; cursor: pointer;">
                <option value="price-asc" ${shopSort==='price-asc'?'selected':''}>💰 Lowest Price</option>
                <option value="price-desc" ${shopSort==='price-desc'?'selected':''}>💎 Highest Price</option>
                <option value="level" ${shopSort==='level'?'selected':''}>📈 Tech Level</option>
            </select>
        `;
        container.parentElement.insertBefore(controls, container);
    }

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

    if (shopFilter !== 'all') {
        items = items.filter(i => i.category === shopFilter);
    }

    if (shopStatusFilter === 'unlocked') {
        items = items.filter(i => i.minLevel <= level);
    } else if (shopStatusFilter === 'locked') {
        items = items.filter(i => i.minLevel > level);
    }

    items.sort((a, b) => {
        const aLocked = a.minLevel > level;
        const bLocked = b.minLevel > level;

        
        if (aLocked !== bLocked) return aLocked ? 1 : -1;

        
        if (a.minLevel !== b.minLevel) return a.minLevel - b.minLevel;

        
        return a.price - b.price;
    });

    container.innerHTML = '';
    items.forEach(item => {
        const isLocked = item.minLevel > level;
        const canAfford = money >= item.price;
        const div = document.createElement('div');
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
                <div><strong>Input:</strong> ${item.io.in.length > 0 ? item.io.in.join(', ') : 'None'}</div>
                <div><strong>Output:</strong> ${item.io.out.join(', ')}</div>
            </div>
            <div class="item-footer" style="font-size: 0.75em; border-top: 1px solid #444; pt-4 mt-2">
                ${isLocked ? `<span style="color:#e74c3c">🔒 Level ${item.minLevel}</span>` : `<span style="color:#2ecc71">✅ Unlocked</span>`}
                <span style="float:right">📏 4x4</span>
            </div>
        `;
        container.appendChild(div);
    });
}
