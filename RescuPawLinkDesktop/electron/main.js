const { app, BrowserWindow, Menu, shell, ipcMain, session } = require("electron");
const path = require("path");
const isDev = !app.isPackaged;

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 680,
    backgroundColor: "#f8f8f6",
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      preload: path.join(__dirname, "preload.js"),
    },
    show: true,
  });

  // Load the app
  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  // Handle load failures gracefully
  mainWindow.webContents.on("did-fail-load", (event, errorCode, errorDescription) => {
    console.error("Failed to load:", errorCode, errorDescription);
  });

  // Block navigation to external URLs
  mainWindow.webContents.on("will-navigate", (event, url) => {
    const allowed = ["http://localhost:5173", "file://"];
    if (!allowed.some(u => url.startsWith(u))) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  // Block new windows — open in browser instead
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  // Native menu
  const isMac = process.platform === "darwin";
  const template = [
    ...(isMac ? [{ role: "appMenu" }] : []),
    {
      label: "File",
      submenu: [
        { label: "Lock Screen", accelerator: "CmdOrCtrl+L", click: () => mainWindow.webContents.send("lock-screen") },
        { type: "separator" },
        isMac ? { role: "close" } : { role: "quit", label: "Exit" },
      ],
    },
    { role: "editMenu" },
    {
      label: "View",
      submenu: [
        { role: "resetZoom" }, { role: "zoomIn" }, { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
        ...(isDev ? [{ type: "separator" }, { role: "toggleDevTools" }] : []),
      ],
    },
    {
      label: "Help",
      submenu: [
        { label: "RescuPawLink Website", click: () => shell.openExternal("https://rescupawlink.com") },
        { label: "Contact Support", click: () => shell.openExternal("mailto:rescupawlink@gmail.com") },
        { type: "separator" },
        { label: "Version 1.0.0" },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// Prevent second instance
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    createWindow();
    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// Handle lock from menu shortcut
ipcMain.on("lock-screen", () => {
  mainWindow?.webContents.send("lock-screen");
});
