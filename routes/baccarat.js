var express = require('express');
var auth = require('../services/auth');

var router = express.Router();
var ADMIN_UIDS = { admin: true, Umjjo8ft0pdq9ae: true };

function requireAdmin(req, res, next) {
  var user = auth.getUserFromRequest(req);
  if (!user) {
    res.redirect('/auth/login');
    return;
  }
  if (!ADMIN_UIDS[user.uid]) {
    res.status(403).send('forbidden');
    return;
  }
  next();
}

router.get('/', function(req, res) {
  res.render('baccarat', { title: 'Baccarat Table' });
});

router.get('/admin', requireAdmin, function(req, res) {
  res.render('baccarat-admin', { title: 'Baccarat Admin' });
});

module.exports = router;
