class Sprite {
    constructor() {
        this.images = new Map();
        this.animations = new Map();
        this.currentAnimation = null;
        this.currentFrame = 0;
        this.frameTimer = 0;
        this.isActable = true;
        
        // Combo system
        this.comboTriggered = false;
        this.x = 0;
        this.y = 0;
        this.scale = 3; // Default zoom level
    }

    async loadSpritesheets() {
        const loadImage = (src) => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = reject;
                img.src = src;
            });
        };

        // Load spritesheets
        this.images.set('spritesheet0.png', await loadImage('spritesheet0.png'));
        this.images.set('spritesheet1.png', await loadImage('spritesheet1.png'));

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
            this.addAnimation('idle_' + direction, {
                spritesheet: 'spritesheet0.png',
                startX,
                startY,
                frameWidth: 44,
                frameHeight: 44,
                frameCount: 4,
                frameDuration: 200,
                loops: true
            });
        }

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
            this.addAnimation('run_' + direction, {
                spritesheet: 'spritesheet0.png',
                startX,
                startY,
                frameWidth: 44,
                frameHeight: 44,
                frameCount: 4,
                frameDuration: 150,
                loops: true
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
            this.addAnimation('combo_attack_' + direction, {
                spritesheet: 'spritesheet1.png',
                startX,
                startY,
                frameWidth: 50,
                frameHeight: 50,
                frameCount: 10,
                frameDuration: 100,
                loops: false
            });
        }
    }

    addAnimation(name, { spritesheet, startX, startY, frameWidth, frameHeight, frameCount, frameDuration, loops }) {
        const frames = [];
        for (let i = 0; i < frameCount; i++) {
            frames.push({
                x: startX + i * frameWidth,
                y: startY,
                width: frameWidth,
                height: frameHeight
            });
        }
        this.animations.set(name, { spritesheet, frames, frameDuration, loops });
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

        // Handle dash movement every frame for smoothness
        if (this.currentAnimation.startsWith('combo_attack_')) {
            const direction = this.currentAnimation.replace('combo_attack_', '');
            const baseDashSpeed = 5;
            
            // Calculate frame progress for smoother transitions
            const frameProgress = this.frameTimer / animation.frameDuration;
            
            // First dash (frames 2-4)
            if (this.currentFrame >= 1 && this.currentFrame <= 3) {
                // Use only first half of sine wave (0 to PI/2) for pure forward motion
                const dashPhase = (this.currentFrame - 1 + frameProgress) / 3;
                const dashSpeed = baseDashSpeed * Math.sin(dashPhase * Math.PI / 2);
                
                // Forward movement only
                if (direction.includes('right')) this.x += dashSpeed * (deltaTime / 16);
                if (direction.includes('left')) this.x -= dashSpeed * (deltaTime / 16);
                if (direction.includes('top')) this.y -= dashSpeed * (deltaTime / 16);
                if (direction.includes('down')) this.y += dashSpeed * (deltaTime / 16);
            }
            // Second dash (frames 7-8) if combo triggered
            else if (this.comboTriggered && this.currentFrame >= 6 && this.currentFrame <= 7) {
                // Use only first half of sine wave for pure forward motion
                const dashPhase = (this.currentFrame - 6 + frameProgress) / 2;
                const dashSpeed = baseDashSpeed * 2 * Math.sin(dashPhase * Math.PI / 2);
                
                // Forward movement only
                if (direction.includes('right')) this.x += dashSpeed * (deltaTime / 16);
                if (direction.includes('left')) this.x -= dashSpeed * (deltaTime / 16);
                if (direction.includes('top')) this.y -= dashSpeed * (deltaTime / 16);
                if (direction.includes('down')) this.y += dashSpeed * (deltaTime / 16);
            }
        }

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

class Camera {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.targetX = x;
        this.targetY = y;
        this.smoothness = 0.15; // Lower = smoother, higher = more responsive
    }

    update(targetX, targetY) {
        this.targetX = targetX;
        this.targetY = targetY;

        // Smooth lerp to target
        this.x += (this.targetX - this.x) * this.smoothness;
        this.y += (this.targetY - this.y) * this.smoothness;
    }

    getViewTransform() {
        // Return values to transform world to camera space
        return {
            x: Math.round(this.canvas.width / 2 - this.x),
            y: Math.round(this.canvas.height / 2 - this.y)
        };
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
        
        this.player = new Sprite();
        this.camera = new Camera(this.canvas.width / 2, this.canvas.height / 2);
        this.camera.canvas = this.canvas;
        
        this.init();
    }

    handleInput() {
        // Attack input during first 6 frames sets combo flag
        if (this.player.currentAnimation?.startsWith('combo_attack_') && 
            this.player.currentFrame <= 5 && 
            this.keys.has(' ') && 
            this.spaceWasReleased) {
            this.player.comboTriggered = true;
            this.spaceWasReleased = false;
            return;
        }

        if (!this.player.isActable) return;

        // Start new attack
        if (this.keys.has(' ') && this.spaceWasReleased) {
            const currentAnim = this.player.currentAnimation;
            const direction = currentAnim?.split('_').slice(1).join('_').replace('combo_attack_', '') || 'down_right';
            this.player.playAnimation('combo_attack_' + direction);
            this.spaceWasReleased = false;
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
            // Only move if not attacking
            if (!this.player.currentAnimation?.includes('attack_')) {
                this.playerX += dx * this.moveSpeed;
                this.playerY += dy * this.moveSpeed;
            }

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

    drawFloor(ctx, view) {
        // Tile size in world space
        const tileSize = 48 * 3; // Larger tiles for better effect
        
        // Calculate visible area with some padding
        const startX = Math.floor((-view.x - tileSize) / tileSize) * tileSize;
        const startY = Math.floor((-view.y - tileSize) / tileSize) * tileSize;
        const endX = Math.ceil((-view.x + this.canvas.width + tileSize) / tileSize) * tileSize;
        const endY = Math.ceil((-view.y + this.canvas.height + tileSize) / tileSize) * tileSize;

        // Draw tiles first
        ctx.save();
        ctx.translate(view.x, view.y);

        // Draw tile pattern
        for (let x = startX; x < endX; x += tileSize) {
            for (let y = startY; y < endY; y += tileSize) {
                // Subtle checkerboard pattern
                if ((Math.floor(x / tileSize) + Math.floor(y / tileSize)) % 2 === 0) {
                    ctx.fillStyle = '#141414';
                } else {
                    ctx.fillStyle = '#111111';
                }
                ctx.fillRect(x, y, tileSize, tileSize);
            }
        }

        // Draw grid pattern
        ctx.beginPath();
        
        // Draw vertical lines
        for (let x = startX; x <= endX; x += tileSize) {
            ctx.moveTo(x, startY);
            ctx.lineTo(x, endY);
        }
        
        // Draw horizontal lines
        for (let y = startY; y <= endY; y += tileSize) {
            ctx.moveTo(startX, y);
            ctx.lineTo(endX, y);
        }
        
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        ctx.restore();
    }

    draw(ctx) {
        // Update camera to follow player
        this.camera.update(this.playerX, this.playerY);
        const view = this.camera.getViewTransform();

        // Clear with base color
        ctx.fillStyle = '#0f0f0f';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw floor first
        this.drawFloor(ctx, view);

        // Update position from sprite
        this.playerX += this.player.x;
        this.player.x = 0;
        this.playerY += this.player.y;
        this.player.y = 0;

        const currentAnim = this.player.currentAnimation;
        if (!currentAnim) return;
        
        const animation = this.player.animations.get(currentAnim);
        if (!animation) return;

        const frame = animation.frames[this.player.currentFrame];
        if (!frame) return;

        const spritesheet = this.player.images.get(animation.spritesheet);
        if (!spritesheet) return;

        // Draw player shadow
        ctx.save();
        ctx.translate(view.x + this.playerX, view.y + this.playerY + 5);
        ctx.scale(3, 3);
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(0, 0, frame.width/3, frame.width/6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Draw player sprite
        ctx.save();
        ctx.translate(view.x + this.playerX, view.y + this.playerY);
        ctx.scale(3, 3);
        
        ctx.drawImage(
            spritesheet,
            frame.x,
            frame.y,
            frame.width,
            frame.height,
            -frame.width / 2,
            -frame.height / 2,
            frame.width,
            frame.height
        );
        
        ctx.restore();
    }

    gameLoop(currentTime) {
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        // Clear canvas with dark background
        this.ctx.fillStyle = '#111111';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Handle input
        this.handleInput();

        // Update and draw
        if (this.player) {
            this.player.update(deltaTime);
            this.draw(this.ctx);
        }

        requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
    }

    async init() {
        await this.player.loadSpritesheets();

        // Start with idle down right
        this.player.playAnimation('idle_down_right');

        this.playerX = this.canvas.width / 2;
        this.playerY = this.canvas.height / 2;

        this.lastTime = performance.now();
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
}

window.onload = () => new Game();
