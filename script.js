// Configurações das plantas
const crops = {
    wheat: { name: "Trigo", icon: "🌾", cost: 10, revenue: 18, time: 3, xp: 10, minLevel: 1 },
    carrot: { name: "Cenoura", icon: "🥕", cost: 25, revenue: 50, time: 8, xp: 25, minLevel: 1 },
    tomato: { name: "Tomate", icon: "🍅", cost: 60, revenue: 130, time: 15, xp: 50, minLevel: 2 },
    pumpkin: { name: "Abóbora", icon: "🎃", cost: 150, revenue: 350, time: 30, xp: 120, minLevel: 3 }
};

// Estado do Jogo Inicial
let gameState = {
    coins: 60,
    level: 1,
    xp: 0,
    selectedCrop: 'wheat',
    plots: [
        { id: 0, status: 'empty', crop: null, growTimeLeft: 0, totalGrowTime: 0, locked: false, unlockCost: 0 },
        { id: 1, status: 'empty', crop: null, growTimeLeft: 0, totalGrowTime: 0, locked: false, unlockCost: 0 },
        { id: 2, status: 'empty', crop: null, growTimeLeft: 0, totalGrowTime: 0, locked: false, unlockCost: 0 },
        { id: 3, status: 'empty', crop: null, growTimeLeft: 0, totalGrowTime: 0, locked: true, unlockCost: 100 },
        { id: 4, status: 'empty', crop: null, growTimeLeft: 0, totalGrowTime: 0, locked: true, unlockCost: 250 },
        { id: 5, status: 'empty', crop: null, growTimeLeft: 0, totalGrowTime: 0, locked: true, unlockCost: 500 },
        { id: 6, status: 'empty', crop: null, growTimeLeft: 0, totalGrowTime: 0, locked: true, unlockCost: 1000 },
        { id: 7, status: 'empty', crop: null, growTimeLeft: 0, totalGrowTime: 0, locked: true, unlockCost: 2000 },
        { id: 8, status: 'empty', crop: null, growTimeLeft: 0, totalGrowTime: 0, locked: true, unlockCost: 5000 }
    ]
};

// Renderizar Loja
function renderShop() {
    const shopContainer = document.getElementById('shop-items');
    shopContainer.innerHTML = '';

    for (let key in crops) {
        const crop = crops[key];
        const isLocked = gameState.level < crop.minLevel;
        
        const itemDiv = document.createElement('div');
        itemDiv.className = `seed-item ${gameState.selectedCrop === key ? 'selected' : ''} ${isLocked ? 'disabled' : ''}`;
        
        itemDiv.innerHTML = `
            <div class="seed-details">
                <span class="seed-name">${crop.icon} ${crop.name}</span>
                <span class="seed-meta">Tempo: ${crop.time}s | Lucro: +${crop.revenue - crop.cost}💰</span>
                <span class="seed-meta">Nível Mínimo: ${crop.minLevel}</span>
            </div>
            <div class="seed-price">${crop.cost} 💰</div>
        `;

        if (!isLocked) {
            itemDiv.onclick = () => {
                gameState.selectedCrop = key;
                renderShop();
            };
        }
        shopContainer.appendChild(itemDiv);
    }
}

// Renderizar Canteiros (Grid)
function renderGrid() {
    const gridContainer = document.getElementById('farm-grid');
    gridContainer.innerHTML = '';

    gameState.plots.forEach(plot => {
        const plotDiv = document.createElement('div');
        plotDiv.className = `plot ${plot.locked ? 'locked' : ''}`;
        
        if (plot.locked) {
            plotDiv.innerHTML = `
                <div class="lock-overlay">
                    🔒 Trancado<br>
                    <button class="btn-action" onclick="unlockPlot(${plot.id}, ${plot.unlockCost}, event)">Comprar por ${plot.unlockCost}💰</button>
                </div>
            `;
        } else {
            let content = '';
            let statusText = 'Vazio';
            let barDisplay = 'none';
            let barWidth = '0%';

            if (plot.status === 'growing') {
                content = '🌱';
                statusText = `Crescendo (${plot.growTimeLeft}s)`;
                barDisplay = 'block';
                barWidth = `${((plot.totalGrowTime - plot.growTimeLeft) / plot.totalGrowTime) * 100}%`;
            } else if (plot.status === 'ready') {
                content = crops[plot.crop].icon;
                statusText = 'Pronto! Colher';
            }

            plotDiv.innerHTML = `
                <div class="plot-status">${statusText}</div>
                <div class="plot-content">${content}</div>
                <div class="progress-bar-container" style="display: ${barDisplay};">
                    <div class="progress-bar" style="width: ${barWidth};"></div>
                </div>
            `;

            plotDiv.onclick = () => handlePlotClick(plot.id);
        }

        gridContainer.appendChild(plotDiv);
    });
}

// Ação ao clicar no lote de terra
function handlePlotClick(plotId) {
    const plot = gameState.plots[plotId];
    if (plot.locked) return;

    if (plot.status === 'empty') {
        // Plantar
        const selectedCropData = crops[gameState.selectedCrop];
        if (gameState.coins >= selectedCropData.cost) {
            gameState.coins -= selectedCropData.cost;
            plot.status = 'growing';
            plot.crop = gameState.selectedCrop;
            plot.growTimeLeft = selectedCropData.time;
            plot.totalGrowTime = selectedCropData.time;
            updateHUD();
            renderGrid();
        } else {
            alert('Moedas insuficientes para comprar esta semente!');
        }
    } else if (plot.status === 'ready') {
        // Colher
        const cropData = crops[plot.crop];
        gameState.coins += cropData.revenue;
        gameState.xp += cropData.xp;
        
        // Checar Level Up
        const xpNeeded = gameState.level * 100;
        if (gameState.xp >= xpNeeded) {
            gameState.xp -= xpNeeded;
            gameState.level++;
            alert(`🎉 PARABÉNS! Sua fazenda subiu para o Nível ${gameState.level}! Novas sementes podem estar disponíveis!`);
            renderShop();
        }

        // Resetar lote
        plot.status = 'empty';
        plot.crop = null;
        updateHUD();
        renderGrid();
    }
}

// Desbloquear novo lote
function unlockPlot(plotId, cost, event) {
    event.stopPropagation(); // Impede o gatilho de plantar acidentalmente
    if (gameState.coins >= cost) {
        gameState.coins -= cost;
        gameState.plots[plotId].locked = false;
        updateHUD();
        renderGrid();
    } else {
        alert('Moedas insuficientes para expandir a fazenda!');
    }
}

// Atualizar placar/HUD
function updateHUD() {
    document.getElementById('coin-count').innerText = gameState.coins;
    document.getElementById('farm-level').innerText = gameState.level;
    document.getElementById('xp-count').innerText = gameState.xp;
    
    const xpNeeded = gameState.level * 100;
    document.querySelector('.stat:nth-child(3)').innerHTML = `<span class="stat-icon">📈</span> XP: ${gameState.xp}/${xpNeeded}`;
}

// Game Loop (Atualiza o contador de crescimento a cada 1 segundo)
setInterval(() => {
    let changed = false;
    gameState.plots.forEach(plot => {
        if (plot.status === 'growing') {
            plot.growTimeLeft--;
            if (plot.growTimeLeft <= 0) {
                plot.status = 'ready';
            }
            changed = true;
        }
    });
    if (changed) {
        renderGrid();
    }
}, 1000);

// Inicialização do Jogo
updateHUD();
renderShop();
renderGrid();
