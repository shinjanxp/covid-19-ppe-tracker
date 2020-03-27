var express = require('express');
var router = express.Router();
var models  = require('../models');


/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});
router.get('/ppe/create', function (req, res, next) {
  res.sendfile('./public/ppe-create.html');
});

router.post('/ppe', function (req, res, next) {
  console.log(req.body);
  res.sendfile('./public/ppe-create.html');
})

module.exports = router;
