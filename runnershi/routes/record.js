var express = require('express');
var router = express.Router();

const recordController = require('../controllers/recordController');
const auth = require("../middlewares/auth");

//경로에 동사는 쓰지 않는 것이 좋다. ==> 전체적으로 수정하기

  // all 페이징처리하기 
  router.get('/all', auth.checkToken, recordController.getAllRecords);
  router.get('/detail/:run_idx/:game_idx', auth.checkToken, recordController.getDetailRecord);
  // router.get('/opponent/:game_idx', auth.checkToken, recordController.getOpponentRecord);
  // router.get('/badge', auth.checkToken, recordController.getBadge);
  // router.get('/recent', auth.checkToken, recordController.getUserRecentRecord);
  // router.post('/match/opponent', recordController.postFindRunner);
  // router.get('/running/:run_idx', auth.checkToken, recordController.getUserRunIdxRecord);
  
  module.exports = router;