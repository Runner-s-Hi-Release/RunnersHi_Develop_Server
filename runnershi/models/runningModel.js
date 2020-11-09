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
    getOpponentRecord: async (user_idx) => {
        try {
            const query = `SELECT COUNT(IF((user_idx=${user_idx} AND result=1), 1, null)) AS win, COUNT(IF((user_idx=${user_idx} AND (result=2)), 1, null)) AS lose FROM run`;
            console.log(query);
            const result = await queryParam(query);
            if (result.win === undefined) {
                result.win = 0;
            }
            if (result.lose === undefined) {
                result.lose = 0;
            }
            return result;
        } catch (err) {
            console.log("getOpponentRecord Error from runningModel");
            throw(err);
        }
    },

    insertGame: async(time) => {
        try {
            let query = `INSERT INTO game (game_idx, time) VALUES (0, ${time})`;
            const result = await queryParam(query);
            return result.insertId;
        }
        catch (err) {
            console.log("insertGame Error from runningModel");
            throw (err);
        }
    },

    insertRun: async(created_time, game_idx, user_idx) => {
        const fields = 'created_time, game_idx, user_idx';
        const questions = "?, ?, ?";
        const query = `INSERT INTO run (${fields}) VALUES (${questions})`;
        const values = [created_time, game_idx, user_idx];
        
        try {
            const result = await queryParamArr(query, values);
            const run_idx = result.insertId;
            
            return run_idx;
        }
        catch (err) {
            console.log("createRun Error from runningModel");
            throw (err);
        }
    },

    updateRun: async (run_idx, distance, time, user_idx) => {
        const query = `UPDATE run SET distance = CASE WHEN user_idx=${user_idx} THEN ${distance} ELSE distance END, time = CASE WHEN user_idx=${user_idx} THEN ${time} ELSE time END WHERE run_idx=${run_idx}`;
        try {
            const result = await queryParam(query);
            return result;
        } catch (err) {
            console.log("updateRun Error from runningModel");
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
            console.log("getOpponentInfo Error from runningModel");
            throw(err);
        }
    },

    getRanking: async (run_idx_str) => {
        const run_idx = parseInt(run_idx_str, 10);
        const query = `SELECT * FROM run WHERE game_idx in (SELECT game_idx FROM run WHERE run_idx=${run_idx})`;
        try {
            const result = await queryParam(query);
            const user = result.find(element => element.run_idx === run_idx);
            const opponent = result.find(element => element.run_idx !== run_idx);
            if (user === undefined) {
                return 0;
            }
            else if (opponent.result === 3) {
                return 3;
            }
            else if (user.distance >= opponent.distance) {
                return 1;
            }
            else {
                return 2;
            }
        } catch (err) {
            console.log("getRanking Error from runningModel");
            throw(err);
        }
    },

    stopRunning: async (end_time, run_idx, user_idx) => {
        try {
            const query = `UPDATE run AS user, run As opponent SET user.result = IF (opponent.result=3, 4, 3), user.end_time="${end_time}" WHERE user.run_idx=${run_idx} AND opponent.game_idx=user.game_idx AND opponent.user_idx<>${user_idx} AND user.user_idx=${user_idx};`;
            const result = await queryParam(query);
            return result;
        } catch (err) {
            console.log("stopRunning Error from runningModel");
            throw(err);
        }
    },

    insertCoordinates: async (run_idx, coordinates) => {
        try {
            let coordinateArr = [];
            const coordinate_fields = `latitude, longitude, run_idx`;
            if (coordinates.length !== 0) {
                for (var i = 0; i < coordinates.length; i++) {
                    let temp = Object.values(coordinates[i]);
                    temp.push(run_idx);
                    coordinateArr.push(temp);
                }
                const coordinate_query = `INSERT INTO coordinate (${coordinate_fields}) VALUES ?`;
                const coordinate_result = await queryParamArr(coordinate_query, [coordinateArr]);
                return coordinate_result;
            }
            // 나중에 채워넣기
        } catch (err) {
            console.log("insertCoordinates Error from runningModel");
            throw(err);
        }
    },
    
    endRunning: async (end_time, run_idx, user_idx) => {
        try {
            const update_query = `UPDATE run AS user, run As opponent SET user.result = CASE\
            WHEN opponent.result=1 THEN 2\
            WHEN opponent.result=2 THEN 1\
            WHEN opponent.result=3 THEN 1\
            WHEN opponent.result=5 THEN 5\
            WHEN opponent.distance=user.distance THEN 5\
            WHEN opponent.distance<user.distance THEN 1\
            WHEN opponent.distance>user.distance THEN 2\
            END,\
            user.end_time="${end_time}"\
            WHERE user.run_idx=${run_idx} AND opponent.game_idx=user.game_idx AND opponent.user_idx<>${user_idx} AND user.user_idx=${user_idx};`;
            const update_result = await queryParam(update_query);
            if (update_result.changedRows !== 1) {
                return 0;
            }
            else {
                const select_query = `SELECT result FROM run WHERE run_idx=${run_idx}`;
                const select_result = await queryParam(select_query);
                return select_result[0].result;
            }
        } catch (err) {
            console.log("endRunning Error from runningModel");
            throw(err);
        }
    }
}