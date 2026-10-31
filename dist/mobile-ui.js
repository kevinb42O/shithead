// Share one action row at every size; nothing competes with the centered pile.
const actions = document.querySelector('.action-row');
actions.querySelector('.status-copy').after(document.getElementById('pickup'));
actions.append(document.getElementById('start-game-center'));
