import gulp     from 'gulp';
import plugins  from 'gulp-load-plugins';
import browser  from 'browser-sync';
import rimraf   from 'rimraf';
import panini   from 'panini';
import yargs    from 'yargs';
import lazypipe from 'lazypipe';
import inky     from 'inky';
import fs       from 'fs';
import siphon   from 'siphon-media-query';
import path     from 'path';
import merge    from 'merge-stream';
import beep     from 'beepbeep';
import colors   from 'colors';

const $ = plugins();
const fileinclude = require('gulp-file-include')
const i18n = require("gulp-i18n-localize");
const extender = require('gulp-html-extend');
const htmlbeautify = require('gulp-html-beautify');



// Look for the --production flag
const PRODUCTION = !!(yargs.argv.production);
const EMAIL = yargs.argv.to;

// Declar var so that both AWS and Litmus task can use it.
var CONFIG;

// Build the "dist" folder by running all of the below tasks
gulp.task(
  "build",
  gulp.series([clean, tmp, sass, inline, images])
);

gulp.task(
  "dev",
  gulp.series([clean, tmp, sass, images])
)

// Build emails, run the server, and watch for file changes
gulp.task('default',
  gulp.series('dev', server, watch)
);

// Build emails, then zip
gulp.task('zip',
  gulp.series('build', zip));

// Build the "dist" folder by running all of the below tasks


// Delete the "dist" folder
// This happens every time a build starts
function clean(done) {
  rimraf('dist', done);
}

const fileInclude = {
  prefix: "@@",
  basepath: "@file"
}

function tmp() {
  var options = {
    indentSize: 2,
    useConfig: true
  }

  return gulp.src("src/pages/*.html")
    .pipe(fileinclude(fileInclude))
    .pipe(extender({annotations:true,verbose:false}))
    .pipe(i18n({
      locales: ['en','ru'],
      localeDir: './src/localization'
    }))
    .pipe(gulp.dest("dist"))
}

function fileI (done) {
  return gulp.src("src/pages/*.html")
  .pipe(fileinclude(fileInclude))
  done()
}

// Compile Sass into CSS
function sass() {
  return gulp.src('src/assets/scss/app.scss')
    .pipe($.if(!PRODUCTION, $.sourcemaps.init()))
    .pipe($.sass({
      includePaths: ['node_modules/foundation-emails/scss']
    }).on('error', $.sass.logError))
    .pipe($.if(PRODUCTION, $.uncss(
      {
        html: ['dist/**/*.html']
      })))
    .pipe($.if(!PRODUCTION, $.sourcemaps.write()))
    .pipe(gulp.dest('dist/css'));
}

// Copy and compress images
function images() {
  return gulp.src(['src/assets/img/**/*', '!src/assets/img/archive/**/*'])
    .pipe($.imagemin())
    .pipe(gulp.dest('./dist/assets/img'));
}

// Inline CSS and minify HTML
function inline() {
  return gulp.src('dist/**/*.html')
    .pipe($.if(PRODUCTION, inliner('dist/css/app.css')))
    .pipe($.if(PRODUCTION, gulp.dest('dist')))
}

// Start a server with LiveReload to preview the site in
function server(done) {
  browser.init({
    server: 'dist/en/',
    index: 'default.html',
    baseDir: "dist/en"
  });
  done();
}

// Watch for file changes
function watch() {
  gulp.watch('src/pages/**/*.html').on('all', gulp.series('build', tmp, browser.reload));
  gulp.watch('src/partials/**/*.html').on('all', gulp.series(fileI));
  gulp.watch('src/localization/*.json').on('all', gulp.series('build', tmp, browser.reload));
  gulp.watch(['src/layouts/**/*', 'src/partials/**/*']).on('all', gulp.series(tmp, browser.reload));
  gulp.watch(['../scss/**/*.scss', 'src/assets/scss/**/*.scss']).on('all', gulp.series(sass, inline, browser.reload));
  gulp.watch('src/assets/img/**/*').on('all', gulp.series(images, browser.reload));
}

// Inlines CSS into HTML, adds media query CSS into the <style> tag of the email, and compresses the HTML
function inliner(css) {
  var css = fs.readFileSync(css).toString();
  var mqCss = siphon(css);

  var pipe = lazypipe()
    .pipe($.inlineCss, {
      applyStyleTags: false,
      removeStyleTags: true,
      preserveMediaQueries: true,
      removeLinkTags: false
    })
    .pipe($.replace, '<!-- <style> -->', `<style>${mqCss}</style>`)
    .pipe($.replace, '<link rel="stylesheet" type="text/css" href="css/app.css">', '')
    .pipe($.htmlmin, {
      collapseWhitespace: true,
      minifyCSS: true
    });

  return pipe();
}



// Copy and compress into Zip
function zip() {
  var dist = 'dist';
  var ext = '.html';

  function getHtmlFiles(dir) {
    return fs.readdirSync(dir)
      .filter(function(file) {
        var fileExt = path.join(dir, file);
        var isHtml = path.extname(fileExt) == ext;
        return fs.statSync(fileExt).isFile() && isHtml;
      });
  }

  var htmlFiles = getHtmlFiles(dist);

  var moveTasks = htmlFiles.map(function(file){
    var sourcePath = path.join(dist, file);
    var fileName = path.basename(sourcePath, ext);

    var moveHTML = gulp.src(sourcePath)
      .pipe($.rename(function (path) {
        path.dirname = fileName;
        return path;
      }));

    var moveImages = gulp.src(sourcePath)
      .pipe($.htmlSrc({ selector: 'img'}))
      .pipe($.rename(function (path) {
        path.dirname = fileName + path.dirname.replace('dist', '');
        return path;
      }));

    return merge(moveHTML, moveImages)
      .pipe($.zip(fileName+ '.zip'))
      .pipe(gulp.dest('dist'));
  });

  return merge(moveTasks);
}
