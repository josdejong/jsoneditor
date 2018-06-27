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

  var content = '<label class="pico-modal-contents jsoneditor-transform-modal">' +
      '<div class="pico-modal-header">' + translate('transform') + '</div>' +
      '<form>' +
      '<p>' +
      'Enter a <a href="http://jmespath.org" target="_blank">JMESPath</a> query to filter, sort, or transform the JSON data.<br/>' +
      'To learn JMESPath, go to <a href="http://jmespath.org/tutorial.html" target="_blank">the interactive tutorial</a>.' +
      '</p>' +
      '<table>' +
      '<tbody>' +
      '<tr>' +
      '  <th>' + translate('transformWizardLabel') + ' </th>' +
      '  <td>' +
      '  <div id="wizard" class="jsoneditor-jmespath-wizard">' +
      '  <label>' +
      '    <div class="jsoneditor-jmespath-wizard-label">' + translate('transformWizardFilter') + '</div>' +
      '    <div class="jsoneditor-jmespath-filter">' +
      '      <div class="jsoneditor-select-wrapper">' +
      '        <select class="jsoneditor-jmespath-filter-field" id="filterField">' +
      '          <option value="" selected> </option>' +
      '        </select>' +
      '      </div>' +
      '      <div class="jsoneditor-select-wrapper">' +
      '        <select class="jsoneditor-jmespath-filter-relation" id="filterRelation">' +
      '          <option value="" selected> </option>' +
      '          <option value="==">==</option>' +
      '          <option value="!=">!=</option>' +
      '          <option value="<">&lt;</option>' +
      '          <option value="<=">&lt;=</option>' +
      '          <option value=">">&gt;</option>' +
      '          <option value=">=">&gt;=</option>' +
      '        </select>' +
      '      </div>' +
      '      <input class="jsoneditor-jmespath-filter-value" id="filterValue" />' +
      '    </div>' +
      '  </label>' +
      '  <label>' +
      '    <div class="jsoneditor-jmespath-wizard-label">' + translate('transformWizardSortBy') + '</div>' +
      '    <div class="jsoneditor-jmespath-filter">' +
      '      <div class="jsoneditor-select-wrapper">' +
      '        <select class="jsoneditor-jmespath-sort-field" id="sortField">' +
      '          <option value="" selected> </option>' +
      '        </select>' +
      '      </div>' +
      '      <div class="jsoneditor-select-wrapper">' +
      '        <select class="jsoneditor-jmespath-sort-order" id="sortOrder">' +
      '          <option value="" selected> </option>' +
      '          <option value="asc">Ascending</option>' +
      '          <option value="desc">Descending</option>' +
      '        </select>' +
      '      </div>' +
      '    </div>' +
      '  </label>' +
      '  <label id="selectFieldsPart">' +
      '    <div class="jsoneditor-jmespath-wizard-label">' + translate('transformWizardSelectFields') + '</div>' +
      '    <select class="jsoneditor-jmespath-select-fields" id="selectFields" multiple>' +
      '      <option value=""> </option>' +
      '    </select>' +
      '  </label>' +
      '  </div>' +
      '  </td>' +
      '</tr>' +
      '<tr>' +
      '  <th>' + translate('transformQueryLabel') + ' </th>' +
      '  <td class="jsoneditor-modal-input">' +
      '    <input id="query" type="text" title="' + translate('transformQueryTitle') + '" value=""/>' +
      '  </td>' +
      '</tr>' +
      '<tr>' +
      '  <th>' + translate('transformPreviewLabel') + ' </th>' +
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
        var elem = modal.modalElem();

        var form = elem.querySelector('form');
        var wizard = elem.querySelector('#wizard');
        var ok = elem.querySelector('#ok');
        var filterField = elem.querySelector('#filterField');
        var filterRelation = elem.querySelector('#filterRelation');
        var filterValue = elem.querySelector('#filterValue');
        var sortField = elem.querySelector('#sortField');
        var sortOrder = elem.querySelector('#sortOrder');
        var selectFields = elem.querySelector('#selectFields');
        var query = elem.querySelector('#query');
        var preview = elem.querySelector('#preview');

        if (!Array.isArray(value)) {
          wizard.style.display = 'none';
          wizard.parentNode.style.fontStyle = 'italic';
          wizard.parentNode.appendChild(
              document.createTextNode('(wizard not available for objects, only for arrays)')
          );
        }

        var paths = node.getPaths().sort();
        paths.forEach(function (path) {
          var formattedPath = preprocessPath(path);
          var filterOption = document.createElement('option');
          filterOption.text = formattedPath;
          filterOption.value = formattedPath;
          filterField.appendChild(filterOption);

          var sortOption = document.createElement('option');
          sortOption.text = formattedPath;
          sortOption.value = formattedPath;
          sortField.appendChild(sortOption);
        });

        var allPaths = node.getPaths(true)
            .sort()
            .filter(function(path) {
              return path !== '.';
            });

        if (allPaths.length > 0) {
          allPaths.forEach(function (path) {
            var formattedPath = preprocessPath(path);
            var option = document.createElement('option');
            option.text = formattedPath;
            option.value = formattedPath;
            selectFields.appendChild(option);
          });
        }
        else {
          elem.querySelector('#selectFieldsPart').style.display = 'none';
        }

        query.value = Array.isArray(value) ? '[*]' : '@';

        function preprocessPath(path) {
          if (path[0] === '.') {
            return (path === '.')
                ? '@'
                : path.slice(1);
          }
          else {
            return path;
          }
        }

        function generateQueryFromWizard () {
          if (filterField.value && filterRelation.value && filterValue.value) {
            var field1 = filterField.value;
            query.value = '[? ' +
                field1 + ' ' +
                filterRelation.value + ' ' +
                '`' + filterValue.value + '`' +
                ']';
          }
          else {
            query.value = '[*]';
          }

          if (sortField.value && sortOrder.value) {
            var field2 = sortField.value;
            if (sortOrder.value === 'desc') {
              query.value += ' | reverse(sort_by(@, &' + field2 + '))';
            }
            else {
              query.value += ' | sort_by(@, &' + field2 + ')';
            }
          }

          if (selectFields.value) {
            var values = [];
            for (var i=0; i < selectFields.options.length; i++) {
              if (selectFields.options[i].selected) {
                var value = selectFields.options[i].value;
                values.push(value);
              }
            }

            if (query.value[query.value.length - 1] !== ']') {
              query.value += ' | [*]';
            }

            if (values.length === 1) {
              query.value += '.' + value;
            }
            else if (values.length > 1) {
              query.value += '.{' +
                  values.map(function (value) {
                    var parts = value.split('.');
                    var last = parts[parts.length - 1];
                    return last + ': ' + value;
                  }).join(', ') +
                  '}';
            }
            else { // values.length === 0
              // ignore
            }

            console.log('selectFields', values)
          }

          updatePreview();
        }

        function updatePreview() {
          // TODO: debounce?
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

        filterField.onchange = generateQueryFromWizard;
        filterRelation.onchange = generateQueryFromWizard;
        filterValue.oninput = generateQueryFromWizard;
        sortField.oninput = generateQueryFromWizard;
        sortOrder.oninput = generateQueryFromWizard;
        selectFields.onchange = generateQueryFromWizard;

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
