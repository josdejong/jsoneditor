
if (typeof Element !== 'undefined') {
  // Polyfill for array remove
  (function () {
    function polyfill (item) {
      if (item.hasOwnProperty('remove')) {
        return;
      }
      Object.defineProperty(item, 'remove', {
        configurable: true,
        enumerable: true,
        writable: true,
        value: function remove() {
          if (this.parentNode != null)
            this.parentNode.removeChild(this);
        }
      });
    }

    if (typeof Element !== 'undefined')       { polyfill(Element.prototype); }
    if (typeof CharacterData !== 'undefined') { polyfill(CharacterData.prototype); }
    if (typeof DocumentType !== 'undefined')  { polyfill(DocumentType.prototype); }
  })();
}


// Polyfill for startsWith
if (!String.prototype.startsWith) {
  String.prototype.startsWith = function (searchString, position) {
    position = position || 0;
    return this.substr(position, searchString.length) === searchString;
  };
}

// Polyfill for Array.find
if (!Array.prototype.find) {
  Array.prototype.find = function(callback) {
    for (var i = 0; i < this.length; i++) {
      var element = this[i];
      if ( callback.call(this, element, i, this) ) {
        return element;
      }
    }
  }
}

// Polyfill for String.trim
if (!String.prototype.trim) {
  String.prototype.trim = function () {
    return this.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
  };
}
