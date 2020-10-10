const recordModel = require("../models/recordModel");
const util = require('../modules/util');
const statusCode = require('../modules/statusCode');
const resMessage = require('../modules/responseMessage');

const record = {
  getAllRecords: async(req, res, next) => {
    const id = req.decoded.userIdx;
    const final_data = [];

    try{
      const data = await recordModel.getAllRecords(id);
      if(data.length == 0) {
        return res.status(statusCode.NO_CONTENT).send(util.success(statusCode.NO_CONTENT, resMessage.NO_DATA, final_data));
      }

      for(let i = 0; i < data.length; i++){
       final_data.push({
         date: data[i].date,
         distance: data[i].distance,
         time: data[i].time,
         run_idx: data[i].run_idx,
         result: (data[i].result === 1 || data[i].result === 5) ? 1 : 2,
         game_idx: data[i].game_idx,
       });
     }
     return res.status(statusCode.OK).send(util.success(statusCode.OK, resMessage.RECORD_ALL_SUCCESS, final_data));
    } catch(error){
      throw(error);
    }
  },
  
  getDetailRecord: async(req, res, next) => {
    const run_idx = req.params.run_idx;
    const user_idx = req.decoded.userIdx;
    const game_idx = req.params.game_idx;

    try{
      if(run_idx === undefined)
        return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.NO_CONTENT, resMessage.NOT_FIND_IDX_ERROR));

      const data = await recordModel.getDetailRecord(user_idx, run_idx);
      const coordinateData = await recordModel.getCoordinate(run_idx);
      const opponetData = await recordModel.getOpponentRecord(user_idx, game_idx);
      const runningData = await recordModel.getPace();

      if(data.length === 0) {
        return res.status(statusCode.NO_CONTENT).send(util.success(statusCode.NO_CONTENT, resMessage.NO_DATA, final_data));
      }

      const real_result = {
        created_time: data[0].created_time,
        end_time: data[0].end_time,
        opponent_data: opponetData,
        user_running_data: runningData,
        coordinate: coordinateData
      }; 

      return res.status(statusCode.OK).send(util.success(statusCode.OK, resMessage.RECORD_DETAIL_SUCCESS, real_result));
    } catch(error){
      throw(error);
    }
  },
  
  getBadge: async(req, res, next) => {

  },

  getUserRecentRecord: async(req, res, next) => {
   
  },

  getUserRunIdxRecord: async(req, res, next) => {
 
  },

  getOpponentRecord: async(req, res, next) => {
 
  }

};

module.exports = record;