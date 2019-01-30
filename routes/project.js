require('rootpath')();
var logger = require('config/winston');

var express = require('express');
var router = express.Router();
var projectController = require("app/controllers/project_controller");

router.get('/getprojects', projectController.getProjects);
router.get('/',            projectController.index);
router.get('/:id',         projectController.getProjectDetails);
router.get('/:id/tagging', projectController.tagging);
router.get('/:id/tagging/getDocumentGroup', projectController.getDocumentGroup);

router.post('/:id/tagging/submitAnnotations', projectController.submitAnnotations);
router.get('/:id/download_annotations/:user_id', projectController.downloadAnnotationsOfUser);

router.post('/invitations/:id/accept', projectController.acceptInvitation);
router.post('/invitations/:id/decline', projectController.declineInvitation);

module.exports = router;