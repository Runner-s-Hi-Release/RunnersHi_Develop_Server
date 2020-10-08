const rankingModel = require("../models/rankingModel");
const recordModel = require("../models/recordModel");
const util = require('../modules/util');
const statusCode = require('../modules/statusCode');
const resMessage = require('../modules/responseMessage');

const ranking = {
  runner: async(req, res, next) => {
    try{
      const data = await rankingModel.runner();

      if(data.length == 0) {
        return res.status(statusCode.NO_CONTENT).send(util.success(statusCode.NO_CONTENT, resMessage.NO_DATA, final_data));
      }

      const final_data = [];
      for(let i = 0; i < data.length; i++){
      final_data.push( {
        nickname: data[i].nickname,
        image: data[i].image,
        user_idx: data[i].user_idx,
        distance_sum: data[i].sum
      });
    }
      return res.status(statusCode.OK).send(util.success(statusCode.OK, resMessage.RUNNER_SUCCESS, final_data));
    } catch(error){
      throw(error);
    }
  },

  winner: async(req, res, next) => {  
    try{
      const data = await rankingModel.winner();

      if(data.length == 0) {
        return res.status(statusCode.NO_CONTENT).send(util.success(statusCode.NO_CONTENT, resMessage.NO_DATA, final_data));
      }

      const final_data = [];
      for(let i = 0; i < data.length; i++){
        if(data[i].win + data[i].lose != 0) {
          final_data.push( {
            nickname: data[i].nickname,
            image: data[i].image,
            user_idx: data[i].user_idx,
            win: data[i].win,
            lose: data[i].lose
          });
        }
      }

      return res.status(statusCode.OK).send(util.success(statusCode.OK, resMessage.WINNER_SUCCESS, final_data));
    } catch(error){
      throw(error);
    }
  },

  loser: async(req, res, next) => {
    try{
      const data = await rankingModel.loser();

      const final_data = [];

      if(data.length == 0) {
        return res.status(statusCode.NO_CONTENT).send(util.success(statusCode.NO_CONTENT, resMessage.NO_DATA, final_data));
      }
  
      for(let i = 0; i < data.length; i++){
  
        if(data[i].win + data[i].lose != 0) {
          final_data.push( {
            nickname: data[i].nickname,
            image: data[i].image,
            user_idx: data[i].user_idx,
            win: data[i].win,
            lose: data[i].lose
          });
        }
      }
      return res.status(statusCode.OK).send(util.success(statusCode.OK, resMessage.LOSER_SUCCESS, final_data));
    } catch(error){
      throw(error);
    }
  },

  getDetailProfile: async(req, res, next) => {
    const user_idx = req.params.user_idx;

    if(user_idx === undefined) 
      return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, resMessage.NO_EXIST_USERIDX));

    try{
      const user_data = await rankingModel.getDetailProfile(user_idx);
      //const recentrecord = await recordModel.getUserRecentRecord(user_idx);
      //const badge = await recordModel.getBadge(user_idx);
      //const pace_data = await recordModel.getPace(recentrecord[0].time, recentrecord[0].distance);

      //if(recentrecord === null || badge === null || pace_data == null) 
      //  return next("WRONG_PARM");

      return res.status(statusCode.OK).send(util.success(statusCode.OK, resMessage.RUNNER_DETAIL_PROFILE_SUCCESS, user_data));
    } catch(error){
      throw(error);
    }
  }
};

module.exports = ranking;