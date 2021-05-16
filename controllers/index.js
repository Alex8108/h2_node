const email = require("../lib/email");
const schemaValidator = require('jsonschema').Validator;
const { mailOrderParametersSchema } = require("../schemes/schemes");
const getIsOverLimitInfo = require("../lib/requestLimiter").getIsOverLimitInfo;
const clientRedis = require("../db_connections").clientRedis;
const instaInfo = require("../instagram/instainfo.js");

/* GET 'home' page */
module.exports.homepage_get = function (req, res) {

    let worksData = [{ "caption": "", "automodel": "", "permalink": "" }, { "caption": "", "automodel": "", "permalink": "" }, { "caption": "", "automodel": "", "permalink": "" }];
    let amountPublications = instaInfo.data.length;

    for (let i = 0; i < amountPublications; i++) {

        worksData[i].caption = instaInfo.data[i].caption;
        worksData[i].automodel = instaInfo.data[i].automodel;
        worksData[i].permalink = instaInfo.data[i].permalink;

    }

    res.render('index', { "activeSubDir": instaInfo.activeSubDir, "worksData": worksData });
};

module.exports.about_get = function (req, res) {
    res.render('about');
    console.log(req.headers);
    console.log(req.connection);
};

module.exports.contacts_get = function (req, res) {
    res.render('contacts');
};

module.exports.engineclean_get = function (req, res) {
    res.render('engineclean');
};

module.exports.katalizatorclean_get = function (req, res) {
    res.render('katalizatorclean');
};

module.exports.sendorder_post = async function (req, res) {

    let mailParameters = req.body;
    let textLetter, overLimitInfo;
    let topicLetter = "New заказ на водородную очистку h2engine52.ru";

    try {

        overLimitInfo = await getIsOverLimitInfo(req.headers['x-forwarded-for'] || req.connection.remoteAddress,
            "sendorder_post",
            2,
            900,
            clientRedis);

    } catch (err) {

        res.status(500);
        res.render('infopage', {
            infopage_header_text: "",
            infopage_text: "500. Ошибка при отправке заявки (определение предела отправленных сообщений с одного адреса).",
            error: req.app.get('env') === 'development' ? err : {}
        });

        return;

    }

    if (overLimitInfo.isOverLimit) {

        res.status(429);
        res.render('infopage', {
            infopage_header_text: "",
            infopage_text: `429. Очень много запросов - попробуйте повторить позже (через ${overLimitInfo.keyTTL} секунд).`,
            error: {}
        });

        return;
    }

    try {

        let validator = new schemaValidator();
        let resultValidation = validator.validate(mailParameters, mailOrderParametersSchema);
        if (resultValidation.errors.length > 0) {

            err = new Error();
            err.stack = resultValidation.errors.toString();

            res.status(422);
            res.render('infopage', {
                infopage_header_text: "",
                infopage_text: "422. Ошибка параметров заявки.",
                error: req.app.get('env') === 'development' ? err : {}
            });

            return;

        }

    } catch (err) {

        res.status(422);
        res.render('infopage', {
            infopage_header_text: "",
            infopage_text: "422. Ошибка параметров заявки.",
            error: req.app.get('env') === 'development' ? err : {}
        });

        return;

    }

    textLetter = mailParameters.name + "\n" + mailParameters.telephone + "\n" + mailParameters.comment;

    try {

        await email.sendMailOrder(textLetter, topicLetter, process.env.EMAIL_ADMIN);

    } catch (error) {

        console.error("Ошибка отправки письма с заказом администратору " + error);

    }

    try {

        await email.sendMailOrder(textLetter, topicLetter, process.env.EMAIL_ORDER_RECEIVER);

        res.status(200);
        res.render('infopage', {
            infopage_header_text: "",
            infopage_text: "Ваша заявка принята. Скоро мы с Вами свяжемся.",
            error: {}
        });

    } catch (err) {

        res.status(500);
        res.render('infopage', {
            infopage_header_text: "",
            infopage_text: "500. Ошибка при отправке заявки.",
            error: req.app.get('env') === 'development' ? err : {}
        });

    }

};