/**
 * Jake build script
 */
var jake = require('jake'),
    CleanCSS = require('clean-css'),
    archiver = require('archiver'),
    fs = require('fs');

require('jake-utils');

// constants
var BUILD = './',
    ASSET = BUILD + 'asset/',
    BUILD_ACE = BUILD + 'asset/ace/',
    BUILD_JSONLINT = BUILD + 'asset/jsonlint/',
    JSONEDITOR = BUILD +'jsoneditor.js',
    JSONEDITOR_CSS = BUILD + 'jsoneditor.css',
    JSONEDITOR_MIN = BUILD + 'jsoneditor.min.js',
    JSONEDITOR_CSS_MIN = BUILD + 'jsoneditor.min.css';

/**
 * default task
 */
desc('Execute all tasks');
task('default', ['clear', 'build', 'minify'], function () {
  console.log('Done');
});

/**
 * build the library
 */
desc('Clear the asset directory');
task('clear', function () {
  jake.rmRf(ASSET);
});

/**
 * build the library
 */
desc('Build the library');
task('build', ['clear'], function () {
  var jsoneditorSrc = './src/';
  // concatenate the javascript files
  concat({
    src: [
      jsoneditorSrc + 'js/JSONEditor.js',
      jsoneditorSrc + 'js/TreeEditor.js',
      jsoneditorSrc + 'js/TextEditor.js',
      jsoneditorSrc + 'js/Node.js',
      jsoneditorSrc + 'js/AppendNode.js',
      jsoneditorSrc + 'js/ContextMenu.js',
      jsoneditorSrc + 'js/History.js',
      jsoneditorSrc + 'js/modebox.js',
      jsoneditorSrc + 'js/SearchBox.js',
      jsoneditorSrc + 'js/Highlighter.js',
      jsoneditorSrc + 'js/util.js',
      jsoneditorSrc + 'js/module.js'
    ],
    dest: JSONEDITOR,
    header: read(jsoneditorSrc +'js/header.js') + '\n' +
        '(function () {\n',
    separator: '\n',
    footer: '\n})();\n'
  });

  // update version number and stuff in the javascript files
  replacePlaceholders(JSONEDITOR);
  console.log('Created ' + JSONEDITOR);

  // concatenate and stringify the css files
  concat({
    src: [
      jsoneditorSrc + 'css/jsoneditor.css',
      jsoneditorSrc + 'css/contextmenu.css',
      jsoneditorSrc + 'css/menu.css',
      jsoneditorSrc + 'css/searchbox.css'
    ],
    dest: JSONEDITOR_CSS,
    separator: '\n'
  });
  console.log('Created ' + JSONEDITOR_CSS);

  // minify the css file
  write(JSONEDITOR_CSS_MIN, new CleanCSS().minify(String(read(JSONEDITOR_CSS))));

  // create a folder img and copy the icons
  jake.mkdirP('./img');
  jake.cpR(jsoneditorSrc + 'css/img/jsoneditor-icons.png', './img/');
  console.log('Copied jsoneditor-icons.png to ./img/');

  // copy assets
  // concatenate and copy ace files
  var aceSrc = './node_modules/ace/build/src-min/';
  jake.mkdirP(BUILD_ACE);
  concat({
    src: [
          aceSrc + 'ace.js',
          aceSrc + 'ext-searchbox.js',
          aceSrc + 'mode-json.js',
          aceSrc + 'theme-textmate.js',
          jsoneditorSrc + 'js/ace/theme-jsoneditor.js'
    ],
    dest: BUILD_ACE + 'ace.js',
    separator: '\n'
  });
  jake.cpR(aceSrc + 'worker-json.js', BUILD_ACE);

  // copy and minify json lint file
  jake.mkdirP(BUILD_JSONLINT);
  minify({
    src: './node_modules/jsonlint/lib/jsonlint.js',
    dest: BUILD_JSONLINT + 'jsonlint.js'
  });
});

/**
 * minify the library
 */
desc('Minify the library');
task('minify', ['build'], function () {
  // minify javascript
  minify({
    src: JSONEDITOR,
    dest: JSONEDITOR_MIN,
    header: read('./src/js/header.js'),
    separator: '\n'
  });

  // update version number and stuff in the javascript files
  replacePlaceholders(JSONEDITOR_MIN);

  console.log('Created ' + JSONEDITOR_MIN);
});

/**
 * zip the library
 */
desc('Zip the library');
task('zip', ['build', 'minify'], {async: true}, function () {
  var pkg = 'jsoneditor-' + version();
  var zipfile = BUILD + pkg + '.zip';
  jake.mkdirP(BUILD);

  var output = fs.createWriteStream(zipfile);
  var archive = archiver('zip');

  archive.on('error', function(err) {
    throw err;
  });

  archive.pipe(output);

  var filelist = new jake.FileList();
  filelist.include([
    'README.md',
    'NOTICE',
    'LICENSE',
    'HISTORY.md',
    JSONEDITOR,
    JSONEDITOR_CSS,
    JSONEDITOR_MIN,
    JSONEDITOR_CSS_MIN,
    'img/*.*',
    'lib/**/*.*',
    'docs/**/*.*',
    'examples/**/*.*'
  ]);
  var files = filelist.toArray();
  files.forEach(function (file) {
    archive.append(fs.createReadStream(file), {
      name: pkg + '/' + file
    })
  });

  archive.finalize(function(err, written) {
    if (err) {
      throw err;
    }

    console.log('Zipped ' + zipfile);
    complete();
  });
});

/**
 * replace version, date, and name placeholders in the provided file
 * @param {String} filename
 */
var replacePlaceholders = function (filename) {
  replace({
    replacements: [
      {pattern: '@@date',    replacement: today()},
      {pattern: '@@version', replacement: version()}
    ],
    src: filename
  });
};
