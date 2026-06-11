const tutorialSteps = [
    {
        title: "Welcome to Chip Factory!",
        text: "Let's build your first production line. First, select the ⚡ **Charger** in the shop and place it on the grid.",
        check: () => chips.some(c => c.type === 'charger')
    },
    {
        title: "Energy Source",
        text: "Great! Now you need something to produce data. Buy a 📦 **Giver** and place it near the Charger.",
        check: () => chips.some(c => c.type === 'giver')
    },
    {
        title: "Powering Up",
        text: "Chips need power! Select the **Link Tool** (or hold Shift), click the output port (blue) of the **Charger** and connect it to the input port of the **Giver**.",
        check: () => connections.some(conn => conn.from.type === 'charger' && conn.to.type === 'giver')
    },
    {
        title: "Making Money",
        text: "Your Giver is producing data, but we need to sell it. Place a 💰 **Seller** chip on the grid.",
        check: () => chips.some(c => c.type === 'seller')
    },
    {
        title: "The Final Link",
        text: "Now connect the **Giver's data output** (green) to the **Seller's input**. You'll also need to power the Seller from the Charger!",
        check: () => connections.some(conn => conn.from.type === 'giver' && conn.to.type === 'seller')
    },
    {
        title: "You're Ready!",
        text: "Excellent! You are now generating profit. Keep expanding your factory, unlock new tech, and reach Level 10 to Ascend!",
        check: () => false
    }
];

function initTutorial() {
    if (tutorialStep === -1) return;
    createTutorialUI();
    updateTutorialDisplay();
}

function createTutorialUI() {
    if (document.getElementById('tutorial-container')) return;

    const container = document.createElement('div');
    container.id = 'tutorial-container';
    Object.assign(container.style, {
        position: 'fixed',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '400px',
        background: 'rgba(10, 10, 10, 0.95)',
        border: '2px solid #00ff88',
        borderRadius: '8px',
        padding: '20px',
        color: 'white',
        borderLeftWidth: '8px',
        zIndex: '10000',
        boxShadow: '0 0 30px rgba(0, 255, 136, 0.2)',
        transition: 'all 0.3s ease'
    });

    container.innerHTML = `
        <div id="tutorial-title" style="font-weight: 900; color: #00ff88; margin-bottom: 10px; font-size: 1.2em; text-transform: uppercase;"></div>
        <div id="tutorial-text" style="font-size: 0.95em; line-height: 1.5; margin-bottom: 15px;"></div>
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <span id="tutorial-progress" style="font-size: 0.8em; color: #666;"></span>
            <button id="tutorial-next" style="background: #00ff88; border: none; padding: 8px 15px; border-radius: 4px; color: black; font-weight: bold; cursor: pointer; display: none;">NEXT</button>
            <button id="tutorial-skip" onclick="finishTutorial()" style="background: none; border: none; color: #555; cursor: pointer; font-size: 0.8em; text-decoration: underline;">Skip Tutorial</button>
        </div>
    `;

    document.body.appendChild(container);
    
    document.getElementById('tutorial-next').onclick = () => {
        tutorialStep++;
        updateTutorialDisplay();
    };

    // Monitor progress
    const checkInterval = setInterval(() => {
        if (tutorialStep === -1) {
            clearInterval(checkInterval);
            return;
        }
        
        if (tutorialStep >= 0 && tutorialStep < tutorialSteps.length - 1) {
            if (tutorialSteps[tutorialStep].check()) {
                // Visual effect for step completion
                container.style.borderColor = '#ffff00';
                container.style.boxShadow = '0 0 40px rgba(255, 255, 0, 0.4)';
                
                // Automatic progress with a small delay for the player to notice completion
                const currentStep = tutorialStep;
                tutorialStep++;
                setTimeout(() => {
                    if (tutorialStep > currentStep) updateTutorialDisplay();
                }, 1000);
            }
        }
    }, 300);
}

function updateTutorialDisplay() {
    const step = tutorialSteps[tutorialStep];
    if (!step) {
        finishTutorial();
        return;
    }
    const container = document.getElementById('tutorial-container');
    if (!container) return;

    document.getElementById('tutorial-title').innerText = step.title;
    document.getElementById('tutorial-text').innerHTML = step.text;
    document.getElementById('tutorial-progress').innerText = `STEP ${tutorialStep + 1} / ${tutorialSteps.length}`;
    document.getElementById('tutorial-next').style.display = (tutorialStep === tutorialSteps.length - 1) ? 'block' : 'none';
    container.style.borderColor = '#00ff88';
    container.style.boxShadow = '0 0 30px rgba(0, 255, 136, 0.2)';
    
    if (tutorialStep === tutorialSteps.length - 1) {
        document.getElementById('tutorial-next').innerText = "START PLAYING";
    }
}

function finishTutorial() {
    tutorialStep = -1;
    const el = document.getElementById('tutorial-container');
    if (el) {
        el.style.opacity = '0';
        el.style.transform = 'translateX(-50%) translateY(20px)';
        setTimeout(() => el.remove(), 300);
    }
}