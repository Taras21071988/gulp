const { src, dest, watch, parallel, series } = require("gulp");

const scss = require("gulp-sass")(require("sass"));
const concat = require("gulp-concat");
const uglify = require("gulp-uglify-es").default;
const browserSync = require("browser-sync").create();
const autoprefixer = require("gulp-autoprefixer");
const clean = require("gulp-clean");

//Работа с файлами стилей + autoprefixer
function styles() {
  return src("app/scss/style.scss")
    .pipe(
      autoprefixer({
        overrideBrowserslist: ["last 10 version"], // Указываем поддержка скольки предыдующих версий нужна
      })
    )
    .pipe(concat("style.min.css"))
    .pipe(scss({ outputStyle: "compressed" }))
    .pipe(dest("app/css"))
    .pipe(browserSync.stream());
}

//Работа с файлами скриптов
function scripts() {
  return src([
    // "node_modules/swiper/swiper-bundle.js", //Подключение для тестов swiper
    "app/js/**/*.js", //Работа со всеми файлами которые имеют расширение .js внутри папки js - и вложенных папок в ней
    "!app/js/main.min.js", //Указываем что неиспользовать данный файл
  ])
    .pipe(concat("main.min.js"))
    .pipe(uglify())
    .pipe(dest("app/js"))
    .pipe(browserSync.stream());
}

//Обновление браузера
function browsersync() {
  browserSync.init({
    server: {
      baseDir: "app/",
    },
  });
}
//Отслеживание изменений в описанных тут файлах
function watching() {
  watch(["app/scss/style.scss"], styles);
  watch(["app/js/**/*.js"], scripts);
  watch(["app/*.html"]).on("change", browserSync.reload);
}

//Task для группировки конечных файлов перед выдачей
function building() {
  return src(["app/css/style.min.css", "app/js/main.min.js", "app/**/*.html"], {
    base: "app",
  }).pipe(dest("dist"));
}

//Task для удаление папки dist при повторнои использование build
function cleanDist() {
  return src("dist").pipe(clean());
}

exports.styles = styles;
exports.scripts = scripts;
exports.watching = watching;
exports.browsersync = browsersync;

//Выполнение build and clean - используется series(последовательное выполнение task)
exports.build = series(cleanDist, building);

//Параллельный запуск всех требуемых tasks - используется parallel(task выполняется паралельно друг другу)
exports.default = parallel(styles, scripts, browsersync, watching);
