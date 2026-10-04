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

const ICO={
  latest:`<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>`,
  manage:`<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.06-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.06,0.94l-2.03,1.58c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.43-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.49-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/></svg>`,
  chat:`<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z"/></svg>`,
  announce:`<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M18 11v2h4v-2h-4zm-2 6.61c.96.71 2.21 1.65 3.2 2.39.4-.53.8-1.07 1.2-1.6-.99-.74-2.24-1.68-3.2-2.4-.4.54-.8 1.08-1.2 1.61zM20.4 5.6c-.4-.53-.8-1.07-1.2-1.6-.99.74-2.24 1.68-3.2 2.4.4.53.8 1.07 1.2 1.6.96-.72 2.21-1.65 3.2-2.4zM4 9c-1.1 0-2 .9-2 2v2c0 1.1.9 2 2 2h1l5 5V4L5 9H4zm11.5 3c0-1.33-.58-2.53-1.5-3.35v6.69c.92-.81 1.5-2.01 1.5-3.34z"/></svg>`
};

const S={url:'',tok:'',uid:'',dev:'',code:'',admin:false,cfg:{},ok:false,timer:null};   // reuse Chat/Read result for 5 minutes

function fmtCd(iso){
  if(!iso)return'';
  const rem=(new Date(iso)-new Date())/1000;
  if(rem<=0)return'0d';
  const d=Math.floor(rem/86400);
  if(d>0)return d+'d';
  const h=Math.floor(rem/3600),m=Math.floor((rem%3600)/60);
  return h+'h '+m+'m';
}

// Tasks that run about once a minute (driven by the single shared timer below; skipped while the tab is hidden)
const LM_SLOW=[];
LM_SLOW.push(()=>{
  document.querySelectorAll('.lmCdT').forEach(e=>{
    if(e.dataset.iso){
      const t=fmtCd(e.dataset.iso);
      const pfx=e.dataset.pfx||'';
      const sfx=e.dataset.sfx||'';
      const full=pfx+t+sfx;
      if(e.textContent!==full) e.textContent=full;
    }
  });
});
// Close panels automatically on SPA navigation
window.addEventListener('hashchange', () => {
  if(typeof closeDD === 'function') closeDD(document.getElementById('lm-btn-latest'));
  LMC.closeChat?.();
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
.lmAnnUnreadDot{display:inline-block;width:7px;height:7px;border-radius:50%;background:#e53935;flex-shrink:0;margin-right:7px;align-self:center;box-shadow:0 0 4px rgba(229,57,53,.6)}
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
    .then(async r=>{
      if(!r.ok){
        let msg = r.status+'';
        try{const t=await r.text();if(t){const j=JSON.parse(t);if(j.error)msg=j.error;}}catch(e){}
        throw new Error(msg);
      }
      return r.text().then(t=>t?JSON.parse(t):{});
    });
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
    const cdText = fmtCd(i.ScheduledDate);
    return`<a class="lmCard" href="#!/details?id=${i.Id}"><img class="lmPoster" loading="lazy" src="${S.url}/Items/${i.Id}/Images/Primary?fillWidth=90&quality=75" onerror="this.style.visibility='hidden'"/><div class="lmMeta"><div class="lmTitle">${mainTitle}</div>${ctx}${genres}<div class="lmSub" style="margin-top:4px;display:flex;align-items:center;justify-content:space-between"><span class="lmBdge ${tyC(i.Type)}">${i.Type||'?'}</span><span style="margin-left:auto;font-size:.75em;color:rgba(255,255,255,0.75);font-weight:500" class="lmCdT" data-iso="${i.ScheduledDate}" data-pfx="" data-sfx=" left">${cdText} left</span></div></div></a>`;
  }).join('');
  b.querySelectorAll('.lmCard').forEach(a=>a.addEventListener('click',()=>{const w=document.getElementById('lm-btn-latest');closeDD(w)}));
}

/* ── Media Management ── */
let mmTab='movies';
function openMgmt(){
  const ov=document.createElement('div');ov.className='lmOv';
  ov.innerHTML=`<div class="lmPanel lmMod"><div class="lmMHdr"><h2>Media Management</h2><button class="lmMCl">&times;</button></div><div id="lmArrBanner" style="display:none;background:rgba(229,57,53,.18);border:1px solid rgba(229,57,53,.5);border-radius:6px;padding:8px 12px;margin:8px 12px 0;font-size:.8em;color:#f28b82">⚠ Radarr/Sonarr not reachable — scheduling is disabled until connection is restored.</div><div class="lmMTabs"><div class="lmMTab on" data-mt="movies">Movies</div><div class="lmMTab" data-mt="series">Series</div><div class="lmMTab" data-mt="scheduled">Scheduled</div></div><div class="lmMMSrch"><input id="lmMMSearch" class="lmInp" placeholder="Search…" autocomplete="off" style="width:100%;box-sizing:border-box;margin:0"/></div><div class="lmMBdy" id="lmMM"><div class="lmEmpty" style="padding:28px">Loading…</div></div></div>`;
  document.body.appendChild(ov);
  ov.querySelector('.lmMCl').onclick=()=>ov.remove();
  ov.addEventListener('click',e=>{if(e.target===ov)ov.remove()});
  ov.querySelectorAll('.lmMTab').forEach(t=>t.addEventListener('click',()=>{
    ov.querySelectorAll('.lmMTab').forEach(x=>x.classList.remove('on'));t.classList.add('on');
    mmTab=t.dataset.mt;loadMM(ov);
  }));

  // Validate arr connectivity before allowing scheduling
  window._lmArrOk = false;
  Promise.all([
    api('Arr/TestRadarr', { method: 'POST' }).catch(() => ({ success: false })),
    api('Arr/TestSonarr', { method: 'POST' }).catch(() => ({ success: false }))
  ]).then(([radarr, sonarr]) => {
    window._lmArrOk = (radarr?.success === true) || (sonarr?.success === true);
    const banner = document.getElementById('lmArrBanner');
    if (banner) banner.style.display = window._lmArrOk ? 'none' : '';
    // Re-render current tab so dropdowns reflect the correct enabled state
    loadMM(ov);
  }).catch(() => {
    window._lmArrOk = false;
    const banner = document.getElementById('lmArrBanner');
    if (banner) banner.style.display = '';
  });

  mmTab='movies';loadMM(ov);
}

