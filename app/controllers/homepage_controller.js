var BASE_URL = require('config/base_url').base_url;
const path = require('path');
var appRoot = require('app-root-path');
// module.exports.index = function(req, res) {
//   console.log('hello')
//   if(req.user) {
//     return res.redirect(BASE_URL + 'projects');
//   }
//   console.log('rendering homepage')
//   res.render('homepage', {title: "Welcome"});
// }


module.exports.index = function(req, res) {
	res.sendFile(path.join(appRoot+'/../tagging_interface/build/index.html'));
}

module.exports.features = function(req, res) {
  res.render('features', {title: "Current and Upcoming Features", whitebg: true} )
}