require('rootpath')();
var logger = require('config/winston');

var express = require('express');
var router = express.Router();
var projectController = require("app/controllers/project_controller");
var newProjectController = require("app/controllers/new_project_controller");

var Project = require('app/models/project');


isLoggedIn = function(req, res, next) {
	if(!req.user) return res.status(401).send(new Error("Error: user is not logged in"))
	next();
}

verifyUserOwnsProject = function(req, res, next) {

	if(!req.user) return res.status(401).send(new Error("Error: user is not logged in"))

	Project.findById(req.params.id, function(err, proj) {
		if(err || proj === null) { return res.send("Error: Project does not exist")}
		if(!proj.projectCreatedByUser(req.user._id)) return res.status(403).send("Error: user does not own project");
		next();		
	});
}


verifyUserInProject = function(req, res, next) {

	if(!req.user) return res.status(401).send(new Error("Error: user is not logged in"))

	Project.findById(req.params.id, function(err, proj) {

		//console.log(req.user._id, proj.user_ids.active)
		//console.log(err, proj);
		if(err || proj === null) { return res.status(404).send(new Error("Error: Project does not exist"))}
		if(!proj.projectHasUser(req.user._id)) return res.status(403).send(new Error("Error: user does not belong to project"));
		next();
	});
}

router.get('/', isLoggedIn, projectController.getProjects);
//router.get('/joined', projectController.getProjects);



//router.get('/',            projectController.index);



router.get('/:id',         verifyUserInProject, projectController.getProjectDetails);
//router.get('/:id/tagging', verifyUserInProject, projectController.tagging);
//router.get('/:id/tagging', verifyUserInProject, projectController.tagging);








router.get ('/:id/tagging/getDocumentGroup', verifyUserInProject, projectController.getDocumentGroup);
router.post('/:id/tagging/modify_hierarchy', verifyUserInProject, projectController.modifyHierarchy);
router.post('/:id/tagging/submitAnnotations', verifyUserInProject, projectController.submitAnnotations);


router.get('/:id/curation', verifyUserInProject, projectController.getCurationDocument);

router.get('/:id/download_annotations/:user_id', verifyUserInProject, projectController.downloadAnnotationsOfUser);
router.get('/:id/download_combined_annotations', verifyUserInProject, projectController.downloadCombinedAnnotations);


router.post('/:id/comments/submit', verifyUserInProject, projectController.submitComment);

router.post('/invitations/:id/accept', isLoggedIn, projectController.acceptInvitation);
router.post('/invitations/:id/decline', isLoggedIn, projectController.declineInvitation);

//router.get('/new', newProjectController.getWipProject);

router.get('/new/get' , isLoggedIn, newProjectController.getFormPage);

router.get('/new/searchUsers', isLoggedIn, newProjectController.searchUsers);

router.post('/new/submit', isLoggedIn, newProjectController.submitFormPage);

router.post('/new/submitFinal', isLoggedIn, newProjectController.submitFormPageFinal);
//router.get('/new/clear' , newProjectController.clearFormPage);




module.exports = router;