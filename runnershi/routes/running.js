var express = require('express');
var router = express.Router();
const auth = require("../middlewares/auth");
const runningController = require("../controllers/running");

/* GET users listing. */
router.post('/match', auth.checkToken, runningController.startMatching);
router.put('/update/:idx', auth.checkToken, runningController.updateRun);

module.exports = router;