function bindActions(b,ov){
  b.querySelectorAll('.lmSD').forEach(s=>{
    s.onchange=async()=>{
      if(!s.value)return;
      const id=s.dataset.id,t=s.dataset.t||'this item';

      // ── Delete Now (immediate) ──
      if(s.value==='now'){
        const ok=await modCfm(`⚠ <b>Immediately delete</b> <b>${esc(t)}</b> from Radarr/Sonarr?<br><small style="opacity:.7">Files will be removed from disk. This cannot be undone.</small>`);
        if(!ok){s.value='';return}
        try{
          s.disabled=true;
          await api(`MediaMgmt/Items/${id}/DeleteNow`,{method:'POST'});
          const tr=s.closest('tr');
          if(tr){
            tr.children[tr.children.length-2].textContent='Deleted';
            tr.children[tr.children.length-1].innerHTML='<span style="opacity:.5;font-size:.8em">Done</span>';
          } else { loadMM(ov); }
        }catch(ex){alert('Delete failed: '+(ex.message||'arr unreachable'));s.value='';s.disabled=false;}
        return;
      }

      // ── Schedule for future ──
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
            tr.children[tr.children.length - 1].innerHTML = `<select class="lmSel lmSD" data-id="${btn.dataset.id}" data-t="${esc(t)}"><option value="">Schedule…</option><option value="now" style="color:#f28b82;font-weight:600">⚡ Delete Now</option><option value="1">1 Day</option><option value="3">3 Days</option><option value="7">1 Week</option><option value="14">2 Weeks</option><option value="30">1 Month</option></select>`;
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
  if(sched) return `<button class="lmBtn dn lmCD" data-id="${id}" data-t="${esc(title)}">Cancel</button>`;
  const disabled = window._lmArrOk === false ? ' disabled title="Radarr/Sonarr not reachable"' : '';
  return `<select class="lmSel lmSD" data-id="${id}" data-t="${esc(title)}"${disabled}><option value="">Schedule…</option><option value="now" style="color:#f28b82;font-weight:600">⚡ Delete Now</option><option value="1">1 Day</option><option value="3">3 Days</option><option value="7">1 Week</option><option value="14">2 Weeks</option><option value="30">1 Month</option></select>`;
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
          const totalEps = (sr.Seasons||[]).reduce((sum, sn) => sum + (sn.EpisodeCount||0), 0);
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

// Per-announcement read tracking (localStorage, by announcement ID).
// Separate from the server cursor — individual opens don't move the server date.
let _annReadIds = new Set(JSON.parse(localStorage.getItem('lm_ann_read') || '[]'));
function _annMarkRead(id) {
  if (!id || _annReadIds.has(id)) return;
  _annReadIds.add(id);
  // Trim to avoid unbounded growth
  if (_annReadIds.size > 500) {
    const arr = [..._annReadIds]; _annReadIds = new Set(arr.slice(-400));
  }
  localStorage.setItem('lm_ann_read', JSON.stringify([..._annReadIds]));
}

/* Notification state — declared here so mute handler can reference them */
window._lmVideoActive = false;

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
  if (document.hidden) return;
  Promise.all([
    api('Announcement'),          // no cache-buster — let HTTP caching work
    api('Announcement/Read')
  ]).then(([list, readRes]) => {
    if (!Array.isArray(list)) return;
    const lastRead = readRes && readRes.date ? readRes.date : '';
    // Only count non-scheduled items — scheduled ones are time-based events, not
    // unread content, and their CreatedAt is never included in the cursor advancement.
    const unread = list.filter(a => !a.IsScheduled && (a.CreatedAt || '') > lastRead).length;
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

  // ── Panel opened: clear the header badge by advancing the server cursor to
  // the newest announcement. In-panel dots are NOT affected (those use localStorage).
  api('Announcement').then(list => {
    if (!Array.isArray(list) || !list.length) return;
    const maxStr = list
      .filter(a => !a.IsScheduled)
      .reduce((m, a) => (a.CreatedAt || '') > m ? (a.CreatedAt || '') : m, '');
    if (!maxStr) return;
    api('Announcement/Read', { method: 'POST', body: JSON.stringify({ date: maxStr }) })
      .then(() => refreshAnnounceBadge())
      .catch(() => {});
  }).catch(() => {});
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

  // Header right side: Mark all read + optional admin + close
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
  // Fetch announcements and the current user's read cursor in parallel
  Promise.all([
    api(`Announcement?_t=${Date.now()}`),
    api('Announcement/Read')
  ]).then(([list, readRes]) => {
    if (!Array.isArray(list)) list = [];

    const lastRead = readRes && readRes.date ? readRes.date : '';
    const nowMs = Date.now();

    // Filter out expired IsScheduled announcements (event already passed)
    list = list.filter(a => {
      if (a.IsScheduled && a.EventDate) {
        return new Date(a.EventDate).getTime() > nowMs;
      }
      return true;
    });

    if (!list.length) {
      body.innerHTML = '<div class="lmEmpty" style="padding:20px 14px">No announcements yet.</div>';
      return;
    }

    // Sort: regular newest-first at top, scheduled soonest-first at bottom
    list.sort((a, b) => {
      if (!a.IsScheduled && !b.IsScheduled) return new Date(b.CreatedAt).getTime() - new Date(a.CreatedAt).getTime();
      if (a.IsScheduled && !b.IsScheduled) return 1;
      if (!a.IsScheduled && b.IsScheduled) return -1;
      return new Date(a.EventDate).getTime() - new Date(b.EventDate).getTime();
    });

    // NOTE: Do NOT advance cursor here. Cursor is moved when panel opens (header badge).
    // Individual dots use _annReadIds (localStorage) — not the server cursor.

    body.innerHTML = '';
    list.forEach(a => {
      const card = document.createElement('div');
      card.className = 'lmAnnCard';

      // Unread indicator dot: based on localStorage (per device, not affected by server cursor)
      const isUnread = !a.IsScheduled && !_annReadIds.has(a.Id);
      if (isUnread) {
        const dot = document.createElement('span');
        dot.className = 'lmAnnUnreadDot';
        dot.title = 'Unread';
        card.appendChild(dot);
        card.style.borderLeft = '2px solid #e53935';
      }

      const main = document.createElement('div');
      main.className = 'lmAnnCardMain';

      if (a.IsScheduled && a.EventDate) {
        const d = new Date(a.EventDate);
        const dateStr = d.toLocaleDateString(undefined, { month:'short', day:'numeric', year:'numeric' }) + ' ' + d.toLocaleTimeString(undefined, {hour: '2-digit', minute:'2-digit'});
        main.innerHTML = `<div class="lmAnnCardTitle">${esc(a.Title)}</div>
                          <div class="lmAnnCardDate">${esc(dateStr)}</div>`;
        card.appendChild(main);

        const cd = document.createElement('span');
        cd.className = 'lmCdT';
        cd.dataset.iso = a.EventDate;
        cd.dataset.pfx = 'in ';
        cd.style.cssText = 'font-size:.75em;color:rgba(255,255,255,0.75);font-weight:500;flex-shrink:0;margin-left:10px;';
        cd.textContent = 'in ' + fmtCd(a.EventDate);
        card.appendChild(cd);

        card.onclick = () => openAnnDetail(a, lastRead);
      } else {
        const d = new Date(a.CreatedAt);
        const dateStr = d.toLocaleDateString(undefined, { month:'short', day:'numeric', year:'numeric' });
        main.innerHTML = `<div class="lmAnnCardTitle">${esc(a.Title)}</div><div class="lmAnnCardDate">${esc(dateStr)}</div>`;
        card.appendChild(main);
        if (a.Version && a.Version !== 'SCHEDULED') {
          const ver = document.createElement('span');
          ver.className = 'lmAnnCardVer';
          ver.textContent = esc(a.Version);
          card.appendChild(ver);
        }
        card.onclick = () => openAnnDetail(a, lastRead);
      }

      body.appendChild(card);
    });
  }).catch(() => {
    body.innerHTML = '<div class="lmEmpty" style="padding:20px 14px">Error loading announcements.</div>';
  });
}

function openAnnDetail(ann, lastRead) {
  let det = document.getElementById('lmAnnDetail');
  if (det) det.remove();

  // Mark this specific announcement as read (localStorage, per-device).
  // This ONLY clears this announcement's in-panel dot — it does NOT touch the
  // server cursor (which is used only for the header badge).
  if (!ann.IsScheduled && ann.Id) {
    const wasUnread = !_annReadIds.has(ann.Id);
    _annMarkRead(ann.Id);
    if (wasUnread) {
      // Refresh the card list to remove this card's dot
      const lb = document.getElementById('lmAnnBody');
      if (lb) loadAnnouncementList(lb);
    }
  }

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
    editBtn.onclick = async (e) => {
      e.stopPropagation();
      det.remove();
      if (ann.ScheduledTaskId) {
        try {
          const tasks = await api('ScheduledTask');
          const t = tasks.find(t => t.Id === ann.ScheduledTaskId);
          if (t) openSchedCreate(t); else openAnnCreate(ann);
        } catch (err) { openAnnCreate(ann); }
      } else {
        openAnnCreate(ann);
      }
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

function openSchedCreate(editObj = null, forceMaintenance = false) {
  if (!S.admin) return; // safety guard — admin only
  const isMaintenance = forceMaintenance || (editObj && editObj.IsMaintenance);
  if (document.getElementById('lmSchedCreateOv')) return;

  const ov = document.createElement('div');
  ov.id = 'lmSchedCreateOv';
  ov.className = 'lmAnnCreateOv';

  const panel = document.createElement('div');
  panel.className = 'lmPanel lmAnnCreate';

  const panelHdr = document.createElement('div');
  panelHdr.className = 'lmAnnCreateHdr';
  panelHdr.innerHTML = `<span style="font-weight:700;font-size:.95em">${editObj ? 'Edit ' + (isMaintenance ? 'Maintenance' : 'Scheduled Task') : 'New ' + (isMaintenance ? 'Maintenance' : 'Scheduled Task')}</span>`;
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
    ${isMaintenance ? `
    <div style="display:flex;gap:12px;margin-top:10px">
      <div style="flex:1">
        <label class="lmFieldLabel">Maintenance Duration (Hours) *</label>
        <input type="number" id="lmMaintDur" class="lmAnnInp" min="1" max="72" value="${editObj?.MaintenanceDurationHours || 2}" />
      </div>
      <div style="flex:1">
        <label class="lmFieldLabel">Show Banner Hours Before *</label>
        <input type="number" id="lmMaintBan" class="lmAnnInp" min="1" max="168" value="${editObj?.BannerDisplayHoursBefore || 24}" />
      </div>
    </div>
    ` : ''}
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
    const maintDur = isMaintenance ? parseInt(document.getElementById('lmMaintDur').value, 10) || 2 : 2;
    const maintBan = isMaintenance ? parseInt(document.getElementById('lmMaintBan').value, 10) || 24 : 24;

    if (!title || !date || !time || !tz) { alert('All marked fields are required.'); return; }
    
    // Compute the correct UTC time using browser's Intl (handles all IANA timezones natively)
    // This bypasses all server-side Windows/IANA registry conversion which causes time offset bugs
    function tzLocalToUtcIso(dateStr, timeStr, tzId) {
      try {
        // Treat user's local time naively as UTC to get a reference ms value
        const refMs = new Date(`${dateStr}T${timeStr}:00Z`).getTime();
        const refDate = new Date(refMs);
        // Ask Intl what this UTC moment looks like in the target timezone
        const fmt = new Intl.DateTimeFormat('en-US', {
          timeZone: tzId, year:'numeric', month:'2-digit', day:'2-digit',
          hour:'2-digit', minute:'2-digit', hour12: false
        });
        const p = {};
        fmt.formatToParts(refDate).forEach(pt => { p[pt.type] = pt.value; });
        const h = parseInt(p.hour) === 24 ? 0 : parseInt(p.hour);
        // tzMs = what the target timezone shows, expressed as UTC ms (for offset math)
        const tzMs = Date.UTC(parseInt(p.year), parseInt(p.month)-1, parseInt(p.day), h, parseInt(p.minute));
        // offsetMs = how many ms ahead the target timezone is from UTC
        const offsetMs = tzMs - refMs;
        // True UTC = local_time - offset
        return new Date(refMs - offsetMs).toISOString();
      } catch(e) {
        return `${dateStr}T${timeStr}:00Z`;
      }
    }

    const eventUtcIso = tzLocalToUtcIso(date, time, tz);
    
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
          EventUtcIso: eventUtcIso,
          OriginalEventDate: editObj && editObj.OriginalEventDate ? editObj.OriginalEventDate : (date + 'T00:00:00Z'),
          Recurrence: recur,
          PostDaysBefore: days,
          IsMaintenance: isMaintenance,
          MaintenanceDurationHours: maintDur,
          BannerDisplayHoursBefore: maintBan
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

function openAllScheduledTasks() {
  if (document.getElementById('lmAllSchOv')) return;

  const ov = document.createElement('div');
  ov.id = 'lmAllSchOv';
  ov.className = 'lmAnnCreateOv';

  const panel = document.createElement('div');
  panel.className = 'lmPanel';
  panel.style.cssText = 'width:90%;max-width:500px;max-height:85vh;display:flex;flex-direction:column;pointer-events:auto;';

  const panelHdr = document.createElement('div');
  panelHdr.className = 'lmAnnCreateHdr';
  panelHdr.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:14px 18px;';
  const panelHdrTitle = document.createElement('span');
  panelHdrTitle.style.cssText = 'font-weight:700;font-size:1em;';
  panelHdrTitle.textContent = 'All Scheduled Tasks';
  const panelCl = document.createElement('button');
  panelCl.className = 'lmCCl';
  panelCl.innerHTML = '&times;';
  panelCl.onclick = () => ov.remove();
  panelHdr.appendChild(panelHdrTitle);
  panelHdr.appendChild(panelCl);
  panel.appendChild(panelHdr);

  const body = document.createElement('div');
  body.className = 'lmAnnBody';
  body.style.cssText = 'flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:10px;';
  body.innerHTML = '<div class="lmEmpty" style="padding:20px 14px">Loading...</div>';
  panel.appendChild(body);

  ov.appendChild(panel);
  document.body.appendChild(ov);

  // Helper: advance a past UTC ms to the next recurrence
  function nextRecur(utcMs, recurrence) {
    const rec = (recurrence||'').toLowerCase();
    if (rec === 'none') return utcMs;
    const DAY = 86400000;
    const steps = { daily:1, weekly:7, biweekly:14, monthly:30, bimonthly:60, '6months':182, yearly:365 };
    const days = steps[rec];
    if (!days) return utcMs;
    let next = utcMs;
    while (next <= Date.now()) next += days * DAY;
    return next;
  }

  api(`ScheduledTask?_t=${Date.now()}`).then(list => {
    body.innerHTML = '';
    if (!Array.isArray(list) || !list.length) {
      body.innerHTML = '<div class="lmEmpty" style="padding:20px 14px">No scheduled tasks found.</div>';
      return;
    }

    list.forEach(s => {
      const card = document.createElement('div');
      card.className = 'lmAnnCard';
      
      const main = document.createElement('div');
      main.className = 'lmAnnCardMain';
      
      const d = new Date(s.ExecutionUtc);

      const rawMs = d.getTime();
      const recurrence = s.Recurrence || 'none';
      const effectiveMs = rawMs > Date.now() ? rawMs : nextRecur(rawMs, recurrence);
      const effectiveUtc = new Date(effectiveMs).toISOString();
      const effectiveD = new Date(effectiveMs);
      const effectiveDateStr = effectiveD.toLocaleDateString(undefined, { month:'short', day:'numeric', year:'numeric' }) + ' ' + effectiveD.toLocaleTimeString(undefined, {hour: '2-digit', minute:'2-digit'});

      const bd = document.createElement('div');
      bd.innerHTML = `<div class="lmAnnCardTitle">${esc(s.Title)} <span style="font-size:0.85em;font-weight:400;color:var(--lm-accent);opacity:0.9">— ${esc(recurrence.toUpperCase())}</span></div>
                      <div class="lmAnnCardDate">${esc(effectiveDateStr)}</div>`;
      main.appendChild(bd);
      card.appendChild(main);

      const recurBadge = document.createElement('span');
      recurBadge.className = 'lmAnnCardVer lmCdT';
      recurBadge.dataset.pfx = 'in ';
      recurBadge.dataset.iso = effectiveUtc;
      recurBadge.style.background = 'rgba(0,180,90,0.2)';
      recurBadge.style.color = 'var(--lm-accent)';
      recurBadge.textContent = 'in ' + fmtCd(effectiveUtc);
      card.appendChild(recurBadge);

      const delBtn = document.createElement('button');
      delBtn.className = 'lmCCl';
      delBtn.style.cssText = 'position:relative;margin-left:8px;font-size:22px;padding:0 4px;';
      delBtn.innerHTML = '&times;';
      delBtn.onclick = async (e) => {
        e.stopPropagation();
        if(!confirm('Delete this scheduled task?')) return;
        await api(`ScheduledTask/${s.Id}`, { method: 'DELETE' });
        card.remove();
      };
      card.appendChild(delBtn);

      card.onclick = () => {
        ov.remove();
        openSchedCreate(s);
      };
      body.appendChild(card);
    });
  }).catch(() => {
    body.innerHTML = '<div class="lmEmpty" style="padding:20px 14px">Error loading tasks.</div>';
  });
}

function openAnnCreate(editObj = null) {
  if (!S.admin) return; // safety guard — UI already hides this for non-admins
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

  const viewSchedBtn = document.createElement('button');
  viewSchedBtn.className = 'lmAnnCanBtn';
  viewSchedBtn.style.marginRight = '8px';
  viewSchedBtn.textContent = 'View Scheduled Tasks';
  viewSchedBtn.onclick = (e) => { e.preventDefault(); ov.remove(); openAllScheduledTasks(); };

  const addSchedBtn = document.createElement('button');
  addSchedBtn.className = 'lmAnnCanBtn';
  addSchedBtn.style.marginRight = '8px';
  addSchedBtn.textContent = 'Add Scheduled Task';
  addSchedBtn.onclick = (e) => { e.preventDefault(); ov.remove(); openSchedCreate(null, false); };

  const addMaintBtn = document.createElement('button');
  addMaintBtn.className = 'lmAnnCanBtn';
  addMaintBtn.style.marginRight = 'auto'; // push to left
  addMaintBtn.textContent = 'Scheduled Maintenance';
  addMaintBtn.onclick = (e) => { e.preventDefault(); ov.remove(); openSchedCreate(null, true); };

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
  panelFoot.style.cssText = 'display:flex;align-items:center;gap:8px;padding:12px 16px;flex-wrap:wrap;';
  addLinkBtn.style.marginRight = '';
  viewSchedBtn.style.marginRight = '';
  addSchedBtn.style.marginRight = 'auto';
  cancelBtn.style.marginLeft = '0';
  panelFoot.appendChild(addLinkBtn);
  panelFoot.appendChild(viewSchedBtn);
  panelFoot.appendChild(addSchedBtn);
  panelFoot.appendChild(addMaintBtn);
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
// Lazily loaded feature modules register their API here (see Web/chat.js).
const LMC = {};

// URL of a feature module; carries the plugin version (from our own script tag) so it is cacheable.
function lmModuleUrl(name) {
  const own = (document.querySelector('script[src*="name=LatestMediaUI"]') || {}).src;
  const ver = own && /[?&]v=([^&]+)/.exec(own);
  return `/web/configurationpage?name=${name}` + (ver ? `&v=${ver[1]}` : '');
}

// Load a module script once; resolves when it has executed (or failed - callers must tolerate that).
function loadModuleP(name) {
  return new Promise(resolve => {
    if (document.querySelector(`script[data-lm-module="${name}"]`)) { resolve(); return; }
    const s = document.createElement('script');
    s.src = lmModuleUrl(name);
    s.setAttribute('data-lm-module', name);
    s.onload = () => resolve();
    s.onerror = () => { console.warn(`[LM] Failed to load module: ${name}`); resolve(); };
    document.head.appendChild(s);
  });
}

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
    let cfg={};try{cfg=await api('LatestMedia/Config')}catch(e){}
    S.cfg=cfg;

    // ── Expose shared globals for feature modules ──
    window.__latestMediaConfig = cfg;
    window.__latestMediaState = S;

    // ── Shared helpers for lazily loaded modules (chat.js) ──
    window.__lmCore = { S, api, esc, ICO, G, outsideClose, removeOverlay, chat: LMC };
    // Chat (E2E, DMs, notifications) is only downloaded when it is enabled.
    if (cfg.EnableChat !== false) await loadModuleP('chat.js');

    // ── Shared observer registration system ──
    if (!window.__latestMediaObserver) {
      window.__latestMediaObserver = {
        _cbs: {},
        register(name, cb) { this._cbs[name] = cb; },
        unregister(name) { delete this._cbs[name]; },
        _notify() {
          for (const cb of Object.values(this._cbs)) {
            try { cb(); } catch (e) { console.debug('[LM] observer cb error', e); }
          }
        }
      };
    }

    // ── Feature Module Bootloader (v3.0.0.0) ──
    // Modules are lazy-loaded only when their toggle is enabled.
    // This prevents any JS execution for disabled features.
    (function bootloadFeatureModules() {
      // Resolve base URL for feature JS files (served by Jellyfin as plugin pages)
      function loadModule(name) {
        if (document.querySelector(`script[data-lm-module="${name}"]`)) return;
        const s = document.createElement('script');
        s.src = lmModuleUrl(name);
        s.setAttribute('data-lm-module', name);
        s.onerror = () => console.warn(`[LM] Failed to load module: ${name}`);
        document.head.appendChild(s);
      }

      // Feature 1: Auto PIP / Pause / Resume
      // Load if ANY of the 3 features is explicitly enabled
      if (cfg.AutoPauseEnabled || cfg.AutoResumeEnabled || cfg.AutoPipEnabled) {
        loadModule('playback-controls.js');
      }

      // Feature 2: Random Button
      if (cfg.RandomButtonEnabled !== false) {
        loadModule('random-button.js');
      }

      // Feature 3: Seerr Integration
      if (cfg.JellyseerrEnabled) {
        loadModule('seerr-integration.js');
      }

      // Feature 4: Custom Branding (apply to Jellyfin UI pages)
      if (cfg.EnableCustomBranding) {
        loadModule('apply-branding.js');
      }
      // Note: branding.js (upload UI) is loaded by configPage.html only (admin settings page)

      // Feature 5: *arr Integration (Quick Links, Tag Links, Active Downloads)
      if (cfg.ArrLinksEnabled || cfg.ArrTagsShowAsLinks || cfg.ArrDownloadsEnabled) {
        loadModule('arr-integration.js');
      }

      // Feature 6: Active Downloads page (requests-page.js) – load separately so it can
      // self-initialize with our config keys even without the JellyfinEnhanced namespace.
      if (cfg.ArrDownloadsEnabled) {
        window.JE = window.JE || {};
        window.JE.pluginConfig = window.JE.pluginConfig || {};
        window.JE.pluginConfig.DownloadsPageEnabled = true;
        window.JE.pluginConfig.DownloadsPagePollingEnabled = true;
        window.JE.pluginConfig.DownloadsUsePluginPages = false;
        window.JE.pluginConfig.DownloadsUseCustomTabs = false;

        loadModule('requests-page.js');
        // Still poll for the module to call initialize() (for page content setup)
        var downloadsInitPoll = setInterval(function() {
          if (typeof window.lmInitDownloadsPage === 'function') {
            clearInterval(downloadsInitPoll);
            window.lmInitDownloadsPage();
          }
        }, 100);
        setTimeout(function() { clearInterval(downloadsInitPoll); }, 10000);

        // === Direct sidebar injection (Discover plugin pattern) ===
        // Done HERE in latestmedia.js, where the config is already in hand.
        // This is immune to the module load timing race.
        (function injectDownloadsSidebarLink() {
          if (document.querySelector('.je-nav-downloads-item')) return;
          // Guard: only one polling interval allowed at a time
          if (window._lmSbInterval) return;
          window._lmSbInterval = setInterval(function() {
            var menu = document.querySelector('.navMenu');
            if (menu && !menu.querySelector('.je-nav-downloads-item')) {
              clearInterval(window._lmSbInterval);
              window._lmSbInterval = null;
              var link = document.createElement('a');
              link.className = 'navMenuOption emby-button je-nav-downloads-item';
              link.title = 'Active Downloads';
              link.innerHTML = '<span class="navMenuOptionIcon material-icons">download</span><span class="navMenuOptionText">Active Downloads</span>';
              link.addEventListener('click', function(e) {
                e.preventDefault();
                var drawer = document.querySelector('.appDrawer-open');
                if (drawer) drawer.classList.remove('appDrawer-open');
                window.location.hash = '#/home?custom=active_downloads';
                if (typeof window.lmMountActiveDownloads === 'function') {
                  setTimeout(window.lmMountActiveDownloads, 150);
                }
              });
              var container = document.querySelector('.customMenuOptions');
              var watchlist = container ? container.querySelector('[data-name="watchlist"]') : null;
              if (watchlist) watchlist.after(link);
              else if (container) container.appendChild(link);
              else {
                var homeLink = menu.querySelector('a[href="#/home"]');
                if (homeLink && homeLink.nextSibling) menu.insertBefore(link, homeLink.nextSibling);
                else menu.appendChild(link);
              }
              console.log('[LM] Active Downloads nav link injected into sidebar');
            } else if (menu && menu.querySelector('.je-nav-downloads-item')) {
              // Already injected — stop polling
              clearInterval(window._lmSbInterval);
              window._lmSbInterval = null;
            }
          }, 400);
          // Re-inject when sidebar rebuilds on SPA navigation
          ['hashchange', 'viewshow', 'pageshow'].forEach(function(evt) {
            window.addEventListener(evt, function() {
              if (!document.querySelector('.je-nav-downloads-item') && !window._lmSbInterval) {
                setTimeout(injectDownloadsSidebarLink, 300);
              }
            });
          });
        })();
      }

      // Feature 7: Star Ratings on Cards
      if (cfg.ShowStarRatingOnCards) loadModule('star-ratings.js');
    })();

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
      const b=mkBtn('lm-btn-chat',ICO.chat,(ev,w)=>LMC.openChat?.(w));
      const bdg=document.createElement('span');bdg.id='lmChatBdg';bdg.className='lmBdg';b.appendChild(bdg);
      f.appendChild(b);
      api('Chat/MyCode').then(r=>{S.code=r.Code}).catch(()=>{});
    }
    if(cfg.EnableAnnouncements!==false){
      const ab=mkBtn('lm-btn-announce',ICO.announce,(ev,w)=>openAnnouncements(w));
      const abdg=document.createElement('span');abdg.id='lmAnnBdg';abdg.className='lmAnnBdg';ab.appendChild(abdg);
      f.appendChild(ab);
    }
    hr.insertBefore(f,hr.firstChild);S.ok=true;
    // Fire badge refreshes NOW that S.ok is true (they bail early if S.ok is false)
    if(cfg.EnableChat!==false) LMC.refreshBadge?.();
    if(cfg.EnableAnnouncements!==false) refreshAnnounceBadge();
  }catch(ex){console.debug('[LM] deferred:',ex.message)}finally{ij=false}
}

let _mainObsTimeout = null;
const obs=new MutationObserver(()=>{
  clearTimeout(_mainObsTimeout);
  _mainObsTimeout = setTimeout(()=>{
    if(!document.getElementById('lm-btn-latest'))S.ok=false;
    tryInject();
    LMC.tryInjectPlayerChat?.();
    // Notify feature modules registered with the shared observer
    if(window.__latestMediaObserver) window.__latestMediaObserver._notify();

    // Video lifecycle: inject/destroy toast container (chat DM notifications).
    // Only active when chat is enabled — zero cost when disabled.
    const videoEl = document.querySelector('video');
    if (S.cfg?.EnableChat !== false) {
      if (videoEl && !window._lmVideoActive) {
        window._lmVideoActive = true;
        LMC.injectToastContainer?.();
        LMC.startNotificationPolling?.();
      }
      if (!videoEl && window._lmVideoActive) {
        window._lmVideoActive = false;
        LMC.destroyToastContainer?.();
      }
    } else if (window._lmVideoActive) {
      // Chat was disabled at runtime — clean up any existing toast state
      window._lmVideoActive = false;
      LMC.destroyToastContainer?.();
    }
  }, 150);
});
// Watch only direct children of body (SPA view container swaps).
// subtree:false prevents firing on every image load, card render, and chat bubble —
// the 3s heartbeat below handles re-injection after navigation.
obs.observe(document.body,{childList:true,subtree:false});
function lmHeartbeat(){
  // Skip all work when the browser tab is hidden — saves CPU and avoids stacking up injections
  if (document.hidden) return;
  const curUid = window.ApiClient ? window.ApiClient.getCurrentUserId() : null;
  if (curUid && S.uid && S.uid !== curUid) {
    S.tok = window.ApiClient.accessToken();
    S.uid = curUid;
    S.ok = false;
    LMC.resetUser?.();
    LMC.closeChat?.();
  } else if (window.ApiClient && window.ApiClient.accessToken() && S.tok && S.tok !== window.ApiClient.accessToken()) {
    S.tok = window.ApiClient.accessToken();
  }

  if(!document.getElementById('lm-btn-latest'))S.ok=false;
  tryInject();
  LMC.tryInjectPlayerChat?.();
  // Video lifecycle on heartbeat (in case observer missed the event)
  // Only active when chat is enabled — zero cost when disabled.
  const videoEl = document.querySelector('video');
  if (S.cfg?.EnableChat !== false) {
    if (videoEl && !window._lmVideoActive) {
      window._lmVideoActive = true;
      LMC.injectToastContainer?.();
      LMC.startNotificationPolling?.();
    }
    if (!videoEl && window._lmVideoActive) {
      window._lmVideoActive = false;
      LMC.destroyToastContainer?.();
    }
  } else if (window._lmVideoActive) {
    window._lmVideoActive = false;
    LMC.destroyToastContainer?.();
  }
}
LM_SLOW.push(()=>{ if(S.ok && S.cfg?.EnableAnnouncements!==false) refreshAnnounceBadge(); });

function lmRunSlow(){
  if (document.hidden) return;
  for (const fn of LM_SLOW) { try { fn(); } catch (e) { console.debug('[LM] slow task error', e); } }
}
// ONE shared timer: heartbeat every 3s, chat badge every ~30s, slow tasks (announcements, countdowns,
// maintenance banner) every ~60s. Replaces four separate intervals.
let _lmTick = 0;
setInterval(()=>{
  lmHeartbeat();
  _lmTick++;
  if (_lmTick % 10 === 0 && !document.hidden && S.ok && S.cfg?.EnableChat!==false && !document.getElementById('lmChat')) LMC.refreshBadge?.();
  if (_lmTick % 20 === 0) lmRunSlow();
}, 3000);
// Catch up immediately when the tab becomes visible again
document.addEventListener('visibilitychange', ()=>{ if (!document.hidden) lmRunSlow(); });


// --- Maintenance Banner Logic ---
function initMaintenanceBanner() {
  function applyStylesOnce() {
    if (document.getElementById('lm-maint-style')) return;
    const style = document.createElement('style');
    style.id = 'lm-maint-style';
    style.textContent = `
      :root {
        --banner-height: 40px; 
      }
      
      body.maintenance-active .skinHeader {
        top: var(--banner-height) !important;
      }
      body.maintenance-active .mainDrawer {
        top: var(--banner-height) !important;
        height: calc(100% - var(--banner-height)) !important;
      }
      body.maintenance-active .mainAnimatedPages, 
      body.maintenance-active .page {
        padding-top: var(--banner-height) !important;
      }
      
      body.maintenance-active iframe {
        padding-top: var(--banner-height) !important;
        box-sizing: border-box !important;
      }
      
      #maintenance-banner {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        min-height: 40px; 
        padding: 8px 10px;
        box-sizing: border-box;
        background-color: #cc0000;
        color: #ffffff;
        text-align: center;
        display: none; 
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 14px;
        font-weight: bold;
        line-height: 1.5;
        z-index: 99999;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        pointer-events: none;
      }
      
      body.maintenance-active #maintenance-banner {
        display: block;
      }
    `;
    document.head.appendChild(style);
  }

  function adjustLayout() {
    const bannerEl = document.getElementById('maintenance-banner');
    if (bannerEl && document.body.classList.contains('maintenance-active')) {
      document.documentElement.style.setProperty('--banner-height', bannerEl.offsetHeight + 'px');
    }
  }

  function renderBanner(task) {
    if (!task) return;
    let bannerEl = document.getElementById('maintenance-banner');
    if (!bannerEl) {
      applyStylesOnce();
      bannerEl = document.createElement('div');
      bannerEl.id = 'maintenance-banner';
      document.body.prepend(bannerEl);
      window.addEventListener('resize', adjustLayout);
    }
    
    // We already advanced to the correct ExecutionUtc via the backend
    const maintenanceStartDate = new Date(task.ExecutionUtc);
    const maintenanceEndDate = new Date(maintenanceStartDate.getTime() + (task.MaintenanceDurationHours * 3600000));
    const now = new Date();
    
    const diffToStart = maintenanceStartDate - now;
    const diffToEnd = maintenanceEndDate - now;

    if (diffToEnd <= 0) {
      document.body.classList.remove('maintenance-active');
      document.documentElement.style.removeProperty('--banner-height');
      bannerEl.style.display = 'none';
      return;
    }

    document.body.classList.add('maintenance-active');
    bannerEl.style.display = 'block';

    const formatTime = (date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const localStartTime = formatTime(maintenanceStartDate);
    const localEndTime = formatTime(maintenanceEndDate);

    if (diffToStart <= 0) {
      bannerEl.innerHTML = `Server is currently in maintenance. Maintenance will end at&nbsp;<strong>${localEndTime}</strong>.`;
    } else {
      const hours = Math.floor(diffToStart / (1000 * 60 * 60));
      const minutes = Math.floor((diffToStart % (1000 * 60 * 60)) / (1000 * 60));
      let countdownStr = '';
      if (hours > 0) countdownStr += hours + (hours === 1 ? ' hour ' : ' hours ');
      countdownStr += minutes + (minutes === 1 ? ' minute' : ' minutes');

      bannerEl.innerHTML = `Server will go into maintenance at&nbsp;<strong>${localStartTime}</strong> (in ${countdownStr.trim()}). Maintenance will end at&nbsp;<strong>${localEndTime}</strong>.`;
    }
    adjustLayout();
  }

  async function pollMaintenance() {
    if (document.hidden) return;
    try {
      // Backend handles advancing recurring tasks so ExecutionUtc is always the next upcoming one
      const list = await api('ScheduledTask/Maintenance');
      if (Array.isArray(list) && list.length > 0) {
        // Find the earliest maintenance task that either is active right now or within its banner display threshold
        const nowMs = Date.now();
        let targetTask = null;

        // Sort by execution date (should already be sorted by backend, but just to be sure)
        const sorted = list.sort((a,b) => new Date(a.ExecutionUtc).getTime() - new Date(b.ExecutionUtc).getTime());
        
        for (const t of sorted) {
          const startMs = new Date(t.ExecutionUtc).getTime();
          const endMs = startMs + (t.MaintenanceDurationHours * 3600000);
          const showMs = startMs - (t.BannerDisplayHoursBefore * 3600000);
          
          if (nowMs >= showMs && nowMs < endMs) {
            targetTask = t;
            break;
          }
        }
        
        if (targetTask) {
          renderBanner(targetTask);
          return;
        }
      }
      
      // If we got here, no active maintenance requires a banner right now
      const bannerEl = document.getElementById('maintenance-banner');
      if (bannerEl) {
        document.body.classList.remove('maintenance-active');
        document.documentElement.style.removeProperty('--banner-height');
        bannerEl.style.display = 'none';
      }
      
    } catch(e) {
      // fail silently, could be network error or similar
    }
  }

  pollMaintenance();
  LM_SLOW.push(pollMaintenance);
}

tryInject();
document.addEventListener('DOMContentLoaded', initMaintenanceBanner);
if (document.readyState !== 'loading') {
  initMaintenanceBanner();
}
})();
