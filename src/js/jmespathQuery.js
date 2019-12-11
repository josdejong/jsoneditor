import jmespath from 'jmespath'
import { get, parsePath, parseString } from './util'

/**
 * Build a JMESPath query based on query options coming from the wizard
 * @param {JSON} json   The JSON document for which to build the query.
 *                      Used for context information like determining
 *                      the type of values (string or number)
 * @param {QueryOptions} queryOptions
 * @return {string} Returns a query (as string)
 */
export function createQuery (json, queryOptions) {
  const { sort, filter, projection } = queryOptions
  let query = ''

  if (filter) {
    const examplePath = filter.field !== '@'
      ? ['0'].concat(parsePath('.' + filter.field))
      : ['0']
    const exampleValue = get(json, examplePath)
    const value1 = typeof exampleValue === 'string'
      ? filter.value
      : parseString(filter.value)

    query += '[? ' +
      filter.field + ' ' +
      filter.relation + ' ' +
      '`' + JSON.stringify(value1) + '`' +
      ']'
  } else {
    query += Array.isArray(json)
      ? '[*]'
      : '@'
  }

  if (sort) {
    if (sort.direction === 'desc') {
      query += ' | reverse(sort_by(@, &' + sort.field + '))'
    } else {
      query += ' | sort_by(@, &' + sort.field + ')'
    }
  }

  if (projection) {
    if (query[query.length - 1] !== ']') {
      query += ' | [*]'
    }

    if (projection.fields.length === 1) {
      query += '.' + projection.fields[0]
    } else if (projection.fields.length > 1) {
      query += '.{' +
        projection.fields.map(value => {
          const parts = value.split('.')
          const last = parts[parts.length - 1]
          return last + ': ' + value
        }).join(', ') +
        '}'
    } else { // values.length === 0
      // ignore
    }
  }

  return query
}

/**
 * Execute a JMESPath query
 * @param {JSON} json
 * @param {string} query
 * @return {JSON} Returns the transformed JSON
 */
export function executeQuery (json, query) {
  return jmespath.search(json, query)
}
