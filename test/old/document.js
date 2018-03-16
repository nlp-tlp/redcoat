var expect = require('chai').expect;
 
var Document = require('../models/document');
var DocumentGroup = require('../models/document_group');
var mongoose = require('mongoose');


describe('Documents', function() {




    var doc_group = new DocumentGroup({
      documents: []
    });
    it('should fail if it does not belong to a document group', function(done) { 
      var doc = new Document({
        tokens: ["hello", "there"],
      });
      doc.validate(function(err) {
          expect(err.errors.document_group_id).to.exist; done();
      });
    });
    it('should fail if it does not have least one token', function(done) { 
      var doc = new Document({
        //document_group_id: doc_group._id,
        tokens: [],
      });
      doc.validate(function(err) {
          expect(err.errors.tokens).to.exist; done();
      });
    });
    it('should fail if the number of tokens is greater than 1000', function(done) { 
      var doc = new Document({
        //document_group_id: doc_group._id,
        tokens: new Array(2000).fill("word"),
      });
      doc.validate(function(err) {
          expect(err.errors.tokens).to.exist; done();
      });
    }); 

    it('should pass if tokens contain a non-string, by casting them to strings', function(done) { 
      var doc = new Document({
        //document_group_id: doc_group._id,
        tokens: ["hello", 4.2, 9],
      });
      doc.validate(function(err) {
          expect(err.errors.tokens).to.not.exist; done();
      });
    });
  
    it('should fail if it belongs to a document group that doesn\'t exist', function(done) { 
      var doc = new Document({
        document_group_id: mongoose.Types.ObjectId(),
        tokens: new Array(10).fill("word"),
      });
      doc.save(function(err) { 
        expect(err).to.exist; done();
      });     
    });

    beforeEach(function(done) {
      mongoose.connect('mongodb://localhost/redcoat-db-test', function(err) {
        if(err) console.log(err);
        done();
      });
    });
    afterEach(function() {
      if(mongoose.connection.db) mongoose.connection.db.dropDatabase( function(err) { });
      mongoose.connection.close();
    });

});
