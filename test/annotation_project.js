var expect = require('chai').expect;
 
var AnnotationProject = require('../models/annotation_project');
var AnnotationGroup = require('../models/annotation_group');
var AnnotationDoc = require('../models/annotation_doc');
 
describe('Annotation projects', function() {

  var docs = new Array(10);
  for(var i = 0; i < 10; i++) {
    var doc = new AnnotationDoc({
      tokens: ["Hello", "there"],
      ann_tokens: ["O", "O"]
    })
    docs.push[doc];
  }



  describe('Fail conditions', function() {

    it('should fail if it does not have least one annotation group', function(done) { 
      var ap = new AnnotationProject();
      ap.validate(function(err) { expect(err.errors.ann_groups).to.exist; done();
      });
    });



    it('should fail if it has more than 1000 annotation groups', function(done) {

      var groups = new Array(1001);
      for(var i = 0; i < 1001; i++) {
        var group = new AnnotationGroup({
          ann_docs: docs
        })
      }

      var ap = new AnnotationProject({ 
        ann_groups: groups
      });       
      ap.validate(function(err) { expect(err.errors.ann_groups).to.exist; done(); });
    });

    it('should fail if it contains the same group twice', function(done) {
      var g = new AnnotationGroup({
        ann_docs: docs
      });
      var ap = new AnnotationProject({
        ann_groups: [g, g]
      });
      ap.validate(function(err) { expect(err.errors.ann_groups).to.exist; done(); });
    });

  });
  describe("Pass conditions", function() {
    it('should pass if it contains two unique groups', function(done) {
      var g1 = new AnnotationGroup({
        ann_docs: docs
      });
      var g2 = new AnnotationGroup({
        ann_docs: docs
      })
      var ap = new AnnotationProject({
        ann_groups: [g1, g2]
      });
      ap.validate(function(err) { expect(err).to.not.exist; done(); });
    });
  });
});