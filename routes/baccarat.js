var express = require('express');
var router = express.Router();

router.get('/', function(req, res) {
  res.render('baccarat', { title: 'Baccarat Control Table' });
});

module.exports = router;
