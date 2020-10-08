// var express = require('express');
// var router = express.Router();

// const recordController = require('../controllers/recordController');
// const auth = require("../middlewares/auth");

// //경로에 동사는 쓰지 않는 것이 좋다. ==> 전체적으로 수정하기
// //GET통신에서 데이터가 많은 것은 페이징 기능 추가하기 
//   router.get('/all', auth.checkToken, recordController.getAllRecords);

//   router.get('/detail/:run_idx', auth.checkToken, recordController.getDetailRecord);
//   router.get('/opponent/:game_idx', auth.checkToken, recordController.getOpponentRecord);

//   router.get('/badge', auth.checkToken, recordController.getBadge);
//   router.get('/badge/detail/:flag', auth.checkToken, recordController.getBadgeDetail);
//   router.get('/badge/update/:user_idx', auth.checkToken, recordController.updateBadge);

//   router.get('/recent', auth.checkToken, recordController.getUserRecentRecord);
//   router.post('/match/opponent', recordController.postFindRunner);

//   //보통 동사는 쓰지 않는다 --> 수정하기 
//   router.get('/run/:run_idx', auth.checkToken, recordController.getUserRunIdxRecord);
//   router.post('/run/post', auth.checkToken, recordController.postRun);
//   router.post('/run/withme', auth.checkToken, recordController.withMe);
  
//   module.exports = router;