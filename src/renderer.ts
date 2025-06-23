/**
 * This file will automatically be loaded by webpack and run in the "renderer" context.
 * To learn more about the differences between the "main" and the "renderer" context in
 * Electron, visit:
 *
 * https://electronjs.org/docs/latest/tutorial/process-model
 *
 * By default, Node.js integration in this file is disabled. When enabling Node.js integration
 * in a renderer process, please be aware of potential security implications. You can read
 * more about security risks here:
 *
 * https://electronjs.org/docs/tutorial/security
 *
 * To enable Node.js integration in this file, open up `main.js` and enable the `nodeIntegration`
 * flag:
 *
 * ```
 *  // Create the browser window.
 *  mainWindow = new BrowserWindow({
 *    width: 800,
 *    height: 600,
 *    webPreferences: {
 *      nodeIntegration: true
 *    }
 *  });
 * ```
 */

import './index.css';
// Add this to the end of the existing file
import './app';

console.log('👋 This message is being logged by "renderer.js", included via webpack');

// Listen for request from main process to start Command key listener
if (window.cmdKeyBridge) {
  window.cmdKeyBridge.onRequestCmdListener(() => {
    let isCmdDown = false;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.metaKey && !isCmdDown) {
        isCmdDown = true;
        window.cmdKeyBridge?.notifyCmdKeyState(true);
      }
    }
    function handleKeyUp(e: KeyboardEvent) {
      if (!e.metaKey && isCmdDown) {
        isCmdDown = false;
        window.cmdKeyBridge?.notifyCmdKeyState(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    // Clean up if needed (not strictly necessary for this app)
  });
}

declare global {
  interface Window {
    cmdKeyBridge?: {
      notifyCmdKeyState: (down: boolean) => void;
      onRequestCmdListener: (callback: () => void) => void;
    };
  }
}
