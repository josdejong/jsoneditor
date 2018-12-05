var fs = require('fs');
var gulp = require('gulp');
var gutil = require('gulp-util');
var concatCss = require('gulp-concat-css');
var minifyCSS = require('gulp-clean-css');
var shell = require('gulp-shell');
var mkdirp = require('mkdirp');
var webpack = require('webpack');
var uglify = require('uglify-js');

var NAME = 'jsoneditor';
var NAME_MINIMALIST = 'jsoneditor-minimalist';
var ENTRY = './src/js/JSONEditor.js';
var HEADER = './src/js/header.js';
var IMAGE = './src/css/img/jsoneditor-icons.svg';
var DOCS = './src/docs/*';
var DIST = './dist';

// generate banner with today's date and correct version
function createBanner() {
  var today = gutil.date(new Date(), 'yyyy-mm-dd'); // today, formatted as yyyy-mm-dd
  var version = require('./package.json').version; // math.js version

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
  plugins: [bannerPlugin],
  module: {
    loaders: [{ test: /\.json$/, loader: 'json' }]
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
  cache: true
});

function minify(name) {
  var result = uglify.minify([DIST + '/' + name + '.js'], {
    outSourceMap: name + '.map',
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

  gutil.log('Minified ' + fileMin);
  gutil.log('Mapped ' + fileMap);
}

// make dist folder structure
gulp.task('mkdir', function(done) {
  mkdirp.sync(DIST);
  mkdirp.sync(DIST + '/img');
  done();
});

// bundle javascript
gulp.task(
  'bundle',
  gulp.series(gulp.parallel('mkdir'), function(done) {
    // update the banner contents (has a date in it which should stay up to date)
    bannerPlugin.banner = createBanner();

    compiler.run(function(err, stats) {
      if (err) {
        gutil.log(err);
      }

      gutil.log('bundled ' + NAME + '.js');

      done();
    });
  })
);

// bundle minimalist version of javascript
gulp.task(
  'bundle-minimalist',
  gulp.series(gulp.parallel('mkdir'), function(done) {
    // update the banner contents (has a date in it which should stay up to date)
    bannerPlugin.banner = createBanner();

    compilerMinimalist.run(function(err, stats) {
      if (err) {
        gutil.log(err);
      }

      gutil.log('bundled ' + NAME_MINIMALIST + '.js');

      done();
    });
  })
);

// bundle css
gulp.task(
  'bundle-css',
  gulp.series(gulp.parallel('mkdir'), function(done) {
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

    gutil.log('bundled ' + DIST + '/' + NAME + '.css');
    gutil.log('bundled ' + DIST + '/' + NAME + '.min.css');
    done();
  })
);

// create a folder img and copy the icons
gulp.task(
  'copy-img',
  gulp.series(gulp.parallel('mkdir'), function(done) {
    gulp.src(IMAGE).pipe(gulp.dest(DIST + '/img'));
    gutil.log('Copied images');
    done();
  })
);

// create a folder img and copy the icons
gulp.task(
  'copy-docs',
  gulp.series(gulp.parallel('mkdir'), function(done) {
    gulp.src(DOCS).pipe(gulp.dest(DIST));
    gutil.log('Copied doc');
    done();
  })
);

gulp.task(
  'minify',
  gulp.series(gulp.parallel('bundle'), function(done) {
    minify(NAME);
    done();
  })
);

gulp.task(
  'minify-minimalist',
  gulp.series(gulp.parallel('bundle-minimalist'), function(done) {
    minify(NAME_MINIMALIST);
    done();
  })
);

// TODO: zip file using archiver
var pkg = 'jsoneditor-' + require('./package.json').version + '.zip';
gulp.task(
  'zip',
  shell.task([
    'zip ' +
      pkg +
      ' ' +
      'README.md NOTICE LICENSE HISTORY.md index.html src dist docs examples -r '
  ])
);

// The watch task (to automatically rebuild when the source code changes)
// Does only generate jsoneditor.js and jsoneditor.css, and copy the image
// Does NOT minify the code and does NOT generate the minimalist version
gulp.task(
  'watch',
  gulp.series(gulp.parallel('bundle', 'bundle-css', 'copy-img'), function() {
    gulp.watch(['src/**/*'], gulp.series('bundle', 'bundle-css', 'copy-img'));
  })
);

// The default task (called when you run `gulp`)
gulp.task(
  'default',
  gulp.series(
    gulp.parallel(
      'bundle',
      'bundle-minimalist',
      'bundle-css',
      'copy-img',
      'copy-docs',
      'minify',
      'minify-minimalist'
    )
  )
);
