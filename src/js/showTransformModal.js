var jmespath = require('jmespath');
var picoModal = require('picomodal');
var Selectr = require('./assets/selectr/selectr');
var translate = require('./i18n').translate;
var util = require('./util');
var debounce = util.debounce;

var MAX_PREVIEW_LINES = 100;

/**
 * Show advanced filter and transform modal using JMESPath
 * @param {Node} node the node to be transformed
 * @param {HTMLElement} container   The container where to center
 *                                  the modal and create an overlay
 */
function showTransformModal (node, container) {
  var value = node.getValue();

  var content = '<label class="pico-modal-contents">' +
      '<div class="pico-modal-header">' + translate('transform') + '</div>' +
      '<p>' +
      'Enter a <a href="http://jmespath.org" target="_blank">JMESPath</a> query to filter, sort, or transform the JSON data.<br/>' +
      'To learn JMESPath, go to <a href="http://jmespath.org/tutorial.html" target="_blank">the interactive tutorial</a>.' +
      '</p>' +
      '<div class="jsoneditor-jmespath-label">' + translate('transformWizardLabel') + ' </div>' +
      '<div id="wizard" class="jsoneditor-jmespath-block jsoneditor-jmespath-wizard">' +
      '  <table class="jsoneditor-jmespath-wizard-table">' +
      '    <tbody>' +
      '      <tr>' +
      '        <th>' + translate('transformWizardFilter') + '</th>' +
      '        <td class="jsoneditor-jmespath-filter">' +
      '          <div class="jsoneditor-inline jsoneditor-jmespath-filter-field" >' +
      '            <select id="filterField">' +
      '            </select>' +
      '          </div>' +
      '          <div class="jsoneditor-inline jsoneditor-jmespath-filter-relation" >' +
      '            <select id="filterRelation">' +
      '              <option value="==">==</option>' +
      '              <option value="!=">!=</option>' +
      '              <option value="<">&lt;</option>' +
      '              <option value="<=">&lt;=</option>' +
      '              <option value=">">&gt;</option>' +
      '              <option value=">=">&gt;=</option>' +
      '            </select>' +
      '          </div>' +
      '          <div class="jsoneditor-inline jsoneditor-jmespath-filter-value" >' +
      '            <input placeholder="value..." id="filterValue" />' +
      '          </div>' +
      '        </td>' +
      '      </tr>' +
      '      <tr>' +
      '        <th>' + translate('transformWizardSortBy') + '</th>' +
      '        <td class="jsoneditor-jmespath-filter">' +
      '          <div class="jsoneditor-inline jsoneditor-jmespath-sort-field">' +
      '            <select id="sortField">' +
      '            </select>' +
      '          </div>' +
      '          <div class="jsoneditor-inline jsoneditor-jmespath-sort-order" >' +
      '            <select id="sortOrder">' +
      '              <option value="asc">Ascending</option>' +
      '              <option value="desc">Descending</option>' +
      '            </select>' +
      '          </div>' +
      '        </td>' +
      '      </tr>' +
      '      <tr id="selectFieldsPart">' +
      '        <th>' + translate('transformWizardSelectFields') + '</th>' +
      '        <td class="jsoneditor-jmespath-filter">' +
      '          <select class="jsoneditor-jmespath-select-fields" id="selectFields" multiple></select>' +
      '        </td>' +
      '      </tr>' +
      '    </tbody>' +
      '  </table>' +
      '</div>' +
      '<div class="jsoneditor-jmespath-label">' + translate('transformQueryLabel') + ' </div>' +
      '<div class="jsoneditor-jmespath-block">' +
      '  <textarea id="query" ' +
      '            rows="4" ' +
      '            autocomplete="off" ' +
      '            autocorrect="off" ' +
      '            autocapitalize="off" ' +
      '            spellcheck="false"' +
      '            title="' + translate('transformQueryTitle') + '">[*]</textarea>' +
      '</div>' +
      '<div class="jsoneditor-jmespath-label">' + translate('transformPreviewLabel') + ' </div>' +
      '<div class="jsoneditor-jmespath-block">' +
      '  <textarea id="preview" ' +
      '      class="jsoneditor-transform-preview"' +
      '      readonly> </textarea>' +
      '</div>' +
      '<div class="jsoneditor-jmespath-block jsoneditor-modal-actions">' +
      '  <input type="submit" id="ok" value="' + translate('ok') + '" autofocus />' +
      '</div>' +
      '</div>';

  picoModal({
    parent: container,
    content: content,
    overlayClass: 'jsoneditor-modal-overlay',
    modalClass: 'jsoneditor-modal jsoneditor-modal-transform',
    focus: false
  })
      .afterCreate(function (modal) {
        var elem = modal.modalElem();

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
          wizard.style.fontStyle = 'italic';
          wizard.innerHTML = '(wizard not available for objects, only for arrays)'
        }

        var paths = node.getChildPaths();
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

        var allPaths = node.getChildPaths(true).filter(function(path) {
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
          var selectFieldsPart = elem.querySelector('#selectFieldsPart');
          if (selectFieldsPart) {
            selectFieldsPart.style.display = 'none';
          }
        }

        var selectrFilterField = new Selectr(filterField, { defaultSelected: false, clearable: true, allowDeselect: true, placeholder: 'field...' });
        var selectrFilterRelation = new Selectr(filterRelation, { defaultSelected: false, clearable: true, allowDeselect: true, placeholder: 'compare...' });
        var selectrSortField = new Selectr(sortField, { defaultSelected: false, clearable: true, allowDeselect: true, placeholder: 'field...' });
        var selectrSortOrder = new Selectr(sortOrder, { defaultSelected: false, clearable: true, allowDeselect: true, placeholder: 'order...' });
        var selectrSelectFields = new Selectr(selectFields, {multiple: true, clearable: true, defaultSelected: false, placeholder: 'select fields...'});

        selectrFilterField.on('selectr.change', generateQueryFromWizard);
        selectrFilterRelation.on('selectr.change', generateQueryFromWizard);
        filterValue.oninput = generateQueryFromWizard;
        selectrSortField.on('selectr.change', generateQueryFromWizard);
        selectrSortOrder.on('selectr.change', generateQueryFromWizard);
        selectrSelectFields.on('selectr.change', generateQueryFromWizard);

        elem.querySelector('.pico-modal-contents').onclick = function (event) {
          // prevent the first clear button (in any select box) from getting
          // focus when clicking anywhere in the modal. Only allow clicking links.
          if (event.target.nodeName !== 'A') {
            event.preventDefault();
          }
        };

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
            var examplePath = field1 !== '@'
                ? ['0'].concat(util.parsePath('.' + field1))
                : ['0']
            var exampleValue = util.get(value, examplePath)
            // TODO: move _stringCast into a static util function
            var value1 = typeof exampleValue === 'string'
                ? filterValue.value
                : node._stringCast(filterValue.value);

            query.value = '[? ' +
                field1 + ' ' +
                filterRelation.value + ' ' +
                '`' + JSON.stringify(value1) + '`' +
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
                var selectedValue = selectFields.options[i].value;
                values.push(selectedValue);
              }
            }

            if (query.value[query.value.length - 1] !== ']') {
              query.value += ' | [*]';
            }

            if (values.length === 1) {
              query.value += '.' + values[0];
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
          }

          debouncedUpdatePreview();
        }

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

        var debouncedUpdatePreview = debounce(updatePreview, 300);

        query.oninput = debouncedUpdatePreview;
        debouncedUpdatePreview();

        ok.onclick = function (event) {
          event.preventDefault();
          event.stopPropagation();

          modal.close();

          node.transform(query.value)
        };

        setTimeout(function () {
          query.select();
          query.focus();
          query.selectionStart = 3;
          query.selectionEnd = 3;
        });
      })
      .afterClose(function (modal) {
        modal.destroy();
      })
      .show();
}

module.exports = showTransformModal;
