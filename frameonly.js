const { app, BrowserWindow, ipcMain } = require("electron");
const { logger, rendererLogger } = require("./js/logger");
const config = require("./config/config");
const ImageFolderWatcher = require("./js/imagefolderwatcher");
const inputhandler = require("./js/inputHandler");
const schedules = require("./js/schedules");

global.config = config;
global.rendererLogger = rendererLogger;
global.images = [];

logger.info("Started in Frame Only mode");

app.commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required");
let win;

function createWindow() {
  // Create the browser window.
  win = new BrowserWindow({
    width: 1024,
    height: 600,
    webPreferences: {
      nodeIntegration: true
    }
  });

  win.setFullScreen(config.fullscreen);
  // and load the index.html of the app.
  win.loadFile("index.html");

  // get instance of webContents for sending messages to the frontend
  const emitter = win.webContents;

  let imageFolderWatcher = new ImageFolderWatcher(
    config.imageFolder,
    config.imageCount,
    global.images,
    logger,
    emitter
  );

  let inputHandler = new inputhandler(config, emitter, logger);
  inputHandler.init();

  // generate scheduler, when times for turning monitor off and on
  // are given in the config file
  if (config.toggleMonitor) {
    let scheduler = new schedules(config, logger);
  }

  win.on("closed", () => {
    win = null;
  });
}

app.on("ready", createWindow);

// Quit when all windows are closed.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (win === null) {
    createWindow();
  }
});
