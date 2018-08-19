/**
 * Parse a JSON Pointer
 * WARNING: this is not a complete implementation
 * @param {string} pointer
 * @return {Path}
 */
export function parseJSONPointer (pointer) {
  const path = pointer.split('/')
  path.shift() // remove the first empty entry

  return path.map(p => p.replace(/~1/g, '/').replace(/~0/g, '~'))
}

/**
 * Compile a JSON Pointer
 * WARNING: this is not a complete implementation
 * @param {Path} path
 * @return {string}
 */
export function compileJSONPointer (path) {
  return path
      .map(p => '/' + String(p).replace(/~/g, '~0').replace(/\//g, '~1'))
      .join('')
}
