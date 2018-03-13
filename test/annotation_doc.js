var expect = require('chai').expect;
 
var AnnotationDoc = require('../models/annotation_doc');

describe('Annotation docs', function() {
  describe('Fail conditions', function() {
    it('should fail if it does not have least one token', function(done) { 
      var ad = new AnnotationDoc({
        tokens: [],
        ann_tokens: ["hello", "there"]
      });
      ad.validate(function(err) {
          expect(err.errors.tokens).to.exist; done();
      });
    });
    it('should fail if it does not have least one annotation token', function(done) { 
      var ad = new AnnotationDoc({
        tokens: ["hello", "there"],
        ann_tokens: []
      });
      ad.validate(function(err) {
          expect(err.errors.ann_tokens).to.exist; done();
      });
    });
    it('should fail if the number of tokens does not match the number of annotation tokens', function(done) { 
      var ad = new AnnotationDoc({
        tokens: ["hello", "there"],
        ann_tokens: ["what"]
      });
      ad.validate(function(err) {
          expect(err.errors.ann_tokens).to.exist; done();
      });
    });   
    it('should fail if the number of tokens or ann tokens is greater than 1000', function(done) { 
      var ad = new AnnotationDoc({
        tokens: new Array(2000).fill("word"),
        ann_tokens: new Array(2000).fill("word")
      });
      ad.validate(function(err) {
          expect(err.errors.tokens).to.exist; done();
      });
    }); 

  });
  describe("Pass conditions", function() {
    it('should pass if tokens contain a non-string, by casting them to strings', function(done) { 
      var ad = new AnnotationDoc({
        tokens: ["hello", 4.2, 9],
        ann_tokens: ["O", "O", "O"]
      });

      ad.validate(function(err) {
          expect(err).to.not.exist; done();
      });
    });

  
  });
});
