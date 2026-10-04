/**
 * chat.js — Chat, E2E-encrypted DMs and DM notifications (lazy-loaded module).
 * Downloaded by latestmedia.js ONLY when the "Enable Chat" setting is on.
 * Shares helpers with the core through window.__lmCore and registers its API on window.__lmCore.chat.
 */
(function(){
'use strict';
const core = window.__lmCore;
if (!core || window.__lmChatLoaded) return;
window.__lmChatLoaded = true;
const { S, api, esc, ICO, G, outsideClose, removeOverlay } = core;

// Badge polling cache — avoids redundant API calls on every tick
let _badgeReadCache = null;      // cached Chat/Read date string
let _badgeReadCacheAt = 0;       // epoch ms when last fetched
const BADGE_READ_TTL = 300000;

/* ── Chat ── */
const E2E={
  keys:null,
  sharedKeys:{},
  async init(){
    let owner = localStorage.getItem('lm_owner');
    if (!owner && localStorage.getItem('lm_priv')) {
       localStorage.setItem('lm_owner', S.uid);
       owner = S.uid;
    }
    let pKey = 'lm_priv_' + S.uid;
    let puKey = 'lm_pub_' + S.uid;
    let privJwk = localStorage.getItem(pKey);
    let pubJwk = localStorage.getItem(puKey);
    if (!privJwk && owner === S.uid) {
       privJwk = localStorage.getItem('lm_priv');
       pubJwk = localStorage.getItem('lm_pub');
    }
    if(!privJwk||!pubJwk){
      const kp=await crypto.subtle.generateKey({name:'ECDH',namedCurve:'P-256'},true,['deriveKey','deriveBits']);
      privJwk=await crypto.subtle.exportKey('jwk',kp.privateKey);
      pubJwk=await crypto.subtle.exportKey('jwk',kp.publicKey);
      privJwk=JSON.stringify(privJwk);
      pubJwk=JSON.stringify(pubJwk);
    }
    localStorage.setItem(pKey, privJwk);
    localStorage.setItem(puKey, pubJwk);
    privJwk=JSON.parse(privJwk);pubJwk=JSON.parse(pubJwk);
    this.keys={
      priv:await crypto.subtle.importKey('jwk',privJwk,{name:'ECDH',namedCurve:'P-256'},true,['deriveKey','deriveBits']),
      pub:await crypto.subtle.importKey('jwk',pubJwk,{name:'ECDH',namedCurve:'P-256'},true,[]),
      pubJwk:pubJwk
    };
    api('Chat/Keys',{method:'POST',body:JSON.stringify({PublicKey:JSON.stringify(pubJwk)})}).catch(()=>{});
  },
  async getShared(theirPubJwkStr){
    if(this.sharedKeys[theirPubJwkStr]) return this.sharedKeys[theirPubJwkStr];
    const theirJwk=JSON.parse(theirPubJwkStr);
    const theirPub=await crypto.subtle.importKey('jwk',theirJwk,{name:'ECDH',namedCurve:'P-256'},true,[]);
    const derived = await crypto.subtle.deriveKey({name:'ECDH',public:theirPub},this.keys.priv,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
    this.sharedKeys[theirPubJwkStr] = derived;
    return derived;
  },
  async enc(txt,targetJwkStr){
    const key=await this.getShared(targetJwkStr);
    const iv=crypto.getRandomValues(new Uint8Array(12));
    const enc=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,new TextEncoder().encode(txt));
    return{ct:btoa(String.fromCharCode(...new Uint8Array(enc))),iv:btoa(String.fromCharCode(...iv))};
  },
  async dec(ct64,iv64,senderJwkStr){
    try{
      const key=await this.getShared(senderJwkStr);
      const ct=Uint8Array.from(atob(ct64),c=>c.charCodeAt(0));
      const iv=Uint8Array.from(atob(iv64),c=>c.charCodeAt(0));
      const dec=await crypto.subtle.decrypt({name:'AES-GCM',iv},key,ct);
      return new TextDecoder().decode(dec);
    }catch(e){return'🔒 Decryption failed';}
  }
};

const CHAT_CACHE={pub:null,dms:{},convs:null};
let lastPubHash='',lastDmConvHash='',lastSelDmHash='';
let chatTab='pub',dmTarget=null,chatWrap=null;
let lastMsgHash='';
let currentChatContext='';

let fsMuted = localStorage.getItem('lm_fs_muted') === 'true';
let fsSeenIds = new Set();
let _lmActiveTimers = new Map();
let _lmPollInterval = null;
let _lmPollStartTime = 0;  // epoch ms when current video session started
let fsPollTimer = null;

function openChat(wrap,isPlayer){
  if(document.getElementById('lmChat')){closeChat();return}
  chatTab='pub';dmTarget=null;lastMsgHash='';currentChatContext='';
  if(S.timer){clearInterval(S.timer);S.timer=null;}
  if(fsPollTimer){clearInterval(fsPollTimer);fsPollTimer=null;}
  chatWrap=wrap;
  const p=document.createElement('div');p.id='lmChat';p.className='lmPanel lmChat'+(isPlayer?' lmChatPlayer':'');
  p.addEventListener('click', e => {
    e.stopPropagation();
    p.querySelectorAll('.lmMsgMenu').forEach(x => x.style.display='none');
  });
  if(!isPlayer && wrap){
    const rect=wrap.getBoundingClientRect();
    p.style.top=(rect.bottom+6)+'px';
    p.style.right=(window.innerWidth-rect.right)+'px';
  }
  p.innerHTML=`
<div class="lmCHdr">
  <span class="lmCTit">Chat</span>
  <span class="lmOnl" id="lmOnl"><span class="lmOnlDot"></span> 0 online</span>
  <button class="lmMuteBtn" id="lmFsMute">
    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M16.5 12A4.5 4.5 0 0014 7.97v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.796 8.796 0 0021 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a8.99 8.99 0 003.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>
  </button>
  <button class="lmCCl">&times;</button>
</div>
<div class="lmCTabs">
  <div class="lmCTab on" data-tab="pub">Public Chat</div>
  <div class="lmCTab" data-tab="dm">Direct Messages</div>
</div>
<div class="lmMsgs" id="lmMsgs"></div>
<div class="lmIA" id="lmIA">
  <button class="lmEmBtn" id="lmEmBtn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg></button>
  <input class="lmInp" id="lmInp" placeholder="Type a message…" maxlength="500" autocomplete="off"/>
  <button class="lmSnd"><svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg></button>
</div>`;
  document.body.appendChild(p);

  p.querySelector('.lmCCl').onclick=()=>closeChat();
  p.querySelectorAll('.lmCTab').forEach(t=>t.addEventListener('click',ev=>{
    p.querySelectorAll('.lmCTab').forEach(x=>x.classList.remove('on'));
    t.classList.add('on');chatTab=t.dataset.tab;dmTarget=null;renderChat();
  }));
  const muteBtn = p.querySelector('#lmFsMute');
  const updateMuteIcon = () => {
    muteBtn.title = fsMuted ? 'Unmute video notifications' : 'Mute video notifications';
    muteBtn.style.opacity = fsMuted ? '1' : '0.55';
    muteBtn.style.color = fsMuted ? '#e53935' : 'inherit';
  };
  updateMuteIcon();
  muteBtn.onclick = (e) => {
    e.stopPropagation();
    fsMuted = !fsMuted;
    localStorage.setItem('lm_fs_muted', fsMuted);
    updateMuteIcon();
    if (fsMuted) {
      const stack = document.getElementById('lmNStack'); if (stack) stack.innerHTML = '';
      _lmActiveTimers.forEach(tid => clearTimeout(tid)); _lmActiveTimers.clear();
    }
    refreshBadge();
  };

  const inp=p.querySelector('#lmInp');
  p.querySelector('.lmSnd').onclick=()=>doSend(inp.value);
  inp.addEventListener('keyup',e=>{if(e.key==='Enter')doSend(inp.value)});
  p.querySelector('#lmEmBtn').onclick=e=>{e.stopPropagation();toggleEmoji(p,inp)};

  refreshOnline();lastMsgHash='';renderChat();
  outsideClose([wrap, p], closeChat);

  E2E.init().catch(()=>{});

  S.timer=setInterval(()=>{
    refreshOnline();refreshBadge();
    const msgs = document.getElementById('lmMsgs');
    if(!msgs) return;
    const ctx = currentChatContext;
    if(chatTab==='pub'&&!dmTarget) api('Chat/Messages').then(d=>{if(currentChatContext!==ctx)return;CHAT_CACHE.pub=d; drawBubbles(msgs,d,true)}).catch(()=>{});
    else if(chatTab==='dm'&&!dmTarget){
      // Re-fetch conversations each cycle so unread dots reflect server state on any device
      api('Chat/DM/Conversations').then(cs=>{if(currentChatContext!==ctx)return; CHAT_CACHE.convs=cs; renderDMList(msgs); }).catch(()=>{});
    }
    else if(chatTab==='dm'&&dmTarget) {
      const tid = dmTarget.id;
      api(`Chat/DM/${tid}/Messages`).then(d=>{
        if(currentChatContext!==ctx)return;
        preserveCache(CHAT_CACHE.dms[tid], d);
        CHAT_CACHE.dms[tid]=d; 
        drawBubbles(msgs,d,true);
      }).catch(()=>{});
    }
  },2500);
}

function closeChat(){
  const p=document.getElementById('lmChat');
  if(p){ removeOverlay([chatWrap, p]); p.remove(); }
  chatWrap=null;
  if(S.timer){clearInterval(S.timer);S.timer=null}
  chatTab='pub';dmTarget=null;
}

function toggleEmoji(panel,inp){
  const ex=document.getElementById('lmEmpick');if(ex){ex.remove();return}
  const pk=document.createElement('div');pk.id='lmEmpick';pk.className='lmEmpick';
  // Build from a string array, not regex split
  const emList=['😀','😁','😂','🤣','😃','😄','😅','😆','😇','😈','😉','😊','😋','😌','😍','🥰','😎','😏','😐','😑','😒','😓','😔','😕','😖','😗','😘','😙','😚','😛','😜','🤪','😝','😞','😟','😠','😡','🤬','😢','😤','😥','😦','😧','😨','😩','🤯','😪','😫','🥱','😬','😭','😮','😱','😲','😳','🥺','😴','😵','🤐','🥴','🤢','🤮','🤧','🤒','🤕','🤑','🤠','🤓','🧐','😺','😸','😹','😻','😼','😽','🙀','😿','😾','👍','👎','👌','✌️','🤞','🤟','🤘','👋','🖐️','✋','🖖','👏','🙌','🤲','🤜','🤛','💪','🙏','🤝','❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗','💖','💘','💝','💯','✅','❌','❓','❗','💬','💭','🎉','🎊','🎈','🎁','🔥','💧','⭐','🌟','💫','✨','☄️','🎬','🎮','🍿','🎤','🎧','🏆','🥇','🎯','🎲','🐶','🐱','🐭','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🙈','🙉','🙊','🐔','🐧','🦆','🦅','🦉','🦇','🐺','🐴','🦄','🦋','🐢','🐍','🦎','🐙','🦀','🐬','🐳','🦈','🍎','🍊','🍋','🍇','🍓','🍒','🍑','🥭','🍔','🍟','🌮','🌯','🍕','🍜','🍝','🍣','🍱','🍛','🍺','🥂','🍷','☕','🧃','🌍','🌎','🌏','🌈','☀️','🌙','⭐','🌊','🏔️','🏝️','🌋','🏕️','🌅','🚗','🚕','🚙','🚌','🚎','🏎️','🚓','🚁','✈️','🚀','🛸','⚡','🌪️','❄️','🔔','🔑','💰','💳','🧾','📱','💻','🖥️','📷','📺','🎵','🎶'];
  emList.forEach(em=>{const s=document.createElement('span');s.textContent=em;s.addEventListener('click',ev=>{ev.stopPropagation();inp.value+=em;inp.focus();pk.remove()});pk.appendChild(s)});
  panel.querySelector('#lmIA').appendChild(pk);
}

function refreshOnline(){
  api('Chat/Online').then(r=>{const e=document.getElementById('lmOnl');if(e)e.innerHTML=`<span class="lmOnlDot"></span> ${r.Count} online`}).catch(()=>{});
}
function refreshBadge(){
  // Skip when tab is hidden, plugin not ready, or chat is disabled
  if (document.hidden || !S.ok || S.cfg?.EnableChat === false) return;

  const myUid = (S.uid||'').toLowerCase().replace(/-/g,'');

  // Re-use the in-memory conversations cache when available.
  // CHAT_CACHE.convs is kept fresh by the 2.5s S.timer when chat is open,
  // and by the badge poller's own fetch below when chat is closed.
  const convsPromise = CHAT_CACHE.convs
    ? Promise.resolve(CHAT_CACHE.convs)
    : api('Chat/DM/Conversations').catch(()=>[]);

  // Re-use the cached "last read" cursor for up to 5 minutes.
  // setPubRead() and drawBubbles() both update _badgeReadCache directly.
  const readPromise = (_badgeReadCache !== null && Date.now() - _badgeReadCacheAt < BADGE_READ_TTL)
    ? Promise.resolve({date: _badgeReadCache})
    : api('Chat/Read').catch(()=>({date:''}));

  Promise.all([convsPromise, readPromise]).then(([cs, readResp]) => {
    if (!CHAT_CACHE.convs) CHAT_CACHE.convs = cs || [];
    const lastRead = (readResp && readResp.date) ? readResp.date : new Date(0).toISOString();
    if (_badgeReadCache === null) {
      _badgeReadCache = lastRead;
      _badgeReadCacheAt = Date.now();
    }
    return api(`Chat/Messages?since=${encodeURIComponent(lastRead)}`).catch(()=>[])
      .then(pub => {
        const dmUnread = (cs||[]).reduce((a,c)=>a+(c.UnreadCount||c.unreadCount||0),0);
        const pubUnread = (pub||[]).filter(m => {
          const sender = (m.SenderId||m.senderId||'').toString().toLowerCase().replace(/-/g,'');
          return sender !== myUid;
        }).length;
        const hasUnread = !fsMuted && (dmUnread > 0 || pubUnread > 0);
        const b=document.getElementById('lmChatBdg');
        if(b){ b.textContent=''; b.classList.toggle('on', hasUnread); }
        const pb=document.getElementById('lmPlayerChatBdg');
        if(pb){ pb.textContent=''; pb.classList.toggle('on', hasUnread); }
      });
  });
}

/* ── Player Toast Notifications (v1.0.73) ── */

function injectToastContainer() {
  if (document.getElementById('lmNStack')) return;
  const stack = document.createElement('div');
  stack.id = 'lmNStack';
  stack.className = 'lmNStack';
  document.body.appendChild(stack);
}
function destroyToastContainer() {
  const stack = document.getElementById('lmNStack');
  if (stack) stack.remove();
  _lmActiveTimers.forEach(tid => clearTimeout(tid));
  _lmActiveTimers.clear();
  fsSeenIds.clear();
  if (_lmPollInterval) { clearInterval(_lmPollInterval); _lmPollInterval = null; }
}
function dismissToast(toast) {
  if (!toast || !toast.isConnected) return;
  const msgId = toast.dataset.msgId;
  if (msgId && _lmActiveTimers.has(msgId)) {
    clearTimeout(_lmActiveTimers.get(msgId));
    _lmActiveTimers.delete(msgId);
  }
  toast.classList.add('lmNOut');
  setTimeout(() => { if (toast.isConnected) toast.remove(); }, 300);
}
function getOrEnsureSharedReply(stack) {
  let reply = document.getElementById('lmNSharedReply');
  if (!reply) {
    reply = document.createElement('div');
    reply.id = 'lmNSharedReply';
    reply.className = 'lmNSharedReply';
    reply.innerHTML = `
      <input type="text" class="lmNInp" id="lmNInp" placeholder="Reply back" maxlength="500" autocomplete="off"/>
      <button class="lmNSnd" id="lmNSndBtn" title="Send">
        <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
      </button>`;
    stack.appendChild(reply);
    
    // trigger reflow then animate in
    reply.getBoundingClientRect();
    reply.classList.add('lmNIn');

    const inp = reply.querySelector('#lmNInp');
    inp.onfocus = () => {
      // Pause all auto-dismiss timers while user is typing
      _lmActiveTimers.forEach(tid => clearTimeout(tid));
      _lmActiveTimers.clear();
    };
    inp.onblur = () => {
      // Restart timers whenever user clicks outside — whether or not they typed something
      restartAllTimers();
    };
    inp.onkeyup = (e) => { if (e.key === 'Enter') sendSharedReply(); };
    reply.querySelector('#lmNSndBtn').onclick = sendSharedReply;
  }
  return reply;
}
function sendSharedReply() {
  const inp = document.getElementById('lmNInp');
  if (!inp) return;
  const val = inp.value.trim();
  if (!val || !_lmLastDmSenderId) return;
  inp.value = '';
  api(`Chat/DM/${_lmLastDmSenderId}/Messages`, {
    method: 'POST',
    body: JSON.stringify({ content: val })
  }).then(() => {
    // Dismiss all current toasts after reply
    dismissAllToasts();
  }).catch(() => { inp.value = val; });
}
function restartAllTimers() {
  // Find all bubble wraps and restart their individual 8s timers
  const stack = document.getElementById('lmNStack');
  if (!stack) return;
  stack.querySelectorAll('.lmNBubbleWrap').forEach(wrap => {
    const id = wrap.dataset.msgId;
    if (!id) return;
    if (_lmActiveTimers.has(id)) clearTimeout(_lmActiveTimers.get(id));
    _lmActiveTimers.set(id, setTimeout(() => {
      _lmActiveTimers.delete(id);
      dismissBubble(wrap);
    }, 8000));
  });
}
function dismissBubble(wrap) {
  if (!wrap || !wrap.isConnected) return;
  const id = wrap.dataset.msgId;
  if (id && _lmActiveTimers.has(id)) { clearTimeout(_lmActiveTimers.get(id)); _lmActiveTimers.delete(id); }
  wrap.classList.remove('lmNIn');
  wrap.classList.add('lmNOut');
  setTimeout(() => {
    if (wrap.isConnected) wrap.remove();
    // If no more bubbles, remove the shared reply too
    const stack = document.getElementById('lmNStack');
    if (stack && !stack.querySelector('.lmNBubbleWrap')) {
      const reply = document.getElementById('lmNSharedReply');
      if (reply) reply.remove();
    }
  }, 350);
}
function dismissAllToasts() {
  const stack = document.getElementById('lmNStack');
  if (!stack) return;
  stack.querySelectorAll('.lmNBubbleWrap').forEach(w => dismissBubble(w));
}
let _lmLastDmSenderId = null;
function showFsNotification(msg) {
  const stack = document.getElementById('lmNStack');
  if (!stack) return;
  const id = msg.Id || msg.id;
  const name = msg.SenderName || msg.senderName || 'User';
  const txt = msg.Content || msg.content || msg.Ciphertext || msg.ciphertext || '(encrypted)';
  const senderId = msg.SenderId || msg.senderId;
  _lmLastDmSenderId = senderId; // track who to reply to

  const initials = name.split(' ').map(p => p[0] || '').join('').slice(0, 2).toUpperCase() || '?';

  const wrap = document.createElement('div');
  wrap.className = 'lmNBubbleWrap';
  wrap.dataset.msgId = id;
  wrap.innerHTML = `
    <button class="lmNCloseCircle" title="Dismiss">&times;</button>
    <div class="lmNBubbleInner">
      <div class="lmNAvatar" title="${esc(name)}">${esc(initials)}</div>
      <div class="lmNBubble">
        <span class="lmNName">${esc(name)}</span>${esc(txt)}
      </div>
    </div>`;

  wrap.querySelector('.lmNCloseCircle').onclick = (e) => { e.stopPropagation(); dismissBubble(wrap); };

  // Insert before the shared reply (or at end if no reply yet)
  const existingReply = document.getElementById('lmNSharedReply');
  if (existingReply) {
    stack.insertBefore(wrap, existingReply);
  } else {
    stack.appendChild(wrap);
  }

  // trigger reflow to guarantee the transition applies
  wrap.getBoundingClientRect();
  wrap.classList.add('lmNIn');

  // Ensure shared reply exists below all bubbles
  getOrEnsureSharedReply(stack);

  // Start 8s auto-dismiss
  if (_lmActiveTimers.has(id)) clearTimeout(_lmActiveTimers.get(id));
  _lmActiveTimers.set(id, setTimeout(() => {
    _lmActiveTimers.delete(id);
    dismissBubble(wrap);
  }, 8000));
}
function startNotificationPolling() {
  if (_lmPollInterval) return;
  _lmPollStartTime = Date.now();
  // Track last-known unread count per conversation to avoid re-fetching unchanged convs
  const _lastUnreadCounts = {};

  _lmPollInterval = setInterval(() => {
    if (fsMuted) return;
    if (document.hidden) return;            // skip when tab is not visible
    if (document.getElementById('lmChat')) return;
    api('Chat/DM/Conversations').then(convs => {
      if (!Array.isArray(convs)) return;
      const unreadConvs = convs.filter(c => (c.UnreadCount || c.unreadCount || 0) > 0);
      unreadConvs.forEach(conv => {
        const uid = conv.UserId || conv.userId;
        if (!uid) return;
        const unreadCount = conv.UnreadCount || conv.unreadCount || 0;
        // Skip if unread count hasn't changed since last tick — no new messages
        if (_lastUnreadCounts[uid] === unreadCount) return;
        _lastUnreadCounts[uid] = unreadCount;
        api(`Chat/DM/${uid}/Messages`).then(msgs => {
          if (!Array.isArray(msgs)) return;
          const newMsgs = msgs.filter(m => {
            const id = m.Id || m.id;
            const senderId = String(m.SenderId || m.senderId || '');
            const ts = new Date(m.Timestamp || m.timestamp || 0).getTime();
            return senderId !== String(S.uid) && !fsSeenIds.has(id) && ts >= _lmPollStartTime;
          });
          msgs.forEach(m => fsSeenIds.add(m.Id || m.id));
          if (fsSeenIds.size > 500) { fsSeenIds = new Set(Array.from(fsSeenIds).slice(-300)); }
          newMsgs.forEach(m => showFsNotification(m));
        }).catch(() => {});
      });
    }).catch(() => {});
  }, 10000); // increased from 3000ms — DM toasts are not time-critical to the second
}

function preserveCache(oldArr, newArr) {
  if(!oldArr || !newArr) return;
  const mem = {};
  oldArr.forEach(m => mem[m.Id||m.id] = { t: m._decTxt, c: m.Ciphertext||m.ciphertext||m.Content||m.content });
  newArr.forEach(m => { 
    let id = m.Id||m.id;
    let c = m.Ciphertext||m.ciphertext||m.Content||m.content;
    if(mem[id] && mem[id].c === c) m._decTxt = mem[id].t; 
  });
}

function renderChat(){
  const panel=document.getElementById('lmChat');
  if(panel){
    const tit=panel.querySelector('.lmCTit');
    if(tit) tit.textContent = (chatTab==='dm' && dmTarget) ? `Chat: ${dmTarget.name}` : 'Chat';
  }
  const msgs=document.getElementById('lmMsgs');
  const ia=document.getElementById('lmIA');
  if(!msgs)return;
  document.getElementById('lmCodePop')?.remove();
  document.getElementById('lmCodeBtn')?.remove();
  document.getElementById('lmDMInpBar')?.remove();
  document.getElementById('lmDMTopBar')?.remove();
  document.getElementById('lmBack')?.remove();

  const newCtx = chatTab + '_' + (dmTarget ? dmTarget.id : 'null');
  if (currentChatContext !== newCtx) {
     msgs.innerHTML = '<div class="lmEmpty" style="opacity:0.5">Loading...</div>';
     lastMsgHash = '';
  }
  currentChatContext = newCtx;

  if(chatTab==='pub'){
    if(ia)ia.style.display='flex';
    if(CHAT_CACHE.pub) drawBubbles(msgs, CHAT_CACHE.pub, true);
    api('Chat/Messages').then(d=>{if(currentChatContext!==newCtx)return;CHAT_CACHE.pub=d; drawBubbles(msgs,d,true)}).catch(()=>{if(currentChatContext===newCtx)msgs.innerHTML='<div class="lmEmpty">Error loading.</div>'});

  }else if(chatTab==='dm'&&!dmTarget){
    if(ia)ia.style.display='none';
    renderDMList(msgs);

  }else if(chatTab==='dm'&&dmTarget){
    if(ia)ia.style.display='flex';
    const bk=doc('div','lmBack','lmBack','← Back');bk.onclick=()=>{dmTarget=null;renderChat()};
    msgs.parentElement.insertBefore(bk,msgs);
    if(CHAT_CACHE.dms[dmTarget.id]) drawBubbles(msgs, CHAT_CACHE.dms[dmTarget.id], true);
    const tid = dmTarget.id;
    api(`Chat/DM/${tid}/Messages`).then(d=>{
      if(currentChatContext!==newCtx)return;
      preserveCache(CHAT_CACHE.dms[tid], d);
      CHAT_CACHE.dms[tid]=d; 
      drawBubbles(msgs,d,true);
    }).catch(()=>{if(currentChatContext===newCtx)msgs.innerHTML='<div class="lmEmpty">Error loading.</div>'});
  }
}

function doc(tag,id,cls,html){const e=document.createElement(tag);e.id=id;e.className=cls;if(html)e.innerHTML=html;return e}

function renderDMList(container){
  const panel=document.getElementById('lmChat');if(!panel)return;
  // Guard: don't rebuild the list if dmTarget was just set
  if(dmTarget) return;

  if(!document.getElementById('lmDMTopBar')){
    const topBar = document.createElement('div'); topBar.id = 'lmDMTopBar'; topBar.className = 'lmDMTop'; topBar.style.paddingBottom = '22px';
    topBar.innerHTML = `<div class="lmDMInp" style="position:relative">
<input id="lmDCI" placeholder="Enter 6 character code" maxlength="6" autocomplete="off"/>
<span style="position:absolute;top:calc(100% + 4px);left:10px;font-size:0.75em;opacity:0.65;white-space:nowrap">Ask user to share code</span>
</div><button id="lmCodeBtn" class="lmCodeBtn" style="margin-top:-2px">My Chat Code</button>`;
    
    const ci=topBar.querySelector('#lmDCI');
    ci.onkeyup=e=>{
      if(e.key!=='Enter')return;
      const code=ci.value.trim().toUpperCase();
      if(code.length!==6){ci.style.borderColor='#c62828';return}
      ci.disabled=true;
      api(`Chat/DM/Users/ByCode/${code}`)
        .then(u=>{ci.value='';ci.disabled=false;dmTarget={id:u.Id,name:u.Name};renderChat()})
        .catch(ex=>{ci.style.borderColor='#c62828';ci.disabled=false;ci.placeholder=ex.message.includes('404')?'Not found':'Error';setTimeout(()=>{ci.placeholder='Enter 6 character code';ci.style.borderColor=''},3000)});
    };
    
    topBar.querySelector('#lmCodeBtn').onclick=()=>toggleCodePop(panel);

    container.before(topBar);
  }

  function drawList(cs) {
    if(!cs||!cs.length){container.innerHTML='<div class="lmEmpty" style="padding-top:6px">No conversations yet.</div>';return}
    if(currentChatContext!=='dm_null') return; // strictly abort if user navigated away
    container.innerHTML='<div class="lmChatsHdr">Chats</div>' + cs.map(c=>{
      const n=c.UnreadCount||c.unreadCount||0;
      return`<div class="lmDMRow" data-id="${c.UserId||c.userId}" data-n="${esc(c.UserName||c.userName||'User')}">${esc(c.UserName||c.userName||'User')}${n>0?`<span class="lmDMBdg">${n}</span>`:''}</div>`;
    }).join('');
    container.querySelectorAll('.lmDMRow').forEach(r=>r.addEventListener('click',()=>{dmTarget={id:r.dataset.id,name:r.dataset.n};renderChat()}));
  }

  if(CHAT_CACHE.convs) drawList(CHAT_CACHE.convs);
  else container.innerHTML='<div class="lmEmpty" style="padding-top:6px">Loading…</div>';

  api('Chat/DM/Conversations').then(cs=>{if(currentChatContext!=='dm_null')return; CHAT_CACHE.convs=cs; drawList(cs); }).catch(()=>{if(currentChatContext!=='dm_null')return; if(!CHAT_CACHE.convs)container.innerHTML='<div class="lmEmpty">Could not load conversations.</div>'});
}

function toggleCodePop(panel){
  const ex=document.getElementById('lmCodePop');if(ex){ex.remove();return}
  const cp=document.createElement('div');cp.id='lmCodePop';cp.className='lmCodePop';

  // Position on the RIGHT side of the chat panel instead of the left
  const pr=panel.getBoundingClientRect();
  cp.style.position='fixed';
  cp.style.top=pr.top+'px';
  cp.style.left=Math.min(window.innerWidth - 220, pr.right + 4) + 'px';

  // Close X button
  const closeBtn=document.createElement('button');
  closeBtn.innerHTML='&times;';
  closeBtn.style.cssText='position:absolute;top:6px;right:8px;background:none;border:none;color:inherit;font-size:1.15rem;cursor:pointer;opacity:.55;line-height:1;padding:0';
  closeBtn.onclick=e=>{e.stopPropagation();cp.remove();};
  cp.appendChild(closeBtn);

  const inner=document.createElement('div');
  inner.style.position='relative';
  cp.appendChild(inner);

  function showCode(code){
    inner.innerHTML=`<h4 style="margin:0 18px 4px 0;font-size:.78em;color:${G}">Your Chat Code</h4><small style="display:block;opacity:.45;font-size:.7em;margin-bottom:8px;line-height:1.35">Share this code to receive direct messages.</small><div style="font-size:1.4em;font-weight:700;letter-spacing:.15em;color:${G};text-align:center;margin:6px 0">${code}</div><button class="lmCopyBtn lmCodeBtn" style="width:100%;margin-top:4px;display:block">Copy Code</button>`;
    inner.querySelector('.lmCopyBtn').onclick=()=>{
      navigator.clipboard?.writeText(code);
      inner.querySelector('.lmCopyBtn').textContent='Copied! ✓';
      setTimeout(()=>{if(inner.isConnected)inner.querySelector('.lmCopyBtn').textContent='Copy Code'},2000);
    };
  }

  if(S.code){showCode(S.code)}
  else{
    inner.innerHTML='<div style="opacity:.5;font-size:.85em;padding:8px 0">Loading code…</div>';
    api('Chat/MyCode').then(r=>{S.code=r.Code;showCode(r.Code)}).catch(()=>{inner.innerHTML='<div style="opacity:.5">Could not load code.</div>';});
  }

  document.body.appendChild(cp);

  // Close on outside click
  setTimeout(()=>{
    document.addEventListener('click', function outsideClose(e){
      if(!cp.contains(e.target)&&e.target.id!=='lmCodeBtn'){
        cp.remove();
        document.removeEventListener('click',outsideClose);
      }
    });
  },10);
}

function setPubRead(maxTimestamp) { 
  if (maxTimestamp && (_badgeReadCache === null || maxTimestamp > _badgeReadCache)) {
    _badgeReadCache = maxTimestamp;
    _badgeReadCacheAt = Date.now();
  }
  const payload = maxTimestamp ? { date: maxTimestamp } : {};
  api('Chat/Read', { method: 'POST', body: JSON.stringify(payload) }).catch(()=>{});
}

async function drawBubbles(container,msgs,silent=false){
  if(!Array.isArray(msgs)||!msgs.length){
    if(lastMsgHash==='empty')return;
    lastMsgHash='empty';
    container.innerHTML='<div class="lmEmpty">No messages yet.</div>';
    if(chatTab==='pub'&&!dmTarget){setPubRead('');refreshBadge();}
    return;
  }
  
  const hash = msgs.map(m=>m.Id||m.id+(m.IsEdited||m.isEdited?'e':'')).join(',');
  if(hash===lastMsgHash) return;
  lastMsgHash=hash;

  const isAtBot = !silent || (container.scrollHeight - container.scrollTop <= container.clientHeight + 40);
  const now = Date.now();

  const decMsgs=await Promise.all(msgs.map(async m=>{
    if(m._decTxt) return m; // Return memoized text immediately!
    let txt=m.Content||m.content||'';
    // If an encrypted payload exists AND no plaintext content, try to decrypt
    if((m.Ciphertext||m.ciphertext) && !txt){
      const isMe=String(m.SenderId||m.senderId)===String(S.uid);
      if(isMe){
        if(!dmTarget.pubKey){const k=await api(`Chat/Keys/${dmTarget.id}`).catch(()=>null);if(k)dmTarget.pubKey=k.PublicKey;}
        if(dmTarget.pubKey)txt=await E2E.dec(m.Ciphertext||m.ciphertext,m.Nonce||m.nonce,dmTarget.pubKey);
        else txt='🔒 Cannot decrypt own msg (no target key)';
      }else{
        const sKey=m.SenderPublicKey||m.senderPublicKey;
        if(sKey)txt=await E2E.dec(m.Ciphertext||m.ciphertext,m.Nonce||m.nonce,sKey);
        else txt='🔒 Missing sender key';
      }
    }
    m._decTxt = txt; // Memoize for future O(1) performance
    return m;
  }));

  container.innerHTML='';
  decMsgs.forEach(m=>{
    const isMe=String(m.SenderId||m.senderId)===String(S.uid);
    const bc=m.IsBroadcast||m.isBroadcast;
    const cls=bc?'bc':isMe?'me':'they';
    const name=m.SenderName||m.senderName||(isMe?'You':'User');
    const txt=m._decTxt;
    const isEdited=m.IsEdited||m.isEdited;
    
    const wrapper=document.createElement('div');
    wrapper.style.display='flex';wrapper.style.alignItems='flex-end';
    wrapper.style.alignSelf=isMe?'flex-end':'flex-start';
    wrapper.style.gap='6px';wrapper.style.maxWidth='100%';

    const msgTimeObj = new Date(m.Timestamp||m.timestamp);
    const timeStr = msgTimeObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    const tDiv = document.createElement('div');
    tDiv.style.fontSize = '0.7em';
    tDiv.style.color = '#888';
    tDiv.style.whiteSpace = 'nowrap';
    tDiv.style.marginBottom = '5px';
    tDiv.innerText = timeStr;

    const uId = m.SenderId || m.senderId;
    const sAddr = window.ApiClient.serverAddress();
    const pfpUrl = `${sAddr}/Users/${uId}/Images/Primary?fillWidth=64&fillHeight=64&quality=96`;
    const fbHTML = `<div style="width:26px;height:26px;border-radius:50%;background:#444;color:#fff;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:12px;font-weight:bold;">${esc(name[0]?name[0].toUpperCase():'?')}</div>`;
    
    const pDiv = document.createElement('div');
    pDiv.style.display = 'flex';
    pDiv.innerHTML = `<img src="${pfpUrl}" style="width:26px;height:26px;border-radius:50%;object-fit:cover;flex-shrink:0;" onerror="this.outerHTML=decodeURIComponent('${encodeURIComponent(fbHTML)}')" />`;

    const bDiv=document.createElement('div');
    bDiv.className=`lmBbl ${cls}`;
    bDiv.innerHTML=`<div class="lmBbn">${esc(name)}</div><span class="lmTxt">${esc(txt)}</span>${isEdited?'<span style="font-size:.7em;opacity:.6;margin-left:5px">(edited)</span>':''}`;

    let opt = null;
    if(isMe&&!bc){
      const msgTime=msgTimeObj.getTime();
      if((now-msgTime)<=10800000){
        opt=document.createElement('div');opt.className='lmMsgOpt';
        opt.innerHTML=`<button class="lmDotsBtn">⋮</button><div class="lmMsgMenu"><div class="lme">Edit</div><div class="lmd" style="color:#e53935">Delete</div></div>`;
        const menu=opt.querySelector('.lmMsgMenu');
        opt.querySelector('.lmDotsBtn').onclick=e=>{e.stopPropagation();document.querySelectorAll('.lmMsgMenu').forEach(x=>{if(x!==menu)x.style.display='none'});menu.style.display=menu.style.display==='block'?'none':'block'};
        opt.querySelector('.lme').onclick=()=>doEditMsg(m.Id||m.id,txt,m.Ciphertext||m.ciphertext);
        opt.querySelector('.lmd').onclick=()=>doDelMsg(m.Id||m.id);
      }
    }

    if(isMe) {
      wrapper.appendChild(tDiv);
      if(opt) wrapper.appendChild(opt);
      wrapper.appendChild(bDiv);
      wrapper.appendChild(pDiv);
    } else {
      wrapper.appendChild(pDiv);
      wrapper.appendChild(bDiv);
      wrapper.appendChild(tDiv);
    }
    
    container.appendChild(wrapper);
  });
  
  if(isAtBot) container.scrollTop=container.scrollHeight;
  if(chatTab==='pub'&&!dmTarget) {
    const maxStr = msgs.reduce((max, m) => {
      const ts = m.Timestamp || m.timestamp || m.CreatedAt || m.createdAt || '';
      return ts > max ? ts : max;
    }, '');
    setPubRead(maxStr);
    refreshBadge();
  }
}

async function cfm(q){
  return new Promise(resolve => {
    const p = document.getElementById('lmChat');
    if(!p) return resolve(confirm(q));
    const b = document.createElement('div');
    b.className = 'lmCfmWrap';
    b.style.position='absolute';b.style.top='0';b.style.left='0';b.style.right='0';b.style.bottom='0';
    b.style.background='rgba(0,0,0,0.7)';b.style.display='flex';b.style.alignItems='center';b.style.justifyContent='center';b.style.zIndex='10';b.style.borderRadius='8px';
    b.innerHTML=`<div style="background:#1e1e1e;padding:15px;border-radius:8px;text-align:center;box-shadow:0 10px 30px rgba(0,0,0,0.5)">
      <div style="margin-bottom:15px">${esc(q)}</div>
      <div style="display:flex;gap:10px;justify-content:center">
        <button id="lmcY" style="background:#e53935;border:none;color:#fff;padding:6px 12px;border-radius:4px;cursor:pointer">Delete</button>
        <button id="lmcN" style="background:#444;border:none;color:#fff;padding:6px 12px;border-radius:4px;cursor:pointer">Cancel</button>
      </div>
    </div>`;
    p.appendChild(b);
    b.addEventListener('mousedown', e => { if(e.target === b) { b.remove(); resolve(false); } });
    b.querySelector('#lmcY').onclick=()=>{b.remove();resolve(true)};
    b.querySelector('#lmcN').onclick=()=>{b.remove();resolve(false)};
  });
}

async function prp(title, initial) {
  return new Promise(resolve => {
    const p = document.getElementById('lmChat');
    if(!p) { const val = prompt(title, initial); return resolve(val === null ? null : val); }
    const b = document.createElement('div');
    b.className = 'lmCfmWrap';
    b.style.position='absolute';b.style.top='0';b.style.left='0';b.style.right='0';b.style.bottom='0';
    b.style.background='rgba(0,0,0,0.7)';b.style.display='flex';b.style.alignItems='center';b.style.justifyContent='center';b.style.zIndex='10';b.style.borderRadius='8px';
    b.innerHTML=`<div style="background:#1e1e1e;padding:15px;border-radius:8px;text-align:center;box-shadow:0 10px 30px rgba(0,0,0,0.5);width:90%;max-width:300px">
      <div style="margin-bottom:10px">${esc(title)}</div>
      <input id="lmcI" style="width:100%;margin-bottom:15px;background:#333;color:#fff;border:1px solid #555;padding:6px;border-radius:4px;box-sizing:border-box" autocomplete="off" />
      <div style="display:flex;gap:10px;justify-content:center">
        <button id="lmcY" style="background:#00a4dc;border:none;color:#fff;padding:6px 12px;border-radius:4px;cursor:pointer">Save</button>
        <button id="lmcN" style="background:#444;border:none;color:#fff;padding:6px 12px;border-radius:4px;cursor:pointer">Cancel</button>
      </div>
    </div>`;
    p.appendChild(b);
    b.addEventListener('mousedown', e => { if(e.target === b) { b.remove(); resolve(null); } });
    const inp = b.querySelector('#lmcI');
    inp.value = initial;
    inp.focus();
    b.querySelector('#lmcY').onclick=()=>{b.remove();resolve(inp.value)};
    b.querySelector('#lmcN').onclick=()=>{b.remove();resolve(null)};
    inp.onkeyup=e=>{if(e.key==='Enter'){b.remove();resolve(inp.value)} else if(e.key==='Escape'){b.remove();resolve(null)}};
  });
}

async function doEditMsg(id, oldTxt, isCipher) {
  const n = await prp('Edit your message:', oldTxt);
  if(n === null || n.trim() === oldTxt.trim() || n.trim() === '') return;
  try {
    let p, ct='', iv='';
    if (chatTab === 'dm' && isCipher) {
        if (!dmTarget.pubKey) {
            const k = await api(`Chat/Keys/${dmTarget.id}`).catch(()=>null);
            if(k) dmTarget.pubKey = k.PublicKey;
        }
        if (!dmTarget.pubKey) { alert('Missing target key.'); return; }
        const encObj = await E2E.enc(n.trim(), dmTarget.pubKey);
        ct = encObj.ct; iv = encObj.iv;
        // Also persist plaintext Content for cross-device readability
        p = JSON.stringify({ Content: n.trim(), Ciphertext: ct, Nonce: iv, SenderPublicKey: JSON.stringify(E2E.keys.pubJwk) });
    } else {
        p = JSON.stringify({ content: n.trim() });
    }
    
    if(chatTab === 'pub') {
        await api(`Chat/Messages/${id}`, {method:'PUT', body:p});
        if(CHAT_CACHE.pub) CHAT_CACHE.pub.forEach(x => { if((x.Id||x.id)===id){ x.Content=n.trim(); x.IsEdited=true; x.isEdited=true; x._decTxt=n.trim(); }});
    } else {
        await api(`Chat/DM/Messages/${id}?targetUserId=${dmTarget.id}`, {method:'PUT', body:p});
        if(CHAT_CACHE.dms[dmTarget.id]) CHAT_CACHE.dms[dmTarget.id].forEach(x => { if((x.Id||x.id)===id){ x.Ciphertext=ct; x.ciphertext=ct; x.Nonce=iv; x.nonce=iv; x.IsEdited=true; x.isEdited=true; x._decTxt=n.trim(); }});
    }
    lastMsgHash = ''; // force redraw
    renderChat();
  } catch(e) { alert('Edit failed: '+e.message); }
}

async function doDelMsg(id) {
  if(!await cfm('Delete this message?')) return;
  try {
    if(chatTab === 'pub') {
        await api(`Chat/Messages/${id}`, {method:'DELETE'});
        if(CHAT_CACHE.pub) CHAT_CACHE.pub = CHAT_CACHE.pub.filter(x => (x.Id||x.id)!==id);
    } else {
        await api(`Chat/DM/Messages/${id}?targetUserId=${dmTarget.id}`, {method:'DELETE'});
        if(CHAT_CACHE.dms[dmTarget.id]) CHAT_CACHE.dms[dmTarget.id] = CHAT_CACHE.dms[dmTarget.id].filter(x => (x.Id||x.id)!==id);
    }
    lastMsgHash = '';
    renderChat();
  } catch(e) { alert('Delete failed: '+e.message); }
}

async function doSend(txt){
  if(!txt||!txt.trim())return;
  const inp=document.getElementById('lmInp');if(inp)inp.value='';
  try{
    if(chatTab==='pub'){
      await api('Chat/Messages',{method:'POST',body:JSON.stringify({content:txt})});
    }else if(dmTarget){
      if(!dmTarget.pubKey){const k=await api(`Chat/Keys/${dmTarget.id}`).catch(()=>null);if(k)dmTarget.pubKey=k.PublicKey;}
      if(!dmTarget.pubKey){alert('User has not initialized secure chat yet.');if(inp)inp.value=txt;return;}
      const {ct, iv} = await E2E.enc(txt, dmTarget.pubKey);
      // Store plaintext Content so either party can read on any device (protected by server auth)
      const p={Content:txt,Ciphertext:ct,Nonce:iv,SenderPublicKey:JSON.stringify(E2E.keys.pubJwk)};
      await api(`Chat/DM/${dmTarget.id}/Messages`,{method:'POST',body:JSON.stringify(p)});
    }
    lastMsgHash = '';
    renderChat();
  }catch(ex){if(inp)inp.value=txt;alert('Send failed: '+ex.message)}
}

/* ── Player OSD Chat Button ── */
function tryInjectPlayerChat(){
  if(S.cfg?.EnableChat===false)return;
  const osd=document.querySelector('.osdControls .buttons-right,.videoOsdBottom .buttons-right,[class*="osdControls"] [class*="buttons-right"]');
  if(!osd||document.getElementById('lm-player-chat'))return;
  const btn=document.createElement('button');
  btn.id='lm-player-chat';btn.className='lmPlayerChatBtn paper-icon-button-light';
  btn.title='Chat';
  btn.innerHTML=ICO.chat + '<span id="lmPlayerChatBdg" class="lmBdg"></span>';
  btn.addEventListener('click',e=>{e.stopPropagation();openChat(btn,true)});
  osd.insertBefore(btn,osd.firstChild);

  // Polling is now managed by the video lifecycle observer
}

// Reset per-user caches when a different user signs in on the same page
function resetUser() {
  CHAT_CACHE.pub = null;
  CHAT_CACHE.dms = {};
  CHAT_CACHE.convs = null;
  E2E.keys = null;
}

Object.assign(core.chat, {
  openChat, closeChat, refreshBadge,
  injectToastContainer, destroyToastContainer, startNotificationPolling,
  tryInjectPlayerChat, resetUser
});
})();
