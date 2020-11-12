const UserModel = require('../models/userModel');
const util = require('../modules/util');
const CODE = require('../modules/statusCode');
const MSG = require('../modules/responseMessage');
const encrypt = require('../modules/crypto');
const jwt = require('../modules/jwt');

module.exports = {
    signUUID: async (req, res) => {
        const {uuid} = req.body;
        if (!uuid) {
            res.status(CODE.BAD_REQUEST).send(util.fail(CODE.BAD_REQUEST, MSG.NULL_VALUE));
            return;
        }
        // 등록돼있는 UUID인지 확인
        const user = await UserModel.getUserByUUID(uuid);
        if (user[0] === undefined) {
            // 등록돼있지 않을 때
            const payload = await UserModel.signUp(uuid);
            if (payload.userIdx === -1) {
                return res.status(CODE.DB_ERROR).send(util.fail(CODE.DB_ERROR, MSG.DB_ERROR));
            }
            else {
                const { token, refreshToken } = await jwt.sign(payload);
                let badge_arr = [];
                for (var i = 0; i < payload.badge.length; i++) {
                    if (payload.badge[i] === '0') {
                        badge_arr.push(false);
                    }
                    else if (payload.badge[i] === '1') {
                        badge_arr.push(true);
                    }
                    else {
                        console.log('something wrong with badge!');
                    }
                }
                res.status(CODE.OK).send(util.success(CODE.OK, MSG.CREATED_USER, { accessToken: token, nickname: payload.nickname, gender: payload.gender, level: payload.level, image: payload.image, badge: badge_arr, win: 0, lose: 0 }));
            }
        }
        else {
            // 등록돼있을 때
            const { token, refreshToken } = await jwt.sign(user[0]);
            let badge_arr = [];
            for (var i = 0; i < user[0].badge.length; i++) {
                console.log(user[0]['badge'][i])
                if (user[0]['badge'][i] === '0') {
                    badge_arr.push(false);
                }
                else if (user[0]['badge'][i] === '1') {
                    badge_arr.push(true);
                }
                else {
                    console.log('something wrong with badge!');
                }
            }
            res.status(CODE.OK).send(util.success(CODE.OK, MSG.LOGIN_SUCCESS, { accessToken: token,  nickname: user[0].nickname, gender: user[0].gender, level: user[0].level, image: user[0].image, badge: badge_arr, win: user[0].win, lose: user[0].lose }));
        }
    }
}