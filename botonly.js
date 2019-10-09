/*
Script for only running the telegram bot to save the images and videos to
the images folder specified in the config
*/

const { logger, rendererLogger } = require("./js/logger");
const config = require("./config/config");
const telebot = require("./js/bot");
const ImageWatchdog = require("./js/imageWatchdog");
const fs = require("fs");

logger.info("Running bot only version of TeleFrame ...");

this.images = [];
/*
    //get paths of already downloaded images
    if (fs.existsSync(this.imageFolder + "/" + "images.json")) {
      fs.readFile(this.imageFolder + "/" + "images.json", (err, data) => {
        if (err) throw err;
        let jsonData = JSON.parse(data);
        for (let image in jsonData) {
          this.images.push(jsonData[image]);
        }
      });
    } else {
      this.saveImageArray();
    }
  }
*/

// create imageWatchdog and bot
const imageWatchdog = new ImageWatchdog(
  config.imageFolder,
  config.imageCount,
  this.images,
  logger
);

const bot = new telebot(
  config.botToken,
  config.imageFolder,
  imageWatchdog,
  config.showVideos,
  config.whitelistChats,
  config.voiceReply,
  logger
);

bot.startBot();
