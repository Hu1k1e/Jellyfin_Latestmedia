(function () {
    'use strict';

    const STATE = {
        pluginId: 'A1B2C3D4-E5F6-4A5B-8C9D-0E1F2A3B4C5D',
        isAdmin: false,
        userId: '',
        userName: '',
        token: '',
        serverUrl: '',
        keys: { privateKey: null, publicKey: null },
        chatSettings: { isDisabled: false, isMuted: false },
        lastChatPoll: null,
        chatPollTimer: null,
        unreadDMs: 0
    };

    const ICONS = {
        latest: `<svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>`,
        manage: `<svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.06-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.73,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.06,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.43-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.49-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/></svg>`,
        chat: `<svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z"/></svg>`
    };

    // CSS Injection
    const style = document.createElement('style');
    style.innerHTML = `
        .lm-header-btn { display: inline-flex; align-items: center; justify-content: center; position: relative; margin-left: .5em; cursor: pointer; color: var(--theme-text-color); }
        .lm-header-btn:hover { color: var(--theme-primary-color); }
        .lm-badge { position: absolute; top: -5px; right: -5px; background: red; color: white; border-radius: 50%; padding: 2px 6px; font-size: 10px; font-weight: bold; }
        
        .lm-modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); z-index: 99999; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(5px); }
        .lm-modal { background: var(--theme-background-color); border-radius: 8px; width: 90%; max-width: 1000px; max-height: 90%; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5); border: 1px solid var(--theme-primary-color); }
        .lm-modal-hidden { display: none !important; }
        .lm-modal-header { padding: 15px 20px; border-bottom: 1px solid rgba(255,255,255,0.1); display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.2); }
        .lm-modal-header h2 { margin: 0; font-size: 1.2rem; }
        .lm-modal-close { cursor: pointer; background: transparent; border: none; color: inherit; font-size: 1.5rem; }
        .lm-modal-body { padding: 20px; overflow-y: auto; flex: 1; }
        
        /* Tables */
        .lm-table { width: 100%; border-collapse: collapse; text-align: left; }
        .lm-table th, .lm-table td { padding: 10px; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .lm-table th { background: rgba(0,0,0,0.2); }
        .lm-btn { background: var(--theme-primary-color); color: #fff; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 0.9em; }
        .lm-btn-danger { background: #e53935; }
        .lm-btn:hover { filter: brightness(1.2); }
        
        /* Dropdown */
        .lm-dropdown { position: absolute; top: 100%; right: 0; width: 350px; max-height: 500px; background: var(--theme-background-color); border: 1px solid var(--theme-primary-color); border-radius: 8px; overflow-y: auto; z-index: 9999; display: none; box-shadow: 0 5px 20px rgba(0,0,0,0.5); }
        .lm-dropdown.active { display: block; }
        .lm-card { display: flex; gap: 10px; padding: 10px; border-bottom: 1px solid rgba(255,255,255,0.05); cursor: pointer; text-decoration: none; color: inherit; }
        .lm-card:hover { background: rgba(255,255,255,0.05); }
        .lm-poster { width: 50px; height: 75px; object-fit: cover; border-radius: 4px; }
        
        /* Type Badges */
        .lm-type-badge { font-size: 0.7em; padding: 2px 6px; border-radius: 4px; color: white; font-weight: bold; }
        .lm-type-movie { background: #1976d2; }
        .lm-type-series { background: #388e3c; }
        .lm-type-anime { background: #7b1fa2; }
        
        /* Chat UI */
        .lm-chat-panel { position: fixed; right: 0; top: 0; bottom: 0; width: 350px; background: var(--theme-background-color); border-left: 1px solid var(--theme-primary-color); z-index: 99999; display: flex; flex-direction: column; transform: translateX(100%); transition: transform 0.3s ease; }
        .lm-chat-panel.open { transform: translateX(0); }
        .lm-chat-tabs { display: flex; border-bottom: 1px solid rgba(255,255,255,0.1); }
        .lm-chat-tab { flex: 1; padding: 10px; text-align: center; cursor: pointer; background: rgba(0,0,0,0.2); }
        .lm-chat-tab.active { background: var(--theme-primary-color); color: white; }
        .lm-chat-messages { flex: 1; overflow-y: auto; padding: 10px; display: flex; flex-direction: column; gap: 8px; }
        .lm-chat-bubble { max-width: 80%; padding: 8px 12px; border-radius: 12px; font-size: 0.9em; word-wrap: break-word; }
        .lm-chat-bubble.own { align-self: flex-end; background: var(--theme-primary-color); color: white; border-bottom-right-radius: 2px; }
        .lm-chat-bubble.other { align-self: flex-start; background: rgba(255,255,255,0.1); color: var(--theme-text-color); border-bottom-left-radius: 2px; }
        .lm-chat-bubble.broadcast { align-self: center; background: #fb8c00; color: white; text-align: center; }
        .lm-chat-input-area { padding: 10px; border-top: 1px solid rgba(255,255,255,0.1); display: flex; gap: 5px; }
        .lm-chat-input { flex: 1; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.2); color: inherit; padding: 8px; border-radius: 4px; }
        
        /* Responsive */
        @media (max-width: 768px) {
            .lm-header-btn { display: none !important; }
            .lm-chat-panel { width: 100%; }
        }
    `;
    document.head.appendChild(style);

    // --- API Helpers ---
    async function apiRequest(endpoint, options = {}) {
        const url = `${STATE.serverUrl}/${endpoint}`;
        const headers = {
            'Authorization': `MediaBrowser Client="Jellyfin Web", Device="Plugin", DeviceId="PluginId", Version="1.0.0", Token="${STATE.token}"`,
            'Content-Type': 'application/json'
        };
        const res = await fetch(url, { ...options, headers });
        if (!res.ok) throw new Error(`API Error: ${res.status}`);
        return res.status !== 204 ? res.json().catch(()=>({})) : {};
    }

    // --- Crypto Utils (Web Crypto API) ---
    const Crypto = {
        async init() {
            // Load from IndexedDB or generate
            const db = await this.openDb();
            const stored = await this.getKeyPair(db);
            if (stored) {
                STATE.keys = stored;
            } else {
                const kp = await window.crypto.subtle.generateKey(
                    { name: 'ECDH', namedCurve: 'P-256' }, // Fallback from X25519 if not supported in all browsers, usually P-256 is universal
                    true,
                    ['deriveKey']
                );
                
                const rawPub = await window.crypto.subtle.exportKey('raw', kp.publicKey);
                STATE.keys = { 
                    privateKey: kp.privateKey, 
                    publicKey: kp.publicKey,
                    pubBase64: this.buf2b64(rawPub)
                };
                await this.storeKeyPair(db, STATE.keys);
            }
            // Register public key with server
            try {
                await apiRequest(`Chat/Keys`, { method: 'POST', body: JSON.stringify({ publickey: STATE.keys.pubBase64 }) });
            } catch (e) { console.error("Crypto init error", e); }
        },
        async openDb() {
            return new Promise((resolve, reject) => {
                const req = indexedDB.open('JellyfinChatCrypto', 1);
                req.onupgradeneeded = e => e.target.result.createObjectStore('keys', { keyPath: 'id' });
                req.onsuccess = e => resolve(e.target.result);
                req.onerror = e => reject(e);
            });
        },
        async getKeyPair(db) {
            return new Promise((resolve) => {
                const tx = db.transaction('keys', 'readonly');
                const store = tx.objectStore('keys');
                const req = store.get('mykey');
                req.onsuccess = () => resolve(req.result ? req.result.keys : null);
            });
        },
        async storeKeyPair(db, keys) {
            return new Promise((resolve) => {
                const tx = db.transaction('keys', 'readwrite');
                tx.objectStore('keys').put({ id: 'mykey', keys });
                tx.oncomplete = resolve;
            });
        },
        async importRemoteKey(b64) {
             const raw = this.b642buf(b64);
             return await window.crypto.subtle.importKey(
                 'raw', raw, { name: 'ECDH', namedCurve: 'P-256' }, true, []
             );
        },
        async deriveAes(remotePubKey) {
            return await window.crypto.subtle.deriveKey(
                { name: 'ECDH', public: remotePubKey },
                STATE.keys.privateKey,
                { name: 'AES-GCM', length: 256 },
                false,
                ['encrypt', 'decrypt']
            );
        },
        async encrypt(text, remotePubB64) {
            const remoteKey = await this.importRemoteKey(remotePubB64);
            const aesKey = await this.deriveAes(remoteKey);
            const iv = window.crypto.getRandomValues(new Uint8Array(12));
            const enc = new TextEncoder().encode(text);
            const ciphertext = await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, aesKey, enc);
            return { cipherResult: this.buf2b64(ciphertext), nonce: this.buf2b64(iv) };
        },
        async decrypt(cipherB64, nonceB64, remotePubB64) {
            try {
                const remoteKey = await this.importRemoteKey(remotePubB64);
                const aesKey = await this.deriveAes(remoteKey);
                const iv = this.b642buf(nonceB64);
                const cipher = this.b642buf(cipherB64);
                const dec = await window.crypto.subtle.decrypt({ name: 'AES-GCM', iv }, aesKey, cipher);
                return new TextDecoder().decode(dec);
            } catch (e) {
                return "[Decryption Failed]";
            }
        },
        buf2b64(buf) { return btoa(String.fromCharCode(...new Uint8Array(buf))); },
        b642buf(b64) { return Uint8Array.from(atob(b64), c => c.charCodeAt(0)).buffer; }
    };

    // --- UI Builders ---

    function createHeaderButton(id, icon, onClick) {
        const btn = document.createElement('div');
        btn.className = 'lm-header-btn plugin-header-btn headerButton';
        btn.id = id;
        btn.innerHTML = icon;
        btn.addEventListener('click', onClick);
        return btn;
    }

    // Modal Builder
    function showModal(title, contentHtml, onRender) {
        const overlay = document.createElement('div');
        overlay.className = 'lm-modal-overlay';
        overlay.innerHTML = `
            <div class="lm-modal">
                <div class="lm-modal-header">
                    <h2>${title}</h2>
                    <button class="lm-modal-close">&times;</button>
                </div>
                <div class="lm-modal-body">${contentHtml}</div>
            </div>
        `;
        document.body.appendChild(overlay);
        overlay.querySelector('.lm-modal-close').onclick = () => overlay.remove();
        if (onRender) onRender(overlay.querySelector('.lm-modal-body'), overlay);
    }

    // --- Features ---

    const LatestMediaUI = {
        async openDropdown(btn) {
            let drop = document.getElementById('lm-latest-dropdown');
            if (drop) { drop.classList.toggle('active'); return; }
            
            drop = document.createElement('div');
            drop.id = 'lm-latest-dropdown';
            drop.className = 'lm-dropdown active';
            drop.innerHTML = `<div style="padding:15px;text-align:center;">Loading...</div>`;
            btn.appendChild(drop);

            // Fetch data
            try {
                const items = await apiRequest('LatestMedia/Items');
                drop.innerHTML = '';
                items.forEach(item => {
                    const tag = item.type.toLowerCase();
                    const tagClass = tag === 'movie' ? 'lm-type-movie' : tag === 'anime' ? 'lm-type-anime' : 'lm-type-series';
                    const diff = Math.floor((new Date() - new Date(item.dateAdded)) / 86400000);
                    const timeAgo = diff === 0 ? 'Today' : `${diff}d ago`;

                    const a = document.createElement('a');
                    a.className = 'lm-card';
                    a.href = `#!/details?id=${item.id}`;
                    a.innerHTML = `
                        <img class="lm-poster" src="${STATE.serverUrl}${item.posterUrl}" />
                        <div style="flex:1; display:flex; flex-direction:column; justify-content:center;">
                            <strong style="margin-bottom:5px;">${item.title} (${item.productionYear || '?'})</strong>
                            <div><span class="lm-type-badge ${tagClass}">${item.type}</span> <span style="font-size:0.8em;opacity:0.7">${timeAgo}</span></div>
                        </div>
                    `;
                    a.onclick = () => drop.classList.remove('active');
                    drop.appendChild(a);
                });
            } catch (e) {
                drop.innerHTML = `<div style="padding:15px;">Failed to load</div>`;
            }
        }
    };

    const MediaMgmtUI = {
        async openAdminModal() {
            showModal('Media Management', 'Loading items...', async (body) => {
                try {
                    const items = await apiRequest('MediaMgmt/Items');
                    let html = `<table class="lm-table"><thead><tr><th>Title</th><th>Year</th><th>Size (MB)</th><th>Status</th><th>Actions</th></tr></thead><tbody>`;
                    items.forEach(i => {
                        const sizeMb = (i.size / 1024 / 1024).toFixed(2);
                        html += `<tr>
                            <td>${i.title}</td>
                            <td>${i.year || '-'}</td>
                            <td>${sizeMb}</td>
                            <td>${i.status}</td>
                            <td>
                                ${i.status === 'Active' ? 
                                `<select class="lm-schedule-sel" data-id="${i.id}">
                                    <option value="">Schedule Delete...</option>
                                    <option value="1">Empty Trash in 1 Day</option>
                                    <option value="7">Empty Trash in 7 Days</option>
                                    <option value="30">Empty Trash in 30 Days</option>
                                </select>` 
                                : `<button class="lm-btn lm-btn-danger lm-cancel-del" data-id="${i.id}">Cancel</button>`}
                            </td>
                        </tr>`;
                    });
                    html += `</tbody></table>`;
                    body.innerHTML = html;

                    // Attach events
                    body.querySelectorAll('.lm-schedule-sel').forEach(sel => {
                        sel.onchange = async (e) => {
                            const days = e.target.value;
                            if (!days) return;
                            await apiRequest(`MediaMgmt/Items/${e.target.dataset.id}/ScheduleDelete?days=${days}`, { method: 'POST' });
                            MediaMgmtUI.openAdminModal(); // Refresh
                        };
                    });
                    body.querySelectorAll('.lm-cancel-del').forEach(btn => {
                        btn.onclick = async (e) => {
                            await apiRequest(`MediaMgmt/Items/${e.target.dataset.id}/CancelDelete`, { method: 'DELETE' });
                            MediaMgmtUI.openAdminModal(); // Refresh
                        };
                    });
                } catch(e) { body.innerHTML = "Access Denied or Request Failed."; }
            });
        }
    };

    const ChatUI = {
        panel: null,
        mode: 'public', // public | obj (DM target)
        init() {
            this.panel = document.createElement('div');
            this.panel.className = 'lm-chat-panel';
            this.panel.innerHTML = `
                <div class="lm-chat-tabs">
                    <div class="lm-chat-tab active" id="lm-tab-public">Public Chat</div>
                    <div class="lm-chat-tab" id="lm-tab-dms">DMs</div>
                    <div class="lm-modal-close" id="lm-chat-close" style="padding:10px;">&times;</div>
                </div>
                <div class="lm-chat-messages" id="lm-chat-view"></div>
                <div class="lm-chat-input-area">
                    <input type="text" class="lm-chat-input" id="lm-chat-input" placeholder="Type a message..." />
                    <button class="lm-btn" id="lm-chat-send">Send</button>
                    ${STATE.isAdmin ? '<button class="lm-btn lm-btn-danger" id="lm-chat-broadcast">B-Cast</button>' : ''}
                </div>
            `;
            document.body.appendChild(this.panel);

            document.getElementById('lm-chat-close').onclick = () => this.panel.classList.remove('open');
            document.getElementById('lm-tab-public').onclick = () => this.switchTab('public');
            document.getElementById('lm-tab-dms').onclick = () => this.switchTab('dms');
            
            const inp = document.getElementById('lm-chat-input');
            const snd = document.getElementById('lm-chat-send');
            const bct = document.getElementById('lm-chat-broadcast');
            
            snd.onclick = () => this.sendMessage(inp.value);
            inp.onkeypress = (e) => { if(e.key === 'Enter') this.sendMessage(inp.value); };
            if (bct) bct.onclick = () => this.sendBroadcast(inp.value);

            // Fetch DMs to populate unread badge initially
            this.updateBadge();
            // Start polling
            if (!STATE.chatPollTimer) {
                STATE.chatPollTimer = setInterval(() => this.poll(), 5000);
            }
        },
        toggle() {
            if (!this.panel) this.init();
            this.panel.classList.toggle('open');
            if (this.panel.classList.contains('open')) this.render();
        },
        switchTab(target) {
            this.mode = target;
            document.getElementById('lm-tab-public').classList.toggle('active', target === 'public');
            document.getElementById('lm-tab-dms').classList.toggle('active', target === 'dms');
            this.render();
        },
        async render() {
            const view = document.getElementById('lm-chat-view');
            
            if (this.mode === 'public') {
                const msgs = await apiRequest('Chat/Messages');
                this.drawBubbles(view, msgs, m => m.content, m => m.isBroadcast);
            } else if (this.mode === 'dms') {
                const convos = await apiRequest('Chat/DM/Conversations');
                let html = `<div style="padding:10px;"><input type="text" id="lm-dm-search" class="lm-chat-input" placeholder="Search user to DM..." style="width:100%" /></div>`;
                convos.forEach(c => {
                    const fw = c.unreadCount > 0 ? "bold" : "normal";
                    html += `<div class="lm-card lm-dm-thread" data-id="${c.userId}" data-name="${c.userName}" style="font-weight:${fw}">
                        ${c.userName} ${c.unreadCount > 0 ? `<span class="lm-badge" style="position:static; margin-left:10px;">${c.unreadCount}</span>` : ''}
                    </div>`;
                });
                view.innerHTML = html;

                document.getElementById('lm-dm-search').onkeypress = async (e) => {
                    if (e.key === 'Enter') {
                        const users = await apiRequest(`Chat/DM/Users?query=${e.target.value}`);
                        if (users.length > 0) this.openDm(users[0]);
                        else alert("User not found");
                    }
                };

                view.querySelectorAll('.lm-dm-thread').forEach(el => {
                    el.onclick = () => this.openDm({id: el.dataset.id, name: el.dataset.name});
                });
            } else if (typeof this.mode === 'object') {
                // Inside a DM
                view.innerHTML = `<div style="padding:5px; text-align:center; opacity:0.7;">Chatting with ${this.mode.name}. E2E Encrypted.</div>`;
                const msgs = await apiRequest(`Chat/DM/${this.mode.id}/Messages`);
                
                // Fetch target public key
                const pkRes = await apiRequest(`Chat/Keys/${this.mode.id}`);
                const targetPubBase64 = pkRes.publicKey;

                // Decrypt
                for (let m of msgs) {
                    if (m.senderId === STATE.userId) {
                        m.plaintext = await Crypto.decrypt(m.ciphertext, m.nonce, m.senderPublicKey); // wait, sender is me, so I decrypt with my own key? No, I decrypt with the target's public key because the ECDH shared secret is identical.
                    } else {
                        m.plaintext = await Crypto.decrypt(m.ciphertext, m.nonce, m.senderPublicKey);
                    }
                }
                
                this.drawBubbles(view, msgs, m => m.plaintext);
            }
        },
        drawBubbles(container, msgs, getTxt, isBcast = ()=>false) {
            msgs.forEach(m => {
                const isOwn = m.senderId === STATE.userId;
                const cls = isBcast(m) ? 'broadcast' : (isOwn ? 'own' : 'other');
                const b = document.createElement('div');
                b.className = `lm-chat-bubble ${cls}`;
                b.innerHTML = `<div style="font-size:0.7em;opacity:0.7">${m.senderName || 'Anonymous'}</div>` + getTxt(m);
                container.appendChild(b);
            });
            container.scrollTop = container.scrollHeight;
        },
        async sendMessage(txt) {
            if (!txt.trim()) return;
            const inp = document.getElementById('lm-chat-input');
            inp.value = '';

            if (this.mode === 'public') {
                await apiRequest('Chat/Messages', { method: 'POST', body: JSON.stringify({ content: txt }) });
            } else if (typeof this.mode === 'object') {
                const pkRes = await apiRequest(`Chat/Keys/${this.mode.id}`);
                const { cipherResult, nonce } = await Crypto.encrypt(txt, pkRes.publicKey);
                await apiRequest(`Chat/DM/${this.mode.id}/Messages`, {
                    method: 'POST',
                    body: JSON.stringify({
                        ciphertext: cipherResult,
                        nonce: nonce,
                        senderPublicKey: STATE.keys.pubBase64
                    })
                });
            }
            this.render();
        },
        async sendBroadcast(txt) {
            if (!txt.trim()) return;
            document.getElementById('lm-chat-input').value = '';
            await apiRequest('Chat/Broadcast', { method: 'POST', body: JSON.stringify({ content: txt }) });
            if (this.mode === 'public') this.render();
        },
        openDm(user) {
            this.mode = user;
            this.render();
        },
        async poll() {
            // Update unread badges
            const convos = await apiRequest('Chat/DM/Conversations');
            if (convos && convos.length !== undefined) {
                const unread = convos.reduce((a,c) => a + c.unreadCount, 0);
                const badge = document.getElementById('lm-chat-badge');
                if (badge) badge.style.display = unread > 0 ? 'inline-block' : 'none';
                if (badge) badge.innerText = unread;
            }
            if (this.panel && this.panel.classList.contains('open')) {
                this.render();
            }
        },
        async updateBadge() { this.poll(); }
    };

    // --- Core Injector ---
    async function init() {
        console.log("Latest Media & Management Init");

        // Try getting API Token and Url
        STATE.serverUrl = ApiClient.serverAddress();
        STATE.token = ApiClient.accessToken();

        // Get Current User info
        try {
            const me = await apiRequest('Users/Me');
            STATE.isAdmin = me.Policy.IsAdministrator;
            STATE.userId = me.Id;
            STATE.userName = me.Name;
        } catch(e) { console.error("Could not fetch user info"); return; }

        await Crypto.init();

        function inject() {
            const target = document.querySelector('.headerRight');
            if (!target) return;
            if (document.getElementById('lm-btn-latest')) return; // Already injected

            const bLatest = createHeaderButton('lm-btn-latest', ICONS.latest, (e) => LatestMediaUI.openDropdown(bLatest));
            target.insertBefore(bLatest, target.firstChild);

            if (STATE.isAdmin) {
                const bManage = createHeaderButton('lm-btn-manage', ICONS.manage, () => MediaMgmtUI.openAdminModal());
                target.insertBefore(bManage, target.firstChild);
            }

            const bChat = createHeaderButton('lm-btn-chat', ICONS.chat, () => ChatUI.toggle());
            const badge = document.createElement('span');
            badge.id = 'lm-chat-badge';
            badge.className = 'lm-badge';
            badge.style.display = 'none';
            bChat.appendChild(badge);
            target.insertBefore(bChat, target.firstChild);
        }

        // SPA Navigation watch
        const observer = new MutationObserver(() => inject());
        observer.observe(document.body, { childList: true, subtree: true });
        inject();
    }

    const startIntv = setInterval(() => {
        if (window.ApiClient && document.querySelector('.headerRight')) {
            clearInterval(startIntv);
            init();
        }
    }, 500);

})();
