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

    try{
      const data = await recordModel.getDetailRecord(user_idx, run_idx);
      const coordinateData = await recordModel.getCoordinate(run_idx);

      const real_result = {
        month: data[0].month,
        day: data[0].day,
        time : data[0].time,
        start_time: data[0].create_time,
        end_time: data[0].end_time,
        coordinate: coordinateData
      };
      return next({code: "RECORD_DETAIL_SUCCESS", result: real_result});
    } catch(error){
      return next(error);
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