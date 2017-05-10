/*jshint node:true*/
module.exports = {
  description: '',
  normalizeEntityName: function() {},
  // locals: function(options) {
  //   // Return custom template variables here.
  //   return {
  //     foo: options.entity.options.foo
  //   };
  // }
  afterInstall: function() {
    return this.addAddonsToProject({
       // a packages array defines the addons to install
       packages: [
         {name: 'ember-hifi'},
         {name: 'nypr-player'}
       ]
     });
  }
};
