// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from "electron";

// Expose clickThrough toggle to renderer
contextBridge.exposeInMainWorld("clickThroughBridge", {
  onStateChange: (callback: (state: boolean) => void) => {
    ipcRenderer.on("click-through-state", (_event, state: boolean) =>
      callback(state)
    );
  },
});
