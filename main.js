var express = require("express");
var path = require("path");
var favicon = require("serve-favicon");
var bodyParser = require("body-parser");
const session = require("cookie-session");
var cookieParser = require("cookie-parser");
var csrf = require("csurf");
var morgan = require("morgan");

var LocalStrategy = require("passport-local").Strategy;
var logger = require("./config/winston.js");
var mongoose = require("mongoose");
var BASE_URL = require("./config/base_url.js").base_url;

var passport = require("passport");
var expressSanitizer = require("express-sanitizer");

var User = require("./app/models/user");
var path = require("path");

var app = express();

// Environment setup
var envi = process.env.NODE_ENV || "development";
var debugMode = envi === "development";
var useCSRF = envi === "production";

console.log("Environment: " + envi);
console.log("Use CSRF:   ", useCSRF);
console.log("Debug Mode: ", debugMode);

// Database connection
var DB_CONN_STRING = require("./config/db_config.js")[envi].mongo_conn_string;
mongoose.connect(DB_CONN_STRING, function (err) {
  if (err) {
    console.log("\x1b[31m" + err.message);
  } else {
    console.log("Connected to MongoDB");
  }
});

var cors = require("cors");
app.use(
  cors({
    origin: "http://localhost:5000",
    credentials: true,
  }),
);

// view engine setup
app.set("views", path.join(__dirname, "app/views"));
app.set("view engine", "pug");

app.locals.pretty = true;

// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, "public", "images/favicon.png")));
app.use(morgan("short", { stream: logger.stream }));
app.use(bodyParser.json({ limit: "50mb" })); // use bodyParser to parse form data
app.use(
  bodyParser.urlencoded({
    extended: true,
    limit: "50mb",
    parameterLimit: 50000,
  }),
);
app.use(cookieParser());
app.use(expressSanitizer());

app.enable("trust proxy");

app.use(session({ secret: "redcoatisaprettycoolannotationtool!" }));
app.use(express.static(path.join(__dirname, "public")));

// Setup Passport
app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    User.authenticate(),
  ),
);

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

if (useCSRF) app.use(csrf({ cookie: true }));

// Setup local variables that are used in almost every view.
app.use(function (req, res, next) {
  if (req.user) console.log("logged in as user:", req.user.username);

  res.locals.base_url = BASE_URL;

  res.locals.user = req.user;
  res.locals.path = req.path;
  res.locals.project_invitations = null;

  if (useCSRF) {
    var csrfToken = req.csrfToken();
    res.locals.csrfToken = req.csrfToken();

    res.cookie("csrf-token", csrfToken);
    console.log("CSRF:", csrfToken);
  }

  // If using the development server, log in as 'test'.
  // This is seemingly the only way to make sure the tagging interface app works by itself (i.e. localhost:4000).
  // Can comment this out if you aren't developing the react app via localhost:4000.
  if (app.get("env") === "development" && debugMode) {
    User.findOne({ username: "test" }, function (err, user) {
      //return next(null, req, res);
      req.login(user, function (err) {
        //const token = jwt.sign(user, 'your_jwt_secret');
        //console.log(token);
        return next(null, req, res);
      });
    });
    return;
  }
  next(null, req, res);

});

var homepageController = require("app/controllers/homepage_controller");

// Setup routes
var routes = {
  homepage: ["/", require("./routes/homepage")],
  user: ["/api/users/", require("./routes/user")],
  project: ["/api/projects/", require("./routes/project")],
};

for (var i in routes) {
  app.use(routes[i][0], routes[i][1]);
}

//development error handler
//will print stacktrace
if (app.get("env") === "development") {
  app.use(function (err, req, res, next) {
    console.log(err, "<<");
    res.status(err.status || 500);
    res.render("error", {
      message: err.message,
      error: err,
    });
  });
}

module.exports = app;
