let VanillaPicker

if (window.Picker) {
  // use the already loaded instance of VanillaPicker
  VanillaPicker = window.Picker
} else {
  try {
    // load color picker
    VanillaPicker = require('vanilla-picker')
  } catch (err) {
    // probably running the minimalist bundle
  }
}

module.exports = VanillaPicker
