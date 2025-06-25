import React, { useEffect, useState } from "react";
import "./clickThroughStatus.styles.css";

export const ClickThroughStatus: React.FC = () => {
  const [active, setActive] = useState(true);

  useEffect(() => {
    // Listen for click-through state from main process
    if (window.electron && window.electron.ipcRenderer) {
      console.log("Listening for click-through state from main process");
      window.electron.ipcRenderer.on(
        "click-through-state",
        (_event: unknown, state: boolean) => {
          setActive(state);
        }
      );
    } else if (window.clickThroughBridge) {
      console.log("Using contextBridge for click-through state");
      // Fallback for contextBridge
      window.clickThroughBridge.onStateChange?.((state: boolean) =>
        setActive(state)
      );
    }
  }, []);

  return (
    <div className={`click-through-status ${active ? "active" : "inactive"}`}>
      Click-Through: <b>{active ? "ON" : "OFF"}</b>
    </div>
  );
};
