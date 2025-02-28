class Sprite {
    constructor() {
        this.animations = new Map();
        this.currentAnimation = null;
        this.currentFrame = 0;
        this.frameTimer = 0;
        this.isActable = true;
        this.images = new Map();
        this.scale = 3; // Default zoom level
        
        // Combo system
        this.comboTriggered = false; // New flag to track if second hit was triggered
    }

    async loadSpritesheets() {
        const sheets = ['spritesheet0.png', 'spritesheet1.png'];
        for (const sheet of sheets) {
            const img = new Image();
            // Disable image smoothing on the image itself
            img.style.imageRendering = 'pixelated';
            img.src = sheet;
            await new Promise(resolve => img.onload = resolve);
            this.images.set(sheet, img);
        }
    }

    addAnimation(name, {
        spritesheet,
        startX,
        startY,
        frameWidth,
        frameHeight,
        frameCount,
        frameDuration = 100,
        loops = true
    }) {
        const frames = Array.from({ length: frameCount }, (_, i) => ({
            x: startX + (i * frameWidth),
            y: startY,
            width: frameWidth,
            height: frameHeight
        }));

        this.animations.set(name, {
            spritesheet,
            frames,
            frameDuration,
            loops
        });
    }

    playAnimation(name) {
        if (this.currentAnimation !== name) {
            this.currentAnimation = name;
            this.currentFrame = 0;
            this.frameTimer = 0;
            this.isActable = !name.includes('attack_');
            this.comboTriggered = false;
        }
    }

    update(deltaTime) {
        if (!this.currentAnimation) return;
        
        const animation = this.animations.get(this.currentAnimation);
        if (!animation) return;

        this.frameTimer += deltaTime;
        if (this.frameTimer >= animation.frameDuration) {
            this.frameTimer = 0;
            
            if (this.currentAnimation.startsWith('combo_attack_')) {
                // First 6 frames - check for second attack
                if (this.currentFrame < 6) {
                    this.currentFrame++;
                }
                // At frame 6, decide whether to continue
                else if (this.currentFrame === 6) {
                    this.currentFrame++;
                    if (!this.comboTriggered) {
                        this.isActable = true;
                        const direction = this.currentAnimation.replace('combo_attack_', '');
                        this.playAnimation('idle_' + direction);
                    }
                }
                // Frames 7-10 if combo triggered
                else if (this.currentFrame < animation.frames.length - 1) {
                    this.currentFrame++;
                }
                // End of animation
                else {
                    this.isActable = true;
                    this.comboTriggered = false;
                    const direction = this.currentAnimation.replace('combo_attack_', '');
                    this.playAnimation('idle_' + direction);
                }
            } else {
                // Normal animation handling
                if (this.currentFrame < animation.frames.length - 1) {
                    this.currentFrame++;
                } else if (animation.loops) {
                    this.currentFrame = 0;
                } else {
                    this.isActable = true;
                    const direction = this.currentAnimation.replace('run_', '');
                    this.playAnimation('idle_' + direction);
                }
            }
        }
    }

    draw(ctx, x, y) {
        if (!this.currentAnimation) return;

        const animation = this.animations.get(this.currentAnimation);
        if (!animation) return;

        const frame = animation.frames[this.currentFrame];
        const image = this.images.get(animation.spritesheet);
        
        const scaledWidth = frame.width * this.scale;
        const scaledHeight = frame.height * this.scale;
        
        // Round all coordinates to integers
        const drawX = Math.round(x - scaledWidth / 2);
        const drawY = Math.round(y - scaledHeight / 2);
        
        ctx.drawImage(
            image,
            Math.round(frame.x), Math.round(frame.y),
            frame.width, frame.height,
            drawX, drawY,
            scaledWidth, scaledHeight
        );
    }
}

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d', {
            antialias: false,
            alpha: false
        });
        this.lastTime = 0;
        this.player = null;
        this.scale = 3;
        
        // Player position and movement
        this.playerX = 0;
        this.playerY = 0;
        this.moveSpeed = 4;
        
        // Background tile size
        this.tileSize = 32;
        
        // Disable all possible image smoothing settings
        this.ctx.imageSmoothingEnabled = false;
        this.ctx.mozImageSmoothingEnabled = false;
        this.ctx.webkitImageSmoothingEnabled = false;
        this.ctx.msImageSmoothingEnabled = false;
        
        window.addEventListener('resize', () => this.resize());
        this.resize();
        
        // Handle keyboard input
        this.keys = new Set();
        this.spaceWasReleased = true; // Track if space was released
        
        window.addEventListener('keydown', (e) => {
            this.keys.add(e.key.toLowerCase());
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys.delete(e.key.toLowerCase());
            if (e.key === ' ') {
                this.spaceWasReleased = true;
            }
        });
        
        this.init();
    }

    handleInput() {
        // Attack input during first 6 frames sets combo flag
        if (this.player.currentAnimation?.startsWith('combo_attack_') && 
            this.player.currentFrame <= 5 && 
            this.keys.has(' ') && 
            this.spaceWasReleased) { // Only trigger if space was released
            this.player.comboTriggered = true;
            this.spaceWasReleased = false; // Reset flag
            return;
        }

        if (!this.player.isActable) return;

        // Start new attack
        if (this.keys.has(' ') && this.spaceWasReleased) {
            const currentAnim = this.player.currentAnimation;
            const direction = currentAnim?.split('_').slice(1).join('_').replace('combo_attack_', '') || 'down_right';
            this.player.playAnimation('combo_attack_' + direction);
            this.spaceWasReleased = false; // Reset flag
            return;
        }

        // Movement
        let dx = 0;
        let dy = 0;

        if (this.keys.has('w') || this.keys.has('arrowup')) dy -= 1;
        if (this.keys.has('s') || this.keys.has('arrowdown')) dy += 1;
        if (this.keys.has('a') || this.keys.has('arrowleft')) dx -= 1;
        if (this.keys.has('d') || this.keys.has('arrowright')) dx += 1;

        if (dx !== 0 && dy !== 0) {
            const norm = Math.sqrt(2);
            dx /= norm;
            dy /= norm;
        }

        if (dx !== 0 || dy !== 0) {
            this.playerX += dx * this.moveSpeed;
            this.playerY += dy * this.moveSpeed;

            let direction = '';
            if (dy < 0) direction = 'top';
            if (dy > 0) direction = 'down';
            if (dx < 0) direction = direction ? direction + '_left' : 'left';
            if (dx > 0) direction = direction ? direction + '_right' : 'right';

            this.player.playAnimation('run_' + direction);
        } else {
            const currentAnim = this.player.currentAnimation;
            if (currentAnim?.startsWith('run_')) {
                const direction = currentAnim.replace('run_', '');
                this.player.playAnimation('idle_' + direction);
            }
        }
    }

    drawBackground() {
        // Calculate visible tile range based on player position
        const startX = Math.floor((this.playerX - this.canvas.width / 2) / this.tileSize) - 1;
        const startY = Math.floor((this.playerY - this.canvas.height / 2) / this.tileSize) - 1;
        const endX = startX + Math.ceil(this.canvas.width / this.tileSize) + 2;
        const endY = startY + Math.ceil(this.canvas.height / this.tileSize) + 2;

        // Draw tiles
        for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
                // Create a checkerboard pattern
                const isAlternate = (x + y) % 2 === 0;
                this.ctx.fillStyle = isAlternate ? '#1a1a1a' : '#2a2a2a';
                
                // Calculate tile position relative to player
                const tileX = Math.round(x * this.tileSize - this.playerX + this.canvas.width / 2);
                const tileY = Math.round(y * this.tileSize - this.playerY + this.canvas.height / 2);
                
                this.ctx.fillRect(
                    tileX,
                    tileY,
                    this.tileSize,
                    this.tileSize
                );
            }
        }
    }

    async init() {
        this.player = new Sprite();
        await this.player.loadSpritesheets();

        // Add run animations
        const runDirections = [
            ['down_right', 0, 0+748],
            ['down', 0, 44+748],
            ['down_left', 0, 88+748],
            ['left', 0, 132+748],
            ['top_left', 0, 176+748],
            ['top', 0, 220+748],
            ['top_right', 0, 264+748],
            ['right', 0, 308+748]
        ];

        for (const [direction, startX, startY] of runDirections) {
            this.player.addAnimation('run_' + direction, {
                spritesheet: 'spritesheet0.png',
                startX,
                startY,
                frameWidth: 44,
                frameHeight: 44,
                frameCount: 4,
                frameDuration: 150
            });
        }

        // Add idle animations
        const idleDirections = [
            ['down_right', 220, 0+748],
            ['down', 220, 44+748],
            ['down_left', 220, 88+748],
            ['left', 220, 132+748],
            ['top_left', 220, 176+748],
            ['top', 220, 220+748],
            ['top_right', 220, 264+748],
            ['right', 220, 308+748]
        ];

        for (const [direction, startX, startY] of idleDirections) {
            this.player.addAnimation('idle_' + direction, {
                spritesheet: 'spritesheet0.png',
                startX,
                startY,
                frameWidth: 44,
                frameHeight: 44,
                frameCount: 4,
                frameDuration: 200
            });
        }

        // Add combo attack animations
        const comboAttackDirections = [
            ['down_right', 0, 300],
            ['down', 0, 650],
            ['down_left', 0, 1000],
            ['left', 0, 1350],
            ['top_left', 0, 1700],
            ['top', 0, 2050],
            ['top_right', 0, 2400],
            ['right', 0, 2750]
        ];

        for (const [direction, startX, startY] of comboAttackDirections) {
            this.player.addAnimation('combo_attack_' + direction, {
                spritesheet: 'spritesheet1.png',
                startX,
                startY,
                frameWidth: 50,
                frameHeight: 50,
                frameCount: 10, // Total frames for the full combo
                frameDuration: 100,
                loops: false
            });
        }

        // Start with idle down right
        this.player.playAnimation('idle_down_right');

        requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
    }

    resize() {
        // Calculate the maximum integer scale that fits the window
        const scaleX = Math.floor(window.innerWidth / (44 * 3)); // 44 is our base sprite size
        const scaleY = Math.floor(window.innerHeight / (44 * 3));
        this.scale = Math.max(1, Math.min(scaleX, scaleY));
        
        // Set canvas size to exact multiple of our sprite size
        this.canvas.width = Math.floor(window.innerWidth / this.scale) * this.scale;
        this.canvas.height = Math.floor(window.innerHeight / this.scale) * this.scale;
        
        // Ensure crisp rendering after resize
        this.ctx.imageSmoothingEnabled = false;
        this.ctx.mozImageSmoothingEnabled = false;
        this.ctx.webkitImageSmoothingEnabled = false;
        this.ctx.msImageSmoothingEnabled = false;
    }

    gameLoop(currentTime) {
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        this.handleInput();

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw background first
        this.drawBackground();

        // Draw player in center of screen
        if (this.player) {
            this.player.update(deltaTime);
            this.player.draw(
                this.ctx,
                Math.round(this.canvas.width / 2),
                Math.round(this.canvas.height / 2)
            );
        }

        requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
    }
}

window.onload = () => new Game();
