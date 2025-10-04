import * as THREE from 'three';
import { HeightData } from './terrainLoader.js';





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
            scale: options.scale ?? 1.0,
            heightScale: options.heightScale ?? 1.0,
            wireframe: options.wireframe ?? false,
            colorScheme: options.colorScheme ?? 'mars'
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
                const worldX = (x - width / 2) * this.options.scale;
                const worldZ = (y - height / 2) * this.options.scale;
                
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
        
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
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
                        Math.max(0.001, this.heightData.maxHeight - this.heightData.minHeight)
                    ));
                    
                    const color = this.getColorForHeight(normalizedHeight);
                    colors.push(color.r, color.g, color.b);
                }
            }
        }
        
        // Ensure we have the right number of colors
        console.log(`Created ${colors.length / 3} vertex colors for ${width * height} vertices`);
        
        this.geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        
        const material = new THREE.MeshStandardMaterial({
            vertexColors: true,
            wireframe: this.options.wireframe,
            side: THREE.DoubleSide,
            roughness: 0.9,
            metalness: 0.0,
            // Fallback color in case vertex colors fail
            color: 0xcc6644
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
        if (normalizedHeight < 0.2) {
            // Low areas - darker red/brown
            return new THREE.Color(0.4, 0.2, 0.1);
        } else if (normalizedHeight < 0.4) {
            // Medium-low - reddish brown
            return new THREE.Color(0.6, 0.3, 0.2);
        } else if (normalizedHeight < 0.6) {
            // Medium - orange-red
            return new THREE.Color(0.8, 0.4, 0.2);
        } else if (normalizedHeight < 0.8) {
            // Medium-high - lighter orange
            return new THREE.Color(0.9, 0.5, 0.3);
        } else {
            // High areas - light orange/yellow
            return new THREE.Color(1.0, 0.7, 0.4);
        }
    }
    
    /**
     * Earth-like color scheme
     */
    private getEarthColor(normalizedHeight: number): THREE.Color {
        if (normalizedHeight < 0.2) {
            // Water - blue
            return new THREE.Color(0.2, 0.4, 0.8);
        } else if (normalizedHeight < 0.4) {
            // Sand - yellow
            return new THREE.Color(0.8, 0.7, 0.4);
        } else if (normalizedHeight < 0.6) {
            // Grass - green
            return new THREE.Color(0.3, 0.7, 0.3);
        } else if (normalizedHeight < 0.8) {
            // Rock - gray
            return new THREE.Color(0.5, 0.5, 0.5);
        } else {
            // Snow - white
            return new THREE.Color(0.9, 0.9, 0.9);
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
        
        if (x > 0) neighbors.push({ nx: x - 1, ny: y, dist: this.options.scale });
        if (x < width - 1) neighbors.push({ nx: x + 1, ny: y, dist: this.options.scale });
        if (y > 0) neighbors.push({ nx: x, ny: y - 1, dist: this.options.scale });
        if (y < height - 1) neighbors.push({ nx: x, ny: y + 1, dist: this.options.scale });
        
        // Include diagonals for a more representative slope
        const diag = this.options.scale * Math.SQRT2;
        if (x > 0 && y > 0) neighbors.push({ nx: x - 1, ny: y - 1, dist: diag });
        if (x < width - 1 && y > 0) neighbors.push({ nx: x + 1, ny: y - 1, dist: diag });
        if (x > 0 && y < height - 1) neighbors.push({ nx: x - 1, ny: y + 1, dist: diag });
        if (x < width - 1 && y < height - 1) neighbors.push({ nx: x + 1, ny: y + 1, dist: diag });
        
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
        // Clamp and normalize to 0..1 using 45° as a typical steepness cap
        const t = Math.max(0, Math.min(1, slopeDeg / 45));
        // Gradient: green (0) → yellow (0.5) → red (1)
        if (t < 0.5) {
            const u = t / 0.5; // 0..1
            return new THREE.Color(0.2 + 0.6 * u, 0.8, 0.2); // green → yellowish
        } else {
            const u = (t - 0.5) / 0.5; // 0..1
            return new THREE.Color(0.8, 0.8 - 0.6 * u, 0.2); // yellow → red
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
        const x = (worldX / this.options.scale) + width / 2;
        const y = (worldZ / this.options.scale) + height / 2;
        return { x, y };
    }
    
    /**
     * Convert height data coordinates to world coordinates
     */
    heightToWorldCoords(x: number, y: number): { x: number; z: number } {
        const { width, height } = this.heightData;
        const worldX = (x - width / 2) * this.options.scale;
        const worldZ = (y - height / 2) * this.options.scale;
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
