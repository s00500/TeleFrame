const fs = require("fs");
const path = require("path");

const ImageFolderWatcher = class {
  constructor(imageFolder, imageCount, images, logger, emitter) {
    this.imageFolder = imageFolder;
    this.imageCount = imageCount;
    this.images = images;
    this.logger = logger;
    this.emitter = emitter;

    //get paths of already downloaded images and build up an image array like before
    //if (fs.existsSync(this.imageFolder + "/" + "images.json")) {

    fs.readdirSync(this.imageFolder).forEach((filename) => {
      if (!filename.endsWith(".jpg") && !filename.endsWith(".mp4")) {
        return;
      }
      const imageMeta = this.loadImageMeta(
        path.join(this.imageFolder, filename)
      );
      if (imageMeta !== false) {
        this.images.unshift(imageMeta);
      }
    });

    fs.watch(this.imageFolder, (event, filename) => {
      if (
        !filename ||
        (!filename.endsWith(".jpg") && !filename.endsWith(".mp4"))
      ) {
        return;
      }

      if (event !== "rename") {
        return;
      }

      this.logger.info("new image!", filename);

      this.loadRecievedImage(filename);
    });
  }

  loadRecievedImage(filename) {
    this.logger.info("Trying to load", filename);

    const meta = this.loadImageMeta(path.join(this.imageFolder, filename));

    if (meta === false) {
      this.logger.info("No Meta found, waiting...", filename);
      setTimeout(() => {
        this.loadRecievedImage(filename);
      }, 2000);
      return;
    }

    try {
      //find name key
      this.images.forEach((imagemeta) => {
        if (imagemeta.src == meta.src) {
          throw "Meta exists";
        }
      });
    } catch (err) {
      this.logger.error(err);
      return;
    }

    this.images.unshift(meta);
    // FIXME: better solution for this!
    /*
if (this.images.length >= this.imageCount) {
  this.images.pop();
}
*/

    //notify frontend, that new image arrived
    let type;
    if (meta.src.split(".").pop() == "mp4") {
      type = "video";
    } else {
      type = "image";
    }

    if (this.emitter) {
      this.emitter.send("newImage", {
        sender: meta.sender,
        type: type
      });
    }
  }

  loadImageMeta(filename) {
    try {
      const data = fs.readFileSync(filename + ".json");

      if (!data) {
        this.logger.info(
          "An error occured while reading JSON Object to File." + err
        );
        return;
      }
      let meta = JSON.parse(data);
      meta.src = filename;
      return meta;
    } catch (error) {
      this.logger.error("no such meta yet");
      this.logger.error(error);
      return false;
    }
  }
};

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") {
  module.exports = ImageFolderWatcher;
}
