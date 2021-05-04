var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var bodyParser = require('body-parser');
const session = require('cookie-session');
var cookieParser = require('cookie-parser')
var csrf = require('csurf');
var morgan = require('morgan');



var LocalStrategy = require('passport-local').Strategy;
var logger = require("./config/winston.js");
var mongoose = require('mongoose')
var BASE_URL = require('./config/base_url.js').base_url;


var passport = require('passport');
// const JwtStrategy = require("passport-jwt").Strategy;
// const ExtractJwt = require("passport-jwt").ExtractJwt;





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




// var flash = require('express-flash')

  

var User = require('./app/models/user');


//var users = require('./routes/users');

var sassMiddleware = require('node-sass-middleware');
var path = require('path');

var app = express();

var cors = require('cors');
app.use(cors({
  origin: 'http://localhost:4000',
  credentials: true,
}));


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

// app.use(flash());

//app.use(session({keys: ['redcoatisaprettycoolannotationtool!']}));

app.enable('trust proxy');
/*app.use(session({
   secret: 'redcoatisaprettycoolannotationtool!',
   proxy: true,
   key: 'session.sid',
   cookie: {secure: true},
	rolling: true,

}));*/
//app.use(session({keys: ['kjhkjhkukg', 'kufk8fyukukfkuyf']}));



app.use(session({secret: 'redcoatisaprettycoolannotationtool!'}));
app.use(express.static(path.join(__dirname, 'public')));
//app.use(express.static(path.join(__dirname, 'public', 'redcoat')));


// Setup Passport
app.use(passport.initialize());
app.use(passport.session());

//passport.use(new LocalStrategy(User.authenticate()));
passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
}, User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// passport.use(new LocalStrategy({
//     usernameField: 'email',
//     passwordField: 'password'
//   },
//   function(email, password, done) {
//     User.findOne({ email: email }, function(err, user) {
//       if (err) { return done(err); }
//       if (!user) {
//         return done(null, false, { message: 'An account with that email does not exist' });
//       }
//       console.log(user, password, "<<")
//       if (!user.validPassword(password)) {
//         return done(null, false, { message: 'Incorrect password' });
//       }
//       return done(null, user);
//     });
//   }
// ));




// const opts = {};
// opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
// opts.secretOrKey = 'bababooey'; // todo: move this to an environment variable

// app.use(passport.initialize());
// passport.use(
//   new JwtStrategy(opts, (jwt_payload, done) => {
//     User.findById(jwt_payload.id)
//       .then(user => {
//         if (user) {
//           return done(null, user);
//         }
//         return done(null, false);
//       })
//       .catch(err => console.log(err));
//   })
// );





// app.use(function(req, res, next) {
//   res.header('Access-Control-Allow-Credentials', true)
//   next();
// })


var envi = process.env.NODE_ENV || 'development';

var debugMode = true; // Set to true when running the react server (e.g. port 4000).
var useCSRF = false; // Set to false when working on the React interface on localhost:4000, otherwise it won't work.
                     // When not running localhost:4000, this should be set to true.
                     

if(envi === 'production') {
	useCSRF = true;
	debugMode = false;
}


if(useCSRF) app.use(csrf({ cookie: true }));

// Setup local variables that are used in almost every view.
app.use(function(req, res, next) {

  

  if(req.user) console.log("logged in as user:", req.user.username);



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
  if (app.get('env') === 'development' && debugMode) {

    User.findOne({username: "test"}, function(err, user) {

      //return next(null, req, res);
      req.login(user, function(err) {

        //const token = jwt.sign(user, 'your_jwt_secret');
        //console.log(token);
        return next(null, req, res);
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

  // async function proceed(req, res, next) {
  //   var invitations = await req.user.getProjectInvitations();
  //   res.locals.project_invitations = invitations;
  //   //console.log("Invitations:", invitations)

  //   req.user.getRecentProjects(function(err, recent_projects) {

  //     res.locals.recent_projects = recent_projects;
  //       //console.log("Recent projects:", res.locals.recent_projects);


        
  //     next(null, req, res);
  //   });      
  // }

  //if(req.user) {
    next(null, req, res);    
  //} else {
  //  next(null, req, res);
  //}
  
})


// Route middleware to make sure a user is logged in.
// Users will be redirected if not.
// const NON_LOGIN_PATHS = new Set([
//   "/",
//   "/api/users/login",
//   "/api/users/register",
//   "/api/users/forgot_password",
//   "/api/users/reset_password",
//   "/api/users/userData",
// ]);

// app.use(function(req, res, next) {

//   logger.debug(req.path);
//   if (req.isAuthenticated()) {
//     logger.debug("Logged in as " + req.user.username);
//     res.locals.user_stars = req.user.docgroups_annotated.length;
//     return next();
//   }
//   if(NON_LOGIN_PATHS.has(req.path) || req.path.startsWith('/reset_password/')) {      
//     return next();
//   } 

//   console.log('not logged in', req.path);

  
//   // TODO: IF working with new React interface, return res.send({"error": "user must be logged in"}) and redirect in the front end
//   //res.send({})

//   //res.status(401) //redirect(BASE_URL + 'login');
//   return next()
// });






// Setup routes
var routes = { 
  homepage:         ['/',              require('./routes/homepage')],
  //setup_project:    ['/',          require('./routes/setup_project')],
  user:             ['/api/users/',    require('./routes/user')],
  project:          ['/api/projects/', require('./routes/project')]
}

for(var i in routes) {
  app.use(routes[i][0], routes[i][1]);
}


var homepageController = require("app/controllers/homepage_controller");

app.all('*', homepageController.index);






// catch 404 and forward to error handler
// app.use(function(req, res, next) {
//   var err = new Error('The requested URL (' + req.path + ') was not found.');
//   logger.error(err.message);
//   err.status = 404;
//   next(err);
// });


// error handlers

//development error handler
//will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    console.log(err, "<<")
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
// app.use(function(err, req, res, next) {
//   res.status(err.status || 500);
//   res.render('error', {
//     message: err.message,
//     error: {}
//   });
// });

// var patterns = '*.jade *.css *.less *.styl *.scss *.sass *.png *.jpeg *.jpg *.gif *.webp *.svg';
 
// var browserRefreshClient = require('browser-refresh-client')

// browserRefreshClient
//     .enableSpecialReload(patterns, { autoRefresh: false })
//     .onFileModified(function(path) {
//       browserRefreshClient.refreshStyles();
//     })

module.exports = app;
