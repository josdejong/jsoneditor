const fs = require('fs')
const path = require('path')
const gulp = require('gulp')
const log = require('fancy-log')
const format = require('date-format')
const concatCss = require('gulp-concat-css')
const minifyCSS = require('gulp-clean-css')
const sass = require('gulp-sass')
const mkdirp = require('mkdirp')
const webpack = require('webpack')
const uglify = require('uglify-js')
const btoa = require('btoa')

const NAME = 'jsoneditor'
const NAME_MINIMALIST = 'jsoneditor-minimalist'
const ENTRY = './src/js/JSONEditor.js'
const HEADER = './src/js/header.js'
const IMAGE = './src/scss/img/jsoneditor-icons.svg'
const DOCS = './src/docs/*'
const DIST = path.join(__dirname, 'dist')

// generate banner with today's date and correct version
function createBanner () {
  const today = format.asString('yyyy-MM-dd', new Date()) // today, formatted as yyyy-MM-dd
  const version = require('./package.json').version // math.js version

  return String(fs.readFileSync(HEADER))
    .replace('@@date', today)
    .replace('@@version', version)
}

const bannerPlugin = new webpack.BannerPlugin({
  banner: createBanner(),
  entryOnly: true,
  raw: true
})

const webpackConfigModule = {
  rules: [
    {
      test: /\.m?js$/,
      exclude: /node_modules/,
      use: {
        loader: 'babel-loader'
      }
    },
    {
      test: /\.js$/,
      use: ['source-map-loader'],
      enforce: 'pre'
    }
  ]
}

// create a single instance of the compiler to allow caching
const compiler = webpack({
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
  module: webpackConfigModule,
  resolve: {
    extensions: ['.js'],
    mainFields: ['main'] // pick ES5 version of vanilla-picker
  },
  cache: true
})

// create a single instance of the compiler to allow caching
const compilerMinimalist = webpack({
  entry: ENTRY,
  output: {
    library: 'JSONEditor',
    libraryTarget: 'umd',
    path: DIST,
    filename: NAME_MINIMALIST + '.js'
  },
  module: webpackConfigModule,
  plugins: [
    bannerPlugin,
    new webpack.IgnorePlugin(new RegExp('^ace-builds')),
    new webpack.IgnorePlugin(new RegExp('worker-json-data-url')),
    new webpack.IgnorePlugin(new RegExp('^ajv')),
    new webpack.IgnorePlugin(new RegExp('^vanilla-picker'))
  ],
  optimization: {
    // We no not want to minimize our code.
    minimize: false
  },
  cache: true
})

function minify (name) {
  const code = String(fs.readFileSync(DIST + '/' + name + '.js'))
  const result = uglify.minify(code, {
    sourceMap: {
      url: name + '.map'
    },
    output: {
      comments: /@license/,
      max_line_len: 64000 // extra large because we have embedded code for workers
    }
  })

  if (result.error) {
    throw result.error
  }

  const fileMin = DIST + '/' + name + '.min.js'
  const fileMap = DIST + '/' + name + '.map'

  fs.writeFileSync(fileMin, result.code)
  fs.writeFileSync(fileMap, result.map)

  log('Minified ' + fileMin)
  log('Mapped ' + fileMap)
}

// make dist folder structure
gulp.task('mkdir', function (done) {
  mkdirp.sync(DIST)
  mkdirp.sync(DIST + '/img')

  done()
})

// Create an embedded version of the json worker code: a data url
gulp.task('embed-json-worker', function (done) {
  const workerBundleFile = './node_modules/ace-builds/src-noconflict/worker-json.js'
  const workerEmbeddedFile = './src/js/generated/worker-json-data-url.js'
  const workerScript = String(fs.readFileSync(workerBundleFile))

  const workerDataUrl = 'data:application/javascript;base64,' + btoa(workerScript)

  fs.writeFileSync(workerEmbeddedFile, 'module.exports = \'' + workerDataUrl + '\'\n')

  done()
})

// bundle javascript
gulp.task('bundle', function (done) {
  // update the banner contents (has a date in it which should stay up to date)
  bannerPlugin.banner = createBanner()

  compiler.run(function (err, stats) {
    if (err) {
      log(err)
    }

    log('bundled ' + NAME + '.js')

    done()
  })
})

// bundle minimalist version of javascript
gulp.task('bundle-minimalist', function (done) {
  // update the banner contents (has a date in it which should stay up to date)
  bannerPlugin.banner = createBanner()

  compilerMinimalist.run(function (err, stats) {
    if (err) {
      log(err)
    }

    log('bundled ' + NAME_MINIMALIST + '.js')

    done()
  })
})

// bundle css
gulp.task('bundle-css', function (done) {
  gulp
    .src(['src/scss/jsoneditor.scss'])
    .pipe(
      sass({
        // importer: tildeImporter
      })
    )
    .pipe(concatCss(NAME + '.css'))
    .pipe(gulp.dest(DIST))
    .pipe(concatCss(NAME + '.min.css'))
    .pipe(minifyCSS())
    .pipe(gulp.dest(DIST))
  done()
})

// create a folder img and copy the icons
gulp.task('copy-img', function (done) {
  gulp.src(IMAGE).pipe(gulp.dest(DIST + '/img'))
  log('Copied images')

  done()
})

// create a folder img and copy the icons
gulp.task('copy-docs', function (done) {
  gulp.src(DOCS).pipe(gulp.dest(DIST))
  log('Copied doc')

  done()
})

gulp.task('minify', function (done) {
  minify(NAME)

  done()
})

gulp.task('minify-minimalist', function (done) {
  minify(NAME_MINIMALIST)

  done()
})

// The watch task (to automatically rebuild when the source code changes)
// Does only generate jsoneditor.js and jsoneditor.css, and copy the image
// Does NOT minify the code and does NOT generate the minimalist version
gulp.task('watch', gulp.series('bundle', 'bundle-css', 'copy-img', function () {
  gulp.watch(['src/**/*'], gulp.series('bundle', 'bundle-css', 'copy-img'))
}))

// The default task (called when you run `gulp`)
gulp.task('default', gulp.series(
  'mkdir',
  'embed-json-worker',
  gulp.parallel(
    'copy-img',
    'copy-docs',
    'bundle-css',
    gulp.series('bundle', 'minify'),
    gulp.series('bundle-minimalist', 'minify-minimalist')
  )
))
