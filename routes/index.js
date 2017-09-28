

	

var express = require('express');
var router = express.Router();
var path = require('path');
var extend = require('util')._extend
//const fileType = require('file-type');



function buildRoute(path, action, variables) {
	router.get(path, function(req, res, next) {
		res.render(action, extend(variables, {path: req.path}));	// Add the path to the response so it's easy to program the sidenav
	});
}

buildRoute('/',				'homepage', 	{ title: 'Welcome', homepage: true });
buildRoute('/setup-project',				'setup-project', 	{ title: 'Set up project' });


router.post('/upload-tokenized', function (req, res) {
  //console.log("posted to upload tokenized")
 // res.end()
  res.send({"success": true})
})

module.exports = router