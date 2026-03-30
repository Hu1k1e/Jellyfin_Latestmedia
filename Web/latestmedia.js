(function(){
'use strict';
const G='var(--lm-accent)',GD='var(--lm-accent-dark)',PID='f94d6caf-2a62-4dd7-9f64-684ce8efff43';

const THEMES = {
  htv: { accent: '#00b35a', accentDark: '#008c45', panelBg: 'rgba(18,18,18,0.55)', blur: '16px', border: 'rgba(255,255,255,0.12)' },
  midnight: { accent: '#4fc3f7', accentDark: '#0288d1', panelBg: 'rgba(10,15,30,0.75)', blur: '20px', border: 'rgba(79,195,247,0.15)' },
  crimson: { accent: '#ef5350', accentDark: '#c62828', panelBg: 'rgba(25,10,10,0.72)', blur: '18px', border: 'rgba(239,83,80,0.15)' },
  purple: { accent: '#ab47bc', accentDark: '#7b1fa2', panelBg: 'rgba(20,10,28,0.70)', blur: '18px', border: 'rgba(171,71,188,0.15)' },
  slate: { accent: '#90a4ae', accentDark: '#546e7a', panelBg: 'rgba(30,30,35,0.80)', blur: '12px', border: 'rgba(144,164,174,0.18)' }
};

// Extensive emoji list
const EMOJIS='😀😁😂🤣😃😄😅😆😇😈😉😊😋😌😍🥰😎😏😐😑😒😓😔😕😖😗😘😙😚😛😜🤪😝😞😟😠😡🤬😢😤😥😦😧😨😩🤯😪😫🥱😬😭😮😱😲😳🥺😴😵🤐🥴🤢🤮🤧🤒🤕🤑🤠🤓🧐😺😸😹😻😼😽🙀😿😾👍👎👌✌️🤞🤟🤘👋🖐️✋🖖👏🙌🤲🤜🤛💪🙏🤝❤️🧡💛💚💙💜🖤🤍🤎💔❣️💕💞💓💗💖💘💝💯✅❌❓❗💬💭🎉🎊🎈🎁🔥💧⭐🌟💫✨☄️🎬🎮🍿🎤🎧🏆🥇🎯♟️🎲🐶🐱🐭🐹🐰🦊🐻🐼🐨🐯🦁🐮🐷🐸🐙🦋🐙🐬🐳🦈🦁🌍🌎🌏🌈☀️🌙⭐🌊🏔️🏝️🌋🏕️🌅🍎🍊🍋🍇🍓🍒🍑🥭🍔🍟🌮🌯🍕🍜🍝🍣🍱🍛🍺🥂🍷☕🧃🔔🔑🔒💰💳🧾'.split(/(?<=\p{Emoji_Presentation}|\p{Extended_Pictographic})/u).filter(e=>e.trim());

const ICO={
  latest:`<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>`,
  manage:`<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.06-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.06,0.94l-2.03,1.58c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.43-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.49-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/></svg>`,
  chat:`<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z"/></svg>`,
  announce:`<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M18 11v2h4v-2h-4zm-2 6.61c.96.71 2.21 1.65 3.2 2.39.4-.53.8-1.07 1.2-1.6-.99-.74-2.24-1.68-3.2-2.4-.4.54-.8 1.08-1.2 1.61zM20.4 5.6c-.4-.53-.8-1.07-1.2-1.6-.99.74-2.24 1.68-3.2 2.4.4.53.8 1.07 1.2 1.6.96-.72 2.21-1.65 3.2-2.4zM4 9c-1.1 0-2 .9-2 2v2c0 1.1.9 2 2 2h1l5 5V4L5 9H4zm11.5 3c0-1.33-.58-2.53-1.5-3.35v6.69c.92-.81 1.5-2.01 1.5-3.34z"/></svg>`
};

const S={url:'',tok:'',uid:'',dev:'',code:'',admin:false,cfg:{},ok:false,timer:null};

function fmtCd(iso){
  if(!iso)return'';
  const rem=(new Date(iso)-new Date())/1000;
  if(rem<=0)return'0d';
  const d=Math.floor(rem/86400);
  if(d>0)return d+'d';
  const h=Math.floor(rem/3600),m=Math.floor((rem%3600)/60);
  return h+'h '+m+'m';
}

setInterval(()=>{
  document.querySelectorAll('.lmCdT').forEach(e=>{
    if(e.dataset.iso){
      const t=fmtCd(e.dataset.iso);
      if(e.textContent!==t&&(e.textContent!==t+' left')) e.textContent=e.dataset.pfx?e.dataset.pfx+t:t;
    }
  });
},60000);
// Close panels automatically on SPA navigation
window.addEventListener('hashchange', () => {
  if(typeof closeDD === 'function') closeDD(document.getElementById('lm-btn-latest'));
  if(typeof closeChat === 'function') closeChat();
  if(typeof closeAnnouncements === 'function') closeAnnouncements();
});

document.addEventListener('click', () => {
  document.querySelectorAll('.lmMsgMenu').forEach(x => x.style.display='none');
});

/* ── Styles ── */
const st = document.createElement('style');
st.innerHTML=`
/* IMPORTANT: wrapper must NOT use opacity for hover — that cascades to children */
.lmW{display:inline-flex;align-items:center;justify-content:center;position:relative;
  width:40px;height:40px;cursor:pointer;color:inherit;flex-shrink:0}
.lmW>svg{transition:color .2s, opacity .2s}.lmW:hover>svg{color:${G};opacity:1}

/* Badge */
.lmBdg{position:absolute;top:2px;right:2px;background:${G};border-radius:50%;
  width:8px;height:8px;display:none;pointer-events:none;box-shadow:0 0 4px #000}
.lmBdg.on{display:block}

.lmPanel{
  background:var(--lm-panel-bg)!important;
  backdrop-filter:blur(var(--lm-blur)) saturate(130%)!important;
  -webkit-backdrop-filter:blur(var(--lm-blur)) saturate(130%)!important;
  border:1px solid var(--lm-border)!important;
  border-radius:12px;
  box-shadow:0 16px 55px rgba(0,0,0,0.62)!important;
  color:inherit;
}

/* Player OSD chat button */
.lmPlayerChatBtn{display:inline-flex;align-items:center;justify-content:center;position:relative;
  width:36px;height:36px;cursor:pointer;color:#fff;opacity:.75;transition:color .2s, opacity .2s}
.lmPlayerChatBtn:hover{opacity:1;color:${G}}
.lmPlayerChatBtn svg{width:20px;height:20px}
.lmChat.lmChatPlayer{position:fixed;bottom:80px;right:20px;z-index:999999}

/* Dropdown */
.lmDD{position:fixed;width:330px;max-height:70vh;
  overflow-y:auto;z-index:999999;display:none;
  scrollbar-width:thin;scrollbar-color:rgba(255,255,255,0.12) transparent}
.lmDD.on{display:block}
.lmDD::-webkit-scrollbar{width:4px}
.lmDD::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.18);border-radius:2px}

/* Tabs */
.lmTabs{display:flex;border-bottom:1px solid rgba(255,255,255,0.1);
  position:sticky;top:0;z-index:10;
  background:rgba(18,18,18,0.45)!important;
  backdrop-filter:blur(45px) saturate(160%)!important;
  -webkit-backdrop-filter:blur(45px) saturate(160%)!important}
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
.lmTbl th{padding:9px 12px;text-align:left;background:rgba(15,15,15,0.96);backdrop-filter:blur(8px);font-weight:600;position:sticky;top:0;z-index:2;box-shadow:0 1px 0 rgba(255,255,255,0.05)}
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

/* Series hierarchy */
.lmSRow{cursor:pointer;user-select:none}
.lmSRow:hover td{background:rgba(255,255,255,.035)}
.lmSRow td:first-child{font-weight:600}
.lmSnRow td{padding-left:28px!important}
.lmSnRow:hover td{background:rgba(255,255,255,.03)}
.lmEpRow td{padding-left:52px!important;opacity:.85}
.lmEpRow:hover td{background:rgba(255,255,255,.025)}
.lmArr{display:inline-block;transition:transform .2s;margin-right:5px;font-size:.7em}
.lmArr.open{transform:rotate(90deg)}
.lmMTabs{display:flex;border-bottom:1px solid rgba(255,255,255,.07);flex-shrink:0;
  background:rgba(255,255,255,.02)}
.lmMTab{flex:1;padding:9px 6px;text-align:center;cursor:pointer;
  font-size:.8em;font-weight:600;color:rgba(255,255,255,.4);
  border-bottom:2px solid transparent;transition:all .2s}
.lmMTab:hover{color:rgba(255,255,255,.75)}
.lmMTab.on{color:${G};border-bottom-color:${G}}
.lmMMSrch{padding:12px 16px 8px}

/* Confirm dialog */
.lmCf{position:fixed;inset:0;z-index:100005;display:flex;align-items:center;justify-content:center;
  background:rgba(0,0,0,.65);backdrop-filter:blur(5px)}
.lmCfb{border:1px solid rgba(255,255,255,.12);border-radius:10px;
  padding:22px 26px;max-width:350px;width:90%;text-align:center}
.lmCfb p{margin:0 0 16px;font-size:.9em;line-height:1.5}
.lmCfa{display:flex;gap:10px;justify-content:center}

/* Message Options */
.lmMsgOpt{position:relative;flex-shrink:0;margin-bottom:3px}
.lmDotsBtn{background:none;border:none;color:inherit;opacity:.4;cursor:pointer;padding:0 3px;font-size:1.1em}
.lmDotsBtn:hover{opacity:.9}
.lmMsgMenu{position:absolute;bottom:100%;left:0;background:rgba(20,20,20,.95);backdrop-filter:blur(20px);
  border:1px solid rgba(255,255,255,.15);border-radius:6px;overflow:hidden;
  display:none;font-size:.8em;min-width:80px;z-index:9;box-shadow:0 1px 12px rgba(0,0,0,.5)}
.lmMsgMenu div{padding:6px 12px;cursor:pointer;transition:background .15s}
.lmMsgMenu div:hover{background:rgba(255,255,255,.08)}

/* Chat panel */
.lmChat{position:fixed;width:330px;height:460px;
  display:flex;flex-direction:column;z-index:999999;overflow:hidden;
  transform-origin:top right;animation:lmPop .2s cubic-bezier(.34,1.56,.64,1)}
@keyframes lmPop{from{opacity:0;transform:scale(.87)}to{opacity:1;transform:scale(1)}}
.lmCHdr{display:flex;align-items:center;padding:5px 12px 4px;gap:6px;
  border-bottom:1px solid rgba(255,255,255,.07);flex-shrink:0;
  background:rgba(255,255,255,0.02)}
.lmCTit{font-size:.84em;font-weight:700;white-space:nowrap}
.lmOnl{font-size:.71em;color:${G};font-weight:600;display:flex;align-items:center;gap:4px;flex:1;white-space:nowrap}
.lmOnlDot{width:6px;height:6px;border-radius:50%;background:${G};flex-shrink:0}
.lmCCl{cursor:pointer;background:none;border:none;color:inherit;font-size:1.1rem;opacity:.55;flex-shrink:0;line-height:1;padding:0}
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
  background:rgba(10,10,10,.85);backdrop-filter:blur(22px);
  border:1px solid rgba(255,255,255,.12);border-radius:10px 10px 0 0;
  padding:8px;display:flex;flex-wrap:wrap;gap:2px;
  max-height:160px;overflow-y:auto;z-index:9;scrollbar-width:thin}
.lmEmpick span{cursor:pointer;font-size:1.25em;border-radius:4px;padding:2px;
  transition:background .1s;line-height:1.3}
.lmEmpick span:hover{background:rgba(255,255,255,.12)}
.lmDMTop{display:flex;align-items:center;padding:12px 10px;border-bottom:1px solid rgba(255,255,255,.07);gap:8px;flex-shrink:0}
.lmDMInp{flex:1}
.lmDMInp input{width:100%;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12);border-radius:18px;color:inherit;padding:6px 10px;font-size:.73em;outline:none;font-family:inherit;box-sizing:border-box}
.lmDMInp input:focus{border-color:${G}}
.lmDMRow{display:flex;align-items:center;gap:9px;padding:9px 12px;cursor:pointer;
  font-size:.84em;border-bottom:1px solid rgba(255,255,255,.04);transition:background .15s}
.lmDMRow:hover{background:rgba(255,255,255,.06)}
.lmDMBdg{margin-left:auto;background:${G};color:#fff;font-size:.68em;font-weight:700;border-radius:10px;padding:1px 6px}
.lmBack{display:flex;align-items:center;gap:5px;padding:7px 11px;font-size:.78em;
  cursor:pointer;border-bottom:1px solid rgba(255,255,255,.06);color:${G};flex-shrink:0}
.lmBack:hover{opacity:.8}
.lmCodeBtn{margin:0;background:#fff;border:1px solid rgba(255,255,255,.85);border-radius:18px;padding:6px 12px;font-size:.83em;cursor:pointer;font-family:inherit;color:#111;white-space:nowrap;transition:opacity .15s}
.lmCodeBtn:hover{opacity:.85}
.lmChatsHdr{padding:8px 12px 4px;font-size:.7em;text-transform:uppercase;font-weight:700;color:rgba(255,255,255,.45);letter-spacing:.05em}
.lmCodePop{position:fixed;top:80px;z-index:99999;width:210px;
  background:rgba(8,8,8,.85);backdrop-filter:blur(22px);
  border:1px solid rgba(255,255,255,.14);border-radius:12px;
  padding:12px 14px 10px;box-shadow:0 10px 36px rgba(0,0,0,.65)}
/* Player Toast Notifications (v1.0.79) */
.lmNStack{position:fixed;top:80px;right:20px;z-index:999999;display:flex;flex-direction:column;gap:10px;pointer-events:none;width:320px}
.lmNBubbleWrap{pointer-events:auto;position:relative;opacity:0;transform:translateY(14px);transition:opacity .35s ease,transform .35s ease}
.lmNBubbleWrap.lmNIn{opacity:1;transform:none}
.lmNBubbleWrap.lmNOut{opacity:0;transform:translateY(8px)}
.lmNCloseCircle{position:absolute;top:-7px;right:-7px;width:20px;height:20px;border-radius:50%;background:rgba(35,35,35,.92);border:1px solid rgba(255,255,255,.2);color:rgba(255,255,255,.8);font-size:.8em;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center;z-index:2;backdrop-filter:blur(8px);transition:background .15s}
.lmNCloseCircle:hover{background:rgba(80,80,80,.95);color:#fff}
.lmNBubbleInner{display:flex;align-items:flex-start;gap:9px}
.lmNAvatar{width:34px;height:34px;border-radius:50%;background:rgba(0,179,90,.15);border:1.5px solid rgba(0,179,90,.4);display:flex;align-items:center;justify-content:center;font-size:.68em;font-weight:700;color:${G};flex-shrink:0;text-transform:uppercase;letter-spacing:.5px;backdrop-filter:blur(6px);margin-top:2px}
.lmNBubble{position:relative;flex:1;background:rgba(18,18,18,0.55);backdrop-filter:blur(16px) saturate(130%);-webkit-backdrop-filter:blur(16px) saturate(130%);border:1px solid rgba(255,255,255,0.12);border-radius:4px 12px 12px 12px;padding:10px 13px;color:rgba(255,255,255,.9);box-shadow:0 6px 20px rgba(0,0,0,.4);font-size:.85em;line-height:1.45;word-break:break-word}
.lmNBubble::before{content:'';position:absolute;left:-7px;top:10px;border:6px solid transparent;border-right-color:rgba(255,255,255,.12);border-left-width:0}
.lmNBubble::after{content:'';position:absolute;left:-6px;top:10px;border:6px solid transparent;border-right-color:rgba(18,18,18,.55);border-left-width:0}
.lmNName{display:block;font-weight:700;color:${G};margin-bottom:2px;font-size:.9em}
.lmNSharedReply{pointer-events:auto;display:flex;gap:8px;align-items:center;margin-top:2px;padding-left:43px;opacity:0;transform:translateY(10px);transition:opacity .3s ease,transform .3s ease}
.lmNSharedReply.lmNIn{opacity:1;transform:none}
.lmNInp{flex:1;background:rgba(18,18,18,0.55);backdrop-filter:blur(16px) saturate(130%);-webkit-backdrop-filter:blur(16px) saturate(130%);border:1px solid rgba(255,255,255,.12);border-radius:18px;color:rgba(255,255,255,.9);padding:7px 13px;font-size:.8em;outline:none;font-family:inherit;box-shadow:0 4px 12px rgba(0,0,0,.4)}
.lmNInp:focus{border-color:${G}}
.lmNSnd{background:${G};color:#fff;border:none;border-radius:50%;width:30px;height:30px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.lmNSnd:hover{background:${GD}}
.lmMuteBtn{background:none;border:none;color:inherit;font-size:1.1rem;opacity:.55;flex-shrink:0;line-height:1;padding:0;cursor:pointer}
.lmMuteBtn:hover{opacity:1}
/* ── Server Announcements ── */
.lmAnnDD{position:fixed;z-index:99999;width:380px;max-height:520px;display:flex;flex-direction:column}
.lmAnnHdr{display:flex;align-items:center;justify-content:space-between;padding:12px 14px 8px;border-bottom:1px solid rgba(255,255,255,.08)}
.lmAnnHdrTitle{font-weight:700;font-size:.95em;color:#fff}
.lmAnnAddBtn{background:none;border:1px solid rgba(255,255,255,.18);border-radius:50%;width:26px;height:26px;color:rgba(255,255,255,.75);font-size:1.1em;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .15s;flex-shrink:0}
.lmAnnAddBtn:hover{color:#fff;border-color:rgba(255,255,255,.4);background:rgba(255,255,255,.08)}
.lmAnnBody{flex:1;overflow-y:auto;padding:6px 8px}
.lmAnnCard{display:flex;justify-content:space-between;align-items:center;padding:10px 12px;border-radius:8px;cursor:pointer;transition:background .15s;border-bottom:1px solid rgba(255,255,255,.05);gap:8px}
.lmAnnCard:last-child{border-bottom:none}
.lmAnnCard:hover{background:rgba(255,255,255,.06)}
.lmAnnCardMain{flex:1;min-width:0}
.lmAnnCardTitle{font-weight:600;font-size:.85em;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.lmAnnCardDate{font-size:.68em;color:rgba(255,255,255,.35);margin-top:2px}
.lmAnnCardVer{font-size:.72em;color:rgba(0,179,90,.75);font-weight:700;letter-spacing:.04em;flex-shrink:0}
.lmAnnDetail{position:fixed;z-index:100000;width:560px;max-width:92vw;max-height:680px;display:flex;flex-direction:column;top:50%;left:50%;transform:translate(-50%,-50%)}
.lmAnnDetailHdr{display:flex;justify-content:space-between;align-items:flex-start;padding:14px 16px 10px;border-bottom:1px solid rgba(255,255,255,.08)}
.lmAnnDetailHdrText{flex:1;min-width:0}
.lmAnnDetailTitle{font-weight:700;font-size:1em;color:#fff;word-break:break-word}
.lmAnnDetailMeta{font-size:.72em;color:rgba(255,255,255,.4);margin-top:3px}
.lmAnnDetailBody{flex:1;overflow-y:auto;padding:16px;font-size:.85em;line-height:1.65;color:rgba(255,255,255,.85);overflow-wrap:break-word;word-break:break-word}
.lmAnnDetailBody h1,.lmAnnDetailBody h2,.lmAnnDetailBody h3{color:#fff;margin:14px 0 6px;font-size:1em}
.lmAnnDetailBody h1{font-size:1.15em}.lmAnnDetailBody h2{font-size:1.05em}
.lmAnnDetailBody code{background:rgba(255,255,255,.08);padding:2px 6px;border-radius:4px;font-size:.9em;font-family:monospace}
.lmAnnDetailBody pre{background:rgba(0,0,0,.35);padding:12px;border-radius:8px;overflow-x:auto;font-size:.82em;margin:8px 0}
.lmAnnDetailBody pre code{background:none;padding:0}
.lmAnnDetailBody ul,.lmAnnDetailBody ol{padding-left:20px;margin:6px 0}
.lmAnnDetailBody li{margin:3px 0}
.lmAnnDetailBody blockquote{border-left:3px solid rgba(0,179,90,.5);padding-left:12px;opacity:.8;margin:8px 0;font-style:italic}
.lmAnnDetailBody a{color:${G};text-decoration:none}.lmAnnDetailBody a:hover{text-decoration:underline}
.lmAnnDetailBody hr{border:none;border-top:1px solid rgba(255,255,255,.1);margin:12px 0}
.lmAnnDetailBody strong{color:#fff}
.lmAnnCreateOv{position:fixed;top:0;left:0;right:0;bottom:0;z-index:100001;background:rgba(0,0,0,.65);display:flex;align-items:center;justify-content:center}
.lmAnnCreate{width:500px;max-height:85vh;display:flex;flex-direction:column}
.lmAnnCreate .lmAnnCreateHdr{display:flex;justify-content:space-between;align-items:center;padding:14px 16px 10px;border-bottom:1px solid rgba(255,255,255,.08)}
.lmAnnCreate .lmAnnCreateBody{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:14px}
.lmAnnCreate .lmFieldLabel{font-size:.76em;color:rgba(255,255,255,.5);margin-bottom:4px;display:block;letter-spacing:.03em}
.lmAnnCreate .lmAnnInp,.lmAnnCreate .lmAnnTxt{width:100%;box-sizing:border-box;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:8px;color:#fff;padding:9px 12px;font-size:.85em;font-family:inherit;outline:none;transition:border-color .15s}
.lmAnnCreate .lmAnnInp:focus,.lmAnnCreate .lmAnnTxt:focus{border-color:${G}}
.lmAnnCreate .lmAnnTxt{min-height:200px;resize:vertical;line-height:1.55}
.lmAnnCreate .lmAnnCreateFoot{padding:12px 16px;border-top:1px solid rgba(255,255,255,.08);display:flex;justify-content:flex-end;gap:8px}
.lmAnnCreate .lmAnnCreateFoot button{padding:8px 18px;border-radius:8px;font-size:.82em;cursor:pointer;border:none;font-weight:600;transition:background .15s}
.lmAnnPubBtn{background:${G};color:#fff}
.lmAnnPubBtn:hover{background:${GD}}
.lmAnnCanBtn{background:rgba(255,255,255,.08);color:rgba(255,255,255,.7)}
.lmAnnCanBtn:hover{background:rgba(255,255,255,.13)}
.lmAnnBdg{position:absolute;top:-2px;right:-2px;background:#e53935;color:#fff;border-radius:50%;width:15px;height:15px;font-size:.56em;font-weight:700;display:none;align-items:center;justify-content:center;padding:0;pointer-events:none;box-shadow:0 0 4px rgba(0,0,0,.6);line-height:1}
.lmAnnBdg.on{display:flex}
`;
document.head.appendChild(st);

/* ── Helpers ── */
function esc(s){return typeof s==='string'?s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;'):String(s||'')}

function api(ep,opts={}){
  const base=S.url||location.origin;
  const t=`MediaBrowser Client="Jellyfin Web", Device="Plugin", DeviceId="${S.dev||'LMPl1'}", Version="1.0.0", Token="${S.tok}"`;
  const headers = { 'Authorization': t, 'X-Emby-Authorization': t, ...(opts.headers||{}) };
  if (opts.body) headers['Content-Type'] = 'application/json';
  
  return fetch(`${base}/${ep}`,{...opts, headers})
    .then(r=>{if(!r.ok)throw new Error(r.status+'');return r.text().then(t=>t?JSON.parse(t):{})});
}

function modCfm(msg){
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
function outsideClose(excludes, cb){
  setTimeout(()=>{
    function h(e){
      if(!e.composedPath)return;
      const path=e.composedPath();
      if(e.target && e.target.closest && e.target.closest('.lmCodePop,.lmCf,.lmEmpick,.lmAnnDetail,.lmAnnCreateOv')) return;
      if(!excludes.some(el=>path.includes(el))) cb();
    }
    excludes.forEach(el=>{if(el)el._outsideHandler=h});
    document.addEventListener('mousedown', h);
  }, 10);
}
function removeOverlay(excludes){
  excludes.forEach(el=>{
    if(el&&el._outsideHandler){
      document.removeEventListener('mousedown', el._outsideHandler);
      el._outsideHandler=null;
    }
  });
}

/* ── Latest Media Dropdown ── */
let ddOpen=false;
function openDD(e,wrap){
  if(ddOpen){closeDD(wrap);return}
  const rect=wrap.getBoundingClientRect();
  const dd=document.createElement('div');dd.className='lmPanel lmDD on';dd.id='lmDD';
  dd.style.top=(rect.bottom+6)+'px';
  dd.style.right=(window.innerWidth-rect.right)+'px';
  dd.addEventListener('click', ev => ev.stopPropagation());
  dd.innerHTML=`<div class="lmTabs"><div class="lmTab on" data-t="r">Recently Added</div><div class="lmTab" data-t="l">Leaving Soon</div></div><div id="lmDDb"><div class="lmEmpty">Loading…</div></div>`;
  document.body.appendChild(dd);ddOpen=true;
  dd.querySelectorAll('.lmTab').forEach(t=>t.addEventListener('click',ev=>{ev.stopPropagation();dd.querySelectorAll('.lmTab').forEach(x=>x.classList.remove('on'));t.classList.add('on');loadTab(t.dataset.t)}));
  loadTab('r');
  outsideClose([wrap, dd], ()=>closeDD(wrap));
}
function closeDD(wrap){
  const d=document.getElementById('lmDD');
  if(d){ removeOverlay([wrap, d]); d.remove(); }
  ddOpen=false;
}

function tyC(t){return t==='Movie'?'mv':t==='Series'||t==='Episode'?'sr':t==='Anime'?'an':'ot'}

function loadTab(t){
  const b=document.getElementById('lmDDb');if(!b)return;b.innerHTML='<div class="lmEmpty">Loading…</div>';
  api(t==='r'?'LatestMedia/Items':'LatestMedia/LeavingSoon')
    .then(its=>{
      const activeTab = document.querySelector('#lmDD .lmTab.on');
      if (activeTab && activeTab.dataset.t !== t) return;
      if(!its||!its.length){b.innerHTML=`<div class="lmEmpty">${t==='r'?'Nothing recently added.':'Nothing leaving soon.'}</div>`;return}
      if(t==='r')renderR(b,its);else renderL(b,its);
    }).catch(ex=>{
      const activeTab = document.querySelector('#lmDD .lmTab.on');
      if (activeTab && activeTab.dataset.t !== t) return;
      b.innerHTML=`<div class="lmEmpty">Error: ${esc(ex.message)}</div>`
    });
}

function renderR(b,items){
  b.innerHTML=items.map(i=>{
    const y=i.ProductionYear?` (${i.ProductionYear})`:'';
    const d=i.DateAdded?Math.floor((Date.now()-new Date(i.DateAdded))/86400000):null;
    const age=d===null?'':d===0?'Today':`${d}d ago`;
    const mainTitle = esc(i.SeriesName || i.Title || i.Name || '?');
    const ctx = i.SeriesName ? `<div style="font-size:.75em;opacity:.7;margin-top:1px">${i.SeasonName ? esc(i.SeasonName) + ' \u2022 ' : ''}${esc(i.Title || i.Name)}</div>` : '';
    const genres = (i.Genres && i.Genres.length) ? `<div style="font-size:.68em;opacity:.5;margin-top:2px">${esc(i.Genres.slice(0,3).join(' \u2022 '))}</div>` : '';
    return`<a class="lmCard" href="#!/details?id=${i.Id}"><img class="lmPoster" loading="lazy" src="${S.url}/Items/${i.Id}/Images/Primary?fillWidth=90&quality=75" onerror="this.style.visibility='hidden'"/><div class="lmMeta"><div class="lmTitle">${mainTitle}${y}</div>${ctx}${genres}<div class="lmSub" style="margin-top:4px"><span class="lmBdge ${tyC(i.Type)}">${i.Type||'?'}</span>${age?`<span>${age}</span>`:''}</div></div></a>`;
  }).join('');
  b.querySelectorAll('.lmCard').forEach(a=>a.addEventListener('click',()=>{const w=document.getElementById('lm-btn-latest');closeDD(w)}));
}
function renderL(b,items){
  b.innerHTML=items.map(i=>{
    const mainTitle = esc(i.SeriesName || i.Title || i.Name || '?');
    const ctx = i.SeriesName ? `<div style="font-size:.75em;opacity:.7;margin-top:1px">${i.SeasonName ? esc(i.SeasonName) + ' \u2022 ' : ''}${esc(i.Title || i.Name)}</div>` : '';
    const genres = (i.Genres && i.Genres.length) ? `<div style="font-size:.68em;opacity:.5;margin-top:2px">${esc(i.Genres.slice(0,3).join(' \u2022 '))}</div>` : '';
    return`<a class="lmCard" href="#!/details?id=${i.Id}"><img class="lmPoster" loading="lazy" src="${S.url}/Items/${i.Id}/Images/Primary?fillWidth=90&quality=75" onerror="this.style.visibility='hidden'"/><div class="lmMeta"><div class="lmTitle">${mainTitle}</div>${ctx}${genres}<div class="lmSub" style="margin-top:4px"><span class="lmBdge ${tyC(i.Type)}">${i.Type||'?'}</span><span class="lmLd">\u23f3 <span class="lmCdT" data-iso="${i.ScheduledDate}" data-pfx="">${fmtCd(i.ScheduledDate)}</span> left</span></div></div></a>`;
  }).join('');
  b.querySelectorAll('.lmCard').forEach(a=>a.addEventListener('click',()=>{const w=document.getElementById('lm-btn-latest');closeDD(w)}));
}

/* ── Media Management ── */
let mmTab='movies';
function openMgmt(){
  const ov=document.createElement('div');ov.className='lmOv';
  ov.innerHTML=`<div class="lmPanel lmMod"><div class="lmMHdr"><h2>Media Management</h2><button class="lmMCl">&times;</button></div><div class="lmMTabs"><div class="lmMTab on" data-mt="movies">Movies</div><div class="lmMTab" data-mt="series">Series</div><div class="lmMTab" data-mt="scheduled">Scheduled</div></div><div class="lmMMSrch"><input id="lmMMSearch" class="lmInp" placeholder="Search…" autocomplete="off" style="width:100%;box-sizing:border-box;margin:0"/></div><div class="lmMBdy" id="lmMM"><div class="lmEmpty" style="padding:28px">Loading…</div></div></div>`;
  document.body.appendChild(ov);
  ov.querySelector('.lmMCl').onclick=()=>ov.remove();
  ov.addEventListener('click',e=>{if(e.target===ov)ov.remove()});
  ov.querySelectorAll('.lmMTab').forEach(t=>t.addEventListener('click',()=>{
    ov.querySelectorAll('.lmMTab').forEach(x=>x.classList.remove('on'));t.classList.add('on');
    mmTab=t.dataset.mt;loadMM(ov);
  }));
  mmTab='movies';loadMM(ov);
}

const SCHED_SEL=`<select class="lmSel lmSD"><option value="">Schedule…</option><option value="1">1 Day</option><option value="3">3 Days</option><option value="7">1 Week</option><option value="14">2 Weeks</option><option value="30">1 Month</option></select>`;

function bindActions(b,ov){
  b.querySelectorAll('.lmSD').forEach(s=>{
    s.onchange=async()=>{
      if(!s.value)return;
      const id=s.dataset.id,t=s.dataset.t||'this item';
      const ok=await modCfm(`Schedule <b>${esc(t)}</b> for deletion in <b>${s.value} day(s)</b>?`);
      if(!ok){s.value='';return}
      try{
        await api(`MediaMgmt/Items/${id}/ScheduleDelete?days=${s.value}`,{method:'POST'});
        const tr = s.closest('tr');
        if (tr) {
          tr.children[tr.children.length - 2].textContent = `Deleting in ${s.value}d`;
          tr.children[tr.children.length - 1].innerHTML = `<button class="lmBtn dn lmCD" data-id="${id}" data-t="${esc(t)}">Cancel</button>`;
          bindActions(tr, ov);
        } else { loadMM(ov); }
      }
      catch(ex){alert('Error: '+ex.message);s.value=''}
    };
  });
  b.querySelectorAll('.lmCD').forEach(btn=>{
    btn.onclick=async()=>{
      if(!await modCfm('Cancel scheduled deletion?'))return;
      try{
        await api(`MediaMgmt/Items/${btn.dataset.id}/CancelDelete`,{method:'DELETE'});
        if (mmTab === 'scheduled') { loadMM(ov); }
        else {
          const tr = btn.closest('tr');
          if (tr) {
            const t = btn.dataset.t || 'this item';
            tr.children[tr.children.length - 2].textContent = 'Active';
            tr.children[tr.children.length - 1].innerHTML = `<select class="lmSel lmSD" data-id="${btn.dataset.id}" data-t="${esc(t)}"><option value="">Schedule…</option><option value="1">1 Day</option><option value="3">3 Days</option><option value="7">1 Week</option><option value="14">2 Weeks</option><option value="30">1 Month</option></select>`;
            bindActions(tr, ov);
          } else { loadMM(ov); }
        }
      }
      catch(ex){alert('Error: '+ex.message)}
    };
  });
}

function actionCell(id,title,status){
  const sched=status&&status!=='Active';
  return sched?`<button class="lmBtn dn lmCD" data-id="${id}" data-t="${esc(title)}">Cancel</button>`
    :`<select class="lmSel lmSD" data-id="${id}" data-t="${esc(title)}"><option value="">Schedule…</option><option value="1">1 Day</option><option value="3">3 Days</option><option value="7">1 Week</option><option value="14">2 Weeks</option><option value="30">1 Month</option></select>`;
}

function loadMM(ov){
  const b=document.getElementById('lmMM');if(!b)return;
  b.innerHTML='<div class="lmEmpty" style="padding:28px">Loading…</div>';
  const si=document.getElementById('lmMMSearch');if(si)si.value='';

  if(mmTab==='movies'){
    api('MediaMgmt/Items').then(items=>{
      if(!items||!items.length){b.innerHTML='<div class="lmEmpty" style="padding:28px">No movies found.</div>';return}
      function renderMovies(filtered){
        let h=`<table class="lmTbl"><thead><tr><th>Title</th><th>Year</th><th>MB</th><th>Status</th><th>Action</th></tr></thead><tbody>`;
        if(!filtered.length){h+='<tr><td colspan="5" style="text-align:center;opacity:.5;padding:18px">No matches.</td></tr>'}
        filtered.forEach(i=>{
          const mb=i.Size?(i.Size/1048576).toFixed(1):'\u2014';
          h+=`<tr><td>${esc(i.Title||'\u2014')}</td><td>${i.Year||'\u2014'}</td><td>${mb}</td><td>${esc(i.Status||'Active')}</td><td>${actionCell(i.Id,i.Title,i.Status)}</td></tr>`;
        });
        b.innerHTML=h+'</tbody></table>';
        bindActions(b,ov);
      }
      renderMovies(items);
      if(si) si.oninput=()=>{
        const q=si.value.trim().toLowerCase();
        renderMovies(q?items.filter(i=>(i.Title||'').toLowerCase().includes(q)):items);
      };
    }).catch(ex=>{b.innerHTML=`<div class="lmEmpty" style="padding:28px">Error: ${esc(ex.message)}</div>`});
  } else if (mmTab === 'series') {
    api('MediaMgmt/Series').then(series=>{
      if(!series||!series.length){b.innerHTML='<div class="lmEmpty" style="padding:28px">No series found.</div>';return}
      function renderSeries(filtered){
        let h=`<table class="lmTbl"><thead><tr><th>Title</th><th>Episodes</th><th>Status</th><th>Action</th></tr></thead><tbody>`;
        if(!filtered.length){h+='<tr><td colspan="4" style="text-align:center;opacity:.5;padding:18px">No matches.</td></tr>'}
        filtered.forEach(sr=>{
          const rid='s_'+sr.Id;
          const rStatus = sr.Status==='Scheduled' ? `<span class="lmCdT" data-pfx="Deleting in " data-iso="${sr.ScheduledTime}">Deleting in ${fmtCd(sr.ScheduledTime)}</span>` : 'Active';
          h+=`<tr class="lmSRow" data-rid="${rid}"><td><span class="lmArr" data-rid="${rid}">\u25b6</span>${esc(sr.Title)} ${sr.Year?'('+sr.Year+')':''}</td><td>${sr.SeasonCount||0} Seasons \u2022 ${totalEps} Eps</td><td>${rStatus}</td><td>${actionCell(sr.Id,sr.Title+' (Entire Series)',sr.Status)}</td></tr>`;
          (sr.Seasons||[]).forEach(sn=>{
            const snrid='sn_'+sn.Id;
            const snStatus = sn.Status==='Scheduled' ? `<span class="lmCdT" data-pfx="Deleting in " data-iso="${sn.ScheduledTime}">Deleting in ${fmtCd(sn.ScheduledTime)}</span>` : 'Active';
            h+=`<tr class="lmSnRow" data-parent="${rid}" data-rid="${snrid}" style="display:none"><td><span class="lmArr" data-rid="${snrid}">\u25b6</span>${esc(sn.Title)}</td><td>${sn.EpisodeCount||0} Episodes</td><td>${snStatus}</td><td>${actionCell(sn.Id,sr.Title+' \u2022 '+sn.Title,sn.Status)}</td></tr>`;
            (sn.Episodes||[]).forEach(ep=>{
              const mb=ep.Size?(ep.Size/1048576).toFixed(1):'\u2014';
              const epStatus = ep.Status==='Scheduled' ? `<span class="lmCdT" data-pfx="Deleting in " data-iso="${ep.ScheduledTime}">Deleting in ${fmtCd(ep.ScheduledTime)}</span>` : 'Active';
              h+=`<tr class="lmEpRow" data-parent="${snrid}" style="display:none"><td>E${ep.Episode??'?'}: ${esc(ep.Title)}</td><td>${mb} MB</td><td>${epStatus}</td><td>${actionCell(ep.Id,sr.Title+' \u2022 '+sn.Title+' \u2022 E'+ep.Episode,ep.Status)}</td></tr>`;
            });
          });
        });
        b.innerHTML=h+'</tbody></table>';
        // Toggle expand/collapse
        b.querySelectorAll('.lmSRow,.lmSnRow').forEach(row=>{
          row.addEventListener('click',ev=>{
            if(ev.target.closest('.lmSel,.lmBtn,.lmCD'))return;
            const rid=row.dataset.rid;
            const arr=row.querySelector('.lmArr');
            const open=arr.classList.toggle('open');
            b.querySelectorAll(`[data-parent="${rid}"]`).forEach(r=>{
              r.style.display=open?'':'none';
              if(!open){
                // collapse nested children too
                const nArr=r.querySelector('.lmArr');
                if(nArr){nArr.classList.remove('open');}
                const nrid=r.dataset.rid;
                if(nrid)b.querySelectorAll(`[data-parent="${nrid}"]`).forEach(nr=>nr.style.display='none');
              }
            });
          });
        });
        bindActions(b,ov);
      }
      renderSeries(series);
      if(si) si.oninput=()=>{
        const q=si.value.trim().toLowerCase();
        renderSeries(q?series.filter(s=>(s.Title||'').toLowerCase().includes(q)):series);
      };
    }).catch(ex=>{b.innerHTML=`<div class="lmEmpty" style="padding:28px">Error: ${esc(ex.message)}</div>`});
  } else if (mmTab === 'scheduled') {
    api('MediaMgmt/Scheduled').then(items => {
      if(!items||!items.length){b.innerHTML='<div class="lmEmpty" style="padding:28px">No scheduled deletions found.</div>';return}
      function renderScheduled(filtered){
        let h=`<table class="lmTbl"><thead><tr><th>Title</th><th>Type</th><th>Scheduled By</th><th>Status</th><th>Action</th></tr></thead><tbody>`;
        if(!filtered.length){h+='<tr><td colspan="5" style="text-align:center;opacity:.5;padding:18px">No matches.</td></tr>'}
        filtered.forEach(i=>{
          h+=`<tr><td>${esc(i.Title||'\u2014')}</td><td>${esc(i.Type||'\u2014')}</td><td>${esc(i.ScheduledByName||'Unknown')}</td><td><span class="lmCdT" data-pfx="Deleting in " data-iso="${i.ScheduledTime}">Deleting in ${fmtCd(i.ScheduledTime)}</span></td><td><button class="lmBtn dn lmCD" data-id="${i.Id}" data-t="${esc(i.Title||'this item')}">Cancel</button></td></tr>`;
        });
        b.innerHTML=h+'</tbody></table>';
        bindActions(b,ov);
      }
      renderScheduled(items);
      if(si) si.oninput=()=>{
        const q=si.value.trim().toLowerCase();
        renderScheduled(q?items.filter(i=>(i.Title||'').toLowerCase().includes(q)):items);
      };
    }).catch(ex=>{b.innerHTML=`<div class="lmEmpty" style="padding:28px">Error: ${esc(ex.message)}</div>`});
  }
}

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

/* Notification state — declared here so mute handler can reference them */
window._lmVideoActive = false;
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
  Promise.all([
    api('Chat/DM/Conversations').catch(()=>[]),
    api(`Chat/Messages?since=${encodeURIComponent(getPubRead())}`).catch(()=>[])
  ]).then(([cs, pub]) => {
    const dmUnread = (cs||[]).reduce((a,c)=>a+(c.UnreadCount||c.unreadCount||0),0);
    const pubUnread = (pub||[]).length;
    const hasUnread = !fsMuted && (dmUnread > 0 || pubUnread > 0);
    const b=document.getElementById('lmChatBdg');
    if(b){ b.textContent=''; b.classList.toggle('on', hasUnread); }
    const pb=document.getElementById('lmPlayerChatBdg');
    if(pb){ pb.textContent=''; pb.classList.toggle('on', hasUnread); }
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

  _lmPollInterval = setInterval(() => {
    if (fsMuted) return;
    if (document.getElementById('lmChat')) return;
    // Poll DM conversations for new unread messages
    api('Chat/DM/Conversations').then(convs => {
      if (!Array.isArray(convs)) return;
      const unreadConvs = convs.filter(c => (c.UnreadCount || c.unreadCount || 0) > 0);
      unreadConvs.forEach(conv => {
        const uid = conv.UserId || conv.userId;
        if (!uid) return;
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
  }, 3000);
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

function getPubRead() { return localStorage.getItem('lm_last_pub_read') || new Date(0).toISOString(); }
function setPubRead() { localStorage.setItem('lm_last_pub_read', new Date().toISOString()); }

async function drawBubbles(container,msgs,silent=false){
  if(!Array.isArray(msgs)||!msgs.length){
    if(lastMsgHash==='empty')return;
    lastMsgHash='empty';
    container.innerHTML='<div class="lmEmpty">No messages yet.</div>';
    if(chatTab==='pub'&&!dmTarget){setPubRead();refreshBadge();}
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
  if(chatTab==='pub'&&!dmTarget){setPubRead();refreshBadge();}
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

/* ── Server Announcements ── */

function renderMarkdown(raw) {
  if (!raw) return '';
  // Escape HTML first, then selectively allow markdown patterns
  let t = raw
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  // Fenced code blocks
  t = t.replace(/```([\w]*)\n([\s\S]*?)```/g, (_,lang,code) => `<pre><code>${code}</code></pre>`);
  t = t.replace(/```([\s\S]*?)```/g, (_,code) => `<pre><code>${code}</code></pre>`);
  // Inline code
  t = t.replace(/`([^`\n]+)`/g, '<code>$1</code>');
  // Horizontal rule
  t = t.replace(/^---$/gm, '<hr>');
  // Headers
  t = t.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  t = t.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  t = t.replace(/^# (.+)$/gm, '<h1>$1</h1>');
  // Bold + italic
  t = t.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  t = t.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  t = t.replace(/\*(.+?)\*/g, '<em>$1</em>');
  // Blockquote
  t = t.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>');
  // Unordered list items
  t = t.replace(/^[-*] (.+)$/gm, '<li>$1</li>');
  // Ordered list items
  t = t.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
  // Wrap consecutive <li> in <ul> (simple approach)
  t = t.replace(/(<li>[\s\S]*?<\/li>)(\n<li>)/g, '$1$2');
  t = t.replace(/(<li>[\s\S]*?<\/li>)/g, m => '<ul>' + m + '</ul>');
  t = t.replace(/<\/ul>\s*<ul>/g, '');
  // Links
  t = t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, txt, url) => {
    const tgt = url.startsWith('http') || url.startsWith('//') ? ' target="_blank" rel="noopener"' : '';
    return `<a href="${url}"${tgt}>${txt}</a>`;
  });
  // Line breaks (preserve block element newlines)
  t = t.replace(/\n(?!<(h[1-3]|ul|blockquote|pre|hr))/g, '<br>');
  t = t.replace(/<br>(<\/(h[1-3]|ul|blockquote|pre)>)/g, '$1');
  return t;
}

function refreshAnnounceBadge() {
  if (!S.ok || S.cfg?.EnableAnnouncements === false) return;
  api(`Announcement?_t=${Date.now()}`).then(list => {
    if (!Array.isArray(list)) return;
    const lastRead = localStorage.getItem(`lm_ann_last_read_str_${S.uid}`) || '';
    const unread = list.filter(a => (a.CreatedAt || '') > lastRead).length;
    const bdg = document.getElementById('lmAnnBdg');
    if (!bdg) return;
    if (unread > 0) {
      bdg.textContent = unread > 9 ? '9+' : String(unread);
      bdg.classList.add('on');
    } else {
      bdg.classList.remove('on');
    }
  }).catch(() => {});
}

function openAnnouncements(wrap) {
  if (document.getElementById('lmAnnDD')) { closeAnnouncements(); return; }

  const dd = document.createElement('div');
  dd.id = 'lmAnnDD';
  dd.className = 'lmPanel lmAnnDD';

  if (wrap) {
    const rect = wrap.getBoundingClientRect();
    dd.style.top = (rect.bottom + 6) + 'px';
    dd.style.right = (window.innerWidth - rect.right) + 'px';
  }

  // Header
  const hdr = document.createElement('div');
  hdr.className = 'lmAnnHdr';

  const titleSpan = document.createElement('span');
  titleSpan.className = 'lmAnnHdrTitle';
  titleSpan.textContent = S.cfg.AnnouncementHeading || 'H-TV Announcements';
  hdr.appendChild(titleSpan);

  const hdrRight = document.createElement('div');
  hdrRight.style.cssText = 'display:flex;align-items:center;gap:6px';

  if (S.admin) {
    const addBtn = document.createElement('button');
    addBtn.className = 'lmAnnAddBtn';
    addBtn.title = 'New Announcement';
    addBtn.innerHTML = '+';
    addBtn.onclick = (e) => { e.stopPropagation(); openAnnCreate(); };
    hdrRight.appendChild(addBtn);
  }

  const cl = document.createElement('button');
  cl.className = 'lmCCl';
  cl.innerHTML = '&times;';
  cl.onclick = () => closeAnnouncements();
  hdrRight.appendChild(cl);
  hdr.appendChild(hdrRight);
  dd.appendChild(hdr);

  // Scrollable body
  const body = document.createElement('div');
  body.className = 'lmAnnBody';
  body.id = 'lmAnnBody';
  body.innerHTML = '<div class="lmEmpty" style="padding:20px">Loading…</div>';
  dd.appendChild(body);

  dd.addEventListener('click', e => e.stopPropagation());
  document.body.appendChild(dd);
  outsideClose([wrap, dd], closeAnnouncements);

  loadAnnouncementList(body);
}

function closeAnnouncements() {
  const dd = document.getElementById('lmAnnDD');
  if (dd) { removeOverlay([null, dd]); dd.remove(); }
  const det = document.getElementById('lmAnnDetail');
  if (det) det.remove();
}

function loadAnnouncementList(body) {
  const reqs = [api(`Announcement?_t=${Date.now()}`)];
  if(S.admin) reqs.push(api(`ScheduledTask?_t=${Date.now()}`).catch(()=>[]));

  Promise.all(reqs).then(res => {
    let list = res[0] || [];
    let scheds = res[1] || [];
    if (!Array.isArray(list)) list = [];
    if (!Array.isArray(scheds)) scheds = [];

    const nowMs = Date.now();
    scheds = scheds.filter(s => new Date(s.ExecutionUtc).getTime() > nowMs);

    const allItems = [...list.map(a=>({...a, _ty:'A'})), ...scheds.map(s=>({...s, _ty:'S'}))];

    if (!allItems.length) {
      body.innerHTML = '<div class="lmEmpty" style="padding:20px 14px">No announcements yet.</div>';
      return;
    }

    // Sort by CreatedAt descending for announcements, EventDate descending for scheds
    allItems.sort((a,b) => {
      const d1 = new Date(a._ty==='A' ? a.CreatedAt : a.ExecutionUtc).getTime();
      const d2 = new Date(b._ty==='A' ? b.CreatedAt : b.ExecutionUtc).getTime();
      return d2 - d1;
    });

    const maxStr = list.reduce((max, a) => (a.CreatedAt || '') > max ? (a.CreatedAt || '') : max, '');
    localStorage.setItem(`lm_ann_last_read_str_${S.uid}`, maxStr);
    refreshAnnounceBadge();

    body.innerHTML = '';
    allItems.forEach(item => {
      const card = document.createElement('div');
      card.className = 'lmAnnCard';
      
      const main = document.createElement('div');
      main.className = 'lmAnnCardMain';

      if (item._ty === 'A') {
        const a = item;
        const d = new Date(a.CreatedAt);
        const dateStr = d.toLocaleDateString(undefined, { month:'short', day:'numeric', year:'numeric' });
        main.innerHTML = `<div class="lmAnnCardTitle">${esc(a.Title)}</div><div class="lmAnnCardDate">${esc(dateStr)}</div>`;
        card.appendChild(main);
        if (a.Version) {
          const ver = document.createElement('span');
          ver.className = 'lmAnnCardVer';
          ver.textContent = esc(a.Version);
          card.appendChild(ver);
        }
        card.onclick = () => openAnnDetail(a);
      } else {
        const s = item;
        const d = new Date(s.ExecutionUtc);
        const dateStr = d.toLocaleDateString(undefined, { month:'short', day:'numeric', year:'numeric' }) + ' ' + d.toLocaleTimeString(undefined, {hour: '2-digit', minute:'2-digit'});
        
        main.innerHTML = `<div class="lmAnnCardTitle">${esc(s.Title)}</div>
                          <div class="lmAnnCardDate">
                            ${esc(dateStr)} — <span style="opacity:0.7">${String(s.Recurrence).toUpperCase()}</span>
                          </div>`;
        card.appendChild(main);
        
        const recurBadge = document.createElement('span');
        recurBadge.className = 'lmAnnCardVer lmCdT';
        recurBadge.dataset.pfx = 'in ';
        recurBadge.dataset.iso = s.ExecutionUtc;
        recurBadge.style.background = 'rgba(0,180,90,0.2)';
        recurBadge.style.color = 'var(--lm-accent)';
        recurBadge.textContent = 'in ' + fmtCd(s.ExecutionUtc);
        card.appendChild(recurBadge);

        card.onclick = () => {
          closeAnnouncements();
          openSchedCreate(s);
        };
      }
      body.appendChild(card);
    });
  }).catch(() => {
    body.innerHTML = '<div class="lmEmpty" style="padding:20px 14px">Error loading announcements.</div>';
  });
}

function openAnnDetail(ann) {
  let det = document.getElementById('lmAnnDetail');
  if (det) det.remove();

  det = document.createElement('div');
  det.id = 'lmAnnDetail';
  det.className = 'lmPanel lmAnnDetail';
  det.addEventListener('click', e => e.stopPropagation());

  const d = new Date(ann.CreatedAt);
  const dateStr = d.toLocaleDateString(undefined, { month:'long', day:'numeric', year:'numeric' });

  // Header
  const hdr = document.createElement('div');
  hdr.className = 'lmAnnDetailHdr';

  const hdrText = document.createElement('div');
  hdrText.className = 'lmAnnDetailHdrText';
  hdrText.innerHTML = `<div class="lmAnnDetailTitle">${esc(ann.Title)}</div><div class="lmAnnDetailMeta">${ann.Version ? esc(ann.Version) + ' · ' : ''}${esc(dateStr)} · ${esc(ann.AuthorName)}</div>`;
  hdr.appendChild(hdrText);

  const hdrBtns = document.createElement('div');
  hdrBtns.style.cssText = 'display:flex;align-items:center;gap:6px;flex-shrink:0;margin-left:8px';

  if (S.admin) {
    const editBtn = document.createElement('button');
    editBtn.className = 'lmAnnAddBtn';
    editBtn.title = 'Edit Announcement';
    editBtn.style.fontSize = '.9em';
    editBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>';
    editBtn.onclick = (e) => {
      e.stopPropagation();
      openAnnCreate(ann);
      det.remove();
    };
    hdrBtns.appendChild(editBtn);

    const delBtn = document.createElement('button');
    delBtn.className = 'lmAnnAddBtn';
    delBtn.title = 'Delete Announcement';
    delBtn.style.fontSize = '.9em';
    delBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>';
    delBtn.onclick = async (e) => {
      e.stopPropagation();
      if (!(await modCfm('Delete this announcement? This cannot be undone.'))) return;
      api(`Announcement/${ann.Id}`, { method: 'DELETE' })
        .then(() => {
          det.remove();
          const listBody = document.getElementById('lmAnnBody');
          if (listBody) loadAnnouncementList(listBody);
          refreshAnnounceBadge();
        })
        .catch(() => alert('Delete failed. Try again.'));
    };
    hdrBtns.appendChild(delBtn);
  }

  const clBtn = document.createElement('button');
  clBtn.className = 'lmCCl';
  clBtn.innerHTML = '&times;';
  clBtn.onclick = () => det.remove();
  hdrBtns.appendChild(clBtn);
  hdr.appendChild(hdrBtns);
  det.appendChild(hdr);

  // Body
  const body = document.createElement('div');
  body.className = 'lmAnnDetailBody';
  body.innerHTML = renderMarkdown(ann.Body);
  det.appendChild(body);

  document.body.appendChild(det);
}

function openSchedCreate(editObj = null) {
  if (document.getElementById('lmSchedCreateOv')) return;

  const ov = document.createElement('div');
  ov.id = 'lmSchedCreateOv';
  ov.className = 'lmAnnCreateOv';

  const panel = document.createElement('div');
  panel.className = 'lmPanel lmAnnCreate';

  const panelHdr = document.createElement('div');
  panelHdr.className = 'lmAnnCreateHdr';
  panelHdr.innerHTML = `<span style="font-weight:700;font-size:.95em">${editObj ? 'Edit Scheduled Task' : 'New Scheduled Task'}</span>`;
  const panelCl = document.createElement('button');
  panelCl.className = 'lmCCl';
  panelCl.innerHTML = '&times;';
  panelCl.onclick = () => ov.remove();
  panelHdr.appendChild(panelCl);
  panel.appendChild(panelHdr);

  const panelBody = document.createElement('div');
  panelBody.className = 'lmAnnCreateBody';
  panelBody.innerHTML = `
    <div>
      <label class="lmFieldLabel">Task Title *</label>
      <input type="text" id="lmSchTitle" class="lmAnnInp" placeholder="e.g. Server Formatting" maxlength="200" value="${esc(editObj?.Title || '')}" />
    </div>
    <div style="display:flex;gap:12px;margin-top:10px">
      <div style="flex:1">
        <label class="lmFieldLabel">Event Date *</label>
        <input type="date" id="lmSchDate" class="lmAnnInp" value="${editObj?.EventDate ? editObj.EventDate.split('T')[0] : ''}" />
      </div>
      <div style="flex:1">
        <label class="lmFieldLabel">Event Time *</label>
        <input type="time" id="lmSchTime" class="lmAnnInp" value="${editObj?.EventTime || '00:00'}" />
      </div>
      <div style="flex:1">
        <label class="lmFieldLabel">Time Zone *</label>
        <select id="lmSchTz" class="lmAnnInp" style="background:rgba(0,0,0,0.2);padding:8px">
          ${(Intl.supportedValuesOf ? Intl.supportedValuesOf('timeZone') : ['UTC']).map(tz => `<option value="${tz}">${tz}</option>`).join('')}
        </select>
      </div>
    </div>
    <div style="display:flex;gap:12px;margin-top:10px">
      <div style="flex:1">
        <label class="lmFieldLabel">Recurrence</label>
        <select id="lmSchRecur" class="lmAnnInp" style="background:rgba(0,0,0,0.2);padding:8px">
          <option value="none">None (One-time)</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="biweekly">Bi-weekly (Every 2 Wks)</option>
          <option value="monthly">Monthly</option>
          <option value="bimonthly">Every 2 Months</option>
          <option value="6months">Every 6 Months</option>
          <option value="yearly">Yearly</option>
          <option value="15th-30th">15th & 30th of Month</option>
        </select>
      </div>
      <div style="flex:1">
        <label class="lmFieldLabel">Post Announcement Days Before</label>
        <input type="number" id="lmSchDaysBox" class="lmAnnInp" min="1" max="90" value="${editObj?.PostDaysBefore || 7}" />
      </div>
    </div>
    <div style="margin-top:10px">
      <label class="lmFieldLabel">Description (Markdown supported)</label>
      <textarea id="lmSchDesc" class="lmAnnTxt" placeholder="Write the announcement body here...">${esc(editObj?.Description || '')}</textarea>
    </div>`;
  panel.appendChild(panelBody);

  const panelFoot = document.createElement('div');
  panelFoot.className = 'lmAnnCreateFoot';

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'lmAnnCanBtn';
  cancelBtn.style.marginRight = 'auto';
  cancelBtn.textContent = 'Cancel';
  cancelBtn.onclick = () => ov.remove();

  const publishBtn = document.createElement('button');
  publishBtn.className = 'lmAnnPubBtn';
  publishBtn.textContent = editObj ? 'Save Task' : 'Create Task';
  publishBtn.onclick = async () => {
    const title = document.getElementById('lmSchTitle').value.trim();
    const date = document.getElementById('lmSchDate').value;
    const time = document.getElementById('lmSchTime').value;
    const tz = document.getElementById('lmSchTz').value;
    const recur = document.getElementById('lmSchRecur').value;
    const days = parseInt(document.getElementById('lmSchDaysBox').value, 10) || 7;
    const desc = document.getElementById('lmSchDesc').value.trim();

    if (!title || !date || !time || !tz) { alert('All marked fields are required.'); return; }
    
    publishBtn.disabled = true;
    publishBtn.textContent = editObj ? 'Saving…' : 'Creating…';
    
    try {
      const endpoint = editObj ? `ScheduledTask/${editObj.Id}` : 'ScheduledTask';
      const method = editObj ? 'PUT' : 'POST';
      
      await api(endpoint, {
        method,
        body: JSON.stringify({ 
          Title: title, 
          Description: desc, 
          EventDate: date + 'T00:00:00Z',
          EventTime: time,
          TimeZone: tz,
          OriginalEventDate: editObj && editObj.OriginalEventDate ? editObj.OriginalEventDate : (date + 'T00:00:00Z'),
          Recurrence: recur,
          PostDaysBefore: days
        })
      });
      ov.remove();
      // Need to close header and reopen it to see changes
      closeAnnouncements();
      setTimeout(() => openAnnouncements(document.getElementById('lm-btn-latest')), 100);
    } catch (e) {
      console.error(e);
      publishBtn.disabled = false;
      publishBtn.textContent = editObj ? 'Save Task' : 'Create Task';
      alert('Failed to save scheduled task.');
    }
  };

  panelFoot.appendChild(cancelBtn);
  panelFoot.appendChild(publishBtn);
  panel.appendChild(panelFoot);

  ov.appendChild(panel);
  document.body.appendChild(ov);
  
  if(editObj) {
    document.getElementById('lmSchRecur').value = editObj.Recurrence || 'none';
    if(editObj.TimeZone) document.getElementById('lmSchTz').value = editObj.TimeZone;
  } else {
    try { document.getElementById('lmSchTz').value = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch(e) {}
  }
}

function openAnnCreate(editObj = null) {
  if (document.getElementById('lmAnnCreateOv')) return;

  const ov = document.createElement('div');
  ov.id = 'lmAnnCreateOv';
  ov.className = 'lmAnnCreateOv';

  const panel = document.createElement('div');
  panel.className = 'lmPanel lmAnnCreate';

  // Header
  const panelHdr = document.createElement('div');
  panelHdr.className = 'lmAnnCreateHdr';
  panelHdr.innerHTML = `<span style="font-weight:700;font-size:.95em">${editObj ? 'Edit Announcement' : 'New Announcement'}</span>`;
  const panelCl = document.createElement('button');
  panelCl.className = 'lmCCl';
  panelCl.innerHTML = '&times;';
  panelCl.onclick = () => ov.remove();
  panelHdr.appendChild(panelCl);
  panel.appendChild(panelHdr);

  // Form body
  const panelBody = document.createElement('div');
  panelBody.className = 'lmAnnCreateBody';
  panelBody.innerHTML = `
    <div>
      <label class="lmFieldLabel">Title *</label>
      <input type="text" id="lmAnnTitleInp" class="lmAnnInp" placeholder="e.g. Server Maintenance" maxlength="200" />
    </div>
    <div>
      <label class="lmFieldLabel">Version</label>
      <input type="text" id="lmAnnVerInp" class="lmAnnInp" placeholder="e.g. v2.1.0" maxlength="50" />
    </div>
    <div>
      <label class="lmFieldLabel">Body (Markdown supported — **bold**, *italic*, \`code\`, # Heading, - list, &gt; quote)</label>
      <textarea id="lmAnnBodyInp" class="lmAnnTxt" placeholder="Write your announcement here..."></textarea>
    </div>`;
  panel.appendChild(panelBody);

  // Footer
  const panelFoot = document.createElement('div');
  panelFoot.className = 'lmAnnCreateFoot';
  const addLinkBtn = document.createElement('button');
  addLinkBtn.className = 'lmAnnCanBtn';
  addLinkBtn.style.marginRight = '8px';
  addLinkBtn.textContent = 'Add Link';
  addLinkBtn.onclick = (e) => { e.preventDefault(); openAddLink(document.getElementById('lmAnnBodyInp')); };

  const addSchedBtn = document.createElement('button');
  addSchedBtn.className = 'lmAnnCanBtn';
  addSchedBtn.style.marginRight = 'auto'; // push to left
  addSchedBtn.textContent = 'Add Scheduled Task';
  addSchedBtn.onclick = (e) => { e.preventDefault(); ov.remove(); openSchedCreate(); };

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'lmAnnCanBtn';
  cancelBtn.textContent = 'Cancel';
  cancelBtn.onclick = () => ov.remove();
  const publishBtn = document.createElement('button');
  publishBtn.className = 'lmAnnPubBtn';
  publishBtn.textContent = editObj ? 'Save Changes' : 'Publish';
  publishBtn.onclick = async () => {
    const title = document.getElementById('lmAnnTitleInp').value.trim();
    const version = document.getElementById('lmAnnVerInp').value.trim();
    const bodyText = document.getElementById('lmAnnBodyInp').value.trim();
    if (!title) { alert('Title is required.'); return; }
    publishBtn.disabled = true;
    publishBtn.textContent = editObj ? 'Saving…' : 'Publishing…';
    try {
      const endpoint = editObj ? `Announcement/${editObj.Id}` : 'Announcement';
      const method = editObj ? 'PUT' : 'POST';
      await api(endpoint, {
        method,
        body: JSON.stringify({ Title: title, Version: version, Body: bodyText })
      });
      ov.remove();
      const listBody = document.getElementById('lmAnnBody');
      if (listBody) loadAnnouncementList(listBody);
    } catch (ex) {
      publishBtn.disabled = false;
      publishBtn.textContent = 'Publish';
      alert('Failed to publish: ' + ex.message);
    }
  };
  panelFoot.appendChild(addLinkBtn);
  panelFoot.appendChild(addSchedBtn);
  panelFoot.appendChild(cancelBtn);
  panelFoot.appendChild(publishBtn);
  panel.appendChild(panelFoot);

  ov.appendChild(panel);
  document.body.appendChild(ov);

  ov.addEventListener('click', e => { if (e.target === ov) ov.remove(); });
  panel.addEventListener('click', e => e.stopPropagation());

  if (editObj) {
    document.getElementById('lmAnnTitleInp').value = editObj.Title || '';
    if (editObj.Version) document.getElementById('lmAnnVerInp').value = editObj.Version;
    if (editObj.Body) document.getElementById('lmAnnBodyInp').value = editObj.Body;
  }

  document.getElementById('lmAnnTitleInp').focus();
}

function openAddLink(textarea) {
  if (document.getElementById('lmAddLinkOv')) return;
  const ov = document.createElement('div');
  ov.id = 'lmAddLinkOv';
  ov.className = 'lmAnnCreateOv';
  ov.style.zIndex = '100002'; // Above current popup

  const panel = document.createElement('div');
  panel.className = 'lmPanel lmAnnCreate';
  panel.style.width = '420px';

  panel.innerHTML = `
    <div class="lmAnnCreateHdr">
      <span style="font-weight:700;font-size:.95em">Add Link</span>
      <button class="lmCCl" id="lmAddLinkCl">&times;</button>
    </div>
    <div class="lmAnnCreateBody">
      <div>
        <label class="lmFieldLabel">Name of link (Text to display)</label>
        <input type="text" id="lmALName" class="lmAnnInp" placeholder="e.g. Server Rules" />
      </div>
      <div>
        <label class="lmFieldLabel">Hyperlink (URL)</label>
        <input type="url" id="lmALUrl" class="lmAnnInp" placeholder="e.g. https://google.com or #!/details?id=..." />
      </div>
      <div style="display:flex;align-items:center;gap:8px;margin-top:2px">
        <input type="checkbox" id="lmALBlank" style="width:14px;height:14px;cursor:pointer" checked />
        <label for="lmALBlank" style="cursor:pointer;font-size:.82em;color:rgba(255,255,255,.8);margin:0">Open in a new tab</label>
      </div>
    </div>
    <div class="lmAnnCreateFoot">
      <button class="lmAnnCanBtn" id="lmAddLinkCan">Cancel</button>
      <button class="lmAnnPubBtn" id="lmAddLinkIns">Add Link</button>
    </div>
  `;

  ov.appendChild(panel);
  document.body.appendChild(ov);

  ov.querySelector('#lmAddLinkCl').onclick = () => ov.remove();
  ov.querySelector('#lmAddLinkCan').onclick = () => ov.remove();
  ov.addEventListener('click', e => { if (e.target === ov) ov.remove(); });
  panel.addEventListener('click', e => e.stopPropagation());

  ov.querySelector('#lmAddLinkIns').onclick = () => {
    const name = document.getElementById('lmALName').value.trim();
    let url = document.getElementById('lmALUrl').value.trim();
    const isBlank = document.getElementById('lmALBlank').checked;
    
    if (!name || !url) { alert('Name and Hyperlink are required.'); return; }
    if (!url.startsWith('http') && !url.startsWith('/') && !url.startsWith('#')) {
      url = 'https://' + url;
    }

    const mdLink = isBlank ? `[${name}](${url} "blank")` : `[${name}](${url})`;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    textarea.value = text.substring(0, start) + mdLink + text.substring(end);
    textarea.focus();
    // Move cursor after the inserted link
    textarea.selectionStart = textarea.selectionEnd = start + mdLink.length;
    
    ov.remove();
  };
  
  document.getElementById('lmALName').focus();
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

    const tId = cfg.PluginTheme || 'htv';
    const th = THEMES[tId] || THEMES.htv;
    const root = document.documentElement.style;
    root.setProperty('--lm-accent', th.accent);
    root.setProperty('--lm-accent-dark', th.accentDark);
    root.setProperty('--lm-panel-bg', th.panelBg);
    root.setProperty('--lm-blur', th.blur);
    root.setProperty('--lm-border', th.border);

    let mobSt=document.getElementById('lm-mob-st');
    if(!mobSt){mobSt=document.createElement('style');mobSt.id='lm-mob-st';document.head.appendChild(mobSt);}
    mobSt.innerHTML=cfg.ShowOnMobile?'':'@media (max-width: 767px) { .lmW, .lmPlayerChatBtn { display: none !important; } }';

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
    if(cfg.EnableAnnouncements!==false){
      const ab=mkBtn('lm-btn-announce',ICO.announce,(ev,w)=>openAnnouncements(w));
      const abdg=document.createElement('span');abdg.id='lmAnnBdg';abdg.className='lmAnnBdg';ab.appendChild(abdg);
      f.appendChild(ab);
      refreshAnnounceBadge();
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
  btn.title='Chat';
  btn.innerHTML=ICO.chat + '<span id="lmPlayerChatBdg" class="lmBdg"></span>';
  btn.addEventListener('click',e=>{e.stopPropagation();openChat(btn,true)});
  osd.insertBefore(btn,osd.firstChild);

  // Polling is now managed by the video lifecycle observer
}

const obs=new MutationObserver(()=>{
  if(!document.getElementById('lm-btn-latest'))S.ok=false;
  tryInject();
  tryInjectPlayerChat();

  // Video lifecycle: inject/destroy toast container based on <video> presence
  const videoEl = document.querySelector('video');
  if (videoEl && !window._lmVideoActive) {
    window._lmVideoActive = true;
    injectToastContainer();
    startNotificationPolling();
  }
  if (!videoEl && window._lmVideoActive) {
    window._lmVideoActive = false;
    destroyToastContainer();
  }
});
obs.observe(document.body,{childList:true,subtree:true});
setInterval(()=>{
  const curUid = window.ApiClient ? window.ApiClient.getCurrentUserId() : null;
  if (curUid && S.uid && S.uid !== curUid) {
    S.tok = window.ApiClient.accessToken();
    S.uid = curUid;
    S.ok = false;
    CHAT_CACHE.pub = null;
    CHAT_CACHE.dms = {};
    CHAT_CACHE.convs = null;
    E2E.keys = null;
    if (typeof closeChat === 'function') closeChat();
  } else if (window.ApiClient && window.ApiClient.accessToken() && S.tok && S.tok !== window.ApiClient.accessToken()) {
    S.tok = window.ApiClient.accessToken();
  }

  if(!document.getElementById('lm-btn-latest'))S.ok=false;
  tryInject();
  tryInjectPlayerChat();
  // Also check video lifecycle on heartbeat (in case observer missed the event)
  const videoEl = document.querySelector('video');
  if (videoEl && !window._lmVideoActive) {
    window._lmVideoActive = true;
    injectToastContainer();
    startNotificationPolling();
  }
  if (!videoEl && window._lmVideoActive) {
    window._lmVideoActive = false;
    destroyToastContainer();
  }
},3000);
setInterval(()=>{
  if(S.ok && !document.getElementById('lmChat')) refreshBadge();
  if(S.ok) refreshAnnounceBadge();
}, 4000);
tryInject();
})();
