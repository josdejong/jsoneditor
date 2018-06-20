var picoModal = require('picomodal');
var translate = require('./i18n').translate;

/**
 * Show advanced filter and transform modal using JMESPath
 * @param {Node} node the node to be transformed
 * @param {HTMLElement} container   The container where to center
 *                                  the modal and create an overlay
 */
function showTransformModal (node, container) {
  var content = '<div class="pico-modal-contents jsoneditor-transform-modal">' +
      '<div class="pico-modal-header">' + translate('transform') + '</div>' +
      '<form>' +
      '<p>' +
      'Enter a JMESPath query to filter, sort, or transform the JSON data. ' +
      'To learn JMESPath, go to <a href="http://jmespath.org/tutorial.html" target="_blank">the interactive tutorial</a>.' +
      '</p>' +
      '<table>' +
      '<tbody>' +
      '<tr>' +
      '  <td>' + translate('transformQueryLabel') + ' </td>' +
      '  <td class="jsoneditor-modal-input">' +
      '    <input id="query" type="text" title="' + translate('transformQueryTitle') + '" value="[*]"/>' +
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
    modalClass: 'jsoneditor-modal'
  })
      .afterCreate(function (modal) {
        var form = modal.modalElem().querySelector('form');
        var ok = modal.modalElem().querySelector('#ok');
        var query = modal.modalElem().querySelector('#query');

        ok.onclick = function (event) {
          event.preventDefault();
          event.stopPropagation();

          modal.close();

          node.transform(query.value)
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

module.exports = showTransformModal;
