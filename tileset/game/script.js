// Main Game Class
class Game {
    constructor(canvasId, seed) {
        this.canvas = document.getElementById(canvasId);
        this.context = this.canvas.getContext('2d');
        this.tileSize = 16;
        this.tilesetSize = 16;
        this.tiles = [];
        this.player = new Player(this.tileSize);
        this.enemies = [new Slime(this.tileSize, 100, 100)];
        this.allies = [
            new Gatherer(this.tileSize, 200, 200),
            new Gatherer(this.tileSize, 250, 250) // Zweiter Gatherer
        ];
        this.projectiles = []; // Liste der Projektile
        this.particles = []; // Liste der Partikel
        this.tilesetImage = new Image();
        this.tilesetImage.src = 'tileset.png';  // Pfad zum Tileset-Bild
        this.noise = new SimplexNoise(seed);
        this.generatePerlinWorld(50, 50);  // Generiere eine 50x50 Perlin Noise Welt
        this.camera = new Camera(this.canvas.width, this.canvas.height, this.tilesX * this.tileSize, this.tilesY * this.tileSize);
        this.debug = 1;  // Debug-Variable zum Anzeigen der Hitboxen
        this.selectedGatherer = null;  // Der ausgewählte Gatherer
        this.initEvents();
        this.resizeCanvas();
        window.requestAnimationFrame(() => this.gameLoop());
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth / 4;
        this.canvas.height = window.innerHeight / 4;
        this.camera.resize(this.canvas.width, this.canvas.height);
    }

    generatePerlinWorld(width, height) {
        this.tilesX = width;
        this.tilesY = height;
        this.tiles = [];

        for (let y = 0; y < height; y++) {
            this.tiles[y] = [];
            for (let x = 0; x < width; x++) {
                const noiseValue = this.noise.noise(x * 0.1, y * 0.1);
                this.tiles[y][x] = noiseValue > 0 ? 1 : 0;  // Schwellenwert zum Setzen der Fliese
            }
        }
    }

    initEvents() {
        window.addEventListener('resize', () => {
            this.resizeCanvas();
        });

        window.addEventListener('keydown', (event) => this.player.handleKeyDown(event));
        window.addEventListener('keyup', (event) => this.player.handleKeyUp(event));

        this.canvas.addEventListener('click', (event) => this.handleCanvasClick(event));
        this.canvas.addEventListener('contextmenu', (event) => this.handleCanvasRightClick(event));
    }

    handleCanvasClick(event) {
        event.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        const worldX = mouseX / 4 + this.camera.x;
        const worldY = mouseY / 4 + this.camera.y;

        console.log(`Mouse: ${worldX}, ${worldY}`);

        let gathererClicked = false;

        this.allies.forEach(ally => {
            if (this.isInsideHitbox(worldX, worldY, ally)) {
                this.selectedGatherer = ally;
                gathererClicked = true;
            }
        });

        if (!gathererClicked) {
            if (this.selectedGatherer) {
                this.selectedGatherer.setWaypoint(worldX, worldY, this.tiles, this.tilesX, this.tilesY);
                this.selectedGatherer = null; // Deselektiere den Gatherer
            }
        }
    }

    handleCanvasRightClick(event) {
        event.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        const worldX = mouseX / 4 + this.camera.x;
        const worldY = mouseY / 4 + this.camera.y;

        console.log(`Right Mouse: ${worldX}, ${worldY}`);

        // Hier können Sie eine andere Aktion für den Rechtsklick implementieren
        // Zum Beispiel: den ausgewählten Gatherer deselektieren
        if (this.selectedGatherer) {
            this.selectedGatherer = null; // Deselektiere den Gatherer
            console.log('Gatherer deselected');
        }
    }

    isInsideHitbox(mouseX, mouseY, character) {
        const characterX = character.x + (this.tileSize - character.hitbox.width) / 2;
        const characterY = character.y + (this.tileSize - character.hitbox.height) / 2;
        return (
            mouseX >= characterX &&
            mouseX <= characterX + character.hitbox.width &&
            mouseY >= characterY &&
            mouseY <= characterY + character.hitbox.height
        );
    }

    checkCollisions() {
        const characters = [this.player, ...this.enemies, ...this.allies];
        for (let i = 0; i < characters.length; i++) {
            for (let j = i + 1; j < characters.length; j++) {
                if (this.areColliding(characters[i], characters[j])) {
                    this.resolveCollision(characters[i], characters[j]);
                }
            }
        }
    }

