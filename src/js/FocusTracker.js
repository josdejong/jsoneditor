'use strict'

/**
 * @constructor FocusTracker
 * A custom focus tracker for a DOM element with complex internal DOM structure
 * @param  {[Object]} config    A set of configurations for the FocusTracker
 *                {DOM Object} target    The DOM object to track
 *                {Function} onFocus    onFocus callback
 *                {Function} onBlur    onBlur callback
 *
 * @return
 */

export class FocusTracker {
  constructor (config) {
    this.onFocus = (typeof config.onFocus === 'function') ? config.onFocus : null
    this.onBlur = (typeof config.onBlur === 'function') ? config.onBlur : null
    this.target = config.target || null
    this._onClick = this._onEvent.bind(this)
    this._onKeyUp = function (event) {
      if (event.which === 9 || event.keyCode === 9) {
        this._onEvent(event)
      }
    }.bind(this)

    this.focusFlag = false
    this.trackerSetFlag = false
    this.firstEventFlag = true
  }

  /**
     * Adds required event listeners to the 'document' object
     * to track the focus of the given 'target'
     */
  add () {
    if (!this.trackerSetFlag) {
      if (this.target) {
        if (this.onFocus || this.onBlur) {
          document.addEventListener('click', this._onClick)
          document.addEventListener('keyup', this._onKeyUp)
          this.trackerSetFlag = true
        }
      }
    }
  }

  /**
     * Removes the event listeners on the 'document' object
     * that were added to track the focus of the given 'target'
     */
  remove () {
    if (this.trackerSetFlag) {
      document.removeEventListener('click', this._onClick)
      document.removeEventListener('keyup', this._onKeyUp)
      this.trackerSetFlag = false
    }
  }

  /**
     * Tracks the focus of the target and calls the onFocus and onBlur
     * event callbacks if available.
     * @param {Event} [event]  The 'click' or 'keyup' event object,
     *                          from the respective events set on
     *              document object
     * @private
     */

  _onEvent (event) {
    const target = event.target
    let focusFlag
    if (target === this.target) {
      focusFlag = true
    } else if (this.target.contains(target)) {
      focusFlag = true
    } else {
      focusFlag = false
    }

    if (focusFlag) {
      if (!this.focusFlag) {
        // trigger the onFocus callback
        if (this.onFocus) {
          this.onFocus({ type: 'focus', target: this.target })
        }
        this.focusFlag = true
      }
    } else {
      if (this.focusFlag || this.firstEventFlag) {
        // trigger the onBlur callback
        if (this.onBlur) {
          this.onBlur({ type: 'blur', target: this.target })
        }
        this.focusFlag = false

        if (this.firstEventFlag) {
          this.firstEventFlag = false
        }
      }
    }
  }
}
