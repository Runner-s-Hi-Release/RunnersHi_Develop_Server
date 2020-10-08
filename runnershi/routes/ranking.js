var express = require('express');
var router = express.Router();

const rankingController = require('../controllers/rankingController');
const auth = require("../middlewares/auth");

//DB생각해보기 --> cache 사용, mongo DB
//join 연산이 많으면 좋지 않다.. -> 수정방안 고민
//Docker , swagger 사용

  router.get('/runners', auth.checkToken, rankingController.runner);
  router.get('/winners', auth.checkToken, rankingController.winner);
  router.get('/losers', auth.checkToken, rankingController.loser);
  //url에 언더바를 쓰는 것은 좋지않다고 해서 '-' 로 했는데 인식이 안된다 --> 이거 알아보기
  router.get('/detail/:user_idx', auth.checkToken, rankingController.getDetailProfile);

  module.exports = router;