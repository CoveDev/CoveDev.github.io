const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Create game objects
const tileMap = new TileMap();
tileMap.initializeMap();

// Create player in the center of the map (which is the starting room)
const centerX = Math.floor(tileMap.mapWidth / 2) * tileMap.tileSize;
const centerY = Math.floor(tileMap.mapHeight / 2) * tileMap.tileSize;
const player = new Player(centerX, centerY, tileMap);

// Create camera centered on player
const camera = new Camera(player);
let mapInitialized = true;

// Initialize keyboard state
const keys = {};

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

// Handle mouse clicks
canvas.addEventListener('click', (event) => {
    // Get click coordinates relative to canvas and adjust for camera
    const rect = canvas.getBoundingClientRect();
    const transform = ctx.getTransform();
    const clickX = (event.clientX - rect.left - transform.e) / transform.a;
    const clickY = (event.clientY - rect.top - transform.f) / transform.d;
    
    // Convert to tile coordinates
    const tileX = Math.floor(clickX / tileMap.tileSize);
    const tileY = Math.floor(clickY / tileMap.tileSize);
    
    // Log tile info for debugging
    if (tileX >= 0 && tileX < tileMap.mapWidth && tileY >= 0 && tileY < tileMap.mapHeight) {
        console.log(`Clicked tile (${tileX}, ${tileY}): ${tileMap.tiles[tileY][tileX]}`);
    }
});

// Handle keyboard input
window.addEventListener('keydown', (event) => {
    keys[event.key] = true;
    if (event.key === 'h') {
        player.toggleHitbox();
    }
});

window.addEventListener('keyup', (event) => {
    keys[event.key] = false;
});

// Game loop
function gameLoop() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Save context state
    ctx.save();
    
    // Update camera
    camera.update();
    
    // Apply camera transform with rounded positions
    ctx.translate(
        Math.round(-camera.x + canvas.width/2), 
        Math.round(-camera.y + canvas.height/2)
    );
    
    // Draw map
    tileMap.draw(ctx);
    
    // Draw player
    player.update();
    player.draw(ctx);
    
    // Restore context state
    ctx.restore();
    
    // Continue game loop
    requestAnimationFrame(gameLoop);
}

// Initial setup
resizeCanvas();

// Add event listeners
window.addEventListener('resize', resizeCanvas);

// Wait for tileset to load
window.addEventListener('load', () => {
    // Start the animation loop
    gameLoop();
});
