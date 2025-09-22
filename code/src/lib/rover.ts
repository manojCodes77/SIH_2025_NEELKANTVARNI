import * as THREE from 'three';
import { Point } from './pathfinding.js';

export interface RoverOptions {
    size?: number;
    color?: number;
    speed?: number;
    wheelCount?: number;
    antennaHeight?: number;
    type?: 'standard' | 'scout' | 'heavy' | 'scientific';
    maxSlope?: number;
    energyCapacity?: number;
    energyEfficiency?: number;
}

export interface RoverState {
    position: THREE.Vector3;
    rotation: THREE.Euler;
    isMoving: boolean;
    currentPathIndex: number;
    energy: number;
    maxEnergy: number;
    distanceTraveled: number;
    currentSpeed: number;
    missionStartTime: number;
    lastPosition: THREE.Vector3;
}

export class Rover {
    private mesh: THREE.Group;
    private options: Required<RoverOptions>;
    private state: RoverState;
    private path: Point[];
    private terrainHeightFunction: (x: number, z: number) => number;
    private animationMixer: THREE.AnimationMixer | null = null;
    private headlight: THREE.SpotLight | null = null;
    
    constructor(options: RoverOptions = {}) {
        // Apply rover type presets
        const typePresets = this.getRoverTypePresets(options.type ?? 'standard');
        
        this.options = {
            size: options.size ?? typePresets.size!,
            color: options.color ?? typePresets.color!,
            speed: options.speed ?? typePresets.speed!,
            wheelCount: options.wheelCount ?? typePresets.wheelCount!,
            antennaHeight: options.antennaHeight ?? typePresets.antennaHeight!,
            type: options.type ?? 'standard',
            maxSlope: options.maxSlope ?? typePresets.maxSlope!,
            energyCapacity: options.energyCapacity ?? typePresets.energyCapacity!,
            energyEfficiency: options.energyEfficiency ?? typePresets.energyEfficiency!
        };
        
        this.state = {
            position: new THREE.Vector3(0, 0, 0),
            rotation: new THREE.Euler(0, 0, 0),
            isMoving: false,
            currentPathIndex: 0,
            energy: this.options.energyCapacity,
            maxEnergy: this.options.energyCapacity,
            distanceTraveled: 0,
            currentSpeed: 0,
            missionStartTime: 0,
            lastPosition: new THREE.Vector3(0, 0, 0)
        };
        
        this.path = [];
        this.terrainHeightFunction = () => 0;
        
        this.mesh = this.createRoverMesh();
    }

    /**
     * Get rover type presets
     */
    private getRoverTypePresets(type: string): Partial<RoverOptions> {
        switch (type) {
            case 'scout':
                return {
                    size: 1.2,
                    color: 0x44aa44,
                    speed: 12.0,
                    wheelCount: 4,
                    antennaHeight: 1.0,
                    maxSlope: 20,
                    energyCapacity: 60,
                    energyEfficiency: 1.5
                };
            case 'heavy':
                return {
                    size: 2.5,
                    color: 0xaa4444,
                    speed: 4.0,
                    wheelCount: 8,
                    antennaHeight: 2.0,
                    maxSlope: 45,
                    energyCapacity: 200,
                    energyEfficiency: 0.6
                };
            case 'scientific':
                return {
                    size: 1.8,
                    color: 0x4444aa,
                    speed: 7.0,
                    wheelCount: 6,
                    antennaHeight: 2.5,
                    maxSlope: 25,
                    energyCapacity: 120,
                    energyEfficiency: 1.2
                };
            default: // standard
                return {
                    size: 2.0,
                    color: 0x666666,
                    speed: 8.0,
                    wheelCount: 6,
                    antennaHeight: 1.5,
                    maxSlope: 30,
                    energyCapacity: 100,
                    energyEfficiency: 1.0
                };
        }
    }
    
