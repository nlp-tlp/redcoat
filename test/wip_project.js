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


      it("should fail validation if documents contains a token that is empty", function(done) {
        wip2 = new WipProject( { all_documents: [ [ "hello", "there" ], ["I", "am", "a", "", "token"] ] })
        wip2.validate(function(err) {
          expect(err.errors.all_documents).to.exist;
          done();
        })
      });

      it("should fail validation if documents contains a token that is too long", function(done) {
        wip2 = new WipProject( { all_documents: [ [ "hello", "there" ], ["I", "am", "a", "loooooooooooooooooooooooooooooooooooooong", "token"] ] })
        wip2.validate(function(err) {
          expect(err.errors.all_documents).to.exist;
          done();
        })
      });
    });
  });
});





