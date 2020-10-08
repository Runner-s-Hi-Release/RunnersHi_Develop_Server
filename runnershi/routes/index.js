var express = require('express');
var router = express.Router();

/* GET home page. */
router.use('/user', require('./user'));
router.use('/running', require('./running'));

//ranking 
router.use('/ranking', require('./ranking'));

//record
//router.use('/record', require('./record'));

module.exports = router;
