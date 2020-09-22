const { queryParam, queryParamArr } = require('../modules/pool');

module.exports = {

    insertGame: async() => {
        try {
            let query = "INSERT INTO game (game_idx) VALUES (0)";
            const result = await queryParam(query);
            return result.insertId;
        }
        catch (err) {
            console.log("insertGame Error");
            throw (err);
        }
    },

    createRun: async(created_time, user_idx, game_idx) => {
        const fields = 'created_time, user_idx, game_idx';
        const questions = "?, ?, ?";
        const query = `INSERT INTO run (${fields}) VALUES (${questions})`;
        const values = [created_time, user_idx, game_idx];
        
        try {
            const result = await queryParamArr(query, values);
            const run_idx = result.insertId;
            
            return run_idx;
        }
        catch (err) {
            console.log("createRun Error");
            throw (err);
        }
    },

    updateRun: async (run_idx, distance, time, user_idx) => {
        const query = `UPDATE run SET distance = CASE WHEN user_idx=${user_idx} THEN ${distance} ELSE distance END, time = CASE WHEN user_idx=${user_idx} THEN ${time} ELSE time END WHERE run_idx=${run_idx}`;
        try {
            const result = await queryParam(query);
            return result;
        } catch (err) {
            console.log("updateRun Error");
            throw(err);
        }
    },

    // 쿼리 2개 쓴다... 최적화하자
    getOpponentInfo: async (run_idx, user_idx) => {
        try {
            const user_query = `SELECT * FROM user WHERE user_idx in (SELECT user_idx FROM run WHERE game_idx in (SELECT IF (user_idx=${user_idx}, game_idx, NULL) FROM run WHERE run_idx=${run_idx}) AND run_idx<>${run_idx})`;
            const user_result = await queryParam(user_query);
            const opponent_idx = user_result[0].user_idx;
            const record_query = `SELECT COUNT(if((user_idx="${opponent_idx}" AND (result=1 OR result=5)), 1, null)) as win, COUNT(if((user_idx="${opponent_idx}" AND (result=2 OR result=3)), 1, null)) as lose FROM run`;
            const record_result = await queryParam(record_query);
            if (record_result.win === undefined) {
                record_result.win = 0;
            }
            if (record_result.lose === undefined) {
                record_result.lose = 0;
            }
            const final_result = {
                nickname: user_result[0].nickname,
                image: user_result[0].image,
                win: record_result[0].win,
                lose: record_result[0].lose
            }
            return final_result;
        } catch (err) {
            console.log("getOpponentInfo Error");
            throw(err);
        }
    },

    getOpponentRun: async (run_idx, user_idx) => {
        const query = `SELECT * FROM run WHERE game_idx in (SELECT IF (user_idx=${user_idx}, game_idx, NULL) FROM run WHERE run_idx=${run_idx}) AND run_idx<>${run_idx}`;
        try {
            const result = await queryParam(query);
            return result;
        } catch (err) {
            console.log("getOpponentRun Error");
            throw(err);
        }
    }
}