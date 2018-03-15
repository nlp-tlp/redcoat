var expect = require('chai').expect;
 
var mongoose = require('mongoose');

var Document = require('../models/document');
var DocumentAnnotation = require('../models/document_annotation');
var DocumentGroup = require('../models/document_group');
var Project = require('../models/project');



describe('Document Annotations', function() {

    var doc_group = new DocumentGroup({
      documents: []
    });
    var doc = new Document({
      document_group_id: doc_group.id,
      tokens: ["hello", "there"],
    });

    it('should fail if it does not belong to a document', function(done) { 
      var doc_ann = new DocumentAnnotation({
        labels: ["O", "O"]
      });
      doc_ann.validate(function(err) {
          expect(err.errors.document_id).to.exist; done();
      });
    });
    it('should fail if it does not have least one label', function(done) { 
      var doc_ann = new DocumentAnnotation({
        labels: []
      });
      doc_ann.validate(function(err) {
          expect(err.errors.labels).to.exist; done();
      });
    });
    it('should fail if the number of labels is greater than 1000', function(done) { 
      var doc_ann = new DocumentAnnotation({
        //document_group_id: doc_group._id,
        labels: new Array(2000).fill("O")
      });
      doc_ann.validate(function(err) {
          expect(err.errors.labels).to.exist; done();
      });
    }); 

    it('should pass if labels contain a non-string, by casting them to strings', function(done) { 
      var doc_ann = new DocumentAnnotation({
        //document_group_id: doc_group._id,
        labels: ["O", 4.2, 9]
      });
      doc_ann.validate(function(err) {
          expect(err.errors.labels).to.not.exist; done();
      });
    });

    it('should fail if number of labels are different to the corresponding document\'s number of tokens', function(done) {  
      var d1 = new Document({ tokens: ["hello", "there", "!"] })
      var g1  = new DocumentGroup({ documents: [d1] })
      var p1 = new Project({ document_groups: [g1] });
      d1.document_group_id = g1._id
      g1.project_id = p1._id

      p1.save(function(err) {          
        g1.save(function(err) {
          d1.save(function(err) { 
            var doc_ann = new DocumentAnnotation({
              document_id: d1._id,
              labels: ["O", "O"]
            });
            doc_ann.save(function(err) {                
              expect(err).to.exist; done();
            });
          })            
        })
      })
      
    });
    
    it('should pass if number of labels are the same as the corresponding document\'s number of tokens', function(done) {  

      var d1 = new Document({ tokens: ["hello", "there", "!"] })
      var g1  = new DocumentGroup({ documents: [d1] })
      var p1 = new Project({ document_groups: [g1] })
      d1.document_group_id = g1._id
      g1.project_id = p1._id
      p1.save(function(err) {          
        g1.save(function(err) {
          d1.save(function(err) { 
            var doc_ann = new DocumentAnnotation({
              document_id: d1._id,
              labels: ["O", "O", "O"]
            });
            doc_ann.save(function(err) {
                expect(err).to.not.exist; done();
            });
          })            
        })
      })    
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

    // Check num tokens = labels
  
});
