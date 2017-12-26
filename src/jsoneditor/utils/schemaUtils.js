
// TODO: make MAX_ERRORS configurable
export const MAX_ERRORS = 3; // maximum number of displayed errors at the bottom

/**
 * Enrich the error message of a JSON schema error
 * @param {Object} error
 * @return {Object} The improved error
 */
export function enrichSchemaError(error) {
  if (error.keyword === 'enum' && Array.isArray(error.schema)) {
    let enums = error.schema
    if (enums) {
      enums = enums.map(JSON.stringify)

      if (enums.length > 5) {
        const more = ['(' + (enums.length - 5) + ' more...)']
        enums = enums.slice(0, 5)
        enums.push(more)
      }
      error.message = 'should be equal to one of: ' + enums.join(', ')
    }
  }

  if (error.keyword === 'additionalProperties') {
    error.message = 'should NOT have additional property: ' + error.params.additionalProperty
  }

  return error
}


/**
 * Limit the number of errors.
 * If the number of errors exceeds the maximum, the tail is removed and
 * a message that there are more errors is added
 * @param {Array} errors
 * @return {Array} Returns limited items
 */
export function limitErrors (errors) {
  if (errors.length > MAX_ERRORS) {
    const hidden = errors.length - MAX_ERRORS
    let limitedErrors = errors.slice(0, MAX_ERRORS)
    limitedErrors.push('(' + hidden + ' more errors...)')
    return limitedErrors
  }

  return errors
}