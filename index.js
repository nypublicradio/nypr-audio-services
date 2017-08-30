/* jshint node: true */
'use strict';

module.exports = {
  name: 'nypr-audio-services',
  isDevelopingAddon() {
    return true;
  },
  included() {
    this._super.included.apply(this, arguments);
  }
};
