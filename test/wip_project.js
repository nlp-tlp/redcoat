var cf = require('./common/common_functions');
var expect = require('chai').expect;
var Project = require('../models/project');
var WipProject = require('../models/wip_project');
var User = require('../models/user');
var DocumentGroup = require('../models/document_group');
var DocumentGroupAnnotation = require('../models/document_group_annotation');
var rid = require('mongoose').Types.ObjectId;
var st = require('./common/shared_tests');



describe('WIP Projects', function() {

  before(function(done) {
    cf.connectToMongoose(done);
  });
  after(function(done) {
    cf.disconnectFromMongoose(done);
  });

  

  st.runProjectNameTests(WipProject);
  st.runProjectDescriptionTests(WipProject);
  st.runProjectUserIdTests(WipProject);

  describe("user_id (2)", function() {

    var user1, user2;

    before(function(done) {
      user1 = cf.createValidUser();
      user2 = cf.createValidUser();
      cf.registerUsers([user1, user2], function(err) { }, done);
    })
    afterEach(function(done)  { cf.dropMongooseDb({ except: "users" }, done); });

    it('should fail to save if another wip_project has the same user_id', function(done) { 
      var proj1 = cf.createValidProjectOrWIPP(WipProject, 1, user1._id);
      var proj2 = cf.createValidProjectOrWIPP(WipProject, 1, user1._id);
      proj1.save(function(err, proj1) { 
        expect(err).to.not.exist;
        proj2.save(function(err, proj2) { 
          expect(err).to.exist;
          done();
        });
      });
    });

    it('should fail to save if user_id is not the same as it was when the wip_project was created', function(done){ 

      var proj = cf.createValidProjectOrWIPP(WipProject, 1, user1._id);

      proj.save(function(err, proj) { 
        expect(err).to.not.exist;
        proj.user_id = user2._id;
        proj.save(function(err, proj) {
          expect(err).to.exist;
          done();
        });
      });
    });
  });


  st.runProjectUserIdsTests(WipProject);
  st.runProjectValidLabelsTests(WipProject);
  st.runDocumentTests(WipProject);

  

  describe("Static methods", function() {

    afterEach(function(done) {
      cf.dropMongooseDb(done);
    });

    describe("findWipByUserId", function() {
      it("should correctly return the wip_project belonging to a certain user", function(done) {
        var user = cf.createValidUser();
        var wip = new WipProject();
        wip.user_id = user._id;
         cf.registerUsers([user], function(err) { expect(err).to.not.exist; }, function() {
          wip.save(function(err) {
            WipProject.findWipByUserId(user._id, function(err, wip_project) {
              expect(err).to.not.exist;
              expect(wip_project._id).to.eql(wip._id);
              done();
            });
          });
        });
      });
    });
  });


  describe("Instance methods", function() {

    var wip;
    var sents = "hello there my name is michael.\nwhat's going on?";
    var correctly_tokenized_sents = [
        ["hello", "there", "my", "name", "is", "michael", "."],
        ["what", '\'s', "going", "on", "?"]
      ];   

    beforeEach(function(done) {
      wip = new WipProject(); done();
    })





    describe("tokenizeString", function() {
      it("should correctly tokenize a given string", function(done) {
        wip.tokenizeString(sents, function(err, tokenized_sents) {
          expect(err).to.not.exist;
          expect(tokenized_sents).to.eql(correctly_tokenized_sents);
          done();
        });
      });
      it("should correctly tokenize a given string when it has extra newline characters or whitespace characters", function(done) {
        var sents1 = "hello there my name is michael.\n\n\nwhat's going on?";
        var sents2 = "hello there my name      is michael.\n        \n                    \nwhat's        \t\t     going on?";
        wip.tokenizeString(sents1, function(err, tokenized_sents) {
          expect(err).to.not.exist;
          expect(tokenized_sents).to.eql(correctly_tokenized_sents);
          wip.tokenizeString(sents2, function(err, tokenized_sents) {
            expect(err).to.not.exist;
            expect(tokenized_sents).to.eql(correctly_tokenized_sents);
            done();
          });          
        });
      });
    });

    describe("createDocumentsFromString", function() {

      it("should correctly create an array of documents from a string, assign them to the documents field, and validate them", function(done) {        
        var sents = "hello there my name is michael.\n\nwhat's going on?";
        wip.createDocumentsFromString(sents, function(err) {
          expect(wip.documents).to.eql(correctly_tokenized_sents);
          expect(err).to.not.exist;
          done();
        });
      });

      it("should return an error when given a string containing a document with a token that is too long", function(done) {
        var sents = cf.createStringOfLength(150) + " there\nhow are you?\n";
        wip.createDocumentsFromString(sents, function(err) {
          expect(err.errors.documents).to.exist;
          done();
        });
      });
      it("should return an error when given a string containing too many documents", function(done) {
        var sents = "";
        for(var i = 0; i < 10050; i++) {
          sents += "hello there\n";
        }
        wip.createDocumentsFromString(sents, function(err) {
          expect(err.errors.documents).to.exist;
          done();
        });
      });
    });
  });
});





