var mongoose = require('mongoose');
var expect = require('chai').expect;
 



var AnnotationProject = require('../models/annotation_project');
var AnnotationGroup = require('../models/annotation_group');
var AnnotationDoc = require('../models/annotation_doc');
 
describe('Annotation projects', function() {


    /*beforeEach(function(done) {
      if (mongoose.connection.db) return done();

      mongoose.connect("mongodb://localhost/redcoat-db-test", done);
    });*/





    var docs = new Array();
    for(var i = 0; i < 10; i++) {
      var doc = new AnnotationDoc({
        tokens: ["Hello", "there"],
        ann_tokens: ["O", "O"]
      })
      docs.push(doc);
    }



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






    var id1 = mongoose.Types.ObjectId();
    var id2 = mongoose.Types.ObjectId();
    var id3 = "5aa774b9d44fd435970e0bc2"//mongoose.Types.ObjectId();

    mongoose.connect('mongodb://localhost/redcoat-db-test')

    var g1 = new AnnotationGroup({
      _id: id1,
      ann_docs: docs
    });
    var g2 = new AnnotationGroup({    
      _id: id2,    
      ann_docs: docs
    })  
    var ap = new AnnotationProject({
      _id: id3,
      ann_groups: [g1, g2]
    });
    g1.ann_project_id = ap._id;
    g2.ann_project_id = ap._id;

    g1.save()
    g2.save()
    ap.save()

   

    it('should remove associated groups when deleted', function(done) {

      AnnotationProject.findOne({_id: id3}, function(err, proj) {
        proj.remove()
      });
     // ap.remove(function(err) { console.log(err)})
      var c = AnnotationGroup.count({}, function(err, count){
        expect(count).to.equal(0);      
        done();          
      });
    })

    after(function(done){
      mongoose.connection.close(done);
    });

    /*after(function(done){
      //mongoose.connection.db.dropDatabase(function(){
        mongoose.connection.close(done);
      //});
    });*/

})









