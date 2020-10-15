/**
 * Show errors and schema warnings in a clickable table view
 * @param {Object} config
 * @property {boolean} errorTableVisible
 * @property {function (boolean) : void} onToggleVisibility
 * @property {function (number)} [onFocusLine]
 * @property {function (number)} onChangeHeight
 * @constructor
 */
export class ErrorTable {
  constructor (config) {
    this.errorTableVisible = config.errorTableVisible
    this.onToggleVisibility = config.onToggleVisibility
    this.onFocusLine = config.onFocusLine || (() => {})
    this.onChangeHeight = config.onChangeHeight

    this.dom = {}

    const validationErrorsContainer = document.createElement('div')
    validationErrorsContainer.className = 'jsoneditor-validation-errors-container'
    this.dom.validationErrorsContainer = validationErrorsContainer

    const additionalErrorsIndication = document.createElement('div')
    additionalErrorsIndication.style.display = 'none'
    additionalErrorsIndication.className = 'jsoneditor-additional-errors fadein'
    additionalErrorsIndication.textContent = 'Scroll for more \u25BF'
    this.dom.additionalErrorsIndication = additionalErrorsIndication
    validationErrorsContainer.appendChild(additionalErrorsIndication)

    const validationErrorIcon = document.createElement('span')
    validationErrorIcon.className = 'jsoneditor-validation-error-icon'
    validationErrorIcon.style.display = 'none'
    this.dom.validationErrorIcon = validationErrorIcon

    const validationErrorCount = document.createElement('span')
    validationErrorCount.className = 'jsoneditor-validation-error-count'
    validationErrorCount.style.display = 'none'
    this.dom.validationErrorCount = validationErrorCount

    this.dom.parseErrorIndication = document.createElement('span')
    this.dom.parseErrorIndication.className = 'jsoneditor-parse-error-icon'
    this.dom.parseErrorIndication.style.display = 'none'
  }

  getErrorTable () {
    return this.dom.validationErrorsContainer
  }

  getErrorCounter () {
    return this.dom.validationErrorCount
  }

  getWarningIcon () {
    return this.dom.validationErrorIcon
  }

  getErrorIcon () {
    return this.dom.parseErrorIndication
  }

  toggleTableVisibility () {
    this.errorTableVisible = !this.errorTableVisible
    this.onToggleVisibility(this.errorTableVisible)
  }

  setErrors (errors, errorLocations) {
    // clear any previous errors
    if (this.dom.validationErrors) {
      this.dom.validationErrors.parentNode.removeChild(this.dom.validationErrors)
      this.dom.validationErrors = null
      this.dom.additionalErrorsIndication.style.display = 'none'
    }

    // create the table with errors
    // keep default behavior for parse errors
    if (this.errorTableVisible && errors.length > 0) {
      const validationErrors = document.createElement('div')
      validationErrors.className = 'jsoneditor-validation-errors'

      const table = document.createElement('table')
      table.className = 'jsoneditor-text-errors'
      validationErrors.appendChild(table)

      const tbody = document.createElement('tbody')
      table.appendChild(tbody)

      errors.forEach(error => {
        let line

        if (!isNaN(error.line)) {
          line = error.line
        } else if (error.dataPath) {
          const errLoc = errorLocations.find(loc => loc.path === error.dataPath)
          if (errLoc) {
            line = errLoc.line + 1
          }
        }

        const trEl = document.createElement('tr')
        trEl.className = !isNaN(line) ? 'jump-to-line' : ''
        if (error.type === 'error') {
          trEl.className += ' parse-error'
        } else {
          trEl.className += ' validation-error'
        }

        const td1 = document.createElement('td')
        const button = document.createElement('button')
        button.className = 'jsoneditor-schema-error'
        td1.appendChild(button)
        trEl.appendChild(td1)

        const td2 = document.createElement('td')
        td2.style = 'white-space: nowrap;'
        td2.textContent = (!isNaN(line) ? ('Ln ' + line) : '')
        trEl.appendChild(td2)

        if (typeof error === 'string') {
          const td34 = document.createElement('td')
          td34.colSpan = 2
          const pre = document.createElement('pre')
          pre.appendChild(document.createTextNode(error))
          td34.appendChild(pre)
          trEl.appendChild(td34)
        } else {
          const td3 = document.createElement('td')
          td3.appendChild(document.createTextNode(error.dataPath || ''))
          trEl.appendChild(td3)

          const td4 = document.createElement('td')
          const pre = document.createElement('pre')
          pre.appendChild(document.createTextNode(error.message))
          td4.appendChild(pre)
          trEl.appendChild(td4)
        }

        trEl.onclick = () => {
          this.onFocusLine(line)
        }

        tbody.appendChild(trEl)
      })

      this.dom.validationErrors = validationErrors
      this.dom.validationErrorsContainer.appendChild(validationErrors)
      this.dom.additionalErrorsIndication.title = errors.length + ' errors total'

      if (this.dom.validationErrorsContainer.clientHeight < this.dom.validationErrorsContainer.scrollHeight) {
        this.dom.additionalErrorsIndication.style.display = 'block'
        this.dom.validationErrorsContainer.onscroll = () => {
          this.dom.additionalErrorsIndication.style.display =
              (this.dom.validationErrorsContainer.clientHeight > 0 && this.dom.validationErrorsContainer.scrollTop === 0) ? 'block' : 'none'
        }
      } else {
        this.dom.validationErrorsContainer.onscroll = undefined
      }

      const height = this.dom.validationErrorsContainer.clientHeight + (this.dom.statusBar ? this.dom.statusBar.clientHeight : 0)
      // this.content.style.marginBottom = (-height) + 'px';
      // this.content.style.paddingBottom = height + 'px';
      this.onChangeHeight(height)
    } else {
      this.onChangeHeight(0)
    }

    // update the status bar
    const validationErrorsCount = errors.filter(error => error.type !== 'error').length
    if (validationErrorsCount > 0) {
      this.dom.validationErrorCount.style.display = 'inline'
      this.dom.validationErrorCount.innerText = validationErrorsCount
      this.dom.validationErrorCount.onclick = this.toggleTableVisibility.bind(this)

      this.dom.validationErrorIcon.style.display = 'inline'
      this.dom.validationErrorIcon.title = validationErrorsCount + ' schema validation error(s) found'
      this.dom.validationErrorIcon.onclick = this.toggleTableVisibility.bind(this)
    } else {
      this.dom.validationErrorCount.style.display = 'none'
      this.dom.validationErrorIcon.style.display = 'none'
    }

    // update the parse error icon
    const hasParseErrors = errors.some(error => error.type === 'error')
    if (hasParseErrors) {
      const line = errors[0].line
      this.dom.parseErrorIndication.style.display = 'block'
      this.dom.parseErrorIndication.title = !isNaN(line)
        ? ('parse error on line ' + line)
        : 'parse error - check that the json is valid'
      this.dom.parseErrorIndication.onclick = this.toggleTableVisibility.bind(this)
    } else {
      this.dom.parseErrorIndication.style.display = 'none'
    }
  }
}
