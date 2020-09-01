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
var BASE_URL = require('./config/base_url.js').base_url;
mongoose.connect('mongodb://localhost/redcoat-db-dev', function(err, db) {
  if(err) { console.log("\x1b[31m" + err.message); }
});
var expressSanitizer = require('express-sanitizer');


mongoose.connection.on('open', function() {
  var admin = mongoose.connection.db.admin();
  admin.serverStatus(function(err, info) {
    if (err) return cb(err);
    var version = info.version//.split('.').map(function(n) { return parseInt(n, 10); });
    logger.info("MongoDB version: " + version);
    checkVersion(version.split('.').map(function(n) { return parseInt(n, 10); }))

  });
});

function checkVersion(version) {
  if(version[0] < 3) { // || (version[0] >= 3 && version[1] < 6)) {
    logger.error("MongoDB version must be at least 3.6.");
    process.exit();
  }
}




var flash = require('express-flash')

  

var User = require('./app/models/user');


//var users = require('./routes/users');

var sassMiddleware = require('node-sass-middleware');
var path = require('path');

var app = express();

var cors = require('cors');
app.use(cors());


// view engine setup
app.set('views', path.join(__dirname, 'app/views'));
app.set('view engine', 'pug');

app.locals.pretty = true;

// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, 'public', 'images/favicon.png')));
app.use(morgan("short", { stream: logger.stream }));
app.use(bodyParser.json({limit: '50mb'})); // use bodyParser to parse form data
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb', parameterLimit: 50000 }));
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

app.use(flash());

//app.use(session({keys: ['redcoatisaprettycoolannotationtool!']}));

app.enable('trust proxy');
/*app.use(session({
   secret: 'redcoatisaprettycoolannotationtool!',
   proxy: true,
   key: 'session.sid',
   cookie: {secure: true},
	rolling: true,

}));*/
app.use(session({keys: ['kjhkjhkukg', 'kufk8fyukukfkuyf']}));




app.use(express.static(path.join(__dirname, 'public')));

// Setup Passport
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next) {


  console.log(req.headers);
  next(null, req, res);
})



var useCSRF = true; // Set to false when working on the React interface on localhost:4000, otherwise it won't work.
                     // When not running localhost:4000, this should be set to true.
if(app.get('env') === 'production') useCSRF = true;


if(useCSRF) app.use(csrf({ cookie: true }));

// Setup local variables that are used in almost every view.
app.use(function(req, res, next) {

  

  res.locals.base_url = BASE_URL;
  
  res.locals.user = req.user;
  res.locals.path = req.path;
  res.locals.project_invitations = null;

  if(useCSRF) {
    var csrfToken = req.csrfToken();
    res.locals.csrfToken = req.csrfToken();
    res.cookie('csrf-token', csrfToken);
    console.log("CSRF:", csrfToken);
  }
  //res.cookie('csrf-token', res.locals.csrfToken);
  //console.log(req.user, "==")

  


  // If using the development server, log in as 'test'.
  // This is seemingly the only way to make sure the tagging interface app works by itself (i.e. localhost:4000).
  // Can comment this out if you aren't developing the react app via localhost:4000.
  var debug = true;
  if (app.get('env') === 'development' && debug) {

    User.findOne({username: "test"}, function(err, user) {      
      req.login(user, function(err) {
        return proceed(req, res, next);
      });
    });
    return;
  }

  // if (app.get('env') === 'development' && req.user === undefined) {
  //   User.findOne({username: "test"}, function(err, user) {      
  //     //req.user = user;
  //     proceed(req, res, next);
  //     return;
  //   })
  // }

  function proceed(req, res, next) {
    req.user.getProjectInvitations(function(err, invitations) {
        res.locals.project_invitations = invitations;
        //console.log("Invitations:", invitations)

        req.user.getRecentProjects(function(err, recent_projects) {

          res.locals.recent_projects = recent_projects;
          //console.log("Recent projects:", res.locals.recent_projects);


          
          next(null, req, res);

        });
        
      });
  }

  if(req.user) {
    proceed(req, res, next);    
  } else {
    next(null, req, res);
  }
  
})


// Route middleware to make sure a user is logged in.
// Users will be redirected if not.
const NON_LOGIN_PATHS = new Set([
  "/",
  "/login",
  "/register",
  "/features",
  "/forgot_password",
  "/reset_password",
]);
app.use(function(req, res, next) {
    logger.debug(req.path);
    if (req.isAuthenticated()) {
      logger.debug("Logged in as " + req.user.username);
      res.locals.user_stars = req.user.docgroups_annotated.length;
      return next();
    }
    if(NON_LOGIN_PATHS.has(req.path) || req.path.startsWith('/reset_password/')) {      
      return next();
    } 

    console.log('not logged in', req.path)

    res.redirect(BASE_URL + 'login');
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
