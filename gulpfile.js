const gulp = require('gulp');
const concat = require('gulp-concat');
const rename = require('gulp-rename');
const uglifyJS = require('gulp-uglify');
const minifyCSS = require('gulp-clean-css');
const minifyHTML = require('gulp-htmlmin');
const clean = require('gulp-clean');
const runSequence = require('run-sequence');
const inject = require('gulp-inject');
const browserSync = require('browser-sync').create();
const connect = require('gulp-connect');
const mergeStream = require('merge-stream');

const PATH = {
    source: {
        app: {
            css: ['src/css/*.css'],
            js: ['src/js/*.js'],
            html: 'src/index.html',
            json: 'package.json'
        },
        dependencies: {
            css: [
                'node_modules/bootstrap/dist/css/bootstrap.css',
                'node_modules/select2/select2.css'
            ],
            js: [
                'node_modules/jquery/dist/jquery.js',
                'node_modules/jquery-ui-dist/jquery-ui.js',
                'node_modules/bootstrap/dist/js/bootstrap.js',
                'node_modules/select2/select2.js',
                'node_modules/fabric/dist/fabric.js',
                'node_modules/clipboard/dist/clipboard.js'
            ],
            img: [
                'node_modules/select2/*.png',
                'node_modules/select2/*.gif'
            ]
        },
    },
    destination: {
        prod: {
            css: 'dist/prod/css',
            js: 'dist/prod/js',
            root: 'dist/prod'
        },
        dev: {
            css: 'dist/dev/css',
            js: 'dist/dev/js',
            root: 'dist/dev'
        },
        pack: {
            css: 'dist/package/css',
            js: 'dist/package/js',
            root: 'dist/package'
        }
    }
};

let config = {source: {css: '', js: '', img: '', html: '', json: ''}, destination: {css: '', js: '', root: ''}};

function concat_minify_css(source, destination) {
    return gulp.src(source)
        .pipe(concat('main.css'))
        .pipe(minifyCSS())
        .pipe(rename('main.min.css'))
        .pipe(gulp.dest(destination));
}

function concat_uglify_js(source, destination) {
    return gulp.src(source)
        .pipe(concat('main.js'))
        .pipe(uglifyJS())
        .pipe(rename('main.min.js'))
        .pipe(gulp.dest(destination));
}

function config_env(env) {
    config.source.css = PATH.source.dependencies.css.concat(PATH.source.app.css);
    config.source.js = PATH.source.dependencies.js.concat(PATH.source.app.js);
    config.source.img = PATH.source.dependencies.img;
    config.source.html = PATH.source.app.html;
    config.destination.css = PATH.destination[env].css;
    config.destination.js = PATH.destination[env].js;
    config.destination.root = PATH.destination[env].root;
}

gulp.task('config.prod', () => {
    config_env('prod');
});

gulp.task('config.dev', () => {
    config_env('dev');
});

gulp.task('config.pack', () => {
    config.source.css = PATH.source.app.css;
    config.source.js = PATH.source.app.js;
    config.source.js.push('!src/js/example.js');
    config.source.json = PATH.source.app.json;
    config.destination.css = PATH.destination.pack.css;
    config.destination.js = PATH.destination.pack.js;
    config.destination.root = PATH.destination.pack.root;
});

gulp.task('clean', () => {
    return gulp.src(config.destination.root)
        .pipe(clean());
});

gulp.task('css', () => {
    return concat_minify_css(config.source.css, config.destination.css);
});

gulp.task('js', () => {
    return concat_uglify_js(config.source.js, config.destination.js);
});

gulp.task('copy.src', () => {
    const css = gulp.src(config.source.css)
        .pipe(gulp.dest(config.destination.css));
    const js = gulp.src(config.source.js)
        .pipe(gulp.dest(config.destination.js));
    return mergeStream(css, js);
});

// Copy images of Select2 (v3.5.1) dependency to 'dist/prod/css'
gulp.task('copy.img', () => {
    return gulp.src(config.source.img)
        .pipe(gulp.dest(config.destination.css));
});

gulp.task('copy.package.json', () => {
   return gulp.src(config.source.json)
       .pipe(gulp.dest(config.destination.root));
});

gulp.task('inject.prod', () => {
    return gulp.src(config.source.html)
        .pipe(inject(gulp.src([`${config.destination.css}/*.css`, `${config.destination.js}/*.js`], {read: false}),
            {
                ignorePath: config.destination.root,
                addRootSlash: false
            }))
        .pipe(minifyHTML({collapseWhitespace: true}))
        .pipe(gulp.dest(config.destination.root));
});

gulp.task('inject.dev', () => {
    return gulp.src(config.source.html)
        .pipe(inject(
            gulp.src(config.source.css, {read: false}),
            {
                transform: (filePath) => {
                    const fileName = filePath.substring(filePath.lastIndexOf("/") + 1, filePath.length);
                    return '<link rel="stylesheet" href="css/' + fileName + '">';
                }
            }))
        .pipe(inject(
            gulp.src(config.source.js, {read: false}),
            {
                transform: (filePath) => {
                    const fileName = filePath.substring(filePath.lastIndexOf("/") + 1, filePath.length);
                    return '<script src="js/' + fileName + '"></script>';
                }
            }
        ))
        .pipe(gulp.dest(config.destination.root));
});

gulp.task('server.dev', () => {
    browserSync.init({server: 'dist/dev'});
    gulp.watch([PATH.source.app.css, PATH.source.app.js], ['build.dev'])
        .on('change', browserSync.reload);
});

gulp.task('server.prod', () => {
    connect.server({
        name: 'App [PRODUCTION MODE]',
        root: 'dist/prod'
    });
});

gulp.task('build.package', (done) => runSequence('config.pack', 'clean', 'css', 'js', 'copy.package.json', done));

gulp.task('build.dev', (done) => runSequence('config.dev', 'clean', 'copy.src', 'copy.img', 'inject.dev', done));

gulp.task('serve.dev', (done) => runSequence('build.dev', 'server.dev', done));

gulp.task('build.prod', (done) => runSequence('config.prod', 'clean', 'css', 'js', 'copy.img', 'inject.prod', done));

gulp.task('serve.prod', (done) => runSequence('build.prod', 'server.prod', done));

gulp.task('default', ['serve.dev']);