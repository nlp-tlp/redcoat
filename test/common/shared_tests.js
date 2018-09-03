var expect = require('chai').expect;
var cf     = require('./common_functions');
var rid = require('mongoose').Types.ObjectId;


function runProjectNameTests(model, done) {
  describe("project_name", function() {
    it('should fail validation if it does not have a project name', function(done) { 
      var proj = new model();
      proj.validate(function(err) { expect(err.errors.project_name).to.exist; done(); });
    });
    it('should fail validation if the name is too short', function(done) { 
      var proj = new model({ project_name: "" });
      proj.validate(function(err) { expect(err.errors.project_name).to.exist; done(); });
    });
    it('should fail validation if the name is too long', function(done) { 
      var proj = new model({ project_name: cf.createStringOfLength(101) }); 
      proj.validate(function(err) { expect(err.errors.project_name).to.exist; done(); });
    });
    it('should fail validation if the name is blank', function(done) { 
      var proj = new model({ project_name: "      " });      
      proj.validate(function(err) { expect(err.errors.project_name).to.exist; done(); });
    });
    it('should pass validation (for project_name) if the name is OK', function(done) { 
      var proj = new model({ project_name: "Cool project." });
      proj.validate(function(err) { expect(err.errors.project_name).to.not.exist; done(); });
    });
  });
}

function runProjectDescriptionTests(model, done) {
  describe("project_description", function() {

    it('should fail validation if the description is too short', function(done) { 
      var proj = new model({ project_description: "" });
      proj.validate(function(err) { expect(err.errors.project_description).to.exist; done(); });
    });
    it('should fail validation if the description is too long', function(done) { 
      var proj = new model({ project_description: cf.createStringOfLength(510) }); // 51 chars
      proj.validate(function(err) { expect(err.errors.project_description).to.exist; done(); });
    });
    it('should fail validation if the description is blank', function(done) { 
      var proj = new model({ project_description: "    " });
      proj.validate(function(err) { expect(err.errors.project_description).to.exist; done(); });
    });
    it('should pass validation (for project_description) if description is missing', function(done) { 
      var proj = new model({ });
      proj.validate(function(err) { expect(err.errors.project_description).to.not.exist; done(); });
    });    
    it('should pass validation (for project_description) if the description is OK', function(done) { 
      var proj = new model({ project_description: "This is a nice description." });
      proj.validate(function(err) { expect(err.errors.project_description).to.not.exist; done(); });
    });    
  });
}

function runProjectUserIdTests(model, done) {
  describe("user_id", function() {

    
    afterEach(function(done)  { cf.dropMongooseDb(done); });

    it('should fail validation if user_id is absent or blank', function(done) { 
      var proj1 = new model( {  } );
      var proj2 = new model( { user_id: "" });
      proj1.validate(function(err) { 
        expect(err.errors.user_id).to.exist;
        proj2.validate(function(err) { 
          expect(err.errors.user_id).to.exist;
          done();
        });
      });          
    }); 

    it('should fail to save if user_id does not exist in the Users collection', function(done) { 
      var proj = new model( { 
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
        model.count({}, function(err, count) {
          expect(count).to.equal(0);
          done();
        });
      });
    }); 
  });  
}

function runProjectUserIdsTests(model, done) {
  describe("user_ids", function() {

    var user1, user2, user3;

    beforeEach(function(done) { 
      user1 = cf.createValidUser();
      user2 = cf.createValidUser();
      user3 = cf.createValidUser();
      cf.registerUsers([user1, user2, user3], function(err) { }, done);
    });
    afterEach(function(done)  { cf.dropMongooseDb(done); });

    it('should fail validation if user_ids contains the same user twice', function(done) {

      var proj1 = cf.createValidProjectOrWIPP(model, 1, user1._id);

      proj1.user_ids.push(user2._id);
      proj1.user_ids.push(user3._id);
      proj1.user_ids.push(user3._id);

      proj1.validate(function(err) {
        expect(err.errors.user_ids).to.exist;
        done();
      });  

    });

    it('should place the admin of the project into user_ids', function(done) {
      var proj1 = cf.createValidProjectOrWIPP(model, 1, user1._id);
      proj1.validate(function(err) { 
        expect(err).to.not.exist;
        proj1.save(function(err, proj) {
          expect(proj.user_ids).to.include(user1._id); 
          done();
        });
      });         
    }); 

    it('should pass validation if the project creator is already in the users array prior to validation', function(done) {

      var proj1 = cf.createValidProjectOrWIPP(model, 1, user1._id);

      proj1.user_ids.push(user1._id); // Same as creator, but should still validate correctly because it won't be added twice
      proj1.user_ids.push(user2._id);
      proj1.validate(function(err) {
        expect(err).to.not.exist;
        expect(proj1.user_ids.length).to.equal(2);
        done();
      });
    });
  });
}

