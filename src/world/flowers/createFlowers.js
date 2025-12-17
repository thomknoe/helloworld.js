// src/world/flowers/createFlowers.js
import * as THREE from "three";
import Perlin from "../../algorithms/perlin.js";
import { sampleTerrainHeight } from "../terrain/sampleHeight.js";

export function createFlowers(config, scene, terrainConfig) {
  if (!config) return null;

  const {
    count = 50,
    spread = 50.0,
    size = 1.0, // Increased default size
    noiseConfig,
  } = config;

  // Water level (flowers should be above this)
  const WATER_LEVEL = 20;

  // Create group for all flowers
  const group = new THREE.Group();
  group.name = "flowers";

  // Shared materials for all flowers
  const redMaterial = new THREE.MeshStandardMaterial({
    color: 0xff4444,
    roughness: 0.9,
    metalness: 0.0,
  });

  const whiteMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.9,
    metalness: 0.0,
  });

  const stemMaterial = new THREE.MeshStandardMaterial({
    color: 0x4a7c59,
    roughness: 0.9,
    metalness: 0.0,
  });

  const leafMaterial = new THREE.MeshStandardMaterial({
    color: 0x4a7c59,
    roughness: 0.9,
    metalness: 0.0,
  });

  const yellowCenterMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffaa,
    roughness: 0.8,
    metalness: 0.1,
  });

  const orangeCenterMaterial = new THREE.MeshStandardMaterial({
    color: 0xffaa00,
    roughness: 0.8,
    metalness: 0.1,
  });

  const flowers = [];
  let attempts = 0;
  const maxAttempts = count * 20; // Prevent infinite loops (more attempts for water filtering)

  // Initialize Perlin noise if config provided
  if (noiseConfig) {
    Perlin.init(noiseConfig.seed ?? 42);
  }

  // Generate flower positions using Perlin noise for scattering
  while (flowers.length < count && attempts < maxAttempts) {
    attempts++;

    // Random position within spread
    const x = (Math.random() - 0.5) * spread;
    const z = (Math.random() - 0.5) * spread;

    // Use Perlin noise to determine if flower should be placed here
    // Higher noise values = more likely to place flower
    let noiseValue = 0.5; // Default if no noise config
    if (noiseConfig) {
      const noiseScale = noiseConfig.scale ?? 0.05;
      // Sample noise at this position
      noiseValue = Perlin.noise2D(x * noiseScale, z * noiseScale);
      // Perlin returns [0, 1] range
    }

    // Use noise value as probability (threshold for placement)
    // Higher noise = more likely to place flower
    // Adjust threshold to control density
    const threshold = 0.35; // Lower threshold = more flowers in high-noise areas
    if (noiseValue < threshold) {
      continue; // Skip this position (low noise area)
    }

    // Get terrain height at this position using the same method as the terrain mesh
    // This ensures flowers are perfectly grounded on the terrain surface
    let terrainHeight = 0;
    if (terrainConfig) {
      // Use sampleTerrainHeight which matches the actual terrain mesh calculation
      // Handle both 'scale' and 'noiseScale' property names
      const noiseScale = terrainConfig.scale ?? terrainConfig.noiseScale ?? 0.05;
      terrainHeight = sampleTerrainHeight(x, z, {
        seed: terrainConfig.seed ?? 42,
        scale: noiseScale,
        octaves: terrainConfig.octaves ?? 4,
        persistence: terrainConfig.persistence ?? 0.5,
        amplitude: terrainConfig.amplitude ?? 10,
        frequency: terrainConfig.frequency ?? 1,
      });
    } else {
      // Fallback to default config
      terrainHeight = sampleTerrainHeight(x, z, {
        seed: 42,
        scale: 0.05,
        octaves: 4,
        persistence: 0.5,
        amplitude: 10,
        frequency: 1,
      });
    }

    // Only place flower if above water level
    if (terrainHeight <= WATER_LEVEL) {
      continue; // Skip - this is water
    }

    // Randomly choose red or white
    const isRed = Math.random() > 0.5;
    const petalMaterial = isRed ? redMaterial : whiteMaterial;
    
    // Create detailed, prominent flower with multiple petals
    const flowerGroup = new THREE.Group();
    
    // Stem (green cylinder)
    // Position stem so its bottom is at y=0 (ground level in local space)
    const stemHeight = size * 0.8;
    const stemRadius = size * 0.05;
    const stemGeometry = new THREE.CylinderGeometry(stemRadius, stemRadius, stemHeight, 8);
    const stemMesh = new THREE.Mesh(stemGeometry, stemMaterial);
    // Cylinder is centered, so position it so bottom is at y=0
    stemMesh.position.y = stemHeight / 2;
    flowerGroup.add(stemMesh);
    
    // Flower head positioned at top of stem
    const flowerHeadY = stemHeight;
    const petalSize = size * 0.4;
    const petalCount = 6; // 6 petals for more detail
    
    // Create multiple 3D petals in a circle
    for (let i = 0; i < petalCount; i++) {
      const angle = (i / petalCount) * Math.PI * 2;
      
      // Each petal is a cone/teardrop shape
      const petalGeometry = new THREE.ConeGeometry(petalSize * 0.5, petalSize, 8);
      const petalMesh = new THREE.Mesh(petalGeometry, petalMaterial);
      
      // Position petal in a circle around center
      petalMesh.position.x = Math.cos(angle) * petalSize * 0.3;
      petalMesh.position.z = Math.sin(angle) * petalSize * 0.3;
      petalMesh.position.y = flowerHeadY;
      
      // Rotate petal to face outward
      petalMesh.rotation.z = angle + Math.PI / 2;
      petalMesh.rotation.x = -Math.PI / 3; // Slight tilt
      
      flowerGroup.add(petalMesh);
    }
    
    // Center of flower (prominent sphere)
    const centerSize = size * 0.25;
    const centerGeometry = new THREE.SphereGeometry(centerSize, 12, 12);
    const centerMesh = new THREE.Mesh(
      centerGeometry, 
      isRed ? orangeCenterMaterial : yellowCenterMaterial
    );
    centerMesh.position.y = flowerHeadY;
    flowerGroup.add(centerMesh);
    
    // Add a few leaves on the stem
    const leafCount = 2;
    for (let i = 0; i < leafCount; i++) {
      const leafY = (stemHeight / (leafCount + 1)) * (i + 1);
      const leafGeometry = new THREE.ConeGeometry(size * 0.15, size * 0.3, 6);
      const leafMesh = new THREE.Mesh(leafGeometry, leafMaterial);
      leafMesh.position.y = leafY;
      leafMesh.position.x = stemRadius * 1.5;
      leafMesh.rotation.z = Math.PI / 4;
      leafMesh.rotation.y = Math.PI / 6;
      flowerGroup.add(leafMesh);
    }

    // Position flower on terrain - set y so that the stem's bottom (y=0 in local space) is at terrain height
    // The stem's bottom is at y=0 in the flowerGroup's local space
    flowerGroup.position.set(x, terrainHeight, z);
    
    // Random rotation for variety
    flowerGroup.rotation.y = Math.random() * Math.PI * 2;

    flowerGroup.castShadow = true;
    flowerGroup.receiveShadow = false;

    group.add(flowerGroup);
    flowers.push(flowerGroup);
  }

  // Add to scene
  scene.add(group);

  return {
    group,
    flowers,
    dispose: () => {
      flowers.forEach((flower) => {
        flower.traverse((child) => {
          if (child.isMesh) {
            child.geometry.dispose();
          }
        });
      });
      redMaterial.dispose();
      whiteMaterial.dispose();
      stemMaterial.dispose();
      leafMaterial.dispose();
      yellowCenterMaterial.dispose();
      orangeCenterMaterial.dispose();
      scene.remove(group);
    },
    updateConfig: (newConfig) => {
      // For now, just recreate the flowers
      // In a more advanced version, we could update positions
      if (
        newConfig.count !== count ||
        newConfig.spread !== spread ||
        newConfig.size !== size ||
        newConfig.noiseConfig !== noiseConfig
      ) {
        return false; // Signal that recreation is needed
      }
      return true;
    },
  };
}

