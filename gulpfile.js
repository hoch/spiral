/**
 * Spiral gulp task file.
 * @version 0.0.1
 */

var gulp        = require('gulp'),
    plugins     = require('gulp-load-plugins')(),
    browserSync = require('browser-sync'),
    runSequence = require('run-sequence'),
    del         = require('del');

var reload      = browserSync.reload;

var SOURCE_FILES = [
  'src/compat.js',
  'src/spiral.core.js',
  'src/sprial.ext.js',
  'src/sprial.util.js'
];


// Clean: clean dist directory.
gulp.task('clean', del.bind(null, [
  'dist/**/*',
  '!dist'
]));


// Compile: compile source files.
gulp.task('compile', function () {
  return gulp.src(SOURCE_FILES)
    .pipe(plugins.uglify({ mangle: false }))
    .pipe(plugins.concat('spiral.min.js'))
    .pipe(gulp.dest('dist'));
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
  runSequence('clean', 'compile', cb);
});


// Default: Build and serve.
gulp.task('default', function (cb) {
  runSequence('build', 'serve', cb);
});