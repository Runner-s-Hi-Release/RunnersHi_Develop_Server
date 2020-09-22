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
        const query = `UPDATE run SET distance = IF (user_idx = '${user_idx}', '${distance}', distance) time = IF (user_idx = '${user_idx}', '${time}', time) WHERE run_idx=${run_idx}`;
        try {
            const result = await queryParam(query);
            return result;
        } catch (err) {
            console.log("updateRun Error");
            throw(err);
        }
    }
}