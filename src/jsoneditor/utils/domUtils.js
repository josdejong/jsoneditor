/**
 * Get the inner text of an HTML element (for example a div element)
 * @param {Element} element
 * @param {Object} [buffer]
 * @return {String} innerText
 */
export function getInnerText (element, buffer) {
  const first = (buffer === undefined)
  if (first) {
    buffer = {
      'text': '',
      'flush': function () {
        const text = this.text
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
    const childNodes = element.childNodes
    let innerText = ''

    for (let i = 0, iMax = childNodes.length; i < iMax; i++) {
      const child = childNodes[i]

      if (child.nodeName === 'DIV' || child.nodeName === 'P') {
        const prevChild = childNodes[i - 1]
        const prevName = prevChild ? prevChild.nodeName : undefined
        if (prevName && prevName !== 'DIV' && prevName !== 'P' && prevName !== 'BR') {
          innerText += '\n'
          buffer.flush()
        }
        innerText += getInnerText(child, buffer)
        buffer.set('\n')
      }
      else if (child.nodeName === 'BR') {
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
    if (element.nodeName === 'P' && getInternetExplorerVersion() !== -1) {
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
 * Get text selection
 * http://stackoverflow.com/questions/4687808/contenteditable-selected-text-save-and-restore
 * @return {Range | TextRange | null} range
 */
export function getSelection() {
  if (window.getSelection) {
    const sel = window.getSelection()
    if (sel.getRangeAt && sel.rangeCount) {
      return sel.getRangeAt(0)
    }
  }

  return null
}

/**
 * Select all text of a content editable div.
 * http://stackoverflow.com/a/3806004/1262753
 * @param {Element} contentEditableElement   A content editable div
 */
export function selectContentEditable(contentEditableElement) {
  if (!contentEditableElement || contentEditableElement.nodeName !== 'DIV') {
    return
  }

  if (window.getSelection && document.createRange) {
    const range = document.createRange();
    range.selectNodeContents(contentEditableElement)
    const sel = window.getSelection()
    sel.removeAllRanges()
    sel.addRange(range)
  }
}

/**
 * Find the parent node of an element which has an attribute with given value.
 * Can return the element itself too.
 * @param {Element} elem
 * @param {string} attribute
 * @param {string} [value]
 * @return {Element | null} Returns the parent element when found,
 *                          or null otherwise
 */
export function findParentWithAttribute (elem, attribute, value) {
  let parent = elem

  while (parent && parent.getAttribute) {
    const match = (value === undefined)
        ? parent.hasAttribute(attribute)
        : parent.getAttribute(attribute) === value

    if (match) {
      return parent
    }

    parent = parent.parentNode
  }

  return null
}

/**
 * Find the first parent element having a specific class name
 * @param {Element} element
 * @param {string} className
 * @return {Element} Returns the base element of the node
 */
export function findParentWithClassName (element, className) {
  let parent = element

  while (parent) {
    if (hasClassName(parent, className)) {
      return parent
    }

    parent = parent.parentNode
  }

  return null
}

/**
 * Test whether a HTML element contains a specific className
 * @param {Element} element
 * @param {boolean} className
 * @return {boolean}
 */
export function hasClassName (element, className) {
  return element && element.className && element.className.split
      ? element.className.split(' ').indexOf(className) !== -1
      : false
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
  if (_ieVersion === -1) {
    let rv = -1 // Return value assumes failure.
    if (navigator.appName === 'Microsoft Internet Explorer')
    {
      const ua = navigator.userAgent
      const re  = new RegExp("MSIE ([0-9]{1,}[.0-9]{0,})")
      if (re.exec(ua) !== null) {
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
let _ieVersion = -1
