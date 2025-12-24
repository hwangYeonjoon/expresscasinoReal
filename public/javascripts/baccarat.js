var apiBase = '/api/baccarat';
var slots = ['P1', 'P2', 'P3', 'B1', 'B2', 'B3'];
var rankOptions = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
var suitOptions = ['S', 'H', 'D', 'C'];

function toOutcome(outcome) {
  if (outcome === 'player') return 'PLAYER';
  if (outcome === 'banker') return 'BANKER';
  if (outcome === 'tie') return 'TIE';
  return '-';
}

function updateText(id, value) {
  var el = document.getElementById(id);
  if (el) el.textContent = value;
}

function setCardImage(slot, code) {
  var img = document.getElementById('card' + slot);
  if (!img) return;
  var src = code ? '/cards/' + code + '.svg' : '/cards/empty.svg';
  img.src = src;
}

function renderHistory(items) {
  var list = document.getElementById('historyList');
  if (!list) return;
  list.innerHTML = '';
  if (!items || !items.length) {
    var empty = document.createElement('li');
    empty.textContent = '아직 기록이 없습니다.';
    list.appendChild(empty);
    return;
  }
  items.forEach(function(item) {
    var li = document.createElement('li');
    li.textContent = '#' + item.round + ' ' + toOutcome(item.outcome) + ' (' + item.playerTotal + ':' + item.bankerTotal + ')';
    list.appendChild(li);
  });
}

function renderState(state) {
  updateText('roundCount', state.round);
  updateText('roundOnTable', state.round);
  updateText('shoeCount', state.shoeRemaining);

  if (!state.current) {
    updateText('playerTotal', 0);
    updateText('bankerTotal', 0);
    updateText('lastOutcomeValue', '-');
    slots.forEach(function(slot) { setCardImage(slot, null); });
    renderHistory(state.history);
    updateSelects(null);
    return;
  }

  var current = state.current;
  updateText('playerTotal', current.playerTotal);
  updateText('bankerTotal', current.bankerTotal);
  updateText('lastOutcomeValue', toOutcome(current.outcome));

  setCardImage('P1', current.playerCards[0]);
  setCardImage('P2', current.playerCards[1]);
  setCardImage('P3', current.playerCards[2]);
  setCardImage('B1', current.bankerCards[0]);
  setCardImage('B2', current.bankerCards[1]);
  setCardImage('B3', current.bankerCards[2]);

  renderHistory(state.history);
  updateSelects(current);
}

function updateSelects(current) {
  slots.forEach(function(slot) {
    var select = document.getElementById('select' + slot);
    if (!select) return;
    var currentCode = null;
    if (current) {
      if (slot.charAt(0) === 'P') {
        currentCode = current.playerCards[parseInt(slot.charAt(1), 10) - 1];
      } else {
        currentCode = current.bankerCards[parseInt(slot.charAt(1), 10) - 1];
      }
    }
    select.innerHTML = '';
    if (!currentCode) {
      var emptyOpt = document.createElement('option');
      emptyOpt.value = '';
      emptyOpt.textContent = '없음';
      select.appendChild(emptyOpt);
      select.disabled = true;
      return;
    }
    select.disabled = false;
    buildCardOptions(select, currentCode);
  });
}

function buildCardOptions(select, currentCode) {
  rankOptions.forEach(function(rank) {
    suitOptions.forEach(function(suit) {
      var code = rank + suit;
      var opt = document.createElement('option');
      opt.value = code;
      opt.textContent = code;
      if (code === currentCode) opt.selected = true;
      select.appendChild(opt);
    });
  });
}

function fetchState() {
  return fetch(apiBase + '/state')
    .then(function(res) { return res.json(); })
    .then(renderState);
}

function postJson(path, body) {
  return fetch(apiBase + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : null
  }).then(function(res) {
    if (!res.ok) {
      return res.json().then(function(err) { throw err; });
    }
    return res.json();
  }).then(renderState);
}

document.addEventListener('DOMContentLoaded', function() {
  var dealBtn = document.getElementById('dealBtn');
  var clearBtn = document.getElementById('clearBtn');
  var resetBtn = document.getElementById('resetBtn');

  if (dealBtn) {
    dealBtn.addEventListener('click', function() {
      postJson('/deal');
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', function() {
      postJson('/reset');
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', function() {
      postJson('/clear');
    });
  }

  slots.forEach(function(slot) {
    var select = document.getElementById('select' + slot);
    if (!select) return;
    select.addEventListener('change', function() {
      var code = select.value;
      if (!code) return;
      postJson('/edit', { slot: slot, code: code });
    });
  });

  fetchState();
});
