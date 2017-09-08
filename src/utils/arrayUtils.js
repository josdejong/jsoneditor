/**
 * Returns the last item of an array
 * @param {Array} array
 * @return {*}
 */
export function last (array) {
  return array[array.length - 1]
}

/**
 * Returns a copy of the array having the last item removed
 */
export function allButLast (array: []): [] {
  return array.slice(0, -1)
}

/**
 * Comparator to sort an array in ascending order
 *
 * Usage:
 *     [4,2,5].sort(compareAsc)    // [2,4,5]
 *
 * @param a
 * @param b
 * @return {number}
 */
export function compareAsc (a, b) {
  return a > b ? 1 : a < b ? -1 : 0
}

/**
 * Comparator to sort an array in ascending order
 *
 * Usage:
 *     [4,2,5].sort(compareDesc)   // [5,4,2]
 *
 * @param a
 * @param b
 * @return {number}
 */
export function compareDesc (a, b) {
  return a > b ? -1 : a < b ? 1 : 0
}

/**
 * Test whether all items of an array are strictly equal
 * @param {Array} a
 * @param {Array} b
 */
export function strictShallowEqual (a, b) {
  if (a.length !== b.length) {
    return false
  }

  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return false
    }
  }

  return true
}