    /**
     * Create the 3D rover mesh
     */
    private createRoverMesh(): THREE.Group {
        const group = new THREE.Group();
        
        // Main body
        const bodyGeometry = new THREE.BoxGeometry(this.options.size * 0.8, this.options.size * 0.3, this.options.size * 1.2);
        const bodyMaterial = new THREE.MeshStandardMaterial({ color: this.options.color, roughness: 0.6, metalness: 0.2 });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = this.options.size * 0.15;
        body.castShadow = true;
        body.receiveShadow = true;
        group.add(body);
        
        // Solar panels
        const panelGeometry = new THREE.BoxGeometry(this.options.size * 0.7, this.options.size * 0.05, this.options.size * 0.4);
        const panelMaterial = new THREE.MeshStandardMaterial({ color: 0x0033aa, roughness: 0.3, metalness: 0.5, emissive: 0x001122, emissiveIntensity: 0.1 });
        const leftPanel = new THREE.Mesh(panelGeometry, panelMaterial);
        leftPanel.position.set(-this.options.size * 0.45, this.options.size * 0.35, 0);
        leftPanel.castShadow = true;
        leftPanel.receiveShadow = true;
        group.add(leftPanel);
        
        const rightPanel = leftPanel.clone();
        rightPanel.position.set(this.options.size * 0.45, this.options.size * 0.35, 0);
        group.add(rightPanel);
        
        // Wheels
        for (let i = 0; i < this.options.wheelCount; i++) {
            const wheel = this.createWheel();
            const angle = (i / this.options.wheelCount) * Math.PI * 2;
            const radius = this.options.size * 0.6;
            
            wheel.position.set(
                Math.cos(angle) * radius,
                -this.options.size * 0.2,
                Math.sin(angle) * radius
            );
            
            group.add(wheel);
        }
        
        // Antenna
        const antennaGeometry = new THREE.CylinderGeometry(0.05, 0.05, this.options.antennaHeight, 8);
        const antennaMaterial = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.4, metalness: 0.7 });
        const antenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
        antenna.position.set(0, this.options.size * 0.3 + this.options.antennaHeight / 2, 0);
        antenna.castShadow = true;
        antenna.receiveShadow = true;
        group.add(antenna);
        
        // Antenna ball
        const ballGeometry = new THREE.SphereGeometry(0.1, 8, 6);
        const ballMaterial = new THREE.MeshStandardMaterial({ color: 0xffff66, emissive: 0xffcc00, emissiveIntensity: 0.6, roughness: 0.4, metalness: 0.2 });
        const antennaBall = new THREE.Mesh(ballGeometry, ballMaterial);
        antennaBall.position.set(0, this.options.size * 0.3 + this.options.antennaHeight, 0);
        antennaBall.castShadow = true;
        antennaBall.receiveShadow = true;
        group.add(antennaBall);
        
        // Camera
        const cameraGeometry = new THREE.CylinderGeometry(0.1, 0.15, 0.2, 8);
        const cameraMaterial = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8, metalness: 0.1 });
        const camera = new THREE.Mesh(cameraGeometry, cameraMaterial);
        camera.position.set(this.options.size * 0.4, this.options.size * 0.2, 0);
        camera.rotation.z = Math.PI / 2;
        camera.castShadow = true;
        camera.receiveShadow = true;
        group.add(camera);
        
        // Headlight
        const headlightGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.15, 8);
        const headlightMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.3, metalness: 0.8 });
        const headlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
        headlight.position.set(this.options.size * 0.4, this.options.size * 0.15, this.options.size * 0.5);
        headlight.rotation.z = Math.PI / 2;
        headlight.castShadow = true;
        headlight.receiveShadow = true;
        group.add(headlight);
        
        // Headlight bulb (emissive)
        const bulbGeometry = new THREE.SphereGeometry(0.08, 8, 6);
        const bulbMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xffffff, 
            emissive: 0xffffff, 
            emissiveIntensity: 1.0,
            roughness: 0.1, 
            metalness: 0.0 
        });
        const bulb = new THREE.Mesh(bulbGeometry, bulbMaterial);
        bulb.position.set(this.options.size * 0.4, this.options.size * 0.15, this.options.size * 0.58);
        bulb.castShadow = false;
        bulb.receiveShadow = false;
        group.add(bulb);
        
        // Add spotlight to the rover
        this.headlight = new THREE.SpotLight(0xffffff, 3, 30, Math.PI / 4, 0.3, 1);
        this.headlight.position.set(this.options.size * 0.4, this.options.size * 0.15, this.options.size * 0.6);
        this.headlight.target.position.set(this.options.size * 0.4, this.options.size * 0.15, this.options.size * 3);
        this.headlight.castShadow = true;
        this.headlight.shadow.mapSize.width = 512;
        this.headlight.shadow.mapSize.height = 512;
        this.headlight.shadow.camera.near = 0.1;
        this.headlight.shadow.camera.far = 30;
        this.headlight.shadow.camera.fov = 45;
        group.add(this.headlight);
        group.add(this.headlight.target);
        
        return group;
    }
    
    /**
     * Create individual wheel
     */
    private createWheel(): THREE.Mesh {
        const wheelGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.3, 12);
        const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.8, metalness: 0.1 });
        const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        wheel.castShadow = true;
        wheel.receiveShadow = true;
        return wheel;
    }
    
    /**
     * Set the terrain height function for positioning
     */
    setTerrainHeightFunction(heightFunction: (x: number, z: number) => number): void {
        this.terrainHeightFunction = heightFunction;
    }
    
    /**
     * Set rover position and update terrain height
     */
    setPosition(x: number, z: number): void {
        const height = this.terrainHeightFunction(x, z);
        this.state.position.set(x, height + this.options.size * 0.15, z);
        this.mesh.position.copy(this.state.position);
        
        // Update headlight position and direction
        if (this.headlight) {
            // Position headlight at rover front
            const forwardOffset = this.options.size * 0.6;
            this.headlight.position.set(
                x + Math.sin(this.state.rotation.y) * forwardOffset,
                this.state.position.y,
                z + Math.cos(this.state.rotation.y) * forwardOffset
            );
            
            // Set target position ahead of rover
            const forwardDistance = this.options.size * 3;
            this.headlight.target.position.set(
                x + Math.sin(this.state.rotation.y) * forwardDistance,
                this.state.position.y,
                z + Math.cos(this.state.rotation.y) * forwardDistance
            );
        }
    }
    
    /**
     * Set rover rotation
     */
    setRotation(y: number): void {
        this.state.rotation.y = y;
        this.mesh.rotation.y = y;
        
        // Update headlight position and direction to follow rover rotation
        if (this.headlight) {
            // Position headlight at rover front
            const forwardOffset = this.options.size * 0.6;
            this.headlight.position.set(
                this.state.position.x + Math.sin(y) * forwardOffset,
                this.state.position.y,
                this.state.position.z + Math.cos(y) * forwardOffset
            );
            
            // Set target position ahead of rover
            const forwardDistance = this.options.size * 3;
            this.headlight.target.position.set(
                this.state.position.x + Math.sin(y) * forwardDistance,
                this.state.position.y,
                this.state.position.z + Math.cos(y) * forwardDistance
            );
        }
    }
    
    /**
     * Set path for rover to follow
     */
    setPath(path: Point[]): void {
        this.path = [...path];
        this.state.currentPathIndex = 0;
        this.state.isMoving = false;
    }
    
    /**
     * Start rover movement along the path
     */
    startMovement(): void {
        if (this.path.length === 0) return;
        
        this.state.isMoving = true;
        this.state.currentPathIndex = 0;
        this.state.missionStartTime = performance.now();
        this.state.distanceTraveled = 0;
        
        // Position rover at start of path
        const startPoint = this.path[0];
        this.setPosition(startPoint.x, startPoint.y);
        this.state.lastPosition.copy(this.state.position);
    }
    
    /**
     * Stop rover movement
     */
    stopMovement(): void {
        this.state.isMoving = false;
    }
    
    /**
     * Update rover animation
     */
    update(deltaTime: number): void {
        if (!this.state.isMoving || this.path.length === 0) {
            this.state.currentSpeed = 0;
            return;
        }
        
        // Update animation mixer if it exists
        if (this.animationMixer) {
            this.animationMixer.update(deltaTime);
        }
        
        // Store previous position for distance calculation
        const prevPosition = this.state.lastPosition.clone();
        
        // Move along path
        if (this.state.currentPathIndex < this.path.length - 1) {
            const currentPoint = this.path[this.state.currentPathIndex];
            const nextPoint = this.path[this.state.currentPathIndex + 1];
            
            // Calculate direction to next point
            const direction = new THREE.Vector3(
                nextPoint.x - currentPoint.x,
                0,
                nextPoint.y - currentPoint.y
            ).normalize();
            
            // Update rotation to face movement direction
            const targetRotation = Math.atan2(direction.x, direction.z);
            this.setRotation(targetRotation);
            
            // Move towards next point
            const moveDistance = this.options.speed * deltaTime;
            const distanceToNext = Math.sqrt(
                Math.pow(nextPoint.x - this.state.position.x, 2) + 
                Math.pow(nextPoint.y - this.state.position.z, 2)
            );
            
            if (distanceToNext <= moveDistance) {
                // Reached next point
                this.state.currentPathIndex++;
                this.setPosition(nextPoint.x, nextPoint.y);
                
                // Consume energy based on distance and terrain difficulty
                const energyCost = this.calculateEnergyCost(currentPoint, nextPoint);
                this.state.energy = Math.max(0, this.state.energy - energyCost);
                
                if (this.state.energy <= 0) {
                    this.stopMovement();
                }
            } else {
                // Move towards next point
                const newX = this.state.position.x + direction.x * moveDistance;
                const newZ = this.state.position.z + direction.z * moveDistance;
                this.setPosition(newX, newZ);
            }
        } else {
            // Reached end of path
            this.state.isMoving = false;
            this.state.currentSpeed = 0;
            return;
        }
        
        // Update tracking metrics
        const distanceMoved = this.state.position.distanceTo(prevPosition);
        this.state.distanceTraveled += distanceMoved;
        this.state.currentSpeed = distanceMoved / deltaTime;
        this.state.lastPosition.copy(this.state.position);
        
        // Update wheel rotation for visual effect
        this.updateWheelRotation(deltaTime);
    }
    
    /**
     * Calculate energy cost for movement between two points
     */
    private calculateEnergyCost(from: Point, to: Point): number {
        const distance = Math.sqrt(
            Math.pow(to.x - from.x, 2) + Math.pow(to.y - from.y, 2)
        );
        
        // Base energy cost per unit distance
        let energyCost = distance * 0.1;
        
        // Additional cost for elevation changes
        const heightDiff = Math.abs(this.terrainHeightFunction(to.x, to.y) - this.terrainHeightFunction(from.x, from.y));
        energyCost += heightDiff * 0.5;
        
        return energyCost;
    }
    
    /**
     * Update wheel rotation for visual effect
     */
    private updateWheelRotation(deltaTime: number): void {
        if (!this.state.isMoving) return;
        
        const wheelRotationSpeed = this.options.speed * deltaTime * 2;
        
        this.mesh.children.forEach((child, index) => {
            // Skip body, panels, antenna, and camera
            if (index < 5) return;
            
            // Rotate wheels
            if (child instanceof THREE.Mesh && child.geometry instanceof THREE.CylinderGeometry) {
                child.rotation.x += wheelRotationSpeed;
            }
        });
    }
    
    /**
     * Get rover mesh for adding to scene
     */
    getMesh(): THREE.Group {
        return this.mesh;
    }
    
    /**
     * Get current rover state
     */
    getState(): RoverState {
        return { ...this.state };
    }
    
    /**
     * Get rover options
     */
    getOptions(): Required<RoverOptions> {
        return { ...this.options };
    }
    
    /**
     * Check if rover is moving
     */
    isMoving(): boolean {
        return this.state.isMoving;
    }
    
    /**
     * Get current path
     */
    getPath(): Point[] {
        return [...this.path];
    }
    
    /**
     * Reset rover energy
     */
    resetEnergy(): void {
        this.state.energy = this.state.maxEnergy;
    }
    
    /**
     * Set rover energy
     */
    setEnergy(energy: number): void {
        this.state.energy = Math.max(0, Math.min(this.state.maxEnergy, energy));
    }
    
    /**
     * Get energy percentage
     */
    getEnergyPercentage(): number {
        return (this.state.energy / this.state.maxEnergy) * 100;
    }
    
    /**
     * Create trail effect for rover movement
     */
    createTrail(): THREE.Line {
        const points: THREE.Vector3[] = [];
        
        for (const point of this.path) {
            const height = this.terrainHeightFunction(point.x, point.y);
            points.push(new THREE.Vector3(point.x, height + 0.1, point.y));
        }
        
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({ 
            color: 0x00ff00, 
            linewidth: 3,
            transparent: true,
            opacity: 0.8
        });
        
        return new THREE.Line(geometry, material);
    }
    
    /**
     * Update rover appearance based on energy level
     */
    updateAppearance(): void {
        const energyPercentage = this.getEnergyPercentage();
        
        // Change color based on energy level
        let color = this.options.color;
        if (energyPercentage < 25) {
            color = 0xff0000; // Red for low energy
        } else if (energyPercentage < 50) {
            color = 0xff8800; // Orange for medium energy
        }
        
        // Update body material color
        this.mesh.children.forEach((child, index) => {
            if (index === 0 && child instanceof THREE.Mesh) { // Main body
                const material = child.material as THREE.MeshLambertMaterial;
                material.color.setHex(color);
            }
        });
    }
    
    /**
     * Get mission time in seconds
     */
    getMissionTime(): number {
        if (this.state.missionStartTime === 0) return 0;
        return (performance.now() - this.state.missionStartTime) / 1000;
    }

    /**
     * Get distance traveled
     */
    getDistanceTraveled(): number {
        return this.state.distanceTraveled;
    }

    /**
     * Get current speed
     */
    getCurrentSpeed(): number {
        return this.state.currentSpeed;
    }

    /**
     * Get path efficiency (actual vs optimal distance)
     */
    getPathEfficiency(): number {
        if (this.path.length < 2) return 100;
        
        const startPoint = this.path[0];
        const endPoint = this.path[this.path.length - 1];
        const optimalDistance = Math.sqrt(
            Math.pow(endPoint.x - startPoint.x, 2) + Math.pow(endPoint.y - startPoint.y, 2)
        );
        
        if (optimalDistance === 0) return 100;
        return Math.min(100, (optimalDistance / Math.max(this.state.distanceTraveled, optimalDistance)) * 100);
    }

    /**
     * Get rover type
     */
    getRoverType(): string {
        return this.options.type;
    }

    /**
     * Toggle headlight on/off
     */
    toggleHeadlight(): void {
        if (this.headlight) {
            this.headlight.intensity = this.headlight.intensity > 0 ? 0 : 3;
        }
    }

    /**
     * Set headlight intensity
     */
    setHeadlightIntensity(intensity: number): void {
        if (this.headlight) {
            this.headlight.intensity = Math.max(0, Math.min(5, intensity));
        }
    }

    /**
     * Dispose of rover resources
     */
    dispose(): void {
        this.mesh.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                child.geometry.dispose();
                if (Array.isArray(child.material)) {
                    child.material.forEach(material => material.dispose());
                } else {
                    child.material.dispose();
                }
            }
        });
        
        if (this.animationMixer) {
            this.animationMixer.stopAllAction();
        }
    }
}
