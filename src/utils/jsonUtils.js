let jsonlint = require('../assets/jsonlint/jsonlint')

/**
 * Parse JSON using the parser built-in in the browser.
 * On exception, the jsonString is validated and a detailed error is thrown.
 * @param {String} jsonString
 * @return {JSON} json
 */
export function parseJSON(jsonString) {
  try {
    return JSON.parse(jsonString)
  }
  catch (err) {
    // try to throw a more detailed error message using validate
    validate(jsonString)

    // rethrow the original error
    throw err
  }
}


/**
 * Validate a string containing a JSON object
 * This method uses JSONLint to validate the String. If JSONLint is not
 * available, the built-in JSON parser of the browser is used.
 * @param {String} jsonString   String with an (invalid) JSON object
 * @throws Error
 */
export function validate(jsonString) {
  if (jsonlint && jsonlint.parse) {
    // use embedded jsonlint
    jsonlint.parse(jsonString)
  }
  else if (window.jsonlint && window.jsonlint.parse) {
    // use global jsonlint
    window.jsonlint.parse(jsonString)
  }
  else {
    // don't use jsonlint
    JSON.parse(jsonString)
  }
}