    areColliding(character1, character2) {
        const hitbox1 = {
            x: character1.x + (this.tileSize - character1.hitbox.width) / 2,
            y: character1.y + (this.tileSize - character1.hitbox.height) / 2,
            width: character1.hitbox.width,
            height: character1.hitbox.height
        };
        const hitbox2 = {
            x: character2.x + (this.tileSize - character2.hitbox.width) / 2,
            y: character2.y + (this.tileSize - character2.hitbox.height) / 2,
            width: character2.hitbox.width,
            height: character2.hitbox.height
        };

        return (
            hitbox1.x < hitbox2.x + hitbox2.width &&
            hitbox1.x + hitbox1.width > hitbox2.x &&
            hitbox1.y < hitbox2.y + hitbox2.height &&
            hitbox1.y + hitbox1.height > hitbox2.y
        );
    }

    resolveCollision(character1, character2) {
        const dx = (character1.x + character1.tileSize / 2) - (character2.x + character2.tileSize / 2);
        const dy = (character1.y + character1.tileSize / 2) - (character2.y + character2.tileSize / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance === 0) return; // Prevent division by zero

        const overlap = (character1.hitbox.width / 2 + character2.hitbox.width / 2) - distance;
        const pushX = dx / distance * overlap / 2;
        const pushY = dy / distance * overlap / 2;

        // Check if moving character1 will cause a collision with walls
        if (character1.canMoveTo(character1.x + pushX, character1.y + pushY, this.tiles, this.tilesX, this.tilesY)) {
            character1.x += pushX;
            character1.y += pushY;
        }

        // Check if moving character2 will cause a collision with walls
        if (character2.canMoveTo(character2.x - pushX, character2.y - pushY, this.tiles, this.tilesX, this.tilesY)) {
            character2.x -= pushX;
            character2.y -= pushY;
        }
    }

    gameLoop() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        if (this.tiles.length > 0) {
            this.player.update(this.tiles, this.tilesX, this.tilesY);
            this.enemies.forEach(enemy => enemy.update(this.player, this.tiles, this.tilesX, this.tilesY));
            this.allies.forEach(ally => ally.update(this.player, this.tiles, this.tilesX, this.tilesY));
            this.checkCollisions();
            this.updateProjectiles();
            this.updateParticles(); // Update particles
            this.camera.update(this.player.x + this.player.tileSize / 2, this.player.y + this.player.tileSize / 2);
            this.drawTiles();
            this.player.draw(this.context, this.camera, this.debug);
            this.enemies.forEach(enemy => enemy.draw(this.context, this.camera, this.debug));
            this.allies.forEach(ally => ally.draw(this.context, this.camera, this.debug));
            this.drawProjectiles();
            this.drawParticles(); // Draw particles
        }
        window.requestAnimationFrame(() => this.gameLoop());
    }

    updateProjectiles() {
        this.projectiles.forEach(projectile => {
            projectile.update();
            this.enemies.forEach(enemy => {
                if (projectile.checkCollision(enemy)) {
                    enemy.takeDamage(projectile.atk);
                    projectile.active = false;
                }
            });
        });
        this.projectiles = this.projectiles.filter(projectile => projectile.active);
    }

    drawProjectiles() {
        this.projectiles.forEach(projectile => projectile.draw(this.context, this.camera));
    }

    updateParticles() {
        this.particles.forEach(particle => particle.update());
        this.particles = this.particles.filter(particle => particle.active);
    }

    drawParticles() {
        this.particles.forEach(particle => particle.draw(this.context, this.camera));
    }

    drawTiles() {
        const startCol = Math.floor(this.camera.x / this.tileSize);
        const endCol = startCol + Math.ceil(this.camera.viewportWidth / this.tileSize);
        const startRow = Math.floor(this.camera.y / this.tileSize);
        const endRow = startRow + Math.ceil(this.camera.viewportHeight / this.tileSize);
        const offsetX = -this.camera.x + startCol * this.tileSize;
        const offsetY = -this.camera.y + startRow * this.tileSize;

        for (let y = startRow; y <= endRow; y++) {
            for (let x = startCol; x <= endCol; x++) {
                if (y >= 0 && y < this.tilesY && x >= 0 && x < this.tilesX) {
                    if (this.tiles[y][x] === 1) {
                        this.context.drawImage(this.tilesetImage, 16, 0, this.tilesetSize, this.tilesetSize, (x - startCol) * this.tileSize + offsetX, (y - startRow) * this.tileSize + offsetY, this.tileSize, this.tileSize);
                    } else {
                        this.context.drawImage(this.tilesetImage, 0, 0, this.tilesetSize, this.tilesetSize, (x - startCol) * this.tileSize + offsetX, (y - startRow) * this.tileSize + offsetY, this.tileSize, this.tileSize);
                    }
                }
            }
        }
    }

    removeCharacter(character) {
        this.enemies = this.enemies.filter(enemy => enemy !== character);
        this.allies = this.allies.filter(ally => ally !== character);
    }

    addParticles(x, y, numParticles, speed, duration, color) {
        for (let i = 0; i < numParticles; i++) {
            const angle = Math.random() * Math.PI * 2;
            const velocityX = Math.cos(angle) * speed;
            const velocityY = Math.sin(angle) * speed;
            const particle = new Particle(x, y, velocityX, velocityY, duration, color);
            this.particles.push(particle);
        }
    }

    addAnimatedParticles(x, y, numParticles, speed, duration, imageSrc, frameCount, frameWidth, frameHeight, frameDuration) {
        for (let i = 0; i < numParticles; i++) {
            const angle = Math.random() * Math.PI * 2;
            const velocityX = Math.cos(angle) * speed;
            const velocityY = Math.sin(angle) * speed;
            const particle = new Particle(x, y, velocityX, velocityY, duration, imageSrc, frameCount, frameWidth, frameHeight, frameDuration);
            this.particles.push(particle);
        }
    }
}

