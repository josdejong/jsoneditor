# JSON Editor - History

https://github.com/josdejong/jsoneditor


## 2016-08-17, version 5.5.7

- Fixed #308: wrong positioning of label "empty array" when `onEditable`
  returns false.


## 2016-06-15, version 5.5.6

- Fixed #303: editor contents collapsed when the parent div of the JSONEditor
  has no height set.
- Improved example 04_load_and_save.html. Thanks @RDCH106.


## 2016-05-24, version 5.5.5

- Fixed #298: Switch mode button disappears when switching from text/code to
  tree/form/view mode when the JSON contained errors.
- Fixed enum drop downs not working when the JSONEditor is configured with
  a name.


## 2016-05-22, version 5.5.4

- Fixed #285: an issue with the enum drop down when having defined multiple
  enums in a JSON schema.
- Fixed a (harmless) error in the console when clicking right from an enum
  drop down.


## 2016-05-22, version 5.5.3

- Fixed #299: reverted the fix of #268 by trimming text in fields and values.


## 2016-04-18, version 5.5.2

- Fixed #294: Fields reset their caret location on every key press in Firefox.


## 2016-04-16, version 5.5.1

- Fixed enum select boxes not being rendered/removed when setting or removing
  a JSON schema via `editor.setSchema(schema)`.


## 2016-04-16, version 5.5.0

- Implemented a dropdown for values having an JSON Schema enum.
  Thanks @tdakanalis.
- Fixed #291, #292: Some CSS broken when using the editor in combination with
  bootstrap. Thanks @nucleartide.

## 2016-04-09, version 5.4.0

- Upgraded all dependencies (`ajv`, `brace`, etc).
- Fixed #289: Some CSS breaking when using the editor in combination with
  materialize.css or bootstrap.
- Fixed #290: `setText()` not working in mode text or code.


## 2016-04-06, version 5.3.0

- Implemented support for sorting object keys naturally. Thanks @edufelipe.
- Sorting object keys or array items via the context menu is now also naturally
  sorted.
- Fixed #283: improved JSON schema error message in case of no
  additionalProperties.
- Fixed #286: Calling `get()` or `getText()` caused the editor to lose focus.
  A regression introduced in v5.2.0.


## 2016-03-20, version 5.2.0

