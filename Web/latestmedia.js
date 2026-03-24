(function(){
'use strict';
const GREEN='#00b35a',GREEN_D='#008c45',PLUGIN_ID='f94d6caf-2a62-4dd7-9f64-684ce8efff43';

const EMOJIS=[
  // Smileys
  '😀','😁','😂','🤣','😃','😄','😅','😆','😇','😈','😉','😊','😋','😌','😍','🥰','😎','😏','😐','😑','😒','😓','😔','😕','😖','😗','😘','😙','😚','😛','😜','🤪','😝','😞','😟','😠','😡','🤬','😢','😣','😤','😥','😦','😧','😨','😩','🤯','😪','😫','🥱','😬','😭','😮','😯','😰','😱','😲','😳','🥺','😴','😵','🤐','🥴','🤢','🤮','🤧','🤒','🤕','🤑','🤠','😎','🤓','🧐','😺','😸','😹','😻','😼','😽','🙀','😿','😾',
  // Gestures & People
  '👍','👎','👌','✌️','🤞','🤟','🤘','👋','🤚','🖐️','✋','🖖','👏','🙌','🤲','🤜','🤛','💪','🦾','🙏','🤝','👐','🫶','❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗','💖','💘','💝',
  // Animals
  '🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🙈','🙉','🙊','🐔','🐧','🐦','🐤','🦆','🦅','🦉','🦇','🐺','🐗','🐴','🦄','🐝','🐛','🦋','🐌','🐞','🐜','🦟','🦗','🐢','🐍','🦎','🦕','🦖','🐙','🦑','🦀','🦞','🦐','🦈','🐳','🐋','🐬','🐟','🐠','🐡','🦭','🐊',
  // Food
  '🍎','🍊','🍋','🍇','🍓','🍒','🍑','🥭','🍍','🥥','🍆','🌽','🥕','🧄','🥔','🍔','🍟','🌮','🌯','🥗','🍜','🍝','🍣','🍱','🍛','🍲','🍚','🍙','🥟','🧆','🥐','🥖','🥨','🥞','🧇','🥓','🥩','🍗','🍖','🌭','🍕','🧀','🥚','🍳','🥑','🫐','🫑','🥦','🧅','🍟','🍦','🍧','🍨','🍩','🍪','🎂','🍰','🧁','🥮','🍫','🍬','🍭','☕','🫖','🧃','🍵','🥤','🧋','🍺','🍻','🥂','🍷','🥃',
  // Activities & Objects
  '⚽','🏀','🏈','⚾','🎾','🏐','🏉','🎱','🏓','🏸','🥅','⛳','🎣','🎿','🛷','🥌','🎯','🎳','🏋️','🤸','⛹️','🏊','🚴','🧗','🤼','🤺','🏇','🧘','🎪','🎭','🎨','🎬','🎤','🎧','🎼','🎮','🕹️','🎲','🎰','🧩','♟️','🎭','🎪',
  // Travel & Nature
  '🏠','🏡','🏢','🏣','🏤','🏥','🏦','🏨','🏩','🏪','🏫','🏬','🏭','🏗️','🏘️','🏚️','🌍','🌎','🌏','🌐','🗺️','🏔️','⛰️','🌋','🗻','🏕️','🏖️','🏜️','🏝️','🏞️','🌅','🌄','🌠','🎇','🎆','🌃','🌆','🌇','🌉','🌌','🌁','⛅','🌤️','🌥️','🌦️','🌧️','🌨️','🌩️','🌪️','🌫️','🌬️','🌈','☂️','❄️','⛄','☃️','🔥','💧','🌊','⭐','🌟','💫','✨','☄️','🌙','🌞','🌝','🌛','🌜','🌚','🌕','🌖','🌗','🌘','🌑','🌒','🌓','🌔','🌙',
  // Symbols & Misc
  '🎉','🎊','🎈','🎁','🎀','🏆','🥇','🥈','🥉','🏅','🎖️','🔔','🔕','🎵','🎶','📢','📣','🔊','🔇','📱','💻','🖥️','🖨️','⌨️','🖱️','🖲️','💾','💿','📀','📷','📸','📹','🎥','📞','☎️','📟','📠','📺','📻','🧭','⏰','⌚','⏱️','⏲️','🔋','🔌','💡','🔦','🕯️','🗑️','💰','💴','💵','💶','💷','💸','💳','🧾','📝','📌','📍','🗝️','🔑','🔒','🔓','❤️‍🔥','💯','✅','❌','❓','❗','💬','💭','🔴','🟠','🟡','🟢','🔵','🟣','⚫','⚪','🟤'
];

const ICONS={
  latest:`<svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>`,
  manage:`<svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.06-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.06,0.94l-2.03,1.58c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.43-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.49-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/></svg>`,
  chat:`<svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z"/></svg>`
};

const S={serverUrl:'',token:'',userId:'',myCode:'',isAdmin:false,config:{},injected:false,chatTimer:null};

// ── CSS ──────────────────────────────────────────────────────────────────────
const css=document.createElement('style');
css.innerHTML=`
.lm-w{display:inline-flex;align-items:center;justify-content:center;position:relative;width:40px;height:40px;cursor:pointer;color:inherit;flex-shrink:0;transition:opacity .2s}
.lm-w:hover{opacity:.75}
.lm-badge{position:absolute;top:2px;right:2px;background:${GREEN};color:#fff;border-radius:50%;min-width:16px;height:16px;font-size:10px;font-weight:700;display:none;align-items:center;justify-content:center;padding:0 3px;pointer-events:none}
.lm-badge.on{display:flex}

/* Dropdowns and panels — translucent by default, opaque on focus */
.lm-drop,.lm-chat{
  background:rgba(18,18,28,0.55);
  backdrop-filter:blur(18px) saturate(1.2);
  -webkit-backdrop-filter:blur(18px) saturate(1.2);
  border:1px solid rgba(255,255,255,0.09);
  border-radius:12px;
  box-shadow:0 8px 32px rgba(0,0,0,0.4);
  transition:background .25s, box-shadow .25s, border-color .25s;
}
.lm-drop:hover,.lm-drop:focus-within,
.lm-chat:hover,.lm-chat:focus-within{
  background:rgba(18,18,28,0.93);
  box-shadow:0 12px 40px rgba(0,0,0,0.65);
  border-color:rgba(255,255,255,0.14);
}

.lm-drop{position:absolute;top:calc(100% + 6px);right:0;width:330px;max-height:72vh;overflow-y:auto;z-index:9999;display:none;
  scrollbar-width:thin;scrollbar-color:rgba(255,255,255,0.15) transparent}
.lm-drop.on{display:block}
.lm-drop::-webkit-scrollbar{width:4px}
.lm-drop::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.18);border-radius:2px}

.lm-tabs{display:flex;border-bottom:1px solid rgba(255,255,255,0.07);position:sticky;top:0;z-index:1;background:rgba(18,18,28,0.7);backdrop-filter:blur(18px)}
.lm-tab{flex:1;padding:9px 6px;text-align:center;cursor:pointer;font-size:.77em;font-weight:600;color:rgba(255,255,255,0.4);border-bottom:2px solid transparent;transition:all .2s}
.lm-tab:hover{color:rgba(255,255,255,.7)}
.lm-tab.on{color:${GREEN};border-bottom-color:${GREEN}}

.lm-card{display:flex;align-items:center;gap:11px;padding:9px 12px;border-bottom:1px solid rgba(255,255,255,.05);cursor:pointer;color:inherit;text-decoration:none;transition:background .15s}
.lm-card:hover{background:rgba(255,255,255,.07)}
.lm-card:last-child{border-bottom:none}
.lm-poster{width:40px;height:60px;object-fit:cover;border-radius:4px;background:rgba(255,255,255,.05);flex-shrink:0}
.lm-meta{flex:1;min-width:0}
.lm-title{font-size:.9em;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.lm-sub{font-size:.73em;opacity:.55;margin-top:3px;display:flex;gap:6px;align-items:center}
.lm-tb{font-size:.67em;font-weight:700;padding:1px 5px;border-radius:3px;color:#fff;text-transform:uppercase}
.lm-mv{background:#1565c0}.lm-sr{background:${GREEN_D}}.lm-an{background:#6a1b9a}.lm-ot{background:#555}
.lm-ld{font-size:.7em;font-weight:700;padding:1px 5px;border-radius:3px;background:#c62828;color:#fff}
.lm-empty{padding:22px;text-align:center;opacity:.45;font-size:.87em}

/* Modal */
.lm-ov{position:fixed;inset:0;background:rgba(0,0,0,.7);backdrop-filter:blur(4px);z-index:99997;display:flex;align-items:center;justify-content:center}
.lm-modal{background:var(--theme-background-color,#18181f);border:1px solid rgba(255,255,255,.1);border-radius:12px;width:92%;max-width:980px;max-height:88vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.65)}
.lm-mhdr{display:flex;align-items:center;justify-content:space-between;padding:14px 20px;border-bottom:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.03);flex-shrink:0}
.lm-mhdr h2{margin:0;font-size:1.05rem;font-weight:600}
.lm-mcl{cursor:pointer;background:none;border:none;color:inherit;font-size:1.3rem;opacity:.6;line-height:1}.lm-mcl:hover{opacity:1}
.lm-mbody{overflow-y:auto;flex:1}
.lm-tbl{width:100%;border-collapse:collapse;font-size:.86em}
.lm-tbl th{padding:9px 12px;text-align:left;background:rgba(0,0,0,.25);font-weight:600;position:sticky;top:0}
.lm-tbl td{padding:8px 12px;border-bottom:1px solid rgba(255,255,255,.04);vertical-align:middle}
.lm-tbl tr:hover td{background:rgba(255,255,255,.025)}
.lm-sel{appearance:none;-webkit-appearance:none;background:rgba(30,30,45,.95);color:inherit;border:1px solid rgba(255,255,255,.18);border-radius:5px;padding:4px 26px 4px 8px;font-size:.82em;cursor:pointer;font-family:inherit;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='rgba(255,255,255,0.6)'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E");
  background-repeat:no-repeat;background-position:right 3px center;background-size:18px}
.lm-sel option{background:#1e1e2a;color:#fff}
.lm-sel:focus{outline:none;border-color:${GREEN}}
.lm-btn{display:inline-block;border:none;padding:5px 12px;border-radius:5px;cursor:pointer;font-size:.83em;white-space:nowrap;font-family:inherit}
.lm-pg{background:${GREEN};color:#fff}.lm-dn{background:#c62828;color:#fff}.lm-gh{background:rgba(255,255,255,.1);color:inherit}
.lm-btn:hover{filter:brightness(1.15)}

/* Confirm */
.lm-cf{position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.6);backdrop-filter:blur(4px)}
.lm-cfb{background:#1e1e2a;border:1px solid rgba(255,255,255,.12);border-radius:10px;padding:22px 26px;max-width:360px;width:90%;box-shadow:0 16px 48px rgba(0,0,0,.6);text-align:center}
.lm-cfb p{margin:0 0 16px;font-size:.9em;line-height:1.5}
.lm-cfacts{display:flex;gap:10px;justify-content:center}

/* Chat */
.lm-chat{position:absolute;top:calc(100% + 6px);right:0;width:330px;height:460px;display:flex;flex-direction:column;z-index:9999;overflow:hidden;transform-origin:top right;animation:lm-pop .2s cubic-bezier(.34,1.56,.64,1)}
@keyframes lm-pop{from{opacity:0;transform:scale(.88)}to{opacity:1;transform:scale(1)}}
.lm-chdr{display:flex;align-items:center;padding:9px 12px 7px;border-bottom:1px solid rgba(255,255,255,.07);flex-shrink:0}
.lm-chtit{font-size:.84em;font-weight:700;flex:1}
.lm-chon{font-size:.71em;color:${GREEN};font-weight:600;display:flex;align-items:center;gap:3px;margin-right:7px}
.lm-chon-dot{width:6px;height:6px;border-radius:50%;background:${GREEN}}
.lm-chcl{cursor:pointer;background:none;border:none;color:inherit;font-size:1.1rem;opacity:.55;line-height:1}.lm-chcl:hover{opacity:1}
.lm-chtabs{display:flex;border-bottom:1px solid rgba(255,255,255,.07);flex-shrink:0}
.lm-chtab{flex:1;padding:7px 6px;text-align:center;cursor:pointer;font-size:.75em;font-weight:600;color:rgba(255,255,255,.4);border-bottom:2px solid transparent;transition:all .2s}
.lm-chtab:hover{color:rgba(255,255,255,.75)}.lm-chtab.on{color:${GREEN};border-bottom-color:${GREEN}}
.lm-msgs{flex:1;overflow-y:auto;padding:8px 9px 4px;display:flex;flex-direction:column;gap:5px;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.12) transparent}
.lm-msgs::-webkit-scrollbar{width:3px}.lm-msgs::-webkit-scrollbar-thumb{background:rgba(255,255,255,.18);border-radius:2px}
.lm-bbl{max-width:84%;padding:6px 11px;border-radius:14px;font-size:.83em;line-height:1.45;word-break:break-word}
.lm-bbl.me{align-self:flex-end;background:${GREEN};color:#fff;border-bottom-right-radius:3px}
.lm-bbl.they{align-self:flex-start;background:rgba(255,255,255,.1);border-bottom-left-radius:3px}
.lm-bbl.bc{align-self:center;background:rgba(200,100,0,.75);color:#fff;border-radius:8px;max-width:96%;font-size:.8em;text-align:center}
.lm-bbn{font-size:.7em;opacity:.6;margin-bottom:2px}
.lm-ia{display:flex;align-items:center;gap:5px;padding:7px 8px;border-top:1px solid rgba(255,255,255,.07);flex-shrink:0;position:relative}
.lm-inp{flex:1;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12);border-radius:18px;color:inherit;padding:6px 12px;font-size:.83em;outline:none;font-family:inherit}
.lm-inp:focus{border-color:${GREEN}}
.lm-snd{background:${GREEN};color:#fff;border:none;border-radius:50%;width:30px;height:30px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.lm-snd:hover{background:${GREEN_D}}
.lm-emb{cursor:pointer;background:none;border:none;color:inherit;font-size:1.15rem;line-height:1;opacity:.55;flex-shrink:0;padding:0}
.lm-emb:hover{opacity:.9}
.lm-emp{position:absolute;bottom:100%;left:0;right:0;background:rgba(16,16,24,.97);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,.1);border-radius:10px 10px 0 0;padding:8px;display:flex;flex-wrap:wrap;gap:3px;max-height:170px;overflow-y:auto;z-index:5;scrollbar-width:thin}
.lm-emp span{cursor:pointer;font-size:1.25em;border-radius:4px;padding:2px;transition:background .1s;line-height:1.3}
.lm-emp span:hover{background:rgba(255,255,255,.12)}

/* DM specific */
.lm-dms{flex:1;overflow-y:auto;display:flex;flex-direction:column}
.lm-dminp{padding:9px 11px;border-bottom:1px solid rgba(255,255,255,.07);flex-shrink:0}
.lm-dminp input{width:100%;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12);border-radius:18px;color:inherit;padding:6px 13px;font-size:.83em;outline:none;font-family:inherit;box-sizing:border-box;text-transform:uppercase}
.lm-dminp input:focus{border-color:${GREEN}}
.lm-dminp small{display:block;font-size:.69em;opacity:.4;margin-top:4px;text-align:center}
.lm-dmrow{display:flex;align-items:center;gap:9px;padding:9px 12px;cursor:pointer;font-size:.84em;border-bottom:1px solid rgba(255,255,255,.04);transition:background .15s}
.lm-dmrow:hover{background:rgba(255,255,255,.06)}
.lm-dmbdg{margin-left:auto;background:${GREEN};color:#fff;font-size:.68em;font-weight:700;border-radius:10px;padding:1px 6px}
.lm-back{display:flex;align-items:center;gap:5px;padding:7px 11px;font-size:.78em;cursor:pointer;border-bottom:1px solid rgba(255,255,255,.06);color:${GREEN};flex-shrink:0}
.lm-back:hover{opacity:.8}

/* Chat code popup (DM view) */
.lm-code-btn{margin:8px 12px 0;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.13);border-radius:7px;padding:6px 12px;font-size:.77em;cursor:pointer;display:flex;align-items:center;gap:6px;width:calc(100% - 24px);box-sizing:border-box;font-family:inherit;color:inherit}
.lm-code-btn:hover{background:rgba(255,255,255,.12)}
.lm-code-pop{position:absolute;bottom:60px;left:10px;right:10px;background:rgba(20,20,32,.97);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,.12);border-radius:10px;padding:14px 16px;z-index:9;box-shadow:0 8px 28px rgba(0,0,0,.55)}
.lm-code-pop h4{margin:0 0 6px;font-size:.83em;color:${GREEN}}
.lm-code-pop small{display:block;opacity:.5;font-size:.76em;margin-bottom:10px;line-height:1.4}
.lm-code-val{font-size:1.5em;font-weight:700;letter-spacing:.15em;color:${GREEN};text-align:center;margin:6px 0}
.lm-copy-btn{width:100%;background:${GREEN};color:#fff;border:none;border-radius:6px;padding:7px;font-size:.82em;cursor:pointer;font-family:inherit;margin-top:4px}
.lm-copy-btn:hover{background:${GREEN_D}}
`;
document.head.appendChild(css);

// ── Helpers ───────────────────────────────────────────────────────────────────
function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}

function api(ep,opts={}){
  const base=S.serverUrl||location.origin;
  const tok=`MediaBrowser Client="Jellyfin Web", Device="Plugin", DeviceId="LMPlugin1", Version="1.0.0", Token="${S.token}"`;
  return fetch(`${base}/${ep}`,{...opts,headers:{'Authorization':tok,'X-Emby-Authorization':tok,'Content-Type':'application/json',...(opts.headers||{})}})
    .then(r=>{if(!r.ok)throw new Error(`${r.status}`);return r.text().then(t=>t?JSON.parse(t):{})});
}

function mkBtn(id,icon,cb){
  const d=document.createElement('div');
  d.className='lm-w';d.id=id;d.innerHTML=icon;
  d.addEventListener('click',e=>{e.stopPropagation();cb(e,d)});
  return d;
}

function confirm(msg){
  return new Promise(res=>{
    const el=document.createElement('div');el.className='lm-cf';
    el.innerHTML=`<div class="lm-cfb"><p>${msg}</p><div class="lm-cfacts"><button class="lm-btn lm-pg">Proceed</button><button class="lm-btn lm-gh">Cancel</button></div></div>`;
    document.body.appendChild(el);
    el.querySelector('.lm-pg').onclick=()=>{el.remove();res(true)};
    el.querySelector('.lm-gh').onclick=()=>{el.remove();res(false)};
    el.addEventListener('click',e=>{if(e.target===el){el.remove();res(false)}});
  });
}

// closeOnAway — does NOT close when clicking *inside* target
function closeOnAway(target,cb){
  function h(e){if(!target.contains(e.target)){cb();document.removeEventListener('mousedown',h)}}
  setTimeout(()=>document.addEventListener('mousedown',h),80);
}

// ── Latest Media Dropdown ─────────────────────────────────────────────────────
let ddOpen=false;
function openDD(e,wrap){
  if(ddOpen){closeDD(wrap);return}
  const dd=document.createElement('div');dd.className='lm-drop on';dd.id='lm-dd';
  dd.innerHTML=`<div class="lm-tabs"><div class="lm-tab on" data-t="r">Recently Added</div><div class="lm-tab" data-t="l">Leaving Soon</div></div><div id="lm-ddb"><div class="lm-empty">Loading…</div></div>`;
  wrap.appendChild(dd);ddOpen=true;
  dd.querySelectorAll('.lm-tab').forEach(t=>t.addEventListener('click',e2=>{e2.stopPropagation();dd.querySelectorAll('.lm-tab').forEach(x=>x.classList.remove('on'));t.classList.add('on');loadTab(t.dataset.t)}));
  loadTab('r');
  closeOnAway(wrap,()=>closeDD(wrap));
}
function closeDD(wrap){const d=document.getElementById('lm-dd');if(d)d.remove();ddOpen=false}

function loadTab(t){
  const b=document.getElementById('lm-ddb');if(!b)return;b.innerHTML='<div class="lm-empty">Loading…</div>';
  api(t==='r'?'LatestMedia/Items':'LatestMedia/LeavingSoon').then(items=>{
    if(!items||!items.length){b.innerHTML=`<div class="lm-empty">${t==='r'?'Nothing recently added.':'No items leaving soon.'}</div>`;return}
    if(t==='r')renderRecent(b,items);else renderLeaving(b,items);
  }).catch(e=>{b.innerHTML=`<div class="lm-empty">Failed: ${esc(e.message)}</div>`});
}

function typeClass(t){return t==='Movie'?'lm-mv':t==='Series'||t==='Episode'?'lm-sr':t==='Anime'?'lm-an':'lm-ot'}

function renderRecent(b,items){
  b.innerHTML=items.map(i=>{
    const y=i.ProductionYear?` (${i.ProductionYear})`:'';
    const diff=i.DateAdded?Math.floor((Date.now()-new Date(i.DateAdded))/86400000):null;
    const age=diff===null?'':diff===0?'Today':`${diff}d ago`;
    return`<a class="lm-card" href="#!/details?id=${i.Id}"><img class="lm-poster" loading="lazy" src="${S.serverUrl}/Items/${i.Id}/Images/Primary?fillWidth=90&quality=75" onerror="this.style.visibility='hidden'"/><div class="lm-meta"><div class="lm-title">${esc(i.Title||i.Name||'Unknown')}${y}</div><div class="lm-sub"><span class="lm-tb ${typeClass(i.Type)}">${i.Type||'?'}</span>${age?`<span>${age}</span>`:''}</div></div></a>`;
  }).join('');
  // Close when navigating to a movie
  b.querySelectorAll('.lm-card').forEach(a=>a.addEventListener('click',()=>{const w=document.getElementById('lm-btn-latest');closeDD(w)}));
}

function renderLeaving(b,items){
  b.innerHTML=items.map(i=>{
    const d=i.DaysRemaining??'?';
    return`<a class="lm-card" href="#!/details?id=${i.Id}"><img class="lm-poster" loading="lazy" src="${S.serverUrl}/Items/${i.Id}/Images/Primary?fillWidth=90&quality=75" onerror="this.style.visibility='hidden'"/><div class="lm-meta"><div class="lm-title">${esc(i.Title||i.Name||'Unknown')}</div><div class="lm-sub"><span class="lm-tb ${typeClass(i.Type)}">${i.Type||'?'}</span><span class="lm-ld">⏳ ${d}d left</span></div></div></a>`;
  }).join('');
  b.querySelectorAll('.lm-card').forEach(a=>a.addEventListener('click',()=>{const w=document.getElementById('lm-btn-latest');closeDD(w)}));
}

// ── Media Management ──────────────────────────────────────────────────────────
function openMgmt(){
  const ov=document.createElement('div');ov.className='lm-ov';
  ov.innerHTML=`<div class="lm-modal"><div class="lm-mhdr"><h2>Media Management</h2><button class="lm-mcl">&times;</button></div><div class="lm-mbody" id="lm-mm"><div class="lm-empty" style="padding:28px">Loading…</div></div></div>`;
  document.body.appendChild(ov);
  ov.querySelector('.lm-mcl').onclick=()=>ov.remove();
  ov.addEventListener('click',e=>{if(e.target===ov)ov.remove()});
  loadMgmt(ov);
}

function loadMgmt(ov){
  const b=document.getElementById('lm-mm');if(!b)return;
  api('MediaMgmt/Items').then(items=>{
    if(!items||!items.length){b.innerHTML='<div class="lm-empty" style="padding:28px">No items.</div>';return}
    let h=`<table class="lm-tbl"><thead><tr><th>Title</th><th>Year</th><th>Size(MB)</th><th>Status</th><th>Action</th></tr></thead><tbody>`;
    items.forEach(i=>{
      const mb=i.Size?(i.Size/1048576).toFixed(1):'—';
      const sched=i.Status&&i.Status!=='Active';
      h+=`<tr><td>${esc(i.Title||'—')}</td><td>${i.Year||'—'}</td><td>${mb}</td><td>${esc(i.Status||'Active')}</td><td>${sched
        ?`<button class="lm-btn lm-dn lm-cd" data-id="${i.Id}">Cancel</button>`
        :`<select class="lm-sel lm-sd" data-id="${i.Id}" data-t="${esc(i.Title||'this item')}"><option value="">Schedule Delete…</option><option value="1">1 Day</option><option value="3">3 Days</option><option value="7">1 Week</option><option value="14">2 Weeks</option><option value="30">1 Month</option></select>`
      }</td></tr>`;
    });
    b.innerHTML=h+'</tbody></table>';
    b.querySelectorAll('.lm-sd').forEach(s=>s.onchange=async()=>{
      if(!s.value)return;
      const ok=await confirm(`Schedule <strong>${esc(s.dataset.t)}</strong> for deletion in <strong>${s.value} day(s)</strong>?`);
      if(!ok){s.value='';return}
      try{await api(`MediaMgmt/Items/${s.dataset.id}/ScheduleDelete?days=${s.value}`,{method:'POST'});loadMgmt(ov)}
      catch(err){alert('Error: '+err.message);s.value=''}
    });
    b.querySelectorAll('.lm-cd').forEach(btn=>btn.onclick=async()=>{
      const ok=await confirm('Cancel scheduled deletion?');if(!ok)return;
      try{await api(`MediaMgmt/Items/${btn.dataset.id}/CancelDelete`,{method:'DELETE'});loadMgmt(ov)}
      catch(err){alert('Error: '+err.message)}
    });
  }).catch(e=>{b.innerHTML=`<div class="lm-empty" style="padding:28px">Error: ${esc(e.message)}</div>`});
}

// ── Chat ──────────────────────────────────────────────────────────────────────
let chatTab='pub';let dmTarget=null;

function openChat(wrap){
  if(document.getElementById('lm-chat')){closeChat();return}
  const p=document.createElement('div');p.id='lm-chat';p.className='lm-chat';
  p.innerHTML=`
<div class="lm-chdr">
  <span class="lm-chtit">Chat</span>
  <span class="lm-chon" id="lm-on"><span class="lm-chon-dot"></span> — online</span>
  <button class="lm-chcl">&times;</button>
</div>
<div class="lm-chtabs">
  <div class="lm-chtab on" data-tab="pub">Public Chat</div>
  <div class="lm-chtab" data-tab="dm">Direct Messages</div>
</div>
<div class="lm-msgs" id="lm-msgs"></div>
<div class="lm-ia" id="lm-ia">
  <button class="lm-emb" id="lm-emb">😊</button>
  <input class="lm-inp" id="lm-inp" placeholder="Type a message…" maxlength="500" autocomplete="off"/>
  <button class="lm-snd" id="lm-snd"><svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg></button>
</div>`;
  wrap.appendChild(p);

  p.querySelector('.lm-chcl').onclick=()=>closeChat();
  p.querySelectorAll('.lm-chtab').forEach(t=>t.addEventListener('click',e=>{
    e.stopPropagation();
    p.querySelectorAll('.lm-chtab').forEach(x=>x.classList.remove('on'));t.classList.add('on');
    chatTab=t.dataset.tab;dmTarget=null;renderChat();
  }));

  const inp=p.querySelector('#lm-inp');
  p.querySelector('#lm-snd').onclick=()=>doSend(inp.value);
  inp.addEventListener('keyup',e=>{if(e.key==='Enter')doSend(inp.value)});
  p.querySelector('#lm-emb').onclick=e=>{e.stopPropagation();toggleEmoji(p,inp)};

  // Stop click propagation inside panel (prevent outside-click handler firing)
  p.addEventListener('mousedown',e=>e.stopPropagation());

  refreshOnline();
  renderChat();
  closeOnAway(wrap,closeChat);

  S.chatTimer=setInterval(()=>{
    refreshOnline();refreshBadge();
    if(chatTab==='pub'&&!dmTarget)renderChat();
  },8000);
}

function closeChat(){
  const p=document.getElementById('lm-chat');if(p)p.remove();
  if(S.chatTimer){clearInterval(S.chatTimer);S.chatTimer=null}
}

function toggleEmoji(panel,inp){
  const ex=document.getElementById('lm-emp');if(ex){ex.remove();return}
  const pk=document.createElement('div');pk.id='lm-emp';pk.className='lm-emp';
  EMOJIS.forEach(em=>{const s=document.createElement('span');s.textContent=em;s.addEventListener('mousedown',e=>{e.stopPropagation();inp.value+=em;inp.focus();pk.remove()});pk.appendChild(s)});
  panel.querySelector('#lm-ia').appendChild(pk);
}

function refreshOnline(){
  api('Chat/Online').then(r=>{const el=document.getElementById('lm-on');if(el)el.innerHTML=`<span class="lm-chon-dot"></span> ${r.Count} online`}).catch(()=>{});
}

function refreshBadge(){
  api('Chat/DM/Conversations').then(cs=>{
    const n=(cs||[]).reduce((a,c)=>a+(c.UnreadCount||c.unreadCount||0),0);
    const b=document.getElementById('lm-badge');
    if(b){b.textContent=n;b.classList.toggle('on',n>0);}
  }).catch(()=>{});
}

function renderChat(){
  const msgs=document.getElementById('lm-msgs');
  const ia=document.getElementById('lm-ia');
  if(!msgs)return;
  // Remove code popup if switching tabs
  const cp=document.getElementById('lm-cp');if(cp)cp.remove();
  const cb=document.getElementById('lm-cbtn');if(cb)cb.remove();
  const dib=document.getElementById('lm-dib');if(dib)dib.remove();
  const bk=document.getElementById('lm-bk');if(bk)bk.remove();

  if(chatTab==='pub'){
    if(ia)ia.style.display='flex';
    msgs.innerHTML='<div class="lm-empty">Loading…</div>';
    api('Chat/Messages').then(d=>drawBubbles(msgs,d)).catch(()=>{msgs.innerHTML='<div class="lm-empty">Error loading messages.</div>'});

  }else if(chatTab==='dm'&&!dmTarget){
    if(ia)ia.style.display='none';
    renderDMList(msgs);

  }else if(chatTab==='dm'&&dmTarget){
    if(ia)ia.style.display='flex';
    // Back button
    const panel=document.getElementById('lm-chat');
    const bk=document.createElement('div');bk.id='lm-bk';bk.className='lm-back';bk.innerHTML='← Back';
    bk.addEventListener('mousedown',e=>e.stopPropagation());
    bk.onclick=()=>{dmTarget=null;renderChat()};
    if(panel)panel.querySelector('.lm-msgs').before(bk);
    msgs.innerHTML='<div class="lm-empty">Loading…</div>';
    api(`Chat/DM/${dmTarget.id}/Messages`).then(d=>drawBubbles(msgs,d)).catch(()=>{msgs.innerHTML='<div class="lm-empty">Error loading messages.</div>'});
  }
}

function renderDMList(container){
  const panel=document.getElementById('lm-chat');if(!panel)return;

  // "Chat code" button
  const cb=document.createElement('button');cb.id='lm-cbtn';cb.className='lm-code-btn';
  cb.innerHTML=`<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M20 3H4v10c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4v-3h2c1.11 0 2-.89 2-2V5c0-1.11-.89-2-2-2zm0 5h-2V5h2v3zM4 19h16v2H4z"/></svg> My Chat Code`;
  cb.addEventListener('mousedown',e=>e.stopPropagation());
  cb.onclick=e=>{e.stopPropagation();toggleCodePopup(panel)};
  container.before(cb);

  // DM search input
  const dib=document.createElement('div');dib.id='lm-dib';dib.className='lm-dminp';
  dib.innerHTML=`<input id="lm-dci" placeholder="Enter 6-char code…" maxlength="6" autocomplete="off"/><small>Type someone's code &amp; press Enter to start a DM</small>`;
  dib.addEventListener('mousedown',e=>e.stopPropagation());
  container.before(dib);

  const ci=dib.querySelector('#lm-dci');
  ci.onkeyup=e=>{
    if(e.key!=='Enter')return;
    const code=ci.value.trim().toUpperCase();
    if(code.length!==6){ci.style.borderColor='#c62828';return}
    ci.disabled=true;
    api(`Chat/DM/Users/ByCode/${code}`).then(u=>{ci.value='';ci.disabled=false;dmTarget={id:u.Id,name:u.Name};renderChat()})
    .catch(err=>{ci.style.borderColor='#c62828';ci.disabled=false;ci.placeholder=err.message.includes('404')?'Code not found':'Error';setTimeout(()=>{ci.placeholder='Enter 6-char code…';ci.style.borderColor=''},3000)});
  };

  container.innerHTML='<div class="lm-empty" style="padding-top:6px">Loading conversations…</div>';
  api('Chat/DM/Conversations').then(cs=>{
    if(!cs||!cs.length){container.innerHTML='<div class="lm-empty" style="padding-top:6px">No conversations yet.</div>';return}
    container.innerHTML=cs.map(c=>`<div class="lm-dmrow" data-id="${c.UserId||c.userId}" data-n="${esc(c.UserName||c.userName||'User')}">${esc(c.UserName||c.userName||'User')}${(c.UnreadCount||c.unreadCount||0)>0?`<span class="lm-dmbdg">${c.UnreadCount||c.unreadCount}</span>`:''}</div>`).join('');
    container.querySelectorAll('.lm-dmrow').forEach(r=>r.addEventListener('click',()=>{dmTarget={id:r.dataset.id,name:r.dataset.n};renderChat()}));
  }).catch(()=>{container.innerHTML='<div class="lm-empty">Could not load conversations.</div>'});
}

function toggleCodePopup(panel){
  const ex=document.getElementById('lm-cp');if(ex){ex.remove();return}
  const cp=document.createElement('div');cp.id='lm-cp';cp.className='lm-code-pop';
  const code=S.myCode||'…';
  cp.innerHTML=`<h4>🔑 Your Chat Code</h4><small>Share this code with others so they can DM you directly. Each code is unique to your account.</small><div class="lm-code-val">${code}</div><button class="lm-copy-btn">Copy Code</button>`;
  cp.addEventListener('mousedown',e=>e.stopPropagation());
  cp.querySelector('.lm-copy-btn').onclick=()=>{
    navigator.clipboard?.writeText(code);
    cp.querySelector('.lm-copy-btn').textContent='Copied! ✓';
    setTimeout(()=>{if(cp.isConnected)cp.querySelector('.lm-copy-btn').textContent='Copy Code'},1800);
  };
  panel.querySelector('#lm-ia').before(cp);
}

function drawBubbles(container,msgs){
  if(!Array.isArray(msgs)||!msgs.length){container.innerHTML='<div class="lm-empty">No messages yet.</div>';return}
  container.innerHTML='';
  msgs.forEach(m=>{
    const isMe=String(m.SenderId||m.senderId)===String(S.userId);
    const bc=m.IsBroadcast||m.isBroadcast;
    const cls=bc?'bc':isMe?'me':'they';
    const name=m.SenderName||m.senderName||(isMe?'You':'User');
    const text=m.Content||m.content||(m.Ciphertext?'🔒 Encrypted':'');
    const el=document.createElement('div');el.className=`lm-bbl ${cls}`;
    el.innerHTML=`<div class="lm-bbn">${esc(name)}</div>${esc(text)}`;
    container.appendChild(el);
  });
  container.scrollTop=container.scrollHeight;
}

async function doSend(txt){
  if(!txt||!txt.trim())return;
  const inp=document.getElementById('lm-inp');if(inp)inp.value='';
  try{
    if(chatTab==='pub')await api('Chat/Messages',{method:'POST',body:JSON.stringify({content:txt})});
    else if(dmTarget)await api(`Chat/DM/${dmTarget.id}/Messages`,{method:'POST',body:JSON.stringify({content:txt})});
    renderChat();
  }catch(e){if(inp)inp.value=txt;alert('Send failed: '+e.message)}
}

// ── Injection ─────────────────────────────────────────────────────────────────
let ij=false;
async function tryInject(){
  if(S.injected||ij)return;
  if(!window.ApiClient||!ApiClient.accessToken())return;
  const hr=document.querySelector('.headerRight,.headerButtons,[class*="headerRight"]');
  if(!hr)return;
  if(document.getElementById('lm-btn-latest')){S.injected=true;return}
  ij=true;
  try{
    S.serverUrl=((typeof ApiClient.serverAddress==='function'?ApiClient.serverAddress():null)||location.origin).replace(/\/$/,'');
    S.token=ApiClient.accessToken();
    const me=await api('Users/Me');
    S.userId=me.Id;S.isAdmin=me.Policy?.IsAdministrator||false;
    let cfg={};try{cfg=await api(`Plugins/${PLUGIN_ID}/Configuration`)}catch(e){}
    S.config=cfg;
    const frag=document.createDocumentFragment();
    if(cfg.EnableLatestMediaButton!==false)frag.appendChild(mkBtn('lm-btn-latest',ICONS.latest,openDD));
    if(S.isAdmin&&cfg.EnableMediaManagement!==false)frag.appendChild(mkBtn('lm-btn-manage',ICONS.manage,()=>openMgmt()));
    if(cfg.EnableChat!==false){
      const b=mkBtn('lm-btn-chat',ICONS.chat,(ev,w)=>openChat(w));
      const badge=document.createElement('span');badge.id='lm-badge';badge.className='lm-badge';b.appendChild(badge);
      frag.appendChild(b);
      api('Chat/MyCode').then(r=>{S.myCode=r.Code}).catch(()=>{});
      refreshBadge();
    }
    hr.insertBefore(frag,hr.firstChild);S.injected=true;
  }catch(e){console.debug('[LM] deferred:',e.message)}finally{ij=false}
}

const obs=new MutationObserver(()=>{if(!document.getElementById('lm-btn-latest'))S.injected=false;tryInject()});
obs.observe(document.body,{childList:true,subtree:true});
setInterval(()=>{if(!document.getElementById('lm-btn-latest'))S.injected=false;tryInject()},3000);
tryInject();
})();
