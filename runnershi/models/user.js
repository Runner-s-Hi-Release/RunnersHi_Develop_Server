const pool = require('../modules/pool');
const jwt = require('../modules/jwt');

const user = {
    signUp: async (uuid) => {
        const adjective = ["화가 난 ", "졸린 ", "배고픈 ", "바람난 ", "불타오르는 ", "안 씻는 ", "가출한 ", "외로운 ", "똑똑한 ", "춤추는 ", "귀여운 ", "배부른 "];
        const people = ["지은", "태영", "가은", "유림", "예린", "수현", "세곤", "채원", "태진", "세환", "가희", "민희", "영재"];
        const gender = Math.ceil(Math.random() * 2);
        const nickname = adjective[Math.floor(Math.random() * adjective.length)] + people[Math.floor(Math.random() * people.length)];
        const questions = "?, ?, ?, ?, ?";
        const badge = "000000000000";
        const image = Math.ceil(Math.random() * 9); // 1 ~ 9
        const query = `INSERT INTO USER (${fields} VALUES ${questions})`;
        const values = [uuid, nickname, gender, image, badge];
        try {
            const result = await pool.queryParamArr(query, values);
            const user = {
                user_idx: result.insertId,
                uuid: uuid,
                nickname: nickname,
                gender: gender,
                image: image,
                badge: badge
            };

            return user;

        } catch (err) {
            console.log("signUp ERROR: ", err);
        }
    },

    getUserByUUID: async (uuid) => {
        const query = `SELECT * FROM USER WHERE uuid="${uuid}"`;
        try {
            return await pool.queryParam(query);
        } catch (err) {
            console.log("getUserByUUID ERROR: ", err);
            throw err;
        }
    }
}

module.exports = user;