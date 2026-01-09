const AdmZip = require("adm-zip");
const fs = require("fs");
const path = require("path");

// --- НАСТРОЙКИ ---
const OUTPUT_FOLDER = "dist"; // Название папки, куда будут падать архивы
// -----------------

// 1. Читаем manifest.json
let manifest;
try {
    manifest = require("./manifest.json");
} catch (e) {
    console.error("❌ Ошибка: Файл manifest.json не найден!");
    return;
}

const version = manifest.widget.version || "1.0.0";
const zipFileName = `widget_v${version}.zip`;

console.log(`🔨 Собираем версию ${version}...`);

try {
    const zip = new AdmZip();

    // 2. Добавляем папки (i18n, images)
    const foldersToAdd = ["i18n", "images"];
    foldersToAdd.forEach(folder => {
        if (fs.existsSync(folder)) {
            zip.addLocalFolder(folder, folder);
        }
    });

    // 3. Добавляем файлы (manifest, script, style)
    const filesToAdd = ["manifest.json", "script.js", "style.css"];
    filesToAdd.forEach(file => {
        if (fs.existsSync(file)) {
            zip.addLocalFile(file);
        }
    });

    // 4. Логика создания отдельной папки для архивов
    // Если папки нет — создаем её
    if (!fs.existsSync(OUTPUT_FOLDER)) {
        fs.mkdirSync(OUTPUT_FOLDER);
        console.log(`📂 Папка "${OUTPUT_FOLDER}" создана`);
    }

    // 5. Сохраняем архив ВНУТРЬ папки dist
    zip.writeZip(path.join(OUTPUT_FOLDER, zipFileName));

    console.log("------------------------------------------------");
    console.log(`🎉 УСПЕХ!`);
    console.log(`📦 Архив: ${zipFileName}`);
    console.log(`📍 Лежит в папке: ${OUTPUT_FOLDER}`);
    console.log("------------------------------------------------");

} catch (e) {
    console.error("Ошибка:", e);
}