let money = 100;
let selectedTool = null;
let firstSelection = null;
let pendingPort = null;
let zoom = 1.0;
let level = 1;
let xp = 0;
let xpTarget = 100;
let camX = 0, camY = 0;
let isPanning = false;
let tutorialStep = 0;
let currentTickIncome = 0;
let incomeHistory = [];

let prestigeMultiplier = 1;
let prestigePoints = 0;
let researchedChips = [];

const gridSize = 100;
let chips = [];
let connections = [];

const shopItems = [
    { id: 'charger', category: 'energy', name: '⚡ Charger', price: 50, desc: 'Base power source for the system.', minLevel: 1, io: { in: [], out: ['⚡ Power'] } },
    { id: 'giver', category: 'production', name: '📦 Giver', price: 20, desc: 'Generates 1 basic data per second.', minLevel: 1, io: { in: ['⚡ Power', '🚀 Speed'], out: ['💾 Data'] } },
    { id: 'seller', category: 'sales', name: '💰 Seller', price: 30, desc: 'Converts data and crystals into cash.', minLevel: 1, io: { in: ['💾 Data'], out: ['💵 Cash'] } },
    { id: 'battery', category: 'energy', name: '🔋 Battery', price: 60, desc: 'Required to power Miners. Stores energy.', minLevel: 2, io: { in: ['⚡ Power'], out: ['🔋 Energy'] } },
    { id: 'storage', category: 'logistics', name: '📦 Storage', price: 50, desc: 'Accumulates data for later processing.', minLevel: 2, io: { in: ['💾 Data'], out: ['💾 Data'] } },
    { id: 'overclock', category: 'upgrade', name: '🚀 Overclock', price: 100, desc: 'Speeds up the production of adjacent chips.', minLevel: 3, io: { in: ['⚡ Power'], out: ['🚀 Speed'] } },
    { id: 'splitter', category: 'logistics', name: '🌿 Splitter', price: 50, desc: 'Divides a data stream into multiple outputs.', minLevel: 2, io: { in: ['💾 Data'], out: ['💾 Data (x2)'] } },
    { id: 'miner', category: 'production', name: '⛏️ Miner', price: 150, desc: 'Extracts valuable Crypto ($10/u). High demand.', minLevel: 4, io: { in: ['⚡ Power', '🚀 Speed'], out: ['💎 Crypto'] } },
    { id: 'processor', category: 'upgrade', name: '⚙️ Processor', price: 100, desc: 'Refines data to increase its value (x5).', minLevel: 3, needsResearch: true, researchCost: 1500, io: { in: ['⚡ Power', '💾 Data'], out: ['💾 Data'] } },
    { id: 'nexus', category: 'upgrade', name: '💠 Nexus', price: 250, desc: 'Late-game core. High cost, high reward.', minLevel: 6, needsResearch: true, researchCost: 5000, io: { in: ['⚡ Power'], out: ['🔋 Energy', '🚀 Speed'] } },
    { id: 'vault', category: 'logistics', name: '🛡️ Vault', price: 200, desc: 'High-capacity data storage (1000 units).', minLevel: 4, needsResearch: true, researchCost: 2500, io: { in: ['💾 Data'], out: ['💾 Data'] } },
    { id: 'market', category: 'sales', name: '🏪 Market Core', price: 100, desc: 'Stores data. When powered, sells through Sellers with 2.5x value.', minLevel: 5, io: { in: ['⚡ Power', '💾 Data'], out: ['💾 Data (Boosted)'] } },
    { id: 'bridge', category: 'neutral', name: '🌉 Data Bridge', price: 100, desc: 'A neutral relay that organizes complex connections. Research required.', minLevel: 3, needsResearch: true, researchCost: 1200, io: { in: ['💾 Data'], out: ['💾 Data'] } },
    { id: 'autosell', category: 'sales', name: '🕹️ Auto Sell', price: 250, desc: 'Global Toggle: Sells all data in the system instantly when active.', minLevel: 7, io: { in: [], out: [] } },
    { id: 'analytics', category: 'neutral', name: '📊 Analytics', price: 150, desc: 'Displays a real-time graph of your income. Requires power.', minLevel: 3, needsResearch: true, researchCost: 1000, io: { in: ['⚡ Power'], out: [] } }
];