class Camera {
    constructor(viewportWidth, viewportHeight, worldWidth, worldHeight) {
        this.viewportWidth = viewportWidth;
        this.viewportHeight = viewportHeight;
        this.worldWidth = worldWidth;
        this.worldHeight = worldHeight;
        this.x = 0;
        this.y = 0;
    }

    resize(viewportWidth, viewportHeight) {
        this.viewportWidth = viewportWidth;
        this.viewportHeight = viewportHeight;
    }

    update(targetX, targetY) {
        const lerp = (start, end, amt) => (1 - amt) * start + amt * end;

        const targetXCenter = targetX - this.viewportWidth / 2;
        const targetYCenter = targetY - this.viewportHeight / 2;

        this.x = lerp(this.x, targetXCenter, 0.1);
        this.y = lerp(this.y, targetYCenter, 0.1);

        // Begrenze die Kamera auf die Weltgrenzen
        this.x = Math.max(0, Math.min(this.x, this.worldWidth - this.viewportWidth));
        this.y = Math.max(0, Math.min(this.y, this.worldHeight - this.viewportHeight));

        // Runde die x- und y-Position der Kamera auf die nächste Ganzzahl
        this.x = Math.floor(this.x);
        this.y = Math.floor(this.y);
    }
}


class Character {
    constructor(tileSize, x, y, hitbox, speed, offsetX, offsetY, direction, directions, animations, atk, hp, deleteOnDeath = false) {
        this.tileSize = tileSize;
        this.x = x;
        this.y = y;
        this.hitbox = hitbox;
        this.speed = speed;
        this.offsetX = offsetX;
        this.offsetY = offsetY;
        this.direction = direction;
        this.directions = directions;
        this.animations = animations;
        this.currentAnimation = this.animations.idle;
        this.atk = atk;  // Angriffskraft
        this.hp = hp;    // Gesundheitspunkte
        this.lookVector = { x: 0, y: 1 }; // Blickvektor initialisiert auf unten
        this.deleteOnDeath = deleteOnDeath; // Soll der Charakter nach dem Tod gelöscht werden
        this.alive = true; // Status, ob der Charakter lebt
        this.blinking = false; // Status, ob der Charakter blinkt
        this.blinkDuration = 0; // Dauer des Blinkens
        this.deathAnimationPlayed = false; // Status, ob die Sterbeanimation abgespielt wurde
        this.shootCooldown = 500;  // in Millisekunden, Beispielwert
        this.lastShootTime = 0;
    }

    draw(context, camera, debug) {
        if (!this.alive && !this.deathAnimationPlayed) {
            this.playDeathAnimation();
            return;
        }
        const drawX = Math.floor(this.x - camera.x + this.offsetX);
        const drawY = Math.floor(this.y - camera.y + this.offsetY);
        
        if (this.blinking) {
            this.blinkDuration--;
            if (this.blinkDuration % 10 < 5) {
                context.globalCompositeOperation = 'lighter'; // Heller Effekt
            }
        }
        
        this.currentAnimation.draw(context, drawX, drawY, this.directions[this.direction]);
        context.globalCompositeOperation = 'source-over'; // Standard wiederherstellen
        
        if (debug) {
            context.strokeStyle = 'red';
            context.strokeRect(Math.floor(this.x - camera.x + (this.tileSize - this.hitbox.width) / 2), Math.floor(this.y - camera.y + (this.tileSize - this.hitbox.height) / 2), this.hitbox.width, this.hitbox.height);
        }
    }

