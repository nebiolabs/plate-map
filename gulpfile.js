const gulp = require('gulp');
const del = require("del");
const concat = require('gulp-concat');
const rename = require('gulp-rename');
const uglify = require('gulp-uglify-es').default;
const minifyCSS = require('gulp-clean-css');
const inject = require('gulp-inject');
const browserSync = require('browser-sync').create();
const connect = require('gulp-connect');
const mergeStream = require('merge-stream');

const sourcemaps = require('gulp-sourcemaps');
const babel = require('gulp-babel');


const packageName = 'plate-map';
const PATH = {
    source: {
        css: ['src/css/*.css'],
        js: ['src/js/*.js'],
    },
    example: {
        js: 'example/example.js',
        html: 'example/index.html'
    },
    dependencies: {
        css: [
            'node_modules/select2/dist/css/select2.css'
        ],
        js: [
            'node_modules/jquery/dist/jquery.js',
            'node_modules/jquery-ui-dist/jquery-ui.js',
            'node_modules/select2/dist/js/select2.js',
            'node_modules/svgjs/dist/svg.js',
            'node_modules/clipboard/dist/clipboard.js'
        ]
    },
    destination: {
        prod: {
            css: 'build/prod/css',
            js: 'build/prod/js',
            root: 'build/prod'
        },
        dev: {
            css: 'build/dev/css',
            js: 'build/dev/js',
            root: 'build/dev'
        },
        pack: {
            css: 'dist/css',
            js: 'dist/js',
            root: 'dist'
        }
    }
};

let config = {destination: {css: '', js: '', root: ''}};

function concat_minify_css(name, source, destination) {
    return gulp.src(source)
        .pipe(sourcemaps.init())
        .pipe(concat(name + '.css'))
        .pipe(gulp.dest(destination))
        .pipe(minifyCSS())
        .pipe(rename(name + '.min.css'))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(destination));
}

function concat_uglify_js(name, source, destination) {
    return gulp.src(source)
        .pipe(sourcemaps.init())
        .pipe(concat(name + '.js'))
        .pipe(babel({
            presets: ['@babel/env']
        }))
        .pipe(gulp.dest(destination))
        .pipe(uglify())
        .pipe(rename(name + '.min.js'))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(destination));
}

function config_env(env) {
    config.destination.css = PATH.destination[env].css;
    config.destination.js = PATH.destination[env].js;
    config.destination.root = PATH.destination[env].root;
}

gulp.task('config.prod', async () => {
    config_env('prod');
});

gulp.task('config.dev', async () => {
    config_env('dev');
});

gulp.task('config.pack', async () => {
    config_env('pack');
});

gulp.task('clean', () => {
    return del([config.destination.root]);
});

gulp.task('css', () => {
    return concat_minify_css(packageName, PATH.source.css, config.destination.css);
});

gulp.task('js', () => {
    return concat_uglify_js(packageName, PATH.source.js, config.destination.js);
});

gulp.task('copy.other', () => {
    const css = gulp.src(PATH.dependencies.css)
        .pipe(gulp.dest(config.destination.css));
    const js = gulp.src(PATH.dependencies.js)
        .pipe(gulp.dest(config.destination.js));
    const ex_js = gulp.src(PATH.example.js)
        .pipe(gulp.dest(config.destination.js));
    return mergeStream(css, js, ex_js);
});

gulp.task('copy.src', () => {
    const css = gulp.src(PATH.source.css)
        .pipe(gulp.dest(config.destination.css));
    const js = gulp.src(PATH.source.js)
        .pipe(gulp.dest(config.destination.js));
    return mergeStream(css, js);
});

function jsLink (filePath) {
    const fileName = filePath.substring(filePath.lastIndexOf("/") + 1, filePath.length);
    return '<script src="js/' + fileName + '"></script>';
}

function cssLink (filePath) {
    const fileName = filePath.substring(filePath.lastIndexOf("/") + 1, filePath.length);
    return '<link rel="stylesheet" href="css/' + fileName + '">';
}

gulp.task('inject.prod', () => {
    return gulp.src(PATH.example.html)
        .pipe(inject(gulp.src(PATH.dependencies.css, {read: false}), {transform: cssLink, name: 'dependencies'}))
        .pipe(inject(gulp.src(PATH.dependencies.js, {read: false}), {transform: jsLink, name: 'dependencies'}))
        .pipe(inject(gulp.src([`${config.destination.css}/${packageName}.min.css`, `${config.destination.js}/${packageName}.min.js`], {read: false}),
            {
                ignorePath: config.destination.root,
                addRootSlash: false
            }))
        .pipe(inject(gulp.src(PATH.example.js, {read: false}), {transform: jsLink, name: 'example'}))
        .pipe(gulp.dest(config.destination.root));
});

gulp.task('inject.dev', () => {
    return gulp.src(PATH.example.html)
        .pipe(inject(gulp.src(PATH.dependencies.css, {read: false}), {transform: cssLink, name: 'dependencies'}))
        .pipe(inject(gulp.src(PATH.dependencies.js, {read: false}), {transform: jsLink, name: 'dependencies'}))
        .pipe(inject(gulp.src(PATH.source.css, {read: false}), {transform: cssLink}))
        .pipe(inject(gulp.src(PATH.source.js, {read: false}), {transform: jsLink}))
        .pipe(inject(gulp.src(PATH.example.js, {read: false}), {transform: jsLink, name: 'example'}))
        .pipe(gulp.dest(config.destination.root));
});

gulp.task('server.dev', async () => {
    browserSync.init({server: PATH.destination.dev.root});
    gulp.watch(PATH.source.app.css.concat(PATH.source.app.js), gulp.series('build.dev', browserSync.reload));
});

gulp.task('server.prod', async () => {
    connect.server({
        name: 'App [PRODUCTION MODE]',
        root: PATH.destination.prod.root
    });
});

gulp.task('build.dist', gulp.series('config.pack', 'clean', 'css', 'js'));

gulp.task('build.dev', gulp.series('config.dev', 'clean', 'copy.other', 'copy.src', 'inject.dev'));

gulp.task('serve.dev', gulp.series('build.dev', 'server.dev'));

gulp.task('build.prod', gulp.series('config.prod', 'clean', 'copy.other', 'css', 'js', 'inject.prod'));

gulp.task('serve.prod', gulp.series('build.prod', 'server.prod'));

gulp.task('default', gulp.series('serve.dev'));

gulp.task('build.all', gulp.series('build.dev', 'build.prod', 'build.dist'));

