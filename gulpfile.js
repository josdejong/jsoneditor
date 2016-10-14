var fs = require('fs')
var gulp = require('gulp')
var gutil = require('gulp-util')
var shell = require('gulp-shell')
var mkdirp = require('mkdirp')
var webpack = require('webpack')
var browserSync = require('browser-sync').create()

var WATCH = 'watch'
var WATCHING = process.argv[2] === WATCH

if (WATCHING) {
  gutil.log('Watching src/*.')
  gutil.log('The bundle ./dist/jsoneditor.js will be updated automatically  ')
  gutil.log('on changes in the source code this bundle will not be minified.')
  gutil.log('Also, ./dist/minimalist code is not updated on changes.')
}

var NAME    = 'jsoneditor'
var NAME_MINIMALIST = 'jsoneditor-minimalist'
var ENTRY   = './src/index.js'
var HEADER  = './src/header.js'
var DIST    = './dist'
var EMPTY = __dirname + '/src/utils/empty.js'

// generate banner with today's date and correct version
function createBanner() {
  var today = gutil.date(new Date(), 'yyyy-mm-dd') // today, formatted as yyyy-mm-dd
  var version = require('./package.json').version  // math.js version

  return String(fs.readFileSync(HEADER))
      .replace('@@date', today)
      .replace('@@version', version)
}

var bannerPlugin = new webpack.BannerPlugin(createBanner(), {
  entryOnly: true,
  raw: true
})

var loaders = [
  { test: /\.js$/, exclude: /node_modules/, loader: 'babel-loader' },
  { test: /\.json$/, loader: 'json' },
  { test: /\.less$/, loaders: '!style!css!less!' },
  { test: /\.svg$/, loader: 'svg-url-loader' }
]

// create a single instance of the compiler to allow caching
var plugins = [bannerPlugin]
if (!WATCHING) {
  plugins.push(new webpack.optimize.UglifyJsPlugin())
}
var compiler = webpack({
  entry: ENTRY,
  devtool: 'source-map',
  debug: true,
  bail: true,
  output: {
    library: 'jsoneditor',
    libraryTarget: 'umd',
    path: DIST,
    filename: NAME + '.js'
  },
  plugins: plugins,
  module: {
    loaders: loaders
  },
  cache: true
})

// create a single instance of the compiler to allow caching
var compilerMinimalist = webpack({
  entry: ENTRY,
  devtool: 'source-map',
  debug: true,
  output: {
    library: 'jsoneditor',
    libraryTarget: 'umd',
    path: DIST,
    filename: NAME_MINIMALIST + '.js'
  },
  plugins: [
    bannerPlugin,
    new webpack.NormalModuleReplacementPlugin(new RegExp('^./assets/ace$'), EMPTY),
    new webpack.NormalModuleReplacementPlugin(new RegExp('^ajv$'), EMPTY),
    new webpack.optimize.UglifyJsPlugin()
  ],
  module: {
    loaders: loaders
  },
  cache: true
})

function handleCompilerCallback (err, stats) {
  if (err) {
    gutil.log(err.toString())
  }

  if (stats && stats.compilation && stats.compilation.errors) {
    // output soft errors
    stats.compilation.errors.forEach(function (err) {
      gutil.log(err.toString())
    })
  }
}

// make dist folder
gulp.task('mkdir', function () {
  mkdirp.sync(DIST)
})

// bundle javascript
gulp.task('bundle', ['mkdir'], function (done) {
  // update the banner contents (has a date in it which should stay up to date)
  bannerPlugin.banner = createBanner()

  compiler.run(function (err, stats) {
    handleCompilerCallback(err, stats)

    gutil.log('bundled ' + NAME + '.js')

    done()
  })
})

// bundle minimalist version of javascript
gulp.task('bundle-minimalist', ['mkdir'], function (done) {
  // update the banner contents (has a date in it which should stay up to date)
  bannerPlugin.banner = createBanner()

  compilerMinimalist.run(function (err, stats) {
    handleCompilerCallback(err, stats)

    gutil.log('bundled ' + NAME_MINIMALIST + '.js')

    done()
  })
})

// TODO: zip file using archiver
var pkg = 'jsoneditor-' + require('./package.json').version + '.zip'
gulp.task('zip', shell.task([
      'zip ' + pkg + ' ' + 'README.md LICENSE HISTORY.md index.html src dist docs examples -r '
]))

// execute all tasks and reload the browser afterwards
gulp.task('bundle-and-reload', ['bundle'], function (done) {
  browserSync.reload();

  done();
});

// The watch task (to automatically rebuild when the source code changes)
// Does only generate jsoneditor.js and jsoneditor.css, and copy the image
// Does NOT minify the code and does NOT generate the minimalist version
gulp.task(WATCH, ['bundle'], function() {
  browserSync.init({
    open: 'local',
    server: '.',
    startPath: '/src/develop.html',
    minify: false
  })

  gulp.watch('src/**/*', ['bundle-and-reload'])
})

// The default task (called when you run `gulp`)
gulp.task('default', [ 'bundle', 'bundle-minimalist', 'copy' ])
