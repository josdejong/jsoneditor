var picoModal = require('picomodal');
var translate = require('./i18n').translate;

/**
 * Show advanced sorting modal
 * @param {Node} node the node to be sorted
 * @param {HTMLElement} container   The container where to center
 *                                  the modal and create an overlay
 */
function showSortModal (node, container) {
  var content = '<div class="pico-modal-contents">' +
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
      'title="'  + translate('sortAscendingTitle') + '" ' +
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
      '</div>';

  picoModal({
    parent: container,
    content: content,
    overlayClass: 'jsoneditor-modal-overlay',
    modalClass: 'jsoneditor-modal jsoneditor-modal-sort'
  })
      .afterCreate(function (modal) {
        var form = modal.modalElem().querySelector('form');
        var ok = modal.modalElem().querySelector('#ok');
        var field = modal.modalElem().querySelector('#field');
        var direction = modal.modalElem().querySelector('#direction');

        var paths = node.type === 'array'
            ? node.getChildPaths()
            : ['.'];

        paths.forEach(function (path) {
          var option = document.createElement('option');
          option.text = path;
          option.value = path;
          field.appendChild(option);
        });

        function setDirection(value) {
          direction.value = value;
          direction.className = 'jsoneditor-button-group jsoneditor-button-group-value-' + direction.value;
        }

        field.value = node.sortedBy ? node.sortedBy.path : paths[0];
        setDirection(node.sortedBy ? node.sortedBy.direction : 'asc');

        direction.onclick = function (event) {
          setDirection(event.target.getAttribute('data-value'));
        };

        ok.onclick = function (event) {
          event.preventDefault();
          event.stopPropagation();

          modal.close();

          var path = field.value;
          var pathArray = (path === '.') ? [] : path.split('.').slice(1);

          node.sortedBy = {
            path: path,
            direction: direction.value
          };

          node.sort(pathArray, direction.value)
        };

        if (form) { // form is not available when JSONEditor is created inside a form
          form.onsubmit = ok.onclick;
        }
      })
      .afterClose(function (modal) {
        modal.destroy();
      })
      .show();
}

module.exports = showSortModal;
