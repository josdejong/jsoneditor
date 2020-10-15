exports.tryRequireAjv = function () {
  try {
    return require('ajv')
  } catch (err) {
    // no problem... when we need Ajv we will throw a neat exception
  }
}
