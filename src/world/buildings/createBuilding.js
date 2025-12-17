// src/world/buildings/createBuilding.js
import * as THREE from "three";

export function createBuilding(config, scene) {
  if (!config || !config.grammar || !config.grammar.building) return null;

  const {
    positionX = 0,
    positionY = 0,
    positionZ = 0,
    color = "#ffffff",
    grammar,
  } = config;

  const building = grammar.building;
  const wallThickness = grammar.wallThickness || 0.2;

  // Create group for the building
  const group = new THREE.Group();
  group.name = "building";
  // Position - Y will be set by caller to terrain height
  group.position.set(positionX, positionY, positionZ);

  // Building material
  const material = new THREE.MeshStandardMaterial({
    color: new THREE.Color(color),
    roughness: 0.7,
    metalness: 0.1,
  });

  // Create rooms, walls, floors, and ceilings
  building.levels.forEach((level) => {
    level.rooms.forEach((room) => {
      // Floor
      const floorGeometry = new THREE.PlaneGeometry(room.width, room.depth);
      const floor = new THREE.Mesh(floorGeometry, material);
      floor.rotation.x = -Math.PI / 2;
      floor.position.set(room.x, room.y, room.z);
      floor.receiveShadow = true;
      group.add(floor);

      // Ceiling
      const ceilingGeometry = new THREE.PlaneGeometry(room.width, room.depth);
      const ceiling = new THREE.Mesh(ceilingGeometry, material);
      ceiling.rotation.x = Math.PI / 2;
      ceiling.position.set(room.x, room.y + room.height, room.z);
      ceiling.receiveShadow = true;
      group.add(ceiling);

      // Walls (4 walls per room)
      const halfWidth = room.width / 2;
      const halfDepth = room.depth / 2;

      // North wall
      if (!hasConnection(room, "north", level.rooms)) {
        const northWall = createWall(
          room.width,
          room.height,
          wallThickness,
          material
        );
        northWall.position.set(room.x, room.y + room.height / 2, room.z - halfDepth);
        northWall.castShadow = true;
        northWall.receiveShadow = true;
        group.add(northWall);
      }

      // South wall
      if (!hasConnection(room, "south", level.rooms)) {
        const southWall = createWall(
          room.width,
          room.height,
          wallThickness,
          material
        );
        southWall.position.set(room.x, room.y + room.height / 2, room.z + halfDepth);
        southWall.castShadow = true;
        southWall.receiveShadow = true;
        group.add(southWall);
      }

      // East wall
      if (!hasConnection(room, "east", level.rooms)) {
        const eastWall = createWall(
          room.depth,
          room.height,
          wallThickness,
          material
        );
        eastWall.rotation.y = Math.PI / 2;
        eastWall.position.set(room.x + halfWidth, room.y + room.height / 2, room.z);
        eastWall.castShadow = true;
        eastWall.receiveShadow = true;
        group.add(eastWall);
      }

      // West wall
      if (!hasConnection(room, "west", level.rooms)) {
        const westWall = createWall(
          room.depth,
          room.height,
          wallThickness,
          material
        );
        westWall.rotation.y = Math.PI / 2;
        westWall.position.set(room.x - halfWidth, room.y + room.height / 2, room.z);
        westWall.castShadow = true;
        westWall.receiveShadow = true;
        group.add(westWall);
      }
    });
  });

  // Create stairs
  if (building.stairs && building.stairs.length > 0) {
    building.stairs.forEach((stair) => {
      const stairGeometry = new THREE.BoxGeometry(
        stair.width,
        stair.height,
        stair.depth
      );
      const stairMesh = new THREE.Mesh(stairGeometry, material);
      stairMesh.position.set(
        stair.x,
        stair.y + stair.height / 2,
        stair.z
      );
      stairMesh.castShadow = true;
      stairMesh.receiveShadow = true;
      group.add(stairMesh);
    });
  }

  // Add to scene
  scene.add(group);

  return {
    group,
    dispose: () => {
      group.traverse((child) => {
        if (child.isMesh) {
          child.geometry.dispose();
          child.material.dispose();
        }
      });
      scene.remove(group);
    },
    updateConfig: (newConfig) => {
      // For now, just recreate the building
      // In a more advanced version, we could update materials/positions
      if (newConfig.grammar?.building !== grammar.building) {
        return false; // Signal that recreation is needed
      }

      // Update position
      group.position.set(
        newConfig.positionX ?? positionX,
        newConfig.positionY ?? positionY,
        newConfig.positionZ ?? positionZ
      );

      // Update material color
      material.color.set(newConfig.color ?? color);

      return true; // Successfully updated
    },
  };
}

// Helper: Create a wall
function createWall(width, height, thickness, material) {
  const geometry = new THREE.BoxGeometry(width, height, thickness);
  return new THREE.Mesh(geometry, material);
}

// Helper: Check if room has connection in a direction
function hasConnection(room, direction, allRooms) {
  return room.connections.some((conn) => {
    if (conn.direction === direction) {
      // Verify the connected room exists
      return allRooms.some((r) => r.id === conn.to);
    }
    return false;
  });
}