    canMoveTo(newX, newY, tiles, tilesX, tilesY) {
        if (!this.alive) return false;
        const hitboxX = newX + (this.tileSize - this.hitbox.width) / 2;
        const hitboxY = newY + (this.tileSize - this.hitbox.height) / 2;

        const corners = [
            { x: hitboxX, y: hitboxY },  // Top-left
            { x: hitboxX + this.hitbox.width - 1, y: hitboxY },  // Top-right
            { x: hitboxX, y: hitboxY + this.hitbox.height - 1 },  // Bottom-left
            { x: hitboxX + this.hitbox.width - 1, y: hitboxY + this.hitbox.height - 1 }  // Bottom-right
        ];

        for (let corner of corners) {
            const tileX = Math.floor(corner.x / this.tileSize);
            const tileY = Math.floor(corner.y / this.tileSize);
            if (tileX < 0 || tileX >= tilesX || tileY < 0 || tileY >= tilesY || tiles[tileY][tileX] === 1) {
                return false;
            }
        }
        return true;
    }

    shootProjectile(projectiles, targetX, targetY, duration, offsetX, offsetY) {
        if (!this.alive) return;
        const currentTime = new Date().getTime();
        if (currentTime - this.lastShootTime < this.shootCooldown) {
            return;  // Cooldown noch nicht abgelaufen
        }

        const centerX = this.x + (this.tileSize - this.hitbox.width) / 2 + this.hitbox.width / 2 + offsetX;
        const centerY = this.y + (this.tileSize - this.hitbox.height) / 2 + this.hitbox.height / 2 + offsetY;
        const projectile = new Projectile(centerX, centerY, targetX, targetY, this.atk, this, duration);
        projectiles.push(projectile);

        // Setze die Zeit des letzten Schusses auf die aktuelle Zeit
        this.lastShootTime = currentTime;
    }

    takeDamage(damage) {
        if (!this.alive) return;
        this.hp -= damage;
        this.startBlinking();
        game.addAnimatedParticles(this.x + this.tileSize / 2, this.y + this.tileSize / 2, 10, 1, 30, 'particle_image.png', 4, 16, 16, 100); // Add hit particles
        if (this.hp <= 0) {
            this.hp = 0;
            this.die();
        }
    }

    startBlinking() {
        this.blinking = true;
        this.blinkDuration = 30; // Set the duration for blinking (e.g., 30 frames)
    }

    playDeathAnimation() {
        // Implement death animation logic here
        this.deathAnimationPlayed = true;
        game.addAnimatedParticles(this.x + this.tileSize / 2, this.y + this.tileSize / 2, 20, 1.5, 60, 'death_particle_image.png', 4, 16, 16, 100); // Add death particles
        if (this.deleteOnDeath) {
            game.removeCharacter(this);
        }
    }

    die() {
        this.alive = false;
    }

    updateDirection(dx, dy) {
        if (!this.alive) return;
        if (dx === 0 && dy === 0) return;

        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);

        this.lookVector = { x: dx, y: dy };

        if (absDx > 0.5 * this.speed && absDy > 0.5 * this.speed) {
            if (dy < 0) {
                if (dx < 0) this.direction = 'oben links';
                else if (dx > 0) this.direction = 'oben rechts';
            } else if (dy > 0) {
                if (dx < 0) this.direction = 'unten links';
                else if (dx > 0) this.direction = 'unten rechts';
            }
        } else {
            if (absDx > absDy) {
                if (dx < 0) this.direction = 'links';
                else if (dx > 0) this.direction = 'rechts';
            } else {
                if (dy < 0) this.direction = 'oben';
                else if (dy > 0) this.direction = 'unten';
            }
        }
    }
}

