/**
 *  Modules
 */
var gulp   = require('gulp'),
newer      = require('gulp-newer'),
sass       = require('gulp-ruby-sass'),
watch      = require('gulp-watch'),
plumber    = require('gulp-plumber'),
csso       = require('gulp-csso'),
gulpif     = require('gulp-if'),
jshint     = require('gulp-jshint'),
stylish    = require('jshint-stylish'),
gutil      = require('gulp-util'),
prefix     = require('gulp-autoprefixer'),
htmlmin    = require('gulp-htmlmin'),
header     = require('gulp-header'),
uglify     = require('gulp-uglify'),
ngannotate = require('gulp-ng-annotate'),
concat     = require('gulp-concat'),
clean      = require('gulp-clean'),
rename     = require('gulp-rename'),
imagemin   = require('gulp-imagemin'),
notify     = require('gulp-notify'),
preprocess = require('gulp-preprocess'),
templates  = require('gulp-angular-templatecache'),
shell      = require('gulp-shell'),
proxy      = require('proxy-middleware'),
refresh    = require('gulp-livereload'),
package    = require('./package.json'),
url        = require('url'),
express    = require('express'),
lrserver   = require('tiny-lr')(),
livereload = require('connect-livereload');

/**
 * Detect environment
 * @desc Define build environments
 *       production  === `build` task or `--prod` flag
 *       development === `default` task, `--dev` flag or neither
 */
var args = process.argv,
    prod = args.indexOf('build') !== -1 || args.indexOf('--prod') !== -1,
     dev = args[2] === undefined || args.indexOf('--dev') !== -1 || (!dev && !prod) === true;

var config = {
  lrport : Math.floor(Math.random()*(35999-35300+1)+35300),
  serverport : 4000
};

var paths = {
  output : 'public/dist/',
  templates : [
    'public/src/tmpl/*.html'
  ],
  markup  : [
    'public/src/**/*.html',
    '!public/src/tmpl/*.html'
  ],
  styles  : {
    import : 'public/src/scss/styles.scss',
    src : 'public/src/scss/**/*.scss'
  },
  scripts : [
    'public/src/js/app.js',
    'public/src/tmpl/templates.js',
    'public/src/js/factory/*.js',
    'public/src/js/services/*.js',
    'public/src/js/filters/*.js',
    'public/src/js/factories/*.js',
    'public/src/js/directives/*.js',
    'public/src/js/controllers/*.js',
    '!public/src/js/libs/**/*.js'
  ],
  libs    : [
    ''
  ],
  copy    : [
    'public/src/fonts/**/'
  ],
  images  : [
    'public/src/img/**/*'
  ]
};

var banner = ['/**',
  ' * <%= package.name %>',
  ' * <%= package.description %>',
  ' * Compiled: ' + Date(),
  ' * @version v<%= package.version %>',
  ' * @link <%= package.homepage %>',
  ' * @copyright <%= package.license %>',
  ' */',
  ''].join('\n');

gutil.log('DEV   ', dev);
gutil.log('PROD  ', prod);


/**
 * Scripts
 * @desc concat, annotate ng dependencies,
 *       uglify, append header, jshint
 */
gulp.task('scripts', function() {
  return gulp.src(paths.scripts)
    .pipe(plumber())
    .pipe(gulpif(dev, concat('app.js'), concat('app.min.js')))
    .pipe(gulpif(prod, ngannotate()))
    .pipe(gulpif(prod, uglify()))
    .pipe(gulpif(prod, header(banner, { package : package })))
    .pipe(jshint())
    .on('error', notify.onError())
    .pipe(gulp.dest('public/dist/js'))
    .pipe(gulpif(dev, refresh(lrserver)));
});

/**
 * Styles
 * @desc compile sass, add browser prefixes,
 *       minify, append header
 */
