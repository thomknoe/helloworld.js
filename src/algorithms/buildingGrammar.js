// src/algorithms/buildingGrammar.js
// Procedural building generation using shape grammar

export class BuildingGrammar {
  constructor(config) {
    this.levels = config.levels || 3;
    this.roomsPerLevel = config.roomsPerLevel || 4;
    this.roomSize = config.roomSize || 4.0;
    this.levelHeight = config.levelHeight || 3.0;
    this.wallThickness = config.wallThickness || 0.2;
    this.hasStairs = config.hasStairs !== false;
    this.roomLayout = config.roomLayout || "grid"; // "grid", "linear", "radial"
  }

  // Generate building structure
  generate() {
    const building = {
      levels: [],
      stairs: [],
    };

    for (let level = 0; level < this.levels; level++) {
      const levelData = this.generateLevel(level);
      building.levels.push(levelData);

      // Add stairs between levels
      if (this.hasStairs && level < this.levels - 1) {
        const stair = this.generateStairs(level, levelData);
        building.stairs.push(stair);
      }
    }

    return building;
  }

  // Generate a single level
  generateLevel(levelIndex) {
    const rooms = [];
    const y = levelIndex * this.levelHeight;

    // Generate room positions based on layout
    const positions = this.generateRoomPositions(levelIndex);

    positions.forEach((pos, index) => {
      const room = {
        id: `level-${levelIndex}-room-${index}`,
        x: pos.x,
        y: y,
        z: pos.z,
        width: this.roomSize,
        depth: this.roomSize,
        height: this.levelHeight,
        level: levelIndex,
        connections: [], // Connections to other rooms
      };

      // Determine connections (all adjacent rooms)
      positions.forEach((otherPos, otherIndex) => {
        if (index === otherIndex) return;
        
        const distance = Math.sqrt(
          Math.pow(pos.x - otherPos.x, 2) + Math.pow(pos.z - otherPos.z, 2)
        );
        
        // Connect if rooms are adjacent (within room size + small margin)
        if (distance < this.roomSize * 1.2) {
          const direction = this.getDirection(pos, otherPos);
          // Only add if not already connected
          if (!room.connections.some(c => c.to === `level-${levelIndex}-room-${otherIndex}`)) {
            room.connections.push({
              to: `level-${levelIndex}-room-${otherIndex}`,
              direction: direction,
            });
          }
        }
      });

      rooms.push(room);
    });

    return {
      level: levelIndex,
      y: y,
      rooms: rooms,
    };
  }

  // Generate room positions based on layout type
  generateRoomPositions(levelIndex) {
    const positions = [];
    const spacing = this.roomSize * 1.1;

    switch (this.roomLayout) {
      case "grid":
        // Grid layout
        const cols = Math.ceil(Math.sqrt(this.roomsPerLevel));
        const rows = Math.ceil(this.roomsPerLevel / cols);
        for (let i = 0; i < this.roomsPerLevel; i++) {
          const col = i % cols;
          const row = Math.floor(i / cols);
          positions.push({
            x: (col - (cols - 1) / 2) * spacing,
            z: (row - (rows - 1) / 2) * spacing,
          });
        }
        break;

      case "linear":
        // Linear layout
        for (let i = 0; i < this.roomsPerLevel; i++) {
          positions.push({
            x: (i - (this.roomsPerLevel - 1) / 2) * spacing,
            z: 0,
          });
        }
        break;

      case "radial":
        // Radial layout
        const angleStep = (Math.PI * 2) / this.roomsPerLevel;
        const radius = spacing * 1.5;
        for (let i = 0; i < this.roomsPerLevel; i++) {
          const angle = i * angleStep;
          positions.push({
            x: Math.cos(angle) * radius,
            z: Math.sin(angle) * radius,
          });
        }
        break;

      default:
        // Default to grid
        for (let i = 0; i < this.roomsPerLevel; i++) {
          positions.push({
            x: (i % 3 - 1) * spacing,
            z: (Math.floor(i / 3) - 1) * spacing,
          });
        }
    }

    return positions;
  }

  // Get direction between two positions
  getDirection(from, to) {
    const dx = to.x - from.x;
    const dz = to.z - from.z;
    
    if (Math.abs(dx) > Math.abs(dz)) {
      return dx > 0 ? "east" : "west";
    } else {
      return dz > 0 ? "south" : "north";
    }
  }

  // Generate stairs between levels
  generateStairs(levelIndex, levelData) {
    // Place stairs at the center of the first room
    const firstRoom = levelData.rooms[0];
    return {
      x: firstRoom.x,
      y: levelData.y,
      z: firstRoom.z,
      width: 1.0,
      depth: 1.0,
      height: this.levelHeight,
      level: levelIndex,
    };
  }
}

