require('rootpath')();
var logger = require('config/winston');

var express = require('express');
var router = express.Router();
var projectController = require("../controllers/project_controller");

router.get('/getprojects', projectController.getProjects);
router.get('/',            projectController.index);
router.get('/:id/tagging', projectController.tagging);

module.exports = router;