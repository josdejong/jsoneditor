var ace
if (window.ace) {
  // use the already loaded instance of Ace
  ace = window.ace
}
else {
  try {
    // load brace
    ace = require('brace');

    // load required Ace plugins
    require('brace/mode/json');
    require('brace/ext/searchbox');
  }
  catch (err) {
    // failed to load brace (can be minimalist bundle).
    // No worries, the editor will fall back to plain text if needed.
  }
}

module.exports = ace;
