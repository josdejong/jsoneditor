var fs = require('fs');
var gulp = require('gulp');
var gutil = require('gulp-util');
var concatCss = require('gulp-concat-css');
var minifyCSS = require('gulp-clean-css');
var shell = require('gulp-shell');
var mkdirp = require('mkdirp');
var webpack = require('webpack');
var uglify = require('uglify-js');

var NAME    = 'jsoneditor';
var NAME_MINIMALIST = 'jsoneditor-minimalist';
var ENTRY   = './src/js/JSONEditor.js';
var HEADER  = './src/js/header.js';
var IMAGE   = './src/css/img/jsoneditor-icons.svg';
var DOCS    = './src/docs/*';
var DIST    = './dist';

// generate banner with today's date and correct version
function createBanner() {
  var today = gutil.date(new Date(), 'yyyy-mm-dd'); // today, formatted as yyyy-mm-dd
  var version = require('./package.json').version;  // math.js version

  return String(fs.readFileSync(HEADER))
      .replace('@@date', today)
      .replace('@@version', version);
}

var bannerPlugin = new webpack.BannerPlugin(createBanner(), {
  entryOnly: true,
  raw: true
});

// create a single instance of the compiler to allow caching
var compiler = webpack({
  entry: ENTRY,
  output: {
    library: 'JSONEditor',
    libraryTarget: 'umd',
    path: DIST,
    filename: NAME + '.js'
  },
  plugins: [ bannerPlugin ],
  module: {
    loaders: [
      { test: /\.json$/, loader: "json" }
    ]
  },
  cache: true
});

// create a single instance of the compiler to allow caching
var compilerMinimalist = webpack({
  entry: ENTRY,
  output: {
    library: 'JSONEditor',
    libraryTarget: 'umd',
    path: DIST,
    filename: NAME_MINIMALIST + '.js'
  },
  plugins: [
    bannerPlugin,
    new webpack.IgnorePlugin(new RegExp('^brace$')),
    new webpack.IgnorePlugin(new RegExp('^ajv'))
  ],
  cache: true
});

function minify(name) {
  var result = uglify.minify([DIST + '/' + name + '.js'], {
    outSourceMap: name + '.map',
    output: {
      comments: /@license/
    }
  });

  var fileMin = DIST + '/' + name + '.min.js';
  var fileMap = DIST + '/' + name + '.map';

  fs.writeFileSync(fileMin, result.code);
  fs.writeFileSync(fileMap, result.map);

  gutil.log('Minified ' + fileMin);
  gutil.log('Mapped ' + fileMap);
}

// make dist and dist/img folders
gulp.task('mkdir', function () {
  mkdirp.sync(DIST);
  mkdirp.sync(DIST + '/img');
});

// bundle javascript
gulp.task('bundle', ['mkdir'], function (done) {
  // update the banner contents (has a date in it which should stay up to date)
  bannerPlugin.banner = createBanner();

  compiler.run(function (err, stats) {
    if (err) {
      gutil.log(err);
    }

    gutil.log('bundled ' + NAME + '.js');

    done();
  });
});

// bundle minimalist version of javascript
gulp.task('bundle-minimalist', ['mkdir'], function (done) {
  // update the banner contents (has a date in it which should stay up to date)
  bannerPlugin.banner = createBanner();

  compilerMinimalist.run(function (err, stats) {
    if (err) {
      gutil.log(err);
    }

    gutil.log('bundled ' + NAME_MINIMALIST + '.js');

    done();
  });
});

// bundle css
gulp.task('bundle-css', ['mkdir'], function () {
  gulp.src([
    'src/css/reset.css',
    'src/css/jsoneditor.css',
    'src/css/contextmenu.css',
    'src/css/menu.css',
    'src/css/searchbox.css'
  ])
      .pipe(concatCss(NAME + '.css'))
      .pipe(gulp.dest(DIST))
      .pipe(concatCss(NAME + '.min.css'))
      .pipe(minifyCSS())
      .pipe(gulp.dest(DIST));

  gutil.log('bundled ' + DIST + '/' + NAME + '.css');
  gutil.log('bundled ' + DIST + '/' + NAME + '.min.css');
});

// create a folder img and copy the icons
gulp.task('copy-img', ['mkdir'], function () {
  gulp.src(IMAGE)
      .pipe(gulp.dest(DIST +'/img'));
  gutil.log('Copied images');
});

// create a folder img and copy the icons
gulp.task('copy-docs', ['mkdir'], function () {
  gulp.src(DOCS)
      .pipe(gulp.dest(DIST));
  gutil.log('Copied doc');
});

gulp.task('minify', ['bundle'], function () {
  minify(NAME)
});

gulp.task('minify-minimalist', ['bundle-minimalist'], function () {
  minify(NAME_MINIMALIST)
});

// TODO: zip file using archiver
var pkg = 'jsoneditor-' + require('./package.json').version + '.zip';
gulp.task('zip', shell.task([
      'zip ' + pkg + ' ' + 'README.md NOTICE LICENSE HISTORY.md index.html src dist docs examples -r '
]));

// The watch task (to automatically rebuild when the source code changes)
// Does only generate jsoneditor.js and jsoneditor.css, and copy the image
// Does NOT minify the code and does NOT generate the minimalist version
gulp.task('watch', ['bundle', 'bundle-css', 'copy-img'], function () {
  gulp.watch(['src/**/*'], ['bundle', 'bundle-css', 'copy-img']);
});

// The default task (called when you run `gulp`)
gulp.task('default', [
  'bundle',
  'bundle-minimalist',
  'bundle-css',
  'copy-img',
  'copy-docs',
  'minify',
  'minify-minimalist'
]);
