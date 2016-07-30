/**
 * Returns the last item of an array
 * @param {Array} array
 * @return {*}
 */
export function last (array) {
  return array[array.length - 1]
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
