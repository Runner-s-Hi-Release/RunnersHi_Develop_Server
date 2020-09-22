const RunningModel = require('../models/running');
const util = require('../modules/util');
const CODE = require('../modules/statusCode');
const MSG = require('../modules/responseMessage');
const encrypt = require('../modules/crypto');
const jwt = require('../modules/jwt');
const moment = require('moment');
require('moment-timezone'); 
moment.tz.setDefault("Asia/Seoul");

let waitingList = [];

module.exports = {
    startMatching: async (req, res) => {
        try {
            const {time, wantGender} = req.body;
            const user_idx = req.decoded.userIdx;
            const gender = req.decoded.gender;
            if (!time || !wantGender) {
                res.status(CODE.BAD_REQUEST).send(util.fail(CODE.BAD_REQUEST, MSG.NULL_VALUE));
                return;
            }
            if (!user_idx || !gender) {
                res.status(CODE.DB_ERROR).send(util.fail(CODE.DB_ERROR, MSG.READ_FAIL));
                return;
            }
            const opponentIdx = waitingList.findIndex((awaiter) => {
                if (awaiter.time === time && (awaiter.wantGender === 3 || awaiter.wantGender === gender) && (awaiter.gender === wantGender || wantGender === 3) && !awaiter.matched) {
                    return true;
                }
            });
            console.log(opponentIdx);
            if (opponentIdx === -1) {
                let counter = 0;
                const waitIdx = waitingList.push({
                    time: time,
                    wantGender: wantGender,
                    gender: gender,
                    user_idx: user_idx,
                    matched: false
                }) - 1;
                console.log("waitIdx: ", waitIdx);

                // async await 점검
                const intervalId = setInterval(async function() {
                    counter += 1;
                    if (waitingList[waitIdx].matched) {
                        const game_idx = waitingList[waitIdx].game_idx;
                        const run_idx = await RunningModel.createRun(moment().format("YYYY-MM-DD HH:mm:ss"), user_idx, game_idx);
                        waitingList.splice(waitIdx, 1);
                        clearInterval(intervalId);
                        res.status(CODE.OK).send(util.success(CODE.OK, MSG.MATCH_SUCCESS, {run_idx: run_idx}));
                    }
                    else if (counter > 180) {
                        waitingList.splice(waitIdx, 1);
                        clearInterval(intervalId);
                        res.status(CODE.REQUEST_TIMEOUT).send(util.fail(CODE.REQUEST_TIMEOUT, MSG.MATCH_TIMEOUT));
                    }
                }, 1000);
            }
            else {
                const game_idx = await RunningModel.insertGame();
                waitingList[opponentIdx].game_idx = game_idx;
                waitingList[opponentIdx].matched = true;
                const run_idx = await RunningModel.createRun(moment().format("YYYY-MM-DD HH:mm:ss"), user_idx, game_idx);
                res.status(CODE.OK).send(util.success(CODE.OK, MSG.MATCH_SUCCESS, {run_idx: run_idx}));
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
                    res.status(CODE.OK).send(util.success(CODE.OK, MSG.OPPONENT_INFO_SUCCESS, {nickname: result.nickname, win: result.win, lose: result.lose, image: result.image}));
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