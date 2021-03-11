'use strict'

const defaultFilterFunction = {
  start: function (token, match, config) {
    return match.indexOf(token) === 0
  },
  contain: function (token, match, config) {
    return match.indexOf(token) > -1
  }
}

export function autocomplete (config) {
  config = config || {}
  config.filter = config.filter || 'start'
  config.trigger = config.trigger || 'keydown'
  config.confirmKeys = config.confirmKeys || [39, 35, 9] // right, end, tab
  config.caseSensitive = config.caseSensitive || false // autocomplete case sensitive

  let fontSize = ''
  let fontFamily = ''

  const wrapper = document.createElement('div')
  wrapper.style.position = 'relative'
  wrapper.style.outline = '0'
  wrapper.style.border = '0'
  wrapper.style.margin = '0'
  wrapper.style.padding = '0'

  const dropDown = document.createElement('div')
  dropDown.className = 'autocomplete dropdown'
  dropDown.style.position = 'absolute'
  dropDown.style.visibility = 'hidden'

  let spacer
  let leftSide // <-- it will contain the leftSide part of the textfield (the bit that was already autocompleted)
  const createDropDownController = (elem, rs) => {
    let rows = []
    let ix = 0
    let oldIndex = -1

    // TODO: move this styling in JS to SCSS
    const onMouseOver = function () { this.style.backgroundColor = '#ddd' }
    const onMouseOut = function () { this.style.backgroundColor = '' }
    const onMouseDown = function () { p.hide(); p.onmouseselection(this.__hint, p.rs) }

    const p = {
      rs: rs,
      hide: function () {
        elem.style.visibility = 'hidden'
        // rs.hideDropDown();
      },
      refresh: function (token, array) {
        elem.style.visibility = 'hidden'
        ix = 0
        elem.textContent = ''
        const vph = (window.innerHeight || document.documentElement.clientHeight)
        const rect = elem.parentNode.getBoundingClientRect()
        const distanceToTop = rect.top - 6 // heuristic give 6px
        const distanceToBottom = vph - rect.bottom - 6 // distance from the browser border.

        rows = []
        const filterFn = typeof config.filter === 'function' ? config.filter : defaultFilterFunction[config.filter]

        const filtered = !filterFn ? [] : array.filter(match => filterFn(config.caseSensitive ? token : token.toLowerCase(), config.caseSensitive ? match : match.toLowerCase(), config))

        rows = filtered.map(row => {
          const divRow = document.createElement('div')
          divRow.className = 'item'
          // divRow.style.color = config.color;
          divRow.onmouseover = onMouseOver
          divRow.onmouseout = onMouseOut
          divRow.onmousedown = onMouseDown
          divRow.__hint = row
          divRow.textContent = ''
          divRow.appendChild(document.createTextNode(row.substring(0, token.length)))
          const b = document.createElement('b')
          b.appendChild(document.createTextNode(row.substring(token.length)))
          divRow.appendChild(b)
          elem.appendChild(divRow)
          return divRow
        })

        if (rows.length === 0) {
          return // nothing to show.
        }
        if (rows.length === 1 && ((token.toLowerCase() === rows[0].__hint.toLowerCase() && !config.caseSensitive) ||
                                           (token === rows[0].__hint && config.caseSensitive))) {
          return // do not show the dropDown if it has only one element which matches what we have just displayed.
        }

        if (rows.length < 2) return
        p.highlight(0)

        if (distanceToTop > distanceToBottom * 3) { // Heuristic (only when the distance to the to top is 4 times more than distance to the bottom
          elem.style.maxHeight = distanceToTop + 'px' // we display the dropDown on the top of the input text
          elem.style.top = ''
          elem.style.bottom = '100%'
        } else {
          elem.style.top = '100%'
          elem.style.bottom = ''
          elem.style.maxHeight = distanceToBottom + 'px'
        }
        elem.style.visibility = 'visible'
      },
      highlight: function (index) {
        if (oldIndex !== -1 && rows[oldIndex]) {
          rows[oldIndex].className = 'item'
        }
        rows[index].className = 'item hover'
        oldIndex = index
      },
      move: function (step) { // moves the selection either up or down (unless it's not possible) step is either +1 or -1.
        if (elem.style.visibility === 'hidden') return '' // nothing to move if there is no dropDown. (this happens if the user hits escape and then down or up)
        if (ix + step === -1 || ix + step === rows.length) return rows[ix].__hint // NO CIRCULAR SCROLLING.
        ix += step
        p.highlight(ix)
        return rows[ix].__hint// txtShadow.value = uRows[uIndex].__hint ;
      },
      onmouseselection: function () { } // it will be overwritten.
    }
    return p
  }

  function setEndOfContenteditable (contentEditableElement) {
    let range, selection
    if (document.createRange) {
      // Firefox, Chrome, Opera, Safari, IE 9+
      range = document.createRange()// Create a range (a range is a like the selection but invisible)
      range.selectNodeContents(contentEditableElement)// Select the entire contents of the element with the range
      range.collapse(false)// collapse the range to the end point. false means collapse to end rather than the start
      selection = window.getSelection()// get the selection object (allows you to change selection)
      selection.removeAllRanges()// remove any selections already made
      selection.addRange(range)// make the range you have just created the visible selection
    } else if (document.selection) {
      // IE 8 and lower
      range = document.body.createTextRange()// Create a range (a range is a like the selection but invisible)
      range.moveToElementText(contentEditableElement)// Select the entire contents of the element with the range
      range.collapse(false)// collapse the range to the end point. false means collapse to end rather than the start
      range.select()// Select the range (make it the visible selection
    }
  }

  function calculateWidthForText (text) {
    if (spacer === undefined) { // on first call only.
      spacer = document.createElement('span')
      spacer.style.visibility = 'hidden'
      spacer.style.position = 'fixed'
      spacer.style.outline = '0'
      spacer.style.margin = '0'
      spacer.style.padding = '0'
      spacer.style.border = '0'
      spacer.style.left = '0'
      spacer.style.whiteSpace = 'pre'
      spacer.style.fontSize = fontSize
      spacer.style.fontFamily = fontFamily
      spacer.style.fontWeight = 'normal'
      document.body.appendChild(spacer)
    }

    spacer.textContent = text
    return spacer.getBoundingClientRect().right
  }

  const rs = {
    onArrowDown: function () { }, // defaults to no action.
    onArrowUp: function () { }, // defaults to no action.
    onEnter: function () { }, // defaults to no action.
    onTab: function () { }, // defaults to no action.
    startFrom: 0,
    options: [],
    element: null,
    elementHint: null,
    elementStyle: null,
    wrapper: wrapper, // Only to allow  easy access to the HTML elements to the final user (possibly for minor customizations)
    show: function (element, startPos, options) {
      this.startFrom = startPos
      this.wrapper.remove()
      if (this.elementHint) {
        this.elementHint.remove()
        this.elementHint = null
      }

      if (fontSize === '') {
        fontSize = window.getComputedStyle(element).getPropertyValue('font-size')
      }
      if (fontFamily === '') {
        fontFamily = window.getComputedStyle(element).getPropertyValue('font-family')
      }

      dropDown.style.marginLeft = '0'
      dropDown.style.marginTop = element.getBoundingClientRect().height + 'px'
      this.options = options.map(String)

      if (this.element !== element) {
        this.element = element
        this.elementStyle = {
          zIndex: this.element.style.zIndex,
          position: this.element.style.position,
          backgroundColor: this.element.style.backgroundColor,
          borderColor: this.element.style.borderColor
        }
      }

      this.element.style.zIndex = 3
      this.element.style.position = 'relative'
      this.element.style.backgroundColor = 'transparent'
      this.element.style.borderColor = 'transparent'

      this.elementHint = element.cloneNode()
      this.elementHint.className = 'autocomplete hint'
      this.elementHint.style.zIndex = 2
      this.elementHint.style.position = 'absolute'
      this.elementHint.onfocus = () => { this.element.focus() }

      if (this.element.addEventListener) {
        this.element.removeEventListener('keydown', keyDownHandler)
        this.element.addEventListener('keydown', keyDownHandler, false)
        this.element.removeEventListener('blur', onBlurHandler)
        this.element.addEventListener('blur', onBlurHandler, false)
      }

      wrapper.appendChild(this.elementHint)
      wrapper.appendChild(dropDown)
      element.parentElement.appendChild(wrapper)

      this.repaint(element)
    },
    setText: function (text) {
      this.element.innerText = text
    },
    getText: function () {
      return this.element.innerText
    },
    hideDropDown: function () {
      this.wrapper.remove()
      if (this.elementHint) {
        this.elementHint.remove()
        this.elementHint = null
        dropDownController.hide()
        this.element.style.zIndex = this.elementStyle.zIndex
        this.element.style.position = this.elementStyle.position
        this.element.style.backgroundColor = this.elementStyle.backgroundColor
        this.element.style.borderColor = this.elementStyle.borderColor
      }
    },
    repaint: function (element) {
      let text = element.innerText
      text = text.replace('\n', '')

      const optionsLength = this.options.length

      // breaking text in leftSide and token.

      const token = text.substring(this.startFrom)
      leftSide = text.substring(0, this.startFrom)

      for (let i = 0; i < optionsLength; i++) {
        const opt = this.options[i]
        if ((!config.caseSensitive && opt.toLowerCase().indexOf(token.toLowerCase()) === 0) ||
                    (config.caseSensitive && opt.indexOf(token) === 0)) { // <-- how about upperCase vs. lowercase
          this.elementHint.innerText = leftSide + token + opt.substring(token.length)
          this.elementHint.realInnerText = leftSide + opt
          break
        }
      }
      // moving the dropDown and refreshing it.
      dropDown.style.left = calculateWidthForText(leftSide) + 'px'
      dropDownController.refresh(token, this.options)
      this.elementHint.style.width = calculateWidthForText(this.elementHint.innerText) + 10 + 'px'
      const wasDropDownHidden = (dropDown.style.visibility === 'hidden')
      if (!wasDropDownHidden) { this.elementHint.style.width = calculateWidthForText(this.elementHint.innerText) + dropDown.clientWidth + 'px' }
    }
  }

  const dropDownController = createDropDownController(dropDown, rs)

  const keyDownHandler = function (e) {
    // console.log("Keydown:" + e.keyCode);
    e = e || window.event
    const keyCode = e.keyCode

    if (this.elementHint == null) return

    if (keyCode === 33) { return } // page up (do nothing)
    if (keyCode === 34) { return } // page down (do nothing);

    if (keyCode === 27) { // escape
      rs.hideDropDown()
      rs.element.focus()
      e.preventDefault()
      e.stopPropagation()
      return
    }

    let text = this.element.innerText
    text = text.replace('\n', '')

    if (config.confirmKeys.indexOf(keyCode) >= 0) { //  (autocomplete triggered)
      if (keyCode === 9) {
        if (this.elementHint.innerText.length === 0) {
          rs.onTab()
        }
      }
      if (this.elementHint.innerText.length > 0) { // if there is a hint
        if (this.element.innerText !== this.elementHint.realInnerText) {
          this.element.innerText = this.elementHint.realInnerText
          rs.hideDropDown()
          setEndOfContenteditable(this.element)
          if (keyCode === 9) {
            rs.element.focus()
            e.preventDefault()
            e.stopPropagation()
          }
        }
      }
      return
    }

    if (keyCode === 13) { // enter  (autocomplete triggered)
      if (this.elementHint.innerText.length === 0) { // if there is a hint
        rs.onEnter()
      } else {
        const wasDropDownHidden = (dropDown.style.visibility === 'hidden')
        dropDownController.hide()

        if (wasDropDownHidden) {
          rs.hideDropDown()
          rs.element.focus()
          rs.onEnter()
          return
        }

        this.element.innerText = this.elementHint.realInnerText
        rs.hideDropDown()
        setEndOfContenteditable(this.element)
        e.preventDefault()
        e.stopPropagation()
      }
      return
    }

    if (keyCode === 40) { // down
      const token = text.substring(this.startFrom)
      const m = dropDownController.move(+1)
      if (m === '') { rs.onArrowDown() }
      this.elementHint.innerText = leftSide + token + m.substring(token.length)
      this.elementHint.realInnerText = leftSide + m
      e.preventDefault()
      e.stopPropagation()
      return
    }

    if (keyCode === 38) { // up
      const token = text.substring(this.startFrom)
      const m = dropDownController.move(-1)
      if (m === '') { rs.onArrowUp() }
      this.elementHint.innerText = leftSide + token + m.substring(token.length)
      this.elementHint.realInnerText = leftSide + m
      e.preventDefault()
      e.stopPropagation()
    }
  }.bind(rs)

  const onBlurHandler = e => {
    rs.hideDropDown()
    // console.log("Lost focus.");
  }

  dropDownController.onmouseselection = (text, rs) => {
    rs.element.innerText = rs.elementHint.innerText = leftSide + text
    rs.hideDropDown()
    window.setTimeout(() => {
      rs.element.focus()
      setEndOfContenteditable(rs.element)
    }, 1)
  }

  return rs
}
