var express = require('express');
var router = express.Router();
var path = require('path');
var extend = require('util')._extend
//const fileType = require('file-type');
var formidable = require('formidable');

var User = require('../models/user');
var User = require('../models/annotation_group');

var fs = require('fs')
var util = require('util')

// create a new user called michael
/*var michael = new User({
  name: 'Michael',
  username: 'michael',
  password: 'password' 
});

michael.save(function(err) {
  if (err) throw err;

  console.log('User saved successfully!');
});*/






function buildRoute(path, action, variables) {
	router.get(path, function(req, res, next) {
		res.render(action, extend(variables, {path: req.path}));	// Add the path to the response so it's easy to program the sidenav
	});
}

buildRoute('/',				'homepage', 	{ title: 'Welcome', homepage: true });
buildRoute('/setup-project',				'setup-project', 	{ title: 'Set up project' });
buildRoute('/test-page',					'test-page', 	{ title: 'Test page' });


router.post('/upload-tokenized', function (req, res) {

  var form = new formidable.IncomingForm();
    /*form.parse(req, function(err, fields, files) {
      res.writeHead(200, {'content-type': 'text/plain'});
      res.write('received upload:\n\n');
      res.end(util.inspect({fields: fields, files: files}));
    });*/


    // store all uploads in the /uploads directory - cannot use it
    form.uploadDir = path.join(__dirname, '../db/tmp');

    // every time a file has been uploaded successfully,
    // rename it to it's original name
    form.on('file', function(field, file) {
        fs.rename(file.path, path.join(form.uploadDir, file.name));
        var contents = fs.readFileSync(path.join(form.uploadDir, file.name), 'utf-8');
        console.log(contents)
    });

    // log any errors that occur
    form.on('error', function(err) {
        console.log('An error has occurred: \n' + err);        
    });

    // once all the files have been uploaded, send a response to the client
    form.on('end', function() {
        res.send({'success': true});
    });
    // parse the incoming request containing the form data
    form.parse(req);

    //console.log('done')

    

})

module.exports = router