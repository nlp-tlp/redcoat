var cf = require('./common/common_functions');
var expect = require('chai').expect;
var Project = require('../models/project');
var User = require('../models/user');
var DocumentGroup = require('../models/document_group');
var DocumentGroupAnnotation = require('../models/document_group_annotation');
var rid = require('mongoose').Types.ObjectId;


describe('Users', function() {


  before(function(done) {
    cf.connectToMongoose(done);
  });
  after(function(done) {
    cf.disconnectFromMongoose(done);
  });

  describe("username", function() {
    it('should fail validation if it does not have a username', function(done) { 
      var user = new User();
      user.validate(function(err) { expect(err.errors.username).to.exist; done(); });
    });
    it('should fail validation if the username is too short', function(done) { 
      var user = new User({ username: "" });
      user.validate(function(err) { expect(err.errors.username).to.exist; done(); });
    });
    it('should fail validation if the username is too long', function(done) { 
      var user = new User({ username: cf.createStringOfLength(51) }); // 51 chars
      user.validate(function(err) { expect(err.errors.username).to.exist; done(); });
    });
    it('should fail validation if the username is blank', function(done) { 
      var user = new User({ username: "      " });
      user.validate(function(err) { expect(err.errors.username).to.exist; done(); });
    });
    it('should pass validation (for username) if the username is OK', function(done) { 
      var user = new User({ username: "Cool userect." });
      user.validate(function(err) { expect(err.errors.username).to.not.exist; done(); });
    });
  });




  
});





