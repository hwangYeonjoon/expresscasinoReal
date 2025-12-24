var express = require('express');
var engine = require('../services/baccarat-engine');

var router = express.Router();

router.get('/state', function(req, res) {
  res.json(engine.getState());
});

router.post('/deal', function(req, res) {
  res.json(engine.dealRound());
});

router.post('/edit', function(req, res) {
  var slot = req.body && req.body.slot;
  var code = req.body && req.body.code;
  if (!slot || !code) {
    res.status(400).json({ error: 'missing_params' });
    return;
  }
  var updated = engine.updateCard(slot, code);
  if (!updated) {
    res.status(400).json({ error: 'invalid_card' });
    return;
  }
  res.json(engine.getState());
});

router.post('/clear', function(req, res) {
  engine.clearCurrent();
  res.json(engine.getState());
});

router.post('/reset', function(req, res) {
  engine.reset();
  res.json(engine.getState());
});

module.exports = router;
