import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { TerrainLoader } from './lib/terrainLoader.js';
import { TerrainMesh } from './lib/terrainMesh.js';
import { PathfindingEngine, Point } from './lib/pathfinding.js';
import { Rover } from './lib/rover.js';

class PlanetaryRoverSimulator {
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private renderer: THREE.WebGLRenderer;
    private controls: OrbitControls | null = null; // OrbitControls
    private terrainMesh: TerrainMesh | null = null;
    private pathfindingEngine: PathfindingEngine | null = null;
    private rover: Rover | null = null;
    private pathLine: THREE.Line | null = null;
    private startMarker: THREE.Mesh | null = null;
    private endMarker: THREE.Mesh | null = null;
    private raycaster: THREE.Raycaster;
    private mouse: THREE.Vector2;
    
    // State
    private startPoint: Point | null = null;
    private endPoint: Point | null = null;
    private isPathfinding = false;
    private isSlopeMapVisible = false;
    private animationId: number | null = null;
    private clock: THREE.Clock;
    private lastClickAt = 0;
    private composer: EffectComposer | null = null;
    private renderPass: RenderPass | null = null;
    private bloomPass: UnrealBloomPass | null = null;
    
    // UI Elements
    private loadingElement: HTMLElement;
    private statusElement: HTMLElement;
    private resetBtn: HTMLButtonElement;
    private toggleSlopeBtn: HTMLButtonElement;
    private findPathBtn: HTMLButtonElement;
    private animateRoverBtn: HTMLButtonElement;
    private clearPathBtn: HTMLButtonElement;
    // Terrain controls
    private mountainScaleInput: HTMLInputElement | null = null;
    private noiseScaleInput: HTMLInputElement | null = null;
    private octavesInput: HTMLInputElement | null = null;
    private terrainPresetSelect: HTMLSelectElement | null = null;
    private roverTypeSelect: HTMLSelectElement | null = null;
    private toggleCameraBtn: HTMLButtonElement | null = null;
    private dayNightBtn: HTMLButtonElement | null = null;
    private manualModeCheckbox: HTMLInputElement | null = null;
    
    // Dashboard state
    private isDayMode = true;
    private isRoverCameraVisible = true;
    private roverCamera: THREE.PerspectiveCamera | null = null;
    private roverCameraRenderer: THREE.WebGLRenderer | null = null;
    
    // Manual control state
    private pressedKeys: Set<string> = new Set();
    
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.clock = new THREE.Clock();
        
