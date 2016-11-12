/**
 * Get the inner text of an HTML element (for example a div element)
 * @param {Element} element
 * @param {Object} [buffer]
 * @return {String} innerText
 */
export function getInnerText (element, buffer) {
  var first = (buffer == undefined)
  if (first) {
    buffer = {
      'text': '',
      'flush': function () {
        var text = this.text
        this.text = ''
        return text
      },
      'set': function (text) {
        this.text = text
      }
    }
  }

  // text node
  if (element.nodeValue) {
    return buffer.flush() + element.nodeValue
  }

  // divs or other HTML elements
  if (element.hasChildNodes()) {
    var childNodes = element.childNodes
    var innerText = ''

    for (var i = 0, iMax = childNodes.length; i < iMax; i++) {
      var child = childNodes[i]

      if (child.nodeName == 'DIV' || child.nodeName == 'P') {
        var prevChild = childNodes[i - 1]
        var prevName = prevChild ? prevChild.nodeName : undefined
        if (prevName && prevName != 'DIV' && prevName != 'P' && prevName != 'BR') {
          innerText += '\n'
          buffer.flush()
        }
        innerText += getInnerText(child, buffer)
        buffer.set('\n')
      }
      else if (child.nodeName == 'BR') {
        innerText += buffer.flush()
        buffer.set('\n')
      }
      else {
        innerText += getInnerText(child, buffer)
      }
    }

    return innerText
  }
  else {
    if (element.nodeName == 'P' && getInternetExplorerVersion() != -1) {
      // On Internet Explorer, a <p> with hasChildNodes()==false is
      // rendered with a new line. Note that a <p> with
      // hasChildNodes()==true is rendered without a new line
      // Other browsers always ensure there is a <br> inside the <p>,
      // and if not, the <p> does not render a new line
      return buffer.flush()
    }
  }

  // br or unknown
  return ''
}



/**
 * Find the parent node of an element which has an attribute with given value.
 * Can return the element itself too.
 * @param {Element} elem
 * @param {string} attr
 * @param {string} value
 * @return {Element | null} Returns the parent element when found,
 *                          or null otherwise
 */
export function findParentNode (elem, attr, value) {
  let parent = elem

  while (parent && parent.getAttribute) {
    if (parent.getAttribute(attr) == value) {
      return parent
    }
    parent = parent.parentNode
  }

  return null
}

/**
 * Test whether the child rect fits completely inside the parent rect.
 * @param {ClientRect} parent
 * @param {ClientRect} child
 * @param {number} [margin=0]
 */
export function insideRect (parent, child, margin = 0) {
  return child.left   - margin >= parent.left
      && child.right  + margin <= parent.right
      && child.top    - margin >= parent.top
      && child.bottom + margin <= parent.bottom
}

/**
 * Returns the version of Internet Explorer or a -1
 * (indicating the use of another browser).
 * Source: http://msdn.microsoft.com/en-us/library/ms537509(v=vs.85).aspx
 * @return {Number} Internet Explorer version, or -1 in case of an other browser
 */
export function getInternetExplorerVersion() {
  if (_ieVersion == -1) {
    var rv = -1 // Return value assumes failure.
    if (navigator.appName == 'Microsoft Internet Explorer')
    {
      var ua = navigator.userAgent
      var re  = new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})")
      if (re.exec(ua) != null) {
        rv = parseFloat( RegExp.$1 )
      }
    }

    _ieVersion = rv
  }

  return _ieVersion
}

/**
 * cached internet explorer version
 * @type {Number}
 * @private
 */
var _ieVersion = -1
