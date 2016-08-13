var fs = require('fs');
var gulp = require('gulp');
var gutil = require('gulp-util');
var shell = require('gulp-shell');
var mkdirp = require('mkdirp');
var webpack = require('webpack');

var NAME    = 'jsoneditor';
var NAME_MINIMALIST = 'jsoneditor-minimalist';
var ENTRY   = './src/index.js';
var HEADER  = './src/header.js';
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

var loaders = [
  { test: /\.js$/, exclude: /node_modules/, loader: 'babel-loader' },
  { test: /\.json$/, loader: 'json' },
  { test: /\.less$/, loaders: '!style!css!less!' },
  { test: /\.svg$/, loader: 'svg-url-loader' }
];

// create a single instance of the compiler to allow caching
var compiler = webpack({
  entry: ENTRY,
  devtool: 'source-map',
  output: {
    library: 'jsoneditor',
    libraryTarget: 'umd',
    path: DIST,
    filename: NAME + '.js'
  },
  plugins: [
    bannerPlugin,
    new webpack.optimize.UglifyJsPlugin()
  ],
  module: {
    loaders: loaders
  },
  cache: true
});

// create a single instance of the compiler to allow caching
var compilerMinimalist = webpack({
  entry: ENTRY,
  devtool: 'source-map',
  output: {
    library: 'jsoneditor',
    libraryTarget: 'umd',
    path: DIST,
    filename: NAME_MINIMALIST + '.js'
  },
  plugins: [
    bannerPlugin,
    new webpack.IgnorePlugin(new RegExp('^brace$')),
    new webpack.IgnorePlugin(new RegExp('^ajv')),
    new webpack.optimize.UglifyJsPlugin()
  ],
  module: {
    loaders: loaders
  },
  cache: true
});

// make dist folder
gulp.task('mkdir', function () {
  mkdirp.sync(DIST);
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

// TODO: zip file using archiver
var pkg = 'jsoneditor-' + require('./package.json').version + '.zip';
gulp.task('zip', shell.task([
      'zip ' + pkg + ' ' + 'README.md NOTICE LICENSE HISTORY.md index.html src dist docs examples -r '
]));

// The watch task (to automatically rebuild when the source code changes)
// Does only generate jsoneditor.js and jsoneditor.css, and copy the image
// Does NOT minify the code and does NOT generate the minimalist version
gulp.task('watch', ['bundle'], function () {
  // TODO: don't minify when in watch mode

  gulp.watch(['src/**/*'], ['bundle']);
});

// The default task (called when you run `gulp`)
gulp.task('default', [
  'bundle',
  'bundle-minimalist'
]);
