
if (typeof Element !== 'undefined') {
  // Polyfill for array remove
  (() => {
    function polyfill (item) {
      if ('remove' in item) {
        return
      }
      Object.defineProperty(item, 'remove', {
        configurable: true,
        enumerable: true,
        writable: true,
        value: function remove () {
          if (this.parentNode !== undefined) { this.parentNode.removeChild(this) }
        }
      })
    }

    if (typeof window.Element !== 'undefined') { polyfill(window.Element.prototype) }
    if (typeof window.CharacterData !== 'undefined') { polyfill(window.CharacterData.prototype) }
    if (typeof window.DocumentType !== 'undefined') { polyfill(window.DocumentType.prototype) }
  })()
}

// Polyfill for Array.find
if (!Array.prototype.find) {
  // eslint-disable-next-line no-extend-native
  Array.prototype.find = function (callback) {
    for (let i = 0; i < this.length; i++) {
      const element = this[i]
      if (callback.call(this, element, i, this)) {
        return element
      }
    }
  }
}

// Polyfill for String.trim
if (!String.prototype.trim) {
  // eslint-disable-next-line no-extend-native
  String.prototype.trim = function () {
    return this.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '')
  }
}
