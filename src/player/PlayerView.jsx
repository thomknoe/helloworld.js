// src/player/PlayerView.jsx
import { useEffect, useRef } from "react";
import * as THREE from "three";

import createScene from "../world/scene/createScene.js";
import { createCameraRig } from "./cameraRig.js";
import useFirstPersonControls from "./useFirstPersonControls.js";
import { updateTerrainGeometry } from "../world/terrain/createTerrain.js";
import { createFlockingMotes } from "../world/flocking/createFlockingMotes.js";
import { createPlant } from "../world/plants/createPlant.js";
import { createBuilding } from "../world/buildings/createBuilding.js";
import { createFlowers } from "../world/flowers/createFlowers.js";

import { sampleTerrainHeight } from "../world/terrain/sampleHeight.js";

export default function PlayerView({ isAuthorMode, terrainConfig, flockingConfig, plantConfigs = [], buildingConfigs = [], flowerConfigs = [] }) {
  const mountRef = useRef(null);
  const cameraRef = useRef(null);
  const playerRef = useRef(null);
  const terrainRef = useRef(null);
  const sceneRef = useRef(null);

  // flocking system
  const flockingSystemRef = useRef(null);

  // plant system
  const plantRefs = useRef([]);

  // building system
  const buildingRefs = useRef([]);

  // flower system
  const flowerRefs = useRef([]);

  // ----------------------------------------
  // AUTHOR MODE TRACKER
  // ----------------------------------------
  const isAuthorModeRef = useRef(isAuthorMode);
  useEffect(() => {
    isAuthorModeRef.current = isAuthorMode;
  }, [isAuthorMode]);

  // ----------------------------------------
  // TERRAIN CONFIG TRACKER
  // ----------------------------------------
  const terrainConfigRef = useRef(null);
  useEffect(() => {
    terrainConfigRef.current = terrainConfig;
  }, [terrainConfig]);

  // ----------------------------------------
  // INIT SCENE
  // ----------------------------------------
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const { scene, camera, renderer, water, terrain } = createScene(mount);

    sceneRef.current = scene;
    cameraRef.current = camera;
    terrainRef.current = terrain;

    const player = createCameraRig(camera);
    playerRef.current = player;
    scene.add(player);

    // Track time for deltaTime calculation
    let lastTime = performance.now();

    // ----------------------------------------
    // ANIMATION LOOP
    // ----------------------------------------
    const animate = () => {
      requestAnimationFrame(animate);

      const currentTime = performance.now();
      const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
      lastTime = currentTime;

      // animate water only outside author mode
      if (!isAuthorModeRef.current && water?.material?.uniforms?.time) {
        water.material.uniforms.time.value = performance.now() / 1000;
      }

      // Update flocking system
      if (flockingSystemRef.current) {
        flockingSystemRef.current.update(deltaTime);
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      if (renderer?.domElement && mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  // ----------------------------------------
  // FPS + Ground Following
  // ----------------------------------------
  useFirstPersonControls(
    playerRef,
    cameraRef,
    isAuthorModeRef,
    terrainConfigRef
  );

  // ----------------------------------------
  // UPDATE TERRAIN GEOMETRY
  // ----------------------------------------
  useEffect(() => {
    if (!terrainConfig || !terrainRef.current) return;
    updateTerrainGeometry(terrainRef.current, terrainConfig);
  }, [terrainConfig]);


  // ----------------------------------------
  // FLOCKING SYSTEM
  // ----------------------------------------
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Clean up existing system
    if (flockingSystemRef.current) {
      flockingSystemRef.current.dispose();
      flockingSystemRef.current = null;
    }

    // Create new system if config exists
    if (flockingConfig) {
      const system = createFlockingMotes(flockingConfig, scene);
      flockingSystemRef.current = system;
    }

    return () => {
      if (flockingSystemRef.current) {
        flockingSystemRef.current.dispose();
        flockingSystemRef.current = null;
      }
    };
  }, [flockingConfig]);

  // Update flocking config when it changes
  useEffect(() => {
    if (flockingSystemRef.current && flockingConfig) {
      flockingSystemRef.current.updateConfig(flockingConfig);
    }
  }, [flockingConfig]);

  // ----------------------------------------
  // PLANT SYSTEM
  // ----------------------------------------
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Clean up existing plants
    plantRefs.current.forEach((plant) => {
      if (plant && plant.dispose) {
        plant.dispose();
      }
    });
    plantRefs.current = [];

    // Create new plants
    plantConfigs.forEach((plantConfig) => {
      if (!plantConfig.lsystem) return; // Skip if no L-system connected

      // ALWAYS snap to terrain - ignore Y axis
      let terrainHeight = 0;
      if (terrainConfigRef.current) {
        terrainHeight = sampleTerrainHeight(plantConfig.positionX, plantConfig.positionZ, {
          seed: terrainConfigRef.current.seed ?? 42,
          scale: terrainConfigRef.current.scale ?? terrainConfigRef.current.noiseScale ?? 0.05,
          octaves: terrainConfigRef.current.octaves ?? 4,
          persistence: terrainConfigRef.current.persistence ?? 0.5,
          amplitude: terrainConfigRef.current.amplitude ?? 10,
          frequency: terrainConfigRef.current.frequency ?? 1,
        });
      }
      
      const adjustedConfig = {
        ...plantConfig,
        positionY: terrainHeight, // Always place on terrain
      };

      const plant = createPlant(adjustedConfig, scene);
      if (plant) {
        plantRefs.current.push(plant);
      }
    });

    return () => {
      plantRefs.current.forEach((plant) => {
        if (plant && plant.dispose) {
          plant.dispose();
        }
      });
      plantRefs.current = [];
    };
  }, [plantConfigs]);

  // ----------------------------------------
  // BUILDING SYSTEM
  // ----------------------------------------
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Clean up existing buildings
    buildingRefs.current.forEach((building) => {
      if (building && building.dispose) {
        building.dispose();
      }
    });
    buildingRefs.current = [];

    // Create new buildings
    buildingConfigs.forEach((buildingConfig) => {
      if (!buildingConfig.grammar) return; // Skip if no grammar connected

      // ALWAYS snap to terrain - ignore Y axis
      let terrainHeight = 0;
      if (terrainConfigRef.current) {
        terrainHeight = sampleTerrainHeight(buildingConfig.positionX, buildingConfig.positionZ, {
          seed: terrainConfigRef.current.seed ?? 42,
          scale: terrainConfigRef.current.scale ?? terrainConfigRef.current.noiseScale ?? 0.05,
          octaves: terrainConfigRef.current.octaves ?? 4,
          persistence: terrainConfigRef.current.persistence ?? 0.5,
          amplitude: terrainConfigRef.current.amplitude ?? 10,
          frequency: terrainConfigRef.current.frequency ?? 1,
        });
      }

      const adjustedConfig = {
        ...buildingConfig,
        positionX: buildingConfig.positionX,
        positionY: terrainHeight, // Always place on terrain
        positionZ: buildingConfig.positionZ,
      };

      const building = createBuilding(adjustedConfig, scene);
      if (building) {
        buildingRefs.current.push(building);
      }
    });

    return () => {
      buildingRefs.current.forEach((building) => {
        if (building && building.dispose) {
          building.dispose();
        }
      });
      buildingRefs.current = [];
    };
  }, [buildingConfigs]);

  // ----------------------------------------
  // FLOWER SYSTEM
  // ----------------------------------------
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Clean up existing flowers
    flowerRefs.current.forEach((flower) => {
      if (flower && flower.dispose) {
        flower.dispose();
      }
    });
    flowerRefs.current = [];

    // Create new flowers
    flowerConfigs.forEach((flowerConfig) => {
      // Pass full terrain config so height sampling matches the actual terrain mesh
      const terrainConfigForFlowers = terrainConfigRef.current || null;

      const flower = createFlowers(flowerConfig, scene, terrainConfigForFlowers);
      if (flower) {
        flowerRefs.current.push(flower);
      }
    });

    return () => {
      flowerRefs.current.forEach((flower) => {
        if (flower && flower.dispose) {
          flower.dispose();
        }
      });
      flowerRefs.current = [];
    };
  }, [flowerConfigs]);

  // ----------------------------------------
  // POINTER LOCK
  // ----------------------------------------
  const handleClick = () => {
    if (!isAuthorModeRef.current) {
      document.body.requestPointerLock();
    }
  };

  // ----------------------------------------
  // RENDER
  // ----------------------------------------
  return (
    <>
      {/* THREEJS WORLD */}
      <div
        ref={mountRef}
        style={{
          width: "100vw",
          height: "100vh",
          position: "absolute",
          inset: 0,
          zIndex: 1
        }}
        onClick={handleClick}
      />
    </>
  );
}
