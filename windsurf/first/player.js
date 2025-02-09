class Player {
    constructor(x, y, tileMap) {
        this.x = x;
        this.y = y;
        this.tileMap = tileMap;
        this.width = 32;
        this.height = 32;
        this.speed = 5;
        this.showHitbox = false;
        
        // Make hitbox 60% of visual size
        this.hitboxScale = 0.6;
        this.hitboxWidth = this.width * this.hitboxScale;
        this.hitboxHeight = this.height * this.hitboxScale;
        this.hitboxOffsetX = (this.width - this.hitboxWidth) / 2;
        this.hitboxOffsetY = (this.height - this.hitboxHeight) / 2;
        
        // Movement state
        this.keys = {
            w: false,
            a: false,
            s: false,
            d: false
        };
        
        // Set up keyboard listeners
        window.addEventListener('keydown', (e) => this.handleKeyDown(e));
        window.addEventListener('keyup', (e) => this.handleKeyUp(e));
    }
    
    handleKeyDown(event) {
        if (event.key in this.keys) {
            this.keys[event.key] = true;
        } else if (event.key === 'h') { // Toggle hitbox visibility with 'h' key
            this.showHitbox = !this.showHitbox;
        }
    }
    
    handleKeyUp(event) {
        if (event.key in this.keys) {
            this.keys[event.key] = false;
        }
    }
    
    // Toggle hitbox visibility
    toggleHitbox() {
        this.showHitbox = !this.showHitbox;
    }
    
    // Get hitbox for collision detection
    getHitbox() {
        return {
            x: this.x + this.hitboxOffsetX,
            y: this.y + this.hitboxOffsetY,
            width: this.hitboxWidth,
            height: this.hitboxHeight
        };
    }
    
    // Check if a position is walkable
    isWalkable(x, y) {
        // Convert pixel coordinates to tile coordinates
        const tileX = Math.floor(x / this.tileMap.tileSize);
        const tileY = Math.floor(y / this.tileMap.tileSize);
        
        // Check map boundaries
        if (tileX < 0 || tileX >= this.tileMap.mapWidth || 
            tileY < 0 || tileY >= this.tileMap.mapHeight) {
            return false;
        }
        
        // Check if tile is walkable (type 1)
        return this.tileMap.tiles[tileY][tileX] === 1;
    }
    
    // Check if movement would cause collision
    canMove(dx, dy) {
        const hitbox = this.getHitbox();
        const newX = hitbox.x + dx;
        const newY = hitbox.y + dy;
        
        // Check all corners of hitbox
        return this.isWalkable(newX, newY) && 
               this.isWalkable(newX + hitbox.width, newY) &&
               this.isWalkable(newX, newY + hitbox.height) &&
               this.isWalkable(newX + hitbox.width, newY + hitbox.height);
    }
    
    // Update player position based on input
    update() {
        let dx = 0;
        let dy = 0;
        
        // Get keyboard input
        if (this.keys['w'] || this.keys['ArrowUp']) dy -= this.speed;
        if (this.keys['s'] || this.keys['ArrowDown']) dy += this.speed;
        if (this.keys['a'] || this.keys['ArrowLeft']) dx -= this.speed;
        if (this.keys['d'] || this.keys['ArrowRight']) dx += this.speed;
        
        // Normalize diagonal movement
        if (dx !== 0 && dy !== 0) {
            const factor = 1 / Math.sqrt(2);
            dx *= factor;
            dy *= factor;
        }
        
        // Move if no collision and round position
        if (dx !== 0 && this.canMove(dx, 0)) {
            this.x += dx;
            this.x = Math.round(this.x);
        }
        if (dy !== 0 && this.canMove(0, dy)) {
            this.y += dy;
            this.y = Math.round(this.y);
        }
    }
    
    // Draw the player
    draw(ctx) {
        // Draw player as a square
        ctx.fillStyle = 'blue';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Draw hitbox if enabled
        if (this.showHitbox) {
            const hitbox = this.getHitbox();
            ctx.strokeStyle = 'red';
            ctx.lineWidth = 2;
            ctx.strokeRect(hitbox.x, hitbox.y, hitbox.width, hitbox.height);
        }
    }
}
