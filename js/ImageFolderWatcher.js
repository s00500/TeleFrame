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
      if (!filename.endsWith(".json")) {
        return;
      }
      this.images.unshift(
        this.loadImageMeta(path.join(this.imageFolder, filename))
      );
    });

    fs.watch(this.imageFolder, (event, filename) => {
      if (!filename || !filename.endsWith(".json")) {
        return;
      }
      this.logger.info("new image metadata!");

      // TODO: Should check if already exists
      const meta = this.loadImageMeta(path.join(this.imageFolder, filename));
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

      this.emitter.send("newImage", {
        sender: meta.sender,
        type: type
      });
    });
  }
  /*
  newImage(src, sender, caption) {
    //handle new incoming image
    let imageMeta = {
      src: src,
      sender: sender,
      caption: caption
    };

    // FIXME: better solution for this!
    /*
    if (this.images.length >= this.imageCount) {
      this.images.pop();
    }
    * /
    //notify frontend, that new image arrived
    let type;
    if (src.split(".").pop() == "mp4") {
      type = "video";
    } else {
      type = "image";
    }
    this.logger.info("New image recieved!");
    if (this.emmiter) {
      this.emitter.send("newImage", {
        sender: sender,
        type: type
      });
    }
    this.saveImageMeta(imageMeta);
    this.images.unshift(imageMeta);
  }
      */

  loadImageMeta(filename) {
    const data = fs.readFileSync(filename);
    if (!data) {
      this.logger.info(
        "An error occured while writing JSON Object to File." + err
      );
      return;
    }
    return JSON.parse(data);
  }
};

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") {
  module.exports = ImageFolderWatcher;
}
