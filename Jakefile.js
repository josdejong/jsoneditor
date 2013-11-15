/**
 * Jake build script
 */
var jake = require('jake'),
    path = require('path'),
    CleanCSS = require('clean-css'),
    archiver = require('archiver'),
    fs = require('fs');

require('jake-utils');

// constants
var JSONEDITOR = './jsoneditor.js',
    JSONEDITOR_CSS = './jsoneditor.css',
    JSONEDITOR_MIN = './jsoneditor-min.js',
    JSONEDITOR_CSS_MIN = './jsoneditor-min.css',
    BUILD = './build';

/**
 * default task
 */
desc('Execute all tasks');
task('default', ['clear', 'build', 'minify', 'zip', 'webapp', 'chromeapp'], function () {
  console.log('Done');
});

/**
 * build the library
 */
desc('Clear the build directory');
task('clear', function () {
  jake.rmRf(BUILD);
});

/**
 * build the library
 */
desc('Build the library');
task('build', ['clear'], function () {
  var jsoneditorSrc = './jsoneditor/';
  // concatenate the javascript files
  concat({
    src: [
      jsoneditorSrc + 'js/jsoneditor.js',
      jsoneditorSrc + 'js/treeeditor.js',
      jsoneditorSrc + 'js/texteditor.js',
      jsoneditorSrc + 'js/node.js',
      jsoneditorSrc + 'js/appendnode.js',
      jsoneditorSrc + 'js/contextmenu.js',
      jsoneditorSrc + 'js/history.js',
      jsoneditorSrc + 'js/modebox.js',
      jsoneditorSrc + 'js/searchbox.js',
      jsoneditorSrc + 'js/highlighter.js',
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
    header: read('./jsoneditor/js/header.js'),
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
  var zipfolder = BUILD + '/lib';
  var pkg = 'jsoneditor-' + version();
  var zipfile = zipfolder + '/' + pkg + '.zip';
  jake.mkdirP(zipfolder);

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
 * build the web app
 */
desc('Build web app');
task('webapp', ['build', 'minify'], function () {
  var webAppSrc = './app/web/';
  var libSrc = './lib/';
  var webApp = BUILD + '/app/web/';
  var webAppLib = webApp + 'lib/';
  var webAppAce = webAppLib + 'ace/';
  var webAppImg = webApp + 'img/';
  var appJs = webApp + 'app.js';
  var appCss = webApp + 'app.css';
  var appCssMin = webApp + 'app-min.css';
  var appJsMin = webApp + 'app-min.js';

  // create directories
  // TODO: should be created automatically...
  jake.mkdirP(webApp);
  jake.mkdirP(webAppLib);
  jake.mkdirP(webAppLib + 'ace/');
  jake.mkdirP(webAppLib + 'jsoneditor/');
  jake.mkdirP(webAppLib + 'jsoneditor/img/');
  jake.mkdirP(webAppLib + 'jsonlint/');
  jake.mkdirP(webAppImg);

  // concatenate the javascript files
  concat({
    src: [
      webAppSrc + 'queryparams.js',
      webAppSrc + 'ajax.js',
      webAppSrc + 'fileretriever.js',
      webAppSrc + 'notify.js',
      webAppSrc + 'splitter.js',
      webAppSrc + 'app.js'
    ],
    dest: appJs,
    separator: '\n'
  });

  // minify javascript
  minify({
    src: appJs,
    dest: appJsMin
  });

  // concatenate the css files
  concat({
    src: [
      webAppSrc + 'fileretriever.css',
      webAppSrc + 'app.css'
    ],
    dest: appCss,
    separator: '\n'
  });

  // minify css file
  write(appCssMin, new CleanCSS().minify(String(read(appCss))));

  // remove non minified javascript and css file
  fs.unlinkSync(appJs);
  fs.unlinkSync(appCss);

  // copy files
  jake.cpR('./README.md', webApp);
  jake.cpR('./HISTORY.md', webApp);
  jake.cpR('./NOTICE', webApp);
  jake.cpR('./LICENSE', webApp);
  jake.cpR('./LICENSE', webApp);
  jake.cpR(webAppSrc + 'cache.manifest', webApp);
  jake.cpR(webAppSrc + 'robots.txt', webApp);
  jake.cpR(webAppSrc + 'datapolicy.txt', webApp);
  jake.cpR(webAppSrc + 'index.html', webApp);
  jake.cpR(webAppSrc + 'favicon.ico', webApp);
  jake.cpR(webAppSrc + 'fileretriever.php', webApp);
  jake.cpR(webAppSrc + 'googlea47c4a0b36d11021.html', webApp);
  jake.cpR(webAppSrc + 'img/logo.png', webAppImg);
  jake.cpR(webAppSrc + 'img/header_background.png', webAppImg);
  jake.cpR(webAppSrc + 'doc/', webApp);

  // update date and verison in index.html
  replacePlaceholders(webApp + 'index.html');
  replacePlaceholders(webApp + 'index.html'); // TODO: fix bug in replace, should replace all occurrences
  replacePlaceholders(webApp + 'cache.manifest');

  // concatenate and copy ace files
  concat({
    src: [
      libSrc + 'ace/ace.js',
      libSrc + 'ace/mode-json.js',
      libSrc + 'ace/theme-textmate.js',
      libSrc + 'ace/theme-jsoneditor.js',
      libSrc + 'ace/ext-searchbox.js'
    ],
    dest: webAppAce + 'ace-min.js',
    separator: '\n'
  });
  jake.cpR(libSrc + 'ace/worker-json.js', webAppAce);

  // copy json lint file
  jake.cpR(libSrc + 'jsonlint/jsonlint.js', webAppLib + 'jsonlint/')

  // copy jsoneditor files
  jake.cpR(JSONEDITOR_MIN, webAppLib + 'jsoneditor/');
  jake.cpR(JSONEDITOR_CSS_MIN, webAppLib + 'jsoneditor/');
  jake.cpR('img', webAppLib + 'jsoneditor/');

});

/**
 * build the chrome app
 */
desc('Build chrome app');
task('chromeapp', {async: true}, function () {
  var folder = BUILD + '/app/';
  var file = folder + 'chrome.zip';
  jake.mkdirP(folder);

  var output = fs.createWriteStream(file);
  var archive = archiver('zip');

  archive.on('error', function(err) {
    throw err;
  });

  // create a temporary manifest file with version number
  var manifestTmp = folder + 'manifest.json.tmp';
  jake.cpR('./app/chrome/manifest.json', manifestTmp);
  replacePlaceholders(manifestTmp);

  archive.pipe(output);
  archive.append(fs.createReadStream(manifestTmp), {name: 'manifest.json'});
  archive.append(fs.createReadStream('./app/web/img/icon_16.png'), {name: 'icon_16.png'});
  archive.append(fs.createReadStream('./app/web/img/icon_128.png'), {name: 'icon_128.png'});

  // cleanup temporary manifest file
  fs.unlinkSync(manifestTmp);

  archive.finalize(function(err, written) {
    if (err) {
      throw err;
    }

    console.log('Created chrome app ' + file);
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
