import { useState, useCallback, useEffect } from "react";
import PlayerView from "./player/PlayerView.jsx";
import AuthorCanvas from "./ui/AuthorCanvas.jsx";
import Portal from "./ui/Portal.jsx";

export default function App() {
  const [isAuthorMode, setIsAuthorMode] = useState(false);
  const [terrainConfig, setTerrainConfig] = useState(null);
  const [flockingConfig, setFlockingConfig] = useState(null);
  const [plantConfigs, setPlantConfigs] = useState([]);
  const [buildingConfigs, setBuildingConfigs] = useState([]);
  const [flowerConfigs, setFlowerConfigs] = useState([]);

  const toggleAuthorMode = useCallback(() => {
    setIsAuthorMode((prev) => !prev);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (e.key.toLowerCase() === "p") {
        e.preventDefault();
        toggleAuthorMode();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [toggleAuthorMode]);

  return (
    <>
      <PlayerView
        isAuthorMode={isAuthorMode}
        terrainConfig={terrainConfig}
        flockingConfig={flockingConfig}
        plantConfigs={plantConfigs}
        buildingConfigs={buildingConfigs}
        flowerConfigs={flowerConfigs}
      />

      <Portal>
        {!isAuthorMode && (
          <div className="hud">
            <div className="hud-title">Controls</div>
            <div className="hud-row">W / A / S / D — Move</div>
            <div className="hud-row">Mouse — Look</div>
            <div className="hud-row">Click — Pointer Lock</div>
            <div className="hud-row">P — Author Mode</div>
          </div>
        )}

        <div
          className="author-backdrop"
          style={{ display: isAuthorMode ? "flex" : "none" }}
        >
          <div className="author-overlay-shell">
            <AuthorCanvas
              onTerrainConfigChange={setTerrainConfig}
              onFlockingConfigChange={setFlockingConfig}
              onPlantConfigChange={setPlantConfigs}
              onBuildingConfigChange={setBuildingConfigs}
              onFlowerConfigChange={setFlowerConfigs}
            />
          </div>
        </div>
      </Portal>
    </>
  );
}
