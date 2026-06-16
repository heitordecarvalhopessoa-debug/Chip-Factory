if (!document.getElementById('shop-animations-css')) {
    const style = document.createElement('style');
    style.id = 'shop-animations-css';
    style.innerHTML = `
        .shop-item {
            transition: transform 0.1s ease-out, box-shadow 0.1s ease-out, border-color 0.1s ease-out;
            backface-visibility: hidden;
            transform: perspective(1px) translateZ(0);
        }

        .shop-item:not(.locked):hover {
            transform: perspective(1px) scale(1.02) translateZ(0);
            z-index: 10;
            border-color: rgba(0, 255, 136, 0.5) !important;
        }

        @keyframes affordable-pulse {
            0% { border-color: rgba(0, 255, 136, 0.2); }
            50% { border-color: rgba(0, 255, 136, 0.6); box-shadow: inset 0 0 8px rgba(0, 255, 136, 0.1); }
            100% { border-color: rgba(0, 255, 136, 0.2); }
        }

        .shop-item.can-afford:not(.locked) {
            animation: affordable-pulse 2s infinite ease-in-out;
        }

        @keyframes shake-error {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-4px); }
            75% { transform: translateX(4px); }
        }
        .insufficient-funds {
            animation: shake-error 0.3s ease-in-out;
            border-color: #ff4444 !important;
        }

        .filter-btn { 
            transition: background 0.2s, color 0.2s, box-shadow 0.2s; 
            backface-visibility: hidden;
            transform: perspective(1px) translateZ(0);
        }
        .filter-btn:hover { filter: brightness(1.2); }
        .filter-btn.active { box-shadow: 0 0 12px currentColor; }

    `;
    document.head.appendChild(style);
}

let shopFilter = 'all';
let shopSort = 'price-asc';
let shopStatusFilter = 'all';

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

function getCategoryColor(cat) {
    const colors = {
        'energy': '#00d4ff',
        'production': '#fbbf24',
        'sales': '#00ff88',
        'logistics': '#a855f7',
        'upgrade': '#ff00ff',
        'neutral': '#eeeeee'
    };
    return colors[cat] || '#888';
}

