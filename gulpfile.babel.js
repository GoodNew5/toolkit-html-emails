import gulp     from 'gulp';
import plugins  from 'gulp-load-plugins';
import browser  from 'browser-sync';
import rimraf   from 'rimraf';
import yargs    from 'yargs';
import lazypipe from 'lazypipe';
import fs       from 'fs';
import siphon   from 'siphon-media-query';
import fileinclude from 'gulp-file-include';
import i18n from 'gulp-i18n-localize';
import extender from 'gulp-html-extend';
import htmlbeautify from 'gulp-html-beautify';
import sassGlob from 'gulp-sass-glob';


const $ = plugins();
const PRODUCTION = !!(yargs.argv.production);

gulp.task(
  "build",
  gulp.series([clean, tmp, sass, inline])
);

gulp.task(
  "dev",
  gulp.series([clean, tmp, sass])
)

gulp.task('default',
  gulp.series(clean, tmp, sass, server, watch)
);

function clean(done) {
  rimraf('dist', done);
}

const PATHS = {
  CSS: 'src/styles/app.scss',
  HTML: 'src/markup/templates/*.html',
  LOCALES: './src/localization',
  DIST: 'dist'
}

const LANGS = ['en', 'ru']

const fileIncludeConfig = {
  prefix: "@@",
  basepath: "@file"
}

function tmp() {
  return gulp.src(PATHS.HTML)
    .pipe(fileinclude(fileIncludeConfig))
    .pipe(extender({
      annotations:true,
      verbose:false
    }))
    .pipe(i18n({
      locales: LANGS,
      localeDir: PATHS.LOCALES
    }))
    .pipe(gulp.dest(PATHS.DIST))
}

function sass() {
  return gulp.src(PATHS.CSS)
    .pipe($.if(!PRODUCTION, $.sourcemaps.init()))
    .pipe(sassGlob())
    .pipe($.sass().on('error', $.sass.logError))
    .pipe($.if(!PRODUCTION, $.sourcemaps.write()))
    .pipe(gulp.dest(`${PATHS.DIST}/css`));
}

function inline() {
  return gulp.src(`${PATHS.DIST}/**/*.html`)
    .pipe(inliner(`${PATHS.DIST}/css/app.css`))
    .pipe(htmlbeautify())
    .pipe(gulp.dest(PATHS.DIST))
}

function server(done) {
  browser.init({
    server: PATHS.DIST,
    directory: true,
    baseDir: "./"
  });
  done();
}

function watch() {
  gulp.watch(PATHS.HTML).on('all', gulp.series('dev', browser.reload));
  gulp.watch('src/localization/*.json').on('all', gulp.series(tmp, browser.reload));
  gulp.watch(['src/markup/layouts/**/*', 'src/markup/partials/**/*']).on('all', gulp.series('dev', browser.reload));
  gulp.watch(['src/styles/**/*.scss', 'src/styles/**/*.scss']).on('all', gulp.series('dev', browser.reload));
}

function inliner(css) {
  var css = fs.readFileSync(css).toString();
  var mqCss = siphon(css);

  var pipe = lazypipe()
    .pipe($.inlineCss, {
      applyStyleTags: false,
      removeStyleTags: false,
      preserveMediaQueries: true,
      removeHtmlSelectors: false,
      removeLinkTags: false
    })
    .pipe($.replace, '<!-- <style> -->', `<style>${mqCss}</style>`)
    .pipe($.replace, '<link rel="stylesheet" type="text/css" href="../css/app.css">', '')
    .pipe($.htmlmin, {
      collapseWhitespace: true,
      minifyCSS: true
    });

  return pipe();
}
