# Styling Reference

Documentation for writing custom JSON Editor styles.

## Node
Node is the fundamental unit that makes up the hierarchical JSON display in the Form, Tree, and View modes. It can be
customized with several classes that reflect its type and state.

- `jsoneditor-field`: the property name
- `jsoneditor-value`: the value of the property
  - The value element will have one of the following classes depending on its type:
    - `jsoneditor-null`
    - `jsoneditor-undefined`
    - `jsoneditor-number`
    - `jsoneditor-string`
    - `jsoneditor-string jsoneditor-color-value`
    - `jsoneditor-boolean`
    - `jsoneditor-regexp`
    - `jsoneditor-array`
    - `jsoneditor-object`
    - `jsoneditor-url`
  - `jsoneditor-is-default`: applied to the value element when the value matches the default from the schema
  - `jsoneditor-is-not-default`: applied to the value element when the value does not match the default from the schema
- `jsoneditor-schema-error`: the warning icon that appears when the Node has a schema validation error
  - `jsoneditor-popover`: the popover that appears when hovering over the schema validation error warning icon
