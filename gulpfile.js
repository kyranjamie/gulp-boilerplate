/**
 *  Modules
 */
var gulp   = require('gulp'),
sass       = require('gulp-ruby-sass'),
csso       = require('gulp-csso'),
prefix     = require('gulp-autoprefixer'),
watch      = require('gulp-watch'),
plumber    = require('gulp-plumber'),
htmlmin    = require('gulp-minify-html'),
uglify     = require('gulp-uglify'),
refresh    = require('gulp-livereload'),
express    = require('express'),
lrserver   = require('tiny-lr')(),
livereload = require('connect-livereload');


/**
 *  Config
 */
var config = {
  lrport : Math.floor(Math.random()*(35999-35300+1)+35300),
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
   .pipe(gulp.dest('dist/resources/'))
   .pipe(refresh(lrserver));
});

// Styles
gulp.task('styles', function () {
  gulp.src('src/scss/styles.scss')
  .pipe(plumber())
  .pipe(sass({unixNewlines: true}))
  .pipe(prefix('last 1 version', '> 1%', 'ie 8', 'ie 7'))
  // .pipe(csso())
  .pipe(gulp.dest('dist/resources/'))
  .pipe(refresh(lrserver));
});

// Markup
gulp.task('html', function(){
  gulp.src(paths.markup)
    .pipe(htmlmin())
    .pipe(gulp.dest('dist'))
    .pipe(refresh(lrserver));
});

// Watch
gulp.task('watch', function () {
  gulp.watch(paths.markup, ['html']);
  gulp.watch(paths.styles, ['styles']);
  gulp.watch(paths.scripts, ['scripts']);
});

// Serve
gulp.task('serve', function () {
  server.listen(config.serverport);
  lrserver.listen(config.lrport);
});

gulp.task('default', [
  'html',
  'scripts',
  'styles',
  'serve',
  'watch'
]);
