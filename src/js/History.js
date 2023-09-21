/**
 * Keep track on any history, be able
 * @param {function} onChange
 * @param {function} calculateItemSize
 * @param {number} limit    Maximum size of all items in history
 * @constructor
 */
export class History {
  constructor (onChange, calculateItemSize, limit) {
    this.onChange = onChange
    this.calculateItemSize = calculateItemSize || (() => 1)
    this.limit = limit

    this.items = []
    this.index = -1
  }

  add (item) {
    // limit number of items in history so that the total size doesn't
    // always keep at least one item in memory
    while (this._calculateHistorySize() > this.limit && this.items.length > 1) {
      this.items.shift()
      this.index--
    }

    // cleanup any redo action that are not valid anymore
    this.items = this.items.slice(0, this.index + 1)

    this.items.push(item)
    this.index++

    this.onChange()
  }

  _calculateHistorySize () {
    const calculateItemSize = this.calculateItemSize
    let totalSize = 0

    this.items.forEach(item => {
      totalSize += calculateItemSize(item)
    })

    return totalSize
  }

  undo () {
    if (!this.canUndo()) {
      return
    }

    this.index--

    this.onChange()

    return this.items[this.index]
  }

  redo () {
    if (!this.canRedo()) {
      return
    }

    this.index++

    this.onChange()

    return this.items[this.index]
  }

  canUndo () {
    return this.index > 0
  }

  canRedo () {
    return this.index < this.items.length - 1
  }

  clear () {
    this.items = []
    this.index = -1

    this.onChange()
  }
}
