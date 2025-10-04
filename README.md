# 🚀 Planetary Rover Pathfinding Simulator

A cutting-edge browser-based 3D simulation that combines advanced pathfinding algorithms with realistic planetary terrain generation to demonstrate autonomous rover navigation capabilities for the SIH 2025 Hackathon.

## 🌟 Project Overview

This simulator showcases the future of planetary exploration through an interactive 3D environment where users can:

- **Generate realistic planetary terrain** using Perlin noise algorithms
- **Plan optimal rover paths** using A* pathfinding with slope analysis
- **Monitor mission operations** through a real-time dashboard
- **Experience different rover types** with unique capabilities
- **Visualize terrain difficulty** through slope heatmaps and 3D path visualization
- **Control rovers manually** with WASD keyboard controls
- **View from rover perspective** with first-person camera system

## 🎯 Key Features

### 🏔️ **Advanced Terrain Generation**
- **Perlin Noise Algorithm**: Creates realistic, natural-looking terrain with multiple octaves
- **Terrain Presets**: Pre-configured landscapes (Mars Plains, Rocky Mountains, Rolling Hills, Canyon Lands)
- **Custom Controls**: Adjustable mountain height, feature size, and terrain complexity
- **Dynamic Heightmaps**: Real-time terrain generation with smooth elevation changes

### 🗺️ **Intelligent Pathfinding**
- **A\* Algorithm**: Optimized pathfinding with binary heap for performance
- **Slope Analysis**: Real-time terrain difficulty assessment
- **Multi-factor Cost**: Considers distance, elevation changes, and slope constraints
- **Rover Constraints**: Different rover types have varying maximum slope capabilities

### 🚗 **Multiple Rover Types**
- **Standard Rover**: Balanced capabilities for general exploration
- **Scout Rover**: High mobility, low energy consumption
- **Heavy Rover**: High payload capacity, limited slope navigation
- **Scientific Rover**: Advanced sensors, moderate mobility

### 📊 **Mission Control Dashboard**
- **Real-time Metrics**: Energy levels, distance traveled, current speed
- **Mission Time**: Elapsed time tracking
- **Path Efficiency**: Optimization analysis
- **Solar Input**: Dynamic energy generation simulation
- **Waypoint Management**: Multi-point mission planning

### 🎥 **Advanced Visualization**
- **Rover Camera**: First-person view from rover perspective
- **3D Path Visualization**: Glowing tube geometry with emissive materials
- **Slope Heatmaps**: Color-coded terrain difficulty overlay
- **Day/Night Cycle**: Dynamic lighting with solar panel effects
- **Post-processing Effects**: Bloom, tone mapping, and atmospheric fog

### 🎮 **Interactive Controls**
- **Terrain Customization**: Real-time parameter adjustment
- **Mouse Navigation**: Click to set start/end points
- **Manual Rover Control**: Full WASD keyboard control with smooth movement
- **Camera Controls**: Orbit, zoom, and pan with smooth damping
- **UI Panels**: Collapsible, responsive interface elements
- **Dual Control Modes**: Switch between automatic pathfinding and manual driving

## 👥 Team Details

**Team Name:** NEELKANTVARNI

