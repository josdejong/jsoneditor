var JSDOM = require('jsdom').JSDOM;

/**
 * Set up the test environment by simulating browser globals.
 * @return {void}
 */
module.exports = function setUpTestEnvironment() {
    var dom = new JSDOM('...');
    global.window = dom.window;
    global.document = dom.window.document;
};