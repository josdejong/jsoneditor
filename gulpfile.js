var fs = require('fs');
var path = require('path');
var gulp = require('gulp');
var log = require('fancy-log');
var format = require('date-format');
var concatCss = require('gulp-concat-css');
var minifyCSS = require('gulp-clean-css');
var mkdirp = require('mkdirp');
var webpack = require('webpack');
var uglify = require('uglify-js');

var NAME = 'jsoneditor';
var NAME_MINIMALIST = 'jsoneditor-minimalist';
var ENTRY = './src/js/JSONEditor.js';
var HEADER = './src/js/header.js';
var IMAGE = './src/css/img/jsoneditor-icons.svg';
var DOCS = './src/docs/*';
var DIST = path.join(__dirname, 'dist');

// generate banner with today's date and correct version
function createBanner() {
  var today = format.asString('yyyy-MM-dd', new Date()); // today, formatted as yyyy-MM-dd
  var version = require('./package.json').version; // math.js version

  return String(fs.readFileSync(HEADER))
    .replace('@@date', today)
    .replace('@@version', version);
}

var bannerPlugin = new webpack.BannerPlugin({
  banner: createBanner(),
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
  plugins: [bannerPlugin],
  optimization: {
    // We no not want to minimize our code.
    minimize: false
  },

  resolve: {
    extensions: ['.js'],
    mainFields: [ 'main' ], // pick ES5 version of vanilla-picker
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
    new webpack.IgnorePlugin(new RegExp('^ajv')),
    new webpack.IgnorePlugin(new RegExp('^vanilla-picker'))
  ],
  optimization: {
    // We no not want to minimize our code.
    minimize: false
  },
  cache: true
});

function minify(name) {
  var code = String(fs.readFileSync(DIST + '/' + name + '.js'));
  var result = uglify.minify(code, {
    sourceMap: {
      url: name + '.map'
    },
    output: {
      comments: /@license/,
      max_line_len: 64000 // extra large because we have embedded code for workers
    }
  });

  if (result.error) {
    throw result.error;
  }

  var fileMin = DIST + '/' + name + '.min.js';
  var fileMap = DIST + '/' + name + '.map';

  fs.writeFileSync(fileMin, result.code);
  fs.writeFileSync(fileMap, result.map);

  log('Minified ' + fileMin);
  log('Mapped ' + fileMap);
}

// make dist folder structure
gulp.task('mkdir', function(done) {
  mkdirp.sync(DIST);
  mkdirp.sync(DIST + '/img');

  done();
});

// bundle javascript
gulp.task('bundle', function(done) {
  // update the banner contents (has a date in it which should stay up to date)
  bannerPlugin.banner = createBanner();

  compiler.run(function(err, stats) {
    if (err) {
      log(err);
    }

    log('bundled ' + NAME + '.js');

    done();
  });
});

// bundle minimalist version of javascript
gulp.task('bundle-minimalist', function(done) {
  // update the banner contents (has a date in it which should stay up to date)
  bannerPlugin.banner = createBanner();

  compilerMinimalist.run(function(err, stats) {
    if (err) {
      log(err);
    }

    log('bundled ' + NAME_MINIMALIST + '.js');

    done();
  });
});

// bundle css
gulp.task('bundle-css', function(done) {
  gulp
    .src([
      'src/css/reset.css',
      'src/css/jsoneditor.css',
      'src/css/contextmenu.css',
      'src/css/menu.css',
      'src/css/searchbox.css',
      'src/css/autocomplete.css',
      'src/css/treepath.css',
      'src/css/statusbar.css',
      'src/css/navigationbar.css',
      'src/js/assets/selectr/selectr.css'
    ])
    .pipe(concatCss(NAME + '.css'))
    .pipe(gulp.dest(DIST))
    .pipe(concatCss(NAME + '.min.css'))
    .pipe(minifyCSS())
    .pipe(gulp.dest(DIST));

  log('bundled ' + DIST + '/' + NAME + '.css');
  log('bundled ' + DIST + '/' + NAME + '.min.css');

  done();
});

// create a folder img and copy the icons
gulp.task('copy-img', function(done) {
  gulp.src(IMAGE).pipe(gulp.dest(DIST + '/img'));
  log('Copied images');

  done();
});

// create a folder img and copy the icons
gulp.task('copy-docs', function(done) {
  gulp.src(DOCS).pipe(gulp.dest(DIST));
  log('Copied doc');

  done();
});

gulp.task('minify', function(done) {
  minify(NAME);

  done();
});

gulp.task('minify-minimalist', function(done) {
  minify(NAME_MINIMALIST);

  done();
});

// The watch task (to automatically rebuild when the source code changes)
// Does only generate jsoneditor.js and jsoneditor.css, and copy the image
// Does NOT minify the code and does NOT generate the minimalist version
gulp.task('watch', gulp.series('bundle', 'bundle-css', 'copy-img', function() {
  gulp.watch(['src/**/*'], gulp.series('bundle', 'bundle-css', 'copy-img'));
}));

// The default task (called when you run `gulp`)
gulp.task('default', gulp.series(
    'mkdir',
    gulp.parallel(
        'copy-img',
        'copy-docs',
        'bundle-css',
        gulp.series('bundle', 'minify'),
        gulp.series('bundle-minimalist', 'minify-minimalist')
    )
));
