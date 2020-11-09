const pool = require('../modules/pool');
const jwt = require('../modules/jwt');
const { query } = require('express');

const user = {
    signUp: async (uuid) => {
        const adjective = ["화가 난 ", "졸린 ", "배고픈 ", "바람난 ", "불타오르는 ", "안 씻는 ", "가출한 ", "외로운 ", "똑똑한 ", "춤추는 ", "귀여운 ", "배부른 "];
        const people = ["지은", "태영", "가은", "유림", "예린", "수현", "세곤", "채원", "태진", "세환", "가희", "민희", "영재"];
        const gender = Math.ceil(Math.random() * 2);
        const nickname = adjective[Math.floor(Math.random() * adjective.length)] + people[Math.floor(Math.random() * people.length)];
        const questions = "?, ?, ?, ?, ?, ?";
        const level = 1;
        const badge = "000000000000";
        const image = Math.ceil(Math.random() * 9); // 1 ~ 9
        const fields = "uuid, nickname, gender, level, image, badge";
        const query = `INSERT INTO user (${fields}) VALUES (${questions})`;
        const values = [uuid, nickname, gender, level, image, badge];
        try {
            const result = await pool.queryParamArr(query, values);
            const user = {
                user_idx: result.insertId,
                uuid: uuid,
                nickname: nickname,
                gender: gender,
                level: level,
                image: image,
                badge: badge,
                win: 0,
                lose: 0
            };

            return user;

        } catch (err) {
            console.log("signUp ERROR: ", err);
        }
    },

    getUserByUUID: async (uuid) => {
        try {
            const user_query = `SELECT * FROM user WHERE uuid="${uuid}"`;
            const user_result = await pool.queryParam(user_query);
            console.log("USER RESULT: ", user_result);
            if (user_result.length === 0) {
                return user_result;
            }
            else {
                const user_idx = user_result[0].user_idx;
                const record_query = `SELECT COUNT(if((user_idx="${user_idx}" AND (result=1 OR result=5)), 1, null)) as win, COUNT(if((user_idx="${user_idx}" AND (result=2 OR result=3)), 1, null)) as lose FROM run`;
                const record_result = await pool.queryParam(record_query);
                if (record_result.win === undefined) {
                    record_result.win = 0;
                }
                if (record_result.lose === undefined) {
                    record_result.lose = 0;
                }
                const final_result = {
                    user_idx: user_idx,
                    uuid: uuid,
                    nickname: user_result[0].nickname,
                    gender: user_result[0].gender,
                    level: user_result[0].level,
                    image: user_result[0].image,
                    badge: user_result[0].badge,
                    win: record_result[0].win,
                    lose: record_result[0].lose
                };
                return [final_result];
            }
        } catch (err) {
            console.log("getUserByUUID ERROR: ", err);
            throw err;
        }
    }
}

module.exports = user;