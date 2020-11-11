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
let matchedSet = new Set([]);

function monitor() {
    console.log("awaiters: ", awaiters);
    console.log("matchedSet: ", matchedSet);
};

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
                monitor();
                res.status(CODE.OK).send(util.success(CODE.OK, MSG.AWAIT_SUCCESS));
            }

        } catch (err) {
            console.log("startMatching Error from runningController");
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
                    monitor();
                    return;
                }
                else {
                    const {time, wantGender, gender, level, matched} = awaiters[user_idx];
                    if (matched !== 0) {
                        monitor();
                        res.status(CODE.BAD_REQUEST).send(util.fail(CODE.BAD_REQUEST, MSG.ALREADY_FOUND));
                        return;
                    }
                    else {
                        const candidate = Object.values(awaiters).find(awaiter => (awaiter.matched === user_idx) && !(matchedSet.has(awaiter.user_idx)))
                        if (candidate === undefined) {
                            const opponent = Object.values(awaiters).find(opponent => (opponent.user_idx !== user_idx) && (opponent.time === time) && (opponent.level === level) && (opponent.wantGender.includes(gender)) && (wantGender.includes(opponent.gender)) && (opponent.matched === 0));
                            if (opponent === undefined) {
                                monitor();
                                res.status(CODE.OK).send(util.success(CODE.OK, MSG.MATCH_WAITING));
                                return;
                            }
                            else {
                                awaiters[user_idx].matched = opponent.user_idx;
                                matchedSet.add(opponent.user_idx);
                                opponentRecord = await RunningModel.getOpponentRecord(opponent.user_idx);
                                monitor();
                                res.status(CODE.OK).send(util.success(CODE.OK, MSG.MATCH_SUCCESS, {opponent_level: opponent.level, opponent_nickname: opponent.nickname, opponent_image: opponent.image, opponent_win: opponentRecord.win, opponent_lose: opponentRecord.lose}));
                                return;
                            }
                        }
                        else {
                            awaiters[user_idx].matched = candidate.user_idx;
                            matchedSet.add(candidate.user_idx);
                            opponentRecord = await RunningModel.getOpponentRecord(candidate.user_idx);
                            monitor();
                            res.status(CODE.OK).send(util.success(CODE.OK, MSG.MATCH_SUCCESS, {opponent_level: candidate.level, opponent_nickname: candidate.nickname, opponent_image: candidate.image, opponent_win: opponentRecord.win, opponent_lose: opponentRecord.lose}));
                            return;
                        }
                    }
                }
            }
        } catch (err) {
            console.log("findMatching Error from runningController");
            throw(err);
        }
    },

    stopMatching: async (req, res) => {
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
                const clearMatching = function(awaiters, user_idx) {
                    Object.keys(awaiters).forEach(function(idx){ 
                        if(awaiters[idx].matched === user_idx) {
                            awaiters[idx].matched = 0;
                        }
                    });
                    return awaiters;
                }
                awaiters = clearMatching(awaiters, user_idx);
                matchedSet.delete(user_idx);
                delete awaiters[user_idx];
                monitor();
                res.status(CODE.OK).send(util.success(CODE.OK, MSG.STOP_MATCHING));
                return;
            }
        } catch(err) {
            console.log("stopMatching Error from runningController");
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
                matchedSet.delete(user_idx);
                monitor();
                res.status(CODE.BAD_REQUEST).send(util.fail(CODE.BAD_REQUEST, MSG.NOT_WAITING));
                return;
            }
            else if (awaiters[user_idx].matched === 0) {
                matchedSet.delete(user_idx);
                monitor();
                res.status(CODE.BAD_REQUEST).send(util.fail(CODE.BAD_REQUEST, MSG.NOT_MATCHED));
                return;
            }
            else {
                awaiters[user_idx].confirmCount += 1
                const opponent = awaiters[awaiters[user_idx].matched]
                if (opponent === undefined) {
                    matchedSet.delete(awaiters[user_idx].matched);
                    awaiters[user_idx].matched = 0
                    matchedSet.delete(user_idx);
                    console.log("상대방 없음");
                    monitor();
                    res.status(CODE.BAD_REQUEST).send(util.fail(CODE.BAD_REQUEST, MSG.NO_OPPONENT));
                    return;
                }
                else if (opponent.confirmCount === 0) {
                    if (awaiters[user_idx].confirmCount === 5) {
                        delete awaiters[awaiters[user_idx].matched];
                        awaiters[user_idx].matched = 0;
                        monitor();
                        res.status(CODE.OK).send(util.success(CODE.OK, MSG.OPPONENT_DISCONNECT));
                    }
                    else {
                        monitor();
                        res.status(CODE.OK).send(util.success(CODE.OK, MSG.CONFIRM_WAITING));
                        return;
                    }
                }
                else {
                    if (awaiters[user_idx].confirmCount === 1) {
                        const game_idx = await RunningModel.insertGame(awaiters[user_idx].time);
                        awaiters[user_idx].game_idx = game_idx;
                        const run_idx = await RunningModel.insertRun(moment().format("YYYY-MM-DD HH:mm:ss"), game_idx, user_idx);
                        monitor();
                        res.status(CODE.OK).send(util.success(CODE.OK, MSG.CONFIRM_SUCCESS, {run_idx: run_idx}));
                        return;
                    }
                    else {
                        const game_idx = awaiters[awaiters[user_idx].matched].game_idx;
                        const run_idx = await RunningModel.insertRun(moment().format("YYYY-MM-DD HH:mm:ss"), game_idx, user_idx);
                        matchedSet.delete(user_idx);
                        matchedSet.delete(awaiters[user_idx].matched);
                        delete awaiters[awaiters[user_idx].matched];
                        delete awaiters[user_idx];
                        monitor();
                        res.status(CODE.OK).send(util.success(CODE.OK, MSG.CONFIRM_SUCCESS, {run_idx: run_idx}));
                        return;
                    }
                }
            }
        } catch (err) {
            console.log("confirmMatching Error from runningController");
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
            console.log("updateRun Error from runningController");
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
            console.log("getOpponentInfo Error from runningController");
            throw(err);
        }
    },

    getRanking: async (req, res) => {
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
                const result = await RunningModel.getRanking(run_idx);
                if (result === 0) {
                    res.status(CODE.BAD_REQUEST).send(util.fail(CODE.BAD_REQUEST, MSG.RANKING_FAIL));
                }
                else {
                    res.status(CODE.OK).send(util.success(CODE.OK, MSG.RANKING_SUCCESS, {ranking: result}));
                }
            }
        } catch (err) {
            console.log("getRanking Error from runningController");
            throw(err);
        }
    },

    stopRunning: async (req, res) => {
        try {
            const run_idx = req.params.idx;
            const {coordinates} = req.body;
            const user_idx = req.decoded.userIdx;
            if (!run_idx || !coordinates) {
                res.status(CODE.BAD_REQUEST).send(util.fail(CODE.BAD_REQUEST, MSG.NULL_VALUE));
                return;
            }
            if (!user_idx) {
                res.status(CODE.DB_ERROR).send(util.fail(CODE.DB_ERROR, MSG.READ_FAIL));
                return;
            }
            else {
                const stop_result = await RunningModel.stopRunning(moment().format("YYYY-MM-DD HH:mm:ss"), run_idx, user_idx);
                if (stop_result.changedRows === 1) {
                    console.log("Running Stopped Successfully");
                    const coordinate_result = await RunningModel.insertCoordinates(run_idx, coordinates);
                    res.status(CODE.OK).send(util.success(CODE.OK, MSG.STOP_RUN_SUCCESS));
                    return;
                }
                else {
                    console.log("Something's Wrong With StopRunning");
                    res.status(CODE.BAD_REQUEST).send(util.fail(CODE.BAD_REQUEST, MSG.STOP_RUN_FAIL));
                    return;
                }
            }
        } catch (err) {
            console.log("stopRunning Error from runningController");
            throw(err);
        }
    },

    endRunning: async (req, res) => {
        try {
            const run_idx = req.params.idx;
            const {coordinates} = req.body;
            const user_idx = req.decoded.userIdx;
            if (!run_idx || !coordinates) {
                res.status(CODE.BAD_REQUEST).send(util.fail(CODE.BAD_REQUEST, MSG.NULL_VALUE));
                return;
            }
            if (!user_idx) {
                res.status(CODE.DB_ERROR).send(util.fail(CODE.DB_ERROR, MSG.READ_FAIL));
                return;
            }
            else {
                const end_result = await RunningModel.endRunning(moment().format("YYYY-MM-DD HH:mm:ss"), run_idx, user_idx);
                if (end_result === 0) {
                    console.log("Something's Wrong With EndRunning");
                    res.status(CODE.BAD_REQUEST).send(util.fail(CODE.BAD_REQUEST, MSG.END_RUN_FAIL));
                    return;
                }
                else {
                    console.log("Running Ended Successfully");
                    const coordinate_result = await RunningModel.insertCoordinates(run_idx, coordinates);
                    res.status(CODE.OK).send(util.success(CODE.OK, MSG.END_RUN_SUCCESS, {result: end_result}));
                    return;
                }
            }
        } catch (err) {
            console.log("endRun Error from runningController");
            throw(err);
        }
    }
}