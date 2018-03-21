var express = require('express');
var router = express.Router();
var path = require('path');
var extend = require('util')._extend



//const fileType = require('file-type');
var formidable = require('formidable');

var User = require('../models/user');

var fs = require('fs')
var util = require('util')

var bodyParser = require('body-parser')

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


var csrf = require('csurf')

// setup route middlewares
var csrfProtection = csrf({ cookie: true })
var parseForm = bodyParser.urlencoded({ extended: false })



function buildRoute(path, action, variables) {
	router.get(path, csrfProtection, function(req, res, next) {
		res.render(action, extend(variables, {csrfToken: req.csrfToken(), path: req.path}));	// Add the path to the response so it's easy to program the sidenav
	});
}

buildRoute('/',				'homepage', 	{ title: 'Welcome', homepage: true });
buildRoute('/setup-project',				'setup-project', 	{ title: 'Set up project' });
buildRoute('/test-page',					'test-page', 	{ title: 'Test page' });


router.post('/upload-tokenized', parseForm, csrfProtection, function (req, res) {

  // Ensure user does not already have a WipProject.

  // if (user has documents saved in wip project already)
  //res.send({"success": false, "error": "You cannot upload a new dataset as you have already uploaded one."})
  //return;



  var responded = false;

  var form = new formidable.IncomingForm({"maxFileSize": 1 * 1024 * 1024}); // 1mb

  /*form.parse(req, function(err, fields, files) {
    res.writeHead(200, {'content-type': 'text/plain'});
    res.write('received upload:\n\n');
    res.end(util.inspect({fields: fields, files: files}));
  });*/

  var tokenizer = new natural.WordPunctTokenizer();

  // parse the incoming request containing the form data
  form.parse(req);

  // store all uploads in the /uploads directory - cannot use it
  form.uploadDir = path.join(__dirname, '../db/tmp');

  form.on('fileBegin', function(field, file) {

     // c += 1
     //// console.log(c + " file found")

     // if(c > 1) {

        //console.log("Error: user attempted to upload 2 files")
        //failAndRespond("Cannot upload more than 1 file.");
      //}

      responded = false;
      var fileType = file.type;
      console.log(fileType)
      if (fileType != 'text/plain') {
        this.emit('error', new Error("File must be a plain text file."));
      }
  });



  // every time a file has been uploaded successfully,
  // read it and tokenize it
  form.on('file', function(field, file) {



      // Tokenize the thing with the WipProject.

      var sents = fs.readFileSync(file.path, 'utf-8').split('\n');

      /*

      for(var i = 0; i < sents.length; i++) {
       var t = tokenizer.tokenize(sents[i]);          
       //console.log(t)
      }
      */

      // Attempt to create a new wip_project?
      


      // Delete the file after reading is complete.
      fs.unlink(file.path, (err) => {
        if (err) throw err;
      });

      var t = this;
      //setTimeout(function() {

      t.emit('end_uploading'); // Only send out signal once the WipProject has been updated.

      //}, 2000)




      /*fs.rename(file.path, path.join(form.uploadDir, file.name), function() {

        var sents = fs.readFileSync(path.join(form.uploadDir, file.name), 'utf-8').split('\n');

        for(var i = 0; i < sents.length; i++) {
 			   var t = tokenizer.tokenize(sents[i]);        	
         console.log(t)
        }
      });*/

      //var contents = fs.readFileSync(path.join(form.uploadDir, file.name), 'utf-8');
      //console.log(contents)

      //console.log(tokenizer.tokenize(contents));
  });

  // log any errors that occur
  form.on('error', function(err) {

      console.log(err);
      if(!responded) {

        // If err.message is the one about filesize being too large, change it to a nicer message.
        if(err.message.substr(0, 20) == 'maxFileSize exceeded') {
          err.message = "The file was too large. Please ensure it is less than 1mb.";
        }


        res.send({ "success": false, "error": err.message });
        res.end();
        responded = true;
        
        
      }   
      


      //console.log(">>>>>>")
      //console.log(responded)

      //next(new Error("The file was too large. Please ensure it is less than 1mb."));
  });

  // once all the files have been uploaded, send a response to the client
  form.on('end_uploading', function() {
    if(!responded){
      res.send({'success': true});
    }
  });

    //console.log('done')

    

})

module.exports = router