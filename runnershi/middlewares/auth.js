const { return } = require('../config/database');
const jwt = require('../modules/jwt');
const MSG = require('../modules/responseMessage');
const CODE = require('../modules/statusCode');
const util = require('../modules/util');
const TOKEN_EXPIRED = -3;
const TOKEN_INVALID = -2;

const authUtil = {
    checkToken: async (req, res, next) => {
        var token = req.headers.jwt;
        
        if (!token) {
            res.json(util.fail(CODE.BAD_REQUEST, MSG.EMPTY_TOKEN));
            return;
        }
        const user = await jwt.verify(token);
        if (user === TOKEN_EXPIRED) {
            res.json(util.fail(CODE.UNAUTHORIZED, MSG.EXPIRED_TOKEN));
            return;
        }
        else if (user === TOKEN_INVALID) {
            res.json(util.fail(CODE.UNAUTHORIZED, MSG.INVALID_TOKEN));
            return;
        }
        else if (user.userIdx === undefined) {
            res.json(util.fail(CODE.UNAUTHORIZED, MSG.INVALID_TOKEN));
            return;
        }
        else {
            req.decoded = user;
            next();
        }
        
    }
}
module.exports = authUtil;