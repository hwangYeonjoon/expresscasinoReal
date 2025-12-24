var express = require('express');
var router = express.Router();

router.get('/', function(req, res) {
  res.render('baccarat', { title: 'Baccarat Table' });
});

router.get('/admin', function(req, res) {
  res.render('baccarat-admin', { title: 'Baccarat Admin' });
});

module.exports = router;
