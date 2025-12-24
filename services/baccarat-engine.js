var fs = require('fs');
var path = require('path');
var userStore = require('./user-store');

var SUITS = ['S', 'H', 'D', 'C'];
var RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
var DECKS_IN_SHOE = 8;
var DATA_DIR = path.join(__dirname, '..', 'data');
var BETS_FILE = path.join(DATA_DIR, 'bets.txt');
var ROUND_BETS_FILE = path.join(DATA_DIR, 'round-bets.txt');

var state = {
  round: 0,
  shoe: [],
  history: [],
  current: null,
  bets: {
    totals: { player: 0, banker: 0, tie: 0 },
    entries: []
  },
  lastSettlement: null,
  betting: {
    open: false,
    closesAt: null
  }
};

function cardValue(rank) {
  if (rank === 'A') return 1;
  if (rank === 'J' || rank === 'Q' || rank === 'K' || rank === '10') return 0;
  return parseInt(rank, 10);
}

function cardFromCode(code) {
  if (!code || typeof code !== 'string') return null;
  var trimmed = code.toUpperCase().trim();
  var suit = trimmed.slice(-1);
  var rank = trimmed.slice(0, -1);
  if (SUITS.indexOf(suit) === -1 || RANKS.indexOf(rank) === -1) {
    return null;
  }
  return {
    code: rank + suit,
    rank: rank,
    suit: suit,
    value: cardValue(rank)
  };
}

function buildShoe() {
  var cards = [];
  for (var d = 0; d < DECKS_IN_SHOE; d += 1) {
    for (var s = 0; s < SUITS.length; s += 1) {
      for (var r = 0; r < RANKS.length; r += 1) {
        cards.push(cardFromCode(RANKS[r] + SUITS[s]));
      }
    }
  }
  return shuffle(cards);
}

function shuffle(cards) {
  var array = cards.slice();
  for (var i = array.length - 1; i > 0; i -= 1) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = array[i];
    array[i] = array[j];
    array[j] = tmp;
  }
  return array;
}

function ensureShoe() {
  if (state.shoe.length < 20) {
    state.shoe = buildShoe();
  }
}

function drawCard() {
  ensureShoe();
  return state.shoe.shift();
}

function handTotal(cards) {
  var total = 0;
  for (var i = 0; i < cards.length; i += 1) {
    total += cards[i].value;
  }
  return total % 10;
}

function bankerDraws(total, playerThirdValue) {
  if (playerThirdValue === null) {
    return total <= 5;
  }
  if (total <= 2) return true;
  if (total === 3) return playerThirdValue !== 8;
  if (total === 4) return playerThirdValue >= 2 && playerThirdValue <= 7;
  if (total === 5) return playerThirdValue >= 4 && playerThirdValue <= 7;
  if (total === 6) return playerThirdValue === 6 || playerThirdValue === 7;
  return false;
}

function outcomeFor(playerTotal, bankerTotal) {
  if (playerTotal > bankerTotal) return 'player';
  if (bankerTotal > playerTotal) return 'banker';
  return 'tie';
}

function dealRound() {
  ensureShoe();
  state.round += 1;
  state.betting.open = false;
  state.betting.closesAt = null;

  var player = [drawCard(), drawCard()];
  var banker = [drawCard(), drawCard()];
  var playerTotal = handTotal(player);
  var bankerTotal = handTotal(banker);

  var natural = playerTotal >= 8 || bankerTotal >= 8;
  var playerThird = null;

  if (!natural && playerTotal <= 5) {
    playerThird = drawCard();
    player.push(playerThird);
    playerTotal = handTotal(player);
  }

  if (!natural) {
    var bankerShouldDraw = bankerDraws(bankerTotal, playerThird ? playerThird.value : null);
    if (bankerShouldDraw) {
      banker.push(drawCard());
      bankerTotal = handTotal(banker);
    }
  }

  var outcome = outcomeFor(playerTotal, bankerTotal);
  state.current = {
    playerCards: player,
    bankerCards: banker,
    playerTotal: playerTotal,
    bankerTotal: bankerTotal,
    outcome: outcome
  };

  state.history.unshift({
    round: state.round,
    outcome: outcome,
    playerTotal: playerTotal,
    bankerTotal: bankerTotal,
    playerCards: player.map(function(card) { return card.code; }),
    bankerCards: banker.map(function(card) { return card.code; }),
    time: new Date().toISOString()
  });

  if (state.history.length > 30) {
    state.history.pop();
  }

  return getState();
}

function updateCard(slot, code) {
  var card = cardFromCode(code);
  if (!card || !state.current) {
    return false;
  }
  var hand = null;
  var index = -1;
  if (slot.charAt(0) === 'P') {
    hand = state.current.playerCards;
  } else if (slot.charAt(0) === 'B') {
    hand = state.current.bankerCards;
  }
  if (!hand) {
    return false;
  }
  index = parseInt(slot.charAt(1), 10) - 1;
  if (isNaN(index) || index < 0 || index >= hand.length) {
    return false;
  }

  hand[index] = card;
  state.current.playerTotal = handTotal(state.current.playerCards);
  state.current.bankerTotal = handTotal(state.current.bankerCards);
  state.current.outcome = outcomeFor(state.current.playerTotal, state.current.bankerTotal);

  if (state.history.length && state.history[0].round === state.round) {
    state.history[0].outcome = state.current.outcome;
    state.history[0].playerTotal = state.current.playerTotal;
    state.history[0].bankerTotal = state.current.bankerTotal;
    state.history[0].playerCards = state.current.playerCards.map(function(c) { return c.code; });
    state.history[0].bankerCards = state.current.bankerCards.map(function(c) { return c.code; });
  }

  return true;
}

