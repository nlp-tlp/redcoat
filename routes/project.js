require('rootpath')();
var logger = require('config/winston');

var express = require('express');
var router = express.Router();
var projectController = require("app/controllers/project_controller");

var Project = require('app/models/project');

verifyUserOwnsProject = function(req, res, next) {
	Project.findById(req.params.id, function(err, proj) {
		if(!proj.projectCreatedByUser(req.user._id)) return res.send("Error: user does not own project");
		next();		
	});
}

verifyUserInProject = function(req, res, next) {
	Project.findById(req.params.id, function(err, proj) {
		if(!proj.projectHasUser(req.user._id)) return res.send("Error: user does not belong to project");
		next();
	});
}

router.get('/getprojects', projectController.getProjects);
router.get('/',            projectController.index);



router.get('/:id',         verifyUserOwnsProject, projectController.getProjectDetails);
//router.get('/:id/tagging', verifyUserInProject, projectController.tagging);
router.get('/:id/tagging', verifyUserInProject, projectController.tagging);





router.get('/:id/tagging/getDocumentGroup', verifyUserInProject, projectController.getDocumentGroup);
router.post('/:id/tagging/modify_hierarchy', verifyUserInProject, projectController.modifyHierarchy);

router.post('/:id/tagging/submitAnnotations', verifyUserInProject, projectController.submitAnnotations);
router.get('/:id/download_annotations/:user_id', verifyUserOwnsProject, projectController.downloadAnnotationsOfUser);
router.get('/:id/download_combined_annotations', verifyUserOwnsProject, projectController.downloadCombinedAnnotations);

router.post('/invitations/:id/accept', projectController.acceptInvitation);
router.post('/invitations/:id/decline', projectController.declineInvitation);

module.exports = router;