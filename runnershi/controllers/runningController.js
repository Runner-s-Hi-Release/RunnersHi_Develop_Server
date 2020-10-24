const RunningModel = require('../models/running');
const util = require('../modules/util');
const CODE = require('../modules/statusCode');
const MSG = require('../modules/responseMessage');
const encrypt = require('../modules/crypto');
const jwt = require('../modules/jwt');
const moment = require('moment');
require('moment-timezone'); 
moment.tz.setDefault("Asia/Seoul");

module.exports = {
    startMatching: async (req, res) => {
        try {
            const {time, wantGender} = req.body;
            console.log(req.decoded);
            const user_idx = req.decoded.userIdx;
            const gender = req.decoded.gender;
            const image = req.decoded.image;
            const level = req.decoded.level;
            const nickname = req.decoded.nickname;

            if (!time || !wantGender) {
                res.status(CODE.BAD_REQUEST).send(util.fail(CODE.BAD_REQUEST, MSG.NULL_VALUE));
                return;
            }
            if (!user_idx || !gender || !image || !level || !nickname) {
                res.status(CODE.DB_ERROR).send(util.fail(CODE.DB_ERROR, MSG.READ_FAIL));
                return;
            }
            else {
                const result = await RunningModel.findMatch(time, level, nickname, gender, image, wantGender);
                console.log(result);
                res.status(CODE.OK).send(util.success(CODE.OK, MSG.MATCH_WAITING));
            }
        } catch (err) {
            console.log("startMatching Error");
            throw(err);
        }
    },

    updateRun: async (req, res) => {
        try {
            const run_idx = req.params.idx;
            const {distance, time} = req.body;
            const user_idx = req.decoded.userIdx;
            if (!run_idx || (!distance && distance !== 0) || (!time && time !== 0)) {
                res.status(CODE.BAD_REQUEST).send(util.fail(CODE.BAD_REQUEST, MSG.NULL_VALUE));
                return;
            }
            if (!user_idx) {
                res.status(CODE.DB_ERROR).send(util.fail(CODE.DB_ERROR, MSG.READ_FAIL));
                return;
            }
            else {
                const result = await RunningModel.updateRun(run_idx, distance, time, user_idx);
                console.log("UPDATE RESULT: ", result);
                if (result.changedRows === 0) {
                    res.status(CODE.BAD_REQUEST).send(util.fail(CODE.BAD_REQUEST, MSG.UPDATE_RUN_FAIL));
                }
                else {
                    res.status(CODE.OK).send(util.success(CODE.OK, MSG.UPDATE_RUN_SUCCESS));
                }
            }
        } catch (err) {
            console.log("updateRun Error");
            throw(err);
        }
    },

    getOpponentInfo: async (req, res) => {
        try {
            const run_idx = req.params.idx;
            const user_idx = req.decoded.userIdx;
            if (!run_idx) {
                res.status(CODE.BAD_REQUEST).send(util.fail(CODE.BAD_REQUEST, MSG.NULL_VALUE));
                return;
            }
            if (!user_idx) {
                res.status(CODE.DB_ERROR).send(util.fail(CODE.DB_ERROR, MSG.READ_FAIL));
                return;
            }
            else {
                const result = await RunningModel.getOpponentInfo(run_idx, user_idx);
                console.log("OpponentInfo Result: ", result);
                if (result.length === 1) {
                    res.status(CODE.OK).send(util.success(CODE.OK, MSG.OPPONENT_INFO_SUCCESS, {level: result[0].level, nickname: result[0].nickname, win: result[0].win, lose: result[0].lose, image: result[0].image}));
                }
                else {
                    res.status(CODE.BAD_REQUEST).send(util.fail(CODE.BAD_REQUEST, MSG.OPPONENT_INFO_FAIL));
                }
            }
        } catch (err) {
            console.log("getOpponentInfo Error");
            throw(err);
        }
    },

    getOpponentRun: async (req, res) => {
        try {
            const run_idx = req.params.idx;
            const user_idx = req.decoded.userIdx;
            if (!run_idx) {
                res.status(CODE.BAD_REQUEST).send(util.fail(CODE.BAD_REQUEST, MSG.NULL_VALUE));
                return;
            }
            if (!user_idx) {
                res.status(CODE.DB_ERROR).send(util.fail(CODE.DB_ERROR, MSG.READ_FAIL));
                return;
            }
            else {
                const result = await RunningModel.getOpponentRun(run_idx, user_idx);
                console.log("OpponentRun Result: ", result);
                if (result.length === 1) {
                    res.status(CODE.OK).send(util.success(CODE.OK, MSG.OPPONENT_RUN_SUCCESS, {distance: result[0].distance, time: result[0].time}));
                }
                else {
                    res.status(CODE.BAD_REQUEST).send(util.fail(CODE.BAD_REQUEST, MSG.OPPONENT_RUN_FAIL));
                }
            }
        } catch (err) {
            console.log("getOpponentRun Error");
            throw(err);
        }
    },

    endRun: async (req, res) => {
        try {

        } catch (err) {
            console.log("endRun Error");
            throw(err);
        }
    }
}