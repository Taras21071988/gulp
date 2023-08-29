const { src, dest, watch, parallel, series } = require("gulp");

const scss = require("gulp-sass")(require("sass"));
const concat = require("gulp-concat");
const uglify = require("gulp-uglify-es").default;
const browserSync = require("browser-sync").create();
const autoprefixer = require("gulp-autoprefixer");
const clean = require("gulp-clean");
const avif = require("gulp-avif");
const webp = require("gulp-webp");
const imagemin = require("gulp-imagemin");
const newer = require("gulp-newer");

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
    "app/js/**/*.js", //Работа со всеми файлами которые имеют расширение .js внутри папки js - и вложенных папок в ней
    "!app/js/main.min.js", //Указываем что неиспользовать данный файл
  ])
    .pipe(concat("main.min.js"))
    .pipe(uglify())
    .pipe(dest("app/js"))
    .pipe(browserSync.stream());
}

//Отслеживание изменений в описанных тут файлах
function watching() {
  browserSync.init({
    server: {
      baseDir: "app/",
    },
  }); //Обновление браузера
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

//Функция для работы с картинками
function images() {
  return src(["app/images/src/*.*", "!app/images/src/*.svg"]) //Путь к файлам с указание не конвертировать файлы svg
    .pipe(newer("app/images/dist")) //Используем newer для того чтобы при повторном запуске не конвертировать изображения которые уже конвертировали
    .pipe(avif({ quality: 60 })) // Указываем качество картинки после конвертации

    .pipe(src("app/images/src/*.*")) //Указываем путь к изначальным файлам изображений
    .pipe(newer("app/images/dist")) // Прописываем перед каждым плагином для корректной работы
    .pipe(webp())

    .pipe(src("app/images/src/*.*")) //Указываем путь к изначальным файлам изображений
    .pipe(newer("app/images/dist")) // Прописываем перед каждым плагином для корректной работы
    .pipe(imagemin())

    .pipe(dest("app/images/dist"));
}

exports.styles = styles;
exports.images = images;
exports.scripts = scripts;
exports.watching = watching;

//Выполнение build and clean - используется series(последовательное выполнение task)
exports.build = series(cleanDist, building);

//Параллельный запуск всех требуемых tasks - используется parallel(task выполняется паралельно друг другу)
exports.default = parallel(styles, scripts, watching);
