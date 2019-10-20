let ace
if (window.ace) {
  // use the already loaded instance of Ace
  ace = window.ace
} else {
  try {
    // load Ace editor
    ace = require('ace-builds/src-noconflict/ace')

    // load required Ace plugins
    require('ace-builds/src-noconflict/mode-json')
    require('ace-builds/src-noconflict/ext-searchbox')

    // embed Ace json worker
    // https://github.com/ajaxorg/ace/issues/3913
    const jsonWorkerDataUrl = require('../generated/worker-json-data-url')
    ace.config.setModuleUrl('ace/mode/json_worker', jsonWorkerDataUrl)
  } catch (err) {
    // failed to load Ace (can be minimalist bundle).
    // No worries, the editor will fall back to plain text if needed.
  }
}

module.exports = ace
