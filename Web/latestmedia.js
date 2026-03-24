(function(){
'use strict';
const G='#00b35a',GD='#008c45',PID='f94d6caf-2a62-4dd7-9f64-684ce8efff43';

// Extensive emoji list
const EMOJIS='😀😁😂🤣😃😄😅😆😇😈😉😊😋😌😍🥰😎😏😐😑😒😓😔😕😖😗😘😙😚😛😜🤪😝😞😟😠😡🤬😢😤😥😦😧😨😩🤯😪😫🥱😬😭😮😱😲😳🥺😴😵🤐🥴🤢🤮🤧🤒🤕🤑🤠🤓🧐😺😸😹😻😼😽🙀😿😾👍👎👌✌️🤞🤟🤘👋🖐️✋🖖👏🙌🤲🤜🤛💪🙏🤝❤️🧡💛💚💙💜🖤🤍🤎💔❣️💕💞💓💗💖💘💝💯✅❌❓❗💬💭🎉🎊🎈🎁🔥💧⭐🌟💫✨☄️🎬🎮🍿🎤🎧🏆🥇🎯♟️🎲🐶🐱🐭🐹🐰🦊🐻🐼🐨🐯🦁🐮🐷🐸🐙🦋🐙🐬🐳🦈🦁🌍🌎🌏🌈☀️🌙⭐🌊🏔️🏝️🌋🏕️🌅🍎🍊🍋🍇🍓🍒🍑🥭🍔🍟🌮🌯🍕🍜🍝🍣🍱🍛🍺🥂🍷☕🧃🔔🔑🔒💰💳🧾'.split(/(?<=\p{Emoji_Presentation}|\p{Extended_Pictographic})/u).filter(e=>e.trim());

const ICO={
  latest:`<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>`,
  manage:`<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.06-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.06,0.94l-2.03,1.58c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.43-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.49-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/></svg>`,
  chat:`<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z"/></svg>`
};

const S={url:'',tok:'',uid:'',dev:'',code:'',admin:false,cfg:{},ok:false,timer:null};

// Close panels automatically on SPA navigation
window.addEventListener('hashchange', () => {
  if(typeof closeDD === 'function') closeDD(document.getElementById('lm-btn-latest'));
  if(typeof closeChat === 'function') closeChat();
});

/* ── Styles ── */
const st = document.createElement('style');
st.innerHTML=`
/* IMPORTANT: wrapper must NOT use opacity for hover — that cascades to children */
.lmW{display:inline-flex;align-items:center;justify-content:center;position:relative;
  width:40px;height:40px;cursor:pointer;color:inherit;flex-shrink:0}
.lmW>svg{transition:opacity .2s}.lmW:hover>svg{opacity:.65}

/* Badge */
.lmBdg{position:absolute;top:2px;right:2px;background:${G};color:#fff;border-radius:50%;
  min-width:16px;height:16px;font-size:10px;font-weight:700;display:none;
  align-items:center;justify-content:center;padding:0 3px;pointer-events:none}
.lmBdg.on{display:flex}

/* Glass panels — translucent by default, opaque on hover/focus
   Colors are neutral dark (no blue tint) */
.lmPanel{
  background:rgba(12,12,12,0.52);
  backdrop-filter:blur(22px) saturate(1.6);
  -webkit-backdrop-filter:blur(22px) saturate(1.6);
  border:1px solid rgba(255,255,255,0.09);
  border-radius:12px;
  box-shadow:0 8px 30px rgba(0,0,0,0.35);
  transition:background .3s, border-color .3s, box-shadow .3s;
  color:inherit;
}
.lmPanel:hover,.lmPanel:focus-within{
  background:rgba(12,12,12,0.91);
  border-color:rgba(255,255,255,0.15);
  box-shadow:0 12px 42px rgba(0,0,0,0.6);
}

/* Player OSD chat button */
.lmPlayerChatBtn{display:inline-flex;align-items:center;justify-content:center;
  width:36px;height:36px;cursor:pointer;color:#fff;opacity:.75;transition:opacity .2s}
.lmPlayerChatBtn:hover{opacity:1}
.lmPlayerChatBtn svg{width:20px;height:20px}
.lmChat.lmChatPlayer{position:fixed;bottom:80px;right:20px;z-index:999999}

/* Dropdown */
.lmDD{position:absolute;top:calc(100% + 6px);right:0;width:330px;max-height:70vh;
  overflow-y:auto;z-index:9999;display:none;
  scrollbar-width:thin;scrollbar-color:rgba(255,255,255,0.12) transparent}
.lmDD.on{display:block}
.lmDD::-webkit-scrollbar{width:4px}
.lmDD::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.18);border-radius:2px}

/* Tabs */
.lmTabs{display:flex;border-bottom:1px solid rgba(255,255,255,0.07);
  position:sticky;top:0;z-index:1;
  background:rgba(12,12,12,0.75);backdrop-filter:blur(20px)}
.lmTab{flex:1;padding:9px 6px;text-align:center;cursor:pointer;
  font-size:.77em;font-weight:600;color:rgba(255,255,255,0.4);
  border-bottom:2px solid transparent;transition:all .2s}
.lmTab:hover{color:rgba(255,255,255,.75)}.lmTab.on{color:${G};border-bottom-color:${G}}

/* Cards */
.lmCard{display:flex;align-items:center;gap:10px;padding:9px 12px;
  border-bottom:1px solid rgba(255,255,255,.05);cursor:pointer;
  color:inherit;text-decoration:none;transition:background .15s}
.lmCard:hover{background:rgba(255,255,255,.07)}.lmCard:last-child{border-bottom:none}
.lmPoster{width:40px;height:60px;object-fit:cover;border-radius:4px;
  background:rgba(255,255,255,.06);flex-shrink:0}
.lmMeta{flex:1;min-width:0}
.lmTitle{font-size:.9em;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.lmSub{font-size:.73em;opacity:.55;margin-top:3px;display:flex;gap:6px;align-items:center}
.lmBdge{font-size:.67em;font-weight:700;padding:1px 5px;border-radius:3px;color:#fff;text-transform:uppercase}
.mv{background:#1565c0}.sr{background:${GD}}.an{background:#6a1b9a}.ot{background:#555}
.lmLd{font-size:.7em;font-weight:700;padding:1px 5px;border-radius:3px;background:#c62828;color:#fff}
.lmEmpty{padding:22px;text-align:center;opacity:.45;font-size:.87em}

/* Modal */
.lmOv{position:fixed;inset:0;background:rgba(0,0,0,.72);backdrop-filter:blur(5px);
  z-index:99997;display:flex;align-items:center;justify-content:center}
.lmMod{width:92%;max-width:980px;max-height:88vh;display:flex;flex-direction:column;overflow:hidden;}
.lmMHdr{display:flex;align-items:center;justify-content:space-between;
  padding:14px 20px;border-bottom:1px solid rgba(255,255,255,.08);
  background:rgba(255,255,255,.025);flex-shrink:0}
.lmMHdr h2{margin:0;font-size:1rem;font-weight:600}
.lmMCl{cursor:pointer;background:none;border:none;color:inherit;font-size:1.3rem;opacity:.55}
.lmMCl:hover{opacity:1}
.lmMBdy{overflow-y:auto;flex:1}
.lmTbl{width:100%;border-collapse:collapse;font-size:.86em}
.lmTbl th{padding:9px 12px;text-align:left;background:rgba(0,0,0,.25);font-weight:600;position:sticky;top:0}
.lmTbl td{padding:8px 12px;border-bottom:1px solid rgba(255,255,255,.04);vertical-align:middle}
.lmTbl tr:hover td{background:rgba(255,255,255,.025)}
.lmSel{appearance:none;-webkit-appearance:none;
  background:rgba(20,20,20,.95);color:inherit;
  border:1px solid rgba(255,255,255,.18);border-radius:5px;
  padding:5px 26px 5px 9px;font-size:.82em;cursor:pointer;font-family:inherit;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='rgba(255,255,255,0.6)'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E");
  background-repeat:no-repeat;background-position:right 3px center;background-size:18px}
.lmSel option{background:#121212;color:#fff}
.lmSel:focus{outline:none;border-color:${G}}
.lmBtn{display:inline-block;border:none;padding:5px 13px;border-radius:5px;
  cursor:pointer;font-size:.83em;font-family:inherit;white-space:nowrap}
.pg{background:${G};color:#fff}.dn{background:#c62828;color:#fff}.gh{background:rgba(255,255,255,.1);color:inherit}
.lmBtn:hover{filter:brightness(1.15)}

/* Confirm dialog */
.lmCf{position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;
  background:rgba(0,0,0,.65);backdrop-filter:blur(5px)}
.lmCfb{border:1px solid rgba(255,255,255,.12);border-radius:10px;
  padding:22px 26px;max-width:350px;width:90%;text-align:center}
.lmCfb p{margin:0 0 16px;font-size:.9em;line-height:1.5}
.lmCfa{display:flex;gap:10px;justify-content:center}

/* Chat panel */
.lmChat{position:absolute;top:calc(100% + 6px);right:0;width:330px;height:460px;
  display:flex;flex-direction:column;z-index:9999;overflow:hidden;
  transform-origin:top right;animation:lmPop .2s cubic-bezier(.34,1.56,.64,1)}
@keyframes lmPop{from{opacity:0;transform:scale(.87)}to{opacity:1;transform:scale(1)}}
.lmCHdr{display:flex;align-items:center;padding:9px 12px 7px;
  border-bottom:1px solid rgba(255,255,255,.07);flex-shrink:0}
.lmCTit{font-size:.84em;font-weight:700;flex:1}
.lmOnl{font-size:.71em;color:${G};font-weight:600;display:flex;align-items:center;gap:3px;margin-right:6px}
.lmOnlDot{width:6px;height:6px;border-radius:50%;background:${G}}
.lmCCl{cursor:pointer;background:none;border:none;color:inherit;font-size:1.1rem;opacity:.55}
.lmCCl:hover{opacity:1}
.lmCTabs{display:flex;border-bottom:1px solid rgba(255,255,255,.07);flex-shrink:0}
.lmCTab{flex:1;padding:7px 6px;text-align:center;cursor:pointer;
  font-size:.75em;font-weight:600;color:rgba(255,255,255,.4);
  border-bottom:2px solid transparent;transition:all .2s}
.lmCTab:hover{color:rgba(255,255,255,.75)}.lmCTab.on{color:${G};border-bottom-color:${G}}
.lmMsgs{flex:1;overflow-y:auto;padding:8px 9px 4px;
  display:flex;flex-direction:column;gap:5px;
  scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.12) transparent}
.lmMsgs::-webkit-scrollbar{width:3px}
.lmMsgs::-webkit-scrollbar-thumb{background:rgba(255,255,255,.18);border-radius:2px}
.lmBbl{max-width:84%;padding:6px 11px;border-radius:14px;font-size:.83em;line-height:1.45;word-break:break-word}
.lmBbl.me{align-self:flex-end;background:${G};color:#fff;border-bottom-right-radius:3px}
.lmBbl.they{align-self:flex-start;background:rgba(255,255,255,.1);border-bottom-left-radius:3px}
.lmBbl.bc{align-self:center;background:rgba(180,90,0,.75);color:#fff;border-radius:8px;max-width:96%;font-size:.8em;text-align:center}
.lmBbn{font-size:.7em;opacity:.6;margin-bottom:2px}
.lmIA{display:flex;align-items:center;gap:5px;padding:7px 8px;
  border-top:1px solid rgba(255,255,255,.07);flex-shrink:0;position:relative}
.lmInp{flex:1;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12);
  border-radius:18px;color:inherit;padding:6px 12px;font-size:.83em;outline:none;font-family:inherit}
.lmInp:focus{border-color:${G}}
.lmSnd{background:${G};color:#fff;border:none;border-radius:50%;
  width:30px;height:30px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.lmSnd:hover{background:${GD}}
.lmEmBtn{cursor:pointer;background:none;border:none;color:inherit;font-size:1.15rem;line-height:1;
  opacity:.55;flex-shrink:0;padding:0}
.lmEmBtn:hover{opacity:.9}
.lmEmpick{position:absolute;bottom:100%;left:0;right:0;
  background:rgba(10,10,10,.96);backdrop-filter:blur(20px);
  border:1px solid rgba(255,255,255,.1);border-radius:10px 10px 0 0;
  padding:8px;display:flex;flex-wrap:wrap;gap:2px;
  max-height:160px;overflow-y:auto;z-index:9;scrollbar-width:thin}
.lmEmpick span{cursor:pointer;font-size:1.25em;border-radius:4px;padding:2px;
  transition:background .1s;line-height:1.3}
.lmEmpick span:hover{background:rgba(255,255,255,.12)}
.lmDMInp{padding:8px 10px;border-bottom:1px solid rgba(255,255,255,.07);flex-shrink:0}
.lmDMInp input{width:100%;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12);
  border-radius:18px;color:inherit;padding:6px 13px;font-size:.83em;outline:none;
  font-family:inherit;box-sizing:border-box;text-transform:uppercase}
.lmDMInp input:focus{border-color:${G}}
.lmDMInp small{display:block;font-size:.69em;opacity:.4;margin-top:4px;text-align:center}
.lmDMRow{display:flex;align-items:center;gap:9px;padding:9px 12px;cursor:pointer;
  font-size:.84em;border-bottom:1px solid rgba(255,255,255,.04);transition:background .15s}
.lmDMRow:hover{background:rgba(255,255,255,.06)}
.lmDMBdg{margin-left:auto;background:${G};color:#fff;font-size:.68em;font-weight:700;border-radius:10px;padding:1px 6px}
.lmBack{display:flex;align-items:center;gap:5px;padding:7px 11px;font-size:.78em;
  cursor:pointer;border-bottom:1px solid rgba(255,255,255,.06);color:${G};flex-shrink:0}
.lmBack:hover{opacity:.8}
.lmCodeBtn{margin:8px 10px;background:rgba(255,255,255,.07);
  border:1px solid rgba(255,255,255,.12);border-radius:7px;
  padding:6px 12px;font-size:.77em;cursor:pointer;
  display:flex;align-items:center;gap:6px;width:calc(100% - 20px);
  box-sizing:border-box;font-family:inherit;color:inherit;text-align:left}
.lmCodeBtn:hover{background:rgba(255,255,255,.11)}
.lmCodePop{margin:4px 10px;background:rgba(10,10,10,.95);backdrop-filter:blur(20px);
  border:1px solid rgba(255,255,255,.12);border-radius:10px;padding:14px 16px;
  box-shadow:0 8px 24px rgba(0,0,0,.5)}
.lmCodePop h4{margin:0 0 5px;font-size:.82em;color:${G}}
.lmCodePop small{display:block;opacity:.45;font-size:.73em;margin-bottom:10px;line-height:1.4}
.lmCodeVal{font-size:1.6em;font-weight:700;letter-spacing:.18em;color:${G};text-align:center;margin:6px 0}
.lmCopyBtn{width:100%;background:${G};color:#fff;border:none;border-radius:6px;
  padding:7px;font-size:.82em;cursor:pointer;font-family:inherit;margin-top:4px}
.lmCopyBtn:hover{background:${GD}}
`;
document.head.appendChild(st);

/* ── Helpers ── */
function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}

function api(ep,opts={}){
  const base=S.url||location.origin;
  const t=`MediaBrowser Client="Jellyfin Web", Device="Plugin", DeviceId="${S.dev||'LMPl1'}", Version="1.0.0", Token="${S.tok}"`;
  const headers = { 'Authorization': t, 'X-Emby-Authorization': t, ...(opts.headers||{}) };
  if (opts.body) headers['Content-Type'] = 'application/json';
  
  return fetch(`${base}/${ep}`,{...opts, headers})
    .then(r=>{if(!r.ok)throw new Error(r.status+'');return r.text().then(t=>t?JSON.parse(t):{})});
}

function cfm(msg){
  return new Promise(res=>{
    const el=document.createElement('div');el.className='lmCf';
    el.innerHTML=`<div class="lmPanel lmCfb"><p>${msg}</p><div class="lmCfa"><button class="lmBtn pg">Proceed</button><button class="lmBtn gh">Cancel</button></div></div>`;
    document.body.appendChild(el);
    el.querySelector('.pg').onclick=()=>{el.remove();res(true)};
    el.querySelector('.gh').onclick=()=>{el.remove();res(false)};
    el.addEventListener('click',e=>{if(e.target===el){el.remove();res(false)}});
  });
}

function mkBtn(id,icon,cb){
  const d=document.createElement('div');d.className='lmW';d.id=id;d.innerHTML=icon;
  d.addEventListener('click',e=>{e.stopPropagation();cb(e,d)});
  return d;
}

// ── Outside-click: robust composedPath check ───────────────────────────────
function outsideClose(exclude, cb){
  setTimeout(()=>{
    function h(e){
      if(exclude && e.composedPath && !e.composedPath().includes(exclude)){
        cb();
      }
    }
    exclude._outsideHandler = h;
    document.addEventListener('mousedown', h);
  }, 10);
}

function removeOverlay(exclude){
  if(exclude && exclude._outsideHandler){
    document.removeEventListener('mousedown', exclude._outsideHandler);
    exclude._outsideHandler = null;
  }
}

/* ── Latest Media Dropdown ── */
let ddOpen=false;
function openDD(e,wrap){
  if(ddOpen){closeDD(wrap);return}
  const dd=document.createElement('div');dd.className='lmPanel lmDD on';dd.id='lmDD';
  dd.addEventListener('click', ev => ev.stopPropagation()); // prevent bubbling to button wrapper
  dd.innerHTML=`<div class="lmTabs"><div class="lmTab on" data-t="r">Recently Added</div><div class="lmTab" data-t="l">Leaving Soon</div></div><div id="lmDDb"><div class="lmEmpty">Loading…</div></div>`;
  wrap.appendChild(dd);ddOpen=true;
  dd.querySelectorAll('.lmTab').forEach(t=>t.addEventListener('click',ev=>{ev.stopPropagation();dd.querySelectorAll('.lmTab').forEach(x=>x.classList.remove('on'));t.classList.add('on');loadTab(t.dataset.t)}));
  loadTab('r');
  outsideClose(wrap, ()=>closeDD(wrap));
}
function closeDD(wrap){
  const d=document.getElementById('lmDD');
  if(d){ removeOverlay(d); d.remove(); }
  ddOpen=false;
}

function tyC(t){return t==='Movie'?'mv':t==='Series'||t==='Episode'?'sr':t==='Anime'?'an':'ot'}

function loadTab(t){
  const b=document.getElementById('lmDDb');if(!b)return;b.innerHTML='<div class="lmEmpty">Loading…</div>';
  api(t==='r'?'LatestMedia/Items':'LatestMedia/LeavingSoon')
    .then(its=>{
      if(!its||!its.length){b.innerHTML=`<div class="lmEmpty">${t==='r'?'Nothing recently added.':'Nothing leaving soon.'}</div>`;return}
      if(t==='r')renderR(b,its);else renderL(b,its);
    }).catch(ex=>{b.innerHTML=`<div class="lmEmpty">Error: ${esc(ex.message)}</div>`});
}

function renderR(b,items){
  b.innerHTML=items.map(i=>{
    const y=i.ProductionYear?` (${i.ProductionYear})`:'';
    const d=i.DateAdded?Math.floor((Date.now()-new Date(i.DateAdded))/86400000):null;
    const age=d===null?'':d===0?'Today':`${d}d ago`;
    return`<a class="lmCard" href="#!/details?id=${i.Id}"><img class="lmPoster" loading="lazy" src="${S.url}/Items/${i.Id}/Images/Primary?fillWidth=90&quality=75" onerror="this.style.visibility='hidden'"/><div class="lmMeta"><div class="lmTitle">${esc(i.Title||i.Name||'?')}${y}</div><div class="lmSub"><span class="lmBdge ${tyC(i.Type)}">${i.Type||'?'}</span>${age?`<span>${age}</span>`:''}</div></div></a>`;
  }).join('');
  b.querySelectorAll('.lmCard').forEach(a=>a.addEventListener('click',()=>{const w=document.getElementById('lm-btn-latest');closeDD(w)}));
}
function renderL(b,items){
  b.innerHTML=items.map(i=>`<a class="lmCard" href="#!/details?id=${i.Id}"><img class="lmPoster" loading="lazy" src="${S.url}/Items/${i.Id}/Images/Primary?fillWidth=90&quality=75" onerror="this.style.visibility='hidden'"/><div class="lmMeta"><div class="lmTitle">${esc(i.Title||i.Name||'?')}</div><div class="lmSub"><span class="lmBdge ${tyC(i.Type)}">${i.Type||'?'}</span><span class="lmLd">⏳ ${i.DaysRemaining??'?'}d left</span></div></div></a>`).join('');
  b.querySelectorAll('.lmCard').forEach(a=>a.addEventListener('click',()=>{const w=document.getElementById('lm-btn-latest');closeDD(w)}));
}

/* ── Media Management ── */
function openMgmt(){
  const ov=document.createElement('div');ov.className='lmOv';
  ov.innerHTML=`<div class="lmPanel lmMod"><div class="lmMHdr"><h2>Media Management</h2><button class="lmMCl">&times;</button></div><div class="lmMBdy" id="lmMM"><div class="lmEmpty" style="padding:28px">Loading…</div></div></div>`;
  document.body.appendChild(ov);
  ov.querySelector('.lmMCl').onclick=()=>ov.remove();
  ov.addEventListener('click',e=>{if(e.target===ov)ov.remove()});
  loadMM(ov);
}
function loadMM(ov){
  const b=document.getElementById('lmMM');if(!b)return;
  api('MediaMgmt/Items').then(items=>{
    if(!items||!items.length){b.innerHTML='<div class="lmEmpty" style="padding:28px">No items.</div>';return}
    let h=`<table class="lmTbl"><thead><tr><th>Title</th><th>Year</th><th>MB</th><th>Status</th><th>Action</th></tr></thead><tbody>`;
    items.forEach(i=>{
      const mb=i.Size?(i.Size/1048576).toFixed(1):'—';
      const sched=i.Status&&i.Status!=='Active';
      h+=`<tr><td>${esc(i.Title||'—')}</td><td>${i.Year||'—'}</td><td>${mb}</td><td>${esc(i.Status||'Active')}</td><td>${sched
        ?`<button class="lmBtn dn lmCD" data-id="${i.Id}">Cancel</button>`
        :`<select class="lmSel lmSD" data-id="${i.Id}" data-t="${esc(i.Title||'this item')}"><option value="">Schedule…</option><option value="1">1 Day</option><option value="3">3 Days</option><option value="7">1 Week</option><option value="14">2 Weeks</option><option value="30">1 Month</option></select>`
      }</td></tr>`;
    });
    b.innerHTML=h+'</tbody></table>';
    b.querySelectorAll('.lmSD').forEach(s=>s.onchange=async()=>{
      if(!s.value)return;
      const ok=await cfm(`Schedule <b>${esc(s.dataset.t)}</b> for deletion in <b>${s.value} day(s)</b>?`);
      if(!ok){s.value='';return}
      try{await api(`MediaMgmt/Items/${s.dataset.id}/ScheduleDelete?days=${s.value}`,{method:'POST'});loadMM(ov)}
      catch(ex){alert('Error '+ex.message);s.value=''}
    });
    b.querySelectorAll('.lmCD').forEach(btn=>btn.onclick=async()=>{
      if(!await cfm('Cancel scheduled deletion?'))return;
      try{await api(`MediaMgmt/Items/${btn.dataset.id}/CancelDelete`,{method:'DELETE'});loadMM(ov)}
      catch(ex){alert('Error '+ex.message)}
    });
  }).catch(ex=>{b.innerHTML=`<div class="lmEmpty" style="padding:28px">Error: ${esc(ex.message)}</div>`});
}

/* ── Chat ── */
let chatTab='pub',dmTarget=null,chatWrap=null;

function openChat(wrap,isPlayer){
  if(document.getElementById('lmChat')){closeChat();return}
  chatWrap=wrap;
  const p=document.createElement('div');p.id='lmChat';p.className='lmPanel lmChat'+(isPlayer?' lmChatPlayer':'');
  p.addEventListener('click', e => e.stopPropagation());
  p.innerHTML=`
<div class="lmCHdr">
  <span class="lmCTit">Chat</span>
  <span class="lmOnl" id="lmOnl"><span class="lmOnlDot"></span> 0 online</span>
  <button class="lmCCl">&times;</button>
</div>
<div class="lmCTabs">
  <div class="lmCTab on" data-tab="pub">Public Chat</div>
  <div class="lmCTab" data-tab="dm">Direct Messages</div>
</div>
<div class="lmMsgs" id="lmMsgs"></div>
<div class="lmIA" id="lmIA">
  <button class="lmEmBtn" id="lmEmBtn">😊</button>
  <input class="lmInp" id="lmInp" placeholder="Type a message…" maxlength="500" autocomplete="off"/>
  <button class="lmSnd"><svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg></button>
</div>`;
  if(isPlayer){document.body.appendChild(p)}else{wrap.appendChild(p)}

  p.querySelector('.lmCCl').onclick=()=>closeChat();
  p.querySelectorAll('.lmCTab').forEach(t=>t.addEventListener('click',ev=>{
    p.querySelectorAll('.lmCTab').forEach(x=>x.classList.remove('on'));
    t.classList.add('on');chatTab=t.dataset.tab;dmTarget=null;renderChat();
  }));
  const inp=p.querySelector('#lmInp');
  p.querySelector('.lmSnd').onclick=()=>doSend(inp.value);
  inp.addEventListener('keyup',e=>{if(e.key==='Enter')doSend(inp.value)});
  p.querySelector('#lmEmBtn').onclick=e=>{e.stopPropagation();toggleEmoji(p,inp)};

  refreshOnline();renderChat();
  outsideClose(wrap, closeChat);

  S.timer=setInterval(()=>{refreshOnline();refreshBadge();if(chatTab==='pub'&&!dmTarget)renderChat()},9000);
}

function closeChat(){
  const p=document.getElementById('lmChat');
  if(chatWrap){ removeOverlay(chatWrap); chatWrap=null; }
  if(p){ p.remove(); }
  if(S.timer){clearInterval(S.timer);S.timer=null}
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
  api('Chat/DM/Conversations').then(cs=>{
    const n=(cs||[]).reduce((a,c)=>a+(c.UnreadCount||c.unreadCount||0),0);
    const b=document.getElementById('lmChatBdg');if(b){b.textContent=n;b.classList.toggle('on',n>0);}
  }).catch(()=>{});
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
  document.getElementById('lmBack')?.remove();

  if(chatTab==='pub'){
    if(ia)ia.style.display='flex';
    msgs.innerHTML='<div class="lmEmpty">Loading…</div>';
    api('Chat/Messages').then(d=>drawBubbles(msgs,d)).catch(()=>{msgs.innerHTML='<div class="lmEmpty">Error loading.</div>'});

  }else if(chatTab==='dm'&&!dmTarget){
    if(ia)ia.style.display='none';
    renderDMList(msgs);

  }else if(chatTab==='dm'&&dmTarget){
    if(ia)ia.style.display='flex';
    const bk=doc('div','lmBack','lmBack','← Back');bk.onclick=()=>{dmTarget=null;renderChat()};
    msgs.parentElement.insertBefore(bk,msgs);
    msgs.innerHTML='<div class="lmEmpty">Loading…</div>';
    api(`Chat/DM/${dmTarget.id}/Messages`).then(d=>drawBubbles(msgs,d)).catch(()=>{msgs.innerHTML='<div class="lmEmpty">Error loading.</div>'});
  }
}

function doc(tag,id,cls,html){const e=document.createElement(tag);e.id=id;e.className=cls;if(html)e.innerHTML=html;return e}

function renderDMList(container){
  const panel=document.getElementById('lmChat');if(!panel)return;

  // Code button
  const cb=document.createElement('button');cb.id='lmCodeBtn';cb.className='lmCodeBtn';
  cb.innerHTML='My Chat Code';
  cb.onclick=()=>toggleCodePop(panel);
  container.before(cb);

  // DM search
  const dib=document.createElement('div');dib.id='lmDMInpBar';dib.className='lmDMInp';
  dib.innerHTML=`<input id="lmDCI" placeholder="Enter 6-char code & press Enter…" maxlength="6" autocomplete="off"/><small>Ask the other person for their code</small>`;
  container.before(dib);

  const ci=dib.querySelector('#lmDCI');
  ci.onkeyup=e=>{
    if(e.key!=='Enter')return;
    const code=ci.value.trim().toUpperCase();
    if(code.length!==6){ci.style.borderColor='#c62828';return}
    ci.disabled=true;
    api(`Chat/DM/Users/ByCode/${code}`)
      .then(u=>{ci.value='';ci.disabled=false;dmTarget={id:u.Id,name:u.Name};renderChat()})
      .catch(ex=>{ci.style.borderColor='#c62828';ci.disabled=false;ci.placeholder=ex.message.includes('404')?'Not found':'Error';setTimeout(()=>{ci.placeholder='Enter 6-char code & press Enter…';ci.style.borderColor=''},3000)});
  };

  container.innerHTML='<div class="lmEmpty" style="padding-top:6px">Loading…</div>';
  api('Chat/DM/Conversations').then(cs=>{
    if(!cs||!cs.length){container.innerHTML='<div class="lmEmpty" style="padding-top:6px">No conversations yet.</div>';return}
    container.innerHTML=cs.map(c=>{
      const n=c.UnreadCount||c.unreadCount||0;
      return`<div class="lmDMRow" data-id="${c.UserId||c.userId}" data-n="${esc(c.UserName||c.userName||'User')}">${esc(c.UserName||c.userName||'User')}${n>0?`<span class="lmDMBdg">${n}</span>`:''}</div>`;
    }).join('');
    container.querySelectorAll('.lmDMRow').forEach(r=>r.addEventListener('click',()=>{dmTarget={id:r.dataset.id,name:r.dataset.n};renderChat()}));
  }).catch(()=>{container.innerHTML='<div class="lmEmpty">Could not load conversations.</div>'});
}

function toggleCodePop(panel){
  const ex=document.getElementById('lmCodePop');if(ex){ex.remove();return}
  const cp=document.createElement('div');cp.id='lmCodePop';cp.className='lmCodePop';

  function showCode(code){
    cp.innerHTML=`<h4>Your Chat Code</h4><small>Share this 6-character code so others can send you direct messages. Each code is unique to your account and never changes.</small><div class="lmCodeVal">${code}</div><button class="lmCopyBtn">Copy Code</button>`;
    cp.querySelector('.lmCopyBtn').onclick=()=>{
      navigator.clipboard?.writeText(code);
      cp.querySelector('.lmCopyBtn').textContent='Copied! ✓';
      setTimeout(()=>{if(cp.isConnected)cp.querySelector('.lmCopyBtn').textContent='Copy Code'},2000);
    };
  }

  if(S.code){showCode(S.code)}
  else{
    cp.innerHTML='<div class="lmEmpty">Loading code…</div>';
    api('Chat/MyCode').then(r=>{S.code=r.Code;showCode(r.Code)}).catch(()=>{cp.innerHTML='<div class="lmEmpty">Could not load code.</div>'});
  }

  // Insert after code button
  const btn=document.getElementById('lmCodeBtn');
  if(btn)btn.after(cp);else panel.querySelector('.lmMsgs').before(cp);
}

function drawBubbles(container,msgs){
  if(!Array.isArray(msgs)||!msgs.length){container.innerHTML='<div class="lmEmpty">No messages yet.</div>';return}
  container.innerHTML='';
  msgs.forEach(m=>{
    const isMe=String(m.SenderId||m.senderId)===String(S.uid);
    const bc=m.IsBroadcast||m.isBroadcast;
    const cls=bc?'bc':isMe?'me':'they';
    const name=m.SenderName||m.senderName||(isMe?'You':'User');
    const txt=m.Content||m.content||(m.Ciphertext?'🔒 Encrypted':'');
    const el=document.createElement('div');el.className=`lmBbl ${cls}`;
    el.innerHTML=`<div class="lmBbn">${esc(name)}</div>${esc(txt)}`;
    container.appendChild(el);
  });
  container.scrollTop=container.scrollHeight;
}

async function doSend(txt){
  if(!txt||!txt.trim())return;
  const inp=document.getElementById('lmInp');if(inp)inp.value='';
  try{
    if(chatTab==='pub')await api('Chat/Messages',{method:'POST',body:JSON.stringify({content:txt})});
    else if(dmTarget)await api(`Chat/DM/${dmTarget.id}/Messages`,{method:'POST',body:JSON.stringify({content:txt})});
    renderChat();
  }catch(ex){if(inp)inp.value=txt;alert('Send failed: '+ex.message)}
}

/* ── Injection ── */
let ij=false;
async function tryInject(){
  if(S.ok||ij)return;
  if(!window.ApiClient||!ApiClient.accessToken())return;
  const hr=document.querySelector('.headerRight,.headerButtons,[class*="headerRight"]');
  if(!hr||document.getElementById('lm-btn-latest'))return;
  ij=true;
  try{
    const ac=window.ApiClient;
    if(!ac||!ac.accessToken()||!ac.getCurrentUserId())return;
    S.tok=ac.accessToken();
    S.uid=ac.getCurrentUserId();
    S.dev=typeof ac.deviceId==='function'?ac.deviceId():(ac._deviceId||'LMPl1');
    S.url=((typeof ac.serverAddress==='function'?ac.serverAddress():null)||location.origin).replace(/\/$/,'');
    const me=await api('Users/Me');
    S.uid=me.Id;S.admin=me.Policy?.IsAdministrator||false;
    let cfg={};try{cfg=await api(`Plugins/${PID}/Configuration`)}catch(e){}
    S.cfg=cfg;
    const f=document.createDocumentFragment();
    if(cfg.EnableLatestMediaButton!==false)f.appendChild(mkBtn('lm-btn-latest',ICO.latest,openDD));
    if(S.admin&&cfg.EnableMediaManagement!==false)f.appendChild(mkBtn('lm-btn-manage',ICO.manage,()=>openMgmt()));
    if(cfg.EnableChat!==false){
      const b=mkBtn('lm-btn-chat',ICO.chat,(ev,w)=>openChat(w));
      const bdg=document.createElement('span');bdg.id='lmChatBdg';bdg.className='lmBdg';b.appendChild(bdg);
      f.appendChild(b);
      api('Chat/MyCode').then(r=>{S.code=r.Code}).catch(()=>{});
      refreshBadge();
    }
    hr.insertBefore(f,hr.firstChild);S.ok=true;
  }catch(ex){console.debug('[LM] deferred:',ex.message)}finally{ij=false}
}

/* ── Player OSD Chat Button ── */
function tryInjectPlayerChat(){
  if(S.cfg?.EnableChat===false)return;
  const osd=document.querySelector('.osdControls .buttons-right,.videoOsdBottom .buttons-right,[class*="osdControls"] [class*="buttons-right"]');
  if(!osd||document.getElementById('lm-player-chat'))return;
  const btn=document.createElement('button');
  btn.id='lm-player-chat';btn.className='lmPlayerChatBtn paper-icon-button-light';
  btn.title='Chat';btn.innerHTML=ICO.chat;
  btn.addEventListener('click',e=>{e.stopPropagation();openChat(btn,true)});
  osd.insertBefore(btn,osd.firstChild);
}

const obs=new MutationObserver(()=>{
  if(!document.getElementById('lm-btn-latest'))S.ok=false;
  tryInject();
  tryInjectPlayerChat();
});
obs.observe(document.body,{childList:true,subtree:true});
setInterval(()=>{if(!document.getElementById('lm-btn-latest'))S.ok=false;tryInject();tryInjectPlayerChat()},3000);
tryInject();
})();
