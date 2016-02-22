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

gulp.task('js', function() {
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
	return del('./build/**/*');
});

gulp.task('watch', function() {
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

gulp.task('build', ['js']);

gulp.task('default', ['js', 'watch']);
