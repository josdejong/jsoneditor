import { translate } from './i18n'

let index = 1

const expandAllButton = {
  index: index++,
  name: 'expandAll',
  align: 'left',
  type: 'button',
  title: translate('expandAll'),
  className: 'jsoneditor-expand-all',
  mode: ['tree', 'view', 'form'],
  target: function (editor, button) {
    editor.expandAll()
  }
}

const collapseAllButton = {
  index: index++,
  name: 'collapseAll',
  align: 'left',
  type: 'button',
  title: translate('collapseAll'),
  className: 'jsoneditor-collapse-all',
  mode: ['tree', 'view', 'form'],
  target: function (editor) {
    editor.collapseAll()
  }
}

const formatButton = {
  index: index++,
  name: 'format',
  align: 'left',
  type: 'button',
  title: translate('formatTitle'),
  className: 'jsoneditor-format',
  mode: ['code', 'text'],
  target: function (editor) {
    try {
      editor.format()
      editor._onChange()
    } catch (err) {
      editor._onError(err)
    }
  }
}

const compactButton = {
  index: index++,
  name: 'compact',
  align: 'left',
  type: 'button',
  title: translate('compactTitle'),
  className: 'jsoneditor-compact',
  mode: ['code', 'text'],
  target: function (editor) {
    try {
      editor.compact()
      editor._onChange()
    } catch (err) {
      editor._onError(err)
    }
  }
}

const sortButton = {
  index: index++,
  name: 'sort',
  align: 'left',
  type: 'button',
  title: translate('sortTitleShort'),
  className: 'jsoneditor-sort',
  mode: ['code', 'text', 'tree', 'view', 'form'],
  target: function (editor) {
    if (['code', 'text'].indexOf(editor.options.mode) !== -1) {
      editor._showSortModal()
    } else if (['tree', 'view', 'form'].indexOf(editor.options.mode) !== -1) {
      editor.node.showSortModal()
    } else {
      console.warn('Sort unsupport for mode ' + editor.options.mode)
    }
  },
  checkEnableKey: 'enableSort'
}

const transformButton = {
  index: index++,
  name: 'transform',
  align: 'left',
  type: 'button',
  title: translate('transformTitleShort'),
  className: 'jsoneditor-transform',
  mode: ['code', 'text', 'tree', 'view', 'form'],
  target: function (editor) {
    if (['code', 'text'].indexOf(editor.options.mode) !== -1) {
      editor._showTransformModal()
    } else if (['tree', 'view', 'form'].indexOf(editor.options.mode) !== -1) {
      editor.node.showTransformModal()
    } else {
      console.warn('Transform unsupport for mode ' + editor.options.mode)
    }
  },
  checkEnableKey: 'enableTransform'
}

const repairButton = {
  index: index++,
  name: 'repair',
  align: 'left',
  type: 'button',
  title: translate('repairTitle'),
  className: 'jsoneditor-repair',
  mode: ['code', 'text'],
  target: function (editor) {
    try {
      editor.repair()
      editor._onChange()
    } catch (err) {
      editor._onError(err)
    }
  }
}

const undoButtonForCodeMode = {
  index: index++,
  name: 'undo',
  align: 'left',
  type: 'button',
  title: translate('undo'),
  className: 'jsoneditor-undo jsoneditor-separator',
  mode: ['code'],
  target: function (editor) {
    editor.aceEditor.getSession().getUndoManager().undo()
  },
  afterCreate: function (editor, buttonElement) {
    editor.dom.undo = buttonElement
  }
}

const redoButtonForCodeMode = {
  index: index++,
  name: 'redo',
  align: 'left',
  type: 'button',
  title: translate('redo'),
  className: 'jsoneditor-redo',
  mode: ['code'],
  target: function (editor) {
    editor.aceEditor.getSession().getUndoManager().redo()
  },
  afterCreate: function (editor, buttonElement) {
    editor.dom.redo = buttonElement
  }
}

const undoRedoButtonPairForTreeMode = {
  index: index++,
  name: 'undoRedoPair',
  checkInEditorKey: 'history',
  mode: ['tree', 'view', 'form'],
  afterCreate: function (editor, createdButtonMap) {
    editor.history.onChange = () => {
      createdButtonMap.undo.disabled = !editor.history.canUndo()
      createdButtonMap.redo.disabled = !editor.history.canRedo()
    }
    editor.history.onChange()
  },
  children: [
    {
      name: 'undo',
      align: 'left',
      type: 'button',
      title: translate('undo'),
      className: 'jsoneditor-undo jsoneditor-separator',
      target: function (editor) {
        editor._onUndo()
      },
      afterCreate: function (editor, buttonElement) {
        editor.dom.undo = buttonElement
      }
    },
    {
      name: 'redo',
      align: 'left',
      type: 'button',
      title: translate('redo'),
      className: 'jsoneditor-redo',
      target: function (editor) {
        editor._onRedo()
      },
      afterCreate: function (editor, buttonElement) {
        editor.dom.redo = buttonElement
      }
    }
  ]
}

const _buttons = [
  formatButton,
  compactButton,
  sortButton,
  transformButton,
  repairButton,
  undoButtonForCodeMode,
  redoButtonForCodeMode,
  expandAllButton,
  collapseAllButton,
  undoRedoButtonPairForTreeMode
]

export const defaultOptions = {
  buttons: _buttons
}
