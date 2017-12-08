// Usage:
// 		build the project:
// 			$ gulp build
// 		build, launch server, and watch:
// 			$ gulp

var gulp = require('gulp');
var del = require('del');
var sourcemaps = require('gulp-sourcemaps');
var babel = require('gulp-babel');
var watch = require('gulp-watch');
var gutil = require('gulp-util');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var glob = require('glob');
var gulpif = require('gulp-if');
var rename = require("gulp-rename");

var sass = require('gulp-sass');
var autoprefixer = require('gulp-autoprefixer');
var cleanCSS = require('gulp-clean-css');

var browserify = require('browserify');
var watchify = require('watchify');
var babelify = require('babelify');
var uglify = require('gulp-uglify');

var dev = (process.env.NODE_ENV !== "production");

gulp.task('sass', function() {
    return gulp.src('./website/styles/*.scss')
    .pipe(gulpif(dev, sourcemaps.init()))
    .pipe(sass().on('error', sass.logError))
    .pipe(autoprefixer({
        browsers: ['last 2 versions'],
        cascade: false
    }))
    .pipe(gulpif(!dev, cleanCSS()))
    .pipe(gulpif(dev, sourcemaps.write('./')))
    .pipe(gulp.dest('./assets/styles'));
});

function bundleJS(file, watch) {
    var bundler;
    var args = { cache: {}, packageCache: {}, entries: [file], debug: true };

    if (watch) bundler = watchify(browserify(args));
    else bundler = browserify(args);

    bundler.transform('babelify', {presets: ['es2015'], only: /\/website\/js/})
        .transform('browserify-shim')
        .transform('debowerify')
        .transform('./jadeify');

    function bundle() {
        bundler.bundle()
            .on('error', function (err) { gutil.log(err.message); })
            .pipe(source(file))
            .pipe(buffer())
            .pipe(gulpif(!dev, uglify()))
                .on('error', function(e){
                    console.log(e);
                })
            .pipe(rename(path => { path.dirname = ''; }))
            .pipe(gulp.dest('./assets/js/'));
    }
    bundle();

    if (watch) bundler.on('update', function () { bundle(); });
}

function makeBundles(watch) {
    glob('./website/js/**/[^_]*.js', function(err, files) {
        if(err) return gutil.log(err);
        files.map(function(entry) {
            bundleJS(entry, watch);
        });
    });
}

gulp.task('js', function() {
    makeBundles();
    return gulp.src('./src/**/*')
        .pipe(sourcemaps.init({ loadMaps: true }))
        .pipe(babel({presets: ['es2015']}))
            .on('error', function(e) {
                console.log(e);
                this.emit('end');
            })
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('./build/'));
});

gulp.task('clean', function() {
    return del(['./assets/js/**/*', './assets/styles/**/*']);
});

gulp.task('watch', function() {
	gulp.watch('./website/styles/*.scss', ['sass']);
	gulp.watch('./website/assets/**/*', ['static']);
    makeBundles(true);
    return gulp.src('src/**/*')
            .on('error', console.log)
        .pipe(watch('src/**/*'))
        .pipe(sourcemaps.init({ loadMaps: true }))
        .pipe(babel({presets: ['es2015']}))
            .on('error', function(e) {
                console.log(e);
                this.emit('end');
            })
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('./build/'));
});

gulp.task('build', ['sass', 'js']);

gulp.task('default', ['sass', 'js', 'watch']);
