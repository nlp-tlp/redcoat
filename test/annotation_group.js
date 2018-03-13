var expect = require('chai').expect;
 
var AnnotationGroup = require('../models/annotation_group');
var AnnotationDoc = require('../models/annotation_doc');

var createValidDoc = function() {
  return new AnnotationDoc({
    tokens: ["Hello", "there"],
    ann_tokens: ["O", "O"]
  })
}

describe('Annotation groups', function() {
  describe('Fail conditions', function() {

    it('should fail if it does not have least one annotation document', function(done) { 
      var ag = new AnnotationGroup({
        ann_docs: []
      });
      ag.validate(function(err) { expect(err.errors.ann_docs).to.exist; done();
      });
    });
    it('should fail if it has more than ten annotation documents', function(done) {
      docs = new Array(11);
      for(var i = 0; i < 11; i++) {
        var doc = createValidDoc();
        docs.push[doc]
      }
      var ag = new AnnotationGroup({ 
        ann_docs: docs 
      });       
      ag.validate(function(err) { expect(err.errors.ann_docs).to.exist; done(); });
    });
    it('should fail if it contains the same document twice', function(done) {
      var doc = createValidDoc()
      var ag = new AnnotationGroup({ 
        ann_docs: [doc, doc] 
      });   
      ag.validate(function(err) { expect(err.errors.ann_docs).to.exist; done(); });
    });

  });
  describe('Pass conditions', function() {
    it('should pass if it contains two unique documents', function(done) {
      var doc1 = createValidDoc()
      var doc2 = createValidDoc()
      var ag = new AnnotationGroup({ 
        ann_docs: [doc1, doc2] 
      });   
      ag.validate(function(err) { expect(err).to.not.exist; done(); });
    });

  });
});