        this.initializeRenderer();
        this.initializeScene();
        this.initializeUI();
        this.initializeControls();
    }
    
    /**
     * Initialize the WebGL renderer
     */
    private initializeRenderer(): void {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        // Balanced sky color
        this.renderer.setClearColor(0x87ceeb);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 0.8;
        
        const app = document.getElementById('app');
        if (app) {
            app.appendChild(this.renderer.domElement);
        }
    }
    
    /**
     * Initialize the 3D scene with lighting
     */
    private initializeScene(): void {
        // Ambient light - reduced intensity
        const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
        this.scene.add(ambientLight);
        
        // Directional light (sun) - reduced intensity
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
        directionalLight.position.set(50, 50, 50);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 500;
        directionalLight.shadow.camera.left = -100;
        directionalLight.shadow.camera.right = 100;
        directionalLight.shadow.camera.top = 100;
        directionalLight.shadow.camera.bottom = -100;
        this.scene.add(directionalLight);
        
        // Atmosphere - lighter fog
        this.scene.fog = new THREE.FogExp2(0x87ceeb, 0.002);
        
        // Environment map (procedural hemi light feel) - reduced intensity
        const hemi = new THREE.HemisphereLight(0x87ceeb, 0x8b4513, 0.3);
        this.scene.add(hemi);
        
        // Position camera
        this.camera.position.set(40, 35, 40);
        this.camera.lookAt(0, 0, 0);
    }
    
    /**
     * Initialize UI elements
     */
    private initializeUI(): void {
        this.loadingElement = document.getElementById('loading')!;
        this.statusElement = document.getElementById('status')!;
        this.resetBtn = document.getElementById('reset-btn') as HTMLButtonElement;
        this.toggleSlopeBtn = document.getElementById('toggle-slope-btn') as HTMLButtonElement;
        this.findPathBtn = document.getElementById('find-path-btn') as HTMLButtonElement;
        this.animateRoverBtn = document.getElementById('animate-rover-btn') as HTMLButtonElement;
        this.clearPathBtn = document.getElementById('clear-path-btn') as HTMLButtonElement;
        this.mountainScaleInput = document.getElementById('mountain-scale') as HTMLInputElement;
        this.noiseScaleInput = document.getElementById('noise-scale') as HTMLInputElement;
        this.octavesInput = document.getElementById('octaves') as HTMLInputElement;
        this.terrainPresetSelect = document.getElementById('terrain-preset') as HTMLSelectElement;
        this.roverTypeSelect = document.getElementById('rover-type') as HTMLSelectElement;
        this.toggleCameraBtn = document.getElementById('toggle-camera-btn') as HTMLButtonElement;
        this.dayNightBtn = document.getElementById('day-night-btn') as HTMLButtonElement;
        this.manualModeCheckbox = document.getElementById('manual-mode') as HTMLInputElement;
    }
    
    /**
     * Initialize orbit controls
     */
    private initializeControls(): void {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.08;
        this.controls.target.set(0, 0, 0);
        this.controls.minDistance = 10;
        this.controls.maxDistance = 200;
        this.controls.maxPolarAngle = Math.PI * 0.49;
        this.controls.update();
    }
    
    /**
     * Setup event listeners
     */
    private setupEventListeners(): void {
        // UI button events
        this.resetBtn.addEventListener('click', () => this.loadTerrain());
        this.toggleSlopeBtn.addEventListener('click', () => this.toggleSlopeMap());
        this.findPathBtn.addEventListener('click', () => this.findPath());
        this.animateRoverBtn.addEventListener('click', () => this.animateRover());
        this.clearPathBtn.addEventListener('click', () => this.clearPath());
        // Terrain controls
        const reload = () => this.loadTerrain();
        this.mountainScaleInput?.addEventListener('input', reload);
        this.noiseScaleInput?.addEventListener('input', reload);
        this.octavesInput?.addEventListener('input', reload);
        this.terrainPresetSelect?.addEventListener('change', () => this.applyTerrainPreset());
        this.roverTypeSelect?.addEventListener('change', () => this.spawnRover());
        this.toggleCameraBtn?.addEventListener('click', () => this.toggleRoverCamera());
        this.dayNightBtn?.addEventListener('click', () => this.toggleDayNight());
        
        // Keyboard controls
        document.addEventListener('keydown', (event) => this.onKeyDown(event));
        document.addEventListener('keyup', (event) => this.onKeyUp(event));
        
        // Mouse click events for pathfinding
        this.renderer.domElement.addEventListener('click', (event) => this.onMouseClick(event));
        
        // Window resize
        window.addEventListener('resize', () => this.onWindowResize());
    }
    
    /**
     * Load terrain data
     */
    private async loadTerrain(): Promise<void> {
        this.updateStatus('Loading terrain...');
        this.loadingElement.style.display = 'block';
        
        try {
            // Dispose and remove previous terrain
            if (this.terrainMesh) {
                this.scene.remove(this.terrainMesh.getMesh());
                this.terrainMesh.dispose();
                this.terrainMesh = null;
            }
            this.clearPath();
            // Generate procedural terrain based on UI controls
            const noiseScaleVal = this.noiseScaleInput ? parseFloat(this.noiseScaleInput.value) : 0.05;
            const octavesVal = this.octavesInput ? parseInt(this.octavesInput.value, 10) : 6;
            const mountainHeightVal = this.mountainScaleInput ? parseFloat(this.mountainScaleInput.value) : 20;
            const heightData = TerrainLoader.generateProceduralTerrain(128, 128, {
                noiseScale: noiseScaleVal,
                octaves: octavesVal,
                persistence: 0.65, // Slightly more persistent for smoother transitions
                lacunarity: 2.1,   // Slightly higher for more detail variation
                normalize: true,
                scale: 12, // Better horizontal scale for Perlin noise
                offset: 0
            });
            
            // Create terrain mesh - use mountainHeightVal for vertical scaling
            this.terrainMesh = new TerrainMesh(heightData, {
                scale: 2.0,
                heightScale: mountainHeightVal, // This controls terrain height
                colorScheme: 'mars'
            });
            
            console.log('Terrain mesh created:', this.terrainMesh.getMesh());
            console.log('Height data:', heightData);
            
            this.scene.add(this.terrainMesh.getMesh());
            
            // Auto-frame camera to terrain bounds
            this.fitCameraToTerrain();
            
            // Initialize pathfinding engine
            this.pathfindingEngine = new PathfindingEngine(heightData, {
                maxSlope: 30,
                diagonalMovement: true,
                slopeWeight: 2.0,
                distanceWeight: 1.0
            });
            
            // Clear existing markers (path already cleared)
            this.clearMarkers();
            
            this.updateStatus('Terrain loaded. Click to set start and end points.');
            this.findPathBtn.disabled = false;
            
            // Auto-spawn rover and place at center top
            this.spawnRover();
            if (this.rover && this.terrainMesh) {
                const center = this.terrainMesh.heightToWorldCoords(Math.floor(heightData.width/2), Math.floor(heightData.height/2));
                this.rover.setPosition(center.x, center.z);
            }
            
        } catch (error) {
            this.updateStatus(`Error loading terrain: ${error}`);
        } finally {
            this.loadingElement.style.display = 'none';
            
            // Initialize postprocessing once renderer is ready
            this.setupPostprocessing();
        }
    }
    
    /**
     * Handle mouse clicks for pathfinding
     */
    private onMouseClick(event: MouseEvent): void {
        if (this.isPathfinding || !this.terrainMesh) return;
        const now = performance.now();
        if (now - this.lastClickAt < 150) return; // debounce rapid double clicks
        this.lastClickAt = now;
        
        // Calculate mouse position in normalized device coordinates
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        // Update the picking ray with the camera and mouse position
        this.raycaster.setFromCamera(this.mouse, this.camera);
        
        // Calculate objects intersecting the picking ray
        const intersects = this.raycaster.intersectObject(this.terrainMesh.getMesh());
        
        if (intersects.length > 0) {
            const point = intersects[0].point;
            const heightCoords = this.terrainMesh.worldToHeightCoords(point.x, point.z);
            
            // Clamp coordinates to valid range
            const x = Math.max(0, Math.min(this.terrainMesh.getHeightData().width - 1, Math.round(heightCoords.x)));
            const y = Math.max(0, Math.min(this.terrainMesh.getHeightData().height - 1, Math.round(heightCoords.y)));
            
            if (!this.startPoint) {
                // Set start point
                this.startPoint = { x, y };
                this.createMarker(point, 0x00ff00, 'start');
                this.updateStatus('Start point set! Click to set end point.');
            } else if (!this.endPoint) {
                // Set end point
                // Ignore if same as start
                if (this.startPoint.x === x && this.startPoint.y === y) return;
                this.endPoint = { x, y };
                this.createMarker(point, 0xff0000, 'end');
                this.updateStatus('End point set! Click "Find Path" to calculate route.');
                this.findPathBtn.disabled = false;
            } else {
                // Reset points
                if (this.startPoint.x === x && this.startPoint.y === y) return; // same cell, ignore
                this.startPoint = { x, y };
                this.endPoint = null;
                this.clearMarkers();
                this.clearPath();
                this.createMarker(point, 0x00ff00, 'start');
                this.updateStatus('Start point reset! Click to set new end point.');
            }
        }
    }
    
    /**
     * Create visual marker for start/end points
     */
    private createMarker(position: THREE.Vector3, color: number, type: 'start' | 'end'): void {
        // Remove previous marker of the same type if it exists
        if (type === 'start' && this.startMarker) {
            this.scene.remove(this.startMarker);
            this.startMarker.geometry.dispose();
            (this.startMarker.material as THREE.Material).dispose();
            this.startMarker = null;
        }
        if (type === 'end' && this.endMarker) {
            this.scene.remove(this.endMarker);
            this.endMarker.geometry.dispose();
            (this.endMarker.material as THREE.Material).dispose();
            this.endMarker = null;
        }

        const geometry = new THREE.ConeGeometry(1, 3, 8);
        const material = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.2, roughness: 0.6, metalness: 0.1 });
        const marker = new THREE.Mesh(geometry, material);
        
        marker.position.copy(position);
        marker.position.y += 2;
        marker.castShadow = true;
        
        if (type === 'start') {
            this.startMarker = marker;
        } else {
            this.endMarker = marker;
        }
        
        this.scene.add(marker);
    }
    
    /**
     * Clear all markers
     */
    private clearMarkers(): void {
        if (this.startMarker) {
            this.scene.remove(this.startMarker);
            this.startMarker.geometry.dispose();
            (this.startMarker.material as THREE.Material).dispose();
            this.startMarker = null;
        }
        
        if (this.endMarker) {
            this.scene.remove(this.endMarker);
            this.endMarker.geometry.dispose();
            (this.endMarker.material as THREE.Material).dispose();
            this.endMarker = null;
        }
    }
    
    /**
     * Spawn rover
     */
    private spawnRover(): void {
        if (this.rover) {
            this.scene.remove(this.rover.getMesh());
            this.rover.dispose();
        }
        
        const roverType = this.roverTypeSelect?.value as 'standard' | 'scout' | 'heavy' | 'scientific' || 'standard';
        
        this.rover = new Rover({
            type: roverType
        });
        
        // Set terrain height function
        this.rover.setTerrainHeightFunction((x, z) => {
            if (this.terrainMesh) {
                return this.terrainMesh.getHeightAtWorldCoords(x, z);
            }
            return 0;
        });
        
        this.scene.add(this.rover.getMesh());
        // Ensure rover is visible above fog and lit
        this.rover.getMesh().traverse((obj) => {
            if ((obj as any).isMesh) {
                (obj as THREE.Mesh).castShadow = true;
                (obj as THREE.Mesh).receiveShadow = false;
            }
        });
        
        // Initialize rover camera and make it visible by default
        this.setupRoverCamera();
        const cameraDiv = document.getElementById('rover-camera');
        if (cameraDiv) {
            cameraDiv.style.display = 'block';
        }
        
        this.updateStatus('Rover spawned! Set path points to begin pathfinding.');
    }
    
    /**
     * Find path using A* algorithm
     */
    private async findPath(): Promise<void> {
        if (!this.startPoint || !this.endPoint || !this.pathfindingEngine) return;
        
        this.isPathfinding = true;
        this.findPathBtn.disabled = true;
        this.updateStatus('Finding optimal path...');
        
        try {
            const result = this.pathfindingEngine.findPath(this.startPoint, this.endPoint);
            
            if (result.success) {
                this.visualizePath(result.path);
                this.updateStatus(`Path found! Cost: ${result.cost.toFixed(2)}, Nodes explored: ${result.nodesExplored}, Time: ${result.executionTime.toFixed(2)}ms`);
                this.animateRoverBtn.disabled = false;
            } else {
                this.updateStatus('No valid path found. Try different start/end points.');
            }
        } catch (error) {
            this.updateStatus(`Pathfinding error: ${error}`);
        } finally {
            this.isPathfinding = false;
            this.findPathBtn.disabled = false;
        }
    }
    
    /**
     * Visualize the computed path
     */
    private visualizePath(path: Point[]): void {
        if (!this.terrainMesh) return;
        
        // Remove existing path line
        if (this.pathLine) {
            this.scene.remove(this.pathLine);
            this.pathLine.geometry.dispose();
            (this.pathLine.material as THREE.Material).dispose();
        }
        
        // Create new path line
        const points: THREE.Vector3[] = [];
        
        // Build both the 3D line and a world-space path for the rover
        const worldPath: Point[] = [];
        for (const point of path) {
            const worldCoords = this.terrainMesh.heightToWorldCoords(point.x, point.y);
            const height = this.terrainMesh.getHeightAtWorldCoords(worldCoords.x, worldCoords.z);
            points.push(new THREE.Vector3(worldCoords.x, height + 0.5, worldCoords.z));
            worldPath.push({ x: worldCoords.x, y: worldCoords.z });
        }
        
        // Render as glowing tube for premium visual
        const curve = new THREE.CatmullRomCurve3(points);
        const tubularSegments = Math.max(32, path.length * 4);
        const radius = 0.15;
        const radialSegments = 8;
        const closed = false;
        const tubeGeo = new THREE.TubeGeometry(curve, tubularSegments, radius, radialSegments, closed);
        const tubeMat = new THREE.MeshStandardMaterial({ color: 0x00ff88, emissive: 0x00ff88, emissiveIntensity: 0.7, roughness: 0.4, metalness: 0.2, transparent: true, opacity: 0.95 });
        
        this.pathLine = new THREE.Mesh(tubeGeo, tubeMat) as unknown as THREE.Line;
        (this.pathLine as unknown as THREE.Mesh).castShadow = false;
        (this.pathLine as unknown as THREE.Mesh).receiveShadow = false;
        this.scene.add(this.pathLine);
        
        // Set rover path if rover exists (use world-space coordinates)
        if (this.rover) {
            this.rover.setPath(worldPath);
        }
    }
    
    /**
     * Animate rover along the path
     */
    private animateRover(): void {
        if (!this.rover || this.rover.getPath().length === 0) return;
        
        this.rover.startMovement();
        this.updateStatus('Rover is moving along the path!');
        this.animateRoverBtn.disabled = true;
        
        // Start animation loop if not already running
        if (!this.animationId) {
            this.animate();
        }
    }
    
    /**
     * Toggle slope map visualization
     */
    private toggleSlopeMap(): void {
        if (!this.terrainMesh || !this.pathfindingEngine) return;
        
        this.isSlopeMapVisible = !this.isSlopeMapVisible;
        
        if (this.isSlopeMapVisible) {
            this.terrainMesh.updateMaterialOptions({ colorScheme: 'slope' });
            this.updateStatus('Slope map enabled - Green: flat, Red: steep');
            const legend = document.getElementById('slope-legend');
            if (legend) legend.style.display = 'block';
        } else {
            this.terrainMesh.updateMaterialOptions({ colorScheme: 'mars' });
            this.updateStatus('Slope map disabled - Mars terrain colors restored');
            const legend = document.getElementById('slope-legend');
            if (legend) legend.style.display = 'none';
        }
    }
    
    /**
     * Clear current path
     */
    private clearPath(): void {
        if (this.pathLine) {
            this.scene.remove(this.pathLine);
            this.pathLine.geometry.dispose();
            (this.pathLine.material as THREE.Material).dispose();
            this.pathLine = null;
        }
        
        if (this.rover) {
            this.rover.stopMovement();
            this.rover.setPath([]);
        }
        
        this.startPoint = null;
        this.endPoint = null;
        this.clearMarkers();
        
        this.findPathBtn.disabled = true;
        this.animateRoverBtn.disabled = true;
        this.updateStatus('Path cleared. Click to set new start and end points.');
    }
    
    /**
     * Update manual rover movement based on pressed keys
     */
    private updateManualMovement(deltaTime: number): void {
        if (!this.manualModeCheckbox?.checked || !this.rover || this.pressedKeys.size === 0) return;

        const moveSpeed = 8.0 * deltaTime; // Units per second
        const turnSpeed = 2.0 * deltaTime; // Radians per second
        const currentPos = this.rover.getState().position;
        const currentRot = this.rover.getState().rotation.y;

        // Handle movement
        if (this.pressedKeys.has('w')) {
            const forwardX = currentPos.x + Math.sin(currentRot) * moveSpeed;
            const forwardZ = currentPos.z + Math.cos(currentRot) * moveSpeed;
            this.rover.setPosition(forwardX, forwardZ);
        }
        
        if (this.pressedKeys.has('s')) {
            const backwardX = currentPos.x - Math.sin(currentRot) * moveSpeed;
            const backwardZ = currentPos.z - Math.cos(currentRot) * moveSpeed;
            this.rover.setPosition(backwardX, backwardZ);
        }

        // Handle rotation
        if (this.pressedKeys.has('a')) {
            this.rover.setRotation(currentRot - turnSpeed);
        }
        
        if (this.pressedKeys.has('d')) {
            this.rover.setRotation(currentRot + turnSpeed);
        }
    }

    /**
     * Animation loop
     */
    private animate(): void {
        this.animationId = requestAnimationFrame(() => this.animate());
        const delta = this.clock.getDelta();
        
        if (this.controls) this.controls.update();
        
        // Update rover
        if (this.rover) {
            // Handle manual movement
            this.updateManualMovement(delta);
            
            if (this.rover.isMoving()) {
                this.rover.update(delta);
                
                // Check if rover reached destination
                if (!this.rover.isMoving()) {
                    this.animateRoverBtn.disabled = false;
                    this.updateStatus('Rover reached destination!');
                }
            }
            
            // Update dashboard
            this.updateDashboard();
            
            // Update rover camera if visible
            if (this.isRoverCameraVisible && this.roverCamera && this.roverCameraRenderer) {
                this.updateRoverCamera();
            }
        }
        
        if (this.composer) {
            this.composer.render(delta);
        } else {
            this.renderer.render(this.scene, this.camera);
        }
    }
    
    /**
     * Update status message
     */
    private updateStatus(message: string): void {
        this.statusElement.textContent = message;
    }
    
    /**
     * Handle window resize
     */
    private onWindowResize(): void {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        if (this.composer) this.composer.setSize(window.innerWidth, window.innerHeight);
    }
    
    /**
     * Start the simulation
     */
    public start(): void {
        this.animate();
    }
    
    /**
     * Dispose of resources
     */
    public dispose(): void {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        if (this.terrainMesh) {
            this.terrainMesh.dispose();
        }
        
        if (this.rover) {
            this.rover.dispose();
        }
        
        if (this.pathLine) {
            this.pathLine.geometry.dispose();
            (this.pathLine.material as THREE.Material).dispose();
        }
        
        this.clearMarkers();
        
        this.renderer.dispose();
    }

    /**
     * Initialize postprocessing pipeline (bloom)
     */
    private setupPostprocessing(): void {
        this.composer = new EffectComposer(this.renderer);
        this.renderPass = new RenderPass(this.scene, this.camera);
        this.composer.addPass(this.renderPass);
        
        const bloomStrength = 0.3;
        const bloomRadius = 0.4;
        const bloomThreshold = 0.8;
        this.bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), bloomStrength, bloomRadius, bloomThreshold);
        this.composer.addPass(this.bloomPass);
        
        this.composer.setSize(window.innerWidth, window.innerHeight);
    }

    /**
     * Fit camera target and distance to show entire terrain nicely
     */
    private fitCameraToTerrain(): void {
        if (!this.terrainMesh || !this.controls) return;
        const mesh = this.terrainMesh.getMesh();
        mesh.geometry.computeBoundingSphere();
        const bs = mesh.geometry.boundingSphere!;
        this.controls.target.copy(bs.center);
        const dist = bs.radius * 2.2;
        const dir = new THREE.Vector3(1, 0.8, 1).normalize();
        this.camera.position.copy(bs.center.clone().add(dir.multiplyScalar(dist)));
        this.camera.lookAt(bs.center);
        this.controls.update();
    }

    /**
     * Apply terrain preset settings
     */
    private applyTerrainPreset(): void {
        if (!this.terrainPresetSelect) return;
        
        const preset = this.terrainPresetSelect.value;
        
        switch (preset) {
            case 'mars':
                // Mars-like plains with moderate features
                if (this.mountainScaleInput) this.mountainScaleInput.value = '15';
                if (this.noiseScaleInput) this.noiseScaleInput.value = '0.08';
                if (this.octavesInput) this.octavesInput.value = '4';
                break;
                
            case 'mountains':
                // Tall rocky mountains with sharp features
                if (this.mountainScaleInput) this.mountainScaleInput.value = '60';
                if (this.noiseScaleInput) this.noiseScaleInput.value = '0.03';
                if (this.octavesInput) this.octavesInput.value = '7';
                break;
                
            case 'hills':
                // Gentle rolling hills
                if (this.mountainScaleInput) this.mountainScaleInput.value = '25';
                if (this.noiseScaleInput) this.noiseScaleInput.value = '0.12';
                if (this.octavesInput) this.octavesInput.value = '3';
                break;
                
            case 'canyon':
                // Deep canyon-like features
                if (this.mountainScaleInput) this.mountainScaleInput.value = '45';
                if (this.noiseScaleInput) this.noiseScaleInput.value = '0.06';
                if (this.octavesInput) this.octavesInput.value = '6';
                break;
                
            case 'custom':
                // Don't change values for custom
                return;
        }
        
        // Regenerate terrain with new preset
        this.loadTerrain();
    }

    /**
     * Update mission dashboard
     */
    private updateDashboard(): void {
        if (!this.rover) return;

        // Mission time
        const missionTime = this.rover.getMissionTime();
        const minutes = Math.floor(missionTime / 60);
        const seconds = Math.floor(missionTime % 60);
        const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        this.updateElement('mission-time', timeStr);

        // Rover status
        const status = this.rover.isMoving() ? 'Moving' : 'Standby';
        this.updateElement('rover-status', status);

        // Energy system
        const energyPercent = this.rover.getEnergyPercentage();
        this.updateElement('energy-value', `${energyPercent.toFixed(1)}%`);
        const energyFill = document.getElementById('energy-fill');
        if (energyFill) energyFill.style.width = `${energyPercent}%`;

        // Solar input (varies with day/night)
        const solarInput = this.isDayMode ? '+2.5 W' : '+0.1 W';
        this.updateElement('solar-input', solarInput);

        // Navigation
        this.updateElement('distance-traveled', `${this.rover.getDistanceTraveled().toFixed(1)}m`);
        this.updateElement('current-speed', `${this.rover.getCurrentSpeed().toFixed(1)} m/s`);
        
        // Current elevation
        const elevation = this.rover.getState().position.y;
        this.updateElement('current-elevation', `${elevation.toFixed(1)}m`);

        // Path analysis
        const efficiency = this.rover.getPathEfficiency();
        this.updateElement('path-efficiency', `${efficiency.toFixed(1)}%`);
        const efficiencyFill = document.getElementById('efficiency-fill');
        if (efficiencyFill) efficiencyFill.style.width = `${efficiency}%`;

        // Waypoints
        const path = this.rover.getPath();
        const currentIndex = this.rover.getState().currentPathIndex;
        this.updateElement('waypoints-remaining', `${currentIndex}/${path.length}`);
    }

    /**
     * Toggle rover camera view
     */
    private toggleRoverCamera(): void {
        this.isRoverCameraVisible = !this.isRoverCameraVisible;
        const cameraDiv = document.getElementById('rover-camera');
        const toggleBtn = this.toggleCameraBtn;
        
        if (this.isRoverCameraVisible) {
            if (cameraDiv) cameraDiv.style.display = 'block';
            if (toggleBtn) toggleBtn.textContent = 'Rover Cam (ON)';
            this.setupRoverCamera();
        } else {
            if (cameraDiv) cameraDiv.style.display = 'none';
            if (toggleBtn) toggleBtn.textContent = 'Rover Cam (OFF)';
        }
    }

    /**
     * Setup rover camera
     */
    private setupRoverCamera(): void {
        if (!this.rover) return;

        this.roverCamera = new THREE.PerspectiveCamera(60, 200/150, 0.1, 100);
        
        const canvas = document.getElementById('rover-camera-canvas') as HTMLCanvasElement;
        if (!canvas) return;

        this.roverCameraRenderer = new THREE.WebGLRenderer({ canvas, antialias: true });
        this.roverCameraRenderer.setSize(200, 150);
        this.roverCameraRenderer.setClearColor(this.renderer.getClearColor());
    }

    /**
     * Update rover camera position and render
     */
    private updateRoverCamera(): void {
        if (!this.rover || !this.roverCamera || !this.roverCameraRenderer) return;

        const roverPos = this.rover.getState().position;
        const roverRot = this.rover.getState().rotation;
        
        // Position camera at rover location, slightly elevated
        this.roverCamera.position.copy(roverPos);
        this.roverCamera.position.y += 1.5;
        
        // Look in the direction the rover is facing
        const lookDirection = new THREE.Vector3(
            Math.sin(roverRot.y),
            -0.1,
            Math.cos(roverRot.y)
        );
        this.roverCamera.lookAt(roverPos.clone().add(lookDirection.multiplyScalar(10)));

        this.roverCameraRenderer.render(this.scene, this.roverCamera);
    }

    /**
     * Toggle day/night mode
     */
    private toggleDayNight(): void {
        this.isDayMode = !this.isDayMode;
        
        if (this.isDayMode) {
            // Day mode
            this.renderer.setClearColor(0x87ceeb);
            this.scene.fog = new THREE.FogExp2(0x87ceeb, 0.002);
            this.scene.traverse((obj) => {
                if (obj instanceof THREE.DirectionalLight) {
                    obj.intensity = 1.0;
                }
                if (obj instanceof THREE.AmbientLight) {
                    obj.intensity = 0.4;
                }
                if (obj instanceof THREE.HemisphereLight) {
                    obj.intensity = 0.3;
                }
            });
        } else {
            // Night mode
            this.renderer.setClearColor(0x0a0a1a);
            this.scene.fog = new THREE.FogExp2(0x0a0a1a, 0.005);
            this.scene.traverse((obj) => {
                if (obj instanceof THREE.DirectionalLight) {
                    obj.intensity = 0.3;
                    obj.color.setHex(0x9999ff);
                }
                if (obj instanceof THREE.AmbientLight) {
                    obj.intensity = 0.1;
                }
                if (obj instanceof THREE.HemisphereLight) {
                    obj.intensity = 0.1;
                }
            });
        }
    }

    /**
     * Handle keyboard input
     */
    private onKeyDown(event: KeyboardEvent): void {
        const key = event.key.toLowerCase();
        this.pressedKeys.add(key);

        // Handle special keys that don't need manual mode
        switch (key) {
            case 'c':
                this.toggleRoverCamera();
                return;
        }

        // Manual mode controls
        if (!this.manualModeCheckbox?.checked || !this.rover) return;

        switch (key) {
            case 'w':
            case 's':
            case 'a':
            case 'd':
                event.preventDefault();
                break;
            case ' ':
                event.preventDefault();
                this.rover.stopMovement();
                break;
        }
    }

    /**
     * Handle key up events
     */
    private onKeyUp(event: KeyboardEvent): void {
        const key = event.key.toLowerCase();
        this.pressedKeys.delete(key);
    }

    /**
     * Helper method to update DOM elements
     */
    private updateElement(id: string, value: string): void {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    }

    /**
     * Start the simulation
     */
    public start(): void {
        this.setupEventListeners();
        this.loadTerrain();
        this.animate();
    }

    /**
     * Dispose of resources
     */
    public dispose(): void {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        if (this.rover) {
            this.rover.dispose();
        }
        
        if (this.terrainMesh) {
            this.terrainMesh.dispose();
        }
        
        this.renderer.dispose();
    }
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const simulator = new PlanetaryRoverSimulator();
    simulator.start();
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        simulator.dispose();
    });
});
