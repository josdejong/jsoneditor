'use strict'
import { translate } from './i18n'

/**
 * @constructor SearchBox
 * Create a search box in given HTML container
 * @param {JSONEditor} editor    The JSON Editor to attach to
 * @param {Element} container               HTML container element of where to
 *                                          create the search box
 */
export class SearchBox {
  constructor (editor, container) {
    const searchBox = this

    this.editor = editor
    this.timeout = undefined
    this.delay = 200 // ms
    this.lastText = undefined
    this.results = null

    this.dom = {}
    this.dom.container = container

    const wrapper = document.createElement('div')
    this.dom.wrapper = wrapper
    wrapper.className = 'jsoneditor-search'
    container.appendChild(wrapper)

    const results = document.createElement('div')
    this.dom.results = results
    results.className = 'jsoneditor-results'
    wrapper.appendChild(results)

    const divInput = document.createElement('div')
    this.dom.input = divInput
    divInput.className = 'jsoneditor-frame'
    divInput.title = translate('searchTitle')
    wrapper.appendChild(divInput)

    const refreshSearch = document.createElement('button')
    refreshSearch.type = 'button'
    refreshSearch.className = 'jsoneditor-refresh'
    divInput.appendChild(refreshSearch)

    const search = document.createElement('input')
    search.type = 'text'
    this.dom.search = search
    search.oninput = event => {
      searchBox._onDelayedSearch(event)
    }
    search.onchange = event => {
      // For IE 9
      searchBox._onSearch()
    }
    search.onkeydown = event => {
      searchBox._onKeyDown(event)
    }
    search.onkeyup = event => {
      searchBox._onKeyUp(event)
    }
    refreshSearch.onclick = event => {
      search.select()
    }

    // TODO: ESC in FF restores the last input, is a FF bug, https://bugzilla.mozilla.org/show_bug.cgi?id=598819
    divInput.appendChild(search)

    const searchNext = document.createElement('button')
    searchNext.type = 'button'
    searchNext.title = translate('searchNextResultTitle')
    searchNext.className = 'jsoneditor-next'
    searchNext.onclick = () => {
      searchBox.next()
    }

    divInput.appendChild(searchNext)

    const searchPrevious = document.createElement('button')
    searchPrevious.type = 'button'
    searchPrevious.title = translate('searchPreviousResultTitle')
    searchPrevious.className = 'jsoneditor-previous'
    searchPrevious.onclick = () => {
      searchBox.previous()
    }

    divInput.appendChild(searchPrevious)
  }

  /**
   * Go to the next search result
   * @param {boolean} [focus]   If true, focus will be set to the next result
   *                            focus is false by default.
   */
  next (focus) {
    if (this.results) {
      let index = this.resultIndex !== null ? this.resultIndex + 1 : 0
      if (index > this.results.length - 1) {
        index = 0
      }
      this._setActiveResult(index, focus)
    }
  }

  /**
   * Go to the prevous search result
   * @param {boolean} [focus]   If true, focus will be set to the next result
   *                            focus is false by default.
   */
  previous (focus) {
    if (this.results) {
      const max = this.results.length - 1
      let index = this.resultIndex !== null ? this.resultIndex - 1 : max
      if (index < 0) {
        index = max
      }
      this._setActiveResult(index, focus)
    }
  }

  /**
   * Set new value for the current active result
   * @param {Number} index
   * @param {boolean} [focus]   If true, focus will be set to the next result.
   *                            focus is false by default.
   * @private
   */
  _setActiveResult (index, focus) {
    // de-activate current active result
    if (this.activeResult) {
      const prevNode = this.activeResult.node
      const prevElem = this.activeResult.elem
      if (prevElem === 'field') {
        delete prevNode.searchFieldActive
      } else {
        delete prevNode.searchValueActive
      }
      prevNode.updateDom()
    }

    if (!this.results || !this.results[index]) {
      // out of range, set to undefined
      this.resultIndex = undefined
      this.activeResult = undefined
      return
    }

    this.resultIndex = index

    // set new node active
    const node = this.results[this.resultIndex].node
    const elem = this.results[this.resultIndex].elem
    if (elem === 'field') {
      node.searchFieldActive = true
    } else {
      node.searchValueActive = true
    }
    this.activeResult = this.results[this.resultIndex]
    node.updateDom()

    // TODO: not so nice that the focus is only set after the animation is finished
    node.scrollTo(() => {
      if (focus) {
        node.focus(elem)
      }
    })
  }

