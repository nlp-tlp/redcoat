var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var bodyParser = require('body-parser');
const session = require('cookie-session');
var cookieParser = require('cookie-parser')
var csrf = require('csurf');
var morgan = require('morgan');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var logger = require("./config/winston.js");
var mongoose = require('mongoose')
mongoose.connect('mongodb://localhost/redcoat-db-dev', function(err) {
  if(err) { console.log("\x1b[31m" + err.message); }
});
var expressSanitizer = require('express-sanitizer');


var User = require('./app/models/user');


//var users = require('./routes/users');

var sassMiddleware = require('node-sass-middleware');
var path = require('path');

var app = express();



// view engine setup
app.set('views', path.join(__dirname, 'app/views'));
app.set('view engine', 'pug');

app.locals.pretty = true;

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(morgan("short", { stream: logger.stream }));
app.use(bodyParser.json()); // use bodyParser to parse form data
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(expressSanitizer());
app.use(
   sassMiddleware({
       src: __dirname + '/app/stylesheets', 
       dest: __dirname + '/public/stylesheets',
       prefix:  '/stylesheets',
       outputStyle: 'compressed',
       debug: false,       
   })
);
app.use(session({keys: ['kjdhzzzkjhkukg', 'kufkg8feeeeyukukfkuyf']}));
app.use(express.static(path.join(__dirname, 'public')));

// Setup Passport
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(csrf({ cookie: true }));

// Setup local variables that are used in almost every view.
app.use(function(req, res, next) {
  res.locals.csrfToken = req.csrfToken();
  res.locals.user = req.user;
  res.locals.path = req.path;
  next(null, req, res);
})


// Route middleware to make sure a user is logged in.
// Users will be redirected if not.
const NON_LOGIN_PATHS = new Set([
  "/",
  "/login",
  "/register"
]);
app.use(function(req, res, next) {
    logger.debug(req.path);
    if (req.isAuthenticated()) {
      logger.debug("Logged in as " + req.user.username);
      res.locals.user_stars = req.user.docgroups_annotated.length;
      return next();
    }
    if(NON_LOGIN_PATHS.has(req.path)) {
      return next();
    } 
    res.redirect('/login');
});


// Setup routes
var routes = {
  homepage:         ['/',          require('./routes/homepage')],
  setup_project:    ['/',          require('./routes/setup_project')],
  user:             ['/',          require('./routes/user')],
  project:          ['/projects/', require('./routes/project')]
}

for(var i in routes) {
  app.use(routes[i][0], routes[i][1]);
}


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('The requested URL (' + req.path + ') was not found.');
  logger.error(err.message);
  err.status = 404;
  next(err);
});


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

// var patterns = '*.jade *.css *.less *.styl *.scss *.sass *.png *.jpeg *.jpg *.gif *.webp *.svg';
 
// var browserRefreshClient = require('browser-refresh-client')

// browserRefreshClient
//     .enableSpecialReload(patterns, { autoRefresh: false })
//     .onFileModified(function(path) {
//       browserRefreshClient.refreshStyles();
//     })

module.exports = app;