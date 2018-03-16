var cf = require('./common/common_functions');
var expect = require('chai').expect;
var Project = require('../models/project');
var User = require('../models/user');
var rid = require('mongoose').Types.ObjectId;

describe('Projects', function() {

  /* project_name */

  describe("project_name", function() {

    it('should fail validation if it does not have a project name', function(done) { 
      var proj = new Project();
      proj.validate(function(err) { expect(err.errors.project_name).to.exist; done(); });
    });
    it('should fail validation if the name is too short', function(done) { 
      var proj = new Project({ project_name: "" });
      proj.validate(function(err) { expect(err.errors.project_name).to.exist; done(); });
    });
    it('should fail validation if the name is too long', function(done) { 
      var proj = new Project({ project_name: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" }); // 51 chars
      proj.validate(function(err) { expect(err.errors.project_name).to.exist; done(); });
    });
    it('should fail validation if the name is blank', function(done) { 
      var proj = new Project({ project_name: "      " }); // 51 chars
      proj.validate(function(err) { expect(err.errors.project_name).to.exist; done(); });
    });
    it('should pass validation (for project_name) if the name is OK', function(done) { 
      var proj = new Project({ project_name: "xxxxxxxxxxxx" }); // 51 chars
      proj.validate(function(err) { expect(err.errors.project_name).to.not.exist; done(); });
    });

  })

  /* user */

  describe("user_id", function() {

    before(function(done) { cf.connectToMongoose(done); });
    after(function(done)  { cf.disconnectFromMongooseAndDropDb(done); });

    /* user_id errors */
    it('should fail validation if user_id is absent or blank', function(done) { 
      var proj1 = new Project( {  } );
      var proj2 = new Project( { user_id: "" });
      cf.validateMany([proj1, proj2], function(err) { expect(err.errors.user_id).to.exist }, done);
    }); 

    it('should fail to save if user_id does not exist in the Users collection', function(done) { 
      var proj = new Project( { 
        project_name: "Qwyjibo",
        user_id: rid() ,
        valid_labels: [
          { label: "fine", abbreviation: "fine", color: "#123456" }
        ]
      });

      proj.save(function(err) { 
        expect(err).to.exist;
        // Ensure the project wasn't saved. (Note: I spent 2 hours debugging this because the User model had connected to redcoat-db-dev for some reason and the connection
        // was never closed. The tests were hanging, and I couldn't figure out why...)
        Project.count({}, function(err, count) {
          expect(count).to.equal(0);
          done();
        });
      });
    }); 
  });

  /* valid_labels */

  describe("valid_labels", function() {

    /* Label errors */
    it('should fail validation if valid_labels contains a label that is too short', function(done) { 
      var proj = new Project( { valid_labels: [ { label: "", abbreviation: "fine", color: "#111111" }] });
      proj.validate(function(err) { expect(err.errors['valid_labels.0.label']).to.exist; done(); });
    }); 
    it('should fail validation if valid_labels contains a label that is too long', function(done) { 
      var proj = new Project( { valid_labels: [ { label: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", abbreviation: "fine", color: "#111111" }] });
      proj.validate(function(err) { expect(err.errors['valid_labels.0.label']).to.exist; done(); });
    });  
    it('should fail validation if valid_labels contains a label that is blank', function(done) { 
      var proj = new Project( { valid_labels: [ { label: "   ", abbreviation: "fine", color: "#111111" }] });
      proj.validate(function(err) { expect(err.errors['valid_labels.0.label']).to.exist; done(); });
    });  

    /* Abbreviation errors */
    it('should fail validation if valid_labels contains an abbreviation that is too short', function(done) { 
      var proj = new Project( { valid_labels: [ { label: "fine", abbreviation: "", color: "#111111" }] });
      proj.validate(function(err) { expect(err.errors['valid_labels.0.abbreviation']).to.exist; done(); });
    }); 
    it('should fail validation if valid_labels contains an abbreviation that is too long', function(done) { 
      var proj = new Project( { valid_labels: [ { label: "fine", abbreviation: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", color: "#111111" }] });
      proj.validate(function(err) { expect(err.errors['valid_labels.0.abbreviation']).to.exist; done(); });
    });  
    it('should fail validation if valid_labels contains an abbreviation that is blank', function(done) { 
      var proj = new Project( { valid_labels: [ { label: "fine", abbreviation: "     ", color: "#111111" }] });
      proj.validate(function(err) { expect(err.errors['valid_labels.0.abbreviation']).to.exist; done(); });
    }); 

    /* Color errors */
    it('should fail validation if valid_labels contains an color that is not a color', function(done) { 
      var proj1 = new Project( { valid_labels: [ { label: "fine", abbreviation: "fine", color: "#111" }] });
      var proj2 = new Project( { valid_labels: [ { label: "fine", abbreviation: "fine", color: "red" }] });
      var proj3 = new Project( { valid_labels: [ { label: "fine", abbreviation: "fine", color: "" }] });
      var proj4 = new Project( { valid_labels: [ { label: "fine", abbreviation: "fine", color: "#1234g4" }] });
      cf.validateMany([proj1, proj2, proj3, proj4], function(err) { expect(err.errors['valid_labels.0.color']).to.exist }, done);
    }); 
    it('should pass validation for color if valid_labels contains a valid color', function(done) { 
      var proj = new Project( { valid_labels: [ { label: "fine", abbreviation: "fine", color: "#111111" }] });
      proj.validate(function(err) { expect(err.errors['valid_labels.0.color']).to.not.exist; done(); });
    }); 
   
    /* Missing attributes */
    it('should fail validation if valid_labels contains a label without a corresponding abbreviation', function(done) { 
      var proj = new Project( { valid_labels: [ { label: "fine", color: "#111111" }] });
      proj.validate(function(err) { expect(err.errors.valid_labels).to.exist; done(); });
    });
    it('should fail validation if valid_labels contains a label without a corresponding color', function(done) { 
      var proj = new Project( { valid_labels: [ { label: "fine", abbreviation: "     " }] });
      proj.validate(function(err) { expect(err.errors.valid_labels).to.exist; done(); });
    });
    it('should fail validation if valid_labels contains an abbreviation and color but not a label', function(done) { 
      var proj = new Project( { valid_labels: [ { abbreviation: "     ", color: "#111111" }] });
      proj.validate(function(err) { expect(err.errors.valid_labels).to.exist; done(); });
    });
    it('should fail validation if it has 0 valid_labels', function(done) { 
      var proj = new Project();
      proj.validate(function(err) { expect(err.errors.valid_labels).to.exist; done(); })
    });
    it('should fail validation if it has more than 20 valid_labels', function(done) { 
      var valid_label = { label: "test", abbreviation: "fine" }
      var proj = new Project( { valid_labels: [ ] });
      for(var i = 0; i < 21; i++) {
        proj.valid_labels.push(valid_label);
      }
      proj.validate(function(err) { expect(err.errors.valid_labels).to.exist; done(); });
    });   

    /* Duplicates in valid_labels */
    it('should fail validation if valid_labels contains more than one of the same label', function(done) { 
      var proj = new Project( { valid_labels: [ 
        { label: "fine", abbreviation: "fine", color: "#111111" },
        { label: "fine", abbreviation: "ok", color: "#222222" } ] });
      proj.validate(function(err) { expect(err.errors.valid_labels).to.exist; done(); });
    });
    it('should fail validation if valid_labels contains more than one of the same abbreviation', function(done) { 
      var proj = new Project( { valid_labels: [ 
        { label: "fine", abbreviation: "fine", color: "#111111" },
        { label: "ok",   abbreviation: "fine", color: "#222222" } ] });
      proj.validate(function(err) { expect(err.errors.valid_labels).to.exist; done(); });
    });
    it('should fail validation if valid_labels contains more than one of the same color', function(done) { 
      var proj = new Project( { valid_labels: [ 
        { label: "fine", abbreviation: "fine", color: "#111111" },
        { label: "fine",   abbreviation: "fine", color: "#111111" } ] });
      proj.validate(function(err) { expect(err.errors.valid_labels).to.exist; done(); });
    });

  });

  /* Valid object test */

  describe("Validity tests", function() {
  
    before(function(done) { cf.connectToMongoose(done); });
    after(function(done)  { cf.disconnectFromMongooseAndDropDb(done); });

    function createValidProject(n_labels, user_id) {
      var proj = new Project( {
        user_id: user_id == undefined ? rid() : user_id,
        project_name: "New Project"
      });
      for(var i = 0; i < n_labels; i++) {
        var valid_label = { label: "test-" + i, abbreviation: "b-" + i, color: "#" + ("000000" + i).substr(-6, 6) }
        proj.valid_labels.push(valid_label);
      }      
      return proj;
    }
    function createValidUser(done) {
      var user = new User( {
        email:    "misming@nootnoot.com",
        username: "Pingu",
        password: "nootnoot"
      });
      user.save(function(err) {
        done(user);
      })
    }

    it('should pass validation if everything is OK', function(done) { 
      projs = [createValidProject(1), createValidProject(4), createValidProject(7), createValidProject(18)];
      cf.validateMany(projs, function(err) { expect(err).to.not.exist; }, done);
    });
    it('should pass saving if everything is OK', function(done) {
      createValidUser(function(user) {
        projs = [createValidProject(1, user._id), createValidProject(4, user._id), createValidProject(7, user._id), createValidProject(18, user._id)];
        cf.saveMany(projs, function(err) { expect(err).to.not.exist; }, done);
      });
  
    });
  });   
})





