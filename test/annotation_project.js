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




    it('should remove associated groups and documents when deleted', function(done) {

      mongoose.connect('mongodb://localhost/redcoat-db-test')
      var id0 = mongoose.Types.ObjectId();
      var id1 = mongoose.Types.ObjectId();
      var id2 = mongoose.Types.ObjectId();
      var id3 = mongoose.Types.ObjectId();
      var id4 = mongoose.Types.ObjectId();
      var id5 = mongoose.Types.ObjectId();
      var id6 = "5aa774b9d44fd435970e0bc5"//mongoose.Types.ObjectId();

      function setUpCascadeTest(callback) {      

        var d1 = new AnnotationDoc({
          _id: id0,
          tokens: ["Hello", "there"],
          ann_tokens: ["O", "O"]
        })
        
        var d2 = new AnnotationDoc({
          _id: id1,
          tokens: ["Hello", "there"],
          ann_tokens: ["O", "O"]
        })

        var g1 = new AnnotationGroup({
          _id: id2,
          ann_docs: [d1]
        });
        var g2 = new AnnotationGroup({    
          _id: id3,    
          ann_docs: [d1]
        }) 
        var g3 = new AnnotationGroup({      // Unrelated to project 1
          _id: id4,    
          ann_docs: [d1]
        }) 
        var ap2 = new AnnotationProject({
          _id: id5,
          ann_groups: [g3]
        });
        var ap = new AnnotationProject({
          _id: id6,
          ann_groups: [g1, g2]
        });

        d1.ann_group_id   = g1._id;
        d2.ann_group_id   = g2._id;
        g1.ann_project_id = ap._id;
        g2.ann_project_id = ap._id;
        g3.ann_project_id = ap2._id;

        // why isnt javascript synchronous
        d1.save(function(err) { 
          if(err) console.log(err);
          d2.save(function(err) {
            if(err) console.log(err);
            g1.save(function(err) {
              if(err) console.log(err);
              g2.save(function(err) {
                if(err) console.log(err);
                g3.save(function(err) {
                  if(err) console.log(err);
                  ap.save(function(err) { 
                    if(err) console.log(err);
                    ap2.save(function(err) { 
                      if(err) console.log(err);
                      callback();          
                    })        
                  })
                })
              })
            })
          })
        })        
       }



        setUpCascadeTest(function() {         
          AnnotationProject.findOne({_id: id5}, function(err, proj) {
            //console.log("FIND:", proj, err)
            //console.log(id4,proj, err)
            proj.remove(function(err) {
              //console.log("REMOVE:", proj, err)
              // ap.remove(function(err) { console.log(err)})
              //console.log("err: ", err)
              AnnotationGroup.count({}, function(err, count){
                expect(count).to.equal(1); 
                AnnotationDoc.count({}, function(err, count){
                  expect(count).to.equal(0);
                  done();
                });

              });

            })
          });
          




          //after(function(done){
          //  mongoose.connection.close(done);
          //});

        
      });
      after(function(done){
        mongoose.connection.close(done);
      });

    });

    /*after(function(done){
      //mongoose.connection.db.dropDatabase(function(){
        mongoose.connection.close(done);
      //});
    });*/

})









