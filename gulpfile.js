/**
 * Spiral gulp task file.
 * @version 0.0.2
 */

var gulp        = require('gulp'),
    plugins     = require('gulp-load-plugins')(),
    browserSync = require('browser-sync'),
    runSequence = require('run-sequence'),
    del         = require('del');
    combiner    = require('stream-combiner2');

var reload      = browserSync.reload;

var SOURCE_FILES = [
  'src/compat.js',
  'src/spiral.core.js',
  'src/spiral.util.js',
  'src/spiral.midi.js'
];


// Compile: compile source files.
gulp.task('compile', function () {
  var combined = combiner.obj([
    gulp.src(SOURCE_FILES),
    plugins.uglify({ mangle: false }),
    plugins.concat('spiral.min.js'),
    gulp.dest('.')
  ]);

  combined.on('error', console.error.bind(console));

  return combined;
});


// Serve: Start a dev server at 127.0.0.1:3000.
gulp.task('serve', function () {
  browserSync({
    notify: false,
    server: {
      baseDir: './'
    },
    browser: 'google chrome'
  });

  gulp.watch(['test/*.html'], reload);
  gulp.watch(['src/*.js'], reload);
});


// Build: Clean and build everything in build/ path.
gulp.task('build', function (cb) {
  runSequence('compile', cb);
});


// Default: Build and serve.
gulp.task('default', function (cb) {
  runSequence('build', 'serve', cb);
});