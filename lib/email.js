const nodemailer = require("nodemailer");

module.exports.sendMailOrder = async function (textLetter, topicLetter, emailAddress) {

	if (! emailAddress) return;

	let transporter = nodemailer.createTransport({
		host: "smtp.yandex.ru",
		port: 465,
		secure: true,
		auth: {
			user: "h2engineh2",
			pass: "vodorodh2",
		},
	});

	let info = await transporter.sendMail({
		from: "h2engineh2@yandex.ru", // sender address
		to: emailAddress, //"alex-prog-81@yandex.ru", // list of receivers
		subject: topicLetter, //"New заказ на водородную очистку h2engine52.ru", // Subject line
		text: textLetter
	});

	// info = await transporter.sendMail({
	// 	from: "h2engineh2@yandex.ru", // sender address
	// 	//to: "bmennov@mail.ru", // list of receivers
	// 	to: "h2engineh2@yandex.ru", // h2engine-nn@yandex.ru
	// 	subject: "New заказ на водородную очистку h2engine.ru", // Subject line
	// 	text: textLetter
	// });

};