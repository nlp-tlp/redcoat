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

// var fs = require('fs');
// var ejs = require('ejs');





module.exports.index = function(req, res) {

	/*console.log('sending')
	fs.readFile(path.join(appRoot+'/../tagging_interface/build/index.html'), 'utf-8', (err, html) => {

	 	res.send(ejs.render(html, {'username': 'pingu'}))
	});*/
	console.log('sending index page')
	res.cookie('username', req.user.username);
	res.sendFile(path.join(appRoot+'/../tagging_interface/build/index.html'));

}

module.exports.features = function(req, res) {
  res.render('features', {title: "Current and Upcoming Features", whitebg: true} )
}