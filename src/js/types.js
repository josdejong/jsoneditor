/**
 * @typedef {object} QueryOptions
 * @property {FilterOptions} [filter]
 * @property {SortOptions} [sort]
 * @property {ProjectionOptions} [projection]
 */

/**
 * @typedef {object} FilterOptions
 * @property {string} field
 * @property {string} relation  Can be '==', '<', etc
 * @property {string} value
 */

/**
 * @typedef {object} SortOptions
 * @property {string} field
 * @property {string} direction   Can be 'asc' or 'desc'
 */

/**
 * @typedef {object} ProjectionOptions
 * @property {string[]} fields
 */
