const map = new WeakMap()
let counter = 0;

/**
 * Generate a unique key for an object or array (by object reference)
 * @param {Object | Array} item
 * @returns {string | null}
 *        Returns the generated key.
 *        If the item is no Object or Array, null is returned
 */
export function weakKey(item) {
  if (!item || (!Array.isArray(item) && typeof item !== 'object')) {
    return null
  }

  let k = map.get(item)

  if (!k) {
    k = 'key-' + counter
    counter++
    map.set(item, k)
  }

  return k
}
