var cf = require('./common/common_functions');
var expect = require('chai').expect;
var Project = require('../models/project');
var User = require('../models/user');
var DocumentGroup = require('../models/document_group');
var DocumentGroupAnnotation = require('../models/document_group_annotation');
var rid = require('mongoose').Types.ObjectId;

describe('Document Group Annotations', function() {


  var user1 = cf.createValidUser();
  var user2 = cf.createValidUser();

  before(function(done) {
    cf.connectToMongoose(function() {
      cf.registerUsers([user1, user2], function(err) { }, function () {
        return done();
      });
    });
  });
  after(function(done) {
    cf.disconnectFromMongoose(done);
  });

  // Creates a valid project and document_group.
  function setUpObjects() {

    var proj = cf.createValidProject(1, user1._id);
    proj.valid_labels = [
        { label: "test-1", abbreviation: "TEST-1", color: "#000001" },
        { label: "test-2", abbreviation: "TEST-2", color: "#000002" },
        { label: "test-3", abbreviation: "TEST-3", color: "#000003" },
    ];
    var doc_group = cf.createValidDocumentGroup(2, proj._id);
    return {proj: proj, doc_group: doc_group};
  }

  /* user_id */

  describe("user_id", function() {


    after(function(done)  { cf.dropMongooseDb({ except: "users"}, done); });

    it('should fail validation if it does not have a user_id', function(done) { 
      var doc_group_ann = new DocumentGroupAnnotation();
      doc_group_ann.validate(function(err) { expect(err.errors.user_id).to.exist; done(); });
    });

    it('should fail to save if user_id does not exist in the Users collection', function(done) { 
      var proj = cf.createValidProject(1, user1._id);
      var doc_group = cf.createValidDocumentGroup(1, proj._id);
      proj.save()
      .then(function() {
        return doc_group.save();
      })
      .then(function() {
        var doc_group_ann = new DocumentGroupAnnotation({ 
          user_id: rid(),
          document_group_id: doc_group._id,
          project_id: proj._id,
          labels: [ ["O", "O"]]
        })
        doc_group_ann.save(function(err) {
          expect(err).to.exist;
          done();
        });
      });
    }); 

    it('should fail to save if its user_id is not the same as its project\'s user_id', function(done) {

      var proj = cf.createValidProject(1, user1._id);
      var doc_group = cf.createValidDocumentGroup(1, proj._id);
      proj.save()
      .then(function() {
        return doc_group.save();
      })
      .then(function() {
        var doc_group_ann = new DocumentGroupAnnotation({ 
          user_id: user2._id,
          document_group_id: doc_group._id,
          project_id: proj._id,
          labels: [ ["O", "O"]]
        })
        doc_group_ann.save(function(err) {
          expect(err).to.exist;
          done();
        });
      });
    });
  })

  /* document_group_id */

  describe("document_group_id", function() {

    //after(function(done)  { cf.dropMongooseDb({ except: "users"}, done); });

    it('should fail validation if it does not have a document_group_id', function(done) { 
      var doc_group_ann = new DocumentGroupAnnotation();
      doc_group_ann.validate(function(err) { expect(err.errors.document_group_id).to.exist; done(); });
    });
    it('should fail to save if document_group_id does not exist in the Document Groups collection', function(done) { 
      var proj = cf.createValidProject(1, user1._id);
      var doc_group = cf.createValidDocumentGroup(1, proj._id);
      doc_group.times_annotated = 50;
      proj.save()
      .then(function() {
        return doc_group.save();
      })
      .then(function() {
        var doc_group_ann = new DocumentGroupAnnotation({ 
          user_id: user1._id,
          document_group_id: rid(),
          pingu: "noot noot",
          project_id: proj._id,
          labels: [ ["O", "O"]]
        })
        doc_group_ann.save(function(err) {
          expect(err).to.exist;
          done();
        });
      });
    }); 
  });




  /* labels */

  describe("labels", function() {

    after(function(done)  { cf.dropMongooseDb({ except: "users"}, done); });

    it("should fail to save if any labels are not listed in project.valid_labels", function(done) {
      objs = setUpObjects(); proj = objs.proj; doc_group = objs.doc_group;      
      doc_group.documents = [
        ["word", "word", "word", "word", "word", "word", "word", "word", "word", "word", 
         "word", "word", "word", "word", "word", "word", "word", "word", "word", "word", 
         "word", "word", "word", "word", "word", "word", "word", "word", "word", "word", 
         "word", "word", "word", "word", "word", "word", "word", "word", "word", "word",  // 40 tokens
        ],
        ["word", "word", "word", "word", "word", "word", "word", "word", "word", "word", 
         "word", "word", "word", "word", "word", "word", "word", "word", "word", "word", 
         "word", "word", "word", "word", "word", "word", "word", "word", "word", "word", 
         "word", "word", "word", "word", "word", "word", "word", "word", "word", "word", "word" // 41 tokens
        ]
      ]
      cf.saveMany([doc_group, proj], function(err) { expect(err).to.not.exist; }, function() {
        var doc_group_ann = new DocumentGroupAnnotation({
          user_id: user1._id,
          document_group_id: doc_group._id,
          labels: [
            [ "O", "TEST-1", "TEST-1", "TEST-1", "O", "O", "O", "O", "O", "O", "O", "O", "O", "O", "O", "O", "O", "TEST-2", "TEST-3", "TEST-2",
              "O", "TEST-1", "TEST-1", "TEST-1", "O", "O", "O", "O", "O", "O", "O", "O", "O", "O", "O", "O", "O", "TEST-2", "TEST-3", "TEST-1"
            ],
            [ "O", "TEST-1", "TEST-1", "TEST-1", "O", "O", "O", "O", "O", "O", "O", "O", "O", "O", "O", "O", "O", "TEST-2", "TEST-3", "TEST-3",
              "O", "TEST-1", "TEST-1", "TEST-1", "O", "O", "O", "O", "O", "O", "O", "O", "O", "O", "O", "O", "O", "TEST-2", "TEST-3", "TEST-1", "TEST-9"
            ]
          ]
        })
        doc_group_ann.save(function(err) {
          expect(err).to.exist;
          done();
        });
      });
    });
 

    it("should fail to save if the number of documents does not match the number of corresponding documents", function(done) {
      objs = setUpObjects(); proj = objs.proj; doc_group = objs.doc_group;   

      doc_group.documents = [
        ["word", "word", "word", "word", "word"],
        ["word", "word", "word"],
        ["word", "word", "word", "word"]
      ];
      cf.saveMany([doc_group, proj], function(err) { expect(err).to.not.exist; }, function() {
        var doc_group_ann = new DocumentGroupAnnotation({
          user_id: user1._id,
          document_group_id: doc_group._id,
          labels: [
            ["O", "O", "O", "O", "O"],
            ["O", "O", "O"],
            ["O", "O", "TEST-1", "O"],
            ["O"]
          ]
        });     
        doc_group_ann.save(function(err) {
          expect(err).to.exist;
          done();
        });
      });
    });


    it("should fail to save if the number of tokens in each label array does not match the number of tokens in corresponding documents", function(done) {
      objs = setUpObjects(); proj = objs.proj; doc_group = objs.doc_group;   
      doc_group.documents = [
        ["word", "word", "word", "word", "word"],
        ["word", "word", "word"],
        ["word", "word", "word", "word"]
      ];
      cf.saveMany([doc_group, proj], function(err) { expect(err).to.not.exist; }, function() {
        var doc_group_ann = new DocumentGroupAnnotation({
          user_id: user1._id,
          document_group_id: doc_group._id,
          labels: [
            ["O", "O", "O", "O", "O"],
            ["O", "O"],
            ["O", "O", "O", "O"]
          ]
        });     
        doc_group_ann.save(function(err) {
          expect(err).to.exist;
          done();
        });
      });
    });
  });

  /* Valid object tests */

  describe("Validity tests", function() {

    after(function(done)  { cf.dropMongooseDb({ except: "users"}, done); });

    it('should pass saving if everything is OK', function(done) { 
      objs = setUpObjects(); proj = objs.proj; doc_group = objs.doc_group;
      doc_group.documents = [
        ["word", "word", "word", "word", "word"],
        ["word", "word", "word"],
        ["word", "word", "word", "word"]
      ];
      cf.saveMany([doc_group, proj], function(err) { expect(err).to.not.exist; }, function() {
        var doc_group_ann = new DocumentGroupAnnotation({
          user_id: user1._id,
          document_group_id: doc_group._id,
          labels: [
            ["O", "O", "TEST-1", "O", "O"],
            ["O", "O", "O"],
            ["O", "TEST-2", "O", "O"]
          ]
        });     
        doc_group_ann.save(function(err) {
          expect(err).to.not.exist;
          DocumentGroupAnnotation.count({}, function(err, count) {
            expect(count).to.equal(1);
            done();
          });
        });
      });
    });
  });
});





