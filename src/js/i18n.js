'use strict';

require('./polyfills');

var _locales = ['en', 'pt-BR', 'zh-CN', 'tr'];
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
    duplicateFieldError: 'Duplicate field name',
    cannotParseFieldError: 'Cannot parse field into JSON',
    cannotParseValueError: 'Cannot parse value into JSON',
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
    examples: 'Examples',
    default: 'Default',
  },
  'zh-CN': {
    array: '数组',
    auto: '自动',
    appendText: '追加',
    appendTitle: '在此字段后追加一个类型为“auto”的新字段 (Ctrl+Shift+Ins)',
    appendSubmenuTitle: '选择要追加的字段类型',
    appendTitleAuto: '追加类型为“auto”的新字段 (Ctrl+Shift+Ins)',
    ascending: '升序',
    ascendingTitle: '升序排列${type}的子节点',
    actionsMenu: '点击打开动作菜单(Ctrl+M)',
    collapseAll: '缩进所有字段',
    descending: '降序',
    descendingTitle: '降序排列${type}的子节点',
    drag: '拖拽移动该节点(Alt+Shift+Arrows)',
    duplicateKey: '重复键',
    duplicateText: '复制',
    duplicateTitle: '复制选中字段(Ctrl+D)',
    duplicateField: '复制该字段(Ctrl+D)',
    duplicateFieldError: '重复的字段名称',
    cannotParseFieldError: '无法将字段解析为JSON',
    cannotParseValueError: '无法将值解析为JSON',
    empty: '清空',
    expandAll: '展开所有字段',
    expandTitle: '点击 展开/收缩 该字段(Ctrl+E). \n' +
      'Ctrl+Click 展开/收缩 包含所有子节点.',
    insert: '插入',
    insertTitle: '在此字段前插入类型为“auto”的新字段 (Ctrl+Ins)',
    insertSub: '选择要插入的字段类型',
    object: '对象',
    ok: 'Ok',
    redo: '重做 (Ctrl+Shift+Z)',
    removeText: '移除',
    removeTitle: '移除选中字段 (Ctrl+Del)',
    removeField: '移除该字段 (Ctrl+Del)',
    selectNode: '选择一个节点...',
    showAll: '展示全部',
    showMore: '展示更多',
    showMoreStatus: '显示${totalChilds}的${visibleChilds}项目.',
    sort: '排序',
    sortTitle: '排序${type}的子节点',
    sortTitleShort: '内容排序',
    sortFieldLabel: '字段：',
    sortDirectionLabel: '方向：',
    sortFieldTitle: '选择用于对数组或对象排序的嵌套字段',
    sortAscending: '升序排序',
    sortAscendingTitle: '按照该字段升序排序',
    sortDescending: '降序排序',
    sortDescendingTitle: '按照该字段降序排序',
    string: '字符串',
    transform: '变换',
    transformTitle: '筛选，排序，或者转换${type}的子节点',
    transformTitleShort: '筛选，排序，或者转换内容',
    transformQueryTitle: '输入JMESPath查询',
    transformWizardLabel: '向导',
    transformWizardFilter: '筛选',
    transformWizardSortBy: '排序',
    transformWizardSelectFields: '选择字段',
    transformQueryLabel: '查询',
    transformPreviewLabel: '预览',
    type: '类型',
    typeTitle: '更改字段类型',
    openUrl: 'Ctrl+Click 或者 Ctrl+Enter 在新窗口打开链接',
    undo: '撤销上次动作 (Ctrl+Z)',
    validationCannotMove: '无法将字段移入其子节点',
    autoType: '字段类型 "auto". ' +
      '字段类型由值自动确定 ' +
      '可以为 string，number，boolean，或者 null.',
    objectType: '字段类型 "object". ' +
      '对象包含一组无序的键/值对.',
    arrayType: '字段类型 "array". ' +
      '数组包含值的有序集合.',
    stringType: '字段类型 "string". ' +
      '字段类型由值自动确定，' +
      '但始终作为字符串返回.',
    modeCodeText: '代码',
    modeCodeTitle: '切换至代码高亮',
    modeFormText: '表单',
    modeFormTitle: '切换至表单编辑',
    modeTextText: '文本',
    modeTextTitle: '切换至文本编辑',
    modeTreeText: '树',
    modeTreeTitle: '切换至树编辑',
    modeViewText: '视图',
    modeViewTitle: '切换至树视图',
    examples: '例子',
    default: '缺省',
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
    duplicateFieldError: 'Nome do campo duplicado',
    cannotParseFieldError: 'Não é possível analisar o campo no JSON',
    cannotParseValueError: 'Não é possível analisar o valor em JSON',
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
      'mas sempre retornara um texto.',
    examples: 'Exemplos',
    default: 'Revelia',
  },
  tr: {
    array: 'Dizin',
    auto: 'Otomatik',
    appendText: 'Ekle',
    appendTitle: 'Bu alanın altına \'otomatik\' tipinde yeni bir alan ekle (Ctrl+Shift+Ins)',
    appendSubmenuTitle: 'Eklenecek alanın tipini seç',
    appendTitleAuto: '\'Otomatik\' tipinde yeni bir alan ekle (Ctrl+Shift+Ins)',
    ascending: 'Artan',
    ascendingTitle: '${type}\'ın alt tiplerini artan düzende sırala',
    actionsMenu: 'Aksiyon menüsünü açmak için tıklayın (Ctrl+M)',
    collapseAll: 'Tüm alanları kapat',
    descending: 'Azalan',
    descendingTitle: '${type}\'ın alt tiplerini azalan düzende sırala',
    drag: 'Bu alanı taşımak için sürükleyin (Alt+Shift+Arrows)',
    duplicateKey: 'Var olan anahtar',
    duplicateText: 'Aşağıya kopyala',
    duplicateTitle: 'Seçili alanlardan bir daha oluştur (Ctrl+D)',
    duplicateField: 'Bu alandan bir daha oluştur (Ctrl+D)',
    duplicateFieldError: 'Duplicate field name',
    cannotParseFieldError: 'Alan JSON\'a ayrıştırılamıyor',
    cannotParseValueError: 'JSON\'a değer ayrıştırılamıyor',
    empty: 'boş',
    expandAll: 'Tüm alanları aç',
    expandTitle: 'Bu alanı açmak/kapatmak için tıkla (Ctrl+E). \n' +
      'Alt alanlarda dahil tüm alanları açmak için Ctrl+Click ',
    insert: 'Ekle',
    insertTitle: 'Bu alanın üstüne \'otomatik\' tipinde yeni bir alan ekle (Ctrl+Ins)',
    insertSub: 'Araya eklenecek alanın tipini seç',
    object: 'Nesne',
    ok: 'Tamam',
    redo: 'Yeniden yap (Ctrl+Shift+Z)',
    removeText: 'Kaldır',
    removeTitle: 'Seçilen alanları kaldır (Ctrl+Del)',
    removeField: 'Bu alanı kaldır (Ctrl+Del)',
    selectNode: 'Bir nesne seç...',
    showAll: 'tümünü göster',
    showMore: 'daha fazla göster',
    showMoreStatus: '${totalChilds} alanın ${visibleChilds} alt alanları gösteriliyor',
    sort: 'Sırala',
    sortTitle: '${type}\'ın alt alanlarını sırala',
    sortTitleShort: 'İçerikleri sırala',
    sortFieldLabel: 'Alan:',
    sortDirectionLabel: 'Yön:',
    sortFieldTitle: 'Diziyi veya nesneyi sıralamak için iç içe geçmiş alanı seçin',
    sortAscending: 'Artan',
    sortAscendingTitle: 'Seçili alanı artan düzende sırala',
    sortDescending: 'Azalan',
    sortDescendingTitle: 'Seçili alanı azalan düzende sırala',
    string: 'Karakter Dizisi',
    transform: 'Dönüştür',
    transformTitle: '${type}\'ın alt alanlarını filtrele, sırala veya dönüştür',
    transformTitleShort: 'İçerikleri filterele, sırala veya dönüştür',
    transformQueryTitle: 'JMESPath sorgusu gir',
    transformWizardLabel: 'Sihirbaz',
    transformWizardFilter: 'Filtre',
    transformWizardSortBy: 'Sırala',
    transformWizardSelectFields: 'Alanları seç',
    transformQueryLabel: 'Sorgu',
    transformPreviewLabel: 'Önizleme',
    type: 'Tip',
    typeTitle: 'Bu alanın tipini değiştir',
    openUrl: 'URL\'i yeni bir pencerede açmak için Ctrl+Click veya Ctrl+Enter',
    undo: 'Son değişikliği geri al (Ctrl+Z)',
    validationCannotMove: 'Alt alan olarak taşınamıyor',
    autoType: 'Alan tipi "otomatik". ' +
      'Alan türü otomatik olarak değerden belirlenir' +
      've bir dize, sayı, boolean veya null olabilir.',
    objectType: 'Alan tipi "nesne". ' +
      'Bir nesne, sıralanmamış bir anahtar / değer çifti kümesi içerir.',
    arrayType: 'Alan tipi "dizi". ' +
      'Bir dizi, düzenli değerler koleksiyonu içerir.',
    stringType: 'Alan tipi "karakter dizisi". ' +
      'Alan türü değerden belirlenmez,' +
      'ancak her zaman karakter dizisi olarak döndürülür.',
    modeCodeText: 'Kod',
    modeCodeTitle: 'Kod vurgulayıcıya geç',
    modeFormText: 'Form',
    modeFormTitle: 'Form düzenleyiciye geç',
    modeTextText: 'Metin',
    modeTextTitle: 'Düz metin düzenleyiciye geç',
    modeTreeText: 'Ağaç',
    modeTreeTitle: 'Ağaç düzenleyiciye geç',
    modeViewText: 'Görünüm',
    modeViewTitle: 'Ağaç görünümüne geç',
    examples: 'Örnekler',
    default: 'Varsayılan',
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