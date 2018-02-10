/* eslint-disable */
// Usage:
// 		build the project:
// 			$ gulp build
// 		build, launch server, and watch:
// 			$ gulp

const gulp = require('gulp');
const del = require('del');
const sourcemaps = require('gulp-sourcemaps');
const babel = require('gulp-babel');
const watch = require('gulp-watch');
const gutil = require('gulp-util');
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');
const glob = require('glob');
const gulpif = require('gulp-if');
const rename = require('gulp-rename');
const plumber = require('gulp-plumber');

const sass = require('gulp-sass');
const autoprefixer = require('gulp-autoprefixer');
const cleanCSS = require('gulp-clean-css');

const browserify = require('browserify');
const watchify = require('watchify');
const uglify = require('gulp-uglify');

const dev = (process.env.NODE_ENV !== 'production');

gulp.task('sass', () => gulp.src('./website/styles/*.scss')
	.pipe(plumber())
	.pipe(gulpif(dev, sourcemaps.init()))
	.pipe(sass())
	.pipe(autoprefixer({
		browsers: ['last 2 versions'],
		cascade: false,
	}))
	.pipe(gulpif(!dev, cleanCSS()))
	.pipe(gulpif(dev, sourcemaps.write('./')))
	.pipe(gulp.dest('./assets/styles')));

function bundleJS(file, watch) {
	let bundler;
	const args = {
		cache: {}, packageCache: {}, entries: [file], debug: true,
	};

	if (watch) bundler = watchify(browserify(args));
	else bundler = browserify(args);

	bundler.transform('babelify', { presets: ['es2015'], only: /\/website\/js/ })
		.transform('browserify-shim')
		.transform('debowerify')
		.transform('./jadeify');

	function bundle() {
		bundler.bundle()
			.pipe(plumber())
			.pipe(source(file))
			.pipe(buffer())
			.pipe(gulpif(!dev, uglify()))
			.pipe(rename((path) => { path.dirname = ''; }))
			.pipe(gulp.dest('./assets/js/'));
	}
	bundle();

	if (watch) bundler.on('update', () => { bundle(); });
}

function makeBundles(watch) {
	glob('./website/js/**/[^_]*.js', (err, files) => {
		if (err) return gutil.log(err);
		files.map((entry) => {
			bundleJS(entry, watch);
		});
	});
}

gulp.task('js', () => {
	makeBundles();
	return gulp.src('./src/**/*')
		.pipe(plumber())
		.pipe(sourcemaps.init({ loadMaps: true }))
		.pipe(babel({ presets: ['es2015'] }))
		.pipe(sourcemaps.write('.'))
		.pipe(gulp.dest('./build/'));
});

gulp.task('clean', () => del(['./assets/js/**/*', './assets/styles/**/*']));

gulp.task('watch', () => {
	gulp.watch('./website/styles/*.scss', ['sass']);
	gulp.watch('./website/assets/**/*', ['static']);
	makeBundles(true);
	return gulp.src('src/**/*')
		.pipe(plumber())
		.pipe(watch('src/**/*'))
		.pipe(sourcemaps.init({ loadMaps: true }))
		.pipe(babel({ presets: ['es2015'] }))
		.pipe(sourcemaps.write('.'))
		.pipe(gulp.dest('./build/'));
});

gulp.task('build', ['sass', 'js']);

gulp.task('default', ['sass', 'js', 'watch']);
