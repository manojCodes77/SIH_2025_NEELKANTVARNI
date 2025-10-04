import { HeightData } from './terrainLoader.js';

export interface Point {
    x: number;
    y: number;
}

export interface PathNode {
    x: number;
    y: number;
    g: number; // Cost from start
    h: number; // Heuristic cost to goal
    f: number; // Total cost (g + h)
    parent: PathNode | null;
}

export interface PathfindingOptions {
    maxSlope?: number; // Maximum allowed slope in degrees
    diagonalMovement?: boolean; // Allow diagonal movement
    slopeWeight?: number; // Weight for slope penalty in cost calculation
    distanceWeight?: number; // Weight for distance in cost calculation
}

export interface PathfindingResult {
    path: Point[];
    cost: number;
    success: boolean;
    nodesExplored: number;
    executionTime: number;
}

export class PathfindingEngine {
    private heightData: HeightData;
    private options: Required<PathfindingOptions>;
    
    constructor(heightData: HeightData, options: PathfindingOptions = {}) {
        this.heightData = heightData;
        this.options = {
            maxSlope: options.maxSlope ?? 30, // 30 degrees default
            diagonalMovement: options.diagonalMovement ?? true,
            slopeWeight: options.slopeWeight ?? 2.0,
            distanceWeight: options.distanceWeight ?? 1.0
        };
    }
    
    /**
     * Find path using A* algorithm
     */
    findPath(start: Point, goal: Point): PathfindingResult {
        const startTime = performance.now();
        
        if (!this.isValidPoint(start) || !this.isValidPoint(goal)) {
            return { path: [], cost: 0, success: false, nodesExplored: 0, executionTime: performance.now() - startTime };
        }
        
        const width = this.heightData.width;
        const height = this.heightData.height;
        const indexOf = (x: number, y: number) => y * width + x;
        
        const total = width * height;
        const closed = new Uint8Array(total);
        const inOpen = new Uint8Array(total);
        const gScore = new Float32Array(total);
        gScore.fill(Infinity);
        
        // For reconstructing the path: store parent index per node
        const cameFrom = new Int32Array(total);
        cameFrom.fill(-1);
        
        const heap = new MinHeap<PathNode>((a, b) => a.f - b.f);
        
        const startIdx = indexOf(start.x, start.y);
        const startNode: PathNode = { x: start.x, y: start.y, g: 0, h: this.heuristic(start, goal), f: 0, parent: null };
        startNode.f = startNode.g + startNode.h;
        heap.push(startNode);
        gScore[startIdx] = 0;
        inOpen[startIdx] = 1;
        
        let nodesExplored = 0;
        
        while (!heap.isEmpty()) {
            const current = heap.pop()!;
            const cIdx = indexOf(current.x, current.y);
            inOpen[cIdx] = 0;
            closed[cIdx] = 1;
            nodesExplored++;
            
            if (current.x === goal.x && current.y === goal.y) {
                // Reconstruct path using cameFrom
                const path: Point[] = [];
                let idx = cIdx;
                while (idx !== -1) {
                    const x = idx % width;
                    const y = Math.floor(idx / width);
                    path.unshift({ x, y });
                    idx = cameFrom[idx];
                }
                return { path, cost: current.g, success: true, nodesExplored, executionTime: performance.now() - startTime };
            }
            
            // Neighbor exploration (4 or 8 directions)
            const dirs: Array<{ dx: number; dy: number }> = [
                { dx: 0, dy: -1 }, { dx: 1, dy: 0 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }
            ];
            if (this.options.diagonalMovement) {
                dirs.push({ dx: -1, dy: -1 }, { dx: 1, dy: -1 }, { dx: 1, dy: 1 }, { dx: -1, dy: 1 });
            }
            
            for (const { dx, dy } of dirs) {
                const nx = current.x + dx;
                const ny = current.y + dy;
                if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
                const nIdx = indexOf(nx, ny);
                if (closed[nIdx]) continue;
                
                const moveCost = this.getMovementCost(current, { x: nx, y: ny });
                if (!isFinite(moveCost)) continue; // Too steep
                
                const tentativeG = current.g + moveCost;
                if (tentativeG >= gScore[nIdx]) continue;
                
                // This path is better
                cameFrom[nIdx] = cIdx;
                gScore[nIdx] = tentativeG;
                const h = this.heuristic({ x: nx, y: ny }, goal);
                const f = tentativeG + h;
                
                if (inOpen[nIdx]) {
                    heap.decreaseIfBetter((node) => node.x === nx && node.y === ny, (node) => {
                        node.g = tentativeG; node.h = h; node.f = f; node.parent = current; return node;
                    });
                } else {
                    heap.push({ x: nx, y: ny, g: tentativeG, h, f, parent: current });
                    inOpen[nIdx] = 1;
                }
            }
        }
        
        return { path: [], cost: 0, success: false, nodesExplored, executionTime: performance.now() - startTime };
    }
    
    
    /**
     * Calculate movement cost between two nodes
     */
    private getMovementCost(from: Point, to: Point): number {
        const distance = this.getDistance(from, to);
        const slope = this.calculateSlope(from, to);
        
        // Check if slope exceeds maximum allowed
        if (slope > this.options.maxSlope) {
            return Infinity; // Impossible to traverse
        }
        
        // Calculate cost: distance + slope penalty
        const distanceCost = distance * this.options.distanceWeight;
        const slopeCost = (slope / this.options.maxSlope) * this.options.slopeWeight;
        
        return distanceCost + slopeCost;
    }
    
