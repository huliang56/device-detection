const gulp = require('gulp')
const del = require('del')
const babel = require('gulp-babel')
const uglify = require('gulp-uglify')
const imagemin = require('gulp-imagemin')
const htmlmin = require('gulp-htmlmin')
const autoprefixer = require('gulp-autoprefixer')
const merge = require('merge-stream')
const cache = require('gulp-cache')
const cleanCSS = require('gulp-clean-css')

// 清空之前打包的内容
gulp.task('clean', async () => {
  const deletedPaths = await del('dist')
  console.log('gulp clean:', deletedPaths)
})

// 压缩主HTML文件
gulp.task('HTML', () => {
  return gulp
    .src('device-detection.html')
    .pipe(
      htmlmin({
        removeComments: false,
        collapseWhitespace: true,
        removeScriptTypeAttributes: true,
        removeStyleLinkTypeAttributes: true
      })
    )
    .pipe(gulp.dest('dist'))
})

// 压缩CSS文件
gulp.task('CSS', () => {
  return gulp
    .src('src/device-detection.css')
    .pipe(autoprefixer())
    .pipe(cleanCSS())
    .pipe(gulp.dest('dist/src'))
})

// 压缩JS文件
gulp.task('JS', () => {
  const wavesurfer = gulp.src('src/wavesurfer.*.js').pipe(gulp.dest('dist/src'))
  const js = gulp
    .src('src/device-detection.js')
    .pipe(babel())
    .pipe(uglify())
    .pipe(gulp.dest('dist/src'))
  return merge(wavesurfer, js)
})

// 压缩img文件夹下的图片
gulp.task('imagemin', () => {
  return gulp
    .src('src/img/**/*')
    .pipe(cache(imagemin()))
    .pipe(gulp.dest('dist/src/img'))
})

gulp.task(
  'default',
  gulp.series('clean', gulp.parallel('HTML', 'CSS', 'JS', 'imagemin'), done => {
    done()
    console.log('gulp complete!')
  })
)
