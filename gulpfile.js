var gulp = require('gulp');
var gutil = require('gulp-util');
var uglify = require('gulp-uglify');
// var watchPath = require('gulp-watch-path');
var minifycss = require('gulp-minify-css');
var concat = require('gulp-concat');
var rename=require('gulp-rename')


gulp.task('default', function () {
    // 将你的默认的任务代码放在这
    // gutil.log('message');
    // gutil.log(gutil.colors.red('error'));
    // gutil.log(gutil.colors.green('message:') + "some");

    //合并   混淆js
    gulp.src(['node_modules/angular/**/*','node_modules/angular-motion/**/*','node_modules/bootstrap/**/*','node_modules/bootstrap-additions/**/*','node_modules/bootstrap-editable/**/*','node_modules/font-awesome/**/*'],{base:'node_modules'})
        .pipe(gulp.dest('plugin'));

    gulp.src(['resources/js/kkUtil.js'])
        .pipe(concat('angular-strap-extension.js'))
        .pipe(gulp.dest("dist/js"))
        .pipe(uglify())
        .pipe(rename('angular-strap-extension.min.js'))
        .pipe(gulp.dest("dist/js"));

    gulp.src('node_modules/angular/angular.js')
        .pipe(concat('angular.js'))
        .pipe(gulp.dest("dist/js"))
        .pipe(uglify())
        .pipe(rename('angular.min.js'))
        .pipe(gulp.dest("dist/js"))

    //css压缩
    gulp.src('resources/css/angular-strap-extension.css')
        .pipe(gulp.dest('dist/css'))
        .pipe(minifycss())
        .pipe(rename('angular-strap-extension.min.css'))
        .pipe(gulp.dest('dist/css'));

});