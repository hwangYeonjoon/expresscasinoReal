var express = require('express');
var engine = require('../services/baccarat-engine');

var router = express.Router();

router.get('/state', function(req, res) {
  res.json(engine.getState());
});

router.get('/bets', function(req, res) {
  res.json(engine.getState().bets);
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

router.post('/bets', function(req, res) {
  var name = req.body && req.body.name;
  var side = req.body && req.body.side;
  var amount = req.body && req.body.amount;
  var ok = engine.addBet({ name: name, side: side, amount: amount });
  if (!ok) {
    res.status(400).json({ error: 'invalid_bet' });
    return;
  }
  res.json(engine.getState());
});

module.exports = router;
