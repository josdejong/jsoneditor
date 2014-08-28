var fs = require('fs'),
    gulp = require('gulp'),
    gutil = require('gulp-util'),
    concat = require('gulp-concat'),
    concatCss = require('gulp-concat-css'),
    minifyCSS = require('gulp-minify-css'),
    clean = require('gulp-clean'),
    shell = require('gulp-shell'),
    merge = require('merge-stream'),
    mkdirp = require('mkdirp'),
    webpack = require('webpack'),
    uglify = require('uglify-js');

var ENTRY       = './src/js/JSONEditor.js',
    HEADER      = './src/js/header.js',
    FILE        = 'jsoneditor.js',
    FILE_MIN    = 'jsoneditor.min.js',
    FILE_MAP    = 'jsoneditor.map',
    DIST        = './',
    JSONEDITOR_JS       = DIST + FILE,
    JSONEDITOR_MIN_JS   = DIST + FILE_MIN,
    JSONEDITOR_MAP_JS   = DIST + FILE_MAP,
    JSONEDITOR_CSS      = DIST + 'jsoneditor.css',
    JSONEDITOR_MIN_CSS  = DIST + 'jsoneditor.min.css',
    DIST_ACE      = './asset/ace/',
    DIST_JSONLINT = './asset/jsonlint/';

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

gulp.task('bundle', function (done) {
  // update the banner contents (has a date in it which should stay up to date)
  bannerPlugin.banner = createBanner();

  // TODO: split this task in three tasks? bundle-js, bundle-css, bundle-img

  // bundle javascript
  compiler.run(function (err, stats) {
    if (err) {
      gutil.log(err);
    }

    gutil.log('bundled ' + JSONEDITOR_JS);

    done();
  });

  // bundle css
  gulp.src([
    'src/css/jsoneditor.css',
    'src/css/contextmenu.css',
    'src/css/menu.css',
    'src/css/searchbox.css'
  ])
      .pipe(concatCss(JSONEDITOR_CSS))
      .pipe(gulp.dest('.'))
      .pipe(concatCss(JSONEDITOR_MIN_CSS))
      .pipe(minifyCSS())
      .pipe(gulp.dest('.'));

  gutil.log('bundled ' + JSONEDITOR_CSS);
  gutil.log('bundled ' + JSONEDITOR_MIN_CSS);

  // create a folder img and copy the icons
  mkdirp.sync('./img');
  gulp.src('./src/css/img/jsoneditor-icons.png')
      .pipe(gulp.dest('./img/'));
  gutil.log('Copied jsoneditor-icons.png to ./img/');
});

gulp.task('minify', ['bundle'], function () {
  var result = uglify.minify([JSONEDITOR_JS], uglifyConfig);

  fs.writeFileSync(JSONEDITOR_MIN_JS, result.code);
  fs.writeFileSync(JSONEDITOR_MAP_JS, result.map);

  gutil.log('Minified ' + JSONEDITOR_MIN_JS);
  gutil.log('Mapped ' + JSONEDITOR_MAP_JS);

});

gulp.task('asset-clean', function () {
  return gulp.src('./asset', {read: false})
      .pipe(clean());
});

gulp.task('build-ace', shell.task([
    // see https://github.com/ajaxorg/ace/#building-ace
  'cd ./node_modules/ace/; '+
  'npm install; ' +
  'node ./Makefile.dryice.js -m; ' +
  'cd ../..'
]));

gulp.task('asset-ace', ['build-ace', 'asset-clean'], function () {
  // concatenate and copy ace files
  var aceSrc = './node_modules/ace/build/src-min/';
  mkdirp.sync(DIST_ACE);

  // TODO: throw an error when aceSrc is missing?

  var plugins = [
    aceSrc + 'ext-searchbox.js',
    aceSrc + 'mode-json.js',
    aceSrc + 'theme-textmate.js',
    './src/js/ace/theme-jsoneditor.js'
  ];

  return merge(
      gulp.src([aceSrc + 'ace.js'].concat(plugins))
          .pipe(concat('ace.js'))
          .pipe(gulp.dest(DIST_ACE)),

  gulp.src([aceSrc + 'worker-json.js'].concat(plugins))
      .pipe(gulp.dest(DIST_ACE))
  );
});

gulp.task('asset-jsonlint', ['asset-clean'], function (done) {
  // copy and minify json lint file
  mkdirp.sync(DIST_JSONLINT);
  var result = uglify.minify(['./node_modules/jsonlint/lib/jsonlint.js']);
  fs.writeFileSync(DIST_JSONLINT + 'jsonlint.js', result.code);
  gutil.log('Minified ' + DIST_JSONLINT + 'jsonlint.js');
  done();
});

gulp.task('build-assets', ['asset-clean', 'asset-ace', 'asset-jsonlint'], function () {});

// TODO: zip file using archiver
var pkg = 'jsoneditor-' + require('./package.json').version + '.zip';
gulp.task('zip', shell.task([
      'zip ' + pkg + ' ' +
      'README.md NOTICE LICENSE HISTORY.md jsoneditor.js jsoneditor.css jsoneditor.min.js jsoneditor.min.css jsoneditor.map img asset docs examples -r '
]));

// The default task (called when you run `gulp`)
gulp.task('default', ['bundle', 'minify']);
