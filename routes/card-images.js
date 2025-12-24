var express = require('express');

var router = express.Router();

var SUIT_COLORS = {
  S: '#1b1b1b',
  C: '#1b1b1b',
  H: '#b32b2b',
  D: '#b32b2b'
};

var RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
var SUITS = ['S', 'H', 'D', 'C'];

function parseCode(code) {
  var upper = code.toUpperCase();
  if (upper === 'BACK' || upper === 'EMPTY') {
    return { type: upper };
  }
  var suit = upper.slice(-1);
  var rank = upper.slice(0, -1);
  if (SUITS.indexOf(suit) === -1 || RANKS.indexOf(rank) === -1) {
    return null;
  }
  return { type: 'CARD', rank: rank, suit: suit };
}

function suitShape(suit, fill) {
  if (suit === 'H') {
    return [
      '<circle cx="35" cy="35" r="18" fill="', fill, '"/>',
      '<circle cx="65" cy="35" r="18" fill="', fill, '"/>',
      '<polygon points="10,45 90,45 50,95" fill="', fill, '"/>'
    ].join('');
  }
  if (suit === 'D') {
    return '<polygon points="50,5 95,50 50,95 5,50" fill="' + fill + '"/>';
  }
  if (suit === 'S') {
    return [
      '<circle cx="35" cy="50" r="18" fill="', fill, '"/>',
      '<circle cx="65" cy="50" r="18" fill="', fill, '"/>',
      '<polygon points="10,55 90,55 50,5" fill="', fill, '"/>',
      '<rect x="45" y="55" width="10" height="25" fill="', fill, '"/>',
      '<polygon points="35,80 65,80 50,95" fill="', fill, '"/>'
    ].join('');
  }
  return [
    '<circle cx="35" cy="55" r="18" fill="', fill, '"/>',
    '<circle cx="65" cy="55" r="18" fill="', fill, '"/>',
    '<circle cx="50" cy="30" r="18" fill="', fill, '"/>',
    '<rect x="45" y="60" width="10" height="25" fill="', fill, '"/>',
    '<polygon points="35,85 65,85 50,98" fill="', fill, '"/>'
  ].join('');
}

function renderCardSvg(rank, suit) {
  var color = SUIT_COLORS[suit] || '#1b1b1b';
  var pip = suitShape(suit, color);
  var smallPip = [
    '<g transform="translate(0 0) scale(0.3)">',
    suitShape(suit, color),
    '</g>'
  ].join('');
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<svg xmlns="http://www.w3.org/2000/svg" width="180" height="260" viewBox="0 0 180 260">',
    '<rect x="6" y="6" width="168" height="248" rx="18" fill="#ffffff" stroke="#d6c8b2" stroke-width="2"/>',
    '<text x="22" y="36" font-size="24" font-family="Georgia, serif" fill="', color, '">', rank, '</text>',
    '<g transform="translate(24 46)">', smallPip, '</g>',
    '<g transform="translate(40 90)">', pip, '</g>',
    '<text x="136" y="230" font-size="24" font-family="Georgia, serif" fill="', color, '">', rank, '</text>',
    '<g transform="translate(126 190)">', smallPip, '</g>',
    '</svg>'
  ].join('');
}

function renderBackSvg() {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<svg xmlns="http://www.w3.org/2000/svg" width="180" height="260" viewBox="0 0 180 260">',
    '<defs>',
    '<linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">',
    '<stop offset="0%" stop-color="#102f2a"/>',
    '<stop offset="100%" stop-color="#0a1e1a"/>',
    '</linearGradient>',
    '</defs>',
    '<rect x="6" y="6" width="168" height="248" rx="18" fill="url(#bg)" stroke="#d6c8b2" stroke-width="2"/>',
    '<rect x="20" y="20" width="140" height="220" rx="12" fill="none" stroke="#f0c675" stroke-width="3"/>',
    '<line x1="20" y1="60" x2="160" y2="60" stroke="#f0c675" stroke-width="2" opacity="0.6"/>',
    '<line x1="20" y1="120" x2="160" y2="120" stroke="#f0c675" stroke-width="2" opacity="0.6"/>',
    '<line x1="20" y1="180" x2="160" y2="180" stroke="#f0c675" stroke-width="2" opacity="0.6"/>',
    '</svg>'
  ].join('');
}

function renderEmptySvg() {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<svg xmlns="http://www.w3.org/2000/svg" width="180" height="260" viewBox="0 0 180 260">',
    '<rect x="6" y="6" width="168" height="248" rx="18" fill="rgba(255,255,255,0.05)" stroke="#4b5c55" stroke-width="2" stroke-dasharray="8 6"/>',
    '</svg>'
  ].join('');
}

router.get('/:code.svg', function(req, res) {
  var parsed = parseCode(req.params.code);
  if (!parsed) {
    res.status(404).send('not_found');
    return;
  }
  res.setHeader('Content-Type', 'image/svg+xml');
  if (parsed.type === 'BACK') {
    res.send(renderBackSvg());
    return;
  }
  if (parsed.type === 'EMPTY') {
    res.send(renderEmptySvg());
    return;
  }
  res.send(renderCardSvg(parsed.rank, parsed.suit));
});

module.exports = router;