// Derived Classes from Character
class Player extends Character {
    constructor(tileSize) {
        super(
            tileSize,
            0,
            0,
            { width: 8, height: 8 },
            1.5,
            -14,
            -21,
            'unten',
            {
                'oben': 5,
                'oben rechts': 6,
                'rechts': 7,
                'unten rechts': 0,
                'unten': 1,
                'unten links': 2,
                'links': 3,
                'oben links': 4
            },
            {
                idle: new Animation('player_animations.png', 4, 44, 44, 200, 5),
                walk: new Animation('player_animations.png', 4, 44, 44, 100, 0),
                act: new Animation('player_animations.png', 4, 44, 44, 100, 10) // act Animation hinzufügen
            },
            10,  // ATK
            100, // HP
            false // Player should not be deleted on death
        );
        this.keys = { w: false, a: false, s: false, d: false };
        this.shooting = false; // Flag to check if the player is shooting
    }

    handleKeyDown(event) {
        if (event.key in this.keys) {
            this.keys[event.key] = true;
        }
        if (event.key === ' ' && !this.shooting) {  // Leertaste für Schießen
            this.shooting = true;
            this.currentAnimation = this.animations.act; // Set the act animation
            this.currentAnimation.currentFrame = 0; // Start from the first frame
        }
        this.updateAnimation();
    }

    handleKeyUp(event) {
        if (event.key in this.keys) {
            this.keys[event.key] = false;
        }
        this.updateAnimation();
    }

    update(tiles, tilesX, tilesY) {
        if (!this.alive) return;
        let newX = this.x;
        let newY = this.y;

        let dx = 0;
        let dy = 0;

        if (this.keys['w']) {
            dy -= this.speed;
        }
        if (this.keys['a']) {
            dx -= this.speed;
        }
        if (this.keys['s']) {
            dy += this.speed;
        }
        if (this.keys['d']) {
            dx += this.speed;
        }

        if (this.canMoveTo(this.x + dx, this.y, tiles, tilesX, tilesY)) {
            this.x += dx;
        }

        if (this.canMoveTo(this.x, this.y + dy, tiles, tilesX, tilesY)) {
            this.y += dy;
        }

        this.updateDirection(dx, dy);

        // Check if the act animation is playing and it's the correct frame to shoot
        if (this.currentAnimation === this.animations.act && this.currentAnimation.currentFrame === 2) {
            const targetX = this.x + this.lookVector.x * this.tileSize;
            const targetY = this.y + this.lookVector.y * this.tileSize;
            this.shootProjectile(game.projectiles, targetX, targetY, 100, 0, 0);
        }

        // Reset shooting flag after the act animation is done
        if (this.currentAnimation === this.animations.act && this.currentAnimation.currentFrame === this.currentAnimation.frameCount - 1) {
            this.shooting = false;
        }

        this.currentAnimation.update();
    }

    updateAnimation() {
        if (this.shooting) {
            this.currentAnimation = this.animations.act;
        } else if (this.keys['w'] || this.keys['a'] || this.keys['s'] || this.keys['d']) {
            this.currentAnimation = this.animations.walk;
        } else {
            this.currentAnimation = this.animations.idle;
        }
    }
}

class Slime extends Character {
    constructor(tileSize, x, y) {
        super(
            tileSize,
            x,
            y,
            { width: 8, height: 8 },
            1,
            -14,
            -21,
            'unten',
            {
                'oben': 5,
                'oben rechts': 6,
                'rechts': 7,
                'unten rechts': 0,
                'unten': 1,
                'unten links': 2,
                'links': 3,
                'oben links': 4
            },
            {
                idle: new Animation('slime_animations.png', 4, 44, 44, 200, 5),
                move: new Animation('slime_animations.png', 4, 44, 44, 100, 0),
                act: new Animation('slime_animations.png', 4, 44, 44, 100, 10) // act Animation hinzufügen
            },
            5,  // ATK
            30, // HP
            true // Slime should be deleted on death
        );
    }

    update(player, tiles, tilesX, tilesY) {
        if (!this.alive) return;
        let directionX = player.x - this.x;
        let directionY = player.y - this.y;
        let distance = Math.sqrt(directionX * directionX + directionY * directionY);
        if (distance < 50) {
            directionX /= distance;
            directionY /= distance;
            let newX = this.x + directionX * this.speed;
            let newY = this.y + directionY * this.speed;

            this.updateDirection(directionX, directionY);

            if (this.canMoveTo(newX, this.y, tiles, tilesX, tilesY)) {
                this.x = newX;
            }

            if (this.canMoveTo(this.x, newY, tiles, tilesX, tilesY)) {
                this.y = newY;
            }

            this.currentAnimation = this.animations.move;
        } else {
            this.currentAnimation = this.animations.idle;
        }

        if (this.currentAnimation === this.animations.act && this.currentAnimation.currentFrame === 2) {
            this.shootProjectile(game.projectiles, player.x, player.y, 100, 0, 0); // Projektil senden
        }

        this.currentAnimation.update();
    }
}

