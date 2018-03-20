var cf = require('./common/common_functions');
var expect = require('chai').expect;
var Project = require('../models/project');
var User = require('../models/user');
var DocumentGroup = require('../models/document_group');
var DocumentGroupAnnotation = require('../models/document_group_annotation');
var rid = require('mongoose').Types.ObjectId;
var authenticate = User.authenticate();

describe('Users', function() {


  before(function(done) {
    cf.connectToMongoose(done);
  });
  after(function(done) {
    cf.disconnectFromMongoose(done);
  });


  describe("registration", function() {

    after(function(done)  { cf.dropMongooseDb(done); });

    it('should fail to save if it is not done via passport\'s register function', function(done) { 
      var user = cf.createValidUser();
      user.save(function(err, user) {
        expect(err).to.exist;
        expect(err.name).to.equal("ImproperRegistration");
        done();
      });
    });
  })

  describe("username", function() {
    after(function(done)  { cf.dropMongooseDb(done); });
    it('should fail registration if it does not have a username', function(done) { 
      User.register(new User( {username: "", email: "test@noot"}), "password-test", function(err, user) {
        expect(err).to.exist;
        expect(err.name).to.equal('MissingUsernameError');        
        authenticate("", "password-test", function(err, result) {
          expect(result).to.equal(false);
          User.count(function(err, count) {
            expect(count).to.equal(0);
            done();
          });
        });
      });
    });
    it('should fail registration if username is too long', function(done) { 
      User.register(new User( {username: cf.createStringOfLength(51), email: "test@noot"}), "password-test", function(err, user) {
        expect(err.errors.username).to.exist;
        User.count(function(err, count) {
          expect(count).to.equal(0);
          done();
        });
      });
    });
    it('should fail registration if username is blank', function(done) { 
      User.register(new User( {username: "             ", email: "test@noot"}), "password-test", function(err, user) {
        expect(err.errors.username).to.exist;
        User.count(function(err, count) {
          expect(count).to.equal(0);
          done();
        });
      });
    });
  });


  describe("password", function() {
    after(function(done)  { cf.dropMongooseDb(done); });

    it('should fail registration if it does not have a password', function(done) { 
      User.register(new User( {username: "pingu1", email: "test@noot"}), "", function(err, user) {
        expect(err).to.exist;
        expect(err.name).to.equal('MissingPasswordError');        
        authenticate("pingu", "", function(err, result) {
          expect(result).to.equal(false);
          User.count(function(err, count) {
            expect(count).to.equal(0);
            done();
          });
        });
      });
    });
    it('should fail registration if password is too long', function(done) { 
      var pw = cf.createStringOfLength(1500); // Max is 1000 characters
      User.register(new User( {username: "pingu2", email: "test@noot"}), pw, function(err, user) {
        expect(err).to.exist;
        expect(err.name).to.equal('PasswordTooLongError');      
        User.count(function(err, count) {
          expect(count).to.equal(0);
          done();
        });
      });
    });
    it('should fail registration if password is blank', function(done) { 
      User.register(new User( {username: "pingu3", email: "test@noot"}), "           ", function(err, user) {
        expect(err).to.exist;
        expect(err.name).to.equal('BlankPasswordError');      
        User.count(function(err, count) {
          expect(count).to.equal(0);
          done();
        });
      });
    });
  });


  describe("email", function() {
    after(function(done)  { cf.dropMongooseDb(done); });

    it('should fail validation if it is not an email', function(done) { 
      // Note: the email regex is purposely simple.
      var users = [
        new User({ username: "pingu", email: "pingu" }),
        new User({ username: "pingu", email: "pingu@ping" }),
        new User({ username: "pingu", email: "pingu.com/pingping" }),
        new User({ username: "pingu", email: "pingu@pingucomcom" }),
        new User({ username: "pingu", email: "pingu@.pingu" }),
      ]

      cf.validateMany(users, function(err) { expect(err.errors.email).to.exist }, done);
    });
    it('should fail validation if it does not have an email', function(done) { 
      User.register(new User( {username: "pingu"}), "password-test", function(err, user) {
        expect(err.errors.email).to.exist;
        done();
      });
    });
    it('should fail validation email is too long', function(done) { 
      User.register(new User( {username: "pingu", email: cf.createStringOfLength(260)}), "password-test", function(err, user) {
        expect(err.errors.email).to.exist;
        done();
      });
    });
    it('should fail validation email is blank', function(done) { 
      User.register(new User( {username: "pingu", email: "   "}), "password-test", function(err, user) {
        expect(err.errors.email).to.exist;
        done();
      });
    });
  });

  describe("admin", function() {
    it('should be created with admin set to false', function(done) {
      var user = cf.createValidUser();
      expect(user.admin).to.equal(false);
      done();
    });
  })

  describe("validity tests", function() {

    after(function(done)  { cf.dropMongooseDb(done); });

    it('should pass registration and authentication if all fields are valid', function(done) {
      User.register(new User( {username: "Pingu", email: "test@nootnot.com"}), "password-test", function(err, user) {
        expect(err).to.not.exist;
        authenticate("Pingu", "password-test", function(err, result) {
          expect(err).to.not.exist;
          expect(result._id).to.not.equal(false);
          User.count(function(err, count) {
            expect(count).to.equal(1);
            done();
          });
        });
      });
    });
  });  
});