let achievements = [
    { 
        id: 'first_rich', 
        title: 'Capitalist', 
        desc: 'Accumulate $1,000 in cash.', 
        condition: () => money >= 1000, 
        progressCondition: () => ({ current: money, target: 1000 }), 
        achieved: false 
    },
    { 
        id: 'data_master', 
        title: 'Data Master', 
        desc: 'Have 100 data units processing in the system.', 
        condition: () => chips.reduce((a, c) => a + (c.data || 0), 0) >= 100, 
        progressCondition: () => ({ current: chips.reduce((a, c) => a + (c.data || 0), 0), target: 100 }), 
        achieved: false 
    },
    { id: 'level_5', title: 'Senior Engineer', desc: 'Reach level 5.', condition: () => level >= 5, progressCondition: () => ({ current: level, target: 5 }), achieved: false },
    { 
        id: 'mass_prod', 
        title: 'Mass Production', 
        desc: 'Build 15 chips in your factory.', 
        condition: () => chips.length >= 15, 
        progressCondition: () => ({ current: chips.length, target: 15 }), 
        achieved: false 
    },
    { id: 'overclock_king', title: 'Fast & Furious', desc: 'Have a chip operating in Overclock.', condition: () => chips.some(c => c.overclocked), progressCondition: null, achieved: false },
    { 
        id: 'tycoon', 
        title: 'Tycoon', 
        desc: 'Accumulate $5,000 in cash.', 
        condition: () => money >= 5000, 
        progressCondition: () => ({ current: money, target: 5000 }), 
        achieved: false 
    },
    { 
        id: 'nexus_built', 
        title: 'Nexus Link', 
        desc: 'Construct a Nexus Core in your factory.', 
        condition: () => chips.some(c => c.type === 'nexus'), 
        achieved: false 
    },
    { 
        id: 'power_grid', 
        title: 'Power Grid', 
        desc: 'Have 5 batteries connected simultaneously.', 
        condition: () => chips.filter(c => c.type === 'battery').length >= 5, 
        progressCondition: () => ({ current: chips.filter(c => c.type === 'battery').length, target: 5 }), 
        achieved: false 
    },
    { 
        id: 'industrialist', 
        title: 'Industrialist', 
        desc: 'Have 10 production chips (Givers or Miners).', 
        condition: () => chips.filter(c => c.type === 'giver' || c.type === 'miner').length >= 10, 
        progressCondition: () => ({ current: chips.filter(c => c.type === 'giver' || c.type === 'miner').length, target: 10 }), 
        achieved: false 
    }
];

const gridElement = document.getElementById('grid');
const viewport = document.getElementById('viewport');

function selectTool(tool) {
    selectedTool = tool;
    firstSelection = null;
    document.querySelectorAll('.tool-item').forEach(b => {
        b.classList.remove('active');
        if(b.id === `btn-${tool}`) b.classList.add('active');
    });
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('selected'));
    
    const cursors = {
        'default': 'default',
        'pan': 'grab',
        'link': 'crosshair',
        'delete': 'not-allowed',
        'move': 'move'
    }
    document.body.style.cursor = cursors[tool] || 'default';

    if (typeof updatePlacementGhost === 'function') updatePlacementGhost();
    if (typeof renderShop === 'function') renderShop();
}

function changeZoom(delta) {
    zoom = Math.min(Math.max(0.2, zoom + delta), 1.5);
    updateViewport();
}

function updateGridHighlighting() {
    document.querySelectorAll('.cell.valid-placement, .cell.invalid-placement').forEach(el => {
        el.classList.remove('valid-placement', 'invalid-placement');
    });
}

function updateViewport() {
    viewport.style.transform = `translate(${camX}px, ${camY}px) scale(${zoom})`;
}

function getCoords(index) {
    return { x: index % gridSize, y: Math.floor(index / gridSize) };
}

function isAreaFree(index, w, h, ignoreChipId = null) {
    const coords = getCoords(index);
    for (let i = 0; i < w; i++) {
        for (let j = 0; j < h; j++) {
            const checkIdx = (coords.y + j) * gridSize + (coords.x + i);
            if (chips.some(c => c.id !== ignoreChipId && c.occupiedIndices.includes(checkIdx))) {
                return false;
            }
        }
    }
    return true;
}
