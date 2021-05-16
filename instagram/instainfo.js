const fs = require("fs");
const util = require("util");
const writeFile = util.promisify(fs.writeFile);
const path = require("path");
const fetch = require("node-fetch");
const makePause = require("../lib/makePause");
const sharp = require("sharp");
const email = require("../lib/email");

class InstaInfo {
    constructor(settingsFile) {
        this.data =
            [
                {
                    "timestamp": "2021-04-02T18:33:11+0000",
                    "caption": "",
                    "fullcaption": "",
                    "permalink": "",
                    "automodel": ""
                },
                {
                    "timestamp": "2021-04-02T18:33:11+0000",
                    "caption": "",
                    "fullcaption": "",
                    "permalink": "",
                    "automodel": ""
                },
                {
                    "timestamp": "2021-04-02T18:33:11+0000",
                    "caption": "",
                    "fullcaption": "",
                    "permalink": "",
                    "automodel": ""
                }
            ];
        this.insta_token = "";
        this.settingsFile = settingsFile;
        this.activeSubDir = "1";

        this.loadSettings();
    }

    loadSettings() {
        if (fs.existsSync(this.settingsFile)) {

            try {

                let settingsStr = fs.readFileSync(this.settingsFile);
                let settingsJSON = JSON.parse(settingsStr);

                for (let i = 0; i < Math.min(settingsJSON.data.length, 3); i++) {
                    Object.assign(this.data[i], settingsJSON.data[i]);
                }

                this.insta_token = settingsJSON.insta_token;
                this.activeSubDir = settingsJSON.activeSubDir;

            } catch {

                console.error("Ошибка чтения настроек из файла " + this.settingsFile);

            }

        } else {
            console.error("Файл настроек не существует " + this.settingsFile);
        }

    }

    async getInstaInfo() {

        let executionStatus = "";
        try {

            executionStatus = "продлеваем токен";
            let res = await fetch(`https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${this.insta_token}`);
            executionStatus = "запрашиваем 3 последние картинки";
            res = await fetch(`https://graph.instagram.com/me/media?fields=id,media_type,media_url,username,timestamp,caption,permalink,thumbnail_url,children{id,media_type,media_url,permalink,thumbnail_url,timestamp}&access_token=${this.insta_token}&limit=3`);
            let downloadSubDir;

            if (this.activeSubDir === "1") downloadSubDir = "2"
            else downloadSubDir = "1";

            if (res.status === 200) {

                let resObject = await res.json();
                let amountPublications = Math.min(resObject.data.length, 3);

                if (amountPublications > 0) {
                    if (this.data[0].fullcaption === resObject.data[0].caption) {
                        // console.log("Обновление галерии работ не требуется.");
                        return;
                    };
                }

                for (let i = 0; i < amountPublications; i++) {

                    executionStatus = `запрашиваем большую картинку ${(i + 1)}`;
                    let picture_url = resObject.data[i].media_url;

                    if (resObject.data[i].media_type !== "IMAGE") {

                        for (let childrenCounter = 0; childrenCounter < resObject.data[i].children.data.length; childrenCounter++) {

                            if (resObject.data[i].children.data[childrenCounter].media_type === "IMAGE") {
                                picture_url = resObject.data[i].children.data[childrenCounter].media_url;
                                break;
                            }

                        }

                    }

                    executionStatus = `сохраняем большую картинку ${(i + 1)}`;
                    res = await fetch(picture_url);

                    if (res.status !== 200) {

                        throw new Error(`Получен не 200 статус ответа при скачивании ${(i + 1)}-й картинки`);

                    }

                    let bigPictureFileName = `public/imgs/${downloadSubDir}/work-${(i + 1)}-big.jpg`;
                    let smallPictureFileName = `public/imgs/${downloadSubDir}/work-${(i + 1)}.jpg`;

                    executionStatus = `сохраняем большую картинку ${(i + 1)}`;
                    await this.saveFetchResultAsFile(res, bigPictureFileName);
                    await makePause(2000);
                    executionStatus = `преобразование большой картинки ${(i + 1)} в маленькую`;
                    await sharp(bigPictureFileName).resize(240, 240).jpeg({
                        quality: 60
                    }).toFile(smallPictureFileName);
                    await makePause(2000);

                }

                executionStatus = "заполняем структуру свойств галереи картинок";

                for (let i = 0; i < amountPublications; i++) {

                    let pos = resObject.data[i].caption.indexOf(",");
                    if (pos !== -1) this.data[i].automodel = resObject.data[i].caption.slice(0, pos);
                    else this.data[i].automodel = "";

                    this.data[i].fullcaption = resObject.data[i].caption;

                    pos = resObject.data[i].caption.indexOf("!");
                    if (pos !== -1) this.data[i].caption = resObject.data[i].caption.slice(0, pos + 1);
                    else this.data[i].caption = resObject.data[i].caption.slice(0, 40);

                    this.data[i].permalink = resObject.data[i].permalink;
                    this.data[i].timestamp = resObject.data[i].timestamp;

                }

                this.activeSubDir = downloadSubDir;

                executionStatus = "сохраняем обновленные данные галереи в файл";
                await writeFile(this.settingsFile, JSON.stringify(this, ["data", "timestamp", "caption", "fullcaption", "permalink", "automodel", "activeSubDir", "insta_token"]));

            } else {

                throw new Error("Получен не 200 статус ответа при запросе 3 последних картинок");

            }

        } catch (error) {

            let textError = "Ошибка при получении галереи работ " + error + " Шаг - " + executionStatus;
            // частично удаляем текст токена если он есть из письма
            let pos = textError.indexOf("access_token=");

            if (pos >= 0) {
                textError = textError.slice(0, pos) + textError.slice(pos + 40);
            }

            console.error(textError);

            try {
                await email.sendMailOrder(textError,
                    "Ошибка при получении галереи работ",
                    process.env.EMAIL_ADMIN);
            } catch (err) {

                console.error("Не отправилось письмо администратору - " + err + " Ошибка при получении галереи работ "
                    + textError + " Шаг - " + executionStatus);

            }
        }

    }

    async saveFetchResultAsFile(resFetch, pathfile) {

        return new Promise((resolve, reject) => {

            const dest = fs.createWriteStream(pathfile);
            dest.on("error", (err) => reject(err));
            resFetch.body.on("end", () => resolve());

            resFetch.body.pipe(dest);

        });

    }

}

//console.log(path.normalize(process.env.SETTINGS_FILE));
// module.exports = new InstaInfo("d:/Prog/Web_Learn/Projects_Node_JS/h2_download/settings/settings.json");
module.exports = new InstaInfo(path.normalize(process.env.SETTINGS_FILE));