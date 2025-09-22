# 🚀 Planetary Rover Pathfinding Simulator

A cutting-edge browser-based 3D simulation that combines advanced pathfinding algorithms with realistic planetary terrain generation to demonstrate autonomous rover navigation capabilities.

## 🌟 Project Overview

This simulator showcases the future of planetary exploration through an interactive 3D environment where users can:
- **Generate realistic planetary terrain** using Perlin noise algorithms
- **Plan optimal rover paths** using A* pathfinding with slope analysis
- **Monitor mission operations** through a real-time dashboard
- **Experience different rover types** with unique capabilities
- **Visualize terrain difficulty** through slope heatmaps and 3D path visualization

## 🎯 Key Features

### 🏔️ **Advanced Terrain Generation**
- **Perlin Noise Algorithm**: Creates realistic, natural-looking terrain with multiple octaves
- **Terrain Presets**: Pre-configured landscapes (Mountains, Valleys, Craters, Hills, Canyons)
- **Custom Controls**: Adjustable mountain height, feature size, and terrain complexity
- **Dynamic Heightmaps**: Real-time terrain generation with smooth elevation changes

### 🗺️ **Intelligent Pathfinding**
- **A* Algorithm**: Optimized pathfinding with binary heap for performance
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
- **Keyboard Controls**: Manual rover driving (WASD)
- **Camera Controls**: Orbit, zoom, and pan with smooth damping
- **UI Panels**: Collapsible, responsive interface elements

## 🛠️ Technical Architecture

### **Frontend Stack**
- **TypeScript**: Type-safe development with modern ES6+ features
- **Three.js**: WebGL-based 3D graphics and scene management
- **Vite**: Fast development server and build tool
- **CSS3**: Modern styling with backdrop filters and animations

### **Core Systems**

#### **Terrain Generation (`terrainLoader.ts`)**
```typescript
- Perlin noise implementation with permutation tables
- Multi-octave terrain generation
- Configurable noise parameters (scale, persistence, lacunarity)
- Heightmap data processing and normalization
```

#### **3D Visualization (`terrainMesh.ts`)**
```typescript
- Three.js geometry generation from heightmaps
- Vertex color mapping for height and slope visualization
- Material system with PBR (Physically Based Rendering)
- Dynamic normal calculation for realistic lighting
```

#### **Pathfinding Engine (`pathfinding.ts`)**
```typescript
- A* algorithm with binary heap optimization
- Grid-based navigation with slope constraints
- Cost calculation: distance + slope penalty
- Heuristic: Euclidean distance to goal
```

#### **Rover Simulation (`rover.ts`)**
```typescript
- 3D rover model with detailed components
- Physics-based movement and animation
- Energy consumption modeling
- Multiple rover type configurations
```

#### **Mission Control (`main.ts`)**
```typescript
- Scene management and rendering loop
- UI event handling and state management
- Post-processing pipeline (bloom, tone mapping)
- Real-time dashboard updates
```

## 🚀 Getting Started

### **Prerequisites**
- Node.js (v16 or higher)
- npm or yarn package manager
- Modern web browser with WebGL support

### **Installation**
```bash
# Clone the repository
git clone <repository-url>
cd planetary-rover-simulator

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
2. **Find Path**: Click "Find Path" to compute optimal route using A* algorithm
3. **Animate Rover**: Watch the rover follow the calculated path
4. **Monitor Mission**: Use the dashboard to track rover status and performance

### **Terrain Customization**
- **Presets**: Select from pre-configured terrain types
- **Mountain Height**: Adjust vertical scaling (5-80)
- **Feature Size**: Control terrain detail level (0.01-0.20)
- **Octaves**: Set noise complexity (1-8)

### **Rover Selection**
- **Standard**: Balanced exploration capabilities
- **Scout**: High mobility, energy efficient
- **Heavy**: High payload, limited slope navigation
- **Scientific**: Advanced sensors, moderate mobility

### **Advanced Features**
- **Toggle Slope Map**: Visualize terrain difficulty
- **Rover Camera**: First-person view from rover
- **Day/Night Cycle**: Dynamic lighting simulation
- **Manual Control**: Use WASD keys for direct rover control

## 🏆 Hackathon Demo Features

### **Perfect for Judging**
- **Visual Impact**: Stunning 3D graphics with post-processing effects
- **Technical Depth**: Advanced algorithms (A*, Perlin noise, 3D math)
- **User Experience**: Intuitive interface with real-time feedback
- **Innovation**: Combines pathfinding, terrain generation, and rover simulation
- **Scalability**: Modular architecture ready for additional features

### **Key Differentiators**
- **Real-time Terrain Generation**: Dynamic, configurable planetary landscapes
- **Intelligent Pathfinding**: Slope-aware navigation with rover constraints
- **Mission Control Interface**: Professional-grade dashboard
- **Multiple Rover Types**: Demonstrates versatility in rover design
- **Advanced Visualization**: 3D graphics with modern post-processing

## 🔮 Future Enhancements

### **Planned Features**
- **D* Lite Algorithm**: Dynamic pathfinding for changing environments
- **Multi-rover Coordination**: Swarm intelligence and collision avoidance
- **Real Mars Data**: Integration with NASA DEM datasets
- **Particle Effects**: Dust clouds, landing thrusters, environmental effects
- **Voice Commands**: Natural language rover control
- **Mission Export**: Data export for real rover applications

### **Technical Roadmap**
- **WebGL 2.0**: Enhanced graphics capabilities
- **Web Workers**: Multi-threaded pathfinding computation
- **Progressive Web App**: Offline functionality and mobile optimization
- **Machine Learning**: AI-powered terrain analysis and path optimization

## 📊 Performance Metrics

- **Terrain Generation**: 60 FPS for 256x256 heightmaps
- **Pathfinding**: Sub-second computation for complex routes
- **Rendering**: Smooth 60 FPS with post-processing effects
- **Memory Usage**: Optimized for browser environments
- **Load Time**: Fast startup with progressive loading

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
