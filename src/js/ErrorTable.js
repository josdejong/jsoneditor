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
    additionalErrorsIndication.innerHTML = 'Scroll for more &#9663;'
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
      validationErrors.innerHTML = '<table class="jsoneditor-text-errors"><tbody></tbody></table>'
      const tbody = validationErrors.getElementsByTagName('tbody')[0]

      errors.forEach(error => {
        let message
        if (typeof error === 'string') {
          message = '<td colspan="2"><pre>' + error + '</pre></td>'
        } else {
          message =
              '<td>' + (error.dataPath || '') + '</td>' +
              '<td><pre>' + error.message + '</pre></td>'
        }

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

        trEl.innerHTML = ('<td><button class="jsoneditor-schema-error"></button></td><td style="white-space:nowrap;">' + (!isNaN(line) ? ('Ln ' + line) : '') + '</td>' + message)
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
