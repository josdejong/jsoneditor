var fs = require('fs');
var gulp = require('gulp');
var gutil = require('gulp-util');
var concatCss = require('gulp-concat-css');
var minifyCSS = require('gulp-minify-css');
var shell = require('gulp-shell');
var mkdirp = require('mkdirp');
var webpack = require('webpack');
var uglify = require('uglify-js');

var NAME    = 'jsoneditor';
var ENTRY   = './src/js/JSONEditor.js';
var HEADER  = './src/js/header.js';
var IMAGE   = './src/css/img/jsoneditor-icons.png';
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

var webpackConfig = {
  entry: ENTRY,
  output: {
    library: 'JSONEditor',
    libraryTarget: 'umd',
    path: DIST,
    filename: NAME + '.js'
  },
  plugins: [ bannerPlugin ],
  cache: true
};

var uglifyConfig = {
  outSourceMap: NAME + '.map',
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

    gutil.log('bundled ' + NAME + '.js');

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

gulp.task('minify', ['bundle'], function () {
  var result = uglify.minify([DIST + '/' + NAME + '.js'], uglifyConfig);

  var fileMin = DIST + '/' + NAME + '.min.js';
  var fileMap = DIST + '/' + NAME + '.map';

  fs.writeFileSync(fileMin, result.code);
  fs.writeFileSync(fileMap, result.map);

  gutil.log('Minified ' + fileMin);
  gutil.log('Mapped ' + fileMap);

});

// TODO: zip file using archiver
var pkg = 'jsoneditor-' + require('./package.json').version + '.zip';
gulp.task('zip', shell.task([
      'zip ' + pkg + ' ' + 'README.md NOTICE LICENSE HISTORY.md index.html src dist docs examples -r '
]));

// The default task (called when you run `gulp`)
gulp.task('default', ['bundle', 'bundle-css', 'copy-img', 'minify']);
