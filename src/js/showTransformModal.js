var jmespath = require('jmespath');
var picoModal = require('picomodal');
var translate = require('./i18n').translate;

var MAX_PREVIEW_LINES = 100;

/**
 * Show advanced filter and transform modal using JMESPath
 * @param {Node} node the node to be transformed
 * @param {HTMLElement} container   The container where to center
 *                                  the modal and create an overlay
 */
function showTransformModal (node, container) {
  var value = node.getValue();

  var content = '<div class="pico-modal-contents jsoneditor-transform-modal">' +
      '<div class="pico-modal-header">' + translate('transform') + '</div>' +
      '<form>' +
      '<p>' +
      'Enter a <a href="http://jmespath.org" target="_blank">JMESPath</a> query to filter, sort, or transform the JSON data.<br/>' +
      'To learn JMESPath, go to <a href="http://jmespath.org/tutorial.html" target="_blank">the interactive tutorial</a>.' +
      '</p>' +
      '<table>' +
      '<tbody>' +
      '<tr>' +
      '  <td>' + translate('transformQueryLabel') + ' </td>' +
      '  <td class="jsoneditor-modal-input">' +
      '    <input id="query" type="text" title="' + translate('transformQueryTitle') + '" value=""/>' +
      '  </td>' +
      '</tr>' +
      '<tr>' +
      '  <td>' + translate('transformPreviewLabel') + ' </td>' +
      '  <td class="jsoneditor-modal-input">' +
      '    <textarea id="preview" ' +
      '        class="jsoneditor-transform-preview"' +
      '        readonly> </textarea>' +
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
    modalClass: 'jsoneditor-modal',
    focus: false
  })
      .afterCreate(function (modal) {
        var form = modal.modalElem().querySelector('form');
        var ok = modal.modalElem().querySelector('#ok');
        var query = modal.modalElem().querySelector('#query');
        var preview = modal.modalElem().querySelector('#preview');

        query.value = Array.isArray(value) ? '[*]' : '@';

        function updatePreview() {
          try {
            var transformed = jmespath.search(value, query.value);
            var lines =  JSON.stringify(transformed, null, 2).split('\n');

            if (lines.length > MAX_PREVIEW_LINES) {
              lines = lines.slice(0, MAX_PREVIEW_LINES).concat(['...'])
            }


            preview.className = 'jsoneditor-transform-preview';
            preview.value = lines.join('\n');
            ok.disabled = false;
          }
          catch (err) {
            preview.className = 'jsoneditor-transform-preview jsoneditor-error';
            preview.value = err.toString();
            ok.disabled = true;
          }
        }

        query.oninput = updatePreview;
        updatePreview();

        ok.onclick = function (event) {
          event.preventDefault();
          event.stopPropagation();

          modal.close();

          node.transform(query.value)
        };

        if (form) { // form is not available when JSONEditor is created inside a form
          form.onsubmit = ok.onclick;
        }

        setTimeout(function () {
          query.select();
          query.focus();
        });
      })
      .afterClose(function (modal) {
        modal.destroy();
      })
      .show();
}

module.exports = showTransformModal;
