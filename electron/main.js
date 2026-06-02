const { app, BrowserWindow, ipcMain } = require("electron");
const { lcuRequest } = require("./lcu");
const path = require("path");

let win;

if (!app.isPackaged) {
  require("electron-reload")(__dirname, {
    electron: require(`${__dirname}/../node_modules/electron`),
    watch: [
      path.join(__dirname, "../app"),
      path.join(__dirname, "../components"),
      path.join(__dirname, "../styles"),
      path.join(__dirname, "../public"),
    ],
  });
}

function createWindow() {
  win = new BrowserWindow({
    width: 1400,
    height: 900,
    icon: path.join(__dirname, "../resources/icon.ico"),

    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  win.maximize();
  win.setMenuBarVisibility(false);
  if (app.isPackaged) {
    win.loadFile(path.join(__dirname, "../out/index.html"));
  } else {
    win.loadURL("http://localhost:3000");
  }
}

ipcMain.handle("lcu-request", async (_, { path, method, body }) => {
  try {
    return await lcuRequest(path, method, body);
  } catch (e) {
    return {
      __lcuError: true,
      httpStatus: e.httpStatus ?? 500,
      errorCode: e.errorCode ?? "UNKNOWN",
      message: e.message ?? "Unknown error",
    };
  }
});

ipcMain.handle("lcu-reload", async () => {
  try {
    return await lcuRequest("/lol-summoner/v1/current-summoner", "GET");
  } catch (e) {
    return null;
  }
});

app.whenReady().then(createWindow);
