const { app, BrowserWindow, ipcMain } = require("electron");
const { logger, rendererLogger } = require("./js/logger");
const config = require("./config/config");
const imagewatcher = require("./js/imageWatchdog");
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

  // create imageWatchdog and bot
  var imageWatchdog = new imagewatcher(
    config.imageFolder,
    config.imageCount,
    global.images,
    emitter,
    logger
  );

  var inputHandler = new inputhandler(config, emitter, logger);
  inputHandler.init();

  /*
  var bot = new telebot(
    config.botToken,
    config.imageFolder,
    imageWatchdog,
    config.showVideos,
    config.whitelistChats,
    config.voiceReply,
    emitter,
    logger
  );


  if (config.voiceReply !== null) {
    var voiceReply = new voicerecorder(config, emitter, bot, logger, ipcMain);
    voiceReply.init();
  }
*/
  // generate scheduler, when times for turning monitor off and on
  // are given in the config file
  if (config.toggleMonitor) {
    var scheduler = new schedules(config, logger);
  }

  // Open the DevTools.
  // win.webContents.openDevTools()
  bot.startBot();

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
