/**
 *  Modules
 */
var gulp   = require('gulp'),
sass       = require('gulp-ruby-sass'),
csso       = require('gulp-csso'),
watch      = require('gulp-watch'),
uglify     = require('gulp-uglify'),
express    = require('express'),
refresh    = require('gulp-livereload'),
lrserver   = require('tiny-lr')(),
livereload = require('connect-livereload');


/**
 *  Config
 */
var config = {
  lrport : 35729,
  serverport : 4000
}


/**
 *  Paths
 */
var paths = {
  markup  : 'src/**/*.html',
  scripts : ['src/js/**/*.js', '!src/js/vendor/**'], 
  styles  : 'src/scss/**/*.scss',
  images  : 'src/img/'
};


/**
 *  Express init
 */
var server = express();
server.use(livereload({
  port: config.lrport
}));
server.use(express.static('./dist'));


/**
 *  Tasks 
 */
// Scripts
gulp.task('scripts', function() {
 return gulp.src(paths.scripts)
   .pipe(uglify())
   .pipe(gulp.dest('dist/resources/'));
});

// SASS
gulp.task('styles', function () {
  gulp.src('src/scss/styles.scss')
  .pipe(sass({unixNewlines: true}))
  .pipe(csso())
  .pipe(gulp.dest('dist/resources/'))
  .pipe(refresh(lrserver));
});

// Markup
gulp.task('html', function(){
  gulp.src(paths.markup)
    .pipe(gulp.dest('dist'))
    .pipe(refresh(lrserver));
});

// Watch
gulp.task('watch', function () {
  gulp.watch(paths.markup, ['html']);
  gulp.watch(paths.styles, ['styles']);
  gulp.watch(paths.scripts, ['scripts']);
  // gulp.watch(paths.images, ['images']);
});

gulp.task('serve', function () {
  //Set up your static fileserver, which serves files in the build dir
  server.listen(config.serverport);
  //Set up your livereload server
  lrserver.listen(config.lrport);
});

gulp.task('default', ['html','scripts','styles','serve','watch']);
