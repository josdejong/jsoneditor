var isPromise = require('./util').isPromise;
var isValidValidationError = require('./util').isValidValidationError;
var stringifyPath = require('./util').stringifyPath;

/**
 * Execute custom validation if configured.
 *
 * Returns a promise resolving with the custom errors (or an empty array).
 */
function validateCustom (json, onValidate) {
  if (!onValidate) {
    return Promise.resolve([]);
  }

  try {
    var customValidateResults = onValidate(json);

    var resultPromise = isPromise(customValidateResults)
        ? customValidateResults
        : Promise.resolve(customValidateResults);

    return resultPromise.then(function (customValidationPathErrors) {
      if (Array.isArray(customValidationPathErrors)) {
        return customValidationPathErrors
            .filter(function (error) {
              var valid = isValidValidationError(error);

              if (!valid) {
                console.warn('Ignoring a custom validation error with invalid structure. ' +
                    'Expected structure: {path: [...], message: "..."}. ' +
                    'Actual error:', error);
              }

              return valid;
            })
            .map(function (error) {
              // change data structure into the structure matching the JSON schema errors
              return {
                dataPath: stringifyPath(error.path),
                message: error.message
              }
            });
      }
      else {
        return [];
      }
    });
  }
  catch (err) {
    return Promise.reject(err);
  }
}

exports.validateCustom = validateCustom;