function renderShop() {
    const container = document.getElementById('shop-items-container');
    if (!container) return;
    
    const shopPanel = container.parentElement;

    let header = document.getElementById('shop-header');
    if (!header) {
        header = document.createElement('div');
        header.id = 'shop-header';
        header.style = "display: flex; justify-content: space-between; align-items: center; padding: 14px; background: #111; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px 8px 0 0; transition: all 0.3s ease; margin-bottom: 0; user-select: none;";
        header.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px; pointer-events: none;">
                <span style="font-size: 1.2em; filter: drop-shadow(0 0 5px #00ff88);">🏭</span>
                <span style="font-weight: 900; letter-spacing: 3px; color: #fff; font-size: 0.8em;">COMPONENT STORE</span>
            </div>
        `;
        shopPanel.insertBefore(header, shopPanel.firstChild);
    }

    let body = document.getElementById('shop-body');
    if (!body) {
        body = document.createElement('div');
        body.id = 'shop-body';
        body.style = "display: flex; flex-direction: column; gap: 0; transition: opacity 0.3s ease;";
        
        const existingControls = document.getElementById('shop-controls');
        if (existingControls) body.appendChild(existingControls);
        body.appendChild(container);
        shopPanel.appendChild(body);
    }
    
    body.style.display = 'flex';

    let controls = document.getElementById('shop-controls');
    if (!controls) {
        controls = document.createElement('div');
        controls.id = 'shop-controls';
        controls.style = "display: flex; flex-direction: column; gap: 10px; padding: 15px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.1); border-top: none; border-bottom: none;";
        
        controls.innerHTML = `
            <div style="font-size: 0.65em; color: #00ff88; font-weight: 900; letter-spacing: 1.5px; margin-bottom: 2px;">CATEGORIES</div>
            <div class="category-filters" style="display: flex; gap: 4px; flex-wrap: wrap; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 12px;">
                <button class="filter-btn small" data-filter="all" onclick="setShopFilter('all')" style="flex: 1; min-width: 50px;">ALL</button>
                <button class="filter-btn small" data-filter="energy" onclick="setShopFilter('energy')" style="flex: 1; border-color: ${getCategoryColor('energy')}">POWER</button>
                <button class="filter-btn small" data-filter="production" onclick="setShopFilter('production')" style="flex: 1; border-color: ${getCategoryColor('production')}">PROD</button>
                <button class="filter-btn small" data-filter="sales" onclick="setShopFilter('sales')" style="flex: 1; border-color: ${getCategoryColor('sales')}">SALES</button>
                <button class="filter-btn small" data-filter="logistics" onclick="setShopFilter('logistics')" style="flex: 1; border-color: ${getCategoryColor('logistics')}">LOGIC</button>
                <button class="filter-btn small" data-filter="upgrade" onclick="setShopFilter('upgrade')" style="flex: 1; border-color: ${getCategoryColor('upgrade')}">UPGR</button>
                <button class="filter-btn small" data-filter="neutral" onclick="setShopFilter('neutral')" style="flex: 1; border-color: ${getCategoryColor('neutral')}">NEUT</button>
            </div>
            
            <div style="display: flex; justify-content: space-between; align-items: flex-end; gap: 15px;">
                <div style="flex: 1;">
                    <div style="font-size: 0.65em; color: #888; font-weight: 900; letter-spacing: 1px; margin-bottom: 5px;">STOCK</div>
                    <div class="filter-row" style="display: flex; gap: 4px;">
                        <button class="filter-btn small" data-status="all" onclick="setStatusFilter('all')" style="flex:1; padding: 4px;">ALL</button>
                        <button class="filter-btn small" data-status="unlocked" onclick="setStatusFilter('unlocked')" style="flex:1; padding: 4px;">🔓</button>
                        <button class="filter-btn small" data-status="locked" onclick="setStatusFilter('locked')" style="flex:1; padding: 4px;">�</button>
                    </div>
                </div>
                <div style="flex: 1.5;">
                    <div style="font-size: 0.65em; color: #888; font-weight: 900; letter-spacing: 1px; margin-bottom: 5px;">SORTING</div>
                    <select id="shop-sort-select" onchange="setShopSort(this.value)" style="width: 100%; background: #000; color: #fff; border: 1px solid #333; padding: 4px; border-radius: 4px; cursor: pointer; font-size: 0.8em; font-weight: bold;">
                        <option value="price-asc">💰 Price: Low to High</option>
                        <option value="price-desc">💎 Price: High to Low</option>
                        <option value="level">📈 Tech Level</option>
                    </select>
                </div>
            </div>
        `;
        body.insertBefore(controls, container);
    }

    controls.querySelectorAll('[data-filter]').forEach(btn => btn.classList.toggle('active', btn.dataset.filter === shopFilter));
    controls.querySelectorAll('[data-status]').forEach(btn => btn.classList.toggle('active', btn.dataset.status === shopStatusFilter));
    
    const select = document.getElementById('shop-sort-select');
    if (select && document.activeElement !== select) {
        select.value = shopSort;
    }

    Object.assign(container.style, {
        maxHeight: "65vh",
        overflowY: "auto",
        padding: "15px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        scrollbarWidth: "thin",
        scrollbarColor: "#00ff88 #222",
        background: "rgba(0,0,0,0.2)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "0 0 8px 8px",
        borderTop: "none"
    });

    let items = [...shopItems];

    items = items.filter(i => !i.needsResearch || (typeof researchedChips !== 'undefined' && researchedChips.includes(i.id)));

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
        div.className = `shop-item ${isLocked ? 'locked' : ''} ${canAfford ? 'can-afford' : ''} ${selectedTool === item.id ? 'active' : ''}`;
        div.id = `btn-${item.id}`;
        div.onclick = () => selectTool(item.id);
        
        const catColor = getCategoryColor(item.category);

        div.innerHTML = `
            <div class="shop-item-header" style="display:flex; justify-content:space-between; align-items: center; margin-bottom: 6px;">
                <span style="background: ${catColor}33; color: ${catColor}; padding: 2px 6px; border-radius: 4px; font-size: 0.65em; font-weight: 900; border: 1px solid ${catColor}66;">
                    ${item.category.toUpperCase()}
                </span>
                <span class="item-price" style="font-weight: 900; color: ${canAfford ? '#00ff88' : '#ff4444'}; font-size: 1.1em;">
                    $${new Intl.NumberFormat('en-US').format(item.price)}
                </span>
            </div>
            <div class="name" style="font-size: 1.1em; font-weight: bold; color: #fff; margin-bottom: 4px;">${item.name}</div>
            <div class="desc" style="font-size: 0.8em; color: #999; line-height: 1.4; margin-bottom: 12px; min-height: 2.8em;">${item.desc}</div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 0.7em; background: rgba(0,0,0,0.3); padding: 8px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.05); margin-bottom: 10px;">
                <div><span style="color: #666; font-weight: bold; display: block; margin-bottom: 2px;">INPUT</span> ${item.io.in.length > 0 ? item.io.in.join(', ') : '<span style="color:#444">NONE</span>'}</div>
                <div><span style="color: #666; font-weight: bold; display: block; margin-bottom: 2px;">OUTPUT</span> ${item.io.out.join(', ')}</div>
            </div>

            <div class="item-footer" style="font-size: 0.7em; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 8px;">
                ${isLocked 
                    ? `<span style="color:#ff4444; font-weight:bold;">🔒 LVL ${item.minLevel} REQUIRED</span>` 
                    : `<span style="color:#00ff88; font-weight:bold;">✨ READY TO DEPLOY</span>`}
                <span style="color: #444; font-weight: bold;">SIZE 4x4</span>
            </div>
        `;
        container.appendChild(div);
    });
}
