var express = require('express');
var router = express.Router();
const auth = require("../middlewares/auth");
const runningController = require("../controllers/runningController");

/* GET users listing. */
router.post('/start', auth.checkToken, runningController.startMatching);
router.get('/find', auth.checkToken, runningController.findMatching);
router.post('/confirm', auth.checkToken, runningController.confirmMatching);
router.delete('/stopMatching', auth.checkToken, runningController.stopMatching);
router.put('/update/:idx', auth.checkToken, runningController.updateRun);
router.put('/stopRunning/:idx', auth.checkToken, runningController.stopRunning);
router.get('/ranking/:idx', auth.checkToken, runningController.getRanking);
router.put('/end/:idx', auth.checkToken, runningController.endRunning);

module.exports = router;
