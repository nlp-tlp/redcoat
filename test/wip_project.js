var cf = require('./common/common_functions');
var expect = require('chai').expect;
var Project = require('../models/project');
var WipProject = require('../models/wip_project');
var User = require('../models/user');
var DocumentGroup = require('../models/document_group');
var DocumentGroupAnnotation = require('../models/document_group_annotation');
var rid = require('mongoose').Types.ObjectId;

describe('WIP Projects', function() {

  before(function(done) {
    cf.connectToMongoose(done);
  });
  after(function(done) {
    cf.disconnectFromMongoose(done);
  });


  describe("Instance methods", function() {

    var wip = new WipProject();
    before(function(done) {
      wip.save(function(err, wip) {
        done();
      });
    });




    describe("tokenizeString", function() {

      it("should correctly create documents from a given string", function(done) {

        sents = "hello there my name is michael.\nwhat's going on?";
        correctly_tokenized_sents = [
          ["hello", "there", "my", "name", "is", "michael", "."],
          ["what", '\'', 's', "going", "on", "?"]
        ];

        wip.tokenizeString(sents, function(err, tokenized_sents) {
          expect(err).to.not.exist;
          expect(tokenized_sents).to.eql(correctly_tokenized_sents);
          done();
        });
      });

    });


    describe("all_documents", function() {

      /* Document count */
      it('should fail validation if it does not have any documents', function(done) { 
        var wip = new WipProject();
        wip.validate(function(err) { expect(err.errors.all_documents).to.exist; done(); });
      });
      it('should fail validation if it has too many documents', function(done) { 
        var wip = new WipProject({ all_documents: cf.createValidDocuments(10050) } );
        wip.validate(function(err) { expect(err.errors.all_documents).to.exist; done(); });
      });

      /* Document length */
      it('should fail validation if it contains a document that is empty', function(done) { 
        var wip = new WipProject({ dall_ocuments: [ [], ["this", "one", "is", "ok"] ] } );
        wip.validate(function(err) { expect(err.errors.all_documents).to.exist; done(); });
      });    
      it('should fail validation if it contains a document that is too long', function(done) { 
        var wip = new WipProject({ all_documents: [ cf.createTooLongDocument() ] } );
        wip.validate(function(err) { expect(err.errors.all_documents).to.exist; done(); });
      });   

      /* Document token count */
      it("should fail validation if documents contains a token that is empty", function(done) {
        var wip = new WipProject( { all_documents: [ [ "hello", "there" ], ["I", "am", "a", "", "token"] ] })
        wip.validate(function(err) { expect(err.errors.all_documents).to.exist; done(); })
      });

      it("should fail validation if documents contains a token that is too long", function(done) {
        var wip = new WipProject( { all_documents: [ [ "hello", "there" ], ["I", "am", "a", cf.createStringOfLength(150), "token"] ] })
        wip.validate(function(err) { expect(err.errors.all_documents).to.exist; done(); })
      });

    });
  });
});