  /**
   * Cancel any running onDelayedSearch.
   * @private
   */
  _clearDelay () {
    if (this.timeout !== undefined) {
      clearTimeout(this.timeout)
      delete this.timeout
    }
  }

  /**
   * Start a timer to execute a search after a short delay.
   * Used for reducing the number of searches while typing.
   * @param {Event} event
   * @private
   */
  _onDelayedSearch (event) {
    // execute the search after a short delay (reduces the number of
    // search actions while typing in the search text box)
    this._clearDelay()
    const searchBox = this
    this.timeout = setTimeout(event => {
      searchBox._onSearch()
    }, this.delay)
  }

  /**
   * Handle onSearch event
   * @param {boolean} [forceSearch]  If true, search will be executed again even
   *                                 when the search text is not changed.
   *                                 Default is false.
   * @private
   */
  _onSearch (forceSearch) {
    this._clearDelay()

    const value = this.dom.search.value
    const text = value.length > 0 ? value : undefined
    if (text !== this.lastText || forceSearch) {
      // only search again when changed
      this.lastText = text
      this.results = this.editor.search(text)
      const MAX_SEARCH_RESULTS = this.results[0]
        ? this.results[0].node.MAX_SEARCH_RESULTS
        : Infinity

      // try to maintain the current active result if this is still part of the new search results
      let activeResultIndex = 0
      if (this.activeResult) {
        for (let i = 0; i < this.results.length; i++) {
          if (this.results[i].node === this.activeResult.node) {
            activeResultIndex = i
            break
          }
        }
      }

      this._setActiveResult(activeResultIndex, false)

      // display search results
      if (text !== undefined) {
        const resultCount = this.results.length
        if (resultCount === 0) {
          this.dom.results.innerHTML = 'no&nbsp;results'
        } else if (resultCount === 1) {
          this.dom.results.innerHTML = '1&nbsp;result'
        } else if (resultCount > MAX_SEARCH_RESULTS) {
          this.dom.results.innerHTML = MAX_SEARCH_RESULTS + '+&nbsp;results'
        } else {
          this.dom.results.innerHTML = resultCount + '&nbsp;results'
        }
      } else {
        this.dom.results.innerHTML = ''
      }
    }
  }

  /**
   * Handle onKeyDown event in the input box
   * @param {Event} event
   * @private
   */
  _onKeyDown (event) {
    const keynum = event.which
    if (keynum === 27) {
      // ESC
      this.dom.search.value = '' // clear search
      this._onSearch()
      event.preventDefault()
      event.stopPropagation()
    } else if (keynum === 13) {
      // Enter
      if (event.ctrlKey) {
        // force to search again
        this._onSearch(true)
      } else if (event.shiftKey) {
        // move to the previous search result
        this.previous()
      } else {
        // move to the next search result
        this.next()
      }
      event.preventDefault()
      event.stopPropagation()
    }
  }

  /**
   * Handle onKeyUp event in the input box
   * @param {Event} event
   * @private
   */
  _onKeyUp (event) {
    const keynum = event.keyCode
    if (keynum !== 27 && keynum !== 13) {
      // !show and !Enter
      this._onDelayedSearch(event) // For IE 9
    }
  }

  /**
   * Clear the search results
   */
  clear () {
    this.dom.search.value = ''
    this._onSearch()
  }

  /**
   * Refresh searchResults if there is a search value
   */
  forceSearch () {
    this._onSearch(true)
  }

  /**
   * Test whether the search box value is empty
   * @returns {boolean} Returns true when empty.
   */
  isEmpty () {
    return this.dom.search.value === ''
  }

  /**
   * Destroy the search box
   */
  destroy () {
    this.editor = null
    this.dom.container.removeChild(this.dom.wrapper)
    this.dom = null

    this.results = null
    this.activeResult = null

    this._clearDelay()
  }
}
