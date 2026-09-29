const { app, BrowserWindow, Menu, shell, dialog, ipcMain, session } = require("electron");
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
    icon: path.join(__dirname, "../public/icon.png"),
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      experimentalFeatures: false,
      preload: path.join(__dirname, "preload.js"),
    },
    show: false,
  });

  // ── Content Security Policy ──────────────────────────
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        "Content-Security-Policy": [
          "default-src 'self';" +
          "script-src 'self' 'unsafe-inline';" +
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;" +
          "font-src 'self' https://fonts.gstatic.com;" +
          "img-src 'self' data: https://i.imgur.com https://images.pexels.com;" +
          "connect-src 'self' https://dmbfawpmgemqpbzpsbdm.supabase.co https://api.emailjs.com https://api.anthropic.com https://api.allorigins.win;" +
          "frame-src 'none';" +
          "object-src 'none';"
        ],
        "X-Content-Type-Options": ["nosniff"],
        "X-Frame-Options": ["DENY"],
        "X-XSS-Protection": ["1; mode=block"],
        "Referrer-Policy": ["strict-origin-when-cross-origin"],
      },
    });
  });

  // ── Block navigation to external URLs ───────────────
  mainWindow.webContents.on("will-navigate", (event, url) => {
    const allowedUrls = ["http://localhost:5173", "file://"];
    const isAllowed = allowedUrls.some(u => url.startsWith(u));
    if (!isAllowed) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  // ── Block new window creation ────────────────────────
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  // ── Show when ready to avoid white flash ─────────────
  mainWindow.once("ready-to-show", () => { mainWindow.show(); });

  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  // ── Native menu ──────────────────────────────────────
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

app.whenReady().then(() => {
  // ── Disable hardware acceleration for stability ───────
  app.disableHardwareAcceleration();

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// ── Handle lock from menu shortcut ──────────────────────
ipcMain.on("lock-screen", () => {
  mainWindow?.webContents.send("lock-screen");
});

// ── Prevent second instance ──────────────────────────────
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
}
