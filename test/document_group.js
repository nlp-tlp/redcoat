var expect = require('chai').expect;
 
var DocumentGroup = require('../models/document_group');
var Document = require('../models/document');
var Project = require('../models/project');
var mongoose = require('mongoose');

var createValidDoc = function() {
  return new Document({
    tokens: ["Hello", "there"],
    ann_tokens: ["O", "O"]
  })
}


describe('Document groups', function() {

  var ap = new Project({});


    it('should fail if it does not belong to a project', function(done) { 
      var doc = createValidDoc();
      var doc_group = new DocumentGroup({
        documents: [doc]
      });
      doc_group.validate(function(err) { expect(err.errors.project_id).to.exist; done();
      });
    });

    it('should fail if it does not have least one annotation document', function(done) { 
      var doc_group = new DocumentGroup({
        documents: []
      });
      doc_group.validate(function(err) { expect(err.errors.documents).to.exist; done();
      });
    });
    it('should fail if it has more than ten annotation documents', function(done) {
      docs = new Array(11);
      for(var i = 0; i < 11; i++) {
        var doc = createValidDoc();
        docs.push[doc]
      }
      var doc_group = new DocumentGroup({ 
        documents: docs 
      });       
      doc_group.validate(function(err) { expect(err.errors.documents).to.exist; done(); });
    });
    it('should fail if it contains the same document twice', function(done) {
      var doc = createValidDoc()
      var doc_group = new DocumentGroup({ 
        documents: [doc, doc] 
      });   
      doc_group.validate(function(err) { expect(err.errors.documents).to.exist; done(); });
    });

    it('should pass if it contains two unique documents', function(done) {
      var doc1 = createValidDoc()
      var doc2 = createValidDoc()
      var doc_group = new DocumentGroup({ 
        project_id: ap._id,
        documents: [doc1, doc2] 
      });   
      doc_group.validate(function(err) { expect(err).to.not.exist; done(); });
    });

    it('should fail if it belongs to a project that doesn\'t exist', function(done) { 
      var doc = createValidDoc();
      var doc_group = new DocumentGroup({
        project_id: mongoose.Types.ObjectId(),
        documents: [doc]
      });
      doc_group.save(function(err) { 
        //console.log(err)
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