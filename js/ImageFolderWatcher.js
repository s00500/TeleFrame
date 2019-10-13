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

      this.images.unshift(
        this.loadImageMeta(path.join(this.imageFolder, filename))
      );
    });

    fs.watch(
      this.imageFolder,
      (event, filename) => {
        if (
          !filename ||
          (!filename.endsWith(".jpg") && !filename.endsWith(".mp4"))
        ) {
          return;
        }

        if (event !== "rename") {
          return;
        }

        setTimeout(() => {
          this.logger.info("new image!", filename);

          const meta = this.loadImageMeta(
            path.join(this.imageFolder, filename)
          );

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
        });
      },
      2000
    );
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
    const data = fs.readFileSync(filename + ".json");
    if (!data) {
      this.logger.info(
        "An error occured while writing JSON Object to File." + err
      );
      return;
    }
    let meta = JSON.parse(data);
    meta.src = filename;
    return meta;
  }
};

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") {
  module.exports = ImageFolderWatcher;
}
