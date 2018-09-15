var cf = require('./common/common_functions');
var expect = require('chai').expect;
var Project = require('../models/project');
var WipProject = require('../models/wip_project');
var User = require('../models/user');
var DocumentGroup = require('../models/document_group');
var DocumentGroupAnnotation = require('../models/document_group_annotation');
var rid = require('mongoose').Types.ObjectId;
var st = require('./common/shared_tests');



describe('WIP Projects', function() {

  before(function(done) {
    cf.connectToMongoose(done);
  });
  after(function(done) {
    cf.disconnectFromMongoose(done);
  });

  

  st.runProjectNameTests(WipProject);
  st.runProjectDescriptionTests(WipProject);
  st.runProjectUserIdTests(WipProject);

  describe("user_id (2)", function() {

    after(function(done) {
      cf.dropMongooseDb(done);
    });

    var user1, user2;

    before(function(done) {
      user1 = cf.createValidUser();
      user2 = cf.createValidUser();
      cf.registerUsers([user1, user2], function(err) { }, done);
    })
    afterEach(function(done)  { cf.dropMongooseDb({ except: "users" }, done); });

    it('should fail to save if another wip_project has the same user_id', function(done) { 
      var proj1 = cf.createValidProjectOrWIPP(WipProject, 1, user1._id);
      var proj2 = cf.createValidProjectOrWIPP(WipProject, 1, user1._id);
      proj1.save(function(err, proj1) { 
        expect(err).to.not.exist;
        proj2.save(function(err, proj2) { 
          expect(err).to.exist;
          done();
        });
      });
    });

    it('should fail to save if user_id is not the same as it was when the wip_project was created', function(done){ 

      var proj = cf.createValidProjectOrWIPP(WipProject, 1, user1._id);

      proj.save(function(err, proj) { 
        expect(err).to.not.exist;
        proj.user_id = user2._id;
        proj.save(function(err, proj) {
          expect(err).to.exist;
          done();
        });
      });
    });
  });


  describe("category_hierarchy", function() {
    afterEach(function(done) {
      cf.dropMongooseDb(done);
    });

    var wipp;
    var user;

    // A recursive async function that ensures a set of cases all fail.
    // cases is an array of [category_hierarchy, error_line].
    function ensureFail(cases, done) {
      var c = cases.pop(); 
      var category_hierarchy = c[0];     
      var error_line = c[1];
      wipp.category_hierarchy = category_hierarchy;
      var err = wipp.validate(function(err) {
        expect(err.errors.category_hierarchy).to.exist;
        var em = err.errors.category_hierarchy.message;
        var eml = parseInt(em.slice(em.indexOf("<%") + 2, em.indexOf("%>"))); 
        expect(eml).to.equal(error_line);
        if(cases.length == 0) {
          done();
        } else {
          ensureFail(cases, done);
        }
      });
    }

    // A recursive function that ensures a set of cases all pass.
    // Similar to ensureFail, but there's no need for error_line.
    function ensurePass(cases, done) {
      var category_hierarchy = cases.pop();      
      wipp.category_hierarchy = category_hierarchy;
      var err = wipp.validate(function(err) {
        if(cases.length == 0) {
          done();
        } else {
          expect(err.errors.category_hierarchy).to.not.exist;
          ensurePass(cases, done);
        }
      });
    }


    beforeEach(function(done) {
      user = cf.createValidUser();
      wipp = new WipProject();
      wipp.user_id = user;
      cf.registerUsers([user], function(err) { }, done);
    })

    it("should fail validation if a category contains an empty label", function(done) {
      ensureFail([[[""], 0]], done);
    });

    it("should fail validation if a category is O", function(done) {
      ensureFail([[["O"], 0],
                  [["test", "test/O"], 1]],
                  done);
    });

    it("should fail validation if a top-level category begins with a slash", function(done) {
      ensureFail([[["/test"], 0]], done);
    });

    it("should fail validation if a category ends with a slash", function(done) {
      ensureFail([[["test/"], 0]], done);
    });

    it("should fail validation if a category contains a blank label", function(done) {
      ensureFail([[["t1", "t1/test", "t1/  "], 2],
                  [["t7", "t7/test", "t7/test/       ", "t7/test/test"], 2],
                  [["t4a", "t4a/test", "t4a/test/test", "t4a/test/ "], 3]],
                  done);
    });

    it("should fail validation if a category contains two slashes", function(done) {
      ensureFail([[["t1", "t1//", "t1/test"], 1],
                  [["//"], 0],
                  [["t4", "t4/test", "t4/test//", "t4/test/3s"], 2]],
                  done);    
    });

    it("should fail validation if two top-level categories are the exact same", function(done) {
      ensureFail([[["test", "test"], 1]], done);
    });

    it("should fail validation if two child categories are the same", function(done) {
      ensureFail([[["t1", "t1/test", "t1/test"], 2],
                  [["t7", "t7/test", "t7/test/test", "t7/test/test"], 3],
                  [["t4", "t4/test", "t4/test/3s", "t4/test/3s"], 3]],
                  done);
    });

    it("should fail validation if categories are declared out of order", function(done) {
      ensureFail([[["t1", "t1/test", "t1/test/test", "t1/test/fish", "t1/test/test/fish"], 4],
                  [["t2", "t2/test", "t2/fish", "t2/test/test"], 3]],
                  done);
    });

    it("should fail validation if a child's parent category wasn't previously declared", function(done) {
      ensureFail([[["test/test"], 0],
                  [["test", "test/test", "test/test/test/test"], 2],
                  [["test", "test/test", "hello/test"], 2],
                  [["test", "test/test", "hello/test/test"], 2],
                  [["test", "test/test", "test/test/test", "test/test/test/test", "test/hello", "test/heloooo/hi"], 5],
                  [["test", "test/test", "test/hello", "test/test/hello/test"], 3]],
                  done);
    });

    it("should fail validation if the hierarchy contains a category that is too long", function(done) {
      ensureFail([[["t1", "t1/test", "t1/test/test", "t1/test/test/" + cf.createStringOfLength(500)], 3],
                  [[cf.createStringOfLength(500)], 0]],
                  done);
    });

    // Validity tests
    it("should pass validation if two child categories are the same but have different parents", function(done) {
      ensurePass([["t1", "t1/test", "t2", "t2/test"],
                  ["t1", "t1/test", "t2", "t2/test", "t3", "t3/test"]],
                  done);
    });    

    it("should pass validation if the category hierarchy is OK", function(done) {
      ensurePass([["root", "root/node_1", "root/node_1/node_1a", "root/node_2", "root/node_2/node_2a", "root/node_2/node_2a/node_2aa"], 
                  ["root", "root/node_1", "root/node_1/node_1a", "root/node_1/node_1a/node3a", "root/node_2", "root/node_2/node_2a"], 
                  ["a", "a/b", "a/b/c", "a/b/c/d", "a/b/c/d/e", "a/b/c/d/e/f", "a/c", "a/c/d", "a/c/d/e", "a/c/d/e/f", "a/d", "a/d/e"],
                  ["Person", "Organisation", "Organisation/test", "Location", "Miscellaneous"],
                  ["Person", "Organisation", "Organisation/test", "Organisation/test/test", "Location", "Miscellaneous"]],
                  done);


    });

    it("should pass validation if a category contains a backslash", function(done) {
      ensurePass([["t1\\", "t1\\/test"],
                  ["t1", "t1/test\\", "t1/test\\/test"]],
                  done);
    });    

  });


  //st.runProjectValidLabelsTests(WipProject);


  describe("user_emails", function() {

    afterEach(function(done) {
      cf.dropMongooseDb(done);
    });

    var wipp;
    var user;


    beforeEach(function(done) {
      user = cf.createValidUser();
      wipp = new WipProject();
      wipp.user_id = user;
      cf.registerUsers([user], function(err) { }, done);
    })


    it("should correctly set user_emails if all emails are valid", function(done) {

      var emails = [
        "test@test.com",
        "noot@noot.com",
        "pingu@pingu.com"
      ]
      wipp.user_emails = emails;
      wipp.save(function(err, wip_project) {
        expect(wip_project.user_emails.length).to.equal(3);
        done();
      });
    });

    it("should correctly set user_emails if one email is blank", function(done) {      
      var emails = [
        "test@test.com",
        "   ",
        "pingu@pingu.com"
      ]
      wipp.user_emails = emails;
      wipp.save(function(err, wip_project) {
        expect(wip_project.user_emails.length).to.equal(2);
        done();
      });
    });

    it("should correctly set user_emails if one email is invalid", function(done) {      
      var emails = [
        "test@test.com",
        "noo0oot",
        "pingu@pingu.com"
      ]
      wipp.user_emails = emails;
      wipp.save(function(err, wip_project) {
        expect(wip_project.user_emails.length).to.equal(2);
        done();
      });
    });
    it("should correctly set user_emails if it contains too many emails", function(done) {      
      var emails = [];
      for(var i = 0; i < 230; i++) {
        emails.push("a" + i + "@a.com");
      }
      wipp.user_emails = emails;
      wipp.save(function(err, wip_project) {
        expect(wip_project.user_emails.length).to.equal(100);
        done();
      });
    });
    it("should correctly set user_emails if it contains too many emails, but the emails are duplicates", function(done) {      
      var emails = [];
      for(var i = 0; i < 230; i++) {
        emails.push("a@a.com");
      }
      wipp.user_emails = emails;
      wipp.save(function(err, wip_project) {
        expect(wip_project.user_emails.length).to.equal(1);
        done();
      });
    });
  });

  //st.runDocumentTests(WipProject);

  

  describe("Static methods", function() {

    afterEach(function(done) {
      cf.dropMongooseDb(done);
    });

    describe("findWipByUserId", function() {
      it("should correctly return the wip_project belonging to a certain user", function(done) {
        var user = cf.createValidUser();
        var wip = new WipProject();
        wip.user_id = user._id;
         cf.registerUsers([user], function(err) { expect(err).to.not.exist; }, function() {
          wip.save(function(err) {
            WipProject.findWipByUserId(user._id, function(err, wip_project) {
              expect(err).to.not.exist;
              expect(wip_project._id).to.eql(wip._id);
              done();
            });
          });
        });
      });
    });
  });


  describe("Cascade delete", function() {
    //
    afterEach(function(done) {
      cf.dropMongooseDb(done);
    })

    it("should correctly delete all associated DocumentGroups when deleted", function(done) {
      this.timeout(3000);
      var sents1 = "";
      var sents2 = "";
      for(var i = 0; i < 1951; i++) {
        sents1 += "hello there\n";
        sents2 += "whats up\n";
      }
      var user1 = cf.createValidUser();
      var user2 = cf.createValidUser();

      var wip1 = new WipProject({user_id: user1._id, file_metadata: { "Filename": "test1.txt"} });
      var wip2 = new WipProject({user_id: user2._id, file_metadata: { "Filename": "test2.txt"} });

      cf.registerUsers([user1, user2], function(err) { expect(err).to.not.exist; }, function() {
        cf.saveMany([wip1, wip2], function(err) { expect(err).to.not.exist; }, function() {
          wip1.createDocumentGroupsFromString(sents1, function(err, number_of_lines, number_of_tokens) {
            expect(err).to.not.exist;
            expect(wip1.file_metadata["Filename"]).to.eql("test1.txt");
            wip2.createDocumentGroupsFromString(sents2, function(err, number_of_lines, number_of_tokens) {
              DocumentGroup.count(function(err, count) {
                expect(count).to.equal(392);
                wip1.remove(function(err) {
                  WipProject.count(function(err, count) {
                    expect(count).to.equal(1);
                    DocumentGroup.count(function(err, count) {
                      expect(count).to.equal(196);   
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

  describe("Instance methods", function() {

    var wip;
    var sents = "hello there my name is michael.\nwhat's going on?";
    var correctly_tokenized_sents = [
        ["hello", "there", "my", "name", "is", "michael", "."],
        ["what", '\'s', "going", "on", "?"]
      ];   

    beforeEach(function(done) {
      wip = new WipProject(); done();
    });

    after(function(done) {
      cf.dropMongooseDb(done);
    });



    describe("tokenizeString", function() {
      it("should correctly tokenize a given string", function(done) {
        wip.tokenizeString(sents, function(err, tokenized_sents) {
          expect(err).to.not.exist;
          expect(tokenized_sents).to.eql(correctly_tokenized_sents);
          done();
        });
      });
      it("should correctly tokenize a given string when it has extra newline characters or whitespace characters", function(done) {
        var sents1 = "hello there my name is michael.\n\n\nwhat's going on?";
        var sents2 = "hello there my name      is michael.\n        \n                    \nwhat's        \t\t     going on?";
        wip.tokenizeString(sents1, function(err, tokenized_sents) {
          expect(err).to.not.exist;
          expect(tokenized_sents).to.eql(correctly_tokenized_sents);
          wip.tokenizeString(sents2, function(err, tokenized_sents) {
            expect(err).to.not.exist;
            expect(tokenized_sents).to.eql(correctly_tokenized_sents);
            done();
          });          
        });
      });
    });

    describe("createDocumentsFromString", function() {

      after(function(done) {
        cf.dropMongooseDb(done);
      })

      it("should correctly create DocumentGroups for every 10 documents in a string, and validate them", function(done) {        
        var sents1 = "hello there my name is michael.\n\nwhat's going on?\nthree\nfour\nfive\nsix\nseven\neight\nnine\nten\neleven\ntwelve";       

        wip.createDocumentGroupsFromString(sents1, function(err) {
          DocumentGroup.count( { project_id : wip._id} , function(err, count) {
            expect(count).to.equal(2);
            
            wip2 = new WipProject();
            wip2.createDocumentGroupsFromString(sents, function(err) {
              DocumentGroup.findOne( {project_id: wip2._id}, function(err, doc) {
                expect(doc.documents).to.eql(correctly_tokenized_sents);
                done();
              });
            });
          });
        });
      });

      it("should return an error when given a string containing a document with a token that is too long", function(done) {
        var sents = cf.createStringOfLength(1500) + " there\nhow are you?\n";
        wip.createDocumentGroupsFromString(sents, function(err) {
          expect(err.errors.documents).to.exist;
          done();
        });
      });

      it("should return an error when given a string containing too many documents", function(done) {
        this.timeout(4000);
        var sents = "";
        for(var i = 0; i < 120050; i++) {
          sents += "hello there\n";
        }
        wip.createDocumentGroupsFromString(sents, function(err) {
          expect(err.errors.documents).to.exist;
          done();
        });
      });

      it("should correctly create DocumentGroups from a string when that string contains nearly 100,000 documents", function(done) {
        this.timeout(4000);
        var sents = "";
        for(var i = 0; i < 99951; i++) {
          sents += "hello there\n";
        }
        wip.createDocumentGroupsFromString(sents, function(err, number_of_lines, number_of_tokens) {
          expect(err).to.not.exist;
          expect(number_of_lines).to.equal(99951);
          expect(number_of_tokens).to.equal(99951 * 2);
          DocumentGroup.count( { project_id : wip._id} , function(err, count) {
            expect(count).to.equal(9996);
            done();
          });          
        });
      });

    });


    describe("deleteDocumentsAndMetadataAndSave", function() {

      after(function(done) {
        cf.dropMongooseDb(done);
      })

      it("should correctly delete all associated DocumentGroups (but not unassociated ones) and clear the file_metadata field", function(done) {
        this.timeout(4000);
        var sents1 = "";
        var sents2 = "";
        for(var i = 0; i < 1951; i++) {
          sents1 += "hello there\n";
          sents2 += "whats up\n";
        }
        var user1 = cf.createValidUser();
        var user2 = cf.createValidUser();

        var wip1 = new WipProject({user_id: user1._id, file_metadata: { "Filename": "test1.txt"} });
        var wip2 = new WipProject({user_id: user2._id, file_metadata: { "Filename": "test2.txt"} });

        cf.registerUsers([user1, user2], function(err) { expect(err).to.not.exist; }, function() {
          cf.saveMany([wip1, wip2], function(err) { expect(err).to.not.exist; }, function() {
            wip1.createDocumentGroupsFromString(sents1, function(err, number_of_lines, number_of_tokens) {
              expect(err).to.not.exist;
              expect(wip1.file_metadata["Filename"]).to.eql("test1.txt");
              wip2.createDocumentGroupsFromString(sents2, function(err, number_of_lines, number_of_tokens) {
                DocumentGroup.count(function(err, count) {
                  expect(count).to.equal(392);
                  wip1.deleteDocumentsAndMetadataAndSave(function(err, wip) {
                    expect(err).to.not.exist;
                    expect(wip.file_metadata["Filename"]).to.eql(undefined);
                    DocumentGroup.count(function(err, count) {
                      expect(count).to.equal(196);
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





