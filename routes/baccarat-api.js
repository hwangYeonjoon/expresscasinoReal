var express = require('express');
var engine = require('../services/baccarat-engine');
var auth = require('../services/auth');

var router = express.Router();
var sseClients = [];
var bettingTimer = null;
var bettingTick = null;
var roundCloseTimer = null;
var autoStartEnabled = true;

function sendSse(res, payload) {
  res.write('event: state\n');
  res.write('data: ' + JSON.stringify(payload) + '\n\n');
}

function buildState() {
  var payload = engine.getState();
  payload.autoStart = autoStartEnabled;
  return payload;
}

function broadcastState() {
  var payload = buildState();
  sseClients.forEach(function(res) {
    sendSse(res, payload);
  });
}

function cancelBettingCountdown() {
  if (bettingTimer) {
    clearTimeout(bettingTimer);
    bettingTimer = null;
  }
  if (bettingTick) {
    clearInterval(bettingTick);
    bettingTick = null;
  }
}

function cancelRoundClose() {
  if (roundCloseTimer) {
    clearTimeout(roundCloseTimer);
    roundCloseTimer = null;
  }
}

function scheduleRoundClose() {
  cancelRoundClose();
  if (!autoStartEnabled) return;
  roundCloseTimer = setTimeout(function() {
    cancelRoundClose();
    engine.closeRound();
    broadcastState();
    if (autoStartEnabled) {
      startBettingCountdown(5);
    }
  }, 5000);
}

function startBettingCountdown(seconds) {
  cancelBettingCountdown();
  var ok = engine.startBettingWindow(seconds);
  if (!ok) return false;
  broadcastState();
  bettingTick = setInterval(function() {
    broadcastState();
  }, 1000);
  bettingTimer = setTimeout(function() {
    cancelBettingCountdown();
    engine.dealRound();
    broadcastState();
    scheduleRoundClose();
  }, seconds * 1000);
  return true;
}

router.get('/state', function(req, res) {
  res.json(buildState());
});

router.get('/events', function(req, res) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  sseClients.push(res);
  sendSse(res, engine.getState());

  req.on('close', function() {
    sseClients = sseClients.filter(function(client) { return client !== res; });
  });
});

router.get('/bets', function(req, res) {
  res.json(buildState().bets);
});

router.post('/deal', function(req, res) {
  var ok = startBettingCountdown(5);
  if (!ok) {
    res.status(400).json({ error: 'betting_in_progress' });
    return;
  }
  res.json(buildState());
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
  broadcastState();
  res.json(engine.getState());
});

router.post('/clear', function(req, res) {
  cancelBettingCountdown();
  cancelRoundClose();
  engine.closeRound();
  if (autoStartEnabled) {
    startBettingCountdown(5);
  }
  broadcastState();
  res.json(buildState());
});

router.post('/reset', function(req, res) {
  cancelBettingCountdown();
  cancelRoundClose();
  engine.reset();
  broadcastState();
  res.json(buildState());
});

router.post('/bets', function(req, res) {
  var user = auth.getUserFromRequest(req);
  if (!user) {
    res.status(401).json({ error: 'not_authenticated' });
    return;
  }
  var side = req.body && req.body.side;
  var amount = req.body && req.body.amount;
  var ok = engine.addBet({ uid: user.uid, side: side, amount: amount });
  if (!ok) {
    res.status(400).json({ error: 'invalid_bet' });
    return;
  }
  broadcastState();
  res.json(buildState());
});

router.post('/auto', function(req, res) {
  var enabled = req.body && req.body.enabled;
  autoStartEnabled = enabled !== false;
  if (!autoStartEnabled) {
    cancelBettingCountdown();
    cancelRoundClose();
  }
  broadcastState();
  res.json(buildState());
});

module.exports = router;
