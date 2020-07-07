import { Meteor } from 'meteor/meteor';

const fs = require('fs');

function writeImageOnDisk(imageName, base64Data) {
  const data = base64Data.replace(new RegExp('^data:image\/jpeg;base64,', 'g'), '');

  fs.writeFile(`${Meteor.settings.private.uploadPath}${imageName}.jpeg`, data, { encoding: 'base64', flag: 'w' }, (err) => {
    if (err) console.log(err);
  });
}

function removeImageOnDisk(imageName) {
  fs.unlink(`${Meteor.settings.private.uploadPath}${imageName}.jpeg`, (err) => {
    if (err) console.log(err);
  });
}

function renameImageOnDisk(originalName, newName) {
  fs.rename(`${Meteor.settings.private.uploadPath}${originalName}.jpeg`,
    `${Meteor.settings.private.uploadPath}${newName}.jpeg`, (err) => {
      if (err) console.log(err);
    });
}

module.exports = {
  writeImageOnDisk,
  removeImageOnDisk,
  renameImageOnDisk,
};
