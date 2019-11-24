'use strict'

/**
 * @constructor FocusTracker
 * A custom focus tracker for a DOM element with complex internal DOM structure
 * @param  {[Object]} config    A set of configurations for the FocusTracker
 *                {DOM Object} target *    The DOM object to track (required)
 *                {Function}   onFocus     onFocus callback
 *                {Function}   onBlur      onBlur callback
 *
 * @return
 */

export class FocusTracker {
  constructor (config) {
    this.target = config.target || null
    if (!this.target) {
      throw new Error('FocusTracker constructor called without a "target" to track.')
    }

    this.onFocus = (typeof config.onFocus === 'function') ? config.onFocus : null
    this.onBlur = (typeof config.onBlur === 'function') ? config.onBlur : null
    this._onClick = this._onEvent.bind(this)
    this._onKeyUp = function (event) {
      if (event.which === 9 || event.keyCode === 9) {
        this._onEvent(event)
      }
    }.bind(this)

    this.focusFlag = false
    this.firstEventFlag = true

    /*
      Adds required (click and keyup) event listeners to the 'document' object
      to track the focus of the given 'target'
     */
    if (this.onFocus || this.onBlur) {
      document.addEventListener('click', this._onClick)
      document.addEventListener('keyup', this._onKeyUp)
    }
  }

  /**
     * Removes the event listeners on the 'document' object
     * that were added to track the focus of the given 'target'
     */
  destroy () {
    document.removeEventListener('click', this._onClick)
    document.removeEventListener('keyup', this._onKeyUp)
    this._onEvent({ target: document.body }) // calling _onEvent with body element in the hope that the FocusTracker is added to an element inside the body tag
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
    } else if (this.target.contains(target) || this.target.contains(document.activeElement)) {
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

        /*
          When switching from one mode to another in the editor, the FocusTracker gets recreated.
          At that time, this.focusFlag will be init to 'false' and will fail the above if condition, when blur occurs
          this.firstEventFlag is added to overcome that issue
         */
        if (this.firstEventFlag) {
          this.firstEventFlag = false
        }
      }
    }
  }
}
