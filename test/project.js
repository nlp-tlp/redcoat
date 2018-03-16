var mongoose = require('mongoose');
var expect = require('chai').expect;
 



var Project = require('../models/project');
 
describe('Projects', function() {

  /* project_name */

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

  /* valid_labels */

  it('should fail validation if valid_labels contains a label that is too short', function(done) { 
    var proj = new Project( { valid_labels: [ { label: "", abbreviation: "fine" }] });
    proj.validate(function(err) { expect(err.errors['valid_labels.0.label']).to.exist; done(); });
  }); 
  it('should fail validation if valid_labels contains a label that is too long', function(done) { 
    var proj = new Project( { valid_labels: [ { label: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", abbreviation: "fine" }] });
    proj.validate(function(err) { expect(err.errors['valid_labels.0.label']).to.exist; done(); });
  });  
  it('should fail validation if valid_labels contains a label that is blank', function(done) { 
    var proj = new Project( { valid_labels: [ { label: "   ", abbreviation: "fine" }] });
    proj.validate(function(err) { expect(err.errors['valid_labels.0.label']).to.exist; done(); });
  });  
  it('should fail validation if valid_labels contains an abbreviation that is too short', function(done) { 
    var proj = new Project( { valid_labels: [ { label: "fine", abbreviation: "" }] });
    proj.validate(function(err) { expect(err.errors['valid_labels.0.abbreviation']).to.exist; done(); });
  }); 
  it('should fail validation if valid_labels contains an abbreviation that is too long', function(done) { 
    var proj = new Project( { valid_labels: [ { label: "fine", abbreviation: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" }] });
    proj.validate(function(err) { expect(err.errors['valid_labels.0.abbreviation']).to.exist; done(); });
  });  
  it('should fail validation if valid_labels contains an abbreviation that is blank', function(done) { 
    var proj = new Project( { valid_labels: [ { label: "fine", abbreviation: "     " }] });
    proj.validate(function(err) { expect(err.errors['valid_labels.0.abbreviation']).to.exist; done(); });
  }); 
  it('should fail validation if valid_labels contains a label without a corresponding abbreviation', function(done) { 
    var proj = new Project( { valid_labels: [ { label: "fine" }] });
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


  it('should fail validation if valid_labels contains more than one of the same label', function(done) { 
    var proj = new Project( { valid_labels: [ 
      { label: "fine", abbreviation: "fine" },
      { label: "fine", abbreviation: "ok" } ] });
    proj.validate(function(err) { expect(err.errors.valid_labels).to.exist; done(); });
  });

  it('should fail validation if valid_labels contains more than one of the same abbreviation', function(done) { 
    var proj = new Project( { valid_labels: [ 
      { label: "fine", abbreviation: "fine" },
      { label: "ok",   abbreviation: "fine" } ] });
    proj.validate(function(err) { expect(err.errors.valid_labels).to.exist; done(); });
  });


  // Fail when labels are duplicates
  // Fail when abbrevs are duplicates

  it('should pass validation if everything is OK', function(done) { 
    
    function createProject(n_labels) {
      var proj = new Project( {
        user_id: mongoose.Types.ObjectId(), // User doesn't exist, but it will validate (just not save).
        project_name: "New Project"
      });
      for(var i = 0; i < n_labels; i++) {
        var valid_label = { label: "test-" + i, abbreviation: "b-" + i }
        proj.valid_labels.push(valid_label)
      }      
      return proj
    }

    proj = createProject(4);
    proj.validate(function(err) { expect(err).not.to.exist; done(); });
  
  });

  // Need to add colours for labels at some point





  /* Don't think project needs to connect */
  /*
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
  */

})









