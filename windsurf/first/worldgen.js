class WorldGenerator {
    constructor(width, height) {
        this.width = width;
        this.height = height;
    }

    // Generate Perlin noise
    generateNoise(frequency = 0.1, octaves = 4) {
        const noise = new Array(this.height).fill(0).map(() => new Array(this.width).fill(0));
        
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                let amplitude = 1;
                let freq = frequency;
                let noiseValue = 0;
                
                // Add multiple octaves of noise
                for (let o = 0; o < octaves; o++) {
                    noiseValue += this.smoothNoise(x * freq, y * freq) * amplitude;
                    amplitude *= 0.5;
                    freq *= 2;
                }
                
                noise[y][x] = noiseValue;
            }
        }
        
        return noise;
    }

    // Simple smooth noise function
    smoothNoise(x, y) {
        const corners = (this.random(x-1, y-1) + this.random(x+1, y-1) + 
                        this.random(x-1, y+1) + this.random(x+1, y+1)) / 16;
        const sides = (this.random(x-1, y) + this.random(x+1, y) + 
                      this.random(x, y-1) + this.random(x, y+1)) / 8;
        const center = this.random(x, y) / 4;
        return corners + sides + center;
    }

    // Seeded random function
    random(x, y) {
        const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453123;
        return n - Math.floor(n);
    }

    // Generate the complete world
    generate() {
        // Generate large-scale terrain using Perlin noise
        const noise1 = this.generateNoise(0.03, 4); // Very large features
        const noise2 = this.generateNoise(0.06, 2); // Medium features
        
        // Create the map
        const map = new Array(this.height).fill(0)
            .map((_, y) => new Array(this.width).fill(0));
        
        // Generate the terrain
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const value = (noise1[y][x] * 0.7 + noise2[y][x] * 0.3);
                
                // Create varied terrain with more walkable areas
                if (value < 0.3) map[y][x] = 0;      // Water/pits (30%)
                else if (value < 0.8) map[y][x] = 1; // Walkable terrain (50%)
                else map[y][x] = 2;                  // Mountains/walls (20%)
            }
        }
        
        // Create starting room in the center
        const centerX = Math.floor(this.width / 2);
        const centerY = Math.floor(this.height / 2);
        const roomSize = 8; // Larger starting room
        const roomOffset = Math.floor(roomSize / 2);
        
        // Create the room and a safe area around it
        for (let y = centerY - roomOffset - 2; y <= centerY + roomOffset + 2; y++) {
            for (let x = centerX - roomOffset - 2; x <= centerX + roomOffset + 2; x++) {
                if (y >= 0 && y < this.height && x >= 0 && x < this.width) {
                    // Create a gradient from guaranteed safe room to possible terrain
                    const distFromCenter = Math.max(
                        Math.abs(x - centerX) - roomOffset,
                        Math.abs(y - centerY) - roomOffset
                    );
                    
                    if (distFromCenter <= 0) {
                        // Inside the room - always floor
                        map[y][x] = 1;
                    } else if (distFromCenter <= 2) {
                        // Transition zone - mostly floor with some features
                        const transitionNoise = Math.random();
                        if (transitionNoise < 0.8) map[y][x] = 1;
                        else if (transitionNoise < 0.9) map[y][x] = 0;
                        else map[y][x] = 2;
                    }
                }
            }
        }
        
        // Add border walls
        for (let y = 0; y < this.height; y++) {
            map[y][0] = 2;
            map[y][this.width-1] = 2;
        }
        for (let x = 0; x < this.width; x++) {
            map[0][x] = 2;
            map[this.height-1][x] = 2;
        }
        
        return map;
    }
}
