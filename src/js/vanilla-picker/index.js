var VanillaPicker;

if (window.Picker) {
  // use the already loaded instance of VanillaPicker
  VanillaPicker = window.Picker;
}
else {
  try {
    // load color picker
    // Note that we load the ES5 distribution bundle
    // instead of the "default" as the default currently
    // points to `src/picker.js` which is ES6 code (v2.3.0).
    VanillaPicker = require('vanilla-picker/dist/vanilla-picker');
  }
  catch (err) {
    // probably running the minimalist bundle
  }
}

module.exports = VanillaPicker;
