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

function monitor() {
    console.log("awaiters: ", awaiters);
}

module.exports = {

    findMatching: async (req, res) => {
        try {
            const {time} = req.body;
            let {wantGender} = req.body;
            if (!time || !wantGender) {
                res.status(CODE.BAD_REQUEST).send(util.fail(CODE.BAD_REQUEST, MSG.NULL_VALUE));
                return;
            }
            else if (!([1800, 2700, 3600, 5400].includes(time)) || !([1, 2, 3].includes(wantGender))) {
                res.status(CODE.BAD_REQUEST).send(util.fail(CODE.BAD_REQUEST, MSG.OUT_OF_VALUE));
                return;
            }
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
            const win = req.decoded.win;
            const lose = req.decoded.lose;
            
            if (!user_idx || !gender || !image || !level || !nickname || win === undefined || lose === undefined) {
                res.status(CODE.DB_ERROR).send(util.fail(CODE.DB_ERROR, MSG.READ_FAIL));
                return;
            }
            else {
                if (!(user_idx in awaiters)) {
                    awaiters[user_idx] = {user_idx: user_idx, time: time, wantGender: wantGender, gender: gender, level: level, nickname: nickname, image: image, win: win, lose: lose, counter: 0, matched: 0, waiting: 0, selected: false, confirmed : false};
                    monitor();
                }
                const {matched, waiting, confirmed} = awaiters[user_idx];
                if (waiting && confirmed) {
                    res.status(CODE.ACCEPTED).send(util.fail(CODE.ACCEPTED, MSG.CONFIRM_WAITING));
                    return;
                }
                else if (waiting) {
                    res.status(CODE.ACCEPTED).send(util.fail(CODE.ACCEPTED, MSG.NOW_FINDING));
                    return;
                }
                else {
                    const intervalId = setInterval(async function() {
                        try {
                            if (user_idx in awaiters) {
                                awaiters[user_idx].counter += 1;
                                if (awaiters[user_idx].waiting) {
                                    if (awaiters[user_idx].counter > 30) {
                                        awaiters[user_idx].matched = 0;
                                        awaiters[user_idx].waiting = 0;
                                        if (awaiters[user_idx].matched in awaiters) {
                                            awaiters[awaiters[user_idx].matched].selected = false;
                                        }
                                        clearInterval(intervalId);
                                        delete awaiters[user_idx];
                                        res.status(CODE.NO_CONTENT).send(util.fail(CODE.NO_CONTENT, MSG.MATCH_WAITING));
                                        return;
                                    }
                                    else if (!(awaiters[user_idx].matched in awaiters)) {
                                        console.log("opponent deleted");
                                        awaiters[user_idx].matched = 0;
                                        awaiters[user_idx].waiting = 0;
                                    }
                                    else if (awaiters[awaiters[user_idx].matched].matched === user_idx) {
                                        awaiters[user_idx].waiting = 0;
                                        monitor();
                                        clearInterval(intervalId);
                                        res.status(CODE.OK).send(util.success(CODE.OK, MSG.MATCH_SUCCESS));
                                        return;
                                    }
                                    else if ((awaiters[user_idx].waiting) > 3) {
                                        delete awaiters[awaiters[user_idx].matched];
                                        awaiters[user_idx].matched = 0;
                                        awaiters[user_idx].waiting = 0;
                                    }
                                    awaiters[user_idx].waiting += 1;
                                }
                                else {
                                    const candidate = Object.values(awaiters).find(awaiter => (awaiter.matched === user_idx) && (awaiter.waiting))
                                    if (candidate === undefined) {
                                        const opponent = Object.values(awaiters).find(opponent => (opponent.user_idx !== user_idx) && (opponent.time === time) && (opponent.level === level) && (opponent.wantGender.includes(gender)) && (wantGender.includes(opponent.gender)) && (opponent.matched === 0) && !(opponent.selected));
                                        if (opponent === undefined && awaiters[user_idx].counter >= 30) {
                                            monitor();
                                            clearInterval(intervalId);
                                            delete awaiters[user_idx];
                                            res.status(CODE.NO_CONTENT).send(util.fail(CODE.NO_CONTENT, MSG.MATCH_WAITING));
                                            return;
                                        }
                                        else if (opponent !== undefined) {
                                            awaiters[user_idx].matched = opponent.user_idx;
                                            awaiters[user_idx].waiting = 1;
                                            awaiters[opponent.user_idx].selected = true;
                                        }
                                    }
                                    else {
                                        awaiters[user_idx].matched = candidate.user_idx;
                                        monitor();
                                        clearInterval(intervalId);
                                        res.status(CODE.OK).send(util.success(CODE.OK, MSG.MATCH_SUCCESS));
                                        return;
                                    }
                                }
                            }
                            else {
                                console.log("Can't Find User!");
                                clearInterval(intervalId);
                                res.status(CODE.NOT_FOUND).send(util.fail(CODE.NOT_FOUND, MSG.USER_DELETED));
                            }
                        } catch (err) {
                            console.log("Interval Error from find");
                            clearInterval(intervalId);
                            res.status(CODE.INTERNAL_SERVER_ERROR).send(util.fail(CODE.INTERNAL_SERVER_ERROR));
                            throw(err);
                        }
                    }, 1000);
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
                if (awaiters[user_idx].matched !== 0) {
                    awaiters[awaiters[user_idx].matched].selected = false;
                }
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
                res.status(CODE.BAD_REQUEST).send(util.fail(CODE.BAD_REQUEST, MSG.NOT_WAITING));
                return;
            }
            else if (awaiters[user_idx].matched === 0) {
                monitor();
                res.status(CODE.NOT_FOUND).send(util.fail(CODE.NOT_FOUND, MSG.NOT_MATCHED));
                return;
            }
            else {
                awaiters[user_idx].confirmed = true;
                const opponent = awaiters[awaiters[user_idx].matched]
                if (opponent === undefined) {
                    awaiters[user_idx].matched = 0
                    console.log("상대방 없음");
                    monitor();
                    res.status(CODE.NOT_FOUND).send(util.fail(CODE.NOT_FOUND, MSG.NO_OPPONENT));
                    return;
                }
                else if (!(opponent.confirmed)) {
                    awaiters[user_idx].waiting = 1;
                    const intervalId = setInterval(async function() {
                        try {
                            if (!(awaiters[user_idx].matched in awaiters)) {
                                awaiters[user_idx].matched = 0;
                                awaiters[user_idx].waiting = 0;
                                awaiters[user_idx].confirmed = false;
                                clearInterval(intervalId);
                                res.status(CODE.NOT_FOUND).send(util.fail(CODE.NOT_FOUND, MSG.NO_OPPONENT));
                                return;
                            }
                            else if (awaiters[awaiters[user_idx].matched].confirmed) {
                                const game_idx = awaiters[awaiters[user_idx].matched].game_idx;
                                const run_idx = await RunningModel.insertRun(moment().format("YYYY-MM-DD HH:mm:ss"), game_idx, user_idx);
                                delete awaiters[awaiters[user_idx].matched];
                                delete awaiters[user_idx];
                                monitor();
                                clearInterval(intervalId);
                                res.status(CODE.OK).send(util.success(CODE.OK, MSG.CONFIRM_SUCCESS, {run_idx: run_idx, opponent_level: opponent.level, opponent_nickname: opponent.nickname, opponent_image: opponent.image, opponent_win: opponent.win, opponent_lose: opponent.lose}));
                                return;
                            }
                            else if (awaiters[user_idx].waiting > 10) {
                                delete awaiters[awaiters[user_idx].matched];
                                awaiters[user_idx].matched = 0;
                                awaiters[user_idx].waiting = 0;
                                awaiters[user_idx].confirmed = false;
                                monitor();
                                clearInterval(intervalId);
                                res.status(CODE.ACCEPTED).send(util.success(CODE.ACCEPTED, MSG.OPPONENT_DISCONNECT));
                                return
                            }
                            awaiters[user_idx].waiting += 1;
                        } catch (err) {
                            console.log("Interval Error from confirm");
                            res.status(CODE.INTERNAL_SERVER_ERROR).send(util.fail(CODE.INTERNAL_SERVER_ERROR));
                            throw(err);
                        }
                    }, 1000);
                }
                else {
                    const game_idx = await RunningModel.insertGame(awaiters[user_idx].time);
                    awaiters[user_idx].game_idx = game_idx;
                    const run_idx = await RunningModel.insertRun(moment().format("YYYY-MM-DD HH:mm:ss"), game_idx, user_idx);
                    monitor();
                    res.status(CODE.OK).send(util.success(CODE.OK, MSG.CONFIRM_SUCCESS, {run_idx: run_idx, opponent_level: opponent.level, opponent_nickname: opponent.nickname, opponent_image: opponent.image, opponent_win: opponent.win, opponent_lose: opponent.lose}));
                    return;
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