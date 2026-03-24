(function () {
    'use strict';

    // ─── Accent color matching the HTV logo (dark green) ─────────────────────
    const GREEN = '#00b35a';
    const GREEN_DARK = '#008c45';

    // ─── Constants ────────────────────────────────────────────────────────────
    const PLUGIN_ID = 'f94d6caf-2a62-4dd7-9f64-684ce8efff43';

    const ICONS = {
        latest: `<svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>`,
        manage: `<svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.06-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.06,0.94l-2.03,1.58c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.43-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.49-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/></svg>`,
        chat:   `<svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z"/></svg>`
    };

    // ─── State ────────────────────────────────────────────────────────────────
    const STATE = {
        serverUrl: '',
        token: '',
        userId: '',
        myCode: '',
        isAdmin: false,
        config: {},
        injected: false,
        chatPollTimer: null
    };

    // ─── Global styles ────────────────────────────────────────────────────────
    const style = document.createElement('style');
    style.innerHTML = `
        /* ── Header button wrapper (equidistant, no icon-size skew) ── */
        .lm-btn-wrap {
            display: inline-flex; align-items: center; justify-content: center;
            position: relative; width: 40px; height: 40px;
            cursor: pointer; color: inherit; flex-shrink: 0;
            transition: opacity 0.2s;
        }
        .lm-btn-wrap:hover { opacity: 0.75; }

        /* unread badge */
        .lm-unread-badge {
            position: absolute; top: 2px; right: 2px;
            background: ${GREEN}; color: #fff; border-radius: 50%;
            min-width: 16px; height: 16px; font-size: 10px; font-weight: 700;
            display: none; align-items: center; justify-content: center; padding: 0 3px;
            pointer-events: none;
        }
        .lm-unread-badge.show { display: flex; }

        /* ── Shared glass surface ── */
        .lm-glass {
            background: rgba(20, 20, 28, 0.82);
            backdrop-filter: blur(20px) saturate(1.4);
            -webkit-backdrop-filter: blur(20px) saturate(1.4);
            border: 1px solid rgba(255,255,255,0.10);
            box-shadow: 0 8px 32px rgba(0,0,0,0.55);
        }

        /* ── Latest Media dropdown ── */
        .lm-dropdown {
            position: absolute; top: calc(100% + 6px); right: 0;
            width: 330px; max-height: 70vh; overflow-y: auto;
            border-radius: 10px; z-index: 9999; display: none;
            scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.15) transparent;
        }
        .lm-dropdown.open { display: block; }
        .lm-dropdown::-webkit-scrollbar { width: 4px; }
        .lm-dropdown::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 2px; }

        .lm-dd-tabs {
            display: flex; border-bottom: 1px solid rgba(255,255,255,0.08);
            position: sticky; top: 0; z-index: 1;
            background: rgba(20,20,28,0.95); backdrop-filter: blur(20px);
        }
        .lm-dd-tab {
            flex: 1; padding: 9px 10px; text-align: center; cursor: pointer;
            font-size: 0.78em; font-weight: 600; color: rgba(255,255,255,0.45);
            border-bottom: 2px solid transparent; transition: all 0.2s;
        }
        .lm-dd-tab:hover { color: rgba(255,255,255,0.7); }
        .lm-dd-tab.active { color: ${GREEN}; border-bottom-color: ${GREEN}; }

        .lm-card {
            display: flex; align-items: center; gap: 11px;
            padding: 9px 13px; border-bottom: 1px solid rgba(255,255,255,0.05);
            cursor: pointer; color: inherit; text-decoration: none; transition: background 0.15s;
        }
        .lm-card:hover { background: rgba(255,255,255,0.06); }
        .lm-card:last-child { border-bottom: none; }
        .lm-poster { width: 40px; height: 60px; object-fit: cover; border-radius: 4px; background: rgba(255,255,255,0.05); flex-shrink: 0; }
        .lm-card-meta { flex: 1; min-width: 0; }
        .lm-card-title { font-size: 0.90em; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .lm-card-sub { font-size: 0.74em; opacity: 0.55; margin-top: 3px; display: flex; gap: 7px; align-items: center; }
        .lm-type-badge { font-size: 0.68em; font-weight: 700; padding: 1px 5px; border-radius: 3px; color: #fff; text-transform: uppercase; letter-spacing: 0.04em; }
        .lm-type-movie  { background: #1565c0; }
        .lm-type-series { background: ${GREEN_DARK}; }
        .lm-type-anime  { background: #6a1b9a; }
        .lm-type-other  { background: #555; }
        .lm-leaving-days {
            font-size: 0.72em; font-weight: 700; padding: 1px 6px;
            border-radius: 3px; background: #c62828; color: #fff;
        }
        .lm-empty { padding: 22px; text-align: center; opacity: 0.45; font-size: 0.88em; }

        /* ── Admin modal ── */
        .lm-modal-overlay {
            position: fixed; inset: 0;
            background: rgba(0,0,0,0.70); backdrop-filter: blur(4px);
            z-index: 99997; display: flex; align-items: center; justify-content: center;
        }
        .lm-modal {
            background: var(--theme-background-color, #18181f);
            border: 1px solid rgba(255,255,255,0.10);
            border-radius: 12px; width: 92%; max-width: 980px; max-height: 88vh;
            display: flex; flex-direction: column; overflow: hidden;
            box-shadow: 0 20px 60px rgba(0,0,0,0.65);
        }
        .lm-modal-hdr {
            display: flex; align-items: center; justify-content: space-between;
            padding: 15px 20px; border-bottom: 1px solid rgba(255,255,255,0.08);
            background: rgba(255,255,255,0.03); flex-shrink: 0;
        }
        .lm-modal-hdr h2 { margin: 0; font-size: 1.05rem; font-weight: 600; }
        .lm-modal-close { cursor: pointer; background: none; border: none; color: inherit; font-size: 1.3rem; opacity: 0.6; line-height: 1; }
        .lm-modal-close:hover { opacity: 1; }
        .lm-modal-body { padding: 0; overflow-y: auto; flex: 1; }

        .lm-table { width: 100%; border-collapse: collapse; font-size: 0.87em; }
        .lm-table th { padding: 9px 13px; text-align: left; background: rgba(0,0,0,0.25); font-weight: 600; position: sticky; top: 0; }
        .lm-table td { padding: 8px 13px; border-bottom: 1px solid rgba(255,255,255,0.04); vertical-align: middle; }
        .lm-table tr:hover td { background: rgba(255,255,255,0.025); }

        /* Schedule delete native select — themed */
        .lm-select {
            appearance: none; -webkit-appearance: none;
            background: rgba(40,40,55,0.95);
            color: inherit;
            border: 1px solid rgba(255,255,255,0.18);
            border-radius: 5px; padding: 5px 28px 5px 9px;
            font-size: 0.82em; cursor: pointer;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='rgba(255,255,255,0.7)'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E");
            background-repeat: no-repeat; background-position: right 4px center; background-size: 18px;
        }
        .lm-select option { background: #1e1e2a; color: #fff; }
        .lm-select:focus { outline: none; border-color: ${GREEN}; }

        .lm-btn { display: inline-block; border: none; padding: 5px 12px; border-radius: 5px; cursor: pointer; font-size: 0.83em; white-space: nowrap; font-family: inherit; }
        .lm-btn-primary { background: ${GREEN}; color: #fff; }
        .lm-btn-danger { background: #c62828; color: #fff; }
        .lm-btn-ghost { background: rgba(255,255,255,0.1); color: inherit; }
        .lm-btn:hover { filter: brightness(1.15); }

        /* Confirm dialog */
        .lm-confirm {
            position: fixed; inset: 0; z-index: 99999;
            display: flex; align-items: center; justify-content: center;
            background: rgba(0,0,0,0.6); backdrop-filter: blur(4px);
        }
        .lm-confirm-box {
            background: #1e1e2a; border: 1px solid rgba(255,255,255,0.12);
            border-radius: 10px; padding: 24px 28px; max-width: 380px; width: 90%;
            box-shadow: 0 16px 48px rgba(0,0,0,0.6); text-align: center;
        }
        .lm-confirm-box p { margin: 0 0 18px; font-size: 0.93em; line-height: 1.5; }
        .lm-confirm-actions { display: flex; gap: 10px; justify-content: center; }

        /* ── Chat panel — popup under icon ── */
        .lm-chat-panel {
            position: absolute; top: calc(100% + 6px); right: 0;
            width: 330px; height: 460px;
            background: rgba(18, 18, 26, 0.88);
            backdrop-filter: blur(22px) saturate(1.4);
            -webkit-backdrop-filter: blur(22px) saturate(1.4);
            border: 1px solid rgba(255,255,255,0.10);
            border-radius: 12px;
            box-shadow: 0 12px 40px rgba(0,0,0,0.55);
            display: flex; flex-direction: column;
            z-index: 9999; overflow: hidden;
            transform-origin: top right;
            animation: lm-popIn 0.2s cubic-bezier(0.34,1.56,0.64,1);
        }
        @keyframes lm-popIn {
            from { opacity: 0; transform: scale(0.88); }
            to   { opacity: 1; transform: scale(1); }
        }

        .lm-chat-hdr {
            display: flex; align-items: center; padding: 10px 13px 8px;
            border-bottom: 1px solid rgba(255,255,255,0.07); flex-shrink: 0;
        }
        .lm-chat-hdr-title { font-size: 0.85em; font-weight: 700; flex: 1; }
        .lm-chat-online { font-size: 0.72em; color: ${GREEN}; font-weight: 600; display: flex; align-items: center; gap: 4px; margin-right: 8px; }
        .lm-chat-online-dot { width: 6px; height: 6px; border-radius: 50%; background: ${GREEN}; flex-shrink: 0; }
        .lm-chat-close { cursor: pointer; background: none; border: none; color: inherit; font-size: 1.1rem; opacity: 0.55; line-height: 1; }
        .lm-chat-close:hover { opacity: 1; }

        .lm-chat-tabs { display: flex; border-bottom: 1px solid rgba(255,255,255,0.07); flex-shrink: 0; }
        .lm-chat-tab {
            flex: 1; padding: 7px 8px; text-align: center; cursor: pointer;
            font-size: 0.76em; font-weight: 600; color: rgba(255,255,255,0.4);
            border-bottom: 2px solid transparent; transition: all 0.2s;
        }
        .lm-chat-tab:hover { color: rgba(255,255,255,0.75); }
        .lm-chat-tab.active { color: ${GREEN}; border-bottom-color: ${GREEN}; }

        /* My code bar */
        .lm-my-code {
            padding: 6px 12px;
            font-size: 0.73em; color: rgba(255,255,255,0.45);
            border-bottom: 1px solid rgba(255,255,255,0.06);
            display: flex; align-items: center; gap: 6px; flex-shrink: 0;
        }
        .lm-my-code strong { color: ${GREEN}; font-size: 1.1em; letter-spacing: 0.08em; cursor: pointer; }
        .lm-my-code small { margin-left: auto; opacity: 0.5; font-size: 0.9em; }

        .lm-chat-messages {
            flex: 1; overflow-y: auto; padding: 10px 10px 4px;
            display: flex; flex-direction: column; gap: 5px;
            scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.12) transparent;
        }
        .lm-chat-messages::-webkit-scrollbar { width: 3px; }
        .lm-chat-messages::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.18); border-radius: 2px; }

        .lm-bubble { max-width: 84%; padding: 6px 11px; border-radius: 14px; font-size: 0.84em; line-height: 1.45; word-wrap: break-word; }
        .lm-bubble.own { align-self: flex-end; background: ${GREEN}; color: #fff; border-bottom-right-radius: 3px; }
        .lm-bubble.other { align-self: flex-start; background: rgba(255,255,255,0.10); color: inherit; border-bottom-left-radius: 3px; }
        .lm-bubble.broadcast { align-self: center; background: rgba(200,100,0,0.75); color: #fff; border-radius: 8px; max-width: 96%; text-align: center; font-size: 0.8em; }
        .lm-bubble-name { font-size: 0.7em; opacity: 0.6; margin-bottom: 2px; }

        /* Emoji picker */
        .lm-emoji-btn { cursor: pointer; background: none; border: none; color: inherit; font-size: 1.1rem; line-height: 1; opacity: 0.55; flex-shrink: 0; }
        .lm-emoji-btn:hover { opacity: 0.9; }
        .lm-emoji-picker {
            position: absolute; bottom: 100%; right: 0;
            background: rgba(18,18,26,0.97); backdrop-filter: blur(20px);
            border: 1px solid rgba(255,255,255,0.1); border-radius: 10px;
            padding: 8px; display: flex; flex-wrap: wrap; width: 220px;
            gap: 4px; box-shadow: 0 8px 28px rgba(0,0,0,0.5); z-index: 9; max-height: 160px; overflow-y: auto;
        }
        .lm-emoji-picker span { cursor: pointer; font-size: 1.3em; line-height: 1; border-radius: 4px; padding: 2px; transition: background 0.1s; }
        .lm-emoji-picker span:hover { background: rgba(255,255,255,0.12); }

        .lm-chat-input-area {
            display: flex; align-items: center; gap: 6px;
            padding: 7px 9px; border-top: 1px solid rgba(255,255,255,0.07); flex-shrink: 0;
            position: relative;
        }
        .lm-chat-input {
            flex: 1; background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.12);
            border-radius: 18px; color: inherit; padding: 6px 13px; font-size: 0.84em; outline: none;
            font-family: inherit;
        }
        .lm-chat-input:focus { border-color: ${GREEN}; }
        .lm-chat-send {
            background: ${GREEN}; color: #fff; border: none; border-radius: 50%;
            width: 30px; height: 30px; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .lm-chat-send:hover { background: ${GREEN_DARK}; }

        /* DM list */
        .lm-dm-start { padding: 10px 12px; border-bottom: 1px solid rgba(255,255,255,0.07); flex-shrink: 0; }
        .lm-dm-start input { width: 100%; background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.12); border-radius: 18px; color: inherit; padding: 6px 13px; font-size: 0.83em; outline: none; font-family: inherit; box-sizing: border-box; }
        .lm-dm-start input:focus { border-color: ${GREEN}; }
        .lm-dm-start small { display: block; font-size: 0.7em; opacity: 0.4; margin-top: 4px; text-align: center; }
        .lm-dm-row-item { display: flex; align-items: center; gap: 10px; padding: 9px 12px; cursor: pointer; font-size: 0.84em; transition: background 0.15s; border-bottom: 1px solid rgba(255,255,255,0.04); }
        .lm-dm-row-item:hover { background: rgba(255,255,255,0.06); }
        .lm-dm-badge { margin-left: auto; background: ${GREEN}; color: #fff; font-size: 0.68em; font-weight: 700; border-radius: 10px; padding: 1px 6px; }

        /* Back button in DM thread */
        .lm-dm-back { display: flex; align-items: center; gap: 6px; padding: 7px 12px; font-size: 0.8em; cursor: pointer; border-bottom: 1px solid rgba(255,255,255,0.06); color: ${GREEN}; flex-shrink: 0; }
        .lm-dm-back:hover { opacity: 0.8; }

        @media (max-width: 767px) {
            .lm-chat-panel { width: calc(100vw - 20px); right: -10px; }
            .lm-dropdown { width: calc(100vw - 20px); right: -10px; }
        }
    `;
    document.head.appendChild(style);

    // ─── API helper ───────────────────────────────────────────────────────────
    function api(endpoint, options = {}) {
        const base = STATE.serverUrl || location.origin;
        const url = `${base}/${endpoint}`;
        const authVal = `MediaBrowser Client="Jellyfin Web", Device="Plugin", DeviceId="PluginUI1", Version="1.0.0", Token="${STATE.token}"`;
        return fetch(url, {
            ...options,
            headers: {
                'Authorization': authVal,
                'X-Emby-Authorization': authVal,
                'Content-Type': 'application/json',
                ...(options.headers || {})
            }
        }).then(r => {
            if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
            return r.text().then(t => t ? JSON.parse(t) : {});
        });
    }

    // ─── Helper: create header button ─────────────────────────────────────────
    function mkHeaderBtn(id, svgIcon, onClick) {
        const wrap = document.createElement('div');
        wrap.className = 'lm-btn-wrap';
        wrap.id = id;
        wrap.innerHTML = svgIcon;
        wrap.addEventListener('click', e => { e.stopPropagation(); onClick(e, wrap); });
        return wrap;
    }

    // ─── Confirm dialog ───────────────────────────────────────────────────────
    function showConfirm(message) {
        return new Promise(resolve => {
            const el = document.createElement('div');
            el.className = 'lm-confirm';
            el.innerHTML = `
                <div class="lm-confirm-box">
                    <p>${message}</p>
                    <div class="lm-confirm-actions">
                        <button class="lm-btn lm-btn-primary" id="lm-cf-ok">Proceed</button>
                        <button class="lm-btn lm-btn-ghost" id="lm-cf-cancel">Cancel</button>
                    </div>
                </div>`;
            document.body.appendChild(el);
            el.querySelector('#lm-cf-ok').onclick = () => { el.remove(); resolve(true); };
            el.querySelector('#lm-cf-cancel').onclick = () => { el.remove(); resolve(false); };
            el.addEventListener('click', e => { if (e.target === el) { el.remove(); resolve(false); } });
        });
    }

    // ─── Outside-click helper ─────────────────────────────────────────────────
    function onOutsideClick(el, callback) {
        function handler(e) {
            if (!el.contains(e.target)) { callback(); document.removeEventListener('click', handler, true); }
        }
        setTimeout(() => document.addEventListener('click', handler, true), 50);
    }

    // ─── Latest Media dropdown ────────────────────────────────────────────────
    let latestDropdownOpen = false;

    function openLatestDropdown(e, btnWrap) {
        if (latestDropdownOpen) { closeLatestDropdown(btnWrap); return; }

        const dd = document.createElement('div');
        dd.className = 'lm-dropdown lm-glass open';
        dd.id = 'lm-dropdown-el';
        dd.innerHTML = `
            <div class="lm-dd-tabs">
                <div class="lm-dd-tab active" data-tab="recent">Recently Added</div>
                <div class="lm-dd-tab" data-tab="leaving">Leaving Soon</div>
            </div>
            <div id="lm-dd-body"><div class="lm-empty">Loading…</div></div>`;
        btnWrap.appendChild(dd);
        latestDropdownOpen = true;

        dd.querySelectorAll('.lm-dd-tab').forEach(t => {
            t.addEventListener('click', e2 => {
                e2.stopPropagation();
                dd.querySelectorAll('.lm-dd-tab').forEach(x => x.classList.remove('active'));
                t.classList.add('active');
                loadDdTab(t.dataset.tab);
            });
        });

        loadDdTab('recent');

        onOutsideClick(btnWrap, () => closeLatestDropdown(btnWrap));
    }

    function closeLatestDropdown(btnWrap) {
        const d = document.getElementById('lm-dropdown-el');
        if (d) d.remove();
        latestDropdownOpen = false;
    }

    function loadDdTab(tab) {
        const body = document.getElementById('lm-dd-body');
        if (!body) return;
        body.innerHTML = '<div class="lm-empty">Loading…</div>';

        const endpoint = tab === 'recent' ? 'LatestMedia/Items' : 'LatestMedia/LeavingSoon';
        api(endpoint).then(items => {
            if (!items || !items.length) {
                body.innerHTML = `<div class="lm-empty">${tab === 'recent' ? 'No recent media.' : 'No items leaving soon.'}</div>`;
                return;
            }
            if (tab === 'recent') renderRecentCards(body, items);
            else renderLeavingCards(body, items);
        }).catch(err => {
            body.innerHTML = `<div class="lm-empty">Failed to load: ${err.message}</div>`;
        });
    }

    function renderRecentCards(container, items) {
        let html = '';
        items.forEach(item => {
            const t = (item.Type || '').toLowerCase();
            const cls = t === 'movie' ? 'lm-type-movie' : t === 'anime' ? 'lm-type-anime' : (t === 'series' || t === 'episode') ? 'lm-type-series' : 'lm-type-other';
            const label = item.Type || 'Other';
            let age = '';
            if (item.DateAdded) {
                const diff = Math.floor((Date.now() - new Date(item.DateAdded)) / 86400000);
                age = diff === 0 ? 'Today' : `${diff}d ago`;
            }
            const year = item.ProductionYear ? ` (${item.ProductionYear})` : '';
            const poster = `${STATE.serverUrl}/Items/${item.Id}/Images/Primary?fillWidth=90&quality=75`;
            html += `<a class="lm-card" href="#!/details?id=${item.Id}">
                <img class="lm-poster" loading="lazy" src="${poster}" onerror="this.style.visibility='hidden'"/>
                <div class="lm-card-meta">
                    <div class="lm-card-title">${escHtml(item.Title || item.Name || 'Unknown')}${year}</div>
                    <div class="lm-card-sub">
                        <span class="lm-type-badge ${cls}">${label}</span>
                        ${age ? `<span>${age}</span>` : ''}
                    </div>
                </div></a>`;
        });
        container.innerHTML = html;
        container.querySelectorAll('.lm-card').forEach(a => a.addEventListener('click', () => closeLatestDropdown(null)));
    }

    function renderLeavingCards(container, items) {
        let html = '';
        items.forEach(item => {
            const t = (item.Type || '').toLowerCase();
            const cls = t === 'movie' ? 'lm-type-movie' : t === 'anime' ? 'lm-type-anime' : t === 'series' ? 'lm-type-series' : 'lm-type-other';
            const label = item.Type || 'Other';
            const days = item.DaysRemaining ?? '?';
            const poster = `${STATE.serverUrl}/Items/${item.Id}/Images/Primary?fillWidth=90&quality=75`;
            html += `<a class="lm-card" href="#!/details?id=${item.Id}">
                <img class="lm-poster" loading="lazy" src="${poster}" onerror="this.style.visibility='hidden'"/>
                <div class="lm-card-meta">
                    <div class="lm-card-title">${escHtml(item.Title || item.Name || 'Unknown')}</div>
                    <div class="lm-card-sub">
                        <span class="lm-type-badge ${cls}">${label}</span>
                        <span class="lm-leaving-days">⏳ ${days}d left</span>
                    </div>
                </div></a>`;
        });
        container.innerHTML = html;
    }

    // ─── Media Management modal ───────────────────────────────────────────────
    function openMediaManagement() {
        const overlay = document.createElement('div');
        overlay.className = 'lm-modal-overlay';
        overlay.innerHTML = `
            <div class="lm-modal">
                <div class="lm-modal-hdr">
                    <h2>Media Management</h2>
                    <button class="lm-modal-close">&times;</button>
                </div>
                <div class="lm-modal-body" id="lm-mm-body"><div class="lm-empty" style="padding:30px">Loading…</div></div>
            </div>`;
        document.body.appendChild(overlay);
        overlay.querySelector('.lm-modal-close').onclick = () => overlay.remove();
        overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
        renderMediaTable(overlay.querySelector('#lm-mm-body'), overlay);
    }

    function renderMediaTable(body, overlay) {
        api('MediaMgmt/Items').then(items => {
            if (!items || !items.length) {
                body.innerHTML = '<div class="lm-empty" style="padding:30px">No items.</div>';
                return;
            }
            let html = `<table class="lm-table"><thead><tr>
                <th>Title</th><th>Year</th><th>Size (MB)</th><th>Status</th><th>Action</th>
            </tr></thead><tbody>`;
            items.forEach(i => {
                const sizeMb = i.Size ? (i.Size / 1048576).toFixed(1) : '—';
                const isScheduled = i.Status && i.Status !== 'Active';
                html += `<tr>
                    <td>${escHtml(i.Title || '—')}</td>
                    <td>${i.Year || '—'}</td>
                    <td>${sizeMb}</td>
                    <td>${escHtml(i.Status || 'Active')}</td>
                    <td>${isScheduled
                        ? `<button class="lm-btn lm-btn-danger lm-cancel-del" data-id="${i.Id}">Cancel</button>`
                        : `<select class="lm-select lm-schedule-sel" data-id="${i.Id}" data-title="${escHtml(i.Title || 'this item')}">
                               <option value="">Schedule Delete…</option>
                               <option value="1">1 Day</option>
                               <option value="3">3 Days</option>
                               <option value="7">1 Week</option>
                               <option value="14">2 Weeks</option>
                               <option value="30">1 Month</option>
                           </select>`
                    }</td>
                </tr>`;
            });
            html += '</tbody></table>';
            body.innerHTML = html;

            body.querySelectorAll('.lm-schedule-sel').forEach(sel => {
                sel.onchange = async () => {
                    const days = sel.value;
                    const id = sel.dataset.id;
                    const title = sel.dataset.title;
                    if (!days) return;
                    const ok = await showConfirm(`Schedule <strong>${title}</strong> for deletion in <strong>${days} day(s)</strong>?`);
                    if (!ok) { sel.value = ''; return; }
                    try {
                        await api(`MediaMgmt/Items/${id}/ScheduleDelete?days=${days}`, { method: 'POST' });
                        renderMediaTable(body, overlay);
                    } catch (err) { alert('Failed: ' + err.message); sel.value = ''; }
                };
            });
            body.querySelectorAll('.lm-cancel-del').forEach(btn => {
                btn.onclick = async () => {
                    const ok = await showConfirm('Cancel the scheduled deletion for this item?');
                    if (!ok) return;
                    try {
                        await api(`MediaMgmt/Items/${btn.dataset.id}/CancelDelete`, { method: 'DELETE' });
                        renderMediaTable(body, overlay);
                    } catch (err) { alert('Failed: ' + err.message); }
                };
            });
        }).catch(err => {
            body.innerHTML = `<div class="lm-empty" style="padding:30px">Error: ${err.message}</div>`;
        });
    }

    // ─── Chat Panel ───────────────────────────────────────────────────────────
    const EMOJIS = ['😀','😂','❤️','👍','🎉','🔥','😎','🙏','😢','😍','🤔','👌','💯','🎬','🍿','🎭','😅','🤣','😱','🥳','✅','🎮','📺','⭐','🌟'];
    let chatTab = 'public';
    let dmTarget = null; // {id, name}

    function openChat(btnWrap) {
        if (document.getElementById('lm-chat-panel')) { closeChat(); return; }

        const panel = document.createElement('div');
        panel.id = 'lm-chat-panel';
        panel.className = 'lm-chat-panel';
        panel.innerHTML = `
            <div class="lm-chat-hdr">
                <span class="lm-chat-hdr-title">Chat</span>
                <span class="lm-chat-online" id="lm-online-count"><span class="lm-chat-online-dot"></span> — online</span>
                <button class="lm-chat-close">&times;</button>
            </div>
            <div class="lm-chat-tabs">
                <div class="lm-chat-tab active" data-tab="public" id="lm-chtab-public">Public Chat</div>
                <div class="lm-chat-tab" data-tab="dms" id="lm-chtab-dms">Direct Messages</div>
            </div>
            <div class="lm-my-code" id="lm-my-code-bar">
                My code: <strong id="lm-my-code-val" title="Click to copy">…</strong>
                <small>Share to receive DMs</small>
            </div>
            <div class="lm-chat-messages" id="lm-chat-messages"></div>
            <div class="lm-chat-input-area" id="lm-chat-input-area">
                <button class="lm-emoji-btn" id="lm-emoji-btn" title="Emoji">🙂</button>
                <input class="lm-chat-input" id="lm-chat-inp" type="text" placeholder="Type a message…" maxlength="500" autocomplete="off"/>
                <button class="lm-chat-send" id="lm-chat-send-btn" title="Send">
                    <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                </button>
            </div>`;
        btnWrap.appendChild(panel);

        // Tabs
        panel.querySelectorAll('.lm-chat-tab').forEach(t => {
            t.onclick = () => {
                panel.querySelectorAll('.lm-chat-tab').forEach(x => x.classList.remove('active'));
                t.classList.add('active');
                chatTab = t.dataset.tab;
                dmTarget = null;
                renderChat();
            };
        });

        panel.querySelector('.lm-chat-close').onclick = () => closeChat();

        const inp = panel.querySelector('#lm-chat-inp');
        panel.querySelector('#lm-chat-send-btn').onclick = () => doSend(inp.value);
        inp.addEventListener('keyup', e => { if (e.key === 'Enter') doSend(inp.value); });

        // Emoji picker
        const emojiBtn = panel.querySelector('#lm-emoji-btn');
        emojiBtn.onclick = e => { e.stopPropagation(); toggleEmojiPicker(emojiBtn, inp); };

        // My code — copy on click
        const codeVal = panel.querySelector('#lm-my-code-val');
        codeVal.onclick = () => {
            navigator.clipboard?.writeText(STATE.myCode);
            codeVal.textContent = 'Copied!';
            setTimeout(() => codeVal.textContent = STATE.myCode, 1500);
        };
        if (STATE.myCode) codeVal.textContent = STATE.myCode;
        else api('Chat/MyCode').then(r => { STATE.myCode = r.Code; codeVal.textContent = r.Code; }).catch(() => {});

        refreshOnlineCount();
        renderChat();
        onOutsideClick(btnWrap, closeChat);

        // Poll
        STATE.chatPollTimer = setInterval(() => {
            refreshOnlineCount();
            if (chatTab === 'public' && !dmTarget) renderChat();
            refreshUnreadBadge();
        }, 8000);
    }

    function closeChat() {
        const p = document.getElementById('lm-chat-panel');
        if (p) p.remove();
        if (STATE.chatPollTimer) { clearInterval(STATE.chatPollTimer); STATE.chatPollTimer = null; }
    }

    function toggleEmojiPicker(btn, inp) {
        const existing = document.getElementById('lm-emoji-picker');
        if (existing) { existing.remove(); return; }
        const picker = document.createElement('div');
        picker.id = 'lm-emoji-picker';
        picker.className = 'lm-emoji-picker';
        EMOJIS.forEach(em => {
            const s = document.createElement('span');
            s.textContent = em;
            s.onclick = e => { e.stopPropagation(); inp.value += em; inp.focus(); picker.remove(); };
            picker.appendChild(s);
        });
        btn.parentElement.appendChild(picker);
        onOutsideClick(picker, () => picker.remove());
    }

    function refreshOnlineCount() {
        api('Chat/Online').then(r => {
            const el = document.getElementById('lm-online-count');
            if (el) el.innerHTML = `<span class="lm-chat-online-dot"></span> ${r.Count} online`;
        }).catch(() => {});
    }

    function renderChat() {
        const msgs = document.getElementById('lm-chat-messages');
        const inputArea = document.getElementById('lm-chat-input-area');
        if (!msgs) return;

        // Show/hide input based on active tab
        if (inputArea) inputArea.style.display = (chatTab === 'dms' && !dmTarget) ? 'none' : 'flex';

        if (chatTab === 'public') {
            msgs.innerHTML = '<div class="lm-empty">Loading…</div>';
            api('Chat/Messages').then(data => drawBubbles(msgs, data)).catch(() => { msgs.innerHTML = '<div class="lm-empty">Could not load messages.</div>'; });

        } else if (chatTab === 'dms' && !dmTarget) {
            renderDmList(msgs);

        } else if (chatTab === 'dms' && dmTarget) {
            msgs.innerHTML = '<div class="lm-empty">Loading…</div>';
            api(`Chat/DM/${dmTarget.id}/Messages`).then(data => drawBubbles(msgs, data, true)).catch(() => { msgs.innerHTML = '<div class="lm-empty">Could not load messages.</div>'; });
        }
    }

    function renderDmList(container) {
        container.innerHTML = '<div class="lm-empty">Loading…</div>';
        const panel = document.getElementById('lm-chat-panel');
        if (!panel) return;

        // DM start input (by code)
        let startBar = document.getElementById('lm-dm-start-bar');
        if (!startBar) {
            startBar = document.createElement('div');
            startBar.id = 'lm-dm-start-bar';
            startBar.className = 'lm-dm-start';
            startBar.innerHTML = `<input id="lm-dm-code-inp" placeholder="Enter 6-char code to start DM…" maxlength="6" autocomplete="off" style="text-transform:uppercase;"/>
                <small>Ask the other person for their code (shown in their Chat panel)</small>`;
            container.parentElement.insertBefore(startBar, container);

            const codeInp = startBar.querySelector('#lm-dm-code-inp');
            codeInp.onkeyup = e => {
                if (e.key !== 'Enter') return;
                const code = codeInp.value.trim().toUpperCase();
                if (code.length !== 6) { codeInp.style.borderColor = '#c62828'; return; }
                codeInp.disabled = true;
                api(`Chat/DM/Users/ByCode/${code}`).then(user => {
                    codeInp.value = '';
                    codeInp.disabled = false;
                    dmTarget = { id: user.Id, name: user.Name };
                    startBar.remove();
                    renderChat();
                }).catch(err => {
                    codeInp.style.borderColor = '#c62828';
                    codeInp.disabled = false;
                    codeInp.placeholder = err.message.includes('404') ? 'Code not found' : 'Error: ' + err.message;
                    setTimeout(() => { codeInp.placeholder = 'Enter 6-char code to start DM…'; codeInp.style.borderColor = ''; }, 3000);
                });
            };
        }

        api('Chat/DM/Conversations').then(convos => {
            if (!convos || !convos.length) {
                container.innerHTML = '<div class="lm-empty" style="padding-top:8px;">No conversations yet.</div>';
                return;
            }
            let html = '';
            convos.forEach(c => {
                const uid = c.UserId || c.userId;
                const name = c.UserName || c.userName || 'User';
                const unread = c.UnreadCount || c.unreadCount || 0;
                html += `<div class="lm-dm-row-item" data-uid="${uid}" data-name="${escHtml(name)}">
                    ${escHtml(name)}
                    ${unread > 0 ? `<span class="lm-dm-badge">${unread}</span>` : ''}
                </div>`;
            });
            container.innerHTML = html;
            container.querySelectorAll('.lm-dm-row-item').forEach(row => {
                row.onclick = () => { dmTarget = { id: row.dataset.uid, name: row.dataset.name }; renderChat(); };
            });
        }).catch(() => { container.innerHTML = '<div class="lm-empty">Could not load conversations.</div>'; });
    }

    function drawBubbles(container, msgs, isDm = false) {
        // DM back button
        const panel = document.getElementById('lm-chat-panel');
        let backBtn = document.getElementById('lm-dm-back');
        if (isDm && dmTarget && panel) {
            if (!backBtn) {
                backBtn = document.createElement('div');
                backBtn.id = 'lm-dm-back';
                backBtn.className = 'lm-dm-back';
                backBtn.innerHTML = `← Back to conversations`;
                backBtn.onclick = () => { dmTarget = null; backBtn.remove(); renderChat(); };
                const msgArea = panel.querySelector('#lm-chat-messages');
                if (msgArea) msgArea.parentElement.insertBefore(backBtn, msgArea);
            }
        } else if (backBtn) backBtn.remove();

        if (!msgs || !Array.isArray(msgs) || msgs.length === 0) {
            container.innerHTML = '<div class="lm-empty">No messages yet.</div>';
            return;
        }
        container.innerHTML = '';
        msgs.forEach(m => {
            const sid = m.SenderId || m.senderId;
            const isOwn = String(sid) === String(STATE.userId);
            const isBroadcast = m.IsBroadcast || m.isBroadcast;
            const cls = isBroadcast ? 'broadcast' : isOwn ? 'own' : 'other';
            const name = m.SenderName || m.senderName || (isOwn ? 'You' : 'User');
            const text = m.Content || m.content || (m.Ciphertext ? '🔒 Encrypted' : '');
            const el = document.createElement('div');
            el.className = `lm-bubble ${cls}`;
            el.innerHTML = `<div class="lm-bubble-name">${escHtml(name)}</div>${escHtml(text)}`;
            container.appendChild(el);
        });
        container.scrollTop = container.scrollHeight;
    }

    async function doSend(txt) {
        if (!txt || !txt.trim()) return;
        const inp = document.getElementById('lm-chat-inp');
        if (inp) inp.value = '';
        try {
            if (chatTab === 'public') {
                await api('Chat/Messages', { method: 'POST', body: JSON.stringify({ content: txt }) });
            } else if (dmTarget) {
                await api(`Chat/DM/${dmTarget.id}/Messages`, { method: 'POST', body: JSON.stringify({ content: txt }) });
            }
            renderChat();
        } catch (e) {
            if (inp) inp.value = txt;
            alert('Send failed: ' + e.message);
        }
    }

    function refreshUnreadBadge() {
        api('Chat/DM/Conversations').then(convos => {
            const total = (convos || []).reduce((s, c) => s + (c.UnreadCount || c.unreadCount || 0), 0);
            const badge = document.getElementById('lm-chat-badge');
            if (badge) { badge.style.display = total > 0 ? 'flex' : 'none'; badge.textContent = total; }
        }).catch(() => {});
    }

    function escHtml(str) {
        return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    // ─── Injection into Jellyfin header ──────────────────────────────────────
    let injecting = false;

    async function tryInject() {
        if (STATE.injected || injecting) return;
        if (!window.ApiClient || !window.ApiClient.accessToken()) return;

        const headerRight = document.querySelector('.headerRight, .headerButtons, [class*="headerRight"]');
        if (!headerRight) return;
        if (document.getElementById('lm-btn-latest') || document.getElementById('lm-btn-manage') || document.getElementById('lm-btn-chat')) {
            STATE.injected = true;
            return;
        }

        injecting = true;
        try {
            STATE.serverUrl = (typeof ApiClient.serverAddress === 'function' ? ApiClient.serverAddress() : null) || location.origin;
            STATE.serverUrl = STATE.serverUrl.replace(/\/$/, '');
            STATE.token = ApiClient.accessToken();

            const me = await api('Users/Me');
            STATE.userId = me.Id;
            STATE.isAdmin = me.Policy?.IsAdministrator || false;

            let cfg = {};
            try { cfg = await api(`Plugins/${PLUGIN_ID}/Configuration`); } catch(e) {}
            STATE.config = cfg;

            const frag = document.createDocumentFragment();

            if (cfg.EnableLatestMediaButton !== false) {
                const b = mkHeaderBtn('lm-btn-latest', ICONS.latest, openLatestDropdown);
                frag.appendChild(b);
            }

            if (STATE.isAdmin && cfg.EnableMediaManagement !== false) {
                const b = mkHeaderBtn('lm-btn-manage', ICONS.manage, () => openMediaManagement());
                frag.appendChild(b);
            }

            if (cfg.EnableChat !== false) {
                const b = mkHeaderBtn('lm-btn-chat', ICONS.chat, (ev, wrap) => openChat(wrap));
                const badge = document.createElement('span');
                badge.id = 'lm-chat-badge';
                badge.className = 'lm-unread-badge';
                b.appendChild(badge);
                frag.appendChild(b);

                // Fetch my code eagerly
                api('Chat/MyCode').then(r => { STATE.myCode = r.Code; }).catch(() => {});
                refreshUnreadBadge();
            }

            headerRight.insertBefore(frag, headerRight.firstChild);
            STATE.injected = true;
        } catch (e) {
            console.debug('[LatestMedia] Injection deferred:', e.message);
        } finally {
            injecting = false;
        }
    }

    // SPA navigation observer
    const observer = new MutationObserver(() => {
        if (!document.getElementById('lm-btn-latest') && !document.getElementById('lm-btn-manage')) STATE.injected = false;
        tryInject();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    setInterval(() => {
        if (!document.getElementById('lm-btn-latest') && !document.getElementById('lm-btn-manage')) STATE.injected = false;
        tryInject();
    }, 3000);

    tryInject();
})();
