exports.tryRequireThemeJsonEditor = function () {
  try {
    require('./ace/theme-jsoneditor')
  } catch (err) {
    console.error(err)
  }
}
