class Game {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.context = this.canvas.getContext('2d');
        this.tileSize = 16;
        this.tilesetSize = 16;
        this.tilesX = Math.floor(window.innerWidth / this.tileSize / 4);
        this.tilesY = Math.floor(window.innerHeight / this.tileSize / 4);
        this.tiles = [];
        this.player = new Player(this.tileSize);
        this.tilesetImage = new Image();
        this.tilesetImage.src = 'tileset.png';  // Pfad zum Tileset-Bild
        this.initTiles();
        this.initEvents();
        window.requestAnimationFrame(() => this.gameLoop());
    }

    initTiles() {
        for (let y = 0; y < this.tilesY; y++) {
            this.tiles[y] = [];
            for (let x = 0; x < this.tilesX; x++) {
                this.tiles[y][x] = Math.random() < 0.1 ? 1 : 0;
            }
        }
    }

    initEvents() {
        window.addEventListener('resize', () => {
            this.resizeCanvas();
            this.tilesX = Math.floor(window.innerWidth / this.tileSize);
            this.tilesY = Math.floor(window.innerHeight / this.tileSize);
            this.initTiles();
        });

        window.addEventListener('keydown', (event) => this.player.handleKeyDown(event));
        window.addEventListener('keyup', (event) => this.player.handleKeyUp(event));
    }

    gameLoop() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawTiles();
        this.player.update(this.tiles, this.tilesX, this.tilesY);
        this.player.draw(this.context);
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
    new Game('game');
};
