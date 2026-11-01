export function createChat() {
  const root = document.createElement('aside');
  root.className = 'table-chat';
  root.hidden = true;
  root.innerHTML = `<button type="button" class="chat-toggle" aria-expanded="false" aria-controls="table-chat-panel"><span aria-hidden="true">☷</span> <span>Table chat</span> <b hidden></b></button>
    <section id="table-chat-panel" class="chat-panel" hidden aria-label="Table chat">
      <header><span class="chat-emblem" aria-hidden="true">♣</span><div class="chat-heading"><strong>Table talk</strong><small class="chat-presence">Just your table. Good company.</small></div><button type="button" class="chat-mute" aria-pressed="false" aria-label="Mute unread badges" title="Mute unread badges">Mute</button><button type="button" class="chat-close" aria-label="Close chat">×</button></header>
      <div class="chat-messages" role="log" aria-label="Messages" aria-live="polite" aria-relevant="additions"></div>
      <button type="button" class="chat-jump" hidden>New messages ↓</button>
      <form><label class="chat-label" for="table-chat-input">Message your table</label><div class="chat-compose"><input id="table-chat-input" maxlength="240" placeholder="Message your table…" autocomplete="off"><button class="chat-send" type="submit" aria-label="Send message" disabled>↑</button></div><div class="chat-footer"><span class="chat-feedback" role="status"></span><span class="chat-count">0 / 240</span></div></form>
    </section>`;
  document.body.append(root);
  const toggle = root.querySelector('.chat-toggle'), panel = root.querySelector('.chat-panel'),
    log = root.querySelector('.chat-messages'), input = root.querySelector('input'),
    badge = root.querySelector('b'), mute = root.querySelector('.chat-mute'),
    jump = root.querySelector('.chat-jump'), send = root.querySelector('.chat-send'), feedback = root.querySelector('.chat-feedback');
  let session, last = null, unread = 0, muted = false, phase;
  const bottom = () => { log.scrollTop = log.scrollHeight; jump.hidden = true; };
  function opened(value, restoreFocus = true) {
    panel.hidden = !value;
    toggle.setAttribute('aria-expanded', String(value));
    if (value) { unread = 0; badge.hidden = true; bottom(); }
    else if (restoreFocus) toggle.focus({preventScroll:true});
  }
  function draft() {
    send.disabled = !input.value.trim();
    root.querySelector('.chat-count').textContent = `${input.value.length} / 240`;
  }
  function submit(text) {
    if (!text.trim()) return;
    if (session?.sendChat(text)) {
      input.value = ''; draft(); bottom();
      feedback.textContent = '';
    } else feedback.textContent = 'Not sent yet. Wait a moment and try again.';
  }
  input.addEventListener('input', draft);
  toggle.onclick = () => opened(panel.hidden);
  root.querySelector('.chat-close').onclick = () => opened(false);
  jump.onclick = bottom;
  log.onscroll = () => { if (log.scrollHeight - log.scrollTop - log.clientHeight < 40) jump.hidden = true; };
  mute.onclick = () => { muted = !muted; mute.textContent = muted ? 'Unmute' : 'Mute'; mute.setAttribute('aria-pressed', String(muted)); mute.setAttribute('aria-label', muted ? 'Unmute unread badges' : 'Mute unread badges'); if (muted) { unread = 0; badge.hidden = true; } };
  root.querySelector('form').onsubmit = e => { e.preventDefault(); if (!e.isComposing) submit(input.value); };
  root.addEventListener('keydown', e => { if (e.key === 'Escape' && !panel.hidden) { e.preventDefault(); e.stopPropagation(); opened(false); } });
  return {
    placeLobby(container) { root.classList.add('chat-in-lobby'); container.append(root); },
    update(s) {
      const nextPhase = s?.view ? 'game' : 'lobby';
      if (session !== s) {
        session = s; last = null; unread = 0; badge.hidden = true; phase = null;
        log.replaceChildren(); input.value = ''; draft(); jump.hidden = true;
      }
      if (s && phase !== nextPhase) {
        phase = nextPhase;
        if (phase === 'game') { root.classList.remove('chat-in-lobby'); document.body.append(root); }
        opened(phase === 'lobby' || !matchMedia('(max-width: 700px)').matches, false);
      }
      root.hidden = !s || s.closed || s.ended || (!s.host && !s.connected);
      if (root.hidden) return;
      const count = s.members?.filter(m => m.connected).length || 1;
      root.querySelector('.chat-presence').textContent = `${count} at the table · Only visible here`;
      const messages = s.chat || [], newest = messages.at(-1)?.id || '';
      if (newest === last) return;
      const atBottom = log.scrollHeight - log.scrollTop - log.clientHeight < 48;
      const previous = messages.findIndex(m => m.id === last);
      const additions = messages.slice(previous + 1);
      if (panel.hidden && !muted) {
        unread += additions.filter(m => m.sender !== s.id).length;
        badge.textContent = unread > 99 ? '99+' : String(unread); badge.hidden = !unread;
      }
      if (last === null || previous < 0) log.replaceChildren();
      log.querySelector('.chat-empty')?.remove();
      if (!messages.length) {
        const empty = document.createElement('div'); empty.className = 'chat-empty';
        empty.innerHTML = '<span aria-hidden="true">♧</span><strong>Every good game starts<br>with a little table talk.</strong><p>Say hello while everyone takes a seat.</p>';
        log.append(empty);
      }
      for (const message of additions) {
        const row = document.createElement('div'), avatar = document.createElement('span'), content = document.createElement('div'), name = document.createElement('strong'), text = document.createElement('p');
        row.className = 'chat-message' + (message.sender === s.id ? ' chat-own' : ''); row.dataset.message = message.id;
        avatar.className = 'chat-avatar'; avatar.textContent = (message.name || '?').slice(0,1).toUpperCase(); avatar.setAttribute('aria-hidden','true');
        name.textContent = message.sender === s.id ? 'You' : message.name;
        text.textContent = message.text; content.append(name, text); row.append(avatar, content); log.append(row);
      }
      const ids = new Set(messages.map(m => m.id));
      log.querySelectorAll('[data-message]').forEach(row => { if (!ids.has(row.dataset.message)) row.remove(); });
      if (atBottom || last === null || additions.at(-1)?.sender === s.id) bottom();
      else if (additions.length) jump.hidden = false;
      last = newest;
    }
  };
}
