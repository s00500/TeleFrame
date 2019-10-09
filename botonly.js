/*
Script for only running the telegram bot to save the images and videos to
the images folder specified in the config
*/

const { logger } = require("./js/logger");
const config = require("./config/config");
const telebot = require("./js/bot");
const ImageWatchdog = require("./js/imageWatchdog");
const fs = require("fs");

logger.info("Running bot only version of TeleFrame ...");

this.images = [];

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
