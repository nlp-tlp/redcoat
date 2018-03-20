var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var bodyParser = require('body-parser');

var cookieParser = require('cookie-parser')
var csrf = require('csurf')

var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

var mongoose = require('mongoose')
mongoose.connect('mongodb://localhost/redcoat-db-dev', function(err) {
  if(err) { console.log("\x1b[31m" + err.message); }
});

//var users = require('./routes/users');






var sassMiddleware = require('node-sass-middleware');
var path = require('path');

var app = express();

app.use(cookieParser())

var routes = require('./routes/index');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.locals.pretty = true;

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
/*app.use(
   sassMiddleware({
       src: __dirname + '/scss', 
       dest: __dirname + '/public/stylesheets',
       prefix:  '/stylesheets',
       outputStyle: 'compressed',
       debug: true,       
   })
); */
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
//app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});


app.use(passport.initialize());
app.use(passport.session());
// passport config
var User = require('./models/user');
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());



// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});






var patterns = '*.jade *.css *.less *.styl *.scss *.sass *.png *.jpeg *.jpg *.gif *.webp *.svg';
 
var browserRefreshClient = require('browser-refresh-client')

browserRefreshClient
    .enableSpecialReload(patterns, { autoRefresh: false })
    .onFileModified(function(path) {
      browserRefreshClient.refreshStyles();
    })








module.exports = app;