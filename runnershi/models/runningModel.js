const { queryParam, queryParamArr } = require('../modules/pool');

// UPDATE/INSERT Packet Example
// OkPacket {
//     fieldCount: 0,
//     affectedRows: 0,
//     insertId: 0,
//     serverStatus: 34,
//     warningCount: 0,
//     message: '(Rows matched: 0  Changed: 0  Warnings: 0',
//     protocol41: true,
//     changedRows: 0
//   }

module.exports = {

    insertGame: async() => {
        try {
            const query = "INSERT INTO game (game_idx) VALUES (0)";
            const result = await queryParam(query);
            return result.insertId;
        } catch (err) {
            console.log("insertGame Error");
            throw (err);
        }
    },

    startMatching: async(user_idx, time, wantGender, gender, level, nickname, image) => {
        try {
            const fields = 'user_idx, time, wantGender, gender, level, nickname, image, matched';
            const questions = '?, ?, ?, ?, ?, ?, ?, ?';
            const values = [user_idx, time, wantGender, gender, level, nickname, image, 0];
            const insert_query = `INSERT INTO awaiter (${fields}) VALUES (${questions}) ON DUPLICATE KEY UPDATE time=${time}, wantGender=${wantGender}, gender=${gender}, level=${level}, nickname="${nickname}", image=${image}, matched=0`;
            const insert_result = await queryParamArr(insert_query, values);
            console.log("INSERT RESULT: ", insert_result);
            return insert_result;
        } catch (err) {
            console.log("startMatching Error");
            throw(err);
        }
    },

    findMatching: async(user_idx) => {
        try {
            const awaiter_query = `SELECT * FROM awaiter WHERE user_idx=${user_idx}`;
            const awaiter_info = await queryParam(awaiter_query);
            const {time, wantGender, gender, level, nickname, image} = awaiter_info[0];
            const opponent_query = `SELECT user_idx FROM awaiter WHERE time=${time} AND (wantGender=3 OR wantGender=${gender}) AND (${wantGender}=3 OR ${wantGender}=gender) AND level=${level} LIMIT 1`;
            const opponent_result = await queryParam(opponent_query);
            console.log("OPPONENT RESULT: ", opponent_result);
            if (opponent_result.length === 0) {
                return 'NOT FOUND';
            }
            else {
                const update_query = `UPDATE awaiter SET matched=${opponent_result[0].user_idx} WHERE user_idx=${user_idx}`;
                const update_result = await queryParam(update_query);
                if (update_result.changedRows === 1) {
                    return 'FOUND';
                }
                else {
                    return 'SOMETHING WENT WRONG';
                }
            }
        } catch (err) {
            console.log("findMatching Error");
            throw(err);
        }
    },

    confirmMatching: async(user_idx) => {
        try {
            const query = `SELECT * FROM awaiter WHERE user_idx IN (SELECT matched FROM awaiter WHERE user_idx=${user_idx})`;
            const result = await queryParam(query);
            return result;
        } catch (err) {
            console.log("confirmMatching Error");
            throw(err);
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
        } catch (err) {
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
            console.log("User Result: ", user_result);
            if (user_result.length === 0) {
                return user_result;
            }
            else {
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
                    level: user_result[0].level,
                    win: record_result[0].win,
                    lose: record_result[0].lose
                }
                return [final_result];
            }
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