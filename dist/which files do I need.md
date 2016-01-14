# Which files do I need?

Ehhh, that's quite some files in this dist folder. Which files do I need?


## Full version

If you're not sure which version to use, use the full version.

Which files are needed when using the full version?

- jsoneditor.min.js
- jsoneditor.map (optional, for debugging purposes only)
- jsoneditor.min.css
- img/jsoneditor-icons.svg


## Minimalist version

The minimalist version has excluded the following libraries:

- `ace` (via `brace`), used for the code editor.
- `ajv`, used for JSON schema validation.

This reduces the the size of the minified and gzipped JavaScript file from
about 160 kB to about 40 kB.

When to use the minimalist version?

- If you don't need the mode "code" and don't need JSON schema validation.
- Or if you want to provide `ace` and/or `ajv` yourself via the configuration
  options, for example when you already use Ace in other parts of your
  web application too and don't want to bundle the library twice.

Which files are needed when using the minimalist version?

- jsoneditor-minimalist.min.js
- jsoneditor-minimalist.map (optional, for debugging purposes only)
- jsoneditor.min.css
- img/jsoneditor-icons.svg

