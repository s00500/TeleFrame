const { app, BrowserWindow, ipcMain } = require("electron");
const { logger, rendererLogger } = require("./js/logger");
const config = require("./config/config");
const telebot = require("./js/bot");
const imagewatcher = require("./js/imageWatchdog");
const inputhandler = require("./js/inputHandler");
const voicerecorder = require("./js/voiceRecorder");
const schedules = require("./js/schedules");

global.config = config;
global.rendererLogger = rendererLogger;
global.images = [];

logger.info("Main app started ...");

app.commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required");
let win;

function createWindow() {
  win = new BrowserWindow({
    width: 1024,
    height: 600,
    webPreferences: {
      nodeIntegration: true
    }
  });

  win.setFullScreen(config.fullscreen);
  win.loadFile("index.html");

  const emitter = win.webContents;

  const imageWatchdog = new imagewatcher(
    config.imageFolder,
    config.imageCount,
    global.images,
    logger,
    emitter
  );

  const bot = new telebot(
    config.botToken,
    config.imageFolder,
    imageWatchdog,
    config.showVideos,
    config.whitelistChats,
    config.voiceReply,
    logger,
    emitter
  );

  const inputHandler = new inputhandler(config, emitter, logger);
  inputHandler.init();

  if (config.voiceReply !== null) {
    const voiceReply = new voicerecorder(config, emitter, bot, logger, ipcMain);
    voiceReply.init();
  }

  // generate scheduler, when times for turning monitor off and on
  // are given in the config file
  if (config.toggleMonitor) {
    const scheduler = new schedules(config, logger);
  }

  // Open the DevTools.
  // win.webContents.openDevTools()
  bot.startBot();

  win.on("closed", () => {
    win = null;
  });
}

app.on("ready", createWindow);

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
