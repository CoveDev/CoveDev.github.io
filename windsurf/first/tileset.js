class TilesetManager {
    constructor() {
        // Grid properties
        this.gridWidth = 32;
        this.gridHeight = 32;
        this.tileSize = 32;

        // Initialize empty grid
        this.grid = [];
        for (let y = 0; y < this.gridHeight; y++) {
            this.grid[y] = [];
            for (let x = 0; x < this.gridWidth; x++) {
                this.grid[y][x] = {
                    type: 0,     // 0 = empty, 1 = tileset1, 2 = tileset2
                    index: 0     // tile index in the tileset
                };
            }
        }
    }

    // Get tile type at position (x,y), returns 0 if out of bounds
    getTileType(x, y) {
        if (x < 0 || x >= this.gridWidth || y < 0 || y >= this.gridHeight) {
            return 0;
        }
        return this.grid[y][x].type;
    }

    // Calculate tile index based on surrounding tiles
    calculateTileIndex(x, y) {
        const type = this.grid[y][x].type;
        if (type === 0) return 0;

        let index = 0;
        
        // Check all 8 surrounding tiles
        // Bit positions: (clockwise from top-left)
        // 1   2   4
        // 128 X   8
        // 64  32  16
        
        if (this.getTileType(x-1, y-1) === type) index |= 1;
        if (this.getTileType(x, y-1) === type)   index |= 2;
        if (this.getTileType(x+1, y-1) === type) index |= 4;
        if (this.getTileType(x+1, y) === type)   index |= 8;
        if (this.getTileType(x+1, y+1) === type) index |= 16;
        if (this.getTileType(x, y+1) === type)   index |= 32;
        if (this.getTileType(x-1, y+1) === type) index |= 64;
        if (this.getTileType(x-1, y) === type)   index |= 128;

        return index;
    }

    // Update a tile and its neighbors
    placeTile(x, y, type) {
        if (x < 0 || x >= this.gridWidth || y < 0 || y >= this.gridHeight) {
            return;
        }

        // Place the tile
        this.grid[y][x].type = type;
        if (type !== 0) {
            this.grid[y][x].index = this.calculateTileIndex(x, y);
        }

        // Update surrounding tiles
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                const newX = x + dx;
                const newY = y + dy;
                if (newX >= 0 && newX < this.gridWidth && 
                    newY >= 0 && newY < this.gridHeight &&
                    this.grid[newY][newX].type !== 0) {
                    this.grid[newY][newX].index = this.calculateTileIndex(newX, newY);
                }
            }
        }
    }

    // Clear the entire grid
    clear() {
        for (let y = 0; y < this.gridHeight; y++) {
            for (let x = 0; x < this.gridWidth; x++) {
                this.grid[y][x] = { type: 0, index: 0 };
            }
        }
    }

    // Generate a random map
    generateRandom() {
        this.clear();
        for (let y = 0; y < this.gridHeight; y++) {
            for (let x = 0; x < this.gridWidth; x++) {
                if (Math.random() < 0.3) {
                    this.placeTile(x, y, Math.random() < 0.5 ? 1 : 2);
                }
            }
        }
    }

    // Draw the grid
    draw(ctx, tileset1, tileset2) {
        // Calculate tile scaling
        const scale = Math.min(
            ctx.canvas.width / this.gridWidth,
            ctx.canvas.height / this.gridHeight
        );

        // Calculate offset to center the grid
        const offsetX = (ctx.canvas.width - this.gridWidth * scale) / 2;
        const offsetY = (ctx.canvas.height - this.gridHeight * scale) / 2;

        // Draw each tile
        for (let y = 0; y < this.gridHeight; y++) {
            for (let x = 0; x < this.gridWidth; x++) {
                const tile = this.grid[y][x];
                
                if (tile.type !== 0) {
                    // Select the correct tileset
                    const tileset = tile.type === 1 ? tileset1 : tileset2;
                    
                    // Skip if tileset isn't loaded
                    if (!tileset || !tileset.complete || tileset.naturalWidth === 0) {
                        continue;
                    }

                    // Calculate source coordinates in tileset
                    const srcX = (tile.index % 16) * this.tileSize;
                    const srcY = Math.floor(tile.index / 16) * this.tileSize;

                    try {
                        ctx.drawImage(
                            tileset,
                            srcX, srcY, this.tileSize, this.tileSize,
                            offsetX + x * scale,
                            offsetY + y * scale,
                            scale, scale
                        );
                    } catch (error) {
                        console.error('Failed to draw tile:', error);
                    }
                }
            }
        }
    }
}
