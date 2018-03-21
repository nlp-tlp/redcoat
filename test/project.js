var cf = require('./common/common_functions');
var expect = require('chai').expect;
var Project = require('../models/project');
var User = require('../models/user');
var DocumentGroup = require('../models/document_group');
var DocumentGroupAnnotation = require('../models/document_group_annotation');
var rid = require('mongoose').Types.ObjectId;
var st = require('./common/shared_tests');


describe('Projects', function() {


  before(function(done) {
    cf.connectToMongoose(done);
  });
  after(function(done) {
    cf.disconnectFromMongoose(done);
  });


  st.runProjectNameTests(Project);
  st.runProjectDescriptionTests(Project);
  st.runProjectUserIdTests(Project);
  st.runProjectUserIdsTests(Project);
  st.runProjectValidLabelsTests(Project);


  /* user */






  /* Valid object test */

  describe("Validity tests", function() {
  
    var user = cf.createValidUser();
    before(function(done) { 
      cf.registerUsers([user], function(err) { }, done);
    });
    after(function(done)  { cf.dropMongooseDb(done); });

    it('should pass validation if everything is OK', function(done) {       
      var projs = [cf.createValidProject(1, user._id), cf.createValidProject(4, user._id), cf.createValidProject(7, user._id), cf.createValidProject(18, user._id)];
      cf.validateMany(projs, function(err) { expect(err).to.not.exist; }, done);  
    });
    it('should pass saving if everything is OK', function(done) {
      var projs = [cf.createValidProject(1, user._id), cf.createValidProject(4, user._id), cf.createValidProject(7, user._id), cf.createValidProject(18, user._id)];
      cf.saveMany(projs, function(err) { expect(err).to.not.exist; }, done);  
    });
  });   

  /* Cascade deletion test */

  describe("Cascade delete", function() {

    after(function(done)  { cf.dropMongooseDb(done); });    

    it('should delete all associated document groups and document_group_annotations when deleted', function(done) {

      var user = cf.createValidUser();
      var projs = [cf.createValidProject(1, user._id), cf.createValidProject(4, user._id), cf.createValidProject(7, user._id), cf.createValidProject(18, user._id)];
      p1_id = projs[0]._id;
      var doc_groups = [cf.createValidDocumentGroup(5, projs[0]._id), cf.createValidDocumentGroup(5, projs[0]._id), cf.createValidDocumentGroup(5, projs[2]._id)];
      var doc_group_annotations = [cf.createValidDocumentGroupAnnotation(5, user._id, doc_groups[0]._id), cf.createValidDocumentGroupAnnotation(5, user._id, doc_groups[0]._id), cf.createValidDocumentGroupAnnotation(5, user._id, doc_groups[0]._id)];
     
      cf.registerUsers([user], function(err) { expect(err).to.not.exist; }, function() {
        cf.saveMany(projs, function(err) { expect(err).to.not.exist; }, function() {
          cf.saveMany(doc_groups, function(err) { expect(err).to.not.exist; }, function() {
            cf.saveMany(doc_group_annotations, function(err) { expect(err).to.not.exist; }, function() {
              Project.findById(p1_id, function(err, proj) {
                proj.remove(function(err) { 
                  Project.count({}, function(err, count) {
                    expect(count).to.equal(3);
                    DocumentGroup.find({}, function(err, doc_groups2) {
                      expect(doc_groups2.length).to.equal(1);
                      DocumentGroupAnnotation.count({}, function(err, count) {
                        expect(count).to.equal(0);
                        done();
                      });
                    });
                  });
                });
              });
            });
          }); // yay pyramid
        });
      });
    });
  });


  /* Instance method tests */

  describe("Instance methods", function() {

    // before(function(done) { cf.connectToMongoose(done); });
    after(function(done)  { cf.dropMongooseDb(done); });    

    it('should sort its document_groups in order of times_annotated', function(done) {

      var user = cf.createValidUser();
      cf.registerUsers([user], function(err) { expect(err).to.not.exist; }, function() {
        var proj1 = cf.createValidProject(6, user._id);
        var proj2 = cf.createValidProject(11, user._id);
        var proj1_id = proj1._id;
        var proj2_id = proj2._id;
        // Save the two projects
        cf.saveMany([proj1, proj2], function(err) { expect(err).to.not.exist; }, function() {
          // Create 6 document groups (3 for each project)
          var doc_groups = [cf.createValidDocumentGroup(4, proj1._id), cf.createValidDocumentGroup(6, proj1._id), cf.createValidDocumentGroup(7, proj1._id),
                            cf.createValidDocumentGroup(4, proj2._id), cf.createValidDocumentGroup(6, proj2._id), cf.createValidDocumentGroup(7, proj2._id)
          ];
          var doc_group_ids = [ doc_groups[0]._id, doc_groups[1]._id, doc_groups[2]._id, doc_groups[3]._id, doc_groups[4]._id, doc_groups[5]._id ]
          cf.saveMany(doc_groups, function(err) { expect(err).to.not.exist; }, function() {
            // Update the first four document groups to have different numbers of times_annotated
            DocumentGroup.findOneAndUpdate( { _id : doc_group_ids[0] }, { $set: { times_annotated: 6 } }).exec()
            .then(function() { return DocumentGroup.findOneAndUpdate( { _id : doc_group_ids[1] }, { $set: { times_annotated: 4 } })})
            .then(function() { return DocumentGroup.findOneAndUpdate( { _id : doc_group_ids[2] }, { $set: { times_annotated: 2 } })})
            .then(function() { return DocumentGroup.findOneAndUpdate( { _id : doc_group_ids[3] }, { $set: { times_annotated: 7 } })})
            .then(function() { return Project.findOne({ _id: proj1_id }).exec();
            })
            .then(function(proj) {
              proj.sortDocumentGroupsByTimesAnnotated(function(err, sorted_doc_groups) {
                expect(err).to.not.exist;
                expect(sorted_doc_groups[0].times_annotated).to.equal(2);
                expect(sorted_doc_groups[1].times_annotated).to.equal(4);
                expect(sorted_doc_groups[2].times_annotated).to.equal(6);
                expect(sorted_doc_groups.length).to.equal(3);
                done();
              });
            });
          });
        });
      });
    });
  });
})





