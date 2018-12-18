'use strict';

var _locales = ['en', 'pt-BR'];
var _defs = {
  en: {
    array: 'Array',
    auto: 'Auto',
    appendText: 'Append',
    appendTitle: 'Append a new field with type \'auto\' after this field (Ctrl+Shift+Ins)',
    appendSubmenuTitle: 'Select the type of the field to be appended',
    appendTitleAuto: 'Append a new field with type \'auto\' (Ctrl+Shift+Ins)',
    ascending: 'Ascending',
    ascendingTitle: 'Sort the childs of this ${type} in ascending order',
    actionsMenu: 'Click to open the actions menu (Ctrl+M)',
    collapseAll: 'Collapse all fields',
    descending: 'Descending',
    descendingTitle: 'Sort the childs of this ${type} in descending order',
    drag: 'Drag to move this field (Alt+Shift+Arrows)',
    duplicateKey: 'duplicate key',
    duplicateText: 'Duplicate',
    duplicateTitle: 'Duplicate selected fields (Ctrl+D)',
    duplicateField: 'Duplicate this field (Ctrl+D)',
    empty: 'empty',
    expandAll: 'Expand all fields',
    expandTitle: 'Click to expand/collapse this field (Ctrl+E). \n' +
      'Ctrl+Click to expand/collapse including all childs.',
    insert: 'Insert',
    insertTitle: 'Insert a new field with type \'auto\' before this field (Ctrl+Ins)',
    insertSub: 'Select the type of the field to be inserted',
    object: 'Object',
    ok: 'Ok',
    redo: 'Redo (Ctrl+Shift+Z)',
    removeText: 'Remove',
    removeTitle: 'Remove selected fields (Ctrl+Del)',
    removeField: 'Remove this field (Ctrl+Del)',
    selectNode: 'Select a node...',
    showAll: 'show all',
    showMore: 'show more',
    showMoreStatus: 'displaying ${visibleChilds} of ${totalChilds} items.',
    sort: 'Sort',
    sortTitle: 'Sort the childs of this ${type}',
    sortTitleShort: 'Sort contents',
    sortFieldLabel: 'Field:',
    sortDirectionLabel: 'Direction:',
    sortFieldTitle: 'Select the nested field by which to sort the array or object',
    sortAscending: 'Ascending',
    sortAscendingTitle: 'Sort the selected field in ascending order',
    sortDescending: 'Descending',
    sortDescendingTitle: 'Sort the selected field in descending order',
    string: 'String',
    transform: 'Transform',
    transformTitle: 'Filter, sort, or transform the childs of this ${type}',
    transformTitleShort: 'Filter, sort, or transform contents',
    transformQueryTitle: 'Enter a JMESPath query',
    transformWizardLabel: 'Wizard',
    transformWizardFilter: 'Filter',
    transformWizardSortBy: 'Sort by',
    transformWizardSelectFields: 'Select fields',
    transformQueryLabel: 'Query',
    transformPreviewLabel: 'Preview',
    type: 'Type',
    typeTitle: 'Change the type of this field',
    openUrl: 'Ctrl+Click or Ctrl+Enter to open url in new window',
    undo: 'Undo last action (Ctrl+Z)',
    validationCannotMove: 'Cannot move a field into a child of itself',
    autoType: 'Field type "auto". ' +
      'The field type is automatically determined from the value ' +
      'and can be a string, number, boolean, or null.',
    objectType: 'Field type "object". ' +
      'An object contains an unordered set of key/value pairs.',
    arrayType: 'Field type "array". ' +
      'An array contains an ordered collection of values.',
    stringType: 'Field type "string". ' +
      'Field type is not determined from the value, ' +
      'but always returned as string.',
    modeCodeText: 'Code',
    modeCodeTitle: 'Switch to code highlighter',
    modeFormText: 'Form',
    modeFormTitle: 'Switch to form editor',
    modeTextText: 'Text',
    modeTextTitle: 'Switch to plain text editor',
    modeTreeText: 'Tree',
    modeTreeTitle: 'Switch to tree editor',
    modeViewText: 'View',
    modeViewTitle: 'Switch to tree view',
  },
  'pt-BR': {
    array: 'Lista',
    auto: 'Automatico',
    appendText: 'Adicionar',
    appendTitle: 'Adicionar novo campo com tipo \'auto\' depois deste campo (Ctrl+Shift+Ins)',
    appendSubmenuTitle: 'Selecione o tipo do campo a ser adicionado',
    appendTitleAuto: 'Adicionar novo campo com tipo \'auto\' (Ctrl+Shift+Ins)',
    ascending: 'Ascendente',
    ascendingTitle: 'Organizar filhor do tipo ${type} em crescente',
    actionsMenu: 'Clique para abrir o menu de ações (Ctrl+M)',
    collapseAll: 'Fechar todos campos',
    descending: 'Descendente',
    descendingTitle: 'Organizar o filhos do tipo ${type} em decrescente',
    duplicateKey: 'chave duplicada',
    drag: 'Arraste para mover este campo (Alt+Shift+Arrows)',
    duplicateText: 'Duplicar',
    duplicateTitle: 'Duplicar campos selecionados (Ctrl+D)',
    duplicateField: 'Duplicar este campo (Ctrl+D)',
    empty: 'vazio',
    expandAll: 'Expandir todos campos',
    expandTitle: 'Clique para expandir/encolher este campo (Ctrl+E). \n' +
      'Ctrl+Click para expandir/encolher incluindo todos os filhos.',
    insert: 'Inserir',
    insertTitle: 'Inserir um novo campo do tipo \'auto\' antes deste campo (Ctrl+Ins)',
    insertSub: 'Selecionar o tipo de campo a ser inserido',
    object: 'Objeto',
    ok: 'Ok',
    redo: 'Refazer (Ctrl+Shift+Z)',
    removeText: 'Remover',
    removeTitle: 'Remover campos selecionados (Ctrl+Del)',
    removeField: 'Remover este campo (Ctrl+Del)',
    // TODO: correctly translate
    selectNode: 'Select a node...',
    // TODO: correctly translate
    showAll: 'mostre tudo',
    // TODO: correctly translate
    showMore: 'mostre mais',
    // TODO: correctly translate
    showMoreStatus: 'exibindo ${visibleChilds} de ${totalChilds} itens.',
    sort: 'Organizar',
    sortTitle: 'Organizar os filhos deste ${type}',
    // TODO: correctly translate
    sortTitleShort: 'Organizar os filhos',
    // TODO: correctly translate
    sortFieldLabel: 'Field:',
    // TODO: correctly translate
    sortDirectionLabel: 'Direction:',
    // TODO: correctly translate
    sortFieldTitle: 'Select the nested field by which to sort the array or object',
    // TODO: correctly translate
    sortAscending: 'Ascending',
    // TODO: correctly translate
    sortAscendingTitle: 'Sort the selected field in ascending order',
    // TODO: correctly translate
    sortDescending: 'Descending',
    // TODO: correctly translate
    sortDescendingTitle: 'Sort the selected field in descending order',
    string: 'Texto',
    // TODO: correctly translate
    transform: 'Transform',
    // TODO: correctly translate
    transformTitle: 'Filter, sort, or transform the childs of this ${type}',
    // TODO: correctly translate
    transformTitleShort: 'Filter, sort, or transform contents',
    // TODO: correctly translate
    transformQueryTitle: 'Enter a JMESPath query',
    // TODO: correctly translate
    transformWizardLabel: 'Wizard',
    // TODO: correctly translate
    transformWizardFilter: 'Filter',
    // TODO: correctly translate
    transformWizardSortBy: 'Sort by',
    // TODO: correctly translate
    transformWizardSelectFields: 'Select fields',
    // TODO: correctly translate
    transformQueryLabel: 'Query',
    // TODO: correctly translate
    transformPreviewLabel: 'Preview',
    type: 'Tipo',
    typeTitle: 'Mudar o tipo deste campo',
    openUrl: 'Ctrl+Click ou Ctrl+Enter para abrir link em nova janela',
    undo: 'Desfazer último ação (Ctrl+Z)',
    validationCannotMove: 'Não pode mover um campo como filho dele mesmo',
    autoType: 'Campo do tipo "auto". ' +
      'O tipo do campo é determinao automaticamente a partir do seu valor ' +
      'e pode ser texto, número, verdade/falso ou nulo.',
    objectType: 'Campo do tipo "objeto". ' +
      'Um objeto contém uma lista de pares com chave e valor.',
    arrayType: 'Campo do tipo "lista". ' +
      'Uma lista contem uma coleção de valores ordenados.',
    stringType: 'Campo do tipo "string". ' +
      'Campo do tipo nao é determinado através do seu valor, ' +
      'mas sempre retornara um texto.'
  }
};

var _defaultLang = 'en';
var _lang;
var userLang = typeof navigator !== 'undefined' ?
  navigator.language || navigator.userLanguage :
  undefined;
_lang = _locales.find(function (l) {
  return l === userLang;
});
if (!_lang) {
  _lang = _defaultLang;
}

module.exports = {
  // supported locales
  _locales: _locales,
  _defs: _defs,
  _lang: _lang,
  setLanguage: function (lang) {
    if (!lang) {
      return;
    }
    var langFound = _locales.find(function (l) {
      return l === lang;
    });
    if (langFound) {
      _lang = langFound;
    } else {
      console.error('Language not found');
    }
  },
  setLanguages: function (languages) {
    if (!languages) {
      return;
    }
    for (var key in languages) {
      var langFound = _locales.find(function (l) {
        return l === key;
      });
      if (!langFound) {
        _locales.push(key);
      }
      _defs[key] = Object.assign({}, _defs[_defaultLang], _defs[key], languages[key]);
    }
  },
  translate: function (key, data, lang) {
    if (!lang) {
      lang = _lang;
    }
    var text = _defs[lang][key];
    if (data) {
      for (key in data) {
        text = text.replace('${' + key + '}', data[key]);
      }
    }
    return text || key;
  }
};