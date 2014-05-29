var fs = require('fs'),
    gulp = require('gulp'),
    gutil = require('gulp-util'),
    webpack = require('webpack'),
    uglify = require('uglify-js');

var ENTRY       = './src/js/JSONEditor.js',
    HEADER      = './src/js/header.js',
    FILE        = 'jsoneditor.js',
    FILE_MIN    = 'jsoneditor.min.js',
    FILE_MAP    = 'jsoneditor.map',
    DIST        = './',
    JSONEDITOR_JS     = DIST + FILE,
    JSONEDITOR_MIN_JS = DIST + FILE_MIN,
    JSONEDITOR_MAP_JS = DIST + FILE_MAP;

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

gulp.task('bundle', function (cb) {
  // update the banner contents (has a date in it which should stay up to date)
  bannerPlugin.banner = createBanner();

  compiler.run(function (err, stats) {
    if (err) {
      gutil.log(err);
    }

    gutil.log('bundled ' + JSONEDITOR_JS);

    // TODO: bundle css

    // TODO: bundle and minify assets

    cb();
  });
});

gulp.task('minify', ['bundle'], function () {
  var result = uglify.minify([JSONEDITOR_JS], uglifyConfig);

  fs.writeFileSync(JSONEDITOR_MIN_JS, result.code + '\n//# sourceMappingURL=' + FILE_MAP);
  fs.writeFileSync(JSONEDITOR_MAP_JS, result.map);

  gutil.log('Minified ' + JSONEDITOR_MIN_JS);
  gutil.log('Mapped ' + JSONEDITOR_MAP_JS);

  // TODO: minify css

});

// The default task (called when you run `gulp`)
gulp.task('default', ['bundle', 'minify']);
