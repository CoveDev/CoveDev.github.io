class Player {
    constructor(x, y, tileMap) {
        this.x = x;
        this.y = y;
        this.tileMap = tileMap;
        
        // Load sprite configuration
        this.spriteConfig = SPRITE_CONFIG.player;
        
        // Sprite properties
        this.sprite = document.getElementById('plr');
        this.scale = 2;
        this.lastFrameTime = 0;
        this.currentFrame = 0;
        
        // Animation states
        this.directionIndex = 0;
        this.state = 'idle';
        this.isActing = false;
        
        // Create direction mapping
        this.directionAngles = {
            'N': 180,    // Down
            'NE': 135,   // Down-right
            'E': 90,     // Right
            'SE': 45,    // Up-right
            'S': 0,      // Up
            'SW': 315,   // Up-left
            'W': 270,    // Left
            'NW': 225    // Down-left
        };
        
        // Movement
        this.speed = 5;
        this.moving = false;
        this.lastMoveAngle = 0;
        
        // Set up hitbox based on config
        this.hitboxWidth = this.spriteConfig.hitbox.width * this.scale;
        this.hitboxHeight = this.spriteConfig.hitbox.height * this.scale;
        this.hitboxOffsetX = this.spriteConfig.hitbox.offset.x * this.scale;
        this.hitboxOffsetY = this.spriteConfig.hitbox.offset.y * this.scale;
        this.showHitbox = false;
        
        // Movement state
        this.keys = {
            w: false,
            s: false,
            a: false,
            d: false
        };
        
        window.addEventListener('keydown', (e) => this.handleKeyDown(e));
        window.addEventListener('keyup', (e) => this.handleKeyUp(e));
    }
    
    // Convert movement angle to direction index
    angleToDirection(angle) {
        // Normalize angle to 0-360
        angle = ((angle % 360) + 360) % 360;
        
        // Find the closest direction
        let closestIndex = 0;
        let smallestAngleDiff = 360;
        
        this.spriteConfig.directions.forEach((dir, index) => {
            const targetAngle = this.directionAngles[dir];
            let angleDiff = Math.abs(angle - targetAngle);
            // Handle wraparound at 360/0
            if (angleDiff > 180) {
                angleDiff = 360 - angleDiff;
            }
            
            if (angleDiff < smallestAngleDiff) {
                smallestAngleDiff = angleDiff;
                closestIndex = index;
            }
        });
        
        // Debug output
        console.log(`Angle: ${angle}° → Direction: ${this.spriteConfig.directions[closestIndex]} (row ${closestIndex})`);
        
        return closestIndex;
    }
    
    // Update player state
    update(timestamp) {
        let dx = 0;
        let dy = 0;
        
        // Don't move while acting
        if (!this.isActing) {
            // Get keyboard input
            if (this.keys['w'] || this.keys['ArrowUp']) dy -= this.speed;
            if (this.keys['s'] || this.keys['ArrowDown']) dy += this.speed;
            if (this.keys['a'] || this.keys['ArrowLeft']) dx -= this.speed;
            if (this.keys['d'] || this.keys['ArrowRight']) dx += this.speed;
        }
        
        // Update movement state
        this.moving = dx !== 0 || dy !== 0;
        
        if (this.moving) {
            // Calculate movement angle and direction
            this.lastMoveAngle = Math.atan2(dy, dx) * 180 / Math.PI;
            // Convert atan2 angle to compass angle (clockwise from north)
            const compassAngle = (90 - this.lastMoveAngle + 360) % 360;
            this.directionIndex = this.angleToDirection(compassAngle);
            this.state = 'run';
            
            // Normalize diagonal movement
            if (dx !== 0 && dy !== 0) {
                const factor = 1 / Math.sqrt(2);
                dx *= factor;
                dy *= factor;
            }
            
            // Move if no collision
            if (dx !== 0 && this.canMove(dx, 0)) {
                this.x += dx;
                this.x = Math.round(this.x);
            }
            if (dy !== 0 && this.canMove(0, dy)) {
                this.y += dy;
                this.y = Math.round(this.y);
            }
        } else if (!this.isActing) {
            this.state = 'idle';
        }
        
        // Update animation
        this.updateAnimation(timestamp);
    }
    
    // Get hitbox for collision detection
    getHitbox() {
        return {
            x: Math.round(this.x + this.hitboxOffsetX),
            y: Math.round(this.y + this.hitboxOffsetY),
            width: this.hitboxWidth,
            height: this.hitboxHeight
        };
    }
    
    // Check if a position is walkable
    isWalkable(x, y) {
        const tileX = Math.floor(x / this.tileMap.tileSize);
        const tileY = Math.floor(y / this.tileMap.tileSize);
        
        if (tileX < 0 || tileX >= this.tileMap.mapWidth || 
            tileY < 0 || tileY >= this.tileMap.mapHeight) {
            return false;
        }
        
        return this.tileMap.tiles[tileY][tileX] === 1;
    }
    
    // Check if movement would cause collision
    canMove(dx, dy) {
        const hitbox = this.getHitbox();
        const newX = hitbox.x + dx;
        const newY = hitbox.y + dy;
        
        return this.isWalkable(newX, newY) && 
               this.isWalkable(newX + hitbox.width, newY) &&
               this.isWalkable(newX, newY + hitbox.height) &&
               this.isWalkable(newX + hitbox.width, newY + hitbox.height);
    }
    
    // Update animation frame
    updateAnimation(timestamp) {
        const animation = this.spriteConfig.animations[this.state];
        const frameTime = animation.frameTimes[this.currentFrame];
        
        if (timestamp - this.lastFrameTime > frameTime) {
            this.currentFrame = (this.currentFrame + 1) % animation.frames;
            this.lastFrameTime = timestamp;
            
            // If action animation finished, return to idle
            if (this.isActing && this.currentFrame === 0) {
                this.isActing = false;
                this.state = this.moving ? 'run' : 'idle';
            }
        }
    }
    
    // Draw the player
    draw(ctx) {
        const animation = this.spriteConfig.animations[this.state];
        const frameWidth = this.spriteConfig.frameSize.width;
        const frameHeight = this.spriteConfig.frameSize.height;
        
        drawSprite(ctx, (ctx) => {
            // Draw shadow
            if (this.spriteConfig.shadow) {
                const shadow = this.spriteConfig.shadow;
                ctx.fillStyle = shadow.color;
                ctx.beginPath();
                ctx.ellipse(
                    Math.round(this.x + shadow.offset.x * this.scale),
                    Math.round(this.y + shadow.offset.y * this.scale),
                    shadow.width * this.scale,
                    shadow.height * this.scale,
                    0, 0, Math.PI * 2
                );
                ctx.fill();
            }
            
            // Calculate source rectangle from spritesheet using frame multipliers
            const sx = animation.position.frameX * frameWidth + (this.currentFrame * frameWidth);
            const sy = animation.position.frameY * frameHeight + (this.directionIndex * frameHeight);
            
            // Draw sprite at scale
            ctx.drawImage(
                this.sprite,
                sx, sy, frameWidth, frameHeight,
                Math.round(this.x), Math.round(this.y), 
                frameWidth * this.scale, frameHeight * this.scale
            );
            
            // Draw hitbox if enabled
            if (this.showHitbox) {
                const hitbox = this.getHitbox();
                ctx.strokeStyle = 'red';
                ctx.lineWidth = 1;
                ctx.strokeRect(
                    Math.round(hitbox.x), 
                    Math.round(hitbox.y), 
                    hitbox.width, 
                    hitbox.height
                );
            }
        });
    }
    
    // Toggle hitbox visibility
    toggleHitbox() {
        this.showHitbox = !this.showHitbox;
    }
    
    handleKeyDown(event) {
        if (event.key in this.keys) {
            this.keys[event.key] = true;
        } else if (event.key === 'h') {
            this.showHitbox = !this.showHitbox;
        } else if (event.key === ' ' && !this.isActing) {
            // Start action animation on spacebar
            this.isActing = true;
            this.state = 'action';
            this.currentFrame = 0;
        }
    }
    
    handleKeyUp(event) {
        if (event.key in this.keys) {
            this.keys[event.key] = false;
        }
    }
}
