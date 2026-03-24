(function () {
    'use strict';

    // ─── Constants ────────────────────────────────────────────────────────────
    const PLUGIN_ID = 'f94d6caf-2a62-4dd7-9f64-684ce8efff43';

    const ICONS = {
        latest: `<svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>`,
        manage: `<svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.06-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.73,8.87C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.06,0.94l-2.03,1.58c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.43-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.49-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/></svg>`,
        chat:   `<svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z"/></svg>`
    };

    // ─── State ────────────────────────────────────────────────────────────────
    const STATE = {
        serverUrl: '',
        token: '',
        userId: '',
        isAdmin: false,
        config: { EnableLatestMediaButton: true, EnableMediaManagement: true, EnableChat: true },
        keys: { privateKey: null, publicKey: null, pubBase64: null },
        injected: false,
        chatPollTimer: null
    };

    // ─── Styles ───────────────────────────────────────────────────────────────
    const style = document.createElement('style');
    style.innerHTML = `
        /* Header buttons — equidistant spacing */
        .lm-btn-wrap {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            position: relative;
            width: 40px;
            height: 40px;
            cursor: pointer;
            color: inherit;
            flex-shrink: 0;
        }
        .lm-btn-wrap:hover { color: var(--theme-custom-header-text-color, var(--primary-text-color)); opacity: 0.8; }
        .lm-unread-badge {
            position: absolute;
            top: 2px; right: 2px;
            background: #e53935;
            color: #fff;
            border-radius: 50%;
            min-width: 16px;
            height: 16px;
            font-size: 10px;
            font-weight: 700;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0 3px;
            pointer-events: none;
            display: none;
        }

        /* Latest Media dropdown */
        .lm-dropdown {
            position: absolute;
            top: calc(100% + 8px);
            right: 0;
            width: 340px;
            max-height: 480px;
            overflow-y: auto;
            background: rgba(30,30,30,0.97);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(255,255,255,0.12);
            border-radius: 10px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.6);
            z-index: 9999;
            display: none;
        }
        .lm-dropdown.open { display: block; }
        .lm-dropdown-header {
            padding: 12px 16px 8px;
            font-size: 0.75em;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            opacity: 0.5;
            border-bottom: 1px solid rgba(255,255,255,0.08);
        }
        .lm-card {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 10px 14px;
            border-bottom: 1px solid rgba(255,255,255,0.05);
            cursor: pointer;
            text-decoration: none;
            color: inherit;
            transition: background 0.15s;
        }
        .lm-card:hover { background: rgba(255,255,255,0.07); }
        .lm-card:last-child { border-bottom: none; }
        .lm-poster { width: 42px; height: 63px; object-fit: cover; border-radius: 4px; background: rgba(255,255,255,0.05); flex-shrink: 0; }
        .lm-card-meta { flex: 1; min-width: 0; }
        .lm-card-title { font-size: 0.9em; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .lm-card-sub { font-size: 0.75em; opacity: 0.55; margin-top: 3px; display: flex; gap: 8px; align-items: center; }
        .lm-type-badge {
            font-size: 0.68em; font-weight: 700; padding: 1px 5px;
            border-radius: 3px; color: #fff; text-transform: uppercase; letter-spacing: 0.04em;
        }
        .lm-type-movie  { background: #1565c0; }
        .lm-type-series { background: #2e7d32; }
        .lm-type-anime  { background: #6a1b9a; }
        .lm-type-other  { background: #555;    }
        .lm-empty { padding: 24px; text-align: center; opacity: 0.5; font-size: 0.9em; }

        /* Admin modal */
        .lm-modal-overlay {
            position: fixed; inset: 0;
            background: rgba(0,0,0,0.75);
            backdrop-filter: blur(4px);
            z-index: 99998;
            display: flex; align-items: center; justify-content: center;
        }
        .lm-modal {
            background: var(--theme-background-color, #1a1a1a);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 10px;
            width: 92%; max-width: 1000px; max-height: 88vh;
            display: flex; flex-direction: column;
            overflow: hidden;
            box-shadow: 0 20px 60px rgba(0,0,0,0.7);
        }
        .lm-modal-hdr {
            display: flex; align-items: center; justify-content: space-between;
            padding: 16px 20px;
            border-bottom: 1px solid rgba(255,255,255,0.08);
            background: rgba(255,255,255,0.03);
        }
        .lm-modal-hdr h2 { margin: 0; font-size: 1.1rem; }
        .lm-modal-close {
            cursor: pointer; background: none; border: none;
            color: inherit; font-size: 1.4rem; line-height: 1; opacity: 0.6;
        }
        .lm-modal-close:hover { opacity: 1; }
        .lm-modal-body { padding: 0; overflow-y: auto; flex: 1; }
        .lm-table { width: 100%; border-collapse: collapse; font-size: 0.88em; }
        .lm-table th { padding: 10px 14px; text-align: left; background: rgba(0,0,0,0.2); font-weight: 600; position: sticky; top: 0; }
        .lm-table td { padding: 10px 14px; border-bottom: 1px solid rgba(255,255,255,0.04); vertical-align: middle; }
        .lm-table tr:hover td { background: rgba(255,255,255,0.03); }
        .lm-btn { display: inline-block; background: var(--theme-primary-color, #00a4dc); color: #fff; border: none; padding: 5px 12px; border-radius: 4px; cursor: pointer; font-size: 0.85em; white-space: nowrap; }
        .lm-btn-danger { background: #c62828; }
        .lm-btn:hover { filter: brightness(1.15); }
        .lm-select { background: rgba(255,255,255,0.07); color: inherit; border: 1px solid rgba(255,255,255,0.15); border-radius: 4px; padding: 4px 8px; font-size: 0.84em; cursor: pointer; }

        /* Chat panel — bottom-right, translucent */
        .lm-chat-panel {
            position: fixed;
            bottom: 0; right: 20px;
            width: 340px;
            height: 500px;
            max-height: 70vh;
            background: rgba(25, 25, 35, 0.88);
            backdrop-filter: blur(18px) saturate(1.3);
            -webkit-backdrop-filter: blur(18px) saturate(1.3);
            border: 1px solid rgba(255,255,255,0.12);
            border-bottom: none;
            border-radius: 12px 12px 0 0;
            box-shadow: 0 -4px 40px rgba(0,0,0,0.5);
            display: flex;
            flex-direction: column;
            z-index: 9997;
            transform: translateY(100%);
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            overflow: hidden;
        }
        .lm-chat-panel.open { transform: translateY(0); }

        .lm-chat-titlebar {
            display: flex;
            align-items: center;
            padding: 10px 14px;
            background: rgba(255,255,255,0.05);
            border-bottom: 1px solid rgba(255,255,255,0.08);
            cursor: pointer; /* drag affordance */
            user-select: none;
            flex-shrink: 0;
        }
        .lm-chat-titlebar-title { flex: 1; font-size: 0.88em; font-weight: 600; }
        .lm-chat-title-close { cursor: pointer; background: none; border: none; color: inherit; font-size: 1.2rem; opacity: 0.6; line-height: 1; }
        .lm-chat-title-close:hover { opacity: 1; }

        .lm-chat-tabs { display: flex; border-bottom: 1px solid rgba(255,255,255,0.08); flex-shrink: 0; }
        .lm-chat-tab {
            flex: 1; padding: 8px 10px;
            text-align: center; cursor: pointer;
            font-size: 0.8em; font-weight: 600;
            color: rgba(255,255,255,0.5);
            border-bottom: 2px solid transparent;
            transition: all 0.2s;
        }
        .lm-chat-tab:hover { color: rgba(255,255,255,0.8); }
        .lm-chat-tab.active { color: var(--theme-primary-color, #00a4dc); border-bottom-color: var(--theme-primary-color, #00a4dc); }

        .lm-chat-messages {
            flex: 1;
            overflow-y: auto;
            padding: 10px;
            display: flex;
            flex-direction: column;
            gap: 6px;
            scrollbar-width: thin;
            scrollbar-color: rgba(255,255,255,0.15) transparent;
        }
        .lm-chat-messages::-webkit-scrollbar { width: 4px; }
        .lm-chat-messages::-webkit-scrollbar-track { background: transparent; }
        .lm-chat-messages::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 2px; }

        .lm-bubble { max-width: 82%; padding: 7px 12px; border-radius: 16px; font-size: 0.85em; line-height: 1.4; word-wrap: break-word; }
        .lm-bubble.own { align-self: flex-end; background: var(--theme-primary-color, #00a4dc); color: #fff; border-bottom-right-radius: 4px; }
        .lm-bubble.other { align-self: flex-start; background: rgba(255,255,255,0.12); color: inherit; border-bottom-left-radius: 4px; }
        .lm-bubble.broadcast { align-self: center; background: rgba(230,130,0,0.8); color: #fff; text-align: center; border-radius: 8px; max-width: 95%; }
        .lm-bubble-name { font-size: 0.72em; opacity: 0.65; margin-bottom: 3px; }

        .lm-chat-input-area {
            display: flex;
            gap: 6px;
            padding: 8px 10px;
            border-top: 1px solid rgba(255,255,255,0.08);
            flex-shrink: 0;
            background: rgba(0,0,0,0.15);
        }
        .lm-chat-input {
            flex: 1;
            background: rgba(255,255,255,0.09);
            border: 1px solid rgba(255,255,255,0.15);
            border-radius: 20px;
            color: inherit;
            padding: 7px 14px;
            font-size: 0.85em;
            outline: none;
        }
        .lm-chat-input:focus { border-color: var(--theme-primary-color, #00a4dc); }
        .lm-chat-send {
            background: var(--theme-primary-color, #00a4dc);
            color: #fff; border: none; border-radius: 50%;
            width: 32px; height: 32px;
            cursor: pointer; display: flex; align-items: center; justify-content: center;
            flex-shrink: 0;
        }
        .lm-chat-send:hover { filter: brightness(1.15); }

        .lm-dm-row {
            display: flex; align-items: center; gap: 10px;
            padding: 9px 12px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 0.85em;
            transition: background 0.15s;
        }
        .lm-dm-row:hover { background: rgba(255,255,255,0.07); }
        .lm-dm-badge {
            margin-left: auto;
            background: #e53935;
            color: #fff;
            font-size: 0.7em;
            font-weight: 700;
            border-radius: 10px;
            padding: 1px 6px;
        }

        @media (max-width: 767px) {
            .lm-btn-wrap { display: none !important; }
            .lm-chat-panel { width: 100%; right: 0; border-radius: 12px 12px 0 0; }
        }
    `;
    document.head.appendChild(style);

    // ─── Helper: API request ──────────────────────────────────────────────────
    async function api(endpoint, options = {}) {
        const url = `${STATE.serverUrl}/${endpoint}`;
        const res = await fetch(url, {
            ...options,
            headers: {
                'Authorization': `MediaBrowser Client="Jellyfin Web", Device="Plugin", DeviceId="PluginUI1", Version="1.0.0", Token="${STATE.token}"`,
                'Content-Type': 'application/json',
                ...(options.headers || {})
            }
        });
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        const text = await res.text();
        return text ? JSON.parse(text) : {};
    }

    // ─── Helper: create header button ────────────────────────────────────────
    function mkHeaderBtn(id, icon, onClick) {
        const wrap = document.createElement('div');
        wrap.className = 'lm-btn-wrap';
        wrap.id = id;
        wrap.innerHTML = icon;
        wrap.addEventListener('click', (e) => { e.stopPropagation(); onClick(e, wrap); });
        return wrap;
    }

    // ─── Latest Media dropdown ────────────────────────────────────────────────
    let latestDropdown = null;

    function openLatestMedia(e, btn) {
        // Toggle
        if (latestDropdown && latestDropdown.parentNode) {
            const isOpen = latestDropdown.classList.contains('open');
            latestDropdown.classList.toggle('open', !isOpen);
            return;
        }

        latestDropdown = document.createElement('div');
        latestDropdown.className = 'lm-dropdown open';
        latestDropdown.innerHTML = `<div class="lm-empty">Loading…</div>`;
        btn.appendChild(latestDropdown);

        // Close on outside click
        setTimeout(() => {
            document.addEventListener('click', function closeHandler(ev) {
                if (!latestDropdown.contains(ev.target) && ev.target !== btn) {
                    latestDropdown.classList.remove('open');
                    document.removeEventListener('click', closeHandler);
                }
            });
        }, 100);

        api('LatestMedia/Items').then(items => {
            if (!items || !items.length) {
                latestDropdown.innerHTML = `<div class="lm-empty">No recent media found.</div>`;
                return;
            }
            let html = `<div class="lm-dropdown-header">Recently Added</div>`;
            items.forEach(item => {
                const t = (item.Type || '').toLowerCase();
                const cls = t === 'movie' ? 'lm-type-movie' : t === 'anime' ? 'lm-type-anime' : t === 'series' ? 'lm-type-series' : 'lm-type-other';
                const label = item.Type || 'Other';
                const diff = item.DateAdded ? Math.floor((Date.now() - new Date(item.DateAdded)) / 86400000) : null;
                const age = diff === null ? '' : diff === 0 ? 'Today' : `${diff}d ago`;
                const year = item.ProductionYear ? ` (${item.ProductionYear})` : '';
                const poster = `${STATE.serverUrl}/Items/${item.Id}/Images/Primary?fillWidth=90&quality=75`;
                html += `
                    <a class="lm-card" href="#!/details?id=${item.Id}">
                        <img class="lm-poster" loading="lazy" src="${poster}" onerror="this.style.visibility='hidden'"/>
                        <div class="lm-card-meta">
                            <div class="lm-card-title">${item.Title || item.Name || 'Unknown'}${year}</div>
                            <div class="lm-card-sub">
                                <span class="lm-type-badge ${cls}">${label}</span>
                                ${age ? `<span>${age}</span>` : ''}
                            </div>
                        </div>
                    </a>`;
            });
            latestDropdown.innerHTML = html;
            latestDropdown.querySelectorAll('.lm-card').forEach(a => {
                a.addEventListener('click', () => latestDropdown.classList.remove('open'));
            });
        }).catch(err => {
            latestDropdown.innerHTML = `<div class="lm-empty">Failed to load: ${err.message}</div>`;
        });
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
                <div class="lm-modal-body">
                    <div class="lm-empty" style="padding:30px;">Loading…</div>
                </div>
            </div>`;
        document.body.appendChild(overlay);
        overlay.querySelector('.lm-modal-close').onclick = () => overlay.remove();
        overlay.addEventListener('click', ev => { if (ev.target === overlay) overlay.remove(); });

        const body = overlay.querySelector('.lm-modal-body');
        loadMediaManagement(body, overlay);
    }

    function loadMediaManagement(body, overlay) {
        api('MediaMgmt/Items').then(items => {
            if (!items || !items.length) {
                body.innerHTML = `<div class="lm-empty" style="padding:30px;">No media items found.</div>`;
                return;
            }
            let html = `
                <table class="lm-table">
                    <thead><tr>
                        <th>Title</th><th>Year</th><th>Size (MB)</th><th>Status</th><th>Actions</th>
                    </tr></thead>
                    <tbody>`;
            items.forEach(i => {
                const sizeMb = i.Size ? (i.Size / 1048576).toFixed(1) : '—';
                const isScheduled = i.Status && i.Status !== 'Active';
                const statusText = i.Status || 'Active';
                html += `<tr>
                    <td>${i.Title || '—'}</td>
                    <td>${i.Year || '—'}</td>
                    <td>${sizeMb}</td>
                    <td>${statusText}</td>
                    <td>${isScheduled
                        ? `<button class="lm-btn lm-btn-danger lm-cancel-del" data-id="${i.Id}">Cancel</button>`
                        : `<select class="lm-select lm-schedule-sel" data-id="${i.Id}">
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
            html += `</tbody></table>`;
            body.innerHTML = html;

            body.querySelectorAll('.lm-schedule-sel').forEach(sel => {
                sel.onchange = async (e) => {
                    if (!e.target.value) return;
                    try {
                        await api(`MediaMgmt/Items/${e.target.dataset.id}/ScheduleDelete?days=${e.target.value}`, { method: 'POST' });
                        loadMediaManagement(body, overlay);
                    } catch (err) { alert('Failed: ' + err.message); }
                };
            });
            body.querySelectorAll('.lm-cancel-del').forEach(btn => {
                btn.onclick = async (e) => {
                    try {
                        await api(`MediaMgmt/Items/${e.target.dataset.id}/CancelDelete`, { method: 'DELETE' });
                        loadMediaManagement(body, overlay);
                    } catch (err) { alert('Failed: ' + err.message); }
                };
            });
        }).catch(err => {
            body.innerHTML = `<div class="lm-empty" style="padding:30px;">Access denied or error: ${err.message}</div>`;
        });
    }

    // ─── Chat Panel ───────────────────────────────────────────────────────────
    const Chat = {
        panel: null,
        activeTab: 'public',   // 'public' | {userId, name}
        init() {
            if (this.panel) return;
            this.panel = document.createElement('div');
            this.panel.className = 'lm-chat-panel';
            this.panel.innerHTML = `
                <div class="lm-chat-titlebar">
                    <span class="lm-chat-titlebar-title">💬 Chat</span>
                    <button class="lm-chat-title-close">&times;</button>
                </div>
                <div class="lm-chat-tabs">
                    <div class="lm-chat-tab active" data-tab="public">Public Chat</div>
                    <div class="lm-chat-tab" data-tab="dms">Direct Messages</div>
                </div>
                <div class="lm-chat-messages" id="lm-chat-messages"></div>
                <div class="lm-chat-input-area">
                    <input class="lm-chat-input" id="lm-chat-inp" type="text" placeholder="Type a message…" maxlength="500"/>
                    <button class="lm-chat-send" id="lm-chat-send-btn" title="Send">
                        <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                    </button>
                    ${STATE.isAdmin ? `<button class="lm-btn lm-btn-danger" id="lm-broadcast-btn" style="border-radius:4px;font-size:0.72em;" title="Broadcast to all">📢</button>` : ''}
                </div>`;
            document.body.appendChild(this.panel);

            this.panel.querySelector('.lm-chat-title-close').onclick = () => this.close();

            this.panel.querySelectorAll('.lm-chat-tab').forEach(tab => {
                tab.onclick = () => {
                    this.panel.querySelectorAll('.lm-chat-tab').forEach(t => t.classList.remove('active'));
                    tab.classList.add('active');
                    this.activeTab = tab.dataset.tab;
                    this.render();
                };
            });

            const inp = this.panel.querySelector('#lm-chat-inp');
            this.panel.querySelector('#lm-chat-send-btn').onclick = () => this.send(inp.value);
            inp.addEventListener('keyup', e => { if (e.key === 'Enter') this.send(inp.value); });

            const bcast = this.panel.querySelector('#lm-broadcast-btn');
            if (bcast) bcast.onclick = () => this.broadcast(inp.value);

            this.startPolling();
        },

        open() {
            this.init();
            this.panel.classList.add('open');
            this.render();
        },
        close() {
            if (this.panel) this.panel.classList.remove('open');
        },
        toggle() {
            if (!this.panel || !this.panel.classList.contains('open')) this.open();
            else this.close();
        },

        async render() {
            const view = this.panel.querySelector('#lm-chat-messages');
            if (!view) return;

            if (this.activeTab === 'public') {
                try {
                    const msgs = await api('Chat/Messages');
                    this.drawBubbles(view, msgs, m => m.Content || m.content, m => m.IsBroadcast || m.isBroadcast);
                } catch { view.innerHTML = '<div class="lm-empty">Could not load messages.</div>'; }

            } else if (this.activeTab === 'dms') {
                try {
                    const convos = await api('Chat/DM/Conversations');
                    if (!convos.length) {
                        view.innerHTML = `
                            <div style="padding:10px;">
                                <input id="lm-dm-search" class="lm-chat-input" style="width:100%;border-radius:8px;" placeholder="Search users to DM…" />
                            </div>
                            <div class="lm-empty" style="padding-top:0;">No conversations yet.</div>`;
                    } else {
                        let html = `<div style="padding:10px;"><input id="lm-dm-search" class="lm-chat-input" style="width:100%;border-radius:8px;" placeholder="Search users to DM…" /></div>`;
                        convos.forEach(c => {
                            html += `<div class="lm-dm-row" data-uid="${c.UserId || c.userId}" data-name="${c.UserName || c.userName || 'User'}">
                                ${c.UserName || c.userName || 'User'}
                                ${(c.UnreadCount || c.unreadCount) > 0 ? `<span class="lm-dm-badge">${c.UnreadCount || c.unreadCount}</span>` : ''}
                            </div>`;
                        });
                        view.innerHTML = html;
                        view.querySelectorAll('.lm-dm-row').forEach(row => {
                            row.onclick = () => { this.activeTab = { userId: row.dataset.uid, name: row.dataset.name }; this.render(); };
                        });
                    }
                    const srch = view.querySelector('#lm-dm-search');
                    if (srch) {
                        srch.onkeypress = async e => {
                            if (e.key !== 'Enter') return;
                            try {
                                const users = await api(`Chat/DM/Users?query=${encodeURIComponent(e.target.value)}`);
                                if (users.length) { this.activeTab = { userId: users[0].Id || users[0].id, name: users[0].Name || users[0].name }; this.render(); }
                                else alert('User not found.');
                            } catch (err) { alert(err.message); }
                        };
                    }
                } catch { view.innerHTML = '<div class="lm-empty">Could not load DMs.</div>'; }

            } else if (typeof this.activeTab === 'object') {
                // DM thread view
                view.innerHTML = `<div class="lm-empty" style="padding:8px 12px;font-size:0.75em;">DM with <b>${this.activeTab.name}</b> — E2E encrypted</div>`;
                try {
                    const msgs = await api(`Chat/DM/${this.activeTab.userId}/Messages`);
                    this.drawBubbles(view, msgs, m => `[encrypted] ${m.Ciphertext ? '🔒' : m.ciphertext ? '🔒' : m.Content || m.content}`, () => false);
                } catch { view.innerHTML += '<div class="lm-empty">Could not load messages.</div>'; }
            }
        },

        drawBubbles(container, msgs, getText, isBroadcast = () => false) {
            if (!Array.isArray(msgs) || !msgs.length) {
                const existing = container.querySelector('.lm-empty');
                if (!existing) container.innerHTML = '<div class="lm-empty">No messages yet.</div>';
                return;
            }
            // Only replace content bubbles, keep search box at top if present
            const search = container.querySelector('#lm-dm-search, input');
            const keepEl = search ? search.parentElement : null;
            container.innerHTML = '';
            if (keepEl) container.appendChild(keepEl);

            msgs.forEach(m => {
                const senderId = m.SenderId || m.senderId;
                const isOwn = senderId === STATE.userId;
                const bcast = isBroadcast(m);
                const cls = bcast ? 'broadcast' : isOwn ? 'own' : 'other';
                const div = document.createElement('div');
                div.className = `lm-bubble ${cls}`;
                div.innerHTML = `<div class="lm-bubble-name">${m.SenderName || m.senderName || (isOwn ? 'You' : 'User')}</div>${getText(m)}`;
                container.appendChild(div);
            });
            container.scrollTop = container.scrollHeight;
        },

        async send(txt) {
            if (!txt || !txt.trim()) return;
            const inp = this.panel.querySelector('#lm-chat-inp');
            inp.value = '';
            try {
                if (this.activeTab === 'public') {
                    await api('Chat/Messages', { method: 'POST', body: JSON.stringify({ content: txt }) });
                } else if (typeof this.activeTab === 'object') {
                    await api(`Chat/DM/${this.activeTab.userId}/Messages`, { method: 'POST', body: JSON.stringify({ content: txt }) });
                }
                this.render();
            } catch (e) { inp.value = txt; alert('Send failed: ' + e.message); }
        },

        async broadcast(txt) {
            if (!txt || !txt.trim()) return;
            const inp = this.panel.querySelector('#lm-chat-inp');
            inp.value = '';
            try {
                await api('Chat/Broadcast', { method: 'POST', body: JSON.stringify({ content: txt }) });
                this.render();
            } catch (e) { inp.value = txt; alert('Broadcast failed: ' + e.message); }
        },

        async updateBadge() {
            try {
                const convos = await api('Chat/DM/Conversations');
                const unread = convos.reduce((s, c) => s + (c.UnreadCount || c.unreadCount || 0), 0);
                const badge = document.getElementById('lm-chat-badge');
                if (badge) { badge.style.display = unread > 0 ? 'flex' : 'none'; badge.textContent = unread; }
            } catch { }
        },

        startPolling() {
            if (STATE.chatPollTimer) return;
            STATE.chatPollTimer = setInterval(() => {
                this.updateBadge();
                if (this.panel && this.panel.classList.contains('open')) this.render();
            }, 8000);
        }
    };

    // ─── E2E Crypto (stub – not blocking injection) ───────────────────────────
    async function initCrypto() {
        try {
            const kp = await window.crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveKey']);
            const raw = await window.crypto.subtle.exportKey('raw', kp.publicKey);
            const b64 = btoa(String.fromCharCode(...new Uint8Array(raw)));
            STATE.keys = { privateKey: kp.privateKey, publicKey: kp.publicKey, pubBase64: b64 };
            await api('Chat/Keys', { method: 'POST', body: JSON.stringify({ publickey: b64 }) });
        } catch (e) {
            console.debug('[LatestMedia] Crypto init skipped:', e.message);
        }
    }

    // ─── Injection ────────────────────────────────────────────────────────────
    let injecting = false;

    async function tryInject() {
        if (STATE.injected || injecting) return;
        if (!window.ApiClient || !window.ApiClient.accessToken()) return;

        const headerRight = document.querySelector('.headerRight, .headerButtons, .headerButton-right, [class*="headerRight"]');
        if (!headerRight) return;
        if (document.getElementById('lm-btn-latest')) { STATE.injected = true; return; }

        injecting = true;
        try {
            STATE.serverUrl = (ApiClient.serverAddress ? ApiClient.serverAddress() : location.origin).replace(/\/$/, '');
            STATE.token = ApiClient.accessToken();

            const me = await api('Users/Me');
            STATE.userId = me.Id;
            STATE.isAdmin = me.Policy && me.Policy.IsAdministrator;

            STATE.config = await api(`Plugins/${PLUGIN_ID}/Configuration`);

            const frag = document.createDocumentFragment();

            if (STATE.config.EnableLatestMediaButton) {
                const b = mkHeaderBtn('lm-btn-latest', ICONS.latest, openLatestMedia);
                frag.appendChild(b);
            }

            if (STATE.isAdmin && STATE.config.EnableMediaManagement) {
                const b = mkHeaderBtn('lm-btn-manage', ICONS.manage, () => openMediaManagement());
                frag.appendChild(b);
            }

            if (STATE.config.EnableChat) {
                const b = mkHeaderBtn('lm-btn-chat', ICONS.chat, () => Chat.toggle());
                const badge = document.createElement('span');
                badge.id = 'lm-chat-badge';
                badge.className = 'lm-unread-badge';
                b.appendChild(badge);
                frag.appendChild(b);
                initCrypto();
            }

            // Prepend to headerRight so our buttons sit next to existing ones
            headerRight.insertBefore(frag, headerRight.firstChild);
            STATE.injected = true;

        } catch (e) {
            console.debug('[LatestMedia] Injection deferred:', e.message);
        } finally {
            injecting = false;
        }
    }

    // Watch for DOM changes (Jellyfin is a SPA)
    const observer = new MutationObserver(() => tryInject());
    observer.observe(document.body, { childList: true, subtree: true });

    // Also poll in case SPA navigation replaces the header
    setInterval(() => {
        if (!document.getElementById('lm-btn-latest')) STATE.injected = false;
        tryInject();
    }, 3000);

    tryInject();
})();
