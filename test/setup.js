import { JSDOM } from 'jsdom'

/**
 * Set up the test environment by simulating browser globals.
 * @param {string} [locale=en] A locale to set in navigator.language
 * @return {void}
 */
function setUpTestEnvironment (locale) {
  if (!locale) {
    locale = 'en'
  }

  const dom = new JSDOM('...')
  global.window = dom.window
  global.document = dom.window.document
  global.navigator = dom.window.navigator

  // JSDom has no setter defined for navigator.language, so defineProperty is necessary in order to override it
  Object.defineProperty(navigator, 'language', { value: locale })
};

setUpTestEnvironment()
