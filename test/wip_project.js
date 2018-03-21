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
  st.runProjectUserIdsTests(WipProject);
  st.runProjectValidLabelsTests(WipProject);
  st.runDocumentTests(WipProject);




  describe("Instance methods", function() {

    var wip;
    var sents = "hello there my name is michael.\nwhat's going on?";
    var correctly_tokenized_sents = [
        ["hello", "there", "my", "name", "is", "michael", "."],
        ["what", '\'s', "going", "on", "?"]
      ];   

    beforeEach(function(done) { 
      wip = new WipProject();     
      wip.save(function(err, wip) {
        done();
      });
    });
    afterEach(function(done) {
      cf.dropMongooseDb(done);
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
        var sents = "hello there, how are you?\n\n\nmy name is michael";
        wip.createDocumentsFromString(sents, function(err) {
          expect(err).to.not.exist;
          done();
        });
      });

      it("should return an error when given a string containing an invalid document, such as a document with a token that is too long", function(done) {
        var sents = cf.createStringOfLength(150) + " there\nhow are you?\n";
        wip.createDocumentsFromString(sents, function(err) {
          expect(err.errors.documents).to.exist;
          done();
        });
      });

    });
  });
});