function reset() {
  state.round = 0;
  state.shoe = buildShoe();
  state.history = [];
  state.current = null;
  state.bets = {
    totals: { player: 0, banker: 0, tie: 0 },
    entries: []
  };
  state.lastSettlement = null;
  state.betting = { open: false, closesAt: null };
}

function clearCurrent() {
  state.current = null;
}

function addBet(entry) {
  if (!entry || typeof entry !== 'object') return false;
  if (!isBettingOpen()) return false;
  var user = userStore.getByUid(entry.uid);
  if (!user) return false;
  var side = entry.side;
  var amount = entry.amount;
  if (side !== 'player' && side !== 'banker' && side !== 'tie') {
    return false;
  }
  if (typeof amount !== 'number' || amount <= 0) {
    return false;
  }
  if (user.points < amount) {
    return false;
  }

  userStore.updatePoints(user.uid, -amount);
  state.bets.entries.unshift({
    uid: entry.uid,
    name: user.nickname,
    side: side,
    amount: amount,
    time: new Date().toISOString()
  });
  state.bets.totals[side] += amount;
  if (state.bets.entries.length > 50) {
    state.bets.entries.pop();
  }
  appendBetFile(state.bets.entries[0]);
  return true;
}

function settleBet(entry, outcome) {
  var win = entry.side === outcome;
  if (!win) {
    return 0;
  }
  if (entry.side === 'banker') {
    return entry.amount * 1.95;
  }
  if (entry.side === 'tie') {
    return entry.amount * 9;
  }
  return entry.amount * 2;
}

function closeRound() {
  if (!state.current) {
    state.bets = { totals: { player: 0, banker: 0, tie: 0 }, entries: [] };
    state.lastSettlement = null;
    state.betting.open = false;
    state.betting.closesAt = null;
    return;
  }

  var outcome = state.current.outcome;
  var settlementEntries = state.bets.entries.map(function(entry) {
    var payout = settleBet(entry, outcome);
    if (payout > 0) {
      userStore.updatePoints(entry.uid, payout);
    }
    return {
      uid: entry.uid,
      name: entry.name || 'Anonymous',
      side: entry.side,
      amount: entry.amount,
      payout: payout,
      net: payout - entry.amount
    };
  });

  var totalNet = settlementEntries.reduce(function(sum, entry) {
    return sum + entry.net;
  }, 0);

  state.lastSettlement = {
    round: state.round,
    outcome: outcome,
    entries: settlementEntries,
    totalNet: totalNet,
    time: new Date().toISOString()
  };

  appendRoundBetsLog({
    round: state.round,
    outcome: outcome,
    totals: {
      player: state.bets.totals.player,
      banker: state.bets.totals.banker,
      tie: state.bets.totals.tie
    },
    entries: state.bets.entries.map(function(entry) {
      return {
        name: entry.name || 'Anonymous',
        side: entry.side,
        amount: entry.amount,
        time: entry.time
      };
    }),
    time: new Date().toISOString()
  });

  state.bets = {
    totals: { player: 0, banker: 0, tie: 0 },
    entries: []
  };
  state.current = null;
}

function startBettingWindow(seconds) {
  if (state.current) return false;
  if (state.betting.open && isBettingOpen()) return false;
  state.betting.open = true;
  state.betting.closesAt = Date.now() + seconds * 1000;
  return true;
}

function isBettingOpen() {
  if (!state.betting.open || !state.betting.closesAt) return false;
  return Date.now() < state.betting.closesAt;
}

function secondsLeft() {
  if (!state.betting.open || !state.betting.closesAt) return 0;
  var diff = Math.ceil((state.betting.closesAt - Date.now()) / 1000);
  return diff > 0 ? diff : 0;
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function appendBetFile(bet) {
  ensureDataDir();
  var line = JSON.stringify(bet) + '\n';
  fs.appendFileSync(BETS_FILE, line, 'utf8');
}

function writeBetsFile(entries) {
  ensureDataDir();
  var content = entries.map(function(item) {
    return JSON.stringify(item);
  }).join('\n');
  if (content.length) {
    content += '\n';
  }
  fs.writeFileSync(BETS_FILE, content, 'utf8');
}

function appendRoundBetsLog(payload) {
  ensureDataDir();
  fs.appendFileSync(ROUND_BETS_FILE, JSON.stringify(payload) + '\n', 'utf8');
}

function getState() {
  var participants = [];
  var seen = {};
  state.bets.entries.forEach(function(entry) {
    if (seen[entry.uid]) return;
    seen[entry.uid] = true;
    var user = userStore.getByUid(entry.uid);
    if (!user) return;
    participants.push({
      uid: user.uid,
      nickname: user.nickname,
      points: user.points
    });
  });

  return {
    round: state.round,
    shoeRemaining: state.shoe.length,
    current: state.current ? {
      playerCards: state.current.playerCards.map(function(c) { return c.code; }),
      bankerCards: state.current.bankerCards.map(function(c) { return c.code; }),
      playerTotal: state.current.playerTotal,
      bankerTotal: state.current.bankerTotal,
      outcome: state.current.outcome
    } : null,
    history: state.history.slice(),
    bets: {
      totals: {
        player: state.bets.totals.player,
        banker: state.bets.totals.banker,
        tie: state.bets.totals.tie
      },
      entries: state.bets.entries.slice()
    },
    participants: participants,
    lastSettlement: state.lastSettlement,
    betting: {
      open: isBettingOpen(),
      closesAt: state.betting.closesAt,
      secondsLeft: secondsLeft()
    }
  };
}

state.shoe = buildShoe();

module.exports = {
  dealRound: dealRound,
  updateCard: updateCard,
  clearCurrent: clearCurrent,
  closeRound: closeRound,
  reset: reset,
  getState: getState,
  addBet: addBet,
  startBettingWindow: startBettingWindow
};
