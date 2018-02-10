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

gulp.task('js', () => gulp.src('./src/**/*')
  .pipe(sourcemaps.init({ loadMaps: true }))
  .pipe(babel({ presets: ['es2015'] }))
		    .on('error', function (e) {
    console.log(e);
    this.emit('end');
  })
  .pipe(sourcemaps.write('.'))
  .pipe(gulp.dest('./build/')));

gulp.task('clean', () => del('./build/**/*'));

gulp.task('watch', () => gulp.src('src/**/*')
  .on('error', console.log)
  .pipe(watch('src/**/*'))
  .pipe(sourcemaps.init({ loadMaps: true }))
  .pipe(babel({ presets: ['es2015'] }))
			    .on('error', function (e) {
    console.log(e);
    this.emit('end');
  })
  .pipe(sourcemaps.write('.'))
  .pipe(gulp.dest('./build/')));

gulp.task('build', ['js']);

gulp.task('default', ['js', 'watch']);
