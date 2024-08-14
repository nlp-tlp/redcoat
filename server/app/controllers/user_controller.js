require("rootpath")();
var logger = require("config/winston");

var BASE_URL = require("config/base_url").base_url;
var User = require("../models/user");
var passport = require("passport");

var crypto = require("crypto");

const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/* GET Actions */

exports.userData = async function (req, res, next) {
  if (req.user) console.log("logged in as user:", req.user.username);
  if (req.user) var invitations = await req.user.getProjectInvitations();

  var response = {
    user: req.user
      ? {
          username: req.user ? req.user.username : null,
          profile_icon: req.user ? req.user.profile_icon : null,
          project_invitations: invitations,
        }
      : null,
  };

  //console.log(response.user.project_invitations);
  res.send(response);
};

// GET: Render the 'registration' page.
// exports.registerPage = function(req, res) {
//   res.render('users/register', { title: "Register", formData: {} });
// }

// // GET: Render the login page.
// exports.loginPage = function(req, res) {
//   if(req.user)
//     res.redirect(BASE_URL + 'projects');
//   res.render('users/login', {formData: {}, title: "Login"});
// }

// GET: Render the 'user profile' page.
// module.exports.user_profile = function(req, res) {
//   res.render('users/profile', {title: "Your Profile"} )
// }

// // GET: Render the 'forgot password' page.
// exports.forgot_password = function(req, res) {
//   return res.render('users/forgot_password', {
//     formData: {
//       password: req.body.email,
//     },
//     title: "Forgot password"
//   });
// }

// GET: Render the reset password page, called by clicking on the link sent via the reset password email.
/*exports.reset_password = function(req, res) {
  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
    if(!user) {
      return res.render('users/forgot_password', {
        message: "Password reset link is invalid or has expired.",
        formData: {}
      });
    }
    res.render('users/reset_password', {
      //user: req.user,
      token: req.params.token,
      formData: {}
    });
  });
}
*/

// GET: The logout action.
exports.logout = function (req, res) {
  req.logout();
  console.log("lgoged out");
  res.send({
    "logged out": true,
  });
};

/* POST Actions */

// POST: The register action.
exports.register = async function (req, res, next) {
  logger.info('Registering user "' + req.body.username + '".');

  var newUser = new User({
    username: req.body.username,
    email: req.body.email,
  });

  try {
    var user = await User.register(newUser, req.body.password);
  } catch (err) {
    var msg = err.message;

    if (msg.endsWith(".")) msg = msg.slice(0, msg.length - 1);
    return res.send({ error: msg });
  }

  passport.authenticate("local")(req, res, function () {
    res.send({ success: true });
  });
};

// POST: The login action.
exports.login = async function (req, res, next) {
  // var user = await User.findOne({username: req.body.username});
  // if(user === null) {
  //   return res.status(401).send({message: "Username does not exist"})
  // }
  //
  console.log("hit login");

  passport.authenticate("local", function (err, user, info) {
    if (err) {
      logger.err(err.stack);
      return res.send({ error: err.stack });
    }
    if (!user) {
      var msg = info.message;
      logger.error(msg);
      if (msg === "Password or username is incorrect")
        msg = "Username/email or password is incorrect";
      res.send({ error: msg });

      return;

      // return res.render('users/login', {
      //   formData: {
      //     username: req.body.username,
      //     password: req.body.password,
      //   },
      //   message: msg,
      // });
    }

    req.logIn(user, async function (err) {
      //console.log(user, "logged in!!!!!")
      var invitations = await user.getProjectInvitations();

      var response = {
        username: user.username,
        profile_icon: user.profile_icon,
        project_invitations: invitations,
      };

      return res.send(response);
      //return res.redirect(BASE_URL + 'projects');
    });
  })(req, res, next);
};

// POST: The forgot password submit action, called when the user clicks the 'submit' button on the forgot password page.
exports.forgot_password_submit = async function (req, res, next) {
  var user = await User.findOne({ email: req.body.email });

  if (user == null) {
    var msg = "No user with that email address exists";
    return res.send({ error: msg });
  }

  // Generate a random password reset token.
  var buf = await crypto.randomBytes(20);
  var token = buf.toString("hex");

  // Send the token to the user via email.
  var msg = {
    to: req.body.email,
    from: "Redcoat@nlp-tools.org",
    fromname: "Redcoat - Collaborative Annotation Tool",
    subject: "Password reset",
    text:
      "You are receiving this email because you (or someone else) has requested your Redcoat password to be reset.\n\n" +
      "To reset your password, please click on the following link, or paste it into your browser:\n\n" +
      "https://" +
      req.headers.host +
      BASE_URL +
      "reset_password/" +
      token +
      "\n\n" +
      "If you did not request your password to be reset, please ignore this email and your password will remain unchanged. The link above will expire after 1 hour.",
  };

  user.resetPasswordToken = token;
  user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

  //passport.authenticate('local')(req,res, function() {
  await user.save();

  try {
    var result = await sgMail.send(msg);
  } catch (err) {
    logger.error(err);
    return res.send({
      error:
        "Could not send reset email. Please send a message to Redcoat's system admin",
    });
  }

  return res.send({ success: true });
};

// POST: The reset password submit action.
// Resets the user's password to the password entered in the form.
// Requires a valid token that was generated via the forgot_password_submit function.
exports.reset_password_submit = async function (req, res, next) {
  var user = await User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: { $gt: Date.now() },
  });

  // If the user is not found, or the token is invalid, render the forgot password page.
  if (!user) {
    return res.send({ error: "Password reset link is invalid or has expired" });
  }

  // Let the user know that their password was changed.
  const msg = {
    to: user.email,
    from: "Redcoat@nlp-tools.org",
    fromname: "Redcoat - Collaborative Annotation Tool",
    subject: "Your password has been reset",
    text: "This is an email to confirm that your Redcoat password has been changed.",
  };

  // Try send out the email first.
  // If it can't send for some reason (Sendgrid down etc), don't reset the password
  try {
    await sgMail.send(msg);
  } catch (err) {
    return res.send({
      error:
        "An unexpected error occurred when attempting to reset password. Please send a message to the Redcoat's system admin.",
    });
  }

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;

  // Set the password of the user to the value entered in the form.
  await user.setPassword(req.body.password);
  await user.save();

  return res.send({ success: true });
};

// Set the users profile icon foreground, background and icon.
exports.setProfileIcon = function (req, res, next) {
  var body = req.body;
  req.user.profile_icon = {
    foreground: req.body.foreground,
    background: req.body.background,
    icon: req.body.icon,
  };
  req.user.save(function (err, user) {
    if (err) {
      console.log(err);
      return res.status(500).send(err);
    }
    console.log(err, "ok");
    res.send({ success: true, profile_icon: req.user.profile_icon });
  });
};
