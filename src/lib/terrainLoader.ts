/**
 * Terrain Loader - Handles loading heightmap data from various sources
 */

export interface HeightData {
    width: number;
    height: number;
    data: number[][];
    minHeight: number;
    maxHeight: number;
}

export interface LoadOptions {
    normalize?: boolean;
    scale?: number;
    offset?: number;
}

export class TerrainLoader {
    /**
     * Load heightmap data from a PNG image
     */
    static async loadFromPNG(imagePath: string, options: LoadOptions = {}): Promise<HeightData> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            img.onload = () => {
                try {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    if (!ctx) {
                        reject(new Error('Failed to get canvas context'));
                        return;
                    }
                    
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.drawImage(img, 0, 0);
                    
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const heightData = this.extractHeightFromImageData(imageData, options);
                    
                    resolve(heightData);
                } catch (error) {
                    reject(error);
                }
            };
            
            img.onerror = () => {
                reject(new Error(`Failed to load image: ${imagePath}`));
            };
            
            img.src = imagePath;
        });
    }
    
    /**
     * Load heightmap data from JSON array
     */
    static async loadFromJSON(jsonPath: string, options: LoadOptions = {}): Promise<HeightData> {
        try {
            const response = await fetch(jsonPath);
            const rawData = await response.json();
            
            if (!Array.isArray(rawData) || !Array.isArray(rawData[0])) {
                throw new Error('Invalid JSON format. Expected 2D array.');
            }
            
            return this.processHeightArray(rawData, options);
        } catch (error) {
            throw new Error(`Failed to load JSON heightmap: ${error}`);
        }
    }
    
    /**
     * Generate procedural heightmap for testing
     */
    static generateProceduralTerrain(
        width: number, 
        height: number, 
        options: LoadOptions & { 
            noiseScale?: number; 
            octaves?: number; 
            persistence?: number;
            lacunarity?: number;
        } = {}
    ): HeightData {
        const {
            noiseScale = 0.1,
            octaves = 4,
            persistence = 0.5,
            lacunarity = 2.0,
            normalize = true,
            scale = 1.0,
            offset = 0
        } = options;
        
        const data: number[][] = [];
        
        for (let y = 0; y < height; y++) {
            const row: number[] = [];
            for (let x = 0; x < width; x++) {
                let heightValue = 0;
                let amplitude = 1;
                let frequency = 1;
                
                // Generate proper Perlin noise with multiple octaves
                for (let i = 0; i < octaves; i++) {
                    const sampleX = x * frequency * noiseScale;
                    const sampleY = y * frequency * noiseScale;
                    
                    // Use proper Perlin noise
                    const noise = this.perlinNoise(sampleX, sampleY);
                    heightValue += noise * amplitude;
                    
                    amplitude *= persistence;
                    frequency *= lacunarity;
                }
                
                row.push(heightValue * scale + offset);
            }
            data.push(row);
        }
        
        return this.processHeightArray(data, { normalize });
    }
    
    /**
     * Extract height data from ImageData (PNG pixels)
     */
    private static extractHeightFromImageData(imageData: ImageData, options: LoadOptions): HeightData {
        const { width, height, data } = imageData;
        const heightArray: number[][] = [];
        
        for (let y = 0; y < height; y++) {
            const row: number[] = [];
            for (let x = 0; x < width; x++) {
                const pixelIndex = (y * width + x) * 4;
                const r = data[pixelIndex];
                const g = data[pixelIndex + 1];
                const b = data[pixelIndex + 2];
                
                // Convert RGB to grayscale height value
                const heightValue = (r + g + b) / 3;
                row.push(heightValue);
            }
            heightArray.push(row);
        }
        
        return this.processHeightArray(heightArray, options);
    }
    
    /**
     * Process raw height array with normalization and scaling
     */
    private static processHeightArray(rawData: number[][], options: LoadOptions): HeightData {
        const { normalize = true, scale = 1.0, offset = 0 } = options;
        const height = rawData.length;
        const width = rawData[0].length;
        
        // Find min and max values
        let minHeight = Infinity;
        let maxHeight = -Infinity;
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                minHeight = Math.min(minHeight, rawData[y][x]);
                maxHeight = Math.max(maxHeight, rawData[y][x]);
            }
        }
        
        // Process the data
        const processedData: number[][] = [];
        
        for (let y = 0; y < height; y++) {
            const row: number[] = [];
            for (let x = 0; x < width; x++) {
                let value = rawData[y][x];
                
                if (normalize && maxHeight > minHeight) {
                    // Normalize to 0-1 range
                    value = (value - minHeight) / (maxHeight - minHeight);
                }
                
                // Apply scaling and offset
                value = value * scale + offset;
                row.push(value);
            }
            processedData.push(row);
        }
        
        return {
            width,
            height,
            data: processedData,
            minHeight: normalize ? 0 : minHeight * scale + offset,
            maxHeight: normalize ? scale + offset : maxHeight * scale + offset
        };
    }
    
    /**
     * Perlin noise implementation for realistic terrain generation
     */
    private static perlinNoise(x: number, y: number): number {
        return this.noise(x, y);
    }

    /**
     * 2D Perlin noise function
     */
    private static noise(x: number, y: number): number {
        const X = Math.floor(x) & 255;
        const Y = Math.floor(y) & 255;
        
        x -= Math.floor(x);
        y -= Math.floor(y);
        
        const u = this.fade(x);
        const v = this.fade(y);
        
        const A = this.p[X] + Y;
        const AA = this.p[A];
        const AB = this.p[A + 1];
        const B = this.p[X + 1] + Y;
        const BA = this.p[B];
        const BB = this.p[B + 1];
        
        return this.lerp(v, 
            this.lerp(u, this.grad(this.p[AA], x, y), this.grad(this.p[BA], x - 1, y)),
            this.lerp(u, this.grad(this.p[AB], x, y - 1), this.grad(this.p[BB], x - 1, y - 1))
        );
    }

    /**
     * Fade function for smooth interpolation
     */
    private static fade(t: number): number {
        return t * t * t * (t * (t * 6 - 15) + 10);
    }

    /**
     * Linear interpolation
     */
    private static lerp(t: number, a: number, b: number): number {
        return a + t * (b - a);
    }

    /**
     * Gradient function
     */
    private static grad(hash: number, x: number, y: number): number {
        const h = hash & 15;
        const u = h < 8 ? x : y;
        const v = h < 4 ? y : h === 12 || h === 14 ? x : 0;
        return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
    }

    /**
     * Permutation table for Perlin noise
     */
    private static p = [
        151, 160, 137, 91, 90, 15, 131, 13, 201, 95, 96, 53, 194, 233, 7, 225, 140, 36, 103, 30, 69, 142,
        8, 99, 37, 240, 21, 10, 23, 190, 6, 148, 247, 120, 234, 75, 0, 26, 197, 62, 94, 252, 219, 203, 117,
        35, 11, 32, 57, 177, 33, 88, 237, 149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175, 74, 165, 71,
        134, 139, 48, 27, 166, 77, 146, 158, 231, 83, 111, 229, 122, 60, 211, 133, 230, 220, 105, 92, 41,
        55, 46, 245, 40, 244, 102, 143, 54, 65, 25, 63, 161, 1, 216, 80, 73, 209, 76, 132, 187, 208, 89,
        18, 169, 200, 196, 135, 130, 116, 188, 159, 86, 164, 100, 109, 198, 173, 186, 3, 64, 52, 217, 226,
        250, 124, 123, 5, 202, 38, 147, 118, 126, 255, 82, 85, 212, 207, 206, 59, 227, 47, 16, 58, 17, 182,
        189, 28, 42, 223, 183, 170, 213, 119, 248, 152, 2, 44, 154, 163, 70, 221, 153, 101, 155, 167, 43,
        172, 9, 129, 22, 39, 253, 19, 98, 108, 110, 79, 113, 224, 232, 178, 185, 112, 104, 218, 246, 97,
        228, 251, 34, 242, 193, 238, 210, 144, 12, 191, 179, 162, 241, 81, 51, 145, 235, 249, 14, 239,
        107, 49, 192, 214, 31, 181, 199, 106, 157, 184, 84, 204, 176, 115, 121, 50, 45, 127, 4, 150, 254,
        138, 236, 205, 93, 222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215, 61, 156, 180,
        // Duplicate the permutation table
        151, 160, 137, 91, 90, 15, 131, 13, 201, 95, 96, 53, 194, 233, 7, 225, 140, 36, 103, 30, 69, 142,
        8, 99, 37, 240, 21, 10, 23, 190, 6, 148, 247, 120, 234, 75, 0, 26, 197, 62, 94, 252, 219, 203, 117,
        35, 11, 32, 57, 177, 33, 88, 237, 149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175, 74, 165, 71,
        134, 139, 48, 27, 166, 77, 146, 158, 231, 83, 111, 229, 122, 60, 211, 133, 230, 220, 105, 92, 41,
        55, 46, 245, 40, 244, 102, 143, 54, 65, 25, 63, 161, 1, 216, 80, 73, 209, 76, 132, 187, 208, 89,
        18, 169, 200, 196, 135, 130, 116, 188, 159, 86, 164, 100, 109, 198, 173, 186, 3, 64, 52, 217, 226,
        250, 124, 123, 5, 202, 38, 147, 118, 126, 255, 82, 85, 212, 207, 206, 59, 227, 47, 16, 58, 17, 182,
        189, 28, 42, 223, 183, 170, 213, 119, 248, 152, 2, 44, 154, 163, 70, 221, 153, 101, 155, 167, 43,
        172, 9, 129, 22, 39, 253, 19, 98, 108, 110, 79, 113, 224, 232, 178, 185, 112, 104, 218, 246, 97,
        228, 251, 34, 242, 193, 238, 210, 144, 12, 191, 179, 162, 241, 81, 51, 145, 235, 249, 14, 239,
        107, 49, 192, 214, 31, 181, 199, 106, 157, 184, 84, 204, 176, 115, 121, 50, 45, 127, 4, 150, 254,
        138, 236, 205, 93, 222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215, 61, 156, 180
    ];
    
    /**
     * Calculate slope between two height points
     */
    static calculateSlope(height1: number, height2: number, distance: number): number {
        const heightDiff = Math.abs(height1 - height2);
        return Math.atan(heightDiff / distance) * (180 / Math.PI); // Convert to degrees
    }
    
    /**
     * Get height at specific coordinates with bilinear interpolation
     */
    static getHeightAt(heightData: HeightData, x: number, y: number): number {
        const { width, height, data } = heightData;
        
        // Clamp coordinates to valid range
        x = Math.max(0, Math.min(width - 1, x));
        y = Math.max(0, Math.min(height - 1, y));
        
        // Get integer coordinates
        const x1 = Math.floor(x);
        const y1 = Math.floor(y);
        const x2 = Math.min(width - 1, x1 + 1);
        const y2 = Math.min(height - 1, y1 + 1);
        
        // Get fractional parts
        const fx = x - x1;
        const fy = y - y1;
        
        // Bilinear interpolation
        const h11 = data[y1][x1];
        const h12 = data[y2][x1];
        const h21 = data[y1][x2];
        const h22 = data[y2][x2];
        
        const h1 = h11 * (1 - fx) + h21 * fx;
        const h2 = h12 * (1 - fx) + h22 * fx;
        
        return h1 * (1 - fy) + h2 * fy;
    }
}
