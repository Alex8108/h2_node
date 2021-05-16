require("dotenv").config();
const express = require('express');
const path = require('path');
const logger = require('morgan');
const instaInfo = require("./instagram/instainfo.js");

const indexRouter = require('./routes/index');
// var usersRouter = require('./routes/users');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.disable("x-powered-by");

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
//app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {

  let err = new Error("Страница не найдена.");
  err.status = 404;
  next(err);

});

// error handler
app.use(function (err, req, res, next) {

  // // set locals, only providing error in development
  // res.locals.message = err.message;
  // res.locals.error = req.app.get('env') === 'development' ? err : {};

  // // render the error page
  // res.status(err.status || 500);
  // res.render('error');

  // set locals, only providing error in development
  // res.locals.infopage_header_text = "" + err.status === "" ? "" : err.status + ". " + err.message;
  // res.locals.infopage_text = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('infopage', {
    infopage_header_text: "" + err.status === "" ? "" : err.status + ". " + err.message,
    infopage_text: "",
    error: req.app.get('env') === 'development' ? err : {}
  });

});

//instaInfo.getInstaInfo().then(() => {
//console.log(instaInfo.data);
//});

instaInfo.getInstaInfo().then(() => { });
setInterval(() => { instaInfo.getInstaInfo() }, process.env.INSTA_REFRESH_INTERVAL_MS || 600000);

module.exports = app;
