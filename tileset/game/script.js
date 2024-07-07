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

// Game class and other parts remain the same, with slight modification to use the new SimplexNoise class

class Game {
    constructor(canvasId, seed) {
        this.canvas = document.getElementById(canvasId);
        this.context = this.canvas.getContext('2d');
        this.tileSize = 16;
        this.tilesetSize = 16;
        this.tiles = [];
        this.player = new Player(this.tileSize);
        this.tilesetImage = new Image();
        this.tilesetImage.src = 'tileset.png';  // Pfad zum Tileset-Bild
        this.noise = new SimplexNoise(seed);
        this.generatePerlinWorld(50, 50);  // Generiere eine 50x50 Perlin Noise Welt
        this.initEvents();
        window.requestAnimationFrame(() => this.gameLoop());
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
    }

    gameLoop() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        if (this.tiles.length > 0) {
            this.drawTiles();
            this.player.update(this.tiles, this.tilesX, this.tilesY);
            this.player.draw(this.context);
        }
        window.requestAnimationFrame(() => this.gameLoop());
    }

    drawTiles() {
        for (let y = 0; y < this.tilesY; y++) {
            for (let x = 0; x < this.tilesX; x++) {
                if (this.tiles[y][x] === 1) {
                    this.context.drawImage(this.tilesetImage, 16, 0, this.tilesetSize, this.tilesetSize, x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);
                } else {
                    this.context.drawImage(this.tilesetImage, 0, 0, this.tilesetSize, this.tilesetSize, x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);
                }
            }
        }
    }
}

class Player {
    constructor(tileSize) {
        this.x = 0;
        this.y = 0;
        this.tileSize = tileSize;
        this.speed = 2;
        this.image = new Image();
        this.image.src = 'player.png';  // Pfad zum Spieler-Bild
        this.keys = { w: false, a: false, s: false, d: false };
    }

    draw(context) {
        context.drawImage(this.image, this.x, this.y, this.tileSize, this.tileSize);
    }

    handleKeyDown(event) {
        if (event.key in this.keys) {
            this.keys[event.key] = true;
        }
    }

    handleKeyUp(event) {
        if (event.key in this.keys) {
            this.keys[event.key] = false;
        }
    }

    update(tiles, tilesX, tilesY) {
        let newX = this.x;
        let newY = this.y;
        
        if (this.keys['w']) newY -= this.speed;
        if (this.keys['a']) newX -= this.speed;
        if (this.keys['s']) newY += this.speed;
        if (this.keys['d']) newX += this.speed;

        if (this.canMoveTo(newX, this.y, tiles, tilesX, tilesY)) {
            this.x = newX;
        }

        if (this.canMoveTo(this.x, newY, tiles, tilesX, tilesY)) {
            this.y = newY;
        }
    }

    canMoveTo(newX, newY, tiles, tilesX, tilesY) {
        const corners = [
            { x: newX, y: newY },  // Top-left
            { x: newX + this.tileSize - 1, y: newY },  // Top-right
            { x: newX, y: newY + this.tileSize - 1 },  // Bottom-left
            { x: newX + this.tileSize - 1, y: newY + this.tileSize - 1 }  // Bottom-right
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
}

window.onload = () => {
    new Game('game', 122235);  // Seed für die Perlin-Noise-Generierung
};
