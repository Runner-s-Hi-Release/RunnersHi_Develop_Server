const RunningModel = require('../models/running');
const util = require('../modules/util');
const CODE = require('../modules/statusCode');
const MSG = require('../modules/responseMessage');
const encrypt = require('../modules/crypto');
const jwt = require('../modules/jwt');

module.exports = {
    startMatching: async (req, res) => {
        const { token, time, wantGender } = req.body;
        if (!token || !time || !wantGender) {
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
                res.status(CODE.OK).send(util.success(CODE.OK, MSG.CREATED_USER, { accessToken: token }));
            }
        }
        else {
            // 등록돼있을 때
            const { token, refreshToken } = await jwt.sign(user[0]);
            res.status(CODE.OK).send(util.success(CODE.OK, MSG.LOGIN_SUCCESS, { accessToken: token }));
        }
    }
}