class Gatherer extends Character {
    constructor(tileSize, x, y) {
        super(
            tileSize,
            x,
            y,
            { width: 8, height: 8 },
            1.2,
            -14,
            -21,
            'unten',
            {
                'oben': 5,
                'oben rechts': 6,
                'rechts': 7,
                'unten rechts': 0,
                'unten': 1,
                'unten links': 2,
                'links': 3,
                'oben links': 4
            },
            {
                idle: new Animation('gatherer_animations.png', 4, 44, 44, 200, 5),
                walk: new Animation('gatherer_animations.png', 4, 44, 44, 100, 0),
                act: new Animation('gatherer_animations.png', 4, 44, 44, 100, 10) // act Animation hinzufügen
            },
            8,  // ATK
            50, // HP
            true // Gatherer should be deleted on death
        );
        this.path = [];
        this.pathIndex = 0;
        this.stuckCounter = 0;
        this.previousPosition = { x: this.x, y: this.y };
    }

    update(player, tiles, tilesX, tilesY) {
        if (!this.alive) return;
        if (this.path.length > 0) {
            this.currentAnimation = this.animations.walk;
            let target = this.path[this.pathIndex];
            let targetX = target.x * this.tileSize + (this.tileSize - this.hitbox.width) / 2;
            let targetY = target.y * this.tileSize + (this.tileSize - this.hitbox.height) / 2;
            let directionX = targetX - this.x;
            let directionY = targetY - this.y;
            let distance = Math.sqrt(directionX * directionX + directionY * directionY);

            if (distance < 4) {
                // Reached waypoint
                this.pathIndex++;
                if (this.pathIndex >= this.path.length) {
                    this.path = [];
                    this.pathIndex = 0;
                }
            } else {
                directionX /= distance;
                directionY /= distance;
                let dx = directionX * this.speed;
                let dy = directionY * this.speed;

                if (this.canMoveTo(this.x + dx, this.y, tiles, tilesX, tilesY)) {
                    this.x += dx;
                }

                if (this.canMoveTo(this.x, this.y + dy, tiles, tilesX, tilesY)) {
                    this.y += dy;
                }

                this.updateDirection(dx, dy);

                if (this.isStuck()) {
                    console.log('Gatherer is stuck, aborting path');
                    this.path = [];
                    this.pathIndex = 0;
                    this.currentAnimation = this.animations.idle;
                }
            }
        } else {
            this.currentAnimation = this.animations.idle;
        }

        if (this.currentAnimation === this.animations.act && this.currentAnimation.currentFrame === 2) {
            this.shootProjectile(game.projectiles, player.x, player.y, 100, 0, 0); // Projektil senden
        }

        this.currentAnimation.update();
    }

    setWaypoint(worldX, worldY, tiles, tilesX, tilesY) {
        const start = { x: Math.floor(this.x / this.tileSize), y: Math.floor(this.y / this.tileSize) };
        const end = { x: Math.floor(worldX / this.tileSize), y: Math.floor(worldY / this.tileSize) };
        this.path = astar(tiles, start, end, tilesX, tilesY);
        this.pathIndex = 0;
        this.stuckCounter = 0; // Reset stuck counter when setting a new waypoint
    }

    isStuck() {
        if (this.x === this.previousPosition.x && this.y === this.previousPosition.y) {
            this.stuckCounter++;
        } else {
            this.stuckCounter = 0;
            this.previousPosition = { x: this.x, y: this.y };
        }
        // Consider the gatherer stuck if it hasn't moved for 30 updates
        return this.stuckCounter > 30;
    }
}

class Projectile {
    constructor(x, y, targetX, targetY, atk, sender, duration) {
        this.x = x;
        this.y = y;
        this.targetX = targetX;
        this.targetY = targetY;
        this.atk = atk;
        this.sender = sender; // Sender hinzufügen
        this.speed = 5;  // Geschwindigkeit des Projektils
        this.duration = duration; // Dauer des Projektils
        const dx = targetX - x;
        const dy = targetY - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        this.velocityX = (dx / distance) * this.speed;
        this.velocityY = (dy / distance) * this.speed;
        this.active = true;  // Projektile sind aktiv, solange sie sich bewegen
    }

