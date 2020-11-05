const RunningModel = require('../models/runningModel');
const util = require('../modules/util');
const CODE = require('../modules/statusCode');
const MSG = require('../modules/responseMessage');
const encrypt = require('../modules/crypto');
const jwt = require('../modules/jwt');
const moment = require('moment');

require('moment-timezone'); 
moment.tz.setDefault("Asia/Seoul");

let awaiters = {};

module.exports = {
    startMatching: async (req, res) => {
        try {
            let {time, wantGender} = req.body;
            if (wantGender === 3) {
                wantGender = [1, 2];
            }
            else {
                wantGender = [wantGender];
            }
            console.log(req.decoded);
            const user_idx = req.decoded.userIdx;
            const gender = req.decoded.gender;
            const level = req.decoded.level;
            const image = req.decoded.image;
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
                awaiters[user_idx] = {user_idx: user_idx, time: time, wantGender: wantGender, gender: gender, level: level, nickname: nickname, image: image, matched: 0, confirmCount: 0}
                res.status(CODE.OK).send(util.success(CODE.OK, MSG.AWAIT_SUCCESS));
            }

        } catch (err) {
            console.log("startMatching Error");
            throw(err);
        }
    },

    findMatching: async (req, res) => {
        try {
            const user_idx = req.decoded.userIdx;
            if (!user_idx) {
                res.status(CODE.DB_ERROR).send(util.fail(CODE.DB_ERROR, MSG.READ_FAIL));
                return;
            }
            else {
                if (!(user_idx in awaiters)) {
                    res.status(CODE.BAD_REQUEST).send(util.fail(CODE.BAD_REQUEST, MSG.NOT_WAITING));
                    return;
                }
                else {
                    const {time, wantGender, gender, level, matched} = awaiters[user_idx];
                    if (matched !== 0) {
                        res.status(CODE.BAD_REQUEST).send(util.fail(CODE.BAD_REQUEST, MSG.ALREADY_FOUND));
                        return;
                    }
                    else {
                        const candidate = Object.values(awaiters).find(awaiter => awaiter.matched === user_idx)
                        if (candidate === undefined) {
                            const opponent = Object.values(awaiters).find(opponent => (opponent.time === time) && (opponent.level === level) && (opponent.wantGender.includes(gender)) && (wantGender.includes(opponent.gender)));
                            if (opponent === undefined) {
                                res.status(CODE.OK).send(util.success(CODE.OK, MSG.MATCH_WAITING));
                                return;
                            }
                            else {
                                awaiters[user_idx].matched = opponent.user_idx;
                                res.status(CODE.OK).send(util.success(CODE.OK, MSG.MATCH_SUCCESS));
                                return;
                            }
                        }
                        else {
                            awaiters[user_idx].matched = candidate.user_idx;
                            res.status(CODE.OK).send(util.success(CODE.OK, MSG.MATCH_SUCCESS));
                            return;
                        }
                    }
                }
            }
        } catch (err) {
            console.log("findMatching Error");
            throw(err);
        }
    },

    confirmMatching: async (req, res) => {
        try {
            const user_idx = req.decoded.userIdx;
            if (!user_idx) {
                res.status(CODE.DB_ERROR).send(util.fail(CODE.DB_ERROR, MSG.READ_FAIL));
                return;
            }
            else if (!(user_idx in awaiters)) {
                res.status(CODE.BAD_REQUEST).send(util.fail(CODE.BAD_REQUEST, MSG.NOT_WAITING));
                return;
            }
            else {
                awaiters[user_idx].confirmCount += 1
                const opponent = awaiters[awaiters[user_idx].matched]
                if (opponent === undefined) {
                    awaiters[user_idx].matched = 0
                    console.log("상대방 없음");
                    res.status(CODE.BAD_REQUEST).send(util.fail(CODE.BAD_REQUEST, MSG.NO_OPPONENT));
                    return;
                }
                else if (opponent.confirmCount === 0) {
                    if (awaiters[user_idx].confirmCount === 5) {
                        delete awaiters[awaiters[user_idx].matched]
                        awaiters[user_idx].matched = 0;
                        res.status(CODE.OK).send(util.success(CODE.OK, MSG.OPPONENT_DISCONNECT))
                    }
                    else {
                        res.status(CODE.OK).send(util.success(CODE.BAD_REQUEST, MSG.CONFIRM_WAITING));
                        return;
                    }
                }
                else {
                    res.status(CODE.OK).send(util.success(CODE.OK, MSG.CONFIRM_SUCCESS, {opponent_level: opponent.level, opponent_nickname: opponent.nickname, opponent_image: opponent.image, opponent_win: }))
                    return;
                }
            }
        } catch (err) {
            console.log("confirmMatching Error");
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