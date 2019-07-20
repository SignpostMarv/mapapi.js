const gulp = require('gulp');
const typescript = require('gulp-typescript');
const sourcemaps = require('gulp-sourcemaps');

const project = typescript.createProject('tsconfig.json');

gulp.task('typescript', () => {
    return gulp.src('./src/ts/**/*.ts').pipe(
        sourcemaps.init()
    ).pipe(project()).pipe(
        sourcemaps.write('./')
    ).pipe(gulp.dest('./src/js/'));
});

gulp.task('default', gulp.parallel(
    'typescript'
));