    /**
     * Calculate slope between two points
     */
    private calculateSlope(from: Point, to: Point): number {
        const heightFrom = this.heightData.data[from.y][from.x];
        const heightTo = this.heightData.data[to.y][to.x];
        const distance = this.getDistance(from, to);
        
        // Use signed height difference to distinguish uphill/downhill
        const heightDiff = heightTo - heightFrom;
        return Math.atan(heightDiff / distance) * (180 / Math.PI);
    }
    
    /**
     * Calculate Euclidean distance between two points
     */
    private getDistance(from: Point, to: Point): number {
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    /**
     * Heuristic function (Euclidean distance)
     */
    private heuristic(from: Point, to: Point): number {
        return this.getDistance(from, to) * this.options.distanceWeight;
    }
    
    /**
     * Check if a point is valid (within bounds)
     */
    private isValidPoint(point: Point): boolean {
        return point.x >= 0 && point.x < this.heightData.width &&
               point.y >= 0 && point.y < this.heightData.height;
    }
    
    
    
    /**
     * Update pathfinding options
     */
    updateOptions(newOptions: Partial<PathfindingOptions>): void {
        this.options = { ...this.options, ...newOptions };
    }
    
    /**
     * Get current options
     */
    getOptions(): Required<PathfindingOptions> {
        return { ...this.options };
    }
    
    /**
     * Calculate slope at a specific point
     */
    getSlopeAt(point: Point): number {
        if (!this.isValidPoint(point)) return 0;
        
        const { x, y } = point;
        const centerHeight = this.heightData.data[y][x];
        let maxSlope = 0;
        
        // Check slopes to all adjacent cells
        const directions = [
            { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
            { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
            { dx: -1, dy: -1 }, { dx: 1, dy: -1 },
            { dx: -1, dy: 1 }, { dx: 1, dy: 1 }
        ];
        
        for (const { dx, dy } of directions) {
            const newX = x + dx;
            const newY = y + dy;
            
            if (newX >= 0 && newX < this.heightData.width && 
                newY >= 0 && newY < this.heightData.height) {
                
                const neighborHeight = this.heightData.data[newY][newX];
                const distance = Math.sqrt(dx * dx + dy * dy);
                const slope = Math.atan(Math.abs(centerHeight - neighborHeight) / distance) * (180 / Math.PI);
                
                maxSlope = Math.max(maxSlope, slope);
            }
        }
        
        return maxSlope;
    }
    
    /**
     * Generate slope map for visualization
     */
    generateSlopeMap(): number[][] {
        const slopeMap: number[][] = [];
        
        for (let y = 0; y < this.heightData.height; y++) {
            const row: number[] = [];
            for (let x = 0; x < this.heightData.width; x++) {
                row.push(this.getSlopeAt({ x, y }));
            }
            slopeMap.push(row);
        }
        
        return slopeMap;
    }
    
    /**
     * Smooth path by removing unnecessary waypoints
     */
    smoothPath(path: Point[]): Point[] {
        if (path.length <= 2) return path;
        
        const smoothedPath: Point[] = [path[0]];
        
        for (let i = 1; i < path.length - 1; i++) {
            const prev = path[i - 1];
            const current = path[i];
            const next = path[i + 1];
            
            // Check if we can skip this point (direct line of sight)
            if (!this.hasDirectLineOfSight(prev, next)) {
                smoothedPath.push(current);
            }
        }
        
        smoothedPath.push(path[path.length - 1]);
        return smoothedPath;
    }
    
    /**
     * Check if there's a direct line of sight between two points
     */
    private hasDirectLineOfSight(from: Point, to: Point): boolean {
        const distance = this.getDistance(from, to);
        const steps = Math.ceil(distance);
        
        for (let i = 1; i < steps; i++) {
            const t = i / steps;
            const x = Math.round(from.x + (to.x - from.x) * t);
            const y = Math.round(from.y + (to.y - from.y) * t);
            
            if (!this.isValidPoint({ x, y })) return false;
            
            const slope = this.getSlopeAt({ x, y });
            if (slope > this.options.maxSlope) return false;
        }
        
        return true;
    }
}

class MinHeap<T> {
    private data: T[] = [];
    private compare: (a: T, b: T) => number;
    constructor(compare: (a: T, b: T) => number) { this.compare = compare; }
    isEmpty(): boolean { return this.data.length === 0; }
    push(item: T): void { this.data.push(item); this.bubbleUp(this.data.length - 1); }
    pop(): T | undefined {
        if (this.data.length === 0) return undefined;
        const top = this.data[0];
        const end = this.data.pop()!;
        if (this.data.length > 0) { this.data[0] = end; this.bubbleDown(0); }
        return top;
    }
    decreaseIfBetter(match: (n: T) => boolean, update: (n: T) => T): void {
        const idx = this.data.findIndex(match);
        if (idx >= 0) {
            this.data[idx] = update(this.data[idx]);
            this.bubbleUp(idx);
        }
    }
    private bubbleUp(idx: number): void {
        while (idx > 0) {
            const parent = Math.floor((idx - 1) / 2);
            if (this.compare(this.data[idx], this.data[parent]) < 0) {
                [this.data[idx], this.data[parent]] = [this.data[parent], this.data[idx]];
                idx = parent;
            } else break;
        }
    }
    private bubbleDown(idx: number): void {
        const length = this.data.length;
        while (true) {
            const left = 2 * idx + 1;
            const right = 2 * idx + 2;
            let smallest = idx;
            if (left < length && this.compare(this.data[left], this.data[smallest]) < 0) smallest = left;
            if (right < length && this.compare(this.data[right], this.data[smallest]) < 0) smallest = right;
            if (smallest !== idx) {
                [this.data[idx], this.data[smallest]] = [this.data[smallest], this.data[idx]];
                idx = smallest;
            } else break;
        }
    }
}
