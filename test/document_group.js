var cf = require('./common/common_functions');
var expect = require('chai').expect;
var Project = require('../models/project');
var User = require('../models/user');
var DocumentGroup = require('../models/document_group');
var DocumentGroupAnnotation = require('../models/document_group_annotation');
var rid = require('mongoose').Types.ObjectId;

describe('Document Groups', function() {




  before(function(done) {
    cf.connectToMongoose(done);
  });
  after(function(done) {
    cf.disconnectFromMongoose(done);
  });

  /* project_id */

  describe("project_id", function() {

    after(function(done)  { cf.dropMongooseDb(done); });

    it('should fail validation if it does not have a project_id', function(done) { 
      var docgroup = new DocumentGroup();
      docgroup.validate(function(err) { expect(err.errors.project_id).to.exist; done(); });
    });
    it('should fail to save if project_id does not exist in the Project collection', function(done) { 
      var docgroup = new DocumentGroup({ project_id: rid(), documents: cf.createValidDocuments(10) });
      docgroup.save(function(err) { 
        expect(err).to.exist;
        DocumentGroup.count({}, function(err, count) {
          expect(count).to.equal(0);
          done();
        });
      });
    });
  })

  describe("documents", function() {
    function createTooLongDocument() {
      var doc = []
      for(var i = 0; i < 500; i++) {
        doc.push("word");
      }
      return doc;
    }

    /* Document count */
    it('should fail validation if it does not have any documents', function(done) { 
      var docgroup = new DocumentGroup();
      docgroup.validate(function(err) { expect(err.errors.documents).to.exist; done(); });
    });
    it('should fail validation if it has too many documents', function(done) { 
      var docgroup = new DocumentGroup({ documents: cf.createValidDocuments(12) } );
      docgroup.validate(function(err) { expect(err.errors.documents).to.exist; done(); });
    });
    it('should pass validation for documents if it has a suitable number of valid documents', function(done) { 
      var docgroup = new DocumentGroup({ documents: cf.createValidDocuments(7) } );
      docgroup.validate(function(err) { expect(err.errors.documents).to.not.exist; done(); });
    });

    /* Document length */
    it('should fail validation if it contains a document that is empty', function(done) { 
      var docgroup = new DocumentGroup({ documents: [ [], ["this", "one", "is", "ok"] ] } );
      docgroup.validate(function(err) { expect(err.errors.documents).to.exist; done(); });
    });    
    it('should fail validation if it contains a document that is too long', function(done) { 
      var docgroup = new DocumentGroup({ documents: [ createTooLongDocument() ] } );
      docgroup.validate(function(err) { expect(err.errors.documents).to.exist; done(); });
    });    

    /* Document token count */
    it('should fail validation if it contains a document with an empty token', function(done) { 
      var docgroup = new DocumentGroup({ documents: [ ["", "is", "not", "ok"] ] } );
      docgroup.validate(function(err) { expect(err.errors.documents).to.exist; done(); });
    });    
    it('should fail validation if it contains a document with a token that is too long', function(done) { 
      var docgroup = new DocumentGroup({ documents: [["thiiiiiiiiiiiiiiiiiiiiiiiis", "is", "not", "ok"]] } );
      docgroup.validate(function(err) { expect(err.errors.documents).to.exist; done(); });
    });    


  })


  describe("times_annotated", function() {

    var user = cf.createValidUser();
    before(function(done) {
      user.save(done);
    })
    after(function(done)  { cf.dropMongooseDb(done); });

    it('should be created with times_annotated set to 0', function(done) {
      var proj = cf.createValidProject(1, user._id);
      var docgroup = cf.createValidDocumentGroup(5, proj._id);
      proj.save(function(err) {
        docgroup.save(function(err, docgroup) { 
          expect(docgroup.times_annotated).to.equal(0); 
          done();
        });
      });
    });  

    // Note: need to rewrite this one to incorporate document_group_annotation model
    it('should correctly increment times_annotated when two users annotate a document group at nearly the same time', function(done) {
      var proj = cf.createValidProject(1, user._id);
      var docgroup = cf.createValidDocumentGroup(5, proj._id);
      var doc_id = docgroup._id;

      firstAnnotation = function(done) {
        DocumentGroup.findOneAndUpdate({ _id : doc_id }, { $inc: { times_annotated: 1 } }, done)
      }
      secondAnnotation = function(done) {
        // Find the document group, then wait 100ms and update it.
        // The idea is to simulate what would happen if two users attempted to increment times_annotated
        // at a similar time.
        DocumentGroup.findOne({ _id : doc_id }, function(err, doc_group) {
          setTimeout(function() {
            DocumentGroup.findOneAndUpdate({ _id : doc_id }, { $inc: { times_annotated: 1 } }, done);
          }, 100)
        })        
      }

      proj.save(function(err) {
        docgroup.save(function(err, docgroup) { 
          firstAnnotation(function() {
            DocumentGroup.findOne( { _id: doc_id }, function(err, docgroup) {
              expect(docgroup.times_annotated).to.equal(1);                        
            });
          });
          secondAnnotation(function() {
            DocumentGroup.findOne( { _id: doc_id }, function(err, docgroup) {
              expect(docgroup.times_annotated).to.equal(2);      
              done();                      
            });          
          });
        });
      });
    }); 

  });

  describe("Validity tests", function() {

    var user = cf.createValidUser();
    before(function(done) {
      user.save(done);
    })
    after(function(done)  { cf.dropMongooseDb(done); });

    it('should pass validation if everything is OK', function(done) {       
      var projs = [cf.createValidProject(1, user._id), cf.createValidProject(4, user._id), cf.createValidProject(7, user._id), cf.createValidProject(18, user._id)];
      var docgroups = [cf.createValidDocumentGroup(5, projs[0]._id), cf.createValidDocumentGroup(5, projs[1]._id), cf.createValidDocumentGroup(5, projs[2]._id)];
      cf.saveMany(projs, function(err) { expect(err).to.not.exist; }, function() {
        cf.validateMany(docgroups, function(err) { expect(err).to.not.exist; }, done)
      });
    });
    it('should pass saving if everything is OK', function(done) { 
      var projs = [cf.createValidProject(1, user._id), cf.createValidProject(4, user._id), cf.createValidProject(7, user._id), cf.createValidProject(18, user._id)];
      var docgroups = [cf.createValidDocumentGroup(5, projs[0]._id), cf.createValidDocumentGroup(5, projs[1]._id), cf.createValidDocumentGroup(5, projs[2]._id)];
      cf.saveMany(projs, function(err) { expect(err).to.not.exist; }, function() {
        cf.saveMany(docgroups, function(err) { expect(err).to.not.exist; }, done)
      });
    });
  });

  describe("Instance methods", function() {

    afterEach(function(done)  { cf.dropMongooseDb(done); });

    it('should correctly return all annotations via getAnnotations()', function(done) {
      var user =          cf.createValidUser();
      var projs =        [cf.createValidProject(1, user._id),
                          cf.createValidProject(4, user._id),
                          cf.createValidProject(7, user._id),
                          cf.createValidProject(18, user._id)];
      var docgroups =    [cf.createValidDocumentGroup(5, projs[0]._id),
                          cf.createValidDocumentGroup(5, projs[1]._id),
                          cf.createValidDocumentGroup(5, projs[2]._id)];    
      var docgroupanns = [cf.createValidDocumentGroupAnnotation(5, user._id, docgroups[0]._id),
                          cf.createValidDocumentGroupAnnotation(5, user._id, docgroups[0]._id),
                          cf.createValidDocumentGroupAnnotation(5, user._id, docgroups[0]._id),
                          cf.createValidDocumentGroupAnnotation(5, user._id, docgroups[1]._id),
                          cf.createValidDocumentGroupAnnotation(5, user._id, docgroups[2]._id),
                          cf.createValidDocumentGroupAnnotation(5, user._id, docgroups[2]._id)];
      var d1_id = docgroups[0]._id;
      var d2_id = docgroups[1]._id;
      var d3_id = docgroups[2]._id;
      user.save(function(err) {        
        cf.saveMany(projs, function(err) { expect(err).to.not.exist; }, function() {
          cf.saveMany(docgroups, function(err) { expect(err).to.not.exist; }, function() {
            cf.saveMany(docgroupanns, function(err) { expect(err).to.not.exist; }, function() {              
              DocumentGroup.findOne({_id: d1_id}, function(err, d1) {
                d1.getAnnotations( function(err, annotations) {
                  expect(annotations.length).to.equal(3);
                  DocumentGroup.findOne({_id: d2_id}, function(err, d2) {
                    d2.getAnnotations( function(err, annotations) {
                      expect(annotations.length).to.equal(1);
                      DocumentGroup.findOne({_id: d3_id}, function(err, d3) {
                        d3.getAnnotations( function(err, annotations) {
                          expect(annotations.length).to.equal(2);
                          done();
                        });
                      });
                    });
                  });
                });             
              });
            });
          });
        });
      });       
    });
  });
});