- Implemented method `editor.destroy()` to properly cleanup the editor (#278).
- Fixed #268: JSONEditor now trims text in fields and values.
- Fixed #280: Some CSS issues when used in combination with bootstrap.


## 2016-02-15, version 5.1.5

- Fixed #272: Checkbox for boolean values visible in view mode.


## 2016-02-13, version 5.1.4

- Fixed broken example 04_load_and_save.html. See #265.


## 2016-02-03, version 5.1.3

- Fixed #264: Clicking items in the context menu not working on Firefox.


## 2016-01-21, version 5.1.2

- Improvements in sanitizing invalid JSON.
- Updated dependencies to the latest version.
- Fixed clicking format/compact not triggering an onChange event.
- Fixed #259: when having a JSONEditor inside an HTML form, clicking an entry
  in the context menu did submit the form.
- Fixed browserify build, see #260. Thanks @onip.


## 2016-01-16, version 5.1.1

- Fixed #257: Improving error messages for enum errors failed when the
  schema contains references.
- Fixed #255: Removed wrong console warning about the option `search`.
- Fixed error thrown when option `search` is false (see #256). Thanks @MiroHibler.


## 2016-01-14, version 5.1.0

- Implemented support for JSON schema validation, powered by `ajv`.
- Implemented #197: display an error in case of duplicate keys in an object.
- Implemented #183: display a checkbox left from boolean values, so you can
  easily switch between true/false.
- Implemented debouncing of keyboard input, resulting in much less history
  actions whilst typing.
- Added a minimalist bundle to the `dist` folder, excluding `ace` and `ajv`.
- Fixed #222: editor throwing `onChange` events when switching mode.
- Fixed an error throw when switching to mode "code" via the menu.
- Fixed interfering shortcut keys: changed quick keys to select multiple fields
  from `Shift+Arrow Up/Down` to `Ctrl+Shift+Arrow Up/Down`.



## 2015-12-31, version 5.0.1

- Fixed a bug in positioning of the context menu for multiple selected nodes.
- Fixed #130: option `onEditable` not available in mode `form`.
- Fixed #202: removed `version` field from bower.json.


## 2015-12-31, version 5.0.0

- New design.
- Implemented selection of multiple nodes, allowing to move/duplicate/remove
  multiple nodes at once (See #106).
- Implemented a new option `escapeUnicode`, which will show the hexadecimal 
  unicode instead of the character itself. (See #93 and #230).
- Implemented method `getMode`.
- Implemented option `onModeChange(oldMode, newMode)`.
- Implemented #203: Objects and arrays in mode `form` and `view` are now
  expandable by clicking the field names too.
- Replaced the PNG icon images with SVG. Thanks @1j01.
- Renamed all CSS classes They now have prefixes `.jsoneditor-` to prevent
  name collisions with css frameworks like bootstrap.
- Renamed options `change`, `editable`, `error` to respectively `onChange`,
  `onEditable`, and `onError`. Old options are still working and give a 
  deprecation warning.
- Colors of values are now customizable using CSS. 
- JSONEditor new throws a warning in the console in case of unknown options.
- Fixed #93 and #227: html codes like `&amp;` not escaped.
- Fixed #149: Memory leak when switching mode from/to `code` mode, web worker
  of Ace editor wasn't cleaned up.
- Fixed #234: Remove dependency on a fork of the `jsonlint` project on github.
- Fixed: disabled `Ctrl+L` quick key to go to a line, instead use the default
  browser behavior of selecting the address bar.
- Fixed #38: clear search results after a new JSON object is set.
- Fixed #242: row stays highlighted when dragging outside editor.
- Fixed quick-keys Shift+Alt+Arrows not registering actions in history.
- Fixed #104: context menus are now positioned relative to the elements of the 
  editor instead of an absolute position in the window.


## 2015-06-13, version 4.2.1

- Fixed #161: Cannot select text in Ace editor on systems using Chinese fonts.


## 2015-05-14, version 4.2.0

- Implemented option `theme`, allowing to set a custom theme for the Ace 
  editor. Thanks @nfvs.
- Implemented option `ace`, which allows to pass a custom instance of the Ace
  instead of the embedded version.
- Fixed #186: binding issue to `jsonlint.parse`.
- Fixed `editor.get()` manipulating the code when containing an error.


## 2015-03-15, version 4.1.1

- Added missing file `index.js` to the bower package.
  

## 2015-03-15, version 4.1.0

- Implemented a function `focus()` for modes tree, view, and form.
- Added `./src` folder to the distributed package, needed for usage via
  node.js/browserify.


## 2015-02-28, version 4.0.0

- Ace editor and jsonlint are now packed with jsoneditor.js by default.
  This makes the library about 4 times larger. If Ace is not needed, a custom
  build of the library can be done.
- The distribution files are now moved from the root to the `/dist` folder.
- Reworked the source code to CommonJS modules, using `brace` to load Ace.
- JSONP is now automatically stripped from JSON. Thanks @yanivefraim.
- Fixed bugs in the JSON sanitizer, no longer manipulating JSON-like structures
  inside strings.


## 2015-01-25, version 3.2.0

- Implemented shortcut keys `Ctrl+\` to format and `Ctrl+Shift+\` to compact
  JSON when in mode `text` or `code`.
- Before an error is thrown because of invalid text, the editor first tries to
  sanitize the text (replace JavaScript notation with JSON notation), and only
  after that throws the error.
- Fixed Node.path() not working for a JSON Object `""`. Thanks @tomalec.
- Minor styling improvements.
- Fixed configured indentation not being applied to Ace editor.


## 2014-09-03, version 3.1.2

- Some fixes/improvements in `parseJS` (to parse a JSON object from a JavaScript
  object).
- Fixed the lack of a semi colon at end of the bundled files.


## 2014-08-01, version 3.1.1

- Replaced parsing of JavaScript objects into JSON from `eval` to a dedicated
  `parseJS` function.


## 2014-07-28, version 3.1.0

- JSONEditor now accepts JavaScript objects as input, and can turn them into
  valid JSON. For example `{a:2,b:'str'}` can be turned into `{"a":2,"b":"str"}`.
- Implemented an option `editable`, a callback function, which allows to set 
  individual nodes (their field and/or value) editable or read-only.
- Fixed: shortcut keys to manipulate the nodes are now disabled when mode 
  is `form` or `view`.


## 2014-05-31, version 3.0.0

- Large code reorganization.
- Editor must be loaded as `new JSONEditor(...)` instead of 
  `new jsoneditor.JSONEditor(...)`.
- Css is not automatically loaded anymore when using AMD.
- Web application has been moved to another project.


## 2014-01-03, version 2.3.6

- Fixed positioning issue of the action menu.


## 2013-12-09, version 2.3.5

- Fixed a positioning issue of the action menu again.
- Fixed an issue with non-breaking space characters.


## 2013-11-19, version 2.3.4

- Dropped support for IE8, cleaned up legacy code for old browsers.
- Disabled saving files using HTML5 on Firefox to prevent a Firefox bug
  blocking cut/paste functionality in editable divs after using a.download.


## 2013-10-17, version 2.3.3

- Added support for search (Ctrl+F) in the code editor Ace.
- Fixed a positioning issue of the action menu when in bootstrap modal.
  (thanks tsash).


## 2013-09-26, version 2.3.2

- The web application is now available offline. Thanks ayanamist.


## 2013-09-24, version 2.3.1

- Fixed non-working action menu when in bootstrap modal (z-index issue).
- Fixed missing main field in package.json.


## 2013-09-13, version 2.3.0

- Implemented an option `modes`, which creates a menu in the editor
  where the user can switch between the selected editor modes.
- Fixed wrong title on fields with value `null`.
- Fixed buggy loading of files in the web application.


## 2013-08-01, version 2.2.2

- Fixed non working option `indentation`.
- Fixed css not being loaded with AMD in case of multiple scripts.
- Fixed a security error in the server side file retriever script of
  the web application.


## 2013-05-27, version 2.2.1

- Fixed undefined options in TextEditor. Thanks Wiseon3.
- Fixed non-working save function on Firefox 21. Thanks youxiachai.


## 2013-05-04, version 2.2.0

- Unified JSONFormatter and JSONEditor in one editor with a switchable mode.
- Urls are navigable now.
- Improved error and log handling.
- Added jsoneditor to package managers npm and bower.


## 2013-03-11, version 2.1.1

- Fixed an issue with console outputs on IE8, causing the editor not to work
  at all on IE8.


## 2013-03-08, version 2.1.0

- Replaced the plain text editor with code editor Ace, which brings in syntax
  highlighting and code inspection.
- Improved the splitter between the two panels. Panels can be hided.


## 2013-02-26, version 2.0.2

- Fixed: dragarea of the root node was wrongly visible is removed now.


## 2013-02-21, version 2.0.1

- Fixed undefined variable in the redo method.
- Removed the "hide ads" button. Not allowed by Google AdSense, sorry.


## 2013-02-09, version 2.0.0

- Implemented a context menu, replacing the action buttons on the right side of
  the editor and the inline action buttons. This gives a cleaner interface,
  more space for the actual contents, and more room for new controls (like
  insert and sort).
- Implemented shortcut keys. The JSON Editor can be used with just a keyboard.
- Implemented sort action, which sorts the childs of an array or object.
- Implemented auto scrolling up and down when dragging a node and reaching
  the top or bottom of the editor.
- Added support for CommonJS and RequireJS.
- Added more examples.
- Improved performance and memory usage.
- Implemented a new mode 'form', in which only values are editable and the
  fields are fixed.
- Minor improvements and bug fixes.


## 2012-12-08, version 1.7.0

- Implemented two modes: 'editor' (default), and 'viewer'. In viewer mode,
  the data and datastructure is read-only.
- Implemented methods set(json, name), setName(name), and getName(), which
  allows for setting and getting the field name of the root node.
- Fixed an issue where the search bar does not work when there is no global
  window.editor object.


## 2012-11-26, version 1.6.2

- Fixed a bug in the change callback handler, resulting in an infinite loop
  when requesting the contents of the editor inside the callback (issue #19).


## 2012-11-21, version 1.6.1

- Added a request header "Accept: application/json" when loading files and urls.


## 2012-11-03, version 1.6.0

- Added feature to the web application to load and save files from disk and url.
- Improved error messages in the web application using JSONLint.
- Made the web application pass the W3C markup validation service.
- Added option 'change' to both editor and formatter, which allows to set a
  callback which is triggered when the contents of the editor or formatter
  changes.
- Changed the default indentation of the JSONFormatter to 4 spaces.
- Renamed options 'enableSearch' and 'enableHistory' to 'search' and 'history'
  respectively.
- Added parameter 'json' to the JSONFormatter constructor.
- Added option 'indentation' to the JSONFormatter.


## 2012-10-08, version 1.5.1

- Replaced the paid Chrome App with a free, hosted Chrome App (with ads).


## 2012-10-02, version 1.5.0

- Implemented history: undo/redo all actions.
- Created menu icons (instead of text buttons).
- Cleaned up the code (removed unused params, improved comments, etc).
- Minor performance improvements.


## 2012-08-31, version 1.4.4

- Changed: description of advertisement now gives information about the Chrome
  App (without ads).
- Changed: Chrome App is now configured to be available offline.
- Fixed: When zooming your browser window, the fields/values did get wrapped
  on Chrome (thanks Henri Gourvest), and on Firefox sometimes the jsoneditor
  disappeared due to wrapping of the interface contents.


## 2012-08-25, version 1.4.3

- Changed: changed code for the buttons to copy from formatter to editor and
  vice versa, no inline javascript (gives security policy errors in chrome app).


## 2012-08-25, version 1.4.2

- Changed: other bootstrapping mechanism for the chrome app, in a separate
  javascript file, as inline javascript is not allowed (security policy).
- Fixed: drop down menu for changing the field type did throw javascript errors
  (did not break any functionality though).


## 2012-08-23, version 1.4.1

- New: Chrome app created.


## 2012-08-23, version 1.4.0

- New: Improved icon, logo, and interface header.


## 2012-08-19, version 1.3.0

- New: Added buttons next and previous to the search box in the upper right.
- New: Escape characters are automatically inserted before " and \ missing
  and escape character, making the string contents valid JSON. New lines are
  automatically replaced with \n. (Thanks Steve Clay)
- Changed: all icons have been put in a single sprite. This will improve page
  load times as there are much less server requests needed to load the editor.


## 2012-08-12, version 1.2.0

- New: Added search functionality. Search results are expanded and highlighed.
  Quickkeys in the search box: Enter (next), Shift+Enter (previous), Ctrl+Enter
  (search again).
- New: The position of the vertical separator between left and right panel is
  stored.
- New: Link to the sourcecode on github added at the bottom of the page.
- Changed: Refinements in the layout: fonts, colors, icons.
- Fixed: leading an trailing spaces not being displayed in the editor.
- Fixed: wrapping of long words and urls in Chrome.
- Fixed: ignoring functions and undefined values in the loaded JSON object
  (they where interpreted as empty object and string instead of being ignored).


## 2012-07-01, version 1.1.1

- Fixed global event listener for the focus/blur events, causing changes in
  fields and values not always being registered.
- Fixed a css issue with Firefox (box-sizing of the editor).


## 2012-04-24, version 1.1

- Fixed a bug. Dragging an object down which has been expanded and collapsed
  again did not work.
- Using a minified version of jsoneditor.js, to improve page load time and
  save bandwidth.


## 2012-04-21, version 1.0

- Values are no longer aligned in one global column, but placed directly right
  from the field. Having field and value close together improves readability,
  especially in case of deeply nested data.
- Values are colorized by their type: strings are green, values read, booleans
  blue, and null is purple.
- Font is changed to a monotype font for better readability.
- Special characters like \t are now handled nicely.
- Overall performance and memory usage improved.
- When clicking on whitespace, focus is set to the closest field or value.
- some other small interface tweaks.
- Fixed a bug with casting a value from type auto to string and vice versa
  (the value was not casted at all).


## 2012-03-01, version 0.9.10

- Nicer looking select box for the field types, with icons.
- Improved drag and drop: better visualized, and now working in all browers.
- Previous values will be restored after changing the type of a field. When
  changing the type back, the previous value or childs will be restored.
- When hovering buttons (fieldtype, duplicate, delete, add) or when dragging
  a field, corresponding field including its childs is highlighted. This makes
  it easier to see what part of the data will be edited.
- Errors are now displayed in a message window on top of the page instead of
  an alert which pops up.
- Fixed a bug with displaying enters in fields.
- Fixed a bug where the last trailing enter was removed when setting json
  in the editor.
- Added a fix to get around Internet Explorer 8 issues with vertical scrollbars.


## 2012-01-29, version 0.9.9

- Fields can be duplicated
- Support for drag and drop:
  - fields in the editor itself can be moved via drag and drop
  - fields can be exported from the editor as JSON
  - external JSON can be dropped inside the editor
- When changing type from array to object and vice versa, childs will be
  maintained instead of removed.
- Updated interface. Works now in IE8 too.


## 2012-01-16, version 0.9.8

- Improved the performance of expanding a node with all its childs.


## 2012-01-09, version 0.9.7

- Added functionallity to expand/collapse a node and all its childs. Click
  the expand button of a node while holding Ctrl down.
- Small interface improvements


## 2011-11-28, version 0.9.6

- First fully usable version of the JSON editor
