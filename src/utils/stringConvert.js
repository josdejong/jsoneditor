
/**
 * Convert contents of a string to the correct JSON type. This can be a string,
 * a number, a boolean, etc
 * @param {String} str
 * @return {*} castedStr
 * @private
 */
export default function stringConvert (str) {
  const lower = str.toLowerCase()
  const num = Number(str)           // will nicely fail with '123ab'
  const numFloat = parseFloat(str)  // will nicely fail with '  '

  if (str == '') {
    return ''
  }
  else if (lower == 'null') {
    return null
  }
  else if (lower == 'true') {
    return true
  }
  else if (lower == 'false') {
    return false
  }
  else if (!isNaN(num) && !isNaN(numFloat)) {
    return num
  }
  else {
    return str
  }
}
