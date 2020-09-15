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
            const user_idx = req.decoded.user_idx;
            const gender = req.decoded.gender;
            if (!time || !wantGender) {
                res.status(CODE.BAD_REQUEST).send(util.fail(CODE.BAD_REQUEST, MSG.NULL_VALUE));
                return;
            }
            if (!user_idx || !gender) {
                res.status(CODE.DB_ERROR).send(util.fail(CODE.DB_ERROR, MSG.READ_FAIL));
                return;
            }
            const opponentIdx = waitingList.find((awaiter) => {
                if (awaiter.time === time && (awaiter.wantGender === 3 || awaiter.wantGender === gender) && (awaiter.gender === wantGender || wantGender === 3) && !matched) {
                    return true;
                }
            });
            if (opponentIdx === undefined) {
                let counter = 0;
                const waitIdx = waitingList.push({
                    time: time,
                    wantGender: wantGender,
                    gender: gender,
                    user_idx: user_idx,
                    matched = false
                }) - 1;
                const intervalId = setInterval(function() {
                    counter += 1;
                    if (waitingList[waitIdx].matched) {
                        waitingList.splice(waitIdx, 1);
                        res.
                    }
                }, 1000);
            }
            else {
                const game_idx = await RunningModel.insertGame();
                waitingList[opponentIdx].game_idx = game_idx;
                waitingList[opponentIdx].matched = true;
                const run_idx = await RunningModel.insertRun(0, 0, [], 0, )
                res.status(CODE.OK).send(util.success(CODE.OK, MSG.MATCH_SUCCESS, {run_idx: run_idx}));
            }
        } catch (err) {
            console.log("startMatching Error");
            throw(err);
        }
        
    }
}