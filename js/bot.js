const Telegraf = require("telegraf");
const Telegram = require("telegraf/telegram");
const download = require("image-downloader");
const path = require("path");
const fs = require(`fs`);

let Bot = class {
  constructor(
    botToken,
    imageFolder,
    imageWatchdog,
    showVideo,
    whitelistChats,
    voiceReply,
    logger,
    emitter
  ) {
    let self = this;
    this.bot = new Telegraf(botToken);
    this.telegram = new Telegram(botToken);
    this.logger = logger;
    this.imageFolder = imageFolder;
    this.imageWatchdog = imageWatchdog;
    this.showVideo = showVideo;
    this.whitelistChats = whitelistChats;
    this.voiceReply = voiceReply;
    this.emitter = emitter;

    //get bot name
    this.bot.telegram.getMe().then((botInfo) => {
      this.bot.options.username = botInfo.username;
      this.logger.info(
        "Using bot with name " + this.bot.options.username + "."
      );
    });

    //Welcome message on bot start
    this.bot.start((ctx) => ctx.reply("Welcome"));

    //Help message
    this.bot.help((ctx) => ctx.reply("Send me an image."));

    //Bot Commands
    this.bot.command("?", (ctx) => {
      if (this.whitelistCheck(ctx)) return;
      ctx.reply("Yes I am online.");
    });

    this.bot.command("lastpicture", (ctx) => {
      if (this.whitelistCheck(ctx)) return;
      //send msg to renderer
      this.emitter.send("lastpicture");
    });

    this.bot.command("next", (ctx) => {
      if (this.whitelistCheck(ctx)) return;
      //send msg to renderer
      this.emitter.send("next");
    });

    this.bot.command("prev", (ctx) => {
      if (this.whitelistCheck(ctx)) return;
      //send msg to renderer
      this.emitter.send("previous");
    });

    this.bot.command("pause", (ctx) => {
      if (this.whitelistCheck(ctx)) return;
      //send msg to renderer
      this.emitter.send("pause");
    });

    this.bot.command("play", (ctx) => {
      if (this.whitelistCheck(ctx)) return;
      //send msg to renderer
      this.emitter.send("play");
    });

    this.bot.command("play?", (ctx) => {
      if (this.whitelistCheck(ctx)) return;
      //return current playing status
      //this.emitter.send("play");
    });

    //Help message
    this.bot.help((ctx) => ctx.reply("Send me an image."));

    //Download incoming photo
    this.bot.on("photo", (ctx) => {
      if (this.whitelistCheck(ctx)) return;

      this.telegram
        .getFileLink(ctx.message.photo[ctx.message.photo.length - 1].file_id)
        .then((link) => {
          download
            .image({
              url: link,
              dest:
                this.imageFolder + "/" + Math.floor(Date.now() / 1000) + ".jpg"
            })
            .then(({ filename, image }) => {
              let chatName = "";
              if (ctx.message.chat.type == "group") {
                chatName = ctx.message.chat.title;
              } else if (ctx.message.chat.type == "private") {
                chatName = ctx.message.from.first_name;
              }
              this.newImage(
                path.basename(filename),
                ctx.message.from.first_name,
                ctx.message.caption,
                ctx.message.chat.id,
                chatName,
                ctx.message.message_id
              );
            })
            .catch((err) => {
              this.logger.error(err);
            });
        });
    });

    //Download incoming video
    this.bot.on("video", (ctx) => {
      if (this.whitelistCheck(ctx)) return;

      if (this.showVideo) {
        this.telegram.getFileLink(ctx.message.video.file_id).then((link) => {
          download
            .image({
              url: link,
              dest:
                this.imageFolder + "/" + Math.floor(Date.now() / 1000) + ".mp4"
            })
            .then(({ filename, image }) => {
              let chatName = "";
              if (ctx.message.chat.type == "group") {
                chatName = ctx.message.chat.title;
              } else if (ctx.message.chat.type == "private") {
                chatName = ctx.message.from.first_name;
              }
              this.newImage(
                path.basename(filename),
                ctx.message.from.first_name,
                ctx.message.caption,
                ctx.message.chat.id,
                chatName,
                ctx.message.message_id
              );
            })
            .catch((err) => {
              this.logger.error(err);
            });
        });
      }
    });

    this.bot.catch((err) => {
      this.logger.error(err);
    });

    //Some small conversation
    this.bot.hears(/hi/i, (ctx) => {
      ctx.reply(
        `Hey there ${ctx.chat.first_name} \n Your ChatID is ${ctx.chat.id}`
      );
      this.logger.info(ctx.chat);
    });

    this.logger.info("Bot created!");
  }

  startBot() {
    //Start bot
    let self = this;
    this.bot.startPolling(30, 100, null, () =>
      setTimeout(() => self.startBot(), 30000)
    );
    this.logger.info("Bot started!");
  }

  whitelistCheck(ctx) {
    if (
      !(
        this.whitelistChats.length > 0 &&
        this.whitelistChats.indexOf(ctx.update.message.from.id) !== -1
      )
    ) {
      console.log(
        "Whitelist triggered:",
        ctx.update.message.from.id,
        this.whitelistChats,
        this.whitelistChats.indexOf(ctx.update.message.from.id)
      );
      ctx.reply(
        "Hey there, this bot is whitelisted, pls add your chat id to the config file"
      );
      return true;
    }
    return false;
  }

  newImage(src, sender, caption) {
    //tell imageWatchdog that a new image arrived
    this.imageWatchdog.newImage(src, sender, caption);
  }

  sendMessage(message) {
    // function to send messages, used for whitlist handling
    return this.bot.telegram.sendMessage(this.whitelistChats[0], message);
  }

  sendAudio(filename, chatId, messageId) {
    // function to send recorded audio as voice reply
    fs.readFile(
      filename,
      function(err, data) {
        if (err) {
          this.logger.error(err);
          return;
        }
        this.telegram
          .sendVoice(
            chatId,
            {
              source: data
            },
            {
              reply_to_message_id: messageId
            }
          )
          .then(() => {
            this.logger.info("success");
          })
          .catch((err) => {
            this.logger.error(err);
          });
      }.bind(this)
    );
  }
};

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") {
  module.exports = Bot;
}