gulp.task('styles', function () {
  return gulp.src(paths.styles.import)
    .pipe(plumber())
    .pipe(sass())
    .pipe(prefix('last 1 version', '> 1%', 'ie 8', 'ie 7'))
    .pipe(gulpif(prod, csso()))
    .pipe(gulpif(prod, header(banner, { package : package })))
    .on('error', notify.onError())
    .pipe(gulp.dest(paths.output))
    .pipe(gulpif(dev, refresh(lrserver)));
});

/**
 * JSHint
 * @desc Lints all JavaScript files, outputs in console
 */
gulp.task('lint', function () {
  gulp.src(paths.scripts)
  .pipe(jshint())
  .pipe(jshint.reporter('jshint-stylish'));
});

/**
 * View / Directive templates
 * @desc Compiles HTML templates to escaped string
 */
gulp.task('templates', function () {
  gulp.src('public/src/tmpl/*.html')
    .pipe(templates({
      standalone : true
    }))
    .pipe(gulp.dest('public/src/js/services/'));
});

/**
 * Markup
 * @desc Preprocess to add scripts tags conditionally, minify
 */
gulp.task('markup', function(){
  return gulp.src(paths.markup)
    .pipe(preprocess({context: { dev: dev }}))
    .pipe(gulpif(prod, htmlmin({
      collapseWhitespace: true,
      removeComments : true,
      removeRedundantAttributes : true,
      removeAttributeQuotes : true,
      removeEmptyAttributes : true
    })))
    .pipe(gulp.dest(paths.output))
    .pipe(gulpif(dev, refresh(lrserver)));
});

/**
 * Images
 * @desc Copy and compress images (PNG, JPEG, GIF and SVG)
 */
gulp.task('images', function () {
  var dest = paths.output + '/img/';
  return gulp.src(paths.images)
    .pipe(newer(dest))
    .pipe(imagemin())
    .pipe(gulp.dest(dest));
});



// // Copy
gulp.task('copy', function () {
  gulp.src(paths.copy)
    .pipe(gulp.dest('public/dist/fonts'));
});

gulp.task('copylibs:dev', function() {
  var dest = 'public/dist/js';
  return gulp.src(paths.libs)
    .pipe(newer(dest))
    .pipe(gulp.dest(dest));
});

gulp.task('copylibs:prod', function() {
  return gulp.src(paths.libs)
    .pipe(concat('lib.min.js'))
    .pipe(uglify())
    .pipe(gulp.dest('public/dist/js'));
});



/**
 * Watch
 * @desc Monitors file changes to rerun tasks
 */
gulp.task('watch', function () {
  gulp.watch(paths.markup, ['html']);
  gulp.watch(paths.styles.src, ['styles']);
  gulp.watch(paths.scripts, ['scripts']);
  gulp.watch(paths.templates, ['scripts:dev']);
});


/**
 *  Web servers
 *  @desc Node instance to serve front-end assets
 *        Stubby server to mock REST endpoints
 *        Proxy between the two (mitigating CORS)
 */
var server = express();
server.use(livereload({
  port: config.lrport
}));
server.use('/api', proxy(url.parse('http://localhost:8882/api')));
server.use(express.static(paths.output));

gulp.task('serve', function () {
  server.listen(config.serverport);
  lrserver.listen(config.lrport);
});

gulp.task('mock-endpoint', function () {
  return gulp.src('/')
    .pipe(shell([
      // --data --watch flags
      'stubby -dw public/api/config.yaml',
    ]));
});

/**
 * Clean
 * @desc Deletes `public/dist`. Cleans dir before build
 */
gulp.task('clean', function () {
  return gulp.src(paths.output, {read: false})
    .pipe(clean());
});

/**
 *  Tasks
 */
gulp.task('default', [
  'markup',
  'scripts',
  'styles',
  'images',
  'watch',
  'serve',
  'mock-endpoint'
]);

gulp.task('build', [
  'styles',
  'scripts',
  'markup',
  'images'
]);
