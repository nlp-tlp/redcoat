var BASE_URL = require('config/base_url').base_url;

module.exports.index = function(req, res) {
  console.log('hello')
  if(req.user) {
    return res.redirect(BASE_URL + 'projects');
  }
  console.log('rendering homepage')
  res.render('homepage', {title: "Welcome"});
}

module.exports.features = function(req, res) {
  res.render('features', {title: "Current and Upcoming Features", whitebg: true} )
}