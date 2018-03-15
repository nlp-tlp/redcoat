var mongoose = require('mongoose');
var expect = require('chai').expect;
 



var Project = require('../models/project');
var DocumentGroup = require('../models/document_group');
var Document = require('../models/document');
var DocumentAnnotation = require('../models/document_annotation');
 
describe('Projects', function() {


    /*beforeEach(function(done) {
      if (mongoose.connection.db) return done();

      mongoose.connect("mongodb://localhost/redcoat-db-test", done);
    });*/

    var docs = new Array();
    for(var i = 0; i < 10; i++) {
      var doc = new Document({
        tokens: ["Hello", "there"],
        ann_tokens: ["O", "O"]
      })
      docs.push(doc);
    }

    it('should fail if it does not have least one annotation group', function(done) { 
      var proj = new Project();
      proj.validate(function(err) { expect(err.errors.document_groups).to.exist; done();
      });
    });

    it('should fail if it has more than 1000 annotation groups', function(done) {

      var groups = new Array(1001);
      for(var i = 0; i < 1001; i++) {
        var group = new DocumentGroup({
          documents: docs
        })
      }

      var proj = new Project({ 
        document_groups: groups
      });       
      proj.validate(function(err) { expect(err.errors.document_groups).to.exist; done(); });
    });

    it('should fail if it contains the same group twice', function(done) {
      var g = new DocumentGroup({
        documents: docs
      });
      var proj = new Project({
        document_groups: [g, g]
      });
      proj.validate(function(err) { expect(err.errors.document_groups).to.exist; done(); });
    });

    it('should pass if it contains two unique groups', function(done) {
      var g1 = new DocumentGroup({        
        documents: docs
      });
      var g2 = new DocumentGroup({
        documents: docs
      })
      var proj = new Project({
        document_groups: [g1, g2]
      });
      proj.validate(function(err) { expect(err).to.not.exist; done(); });
    });




    it('should remove associated groups, documents, and document annotations (but not non-associated ones) when deleted', function(done) {

      // Create a bunch of fixed ids for the objects
      var id0 = mongoose.Types.ObjectId();
      var id1 = mongoose.Types.ObjectId();
      var id2 = mongoose.Types.ObjectId();
      var id3 = mongoose.Types.ObjectId();
      var id4 = mongoose.Types.ObjectId();
      var id5 = mongoose.Types.ObjectId();
      var id6 = mongoose.Types.ObjectId();
      var id7 = mongoose.Types.ObjectId();

      function setUpCascadeTest(callback) {      

        // Create 3 documents, 3 groups, and 2 projects
        var a1  = new DocumentAnnotation({ labels: ["O", "O"] })        
        var a2  = new DocumentAnnotation({ labels: ["O", "O"] })
        var a3  = new DocumentAnnotation({ labels: ["O", "O"] })
        var d1  = new Document({ _id: id0, tokens: ["Hello", "there"] })        
        var d2  = new Document({ _id: id1, tokens: ["Hello", "dude"] })
        var d3  = new Document({ _id: id2, tokens: ["Hello", "man"] })
        var g1  = new DocumentGroup({ _id: id3, documents: [d1] })
        var g2  = new DocumentGroup({ _id: id4, documents: [d2] }) 
        var g3  = new DocumentGroup({ _id: id5, documents: [d3] })
        var proj1 = new Project({ _id: id6, document_groups: [g1, g2] });
        var proj2 = new Project({ _id: id7, document_groups: [g3] });

        // Assign the parent ids to the documents and groups
        a1.document_id         = d1._id;
        a2.document_id         = d2._id;
        a3.document_id         = d3._id;
        d1.document_group_id   = g1._id;
        d2.document_group_id   = g2._id;
        d3.document_group_id   = g3._id;
        g1.project_id          = proj1._id;
        g2.project_id          = proj1._id;
        g3.project_id          = proj2._id;

        // Save everything. There must be a better way to do this sequentially
        proj2.save(function(err) { if(err) console.log(err);
         proj1.save(function(err) { if(err) console.log(err);
          g3.save(function(err)    { if(err) console.log(err);
           g2.save(function(err)    { if(err) console.log(err);
            g1.save(function(err)    { if(err) console.log(err);
             d3.save(function(err)    { if(err) console.log(err);
              d2.save(function(err)    { if(err) console.log(err);
               d1.save(function(err)    { if(err) console.log(err);
                a3.save(function(err)    { if(err) console.log(err);
                 a2.save(function(err)    { if(err) console.log(err);
                  a1.save(function(err)    { if(err) console.log(err);
                   callback(); })})})})})})})})})})})}


        setUpCascadeTest(function() {  
          // Retrieve the project to be deleted 
          Project.findOne({_id: id6}, function(err, proj) {
            // Delete the project, and count the number of groups and docs left. There should be 1 of each, as 2 of each were associated with the deleted project.
            proj.remove(function(err) {
              DocumentGroup.count({}, function(err, count){
                expect(count).to.equal(1); 
                Document.count({}, function(err, count){
                  expect(count).to.equal(1);
                  DocumentAnnotation.count({}, function(err, count){
                    expect(count).to.equal(1);
                    done();
                  });
                });
              });
            })
          });        
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

})









