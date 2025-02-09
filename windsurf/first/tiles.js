class TileMap {
    constructor() {
        this.tileSize = 32;
        this.tiles = [];
        this.mapWidth = 50;  // Fixed world size
        this.mapHeight = 50; // Fixed world size
        this.tileset = document.getElementById('tileset');
        this.tileset2 = document.getElementById('tileset2');
        this.maxTerrainType = 2; // Number of terrain types (0 = empty, 1 = first terrain, 2 = second terrain)
    }

    // Initialize the tile map using the world generator
    initializeMap() {
        const generator = new WorldGenerator(this.mapWidth, this.mapHeight);
        this.tiles = generator.generate();
    }

    // Helper function to get neighbor bits for debugging
    getNeighborBits(x, y) {
        const terrainType = this.tiles[y][x];
        if (terrainType === 0) return {};

        const neighbors = [
            { dx: -1, dy: -1, bit: 1, name: 'topLeft' },
            { dx: 0,  dy: -1, bit: 2, name: 'top' },
            { dx: 1,  dy: -1, bit: 4, name: 'topRight' },
            { dx: 1,  dy: 0,  bit: 8, name: 'right' },
            { dx: 1,  dy: 1,  bit: 16, name: 'bottomRight' },
            { dx: 0,  dy: 1,  bit: 32, name: 'bottom' },
            { dx: -1, dy: 1,  bit: 64, name: 'bottomLeft' },
            { dx: -1, dy: 0,  bit: 128, name: 'left' }
        ];

        return neighbors.reduce((acc, { dx, dy, bit, name }) => {
            const nx = x + dx;
            const ny = y + dy;
            const hasNeighbor = nx >= 0 && nx < this.mapWidth && 
                               ny >= 0 && ny < this.mapHeight && 
                               this.tiles[ny][nx] === terrainType;
            acc[name] = hasNeighbor ? bit : 0;
            return acc;
        }, {});
    }

    // Get the tile index based on surrounding tiles (GMS2 auto-tile format)
    getTileIndex(x, y) {
        const terrainType = this.tiles[y][x];
        if (terrainType === 0) return -1;

        // Define neighbors and their bit values
        const neighbors = [
            { dx: -1, dy: -1, bit: 1 },   // topLeft
            { dx: 0,  dy: -1, bit: 2 },   // top
            { dx: 1,  dy: -1, bit: 4 },   // topRight
            { dx: 1,  dy: 0,  bit: 8 },   // right
            { dx: 1,  dy: 1,  bit: 16 },  // bottomRight
            { dx: 0,  dy: 1,  bit: 32 },  // bottom
            { dx: -1, dy: 1,  bit: 64 },  // bottomLeft
            { dx: -1, dy: 0,  bit: 128 }  // left
        ];

        // Calculate index by checking each neighbor
        const index = neighbors.reduce((acc, { dx, dy, bit }) => {
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < this.mapWidth && ny >= 0 && ny < this.mapHeight) {
                return acc + (this.tiles[ny][nx] === terrainType ? bit : 0);
            }
            return acc;
        }, 0);

        // Full 256 combinations array for GMS2 auto-tiling
        const gms2TileIndices = [
            47, 47, 45, 45, 47, 47, 45, 45, 44, 44, 42, 42, 44, 44, 41, 41,
            47, 47, 45, 45, 47, 47, 45, 45, 44, 44, 42, 42, 44, 44, 41, 41,
            43, 43, 33, 33, 43, 43, 33, 33, 36, 36, 20, 20, 36, 36, 19, 19,
            43, 43, 33, 33, 43, 43, 33, 33, 35, 35, 18, 18, 35, 35, 17, 17,
            47, 47, 45, 45, 47, 47, 45, 45, 44, 44, 42, 42, 44, 44, 41, 41,
            47, 47, 45, 45, 47, 47, 45, 45, 44, 44, 42, 42, 44, 44, 41, 41,
            43, 43, 33, 33, 43, 43, 33, 33, 36, 36, 20, 20, 36, 36, 19, 19,
            43, 43, 33, 33, 43, 43, 33, 33, 35, 35, 18, 18, 35, 35, 17, 17,
            46, 46, 40, 39, 46, 46, 40, 39, 34, 34, 32, 31, 34, 34, 30, 29,
            46, 46, 40, 39, 46, 46, 40, 39, 34, 34, 32, 31, 34, 34, 30, 29,
            38, 38, 28, 26, 38, 38, 28, 26, 24, 24, 16, 15, 24, 24, 14, 13,
            38, 38, 28, 26, 38, 38, 28, 26, 23, 23, 12, 11, 23, 23, 10, 9,
            46, 46, 40, 39, 46, 46, 40, 39, 34, 34, 32, 31, 34, 34, 30, 29,
            46, 46, 40, 39, 46, 46, 40, 39, 34, 34, 32, 31, 34, 34, 30, 29,
            37, 37, 27, 25, 37, 37, 27, 25, 22, 22, 8, 7, 22, 22, 6, 5,
            37, 37, 27, 25, 37, 37, 27, 25, 21, 21, 4, 3, 21, 21, 2, 1
        ];

        return gms2TileIndices[index]-1 || 0;
    }

    // Draw the tile map
    draw(ctx) {
        // Calculate visible area based on camera position
        const camX = -ctx.getTransform().e;
        const camY = -ctx.getTransform().f;
        
        const startX = Math.floor(camX / this.tileSize);
        const startY = Math.floor(camY / this.tileSize);
        const endX = startX + Math.ceil(ctx.canvas.width / this.tileSize) + 1;
        const endY = startY + Math.ceil(ctx.canvas.height / this.tileSize) + 1;

        // Only draw tiles that are visible
        for (let y = Math.max(0, startY); y < Math.min(endY, this.mapHeight); y++) {
            for (let x = Math.max(0, startX); x < Math.min(endX, this.mapWidth); x++) {
                const terrainType = this.tiles[y][x];
                if (terrainType === 0) continue;

                const tileIndex = this.getTileIndex(x, y);
                if (tileIndex >= 0) {
                    // Calculate source coordinates from tileset (8x6 grid)
                    const srcX = (tileIndex % 8) * this.tileSize;
                    const srcY = Math.floor(tileIndex / 8) * this.tileSize;

                    // Draw the tile from the appropriate tileset
                    const tileset = terrainType === 1 ? this.tileset : this.tileset2;
                    ctx.drawImage(
                        tileset,
                        srcX, srcY, this.tileSize, this.tileSize,
                        x * this.tileSize,
                        y * this.tileSize,
                        this.tileSize, this.tileSize
                    );
                }
            }
        }
    }
}
