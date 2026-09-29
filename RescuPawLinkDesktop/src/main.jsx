const { app, BrowserWindow, Menu, shell, ipcMain, autoUpdater, dialog } = require("electron");
const path = require("path");
const isDev = !app.isPackaged;

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 680,
    backgroundColor: "#f2f5f2",
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

  // Handle load failures
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

  // Block new windows
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  // ── Clean minimal menu ───────────────────────────────
  const template = [
    {
      label: "RescuPawLink",
      submenu: [
        { label: "Lock Screen", accelerator: "CmdOrCtrl+L", click: () => mainWindow.webContents.send("lock-screen") },
        { type: "separator" },
        { label: "Contact Support", click: () => shell.openExternal("mailto:rescupawlink@gmail.com") },
        { label: "Visit Website", click: () => shell.openExternal("https://rescupawlink.com") },
        { type: "separator" },
        { label: "Check for Updates", click: () => checkForUpdates(true) },
        { type: "separator" },
        { label: `Version 1.0.0` },
        { type: "separator" },
        { role: "quit", label: "Quit RescuPawLink" },
      ],
    },
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        { role: "selectAll" },
      ],
    },
    ...(isDev ? [{
      label: "Developer",
      submenu: [
        { role: "toggleDevTools" },
        { role: "reload" },
      ],
    }] : []),
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// ── Auto updater ─────────────────────────────────────
function checkForUpdates(manual = false) {
  const { net } = require("electron");
  const request = net.request("https://api.github.com/repos/Pawlink26/Pawlink/releases/latest");
  request.on("response", (response) => {
    let data = "";
    response.on("data", (chunk) => { data += chunk; });
    response.on("end", () => {
      try {
        const release = JSON.parse(data);
        const latest = release.tag_name?.replace("v", "");
        const current = app.getVersion();
        if (latest && latest !== current) {
          const choice = dialog.showMessageBoxSync(mainWindow, {
            type: "info",
            title: "Update Available",
            message: `RescuPawLink v${latest} is available!`,
            detail: `You're on v${current}. Download and install the latest version?`,
            buttons: ["Download Update", "Later"],
            defaultId: 0,
          });
          if (choice === 0) {
            shell.openExternal(release.assets?.[0]?.browser_download_url || release.html_url);
          }
        } else if (manual) {
          dialog.showMessageBox(mainWindow, {
            type: "info",
            title: "Up to Date",
            message: "You're running the latest version of RescuPawLink.",
            buttons: ["OK"],
          });
        }
      } catch(e) {
        if (manual) {
          dialog.showMessageBox(mainWindow, {
            type: "error",
            title: "Update Check Failed",
            message: "Could not check for updates. Please check your internet connection.",
            buttons: ["OK"],
          });
        }
      }
    });
  });
  request.end();
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
    // Check for updates silently on launch (after 3 seconds)
    setTimeout(() => checkForUpdates(false), 3000);
    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// Handle lock from menu
ipcMain.on("lock-screen", () => {
  mainWindow?.webContents.send("lock-screen");
});
