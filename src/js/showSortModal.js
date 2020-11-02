import picoModal from 'picomodal'
import { translate } from './i18n'
import { contains, getChildPaths } from './util'

/**
 * Show advanced sorting modal
 * @param {HTMLElement} container   The container where to center
 *                                  the modal and create an overlay
 * @param {JSON} json               The JSON data to be sorted.
 * @param {function} onSort         Callback function, invoked with
 *                                  an object containing the selected
 *                                  path and direction
 * @param {Object} options
 *            Available options:
 *                - {string} path              The selected path
 *                - {'asc' | 'desc'} direction The selected direction
 */
export function showSortModal (container, json, onSort, options) {
  const paths = Array.isArray(json)
    ? getChildPaths(json)
    : ['']
  const selectedPath = options && options.path && contains(paths, options.path)
    ? options.path
    : paths[0]
  const selectedDirection = (options && options.direction) || 'asc'

  const content = '<div class="pico-modal-contents">' +
      '<div class="pico-modal-header">' + translate('sort') + '</div>' +
      '<form>' +
      '<table>' +
      '<tbody>' +
      '<tr>' +
      '  <td>' + translate('sortFieldLabel') + ' </td>' +
      '  <td class="jsoneditor-modal-input">' +
      '  <div class="jsoneditor-select-wrapper">' +
      '    <select id="field" title="' + translate('sortFieldTitle') + '">' +
      '    </select>' +
      '  </div>' +
      '  </td>' +
      '</tr>' +
      '<tr>' +
      '  <td>' + translate('sortDirectionLabel') + ' </td>' +
      '  <td class="jsoneditor-modal-input">' +
      '  <div id="direction" class="jsoneditor-button-group">' +
      '<input type="button" ' +
      'value="' + translate('sortAscending') + '" ' +
      'title="' + translate('sortAscendingTitle') + '" ' +
      'data-value="asc" ' +
      'class="jsoneditor-button-first jsoneditor-button-asc"/>' +
      '<input type="button" ' +
      'value="' + translate('sortDescending') + '" ' +
      'title="' + translate('sortDescendingTitle') + '" ' +
      'data-value="desc" ' +
      'class="jsoneditor-button-last jsoneditor-button-desc"/>' +
      '  </div>' +
      '  </td>' +
      '</tr>' +
      '<tr>' +
      '<td colspan="2" class="jsoneditor-modal-input jsoneditor-modal-actions">' +
      '  <input type="submit" id="ok" value="' + translate('ok') + '" />' +
      '</td>' +
      '</tr>' +
      '</tbody>' +
      '</table>' +
      '</form>' +
      '</div>'

  picoModal({
    parent: container,
    content: content,
    overlayClass: 'jsoneditor-modal-overlay',
    overlayStyles: {
      backgroundColor: 'rgb(1,1,1)',
      opacity: 0.3
    },
    modalClass: 'jsoneditor-modal jsoneditor-modal-sort'
  })
    .afterCreate(modal => {
      const form = modal.modalElem().querySelector('form')
      const ok = modal.modalElem().querySelector('#ok')
      const field = modal.modalElem().querySelector('#field')
      const direction = modal.modalElem().querySelector('#direction')

      function preprocessPath (path) {
        return (path === '')
          ? '@'
          : (path[0] === '.')
              ? path.slice(1)
              : path
      }

      paths.forEach(path => {
        const option = document.createElement('option')
        option.text = preprocessPath(path)
        option.value = path
        field.appendChild(option)
      })

      function setDirection (value) {
        direction.value = value
        direction.className = 'jsoneditor-button-group jsoneditor-button-group-value-' + direction.value
      }

      field.value = selectedPath || paths[0]
      setDirection(selectedDirection || 'asc')

      direction.onclick = event => {
        setDirection(event.target.getAttribute('data-value'))
      }

      ok.onclick = event => {
        event.preventDefault()
        event.stopPropagation()

        modal.close()

        onSort({
          path: field.value,
          direction: direction.value
        })
      }

      if (form) { // form is not available when JSONEditor is created inside a form
        form.onsubmit = ok.onclick
      }
    })
    .afterClose(modal => {
      modal.destroy()
    })
    .show()
}
