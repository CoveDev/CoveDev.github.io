// Get canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Get UI elements
const tileset1Image = document.getElementById('tileset1Image');
const tileset2Image = document.getElementById('tileset2Image');
const tileset1Button = document.getElementById('tileset1');
const tileset2Button = document.getElementById('tileset2');
const clearButton = document.getElementById('clear');
const randomButton = document.getElementById('random');

// Initialize game state
let currentTileset = 1;
let isDrawing = false;
const tilesetManager = new TilesetManager();

// Mouse state
let lastX = -1;
let lastY = -1;

// Convert mouse coordinates to grid position
function getGridPosition(e) {
    const rect = canvas.getBoundingClientRect();
    const scale = Math.min(
        canvas.width / tilesetManager.gridWidth,
        canvas.height / tilesetManager.gridHeight
    );
    const offsetX = (canvas.width - tilesetManager.gridWidth * scale) / 2;
    const offsetY = (canvas.height - tilesetManager.gridHeight * scale) / 2;
    
    return [
        Math.floor((e.clientX - rect.left - offsetX) / scale),
        Math.floor((e.clientY - rect.top - offsetY) / scale)
    ];
}

// Mouse event handlers
function handleMouseDown(e) {
    isDrawing = true;
    const [x, y] = getGridPosition(e);
    placeTile(x, y, e.button === 2 ? 0 : currentTileset);
}

function handleMouseMove(e) {
    if (!isDrawing) return;
    
    const [x, y] = getGridPosition(e);
    if (x !== lastX || y !== lastY) {
        placeTile(x, y, e.button === 2 ? 0 : currentTileset);
        lastX = x;
        lastY = y;
    }
}

function handleMouseUp() {
    isDrawing = false;
    lastX = lastY = -1;
}

function placeTile(x, y, type) {
    tilesetManager.placeTile(x, y, type);
}

// Event listeners
canvas.addEventListener('mousedown', handleMouseDown);
canvas.addEventListener('mousemove', handleMouseMove);
canvas.addEventListener('mouseup', handleMouseUp);
canvas.addEventListener('mouseleave', handleMouseUp);
canvas.addEventListener('contextmenu', e => e.preventDefault());

// Keyboard controls
document.addEventListener('keydown', e => {
    if (e.altKey) {
        currentTileset = 2;
        tileset1Button.classList.remove('active');
        tileset2Button.classList.add('active');
    }
});

document.addEventListener('keyup', e => {
    if (!e.altKey) {
        currentTileset = 1;
        tileset1Button.classList.add('active');
        tileset2Button.classList.remove('active');
    }
});

// Button controls
tileset1Button.addEventListener('click', () => {
    currentTileset = 1;
    tileset1Button.classList.add('active');
    tileset2Button.classList.remove('active');
});

tileset2Button.addEventListener('click', () => {
    currentTileset = 2;
    tileset1Button.classList.remove('active');
    tileset2Button.classList.add('active');
});

clearButton.addEventListener('click', () => tilesetManager.clear());
randomButton.addEventListener('click', () => tilesetManager.generateRandom());

// Handle window resize
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Draw loop
function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background grid
    const scale = Math.min(
        canvas.width / tilesetManager.gridWidth,
        canvas.height / tilesetManager.gridHeight
    );
    const offsetX = (canvas.width - tilesetManager.gridWidth * scale) / 2;
    const offsetY = (canvas.height - tilesetManager.gridHeight * scale) / 2;
    
    // Fill background
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(
        offsetX, offsetY,
        tilesetManager.gridWidth * scale,
        tilesetManager.gridHeight * scale
    );
    
    // Draw grid lines
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    
    // Vertical lines
    for (let x = 0; x <= tilesetManager.gridWidth; x++) {
        ctx.beginPath();
        ctx.moveTo(offsetX + x * scale, offsetY);
        ctx.lineTo(offsetX + x * scale, offsetY + tilesetManager.gridHeight * scale);
        ctx.stroke();
    }
    
    // Horizontal lines
    for (let y = 0; y <= tilesetManager.gridHeight; y++) {
        ctx.beginPath();
        ctx.moveTo(offsetX, offsetY + y * scale);
        ctx.lineTo(offsetX + tilesetManager.gridWidth * scale, offsetY + y * scale);
        ctx.stroke();
    }
    
    // Draw tiles
    tilesetManager.draw(ctx, tileset1Image, tileset2Image);
    
    // Continue animation
    requestAnimationFrame(draw);
}

// Start animation when images are loaded
Promise.all([
    new Promise(resolve => {
        if (tileset1Image.complete) resolve();
        else tileset1Image.onload = resolve;
    }),
    new Promise(resolve => {
        if (tileset2Image.complete) resolve();
        else tileset2Image.onload = resolve;
    })
]).then(() => {
    requestAnimationFrame(draw);
});