    update() {
        if (!this.active) return;
        this.x += this.velocityX;
        this.y += this.velocityY;
        this.duration--;
        if (this.duration <= 0) {
            this.active = false;
        }
        // Deaktiviere das Projektil, wenn es das Ziel erreicht
        if (Math.abs(this.x - this.targetX) < this.speed && Math.abs(this.y - this.targetY) < this.speed) {
            this.active = false;
        }
    }

    draw(context, camera) {
        if (!this.active) return;
        context.fillStyle = 'red';
        context.beginPath();
        context.arc(this.x - camera.x, this.y - camera.y, 3, 0, Math.PI * 2);
        context.fill();
    }

    checkCollision(character) {
        if (!this.active) return false;
        if (character === this.sender) return false;  // Sender ignorieren

        const hitboxX = character.x + (character.tileSize - character.hitbox.width) / 2;
        const hitboxY = character.y + (character.tileSize - character.hitbox.height) / 2;
        return (
            this.x >= hitboxX &&
            this.x <= hitboxX + character.hitbox.width &&
            this.y >= hitboxY &&
            this.y <= hitboxY + character.hitbox.height
        );
    }
}

class Particle {
    constructor(x, y, velocityX, velocityY, duration, imageSrc, frameCount, frameWidth, frameHeight, frameDuration) {
        this.x = x;
        this.y = y;
        this.velocityX = velocityX;
        this.velocityY = velocityY;
        this.duration = duration;
        this.active = true;

        this.image = new Image();
        this.image.src = imageSrc;
        this.frameCount = frameCount;
        this.frameWidth = frameWidth;
        this.frameHeight = frameHeight;
        this.frameDuration = frameDuration;

        this.currentFrame = 0;
        this.elapsedTime = 0;
    }

    update() {
        if (!this.active) return;
        this.x += this.velocityX;
        this.y += this.velocityY;
        this.duration--;
        if (this.duration <= 0) {
            this.active = false;
        }

        this.elapsedTime += 1000 / 60;  // Assuming 60 FPS
        if (this.elapsedTime >= this.frameDuration) {
            this.elapsedTime = 0;
            this.currentFrame = (this.currentFrame + 1) % this.frameCount;
        }
    }

    draw(context, camera) {
        if (!this.active) return;
        const frameX = this.currentFrame * this.frameWidth;
        context.drawImage(
            this.image,
            frameX, 0, this.frameWidth, this.frameHeight,
            this.x - camera.x, this.y - camera.y,
            this.frameWidth, this.frameHeight
        );
    }
}

class Animation {
    constructor(imageSrc, frameCount, frameWidth, frameHeight, frameDuration, columnOffset = 0) {
        this.image = new Image();
        this.image.src = imageSrc;
        this.frameCount = frameCount;
        this.frameWidth = frameWidth;
        this.frameHeight = frameHeight;
        this.frameDuration = frameDuration;
        this.columnOffset = columnOffset;
        this.currentFrame = 0;
        this.elapsedTime = 0;
    }

    update() {
        this.elapsedTime += 1000 / 60;  // Assuming 60 FPS
        if (this.elapsedTime >= this.frameDuration) {
            this.elapsedTime = 0;
            this.currentFrame = (this.currentFrame + 1) % this.frameCount;
        }
    }

    draw(context, x, y, direction) {
        context.drawImage(
            this.image,
            this.currentFrame * this.frameWidth + this.columnOffset * this.frameWidth,
            direction * this.frameHeight,
            this.frameWidth,
            this.frameHeight,
            Math.floor(x),
            Math.floor(y),
            this.frameWidth,
            this.frameHeight
        );
    }
}

// A* Algorithmus-Implementierung
function astar(grid, start, end, tilesX, tilesY) {
    const openSet = [];
    const closedSet = [];
    const cameFrom = {};
    const gScore = {};
    const fScore = {};

    openSet.push(start);
    gScore[`${start.x},${start.y}`] = 0;
    fScore[`${start.x},${start.y}`] = heuristic(start, end);

    while (openSet.length > 0) {
        let current = openSet.reduce((acc, node) => (fScore[`${node.x},${node.y}`] < fScore[`${acc.x},${acc.y}`] ? node : acc), openSet[0]);

        if (current.x === end.x && current.y === end.y) {
            return reconstructPath(cameFrom, current);
        }

        openSet.splice(openSet.indexOf(current), 1);
        closedSet.push(current);

        getNeighbors(current, tilesX, tilesY).forEach(neighbor => {
            if (closedSet.find(n => n.x === neighbor.x && n.y === neighbor.y)) return;
            if (grid[neighbor.y][neighbor.x] === 1) return; // Blockierte Kachel

            const tentativeGScore = gScore[`${current.x},${current.y}`] + 1;

            if (!openSet.find(n => n.x === neighbor.x && n.y === neighbor.y)) {
                openSet.push(neighbor);
            } else if (tentativeGScore >= gScore[`${neighbor.x},${neighbor.y}`]) {
                return;
            }

            cameFrom[`${neighbor.x},${neighbor.y}`] = current;
            gScore[`${neighbor.x},${neighbor.y}`] = tentativeGScore;
            fScore[`${neighbor.x},${neighbor.y}`] = gScore[`${neighbor.x},${neighbor.y}`] + heuristic(neighbor, end);
        });
    }

    return [];
}

