const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  request: (path, method, body) =>
    ipcRenderer.invoke("lcu-request", { path, method, body }),
  reloadLCU: () => ipcRenderer.invoke("lcu-reload"),
});
