// Usage:
// 		build the project:
// 			$ gulp build
// 		build, launch server, and watch:
// 			$ gulp

var gulp = require('gulp');
var gutil = require('gulp-util');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var glob = require('glob');
var del = require('del');
var sourcemaps = require('gulp-sourcemaps');
var browserSync = require('browser-sync').create();
var gulpif = require('gulp-if');

var sass = require('gulp-sass');
var autoprefixer = require('gulp-autoprefixer');
var cleanCSS = require('gulp-clean-css');

var browserify = require('browserify');
var watchify = require('watchify');
var babelify = require('babelify');
var uglify = require('gulp-uglify');

var dev = (process.env.NODE_ENV !== "production");

gulp.task('sass', function() {
	return gulp.src('./src/styles/*.scss')
		.pipe(gulpif(dev, sourcemaps.init()))
			.pipe(sass().on('error', sass.logError))
			.pipe(autoprefixer({
				browsers: ['last 2 versions'],
				cascade: false
			}))
			.pipe(gulpif(!dev, cleanCSS()))
		.pipe(gulpif(dev, sourcemaps.write('./')))
		.pipe(gulp.dest('./build/styles'));
});

function bundleJS(file, watch) {
	var bundler;
	var args = { cache: {}, packageCache: {}, entries: [file], debug: true };

	if (watch) bundler = watchify(browserify(args));
	else bundler = browserify(args);

	bundler.transform('babelify', {presets: ['es2015'], only: /\/src\/js/})
		.transform('browserify-shim')
		.transform('debowerify')
		.transform('./jadeify');

	function bundle() {
		bundler.bundle()
			.on('error', function (err) { gutil.log(err.message); })
			.pipe(source(file.slice(9)))
			.pipe(buffer())
			.pipe(gulpif(!dev, uglify()))
			.on('error', function(e){
				console.log(e);
			})
			.pipe(gulp.dest('./build/js/'));
	}
	bundle();

	if (watch) bundler.on('update', function () { bundle(); });
}

function makeBundles(watch) {
	glob('./src/js/**/[^_]*.js', function(err, files) {
		if(err) return gutil.log(err);

		files.map(function(entry) {
			bundleJS(entry, watch);
		});
	});
}

gulp.task('js', function() {
	makeBundles();
});

gulp.task('watchify', function () {
	makeBundles(true);
});

gulp.task('serve', function () {
    browserSync.init({
        server: {
            baseDir: "./build"
        }
    });
	gulp.watch('./build/**/*')
		.on('change', browserSync.reload);
});

gulp.task('clean', function() {
	return del('./build/**/*');
});

gulp.task('watch', ['watchify'], function() {
	gulp.watch('./src/styles/*.scss', ['sass']);
	gulp.watch('./src/assets/**/*', ['static']);
});

gulp.task('build', ['sass', 'js']);

gulp.task('default', ['sass', 'watch']);

