var fs = require('fs');
var gulp = require('gulp');
var gutil = require('gulp-util');
var concatCss = require('gulp-concat-css');
var minifyCSS = require('gulp-minify-css');
var shell = require('gulp-shell');
var mkdirp = require('mkdirp');
var webpack = require('webpack');
var uglify = require('uglify-js');

var ENTRY    = './src/js/JSONEditor.js';
var HEADER   = './src/js/header.js';
var IMAGE    = './src/css/img/jsoneditor-icons.png';
var DIST     = './dist';
var FILE     = 'jsoneditor.js';
var FILE_MAP = 'jsoneditor.map';
var FILE_CSS = 'jsoneditor.css';
var FILE_MIN_CSS = 'jsoneditor.min.css';
var JSONEDITOR_JS       = DIST + '/' + FILE;
var JSONEDITOR_MIN_JS   = DIST + '/jsoneditor.min.js';
var JSONEDITOR_MAP_JS   = DIST + '/' + FILE_MAP;
var JSONEDITOR_CSS      = DIST + '/jsoneditor.css';
var JSONEDITOR_MIN_CSS  = DIST + '/jsoneditor.min.css';

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

var webpackConfig = {
  entry: ENTRY,
  output: {
    library: 'JSONEditor',
    libraryTarget: 'umd',
    path: DIST,
    filename: FILE
  },
  plugins: [ bannerPlugin ],
  cache: true
};

var uglifyConfig = {
  outSourceMap: FILE_MAP,
  output: {
    comments: /@license/
  }
};

// create a single instance of the compiler to allow caching
var compiler = webpack(webpackConfig);

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

    gutil.log('bundled ' + JSONEDITOR_JS);

    done();
  });
});

// bundle css
gulp.task('bundle-css', ['mkdir'], function () {
  gulp.src([
    'src/css/jsoneditor.css',
    'src/css/contextmenu.css',
    'src/css/menu.css',
    'src/css/searchbox.css'
  ])
      .pipe(concatCss(FILE_CSS))
      .pipe(gulp.dest(DIST))
      .pipe(concatCss(FILE_MIN_CSS))
      .pipe(minifyCSS())
      .pipe(gulp.dest(DIST));

  gutil.log('bundled ' + JSONEDITOR_CSS);
  gutil.log('bundled ' + JSONEDITOR_MIN_CSS);
});

// create a folder img and copy the icons
gulp.task('copy-img', ['mkdir'], function () {
  gulp.src(IMAGE)
      .pipe(gulp.dest(DIST +'/img'));
  gutil.log('Copied images');
});

gulp.task('minify', ['bundle'], function () {
  var result = uglify.minify([JSONEDITOR_JS], uglifyConfig);

  fs.writeFileSync(JSONEDITOR_MIN_JS, result.code);
  fs.writeFileSync(JSONEDITOR_MAP_JS, result.map);

  gutil.log('Minified ' + JSONEDITOR_MIN_JS);
  gutil.log('Mapped ' + JSONEDITOR_MAP_JS);

});

// TODO: zip file using archiver
var pkg = 'jsoneditor-' + require('./package.json').version + '.zip';
gulp.task('zip', shell.task([
      'zip ' + pkg + ' ' + 'README.md NOTICE LICENSE HISTORY.md dist docs examples -r '
]));

// The default task (called when you run `gulp`)
gulp.task('default', ['bundle', 'bundle-css', 'copy-img', 'minify']);
