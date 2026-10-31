// Keep pickup beside the hand controls and anchor Start Game to the fullscreen table.
const actions = document.querySelector('.action-row');
actions.querySelector('.status-copy').after(document.getElementById('pickup'));
document.getElementById('game-view').append(document.getElementById('start-game-center'));
