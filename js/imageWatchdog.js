const fs = require("fs");
const path = require("path");

const ImageWatchdog = class {
  constructor(imageFolder, logger) {
    this.imageFolder = imageFolder;
    this.logger = logger;
  }

  newImage(src, sender, caption) {
    //handle new incoming image
    let imageMeta = {
      src: src,
      sender: sender,
      caption: caption
    };

    this.logger.info("New image recieved!, saving", src);
    this.saveImageMeta(imageMeta);
  }

  saveImageMeta(meta) {
    let self = this;
    const jsonContent = JSON.stringify(meta);
    fs.writeFile(
      path.join(this.imageFolder, meta.src + ".json"),
      jsonContent,
      "utf8",
      function(err) {
        if (err) {
          self.logger.error(
            "An error occured while writing JSON Object to File." + err
          );
          return self.logger.error(err);
        }
      }
    );
  }
};

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") {
  module.exports = ImageWatchdog;
}