function heuristic(a, b) {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function reconstructPath(cameFrom, current) {
    const totalPath = [current];
    while (`${current.x},${current.y}` in cameFrom) {
        current = cameFrom[`${current.x},${current.y}`];
        totalPath.unshift(current);
    }
    return totalPath;
}

function getNeighbors(node, tilesX, tilesY) {
    const neighbors = [
        { x: node.x - 1, y: node.y },
        { x: node.x + 1, y: node.y },
        { x: node.x, y: node.y - 1 },
        { x: node.x, y: node.y + 1 }
    ];
    return neighbors.filter(n => n.x >= 0 && n.y >= 0 && n.x < tilesX && n.y < tilesY);
}

// Utility Classes and Functions
class SimplexNoise {
    constructor(seed) {
        this.perm = this.buildPermutationTable(seed);
    }

    buildPermutationTable(seed) {
        const perm = new Uint8Array(512);
        const value = new Uint8Array(256);

        for (let i = 0; i < 256; i++) {
            value[i] = i;
        }

        seed = seed * 16807 % 2147483647;
        for (let i = 255; i >= 0; i--) {
            seed = seed * 16807 % 2147483647;
            const r = (seed + 31) % (i + 1);
            const temp = value[i];
            value[i] = value[r];
            value[r] = temp;
        }

        for (let i = 0; i < 512; i++) {
            perm[i] = value[i & 255];
        }

        return perm;
    }

    noise(xin, yin) {
        const permMod12 = this.perm.map(v => v % 12);
        const grad3 = [
            [1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0],
            [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1],
            [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1]
        ];

        const G2 = (3.0 - Math.sqrt(3.0)) / 6.0;

        let n0, n1, n2;

        const s = (xin + yin) * 0.5 * (Math.sqrt(3.0) - 1.0);
        const i = Math.floor(xin + s);
        const j = Math.floor(yin + s);
        const t = (i + j) * G2;
        const X0 = i - t;
        const Y0 = j - t;
        const x0 = xin - X0;
        const y0 = yin - Y0;

        let i1, j1;
        if (x0 > y0) { i1 = 1; j1 = 0; } else { i1 = 0; j1 = 1; }

        const x1 = x0 - i1 + G2;
        const y1 = y0 - j1 + G2;
        const x2 = x0 - 1.0 + 2.0 * G2;
        const y2 = y0 - 1.0 + 2.0 * G2;

        const ii = i & 255;
        const jj = j & 255;
        const gi0 = permMod12[ii + this.perm[jj]];
        const gi1 = permMod12[ii + i1 + this.perm[jj + j1]];
        const gi2 = permMod12[ii + 1 + this.perm[jj + 1]];

        let t0 = 0.5 - x0 * x0 - y0 * y0;
        if (t0 < 0) n0 = 0.0;
        else {
            t0 *= t0;
            n0 = t0 * t0 * (grad3[gi0][0] * x0 + grad3[gi0][1] * y0);
        }

        let t1 = 0.5 - x1 * x1 - y1 * y1;
        if (t1 < 0) n1 = 0.0;
        else {
            t1 *= t1;
            n1 = t1 * t1 * (grad3[gi1][0] * x1 + grad3[gi1][1] * y1);
        }

        let t2 = 0.5 - x2 * x2 - y2 * y2;
        if (t2 < 0) n2 = 0.0;
        else {
            t2 *= t2;
            n2 = t2 * t2 * (grad3[gi2][0] * x2 + grad3[gi2][1] * y2);
        }

        return 70.0 * (n0 + n1 + n2);
    }
}

// Initialization
window.onload = () => {
    game = new Game('game', 282345);  // Seed für die Perlin-Noise-Generierung
};
