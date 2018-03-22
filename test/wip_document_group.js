var cf = require('./common/common_functions');
var expect = require('chai').expect;
var WipProject = require('../models/wip_project');
var User = require('../models/user');
var WipDocumentGroup = require('../models/wip_document_group');
var DocumentGroupAnnotation = require('../models/document_group_annotation');
var rid = require('mongoose').Types.ObjectId;
var st = require('./common/shared_tests');

describe('WIP Document Groups', function() {


  before(function(done) {
    cf.connectToMongoose(done);
  });
  after(function(done) {
    cf.disconnectFromMongoose(done);
  });

  /* project_id */

  describe("wip_project_id", function() {

    after(function(done)  { cf.dropMongooseDb(done); });

    it('should fail validation if it does not have a wip_project_id', function(done) { 
      var wipdocgroup = new WipDocumentGroup();
      wipdocgroup.validate(function(err) { expect(err.errors.wip_project_id).to.exist; done(); });
    });
    it('should fail to save if project_id does not exist in the WIP Project collection', function(done) { 
      var wipdocgroup = new WipDocumentGroup({ wip_project_id: rid(), documents: cf.createValidDocuments(10) });
      wipdocgroup.save(function(err) { 
        expect(err).to.exist;
        WipDocumentGroup.count({}, function(err, count) {
          expect(count).to.equal(0);
          done();
        });
      });
    });
  })

  st.runDocumentTests(WipDocumentGroup);


  describe("Validity tests", function() {

    var user1, user2, user3, user4;

    beforeEach(function(done) {
      user1 = cf.createValidUser();
      user2 = cf.createValidUser();
      user3 = cf.createValidUser();
      user4 = cf.createValidUser();
      cf.registerUsers([user1, user2, user3, user4], function(err) { }, done);
    })
    afterEach(function(done)  { cf.dropMongooseDb(done); });

    it('should pass validation if everything is OK', function(done) {       
      var projs = [cf.createValidProjectOrWIPP(WipProject, 1, user1._id), cf.createValidProjectOrWIPP(WipProject, 4, user2._id), cf.createValidProjectOrWIPP(WipProject, 7, user3._id), cf.createValidProjectOrWIPP(WipProject, 18, user4._id)];
      var wipdocgroups = [cf.createValidWipDocumentGroup(5, projs[0]._id), cf.createValidWipDocumentGroup(5, projs[1]._id), cf.createValidWipDocumentGroup(5, projs[2]._id)];
      cf.saveMany(projs, function(err) { expect(err).to.not.exist; }, function() {
        cf.validateMany(wipdocgroups, function(err) { expect(err).to.not.exist; }, done)
      });
    });
    it('should pass saving if everything is OK', function(done) { 
      var projs = [cf.createValidProjectOrWIPP(WipProject, 1, user1._id), cf.createValidProjectOrWIPP(WipProject, 4, user2._id), cf.createValidProjectOrWIPP(WipProject, 7, user3._id), cf.createValidProjectOrWIPP(WipProject, 18, user4._id)];
      var wipdocgroups = [cf.createValidWipDocumentGroup(5, projs[0]._id), cf.createValidWipDocumentGroup(5, projs[1]._id), cf.createValidWipDocumentGroup(5, projs[2]._id)];
      cf.saveMany(projs, function(err) { expect(err).to.not.exist; }, function() {
        cf.saveMany(wipdocgroups, function(err) { expect(err).to.not.exist; }, done)
      });
    });
  });
});



