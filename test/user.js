require('rootpath')();

var cf = require('./common/common_functions');
var expect = require('chai').expect;
var Project = require('app/models/project');
var User = require('app/models/user');
var DocumentGroup = require('app/models/document_group');
var DocumentGroupAnnotation = require('app/models/document_group_annotation');
var rid = require('mongoose').Types.ObjectId;
var authenticate = User.authenticate();

describe('Users', function() {


  before(function(done) {
    cf.connectToMongoose(done);
  });
  after(function(done) {
    cf.dropMongooseDb(function() {
      cf.disconnectFromMongoose(done);
    });   
  });


  describe("registration", function() {

    before(function(done) { 
      var user = cf.createValidUser();
      user.username = "Pingu the Legend";
      User.register(user, "password-test", done);
    })
    after(function(done)  { cf.dropMongooseDb(done); });

    // Note: may need to remove this test as it might be useful to be able to call user.save() and allow them to register via a
    // link sent to them via email.
    it('should fail to save if it is not done via passport\'s register function', function(done) { 
      var user = cf.createValidUser();
      user.save(function(err, user) {
        expect(err).to.exist;
        expect(err.name).to.equal("ImproperRegistration");
        done();
      });
    });

    it('should pass authentication after registration', function(done) {       
      authenticate("Pingu the Legend", "password-test", function(err, result) {
        expect(err).to.not.exist;
        expect(result.username).to.equal("Pingu the Legend");
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
      User.register(new User( {username: cf.createStringOfLength(51), email: "test@noot.com"}), "password-test", function(err, user) {
        expect(err.errors.username).to.exist;
        User.count(function(err, count) {
          expect(count).to.equal(0);
          done();
        });
      });
    });
    it('should fail registration if username is blank', function(done) { 
      User.register(new User( {username: "             ", email: "test@noot.com"}), "password-test", function(err, user) {
        expect(err.errors.username).to.exist;
        User.count(function(err, count) {
          expect(count).to.equal(0);
          done();
        });
      });
    });

    it('should fail registration if username is already taken', function(done) { 
      var user1 = cf.createValidUser();
      var user2 = cf.createValidUser();
      user1.username = "Pingu";
      user2.username = "Pingu";
      User.register(user1, "password-test", function(err, user) {
        User.register(user2, "password-test", function(err, user) {
          expect(err).to.exist;
          expect(err.name).to.equal("UserExistsError");
          User.count(function(err, count) {
            expect(count).to.equal(1);
            done();
          });
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
      // Note: the email regex is purposefully simple.
      var users = [
        new User({ username: "pingu", email: "pingu" }),
        new User({ username: "pingu", email: "pingu@ping" }),
        new User({ username: "pingu", email: "pingu.com/pingping" }),
        new User({ username: "pingu", email: "pingu@pingucomcom" }),
        new User({ username: "pingu", email: "pingu@.pingu" }),
      ];
      cf.validateMany(users, function(err) { expect(err.errors.email).to.exist }, done);
    });
    it('should fail registration if if it does not have an email', function(done) { 
      User.register(new User( {username: "pingu"}), "password-test", function(err, user) {
        expect(err.errors.email).to.exist;
        done();
      });
    });
    it('should fail registration if email is too long', function(done) { 
      User.register(new User( {username: "pingu", email: cf.createStringOfLength(260)}), "password-test", function(err, user) {
        expect(err.errors.email).to.exist;
        done();
      });
    });
    it('should fail registration if email is blank', function(done) { 
      User.register(new User( {username: "pingu", email: "   "}), "password-test", function(err, user) {
        expect(err.errors.email).to.exist;
        done();
      });
    });
    it('should fail registration if email is already taken', function(done) { 
      var user1 = cf.createValidUser();
      var user2 = cf.createValidUser();
      user1.email = "Pingu@noot.com";
      user2.email = "Pingu@Noot.com";
      User.register(user1, "password-test", function(err, user) {
        User.register(user2, "password-test", function(err, user) {
          expect(err).to.exist;
          expect(err.name).to.equal("EmailExistsError");
          done();
        });
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


  describe("Cascade delete", function() {


    var user1, user2, projs, p1_id, p2_id, doc_groups, doc_group_annotations;



    beforeEach(function(done) {
      user1 = cf.createValidUser();
      user2 = cf.createValidUser();
      projs = [
                  cf.createValidProject(1,  user1._id),
                  cf.createValidProject(4,  user2._id),
                  cf.createValidProject(7,  user2._id),
                  cf.createValidProject(18, user2._id),
                  ];
      projs[0].user_ids.active.push(user1._id);
      projs[0].user_ids.active.push(user2._id);
      projs[1].user_ids.active.push(user1._id);
      projs[1].user_ids.active.push(user2._id);

      p1_id = projs[0]._id;
      p2_id = projs[1]._id;
      doc_groups = [
                  cf.createValidDocumentGroup(5, projs[0]._id),
                  cf.createValidDocumentGroup(5, projs[0]._id),
                  cf.createValidDocumentGroup(5, projs[1]._id),
                  ];
      doc_group_annotations = [
                  cf.createValidDocumentGroupAnnotation(5, user1._id, doc_groups[0]._id),
                  cf.createValidDocumentGroupAnnotation(5, user1._id, doc_groups[0]._id),
                  cf.createValidDocumentGroupAnnotation(5, user2._id, doc_groups[0]._id),
                  cf.createValidDocumentGroupAnnotation(5, user1._id, doc_groups[2]._id),
                  cf.createValidDocumentGroupAnnotation(5, user2._id, doc_groups[2]._id),
                  ];
      cf.registerUsers([user1, user2], function(err) { }, function() {
        cf.saveMany(projs.concat(doc_groups).concat(doc_group_annotations).reverse(), function(err) { }, done);
      });
    });

    afterEach(function(done)  { cf.dropMongooseDb(done); });    


    it('should delete user_id from associated projects\' user_ids.active when deleted', function(done) {
      User.findById(user2, function(err, user) {
        user.remove(function(err) { 
          Project.findById(p1_id, function(err, proj) {
            expect(proj.projectHasUser(user2._id)).to.equal(false);
            done();
          });
        });      
      });
    });

    it('should delete all associated document groups and document_group_annotations when deleted', function(done) {
      // Deleting user1 should remove project 0, docgroup 0 and 1, and doc_group_annotations 0, 1, 2, and 3.
     
      User.findById(user1, function(err, user) {
        user.remove(function(err) { 
          Project.count({}, function(err, count) {
            expect(count).to.equal(3);
            DocumentGroup.find({}, function(err, doc_groups) {
              expect(doc_groups.length).to.equal(1);
              DocumentGroupAnnotation.count({}, function(err, count) {
                expect(count).to.equal(1);
                Project.findById(p2_id, function(err, proj) {
                  expect(proj.projectHasUser(user1._id)).to.equal(false);
                  done();
                })
              });
            });
          });
        });      
      })
    });
  });


  describe("validity tests", function() {
    after(function(done)  { cf.dropMongooseDb(done); });
    it('should pass registration and authentication if all fields are valid', function(done) {
      User.register(new User( {username: "Pingu", email: "test@nootnot.com"} ), "password-test", function(err, user) {
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





