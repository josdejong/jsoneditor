
// module exports
var jsoneditor = {
  'JSONEditor': JSONEditor,
  'JSONFormatter': function () {
    throw new Error('JSONFormatter is deprecated. ' +
        'Use JSONEditor with mode "text" or "code" instead');
  },
  'util': util
};

/**
 * load jsoneditor.css
 */
var loadCss = function () {
  // find the script named 'jsoneditor.js' or 'jsoneditor-min.js' or
  // 'jsoneditor.min.js', and use its path to find the css file to be
  // loaded.
  var scripts = document.getElementsByTagName('script');
  for (var s = 0; s < scripts.length; s++) {
    var src = scripts[s].src;
    if (/(^|\/)jsoneditor([-\.]min)?.js$/.test(src)) {
      var jsFile = src.split('?')[0];
      var cssFile = jsFile.substring(0, jsFile.length - 2) + 'css';

      // load css file
      var link = document.createElement('link');
      link.type = 'text/css';
      link.rel = 'stylesheet';
      link.href = cssFile;
      document.getElementsByTagName('head')[0].appendChild(link);

      break;
    }
  }
};

/**
 * CommonJS module exports
 */
if (typeof(module) != 'undefined' && typeof(exports) != 'undefined') {
  loadCss();
  module.exports = exports = jsoneditor;
}

/**
 * AMD module exports
 */
if (typeof(require) != 'undefined' && typeof(define) != 'undefined') {
  loadCss();
  define(function () {
    return jsoneditor;
  });
}
else {
  // attach the module to the window, load as a regular javascript file
  window['jsoneditor'] = jsoneditor;
}