// function runProjectValidLabelsTests(model, done) {
//   describe("valid_labels", function() {

//     /* Label errors */
//     it('should fail validation if valid_labels contains a label that is too short', function(done) { 
//       var proj = new model( { valid_labels: [ { label: "", abbreviation: "fine", color: "#111111" }] });
//       proj.validate(function(err) { expect(err.errors.valid_labels).to.exist; done(); });
//     }); 
//     it('should fail validation if valid_labels contains a label that is too long', function(done) { 
//       var proj = new model( { valid_labels: [ { label: cf.createStringOfLength(30), abbreviation: "fine", color: "#111111" }] });
//       proj.validate(function(err) { expect(err.errors.valid_labels).to.exist; done(); });
//     });  
//     it('should fail validation if valid_labels contains a label that is blank', function(done) { 
//       var proj = new model( { valid_labels: [ { label: "   ", abbreviation: "fine", color: "#111111" }] });
//       proj.validate(function(err) { expect(err.errors.valid_labels).to.exist; done(); });
//     });  

//     /* Abbreviation errors */
//     it('should fail validation if valid_labels contains an abbreviation that is too short', function(done) { 
//       var proj = new model( { valid_labels: [ { label: "fine", abbreviation: "", color: "#111111" }] });
//       proj.validate(function(err) { expect(err.errors.valid_labels).to.exist; done(); });
//     }); 
//     it('should fail validation if valid_labels contains an abbreviation that is too long', function(done) { 
//       var proj = new model( { valid_labels: [ { label: "fine", abbreviation: cf.createStringOfLength(30), color: "#111111" }] });
//       proj.validate(function(err) { expect(err.errors.valid_labels).to.exist; done(); });
//     });  
//     it('should fail validation if valid_labels contains an abbreviation that is blank', function(done) { 
//       var proj = new model( { valid_labels: [ { label: "fine", abbreviation: "     ", color: "#111111" }] });
//       proj.validate(function(err) { expect(err.errors.valid_labels).to.exist; done(); });
//     }); 

//     /* Color errors */
//     it('should fail validation if valid_labels contains an color that is not a color', function(done) { 
//       var proj1 = new model( { valid_labels: [ { label: "fine", abbreviation: "fine", color: "#111" }] });
//       var proj2 = new model( { valid_labels: [ { label: "fine", abbreviation: "fine", color: "red" }] });
//       var proj3 = new model( { valid_labels: [ { label: "fine", abbreviation: "fine", color: "" }] });
//       var proj4 = new model( { valid_labels: [ { label: "fine", abbreviation: "fine", color: "#1234g4" }] });
//       var proj5 = new model( { valid_labels: [ { label: "fine", abbreviation: "fine", color: "" }] });
//       var proj6 = new model( { valid_labels: [ { label: "fine", abbreviation: "fine", color: " #111" }] });
//       var proj7 = new model( { valid_labels: [ { label: "fine", abbreviation: "fine", color: "   " }] });
//       cf.validateMany([proj1, proj2, proj3, proj4, proj5, proj6, proj7], function(err) { expect(err.errors['valid_labels.0.color']).to.exist }, done);
//     }); 
//     it('should pass validation for color if valid_labels contains a valid color', function(done) { 
//       var proj = new model( { valid_labels: [ { label: "fine", abbreviation: "fine", color: "#111111" }] });
//       proj.validate(function(err) { expect(err.errors['valid_labels.0.color']).to.not.exist; done(); });
//     }); 
   
//     /* Missing attributes */
//     it('should fail validation if valid_labels contains a valid_label with no label', function(done) { 
//       var proj = new model( { valid_labels: [ { abbreviation: "xxx", color: "#111111" }] });
//       proj.validate(function(err) { expect(err.errors.valid_labels).to.exist; done(); });
//     });
//     it('should fail validation if valid_labels contains a valid_label with no abbreviation', function(done) { 
//       var proj = new model( { valid_labels: [ { label: "fine", color: "#111111" }] });
//       proj.validate(function(err) { expect(err.errors.valid_labels).to.exist; done(); });
//     });
//     it('should fail validation if valid_labels contains a valid_label with no color', function(done) { 
//       var proj = new model( { valid_labels: [ { label: "fine", abbreviation: "xxx" }] });
//       proj.validate(function(err) { expect(err.errors.valid_labels).to.exist; done(); });
//     });
//     it('should fail validation if it has 0 valid_labels', function(done) { 
//       var proj = new model();
//       proj.validate(function(err) { expect(err.errors.valid_labels).to.exist; done(); })
//     });
//     it('should fail validation if it has more than 20 valid_labels', function(done) { 
//       var valid_label = { label: "test", abbreviation: "fine" }
//       var proj = new model( { valid_labels: [ ] });
//       for(var i = 0; i < 21; i++) {
//         proj.valid_labels.push(valid_label);
//       }
//       proj.validate(function(err) { expect(err.errors.valid_labels).to.exist; done(); });
//     });   

