const module = '../../../dist/jsoneditor'
require([module], function (JSONEditor) {
  // create the editor
  const container = document.getElementById('jsoneditor')
  const editor = new JSONEditor(container)

  // set json
  document.getElementById('setJSON').onclick = function () {
    const json = {
      array: [1, 2, 3],
      boolean: true,
      null: null,
      number: 123,
      object: { a: 'b', c: 'd' },
      string: 'Hello World'
    }
    editor.set(json)
  }

  // get json
  document.getElementById('getJSON').onclick = function () {
    const json = editor.get()
    window.alert(JSON.stringify(json, null, 2))
  }
})
