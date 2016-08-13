# Which files do I need?

There are two versions available: a full version and a minimalist version.

## Full version

If you're not sure which version to use, use the full version: jsoneditor.js.


## Minimalist version

The minimalist version, jsoneditor-minimalist.js, has excluded the following libraries:

- `ace` (via `brace`), used for the code editor.
- `ajv`, used for JSON schema validation.

This reduces the the size of the minified and gzipped JavaScript considerably.

When to use the minimalist version?

- If you don't need the mode "code" and don't need JSON schema validation.
- Or if you want to provide `ace` and/or `ajv` yourself via the configuration
  options, for example when you already use Ace in other parts of your
  web application too and don't want to bundle the library twice.
