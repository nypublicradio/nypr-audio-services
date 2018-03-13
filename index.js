/* eslint-env node */
module.exports = {
  name: 'nypr-audio-services',
  isDevelopingAddon() {
    return true;
  },
  included() {
    this._super.included.apply(this, arguments);
  }
};
