// inspiration: https://github.com/andrepolischuk/keycomb

// TODO: write unit tests for keyBindings

// FIXME: implement an escape sequence for the separator +

/**
 * Get a named key from a key code.
 * For example:
 *     keyFromCode(65) returns 'A'
 *     keyFromCode(13) returns 'Enter'
 * @param {string} code
 * @return {string}
 */
export function nameFromKeyCode(code) {
  return codes[code] || ''
}

/**
 * Get the active key combination from a keyboard event.
 * For example returns "Ctrl+Shift+Up" or "Ctrl+A"
 * @param {KeyboardEvent} event
 * @return {string}
 */
export function keyComboFromEvent (event) {
  let combi = []

  if (event.ctrlKey) { combi.push('Ctrl') }
  if (event.metaKey) { combi.push('Command') }
  if (event.altKey) { combi.push(isMac ? 'Option' : 'Alt') }
  if (event.shiftKey) { combi.push('Shift') }

  const keyName = nameFromKeyCode(event.which)
  if (!metaCodes[keyName]) {  // prevent output like 'Ctrl+Ctrl'
    combi.push(keyName)
  }

  return combi.join('+')
}

/**
 * Create a function which can quickly find a keyBinding from a set of
 * keyBindings.
 * @param {Object.<String, String[]>} keyBindings
 * @return {function} Returns a findKeyBinding function
 */
export function createFindKeyBinding (keyBindings) {
  // turn the map with key bindings by name (multiple per binding) into a map by key combo
  const keyCombos = {}
  Object.keys(keyBindings).forEach ((name) => {
    keyBindings[name].forEach(combo => keyCombos[normalizeKeyCombo(combo)] = name)
  })

  return function findKeyBinding (event) {
    const keyCombo = keyComboFromEvent(event)

    return keyCombos[normalizeKeyCombo(keyCombo)] || null
  }
}

/**
 * Normalize a key combo:
 *
 * - to upper case
 * - replace aliases like "?" with "/"
 *
 * @param {string} combo
 * @return {string}
 */
function normalizeKeyCombo (combo) {
  const upper = combo.toUpperCase()

  const last = upper[upper.length - 1]
  if (last in aliases) {
    return upper.substring(0, upper.length - 1) + aliases[last]
  }

  return upper
}

const isMac = window.navigator.platform.toUpperCase().indexOf('MAC') >= 0

const metaCodes = {
  'Ctrl': true,
  'Command': true,
  'Alt': true,
  'Option': true,
  'Shift': true
}

const codes = {
  '8': 'Backspace',
  '9': 'Tab',
  '13': 'Enter',
  '16': 'Shift',
  '17': 'Ctrl',
  '18': 'Alt',
  '19': 'Pause_Break',
  '20': 'Caps_Lock',
  '27': 'Escape',
  '33': 'Page_Up',
  '34': 'Page_Down',
  '35': 'End',
  '36': 'Home',
  '37': 'Left',
  '38': 'Up',
  '39': 'Right',
  '40': 'Down',
  '45': 'Insert',
  '46': 'Delete',
  '48': '0',
  '49': '1',
  '50': '2',
  '51': '3',
  '52': '4',
  '53': '5',
  '54': '6',
  '55': '7',
  '56': '8',
  '57': '9',
  '65': 'A',
  '66': 'B',
  '67': 'C',
  '68': 'D',
  '69': 'E',
  '70': 'F',
  '71': 'G',
  '72': 'H',
  '73': 'I',
  '74': 'J',
  '75': 'K',
  '76': 'L',
  '77': 'M',
  '78': 'N',
  '79': 'O',
  '80': 'P',
  '81': 'Q',
  '82': 'R',
  '83': 'S',
  '84': 'T',
  '85': 'U',
  '86': 'V',
  '87': 'W',
  '88': 'X',
  '89': 'Y',
  '90': 'Z',
  '91': 'Left_Window_Key',
  '92': 'Right_Window_Key',
  '93': 'Select_Key',
  '96': 'Numpad_0',
  '97': 'Numpad_1',
  '98': 'Numpad_2',
  '99': 'Numpad_3',
  '100': 'Numpad_4',
  '101': 'Numpad_5',
  '102': 'Numpad_6',
  '103': 'Numpad_7',
  '104': 'Numpad_8',
  '105': 'Numpad_9',
  '106': 'Numpad_*',
  '107': 'Numpad_+',
  '109': 'Numpad_-',
  '110': 'Numpad_.',
  '111': 'Numpad_/',
  '112': 'F1',
  '113': 'F2',
  '114': 'F3',
  '115': 'F4',
  '116': 'F5',
  '117': 'F6',
  '118': 'F7',
  '119': 'F8',
  '120': 'F9',
  '121': 'F10',
  '122': 'F11',
  '123': 'F12',
  '144': 'Num_Lock',
  '145': 'Scroll_Lock',
  '186': ';',
  '187': '=',
  '188': ',',
  '189': '-',
  '190': '.',
  '191': '/',
  '192': '`',
  '219': '[',
  '220': '\\',
  '221': ']',
  '222': '\''
}

// all secondary characters of the keyboard buttons (used via Shift)
const aliases = {
  '~': '`',
  '!': '1',
  '@': '2',
  '#': '3',
  '$': '4',
  '%': '5',
  '^': '6',
  '&': '7',
  '*': '8',
  '(': '9',
  ')': '0',
  '_': '-',
  '+': '=',
  '{': '[',
  '}': ']',
  '|': '\\',
  ':': ';',
  '"': '',
  '<': ',',
  '>': '.',
  '?': '/'
}