//     /* Duplicates in valid_labels */
//     it('should fail validation if valid_labels contains more than one of the same label', function(done) { 
//       var proj = new model( { valid_labels: [ 
//         { label: "fine", abbreviation: "fine", color: "#111111" },
//         { label: "fine", abbreviation: "ok", color: "#222222" } ] });
//       proj.validate(function(err) { expect(err.errors.valid_labels).to.exist; done(); });
//     });
//     it('should fail validation if valid_labels contains more than one of the same abbreviation', function(done) { 
//       var proj = new model( { valid_labels: [ 
//         { label: "fine", abbreviation: "fine", color: "#111111" },
//         { label: "ok",   abbreviation: "fine", color: "#222222" } ] });
//       proj.validate(function(err) { expect(err.errors.valid_labels).to.exist; done(); });
//     });
//     it('should pass validation if valid_labels contains more than one of the same color', function(done) { 
//       var proj = new model( { valid_labels: [ 
//         { label: "fine1", abbreviation: "fine1", color: "#111111" },
//         { label: "fine2",   abbreviation: "fine2", color: "#111111" } ] });

//       proj.validate(function(err) { expect(err.errors.valid_labels).to.not.exist; done(); });
//     });

//     /* Protected terms */
//     it('should fail validation if valid_labels contains the label or abbreviation \"O\"', function(done) { 
//       var proj1 = new model( { valid_labels: [ 
//         { label: "O", abbreviation: "fine", color: "#111111" },
//         { label: "fine", abbreviation: "ok", color: "#222222" } ] });
//       var proj2 = new model( { valid_labels: [ 
//         { label: "fine", abbreviation: "fine", color: "#111111" },
//         { label: "fine", abbreviation: "O", color: "#222222" } ] });
//       var proj3 = new model( { valid_labels: [ 
//         { label: "fine", abbreviation: "fine", color: "#111111" },
//         { label: "fine", abbreviation: "o", color: "#222222" } ] });
//       proj1.validate(function(err) { 
//         expect(err.errors.valid_labels).to.exist;
//         proj2.validate(function(err) { 
//           expect(err.errors.valid_labels).to.exist;
//           proj3.validate(function(err) { 
//             expect(err.errors.valid_labels).to.exist;
//             done();
//           });
//         });
//       });
//     });
//   });
// }

function runDocumentTests(model, done) {
  describe("documents", function() {
    /* Document count */
    it('should fail validation if it does not have any documents', function(done) { 
      var obj = new model();
      obj.validate(function(err) { expect(err.errors.documents).to.exist; done(); });
    });
    it('should fail validation if it has too many documents', function(done) { 
      var obj = new model({ documents: cf.createValidDocuments(12) } );
      obj.validate(function(err) { expect(err.errors.documents).to.exist; done(); });
    });
    it('should pass validation for documents if it has a suitable number of valid documents', function(done) { 
      var obj = new model({ documents: cf.createValidDocuments(7) } );
      obj.validate(function(err) { expect(err.errors.documents).to.not.exist; done(); });
    });

    /* Document length */
    it('should fail validation if it contains a document that is empty', function(done) { 
      var obj = new model({ documents: [ [], ["this", "one", "is", "ok"] ] } );
      obj.validate(function(err) { expect(err.errors.documents).to.exist; done(); });
    });    
    it('should fail validation if it contains a document that is too long', function(done) { 
      var obj = new model({ documents: [ cf.createTooLongDocument() ] } );
      obj.validate(function(err) { expect(err.errors.documents).to.exist; done(); });
    });    

    /* Document token count */
    it('should fail validation if it contains a document with an empty token', function(done) { 
      var obj = new model({ documents: [ ["", "is", "not", "ok"] ] } );
      obj.validate(function(err) { expect(err.errors.documents).to.exist; done(); });
    });    
    it('should fail validation if it contains a document with a token that is too long', function(done) { 
      var obj = new model({ documents: [[cf.createStringOfLength(150), "is", "not", "ok"]] } );
      obj.validate(function(err) { expect(err.errors.documents).to.exist; done(); });
    });
  });
}

module.exports = {
  runProjectNameTests: runProjectNameTests,
  runProjectDescriptionTests: runProjectDescriptionTests,
  runProjectUserIdTests: runProjectUserIdTests,
  runProjectUserIdsTests: runProjectUserIdsTests,
  //runProjectValidLabelsTests: runProjectValidLabelsTests,
  runDocumentTests: runDocumentTests,
}