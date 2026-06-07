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

const gridSize = 100;
let chips = [];
let connections = [];

// Definição das conquistas com condições de progresso
let achievements = [
    { 
        id: 'first_rich', 
        title: 'Capitalista', 
        desc: 'Acumule $1,000 em caixa.', 
        condition: () => money >= 1000, 
        progressCondition: () => ({ current: money, target: 1000 }), 
        achieved: false 
    },
    { 
        id: 'data_master', 
        title: 'Mestre dos Dados', 
        desc: 'Tenha 100 dados processando no sistema.', 
        condition: () => chips.reduce((a, c) => a + (c.data || 0), 0) >= 100, 
        progressCondition: () => ({ current: chips.reduce((a, c) => a + (c.data || 0), 0), target: 100 }), 
        achieved: false 
    },
    { id: 'level_5', title: 'Engenheiro Sênior', desc: 'Alcance o nível 5.', condition: () => level >= 5, progressCondition: () => ({ current: level, target: 5 }), achieved: false },
    { 
        id: 'mass_prod', 
        title: 'Produção em Massa', 
        desc: 'Construa 15 chips na sua fábrica.', 
        condition: () => chips.length >= 15, 
        progressCondition: () => ({ current: chips.length, target: 15 }), 
        achieved: false 
    },
    { id: 'overclock_king', title: 'Veloz e Furioso', desc: 'Tenha um chip operando em Overclock.', condition: () => chips.some(c => c.overclocked), progressCondition: null, achieved: false } // Conquista booleana, sem barra de progresso
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
    
    // Atualiza a loja para marcar o item selecionado
    if (typeof renderShop === 'function') renderShop();
}

function changeZoom(delta) {
    zoom = Math.min(Math.max(0.2, zoom + delta), 1.5);
    updateViewport();
}

function updateViewport() {
    viewport.style.transform = `translate(${camX}px, ${camY}px) scale(${zoom})`;
}

function getCoords(index) {
    return { x: index % gridSize, y: Math.floor(index / gridSize) };
}

function isAreaFree(index, w, h) {
    const coords = getCoords(index);
    for (let i = 0; i < w; i++) {
        for (let j = 0; j < h; j++) {
            const checkIdx = (coords.y + j) * gridSize + (coords.x + i);
            if (chips.some(c => c.occupiedIndices.includes(checkIdx))) {
                return false;
            }
        }
    }
    return true;
}