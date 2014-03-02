/**
 *  Modules
 */
var gulp   = require('gulp'),
sass       = require('gulp-ruby-sass'),
watch      = require('gulp-watch'),
plumber    = require('gulp-plumber'),
csso       = require('gulp-csso'),
prefix     = require('gulp-autoprefixer'),
htmlmin    = require('gulp-minify-html'),
uglify     = require('gulp-uglify'),
concat     = require('gulp-concat'),
rename     = require('gulp-rename'),
imagemin   = require('gulp-imagemin'),
preprocess = require('gulp-preprocess'),
refresh    = require('gulp-livereload'),
express    = require('express'),
lrserver   = require('tiny-lr')(),
livereload = require('connect-livereload'),
bowerFiles = require('gulp-bower-files');


/**
 *  Config
 */
var config = {
  lrport : Math.floor(Math.random()*(35999-35300+1)+35300),
  serverport : 4000
};


/**
 *  Paths
 */
var paths = {
  markup  : 'src/**/*.html',
  scripts : [
    'src/js/**/*.js',
    '!src/js/lib/**/*.js'
  ],
  libs    : 'src/js/lib/**/*.js',
  styles  : 'src/scss/**/*.scss',
  images  : 'src/img/*'
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
 *  Scripts
 */

// dev
gulp.task('scripts:dev', function() {
  return gulp.src(paths.scripts)
    .pipe(concat('app.js'))
    .pipe(uglify())
    .pipe(gulp.dest('dist/assets/js'))
    .pipe(refresh(lrserver));
});

// prod
gulp.task('scripts:prod', function() {
  return gulp.src(paths.scripts)
    .pipe(concat('app.min.js'))
    .pipe(uglify())
    .pipe(gulp.dest('dist/assets/js'))
    .pipe(refresh(lrserver));
});

gulp.task('copylibs:dev', function() {
  return gulp.src(paths.libs)
    .pipe(gulp.dest('dist/assets/js'));
});

gulp.task('copylibs:prod', function() {
  return gulp.src(paths.libs)
    .pipe(concat('lib.min.js'))
    .pipe(uglify())
    .pipe(gulp.dest('dist/assets/js'));
});

/**
 *  Styles
 */

// dev
gulp.task('styles:dev', function () {
  return gulp.src('src/scss/styles.scss')
    .pipe(plumber())
    .pipe(sass({unixNewlines: true}))
    .pipe(prefix('last 1 version', '> 1%', 'ie 8', 'ie 7'))
    .pipe(gulp.dest('dist/assets/'))
    .pipe(refresh(lrserver));
});

// prod
gulp.task('styles:prod', function () {
  return gulp.src('src/scss/styles.scss')
    .pipe(plumber())
    .pipe(sass({unixNewlines: true}))
    .pipe(prefix('last 1 version', '> 1%', 'ie 8', 'ie 7'))
    .pipe(csso())
    .pipe(gulp.dest('dist/assets/'))
    .pipe(refresh(lrserver));
});

/**
 *  Markup
 */

// dev
gulp.task('html:dev', function(){
  return gulp.src(paths.markup)
    .pipe(preprocess({context: { dev: true }}))
    .pipe(gulp.dest('dist'))
    .pipe(refresh(lrserver));
});

// prod
gulp.task('html:prod', function(){
  return gulp.src(paths.markup)
    .pipe(preprocess({context: { dev: false }}))
    // .pipe(htmlmin())
    .pipe(gulp.dest('dist'))
    .pipe(refresh(lrserver));
});

// Watch
gulp.task('watch', function () {
  gulp.watch(paths.markup, ['html:dev']);
  gulp.watch(paths.styles, ['styles:dev']);
  gulp.watch(paths.scripts, ['scripts:dev']);
});

// Serve
gulp.task('serve', function () {
  server.listen(config.serverport);
  lrserver.listen(config.lrport);
});

/**
 *  Images
 */
gulp.task('images', function () {
  return gulp.src(paths.images)
    .pipe(imagemin())
    .pipe(gulp.dest('dist/assets/img/'));
});

gulp.task('bower', function(){
  bowerFiles().pipe(gulp.dest('src/js/lib'));
});

/**
 *  Tasks
 */

// Dev
gulp.task('default', [
  'html:dev',
  'scripts:dev',
  'copylibs:dev',
  'styles:dev',
  'serve',
  'watch'
]);

// Prod
gulp.task('prod', [
  'html:prod',
  'scripts:prod',
  'copylibs:prod',
  'styles:prod',
  'serve'
]);
