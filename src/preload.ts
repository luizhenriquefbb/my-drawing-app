// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from 'electron';

// Expose a method to listen for Command key requests from main
contextBridge.exposeInMainWorld('cmdKeyBridge', {
  notifyCmdKeyState: (down: boolean) => ipcRenderer.send('cmd-key-state', down),
  onRequestCmdListener: (callback: () => void) => {
    ipcRenderer.on('request-cmd-listener', callback);
  }
});
