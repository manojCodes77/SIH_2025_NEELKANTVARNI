import * as THREE from 'three';
import { HeightData } from './terrainLoader.js';

// Terrain Mesh Constants
const TERRAIN_CONSTANTS = {
  // Default values
  DEFAULTS: {
    SCALE: 1.0,
    HEIGHT_SCALE: 1.0,
    WIREFRAME: false,
    COLOR_SCHEME: 'mars' as const,
  },
  
  // Geometry properties
  GEOMETRY: {
    POSITION_COMPONENTS: 3,
    UV_COMPONENTS: 2,
    TRIANGLES_PER_QUAD: 2,
    VERTICES_PER_TRIANGLE: 3,
  },
  
  // Material properties
  MATERIAL: {
    ROUGHNESS: 0.9,
    METALNESS: 0.0,
    FALLBACK_COLOR: 0xcc6644,
  },
  
  // Color thresholds for height-based coloring
  HEIGHT_THRESHOLDS: {
    LOW: 0.2,
    MEDIUM_LOW: 0.4,
    MEDIUM: 0.6,
    MEDIUM_HIGH: 0.8,
  },
  
  // Mars color scheme
  MARS_COLORS: {
    LOW: { r: 0.4, g: 0.2, b: 0.1 },           // Dark red/brown
    MEDIUM_LOW: { r: 0.6, g: 0.3, b: 0.2 },   // Reddish brown
    MEDIUM: { r: 0.8, g: 0.4, b: 0.2 },       // Orange-red
    MEDIUM_HIGH: { r: 0.9, g: 0.5, b: 0.3 },  // Lighter orange
    HIGH: { r: 1.0, g: 0.7, b: 0.4 },         // Light orange/yellow
  },
  
  // Earth color scheme
  EARTH_COLORS: {
    LOW: { r: 0.2, g: 0.4, b: 0.8 },          // Water - blue
    MEDIUM_LOW: { r: 0.8, g: 0.7, b: 0.4 },   // Sand - yellow
    MEDIUM: { r: 0.3, g: 0.7, b: 0.3 },       // Grass - green
    MEDIUM_HIGH: { r: 0.5, g: 0.5, b: 0.5 },  // Rock - gray
    HIGH: { r: 0.9, g: 0.9, b: 0.9 },         // Snow - white
  },
  
  // Slope coloring
  SLOPE: {
    MAX_DEGREES: 45,
    HALF_THRESHOLD: 0.5,
    GREEN_COLOR: { r: 0.2, g: 0.8, b: 0.2 },  // Flat areas
    YELLOW_MODIFIER: { r: 0.6, g: 0.0, b: 0.0 }, // Added to green for yellow
    RED_MODIFIER: { r: 0.0, g: 0.6, b: 0.0 },    // Subtracted from yellow for red
  },
  
  // Coordinate calculations
  COORDINATES: {
    HALF_DIVISOR: 2,
    MIN_HEIGHT_DIFF: 0.001, // Prevent division by zero
  },
  
  // Neighbor offsets for slope calculation
  NEIGHBOR_OFFSETS: {
    ORTHOGONAL: [
      { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
      { dx: 0, dy: -1 }, { dx: 0, dy: 1 }
    ],
    DIAGONAL: [
      { dx: -1, dy: -1 }, { dx: 1, dy: -1 },
      { dx: -1, dy: 1 }, { dx: 1, dy: 1 }
    ],
  },
} as const;

export interface TerrainMeshOptions {
    scale?: number;
    heightScale?: number;
    wireframe?: boolean;
    colorScheme?: 'height' | 'slope' | 'mars' | 'earth';
}

export class TerrainMesh {
    private mesh: THREE.Mesh;
    private geometry: THREE.BufferGeometry;
    private material: THREE.Material;
    private heightData: HeightData;
    private options: Required<TerrainMeshOptions>;
    
    constructor(heightData: HeightData, options: TerrainMeshOptions = {}) {
        this.heightData = heightData;
        this.options = {
            scale: options.scale ?? TERRAIN_CONSTANTS.DEFAULTS.SCALE,
            heightScale: options.heightScale ?? TERRAIN_CONSTANTS.DEFAULTS.HEIGHT_SCALE,
            wireframe: options.wireframe ?? TERRAIN_CONSTANTS.DEFAULTS.WIREFRAME,
            colorScheme: options.colorScheme ?? TERRAIN_CONSTANTS.DEFAULTS.COLOR_SCHEME
        };
        
        this.geometry = this.createGeometry();
        this.material = this.createMaterial();
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        
        // Enable shadows
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
    }
    
    /**
     * Create the terrain geometry from height data
     */
    private createGeometry(): THREE.BufferGeometry {
        const { width, height, data } = this.heightData;
        const geometry = new THREE.BufferGeometry();
        
        const vertices: number[] = [];
        const uvs: number[] = [];
        const indices: number[] = [];
        
        // Generate vertices
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const heightValue = data[y][x] * this.options.heightScale;
                const worldX = (x - width / TERRAIN_CONSTANTS.COORDINATES.HALF_DIVISOR) * this.options.scale;
                const worldZ = (y - height / TERRAIN_CONSTANTS.COORDINATES.HALF_DIVISOR) * this.options.scale;
                
                vertices.push(worldX, heightValue, worldZ);
                uvs.push(x / (width - 1), y / (height - 1));
            }
        }
        
        // Generate indices for triangles
        for (let y = 0; y < height - 1; y++) {
            for (let x = 0; x < width - 1; x++) {
                const topLeft = y * width + x;
                const topRight = topLeft + 1;
                const bottomLeft = (y + 1) * width + x;
                const bottomRight = bottomLeft + 1;
                
                // First triangle
                indices.push(topLeft, bottomLeft, topRight);
                // Second triangle
                indices.push(topRight, bottomLeft, bottomRight);
            }
        }
        
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, TERRAIN_CONSTANTS.GEOMETRY.POSITION_COMPONENTS));
        geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, TERRAIN_CONSTANTS.GEOMETRY.UV_COMPONENTS));
        geometry.setIndex(indices);
        
        // Let Three.js compute smooth vertex normals
        geometry.computeVertexNormals();
        
        geometry.computeBoundingBox();
        geometry.computeBoundingSphere();
        
        return geometry;
    }
    
    /**
     * Create material with height-based coloring
     */
    private createMaterial(): THREE.Material {
        const { width, height, data } = this.heightData;
        
        // Create vertex colors depending on selected scheme
        const colors: number[] = [];
        
        if (this.options.colorScheme === 'slope') {
            // Real slope-based coloring
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const slopeDeg = this.computeSlopeAt(x, y);
                    const color = this.getSlopeColorDegrees(slopeDeg);
                    colors.push(color.r, color.g, color.b);
                }
            }
        } else {
            // Height-based coloring
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const heightValue = data[y][x];
                    const normalizedHeight = Math.max(0, Math.min(1, 
                        (heightValue - this.heightData.minHeight) / 
                        Math.max(TERRAIN_CONSTANTS.COORDINATES.MIN_HEIGHT_DIFF, this.heightData.maxHeight - this.heightData.minHeight)
                    ));
                    
                    const color = this.getColorForHeight(normalizedHeight);
                    colors.push(color.r, color.g, color.b);
                }
            }
        }
        
        // Ensure we have the right number of colors
        console.log(`Created ${colors.length / 3} vertex colors for ${width * height} vertices`);
        
        this.geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, TERRAIN_CONSTANTS.GEOMETRY.POSITION_COMPONENTS));
        
        const material = new THREE.MeshStandardMaterial({
            vertexColors: true,
            wireframe: this.options.wireframe,
            side: THREE.DoubleSide,
            roughness: TERRAIN_CONSTANTS.MATERIAL.ROUGHNESS,
            metalness: TERRAIN_CONSTANTS.MATERIAL.METALNESS,
            // Fallback color in case vertex colors fail
            color: TERRAIN_CONSTANTS.MATERIAL.FALLBACK_COLOR
        });
        
        return material;
    }
    
    /**
     * Get color based on height value
     */
    private getColorForHeight(normalizedHeight: number): THREE.Color {
        switch (this.options.colorScheme) {
            case 'mars':
                return this.getMarsColor(normalizedHeight);
            case 'earth':
                return this.getEarthColor(normalizedHeight);
            case 'height':
                return this.getHeightColor(normalizedHeight);
            default:
                return this.getMarsColor(normalizedHeight);
        }
    }
    
    /**
     * Mars-like color scheme
     */
    private getMarsColor(normalizedHeight: number): THREE.Color {
        if (normalizedHeight < TERRAIN_CONSTANTS.HEIGHT_THRESHOLDS.LOW) {
            // Low areas - darker red/brown
            const color = TERRAIN_CONSTANTS.MARS_COLORS.LOW;
            return new THREE.Color(color.r, color.g, color.b);
        } else if (normalizedHeight < TERRAIN_CONSTANTS.HEIGHT_THRESHOLDS.MEDIUM_LOW) {
            // Medium-low - reddish brown
            const color = TERRAIN_CONSTANTS.MARS_COLORS.MEDIUM_LOW;
            return new THREE.Color(color.r, color.g, color.b);
        } else if (normalizedHeight < TERRAIN_CONSTANTS.HEIGHT_THRESHOLDS.MEDIUM) {
            // Medium - orange-red
            const color = TERRAIN_CONSTANTS.MARS_COLORS.MEDIUM;
            return new THREE.Color(color.r, color.g, color.b);
        } else if (normalizedHeight < TERRAIN_CONSTANTS.HEIGHT_THRESHOLDS.MEDIUM_HIGH) {
            // Medium-high - lighter orange
            const color = TERRAIN_CONSTANTS.MARS_COLORS.MEDIUM_HIGH;
            return new THREE.Color(color.r, color.g, color.b);
        } else {
            // High areas - light orange/yellow
            const color = TERRAIN_CONSTANTS.MARS_COLORS.HIGH;
            return new THREE.Color(color.r, color.g, color.b);
        }
    }
    
    /**
     * Earth-like color scheme
     */
    private getEarthColor(normalizedHeight: number): THREE.Color {
        if (normalizedHeight < TERRAIN_CONSTANTS.HEIGHT_THRESHOLDS.LOW) {
            // Water - blue
            const color = TERRAIN_CONSTANTS.EARTH_COLORS.LOW;
            return new THREE.Color(color.r, color.g, color.b);
        } else if (normalizedHeight < TERRAIN_CONSTANTS.HEIGHT_THRESHOLDS.MEDIUM_LOW) {
            // Sand - yellow
            const color = TERRAIN_CONSTANTS.EARTH_COLORS.MEDIUM_LOW;
            return new THREE.Color(color.r, color.g, color.b);
        } else if (normalizedHeight < TERRAIN_CONSTANTS.HEIGHT_THRESHOLDS.MEDIUM) {
            // Grass - green
            const color = TERRAIN_CONSTANTS.EARTH_COLORS.MEDIUM;
            return new THREE.Color(color.r, color.g, color.b);
        } else if (normalizedHeight < TERRAIN_CONSTANTS.HEIGHT_THRESHOLDS.MEDIUM_HIGH) {
            // Rock - gray
            const color = TERRAIN_CONSTANTS.EARTH_COLORS.MEDIUM_HIGH;
            return new THREE.Color(color.r, color.g, color.b);
        } else {
            // Snow - white
            const color = TERRAIN_CONSTANTS.EARTH_COLORS.HIGH;
            return new THREE.Color(color.r, color.g, color.b);
        }
    }
    
    /**
     * Simple height-based color scheme
     */
    private getHeightColor(normalizedHeight: number): THREE.Color {
        return new THREE.Color(normalizedHeight, normalizedHeight, normalizedHeight);
    }
    
    /**
     * Compute local slope in degrees at a grid coordinate using finite differences
     */
    private computeSlopeAt(x: number, y: number): number {
        const { width, height, data } = this.heightData;
        const current = data[y][x] * this.options.heightScale;
        const neighbors: Array<{ nx: number; ny: number; dist: number }> = [];
        
        // Add orthogonal neighbors
        TERRAIN_CONSTANTS.NEIGHBOR_OFFSETS.ORTHOGONAL.forEach(({ dx, dy }) => {
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                neighbors.push({ nx, ny, dist: this.options.scale });
            }
        });
        
        // Include diagonals for a more representative slope
        const diag = this.options.scale * Math.SQRT2;
        TERRAIN_CONSTANTS.NEIGHBOR_OFFSETS.DIAGONAL.forEach(({ dx, dy }) => {
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                neighbors.push({ nx, ny, dist: diag });
            }
        });
        
        let maxSlope = 0;
        for (const { nx, ny, dist } of neighbors) {
            const neighbor = data[ny][nx] * this.options.heightScale;
            const rise = Math.abs(neighbor - current);
            const slope = Math.atan(rise / dist) * (180 / Math.PI);
            if (slope > maxSlope) maxSlope = slope;
        }
        return maxSlope;
    }

    /**
     * Map slope degrees to color (green flat → red steep)
     */
    private getSlopeColorDegrees(slopeDeg: number): THREE.Color {
        // Clamp and normalize to 0..1 using max degrees as steepness cap
        const t = Math.max(0, Math.min(1, slopeDeg / TERRAIN_CONSTANTS.SLOPE.MAX_DEGREES));
        // Gradient: green (0) → yellow (0.5) → red (1)
        if (t < TERRAIN_CONSTANTS.SLOPE.HALF_THRESHOLD) {
            const u = t / TERRAIN_CONSTANTS.SLOPE.HALF_THRESHOLD; // 0..1
            const green = TERRAIN_CONSTANTS.SLOPE.GREEN_COLOR;
            const yellowMod = TERRAIN_CONSTANTS.SLOPE.YELLOW_MODIFIER;
            return new THREE.Color(
                green.r + yellowMod.r * u,
                green.g,
                green.b
            ); // green → yellowish
        } else {
            const u = (t - TERRAIN_CONSTANTS.SLOPE.HALF_THRESHOLD) / TERRAIN_CONSTANTS.SLOPE.HALF_THRESHOLD; // 0..1
            const redMod = TERRAIN_CONSTANTS.SLOPE.RED_MODIFIER;
            return new THREE.Color(
                0.8,
                0.8 - redMod.g * u,
                0.2
            ); // yellow → red
        }
    }
    
    /**
     * Update the terrain mesh with new height data
     */
    updateHeightData(newHeightData: HeightData): void {
        this.heightData = newHeightData;
        
        // Recreate geometry and material
        this.geometry.dispose();
        this.material.dispose();
        
        this.geometry = this.createGeometry();
        this.material = this.createMaterial();
        this.mesh.geometry = this.geometry;
        this.mesh.material = this.material;
    }
    
    /**
     * Update material options
     */
    updateMaterialOptions(newOptions: Partial<TerrainMeshOptions>): void {
        this.options = { ...this.options, ...newOptions };
        
        // Recreate material
        this.material.dispose();
        this.material = this.createMaterial();
        this.mesh.material = this.material;
    }
    
    /**
     * Get the Three.js mesh object
     */
    getMesh(): THREE.Mesh {
        return this.mesh;
    }
    
    /**
     * Get the height data
     */
    getHeightData(): HeightData {
        return this.heightData;
    }
    
    /**
     * Convert world coordinates to height data coordinates
     */
    worldToHeightCoords(worldX: number, worldZ: number): { x: number; y: number } {
        const { width, height } = this.heightData;
        const x = (worldX / this.options.scale) + width / TERRAIN_CONSTANTS.COORDINATES.HALF_DIVISOR;
        const y = (worldZ / this.options.scale) + height / TERRAIN_CONSTANTS.COORDINATES.HALF_DIVISOR;
        return { x, y };
    }
    
    /**
     * Convert height data coordinates to world coordinates
     */
    heightToWorldCoords(x: number, y: number): { x: number; z: number } {
        const { width, height } = this.heightData;
        const worldX = (x - width / TERRAIN_CONSTANTS.COORDINATES.HALF_DIVISOR) * this.options.scale;
        const worldZ = (y - height / TERRAIN_CONSTANTS.COORDINATES.HALF_DIVISOR) * this.options.scale;
        return { x: worldX, z: worldZ };
    }
    
    /**
     * Get height at world coordinates
     */
    getHeightAtWorldCoords(worldX: number, worldZ: number): number {
        const coords = this.worldToHeightCoords(worldX, worldZ);
        const { data } = this.heightData;
        
        const x = Math.floor(coords.x);
        const y = Math.floor(coords.y);
        
        if (x >= 0 && x < data[0].length && y >= 0 && y < data.length) {
            return data[y][x] * this.options.heightScale;
        }
        
        return 0;
    }
    
    /**
     * Dispose of resources
     */
    dispose(): void {
        this.geometry.dispose();
        this.material.dispose();
    }
}
