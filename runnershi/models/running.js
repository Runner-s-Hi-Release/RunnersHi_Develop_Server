const userModel = require('../models/user');
const util = require('../modules/util');
const status = require('../modules/statusCode');
const msg = require('../modules/responseMessage');

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
        const run_fields = 'created_time, user_idx, game_idx';
        const questions = "?, ?, ?";
        const run_query = `INSERT INTO run (${run_fields}) VALUES (${questions})`;
        const run_values = [created_time, user_idx, game_idx];
        
        try {
            const run_result = await queryParamArr(run_query, run_values);
            const run_idx = run_result.insertId;
            
            return run_idx;
        }
        catch (err) {
            console.log("createRun Error");
            throw (err);
        }
    },

    updateRun: async (req, res) => {

    }
}