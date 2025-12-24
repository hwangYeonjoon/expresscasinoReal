var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var auth = require('./services/auth');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var baccaratRouter = require('./routes/baccarat');
var baccaratApiRouter = require('./routes/baccarat-api');
var cardImagesRouter = require('./routes/card-images');
var authRouter = require('./routes/auth');
var accountRouter = require('./routes/account');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(function(req, res, next) {
  res.locals.currentUser = auth.getUserFromRequest(req);
  next();
});

app.use('/', indexRouter);
app.use('/baccarat', baccaratRouter);
app.use('/api/baccarat', baccaratApiRouter);
app.use('/cards', cardImagesRouter);
app.use('/auth', authRouter);
app.use('/account', accountRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