**Team Leader:** [@Nivesh12345](https://github.com/Nivesh12345)

**Team Members:**

- **Manoj Singh Rawat** - 2023UCA1876 - [@manojCodes77](https://github.com/manojCodes77)
- **Nivesh Kumar** - 2023UCA1880 - [@Nivesh12345](https://github.com/Nivesh12345)
- **Sambhav Jha** - 2023UCA1868 - [@Codechefskj](https://github.com/Codechefskj)
- **Satvik Gupta** - 2024UEA6538 - [@BlacckMangoo](https://github.com/BlacckMangoo)
- **MD Sahil Hussain** - 2023UCA1873 - [@PhantomOO7](https://github.com/PhantomOO7)
- **Preeti Kumari** - 2023UCA1825 - [@preeti9311](https://github.com/preeti9311)

## 🛠️ Technology Stack

### **Frontend Technologies**
- **TypeScript**: Type-safe development with modern ES6+ features
- **Three.js**: WebGL-based 3D graphics and scene management
- **Vite**: Fast development server and build tool
- **CSS3**: Modern styling with backdrop filters and animations

### **Core Algorithms**
- **A\* Pathfinding**: Optimized pathfinding with binary heap implementation
- **Perlin Noise**: Procedural terrain generation with multiple octaves
- **Slope Analysis**: Real-time terrain difficulty assessment
- **3D Mathematics**: Vector operations, transformations, and collision detection

### **3D Graphics Features**
- **WebGL Rendering**: Hardware-accelerated 3D graphics
- **Post-processing**: Bloom effects, tone mapping, and atmospheric fog
- **Dynamic Lighting**: Directional, ambient, and spot lighting systems
- **Shadow Mapping**: Real-time shadow rendering
- **Material System**: PBR (Physically Based Rendering) materials

## 🚀 Getting Started

### **Prerequisites**
- Node.js (v16 or higher)
- npm or yarn package manager
- Modern web browser with WebGL support

### **Installation**
```bash
# Clone the repository
git clone https://github.com/manojCodes77/SIH_2025_NEELKANTVARNI.git
cd SIH_2025_NEELKANTVARNI/code

# Install dependencies
npm install

# Start development server
npm run dev

# Open browser to http://localhost:5173
```

### **Build for Production**
```bash
npm run build
npm run preview
```

## 🎮 How to Use

### **Basic Navigation**
1. **Set Waypoints**: Click on terrain to place start (green) and end (red) markers
2. **Find Path**: Click "Find Path" to compute optimal route using A\* algorithm
3. **Animate Rover**: Watch the rover follow the calculated path
4. **Monitor Mission**: Use the dashboard to track rover status and performance

### **Terrain Customization**
- **Presets**: Select from pre-configured terrain types (Mars, Mountains, Hills, Canyon)
- **Mountain Height**: Adjust vertical scaling (5-80)
- **Feature Size**: Control terrain detail level (0.01-0.20)
- **Octaves**: Set noise complexity (1-8)

### **Rover Selection**
- **Standard**: Balanced exploration capabilities
- **Scout**: High mobility, energy efficient
- **Heavy**: High payload, limited slope navigation
- **Scientific**: Advanced sensors, moderate mobility

### **Advanced Features**
- **Toggle Slope Map**: Visualize terrain difficulty with color-coded overlay
- **Rover Camera**: First-person view from rover perspective
- **Day/Night Cycle**: Dynamic lighting simulation
- **Manual Control**: Enable manual mode and use WASD keys for direct rover control
- **Continuous Movement**: Smooth, frame-rate independent rover movement

### **Manual Control System**
- **WASD Movement**: 
  - **W**: Move forward in rover's current direction
  - **S**: Move backward 
  - **A**: Turn left (counter-clockwise)
  - **D**: Turn right (clockwise)
  - **Space**: Stop rover movement
  - **C**: Toggle rover camera
- **Smooth Controls**: Frame-rate independent movement
- **Terrain Following**: Rover automatically adjusts to terrain height

## 📊 Project Links

- **SIH Presentation:** [Final SIH Presentation](https://github.com/manojCodes77/SIH_2025_NEELKANTVARNI/blob/main/files/internal_ppt_NEELKANTVARNI.pdf)
- **Video Demonstration:** [Watch Video](https://youtu.be/VXD2kN4Z1N4)
- **Live Deployment:** [View Deployment](https://sih-2025-neelkantvarni.vercel.app/)
- **Source Code:** [GitHub Repository](https://github.com/manojCodes77/SIH_2025_NEELKANTVARNI)

## 🏗️ Technical Architecture

### **Core Systems**

#### **Terrain Generation (`terrainLoader.ts`)**
- Perlin noise implementation with permutation tables
- Multi-octave terrain generation
- Configurable noise parameters (scale, persistence, lacunarity)
- Heightmap data processing and normalization

#### **3D Visualization (`terrainMesh.ts`)**
- Three.js geometry generation from heightmaps
- Vertex color mapping for height and slope visualization
- Material system with PBR (Physically Based Rendering)
- Dynamic normal calculation for realistic lighting

#### **Pathfinding Engine (`pathfinding.ts`)**
- A\* algorithm with binary heap optimization
- Grid-based navigation with slope constraints
- Cost calculation: distance + slope penalty
- Heuristic: Euclidean distance to goal

#### **Rover Simulation (`rover.ts`)**
- 3D rover model with detailed components
- Physics-based movement and animation
- Energy consumption modeling
- Multiple rover type configurations

#### **Mission Control (`main.ts`)**
- Scene management and rendering loop
- UI event handling and state management
- Post-processing pipeline (bloom, tone mapping)
- Real-time dashboard updates
- Manual control system with continuous movement
- Rover camera management and rendering

## 🏆 Hackathon Demo Features

### **Perfect for Judging**
- **Visual Impact**: Stunning 3D graphics with post-processing effects
- **Technical Depth**: Advanced algorithms (A\*, Perlin noise, 3D math)
- **User Experience**: Intuitive interface with real-time feedback
- **Innovation**: Combines pathfinding, terrain generation, and rover simulation
- **Scalability**: Modular architecture ready for additional features

### **Key Differentiators**
- **Real-time Terrain Generation**: Dynamic, configurable planetary landscapes
- **Intelligent Pathfinding**: Slope-aware navigation with rover constraints
- **Mission Control Interface**: Professional-grade dashboard
- **Multiple Rover Types**: Demonstrates versatility in rover design
- **Advanced Visualization**: 3D graphics with modern post-processing
- **Dual Control System**: Both automatic pathfinding and manual driving capabilities
- **Real-time Rover Camera**: Live first-person view for immersive experience

## 📊 Performance Metrics

- **Terrain Generation**: 60 FPS for 128x128 heightmaps
- **Pathfinding**: Sub-second computation for complex routes
- **Rendering**: Smooth 60 FPS with post-processing effects
- **Memory Usage**: Optimized for browser environments
- **Load Time**: Fast startup with progressive loading

## 🔮 Future Enhancements

### **Planned Features**
- **Dynamic Obstacles**: Click to place/remove obstacles with real-time replanning
- **Particle Effects**: Dust clouds, landing thrusters, environmental effects
- **Analytics Panel**: Real-time graphs and performance metrics
- **D* Lite Algorithm**: Dynamic pathfinding for changing environments
- **Multi-rover Coordination**: Swarm intelligence and collision avoidance
- **Real Mars Data**: Integration with NASA DEM datasets
- **Voice Commands**: Natural language rover control
- **Mission Export**: Data export for real rover applications

### **Technical Roadmap**
- **WebGL 2.0**: Enhanced graphics capabilities
- **Web Workers**: Multi-threaded pathfinding computation
- **Progressive Web App**: Offline functionality and mobile optimization
- **Machine Learning**: AI-powered terrain analysis and path optimization

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines for:
- Code style and standards
- Testing requirements
- Pull request process
- Feature request procedures

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Three.js Community**: For the excellent 3D graphics library
- **NASA**: For inspiration and planetary exploration data
- **Open Source Contributors**: For the tools and libraries that made this possible

---

**Built with ❤️ for the future of planetary exploration**

*Experience the next generation of autonomous rover navigation in your browser!*
