/* ================================================================
 * Her Lens 好友 & 用户主页模块
 * 依赖：Supabase JS（index.html 已加载）、friendships 表（见 supabase_friends.sql）
 * 入口：
 *   - 用户菜单「👥 好友」「🗂 我的主页」
 *   - 点击游戏评论区用户名 → 打开对方主页
 * ================================================================ */
(function () {
    var SUPABASE_URL = 'https://tydbvpmigvzsnlmsjuby.supabase.co';
    var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5ZGJ2cG1pZ3Z6c25sbXNqdWJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3MjkwMTIsImV4cCI6MjA5NzMwNTAxMn0.AyMX8M24S3biHmmE2DMEPk9Ti93w0VHooQl5ox5YL2g';

    var sb = null;
    try {
        if (typeof supabase !== 'undefined') sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } catch (e) { sb = null; }

    var meId = null;

    function esc(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

    var toastTimer = null;
    function toast(msg) {
        var el = document.getElementById('herlensFriendsToast');
        if (!el) {
            el = document.createElement('div');
            el.id = 'herlensFriendsToast';
            el.style.cssText = 'position:fixed;left:50%;bottom:80px;transform:translateX(-50%) translateY(20px);z-index:100001;background:rgba(20,14,38,0.92);color:#f0e9ff;padding:10px 22px;border-radius:24px;font-size:0.85rem;box-shadow:0 6px 24px rgba(0,0,0,0.35);opacity:0;transition:all .35s ease;pointer-events:none;max-width:86vw;text-align:center;';
            document.body.appendChild(el);
        }
        el.textContent = msg;
        requestAnimationFrame(function () { el.style.opacity = '1'; el.style.transform = 'translateX(-50%) translateY(0)'; });
        if (toastTimer) clearTimeout(toastTimer);
        toastTimer = setTimeout(function () { el.style.opacity = '0'; el.style.transform = 'translateX(-50%) translateY(20px)'; }, 2600);
    }

    /* ================= 身份与资料查询 ================= */

    async function getProfileRow(userId) {
        if (!sb || !userId) return null;
        try {
            var r = await sb.from('user_profiles')
                .select('user_id,display_name,custom_id,avatar_url')
                .eq('user_id', userId).maybeSingle();
            if (!r.error && r.data) return r.data;
        } catch (e) {}
        return null;
    }

    async function profilesByIds(ids) {
        var map = {};
        if (!sb || !ids || !ids.length) return map;
        var uniq = Array.from(new Set(ids.filter(Boolean)));
        if (!uniq.length) return map;
        try {
            var r = await sb.from('user_profiles')
                .select('user_id,display_name,custom_id,avatar_url')
                .in('user_id', uniq);
            if (!r.error && r.data) r.data.forEach(function (p) { map[p.user_id] = p; });
        } catch (e) {}
        return map;
    }

    /* 从评论区冗余字段兜底取身份 */
    async function identityFromReviews(userId) {
        if (!sb || !userId) return null;
        try {
            var r = await sb.from('user_reviews')
                .select('display_name,avatar_url,custom_id,user_id')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();
            if (!r.error && r.data) return r.data;
        } catch (e) {}
        return null;
    }

    function displayNameOf(info) {
        return (info && (info.display_name || info.custom_id)) ? (info.display_name || '@' + info.custom_id) : '神秘玩家';
    }
    function avatarHtmlOf(info, size) {
        size = size || 56;
        var url = info && info.avatar_url;
        if (url) {
            return '<img src="' + esc(url) + '" alt="" referrerpolicy="no-referrer" style="width:' + size + 'px;height:' + size + 'px;border-radius:50%;object-fit:cover;" />';
        }
        var ch = esc(displayNameOf(info).charAt(0));
        return '<div style="width:' + size + 'px;height:' + size + 'px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#9b8abd,#6a5490);color:#fff;font-weight:800;font-size:' + Math.round(size * 0.4) + 'px;">' + ch + '</div>';
    }

    /* ================= 好友关系操作 ================= */

    async function getFriendshipWith(otherId) {
        if (!sb || !meId) return null;
        try {
            var r = await sb.from('friendships')
                .select('*')
                .or('requester_id.eq.' + meId + ',addressee_id.eq.' + meId);
            if (r.error) return null;
            var found = null;
            (r.data || []).forEach(function (row) {
                if ((row.requester_id === otherId || row.addressee_id === otherId) &&
                    !(row.requester_id === meId && row.addressee_id === meId)) {
                    if (row.requester_id === otherId || row.addressee_id === otherId) found = row;
                }
            });
            return found;
        } catch (e) { return null; }
    }

    async function sendFriendRequest(otherId) {
        if (!sb || !meId) { toast('请先登录'); return false; }
        var existing = await getFriendshipWith(otherId);
        if (existing) {
            if (existing.status === 'accepted') { toast('你们已经是好友了'); return false; }
            if (existing.status === 'pending') {
                if (existing.addressee_id === meId) {
                    var ok = await respondFriendship(existing.id, true);
                    if (ok) toast('已通过对方的好友申请 🎉');
                    return ok;
                }
                toast('申请已发送，等待对方确认');
                return false;
            }
            if (existing.status === 'blocked') { toast('无法添加该用户'); return false; }
        }
        var r = await sb.from('friendships')
            .insert({ requester_id: meId, addressee_id: otherId, status: 'pending' });
        if (r.error) { toast('发送失败：' + (r.error.message || '未知错误')); return false; }
        toast('✅ 好友申请已发送');
        return true;
    }

    async function respondFriendship(rowId, accept) {
        var r = await sb.from('friendships')
            .update({ status: accept ? 'accepted' : 'blocked', updated_at: new Date().toISOString() })
            .eq('id', rowId);
        if (r.error) { toast('操作失败'); return false; }
        return true;
    }

    async function removeFriendship(rowId) {
        var r = await sb.from('friendships').delete().eq('id', rowId);
        if (r.error) { toast('删除失败'); return false; }
        return true;
    }

    async function loadAllFriendships() {
        if (!sb || !meId) return [];
        try {
            var r = await sb.from('friendships')
                .select('*')
                .or('requester_id.eq.' + meId + ',addressee_id.eq.' + meId)
                .order('created_at', { ascending: false });
            return r.error ? [] : (r.data || []);
        } catch (e) { return []; }
    }

    /* ================= UI：样式注入 ================= */

    var CSS = [
        '.comment-name[data-user-id]:not([data-user-id=""]),.comment-reply-item-name[data-user-id]:not([data-user-id=""]),.mod-comment-name[data-user-id]:not([data-user-id=""]),.mod-reply-item-name[data-user-id]:not([data-user-id=""]){cursor:pointer;}',
        '.comment-name[data-user-id]:not([data-user-id=""]):hover,.comment-reply-item-name[data-user-id]:not([data-user-id=""]):hover,.mod-comment-name[data-user-id]:not([data-user-id=""]):hover,.mod-reply-item-name[data-user-id]:not([data-user-id=""]):hover{color:var(--accent);text-decoration:underline;}',
        '#friendsModalOverlay .modal,#profileModalOverlay2 .modal{max-width:520px;}',
        '#profileModalOverlay2{z-index:1100;}',
        '.frd-tabs{display:flex;gap:4px;margin-bottom:14px;flex-wrap:wrap;}',
        '.frd-tab{flex:1;min-width:72px;padding:8px 4px;border-radius:10px;border:none;background:var(--input-bg);color:var(--text3);font-size:.78rem;cursor:pointer;font-family:inherit;}',
        '.frd-tab.active{background:var(--accent);color:#fff;font-weight:700;}',
        '.frd-list{display:flex;flex-direction:column;gap:8px;max-height:320px;overflow-y:auto;}',
        '.frd-item{display:flex;align-items:center;gap:10px;padding:9px 12px;border:1px solid var(--border);border-radius:12px;background:var(--input-bg);}',
        '.frd-item .fi-info{flex:1;min-width:0;text-align:left;}',
        '.frd-item .fi-name{font-size:.85rem;font-weight:600;color:var(--text);cursor:pointer;}',
        '.frd-item .fi-name:hover{color:var(--accent);}',
        '.frd-item .fi-sub{font-size:.7rem;color:var(--text3);margin-top:1px;}',
        '.frd-mini-btn{padding:5px 12px;border-radius:14px;border:1px solid var(--accent);background:transparent;color:var(--accent);font-size:.72rem;cursor:pointer;font-family:inherit;white-space:nowrap;}',
        '.frd-mini-btn:hover{background:var(--accent);color:#fff;}',
        '.frd-mini-btn.danger{border-color:var(--danger,#e53935);color:var(--danger,#e53935);}',
        '.frd-mini-btn.danger:hover{background:var(--danger,#e53935);color:#fff;}',
        '.frd-empty{text-align:center;color:var(--text3);font-size:.8rem;padding:26px 0;}',
        '.frd-search-row{display:flex;gap:8px;margin-bottom:12px;}',
        '.frd-search-row input{flex:1;padding:9px 14px;border-radius:12px;border:1px solid var(--border);background:var(--input-bg);color:var(--text);font-size:.82rem;outline:none;font-family:inherit;}',
        '.frd-search-row input:focus{border-color:var(--accent);}',
        '.prof-head{display:flex;align-items:center;gap:14px;margin-bottom:16px;text-align:left;}',
        '.prof-stats{display:flex;gap:8px;margin-bottom:16px;}',
        '.prof-stat{flex:1;padding:10px 6px;border-radius:12px;background:var(--input-bg);text-align:center;}',
        '.prof-stat b{display:block;font-size:1.15rem;color:var(--accent);}',
        '.prof-stat span{font-size:.68rem;color:var(--text3);}',
        '.prof-review{padding:10px 14px;border:1px solid var(--border);border-radius:12px;margin-bottom:8px;text-align:left;}',
        '.prof-review .pr-game{font-size:.78rem;font-weight:700;color:var(--accent);margin-bottom:3px;}',
        '.prof-review .pr-text{font-size:.78rem;color:var(--text2);line-height:1.6;}',
        '.prof-review .pr-stars{color:#e8b64c;font-size:.74rem;}'
    ].join('\n');

    function injectStyle() {
        if (document.getElementById('herlensFriendsCSS')) return;
        var st = document.createElement('style');
        st.id = 'herlensFriendsCSS';
        st.textContent = CSS;
        document.head.appendChild(st);
    }

    /* ================= UI：弹窗骨架 ================= */

    function ensureModals() {
        if (document.getElementById('profileModalOverlay2')) return;

        var prof = document.createElement('div');
        prof.className = 'modal-overlay';
        prof.id = 'profileModalOverlay2';
        prof.innerHTML =
            '<div class="modal" style="max-width:520px;">' +
                '<button class="modal-close" id="profCloseBtn">✕</button>' +
                '<div id="profBody" style="text-align:center;"></div>' +
            '</div>';
        document.body.appendChild(prof);

        var frd = document.createElement('div');
        frd.className = 'modal-overlay';
        frd.id = 'friendsModalOverlay';
        frd.innerHTML =
            '<div class="modal" style="max-width:520px;">' +
                '<button class="modal-close" id="frdCloseBtn">✕</button>' +
                '<h2 style="text-align:center;margin-bottom:14px;">👥 好友</h2>' +
                '<div class="frd-tabs">' +
                    '<button class="frd-tab active" data-t="list">我的好友</button>' +
                    '<button class="frd-tab" data-t="inbox">收到的申请<span id="frdInboxBadge"></span></button>' +
                    '<button class="frd-tab" data-t="outbox">发出的申请</button>' +
                    '<button class="frd-tab" data-t="find">找朋友</button>' +
                '</div>' +
                '<div id="frdPanel"></div>' +
            '</div>';
        document.body.appendChild(frd);

        prof.addEventListener('click', function (e) { if (e.target === prof) prof.classList.remove('show'); });
        frd.addEventListener('click', function (e) { if (e.target === frd) frd.classList.remove('show'); });
        document.getElementById('profCloseBtn').addEventListener('click', function () { prof.classList.remove('show'); });
        document.getElementById('frdCloseBtn').addEventListener('click', function () { frd.classList.remove('show'); });

        frd.querySelectorAll('.frd-tab').forEach(function (t) {
            t.addEventListener('click', function () {
                frd.querySelectorAll('.frd-tab').forEach(function (x) { x.classList.remove('active'); });
                t.classList.add('active');
                renderFriendsTab(t.getAttribute('data-t'));
            });
        });
    }

    /* ================= 用户主页 ================= */

    async function openProfile(userId) {
        ensureModals();
        var body = document.getElementById('profBody');
        var ov = document.getElementById('profileModalOverlay2');
        ov.classList.add('show');
        body.innerHTML = '<div style="padding:30px;color:var(--text3);font-size:.85rem;">加载中…</div>';

        if (!sb) { body.innerHTML = '<div style="padding:30px;color:var(--text3);">数据库未连接</div>'; return; }

        var info = await getProfileRow(userId);
        if (!info) info = await identityFromReviews(userId);

        var reviewCount = 0;
        try {
            var c = await sb.from('user_reviews')
                .select('id', { count: 'exact', head: true })
                .eq('user_id', userId);
            if (!c.error && c.count != null) reviewCount = c.count;
        } catch (e) {}

        var recent = [];
        var titleMap = {};
        try {
            var rr = await sb.from('user_reviews')
                .select('game_id,verdict,comment,created_at')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(5);
            if (!rr.error) recent = rr.data || [];
            var gids = recent.map(function (x) { return x.game_id; }).filter(Boolean);
            if (gids.length) {
                var gg = await sb.from('games').select('id,title').in('id', gids);
                if (!gg.error) (gg.data || []).forEach(function (g) { titleMap[g.id] = g.title; });
            }
        } catch (e) {}

        var isMe = meId && meId === userId;
        var actionHtml = '';
        if (!isMe && meId) {
            actionHtml = '<button class="btn btn-accent" id="profAddFriend" style="width:100%;padding:10px;margin-top:14px;">＋ 加好友</button>';
        } else if (!meId) {
            actionHtml = '<div style="font-size:.72rem;color:var(--text3);margin-top:14px;">登录后可以添加好友</div>';
        }

        var reviewsHtml = recent.length
            ? recent.map(function (rv) {
                var stars = rv.verdict ? '<span class="pr-stars">' + '★'.repeat(rv.verdict) + '☆'.repeat(Math.max(0, 5 - rv.verdict)) + '</span>' : '';
                var title = titleMap[rv.game_id] ? esc(titleMap[rv.game_id]) : ('游戏 #' + rv.game_id);
                var link = rv.game_id ? '<a href="index.html?game=' + encodeURIComponent(rv.game_id) + '" target="_blank" style="text-decoration:none;">' + title + ' ↗</a>' : title;
                return '<div class="prof-review"><div class="pr-game">' + link + ' ' + stars + '</div>' +
                    (rv.comment ? '<div class="pr-text">' + esc(String(rv.comment).slice(0, 120)) + '</div>' : '') +
                    '</div>';
            }).join('')
            : '<div class="frd-empty">还没有公开的评价</div>';

        body.innerHTML =
            '<div class="prof-head">' +
                avatarHtmlOf(info, 64) +
                '<div><div style="font-size:1.15rem;font-weight:800;color:var(--text);">' + esc(displayNameOf(info)) + '</div>' +
                (info && info.custom_id ? '<div style="font-size:.76rem;color:var(--text3);margin-top:2px;">@' + esc(info.custom_id) + '</div>' : '') +
                '</div>' +
            '</div>' +
            '<div class="prof-stats">' +
                '<div class="prof-stat"><b>' + reviewCount + '</b><span>评价数</span></div>' +
            '</div>' +
            '<div style="text-align:left;"><div style="font-size:.8rem;font-weight:700;color:var(--accent);margin-bottom:8px;">📝 最近评价</div>' + reviewsHtml + '</div>' +
            actionHtml;

        var addBtn = document.getElementById('profAddFriend');
        if (addBtn) {
            addBtn.addEventListener('click', async function () {
                addBtn.disabled = true;
                var ok = await sendFriendRequest(userId);
                if (ok) addBtn.textContent = '✓ 已发送申请';
                else addBtn.disabled = false;
            });
        }
    }

    /* ================= 好友管理弹窗 ================= */

    var currentTab = 'list';

    function openFriends() {
        ensureModals();
        document.getElementById('friendsModalOverlay').classList.add('show');
        renderFriendsTab(currentTab || 'list');
    }

    function requireLogin() {
        if (!meId) {
            document.getElementById('frdPanel').innerHTML =
                '<div class="frd-empty">请先登录后使用好友功能<br><span style="font-size:.68rem;">右上角「登录」→ 注册 / 登录</span></div>';
            return false;
        }
        return true;
    }

    async function renderFriendsTab(tab) {
        currentTab = tab;
        var panel = document.getElementById('frdPanel');
        if (!requireLogin()) return;
        panel.innerHTML = '<div class="frd-empty">加载中…</div>';

        var rows = await loadAllFriendships();
        var otherIds = rows.map(function (r) { return r.requester_id === meId ? r.addressee_id : r.requester_id; });
        var profiles = await profilesByIds(otherIds);

        function rowHtml(r, actionsHtml) {
            var otherId = r.requester_id === meId ? r.addressee_id : r.requester_id;
            var p = profiles[otherId];
            return '<div class="frd-item" data-uid="' + esc(otherId) + '">' +
                avatarHtmlOf(p, 40) +
                '<div class="fi-info"><div class="fi-name" data-open-profile="' + esc(otherId) + '">' + esc(displayNameOf(p)) + '</div>' +
                (p && p.custom_id ? '<div class="fi-sub">@' + esc(p.custom_id) + '</div>' : '') + '</div>' +
                actionsHtml + '</div>';
        }

        var badge = document.getElementById('frdInboxBadge');
        if (badge) {
            var inboxCount = rows.filter(function (r) { return r.status === 'pending' && r.addressee_id === meId; }).length;
            badge.textContent = inboxCount ? '(' + inboxCount + ')' : '';
            badge.style.color = 'var(--danger)';
        }

        var html = '';

        if (tab === 'list') {
            var friends = rows.filter(function (r) { return r.status === 'accepted'; });
            html = friends.length
                ? '<div class="frd-list">' + friends.map(function (r) {
                    return rowHtml(r, '<button class="frd-mini-btn danger" data-del="' + r.id + '">删除</button>');
                }).join('') + '</div>'
                : '<div class="frd-empty">还没有好友，去「找朋友」发现姊妹吧</div>';
        }
        else if (tab === 'inbox') {
            var inbox = rows.filter(function (r) { return r.status === 'pending' && r.addressee_id === meId; });
            html = inbox.length
                ? '<div class="frd-list">' + inbox.map(function (r) {
                    return rowHtml(r,
                        '<button class="frd-mini-btn" data-accept="' + r.id + '">✓ 通过</button>' +
                        '<button class="frd-mini-btn danger" data-reject="' + r.id + '">✕</button>');
                }).join('') + '</div>'
                : '<div class="frd-empty">暂无新申请</div>';
        }
        else if (tab === 'outbox') {
            var outbox = rows.filter(function (r) { return r.status === 'pending' && r.requester_id === meId; });
            html = outbox.length
                ? '<div class="frd-list">' + outbox.map(function (r) {
                    return rowHtml(r, '<button class="frd-mini-btn danger" data-del="' + r.id + '">撤回</button>');
                }).join('') + '</div>'
                : '<div class="frd-empty">没有待处理的申请</div>';
        }
        else if (tab === 'find') {
            html =
                '<div class="frd-search-row">' +
                    '<input type="text" id="frdSearchInput" placeholder="输入对方的昵称或专属ID…" />' +
                    '<button class="frd-mini-btn" id="frdSearchBtn" style="padding:8px 16px;">搜索</button>' +
                '</div>' +
                '<div id="frdSearchResult"><div class="frd-empty">昵称全站唯一，精确匹配即可找到她</div></div>';
        }

        panel.innerHTML = html;

        /* 事件绑定 */
        panel.querySelectorAll('[data-accept]').forEach(function (b) {
            b.addEventListener('click', async function () {
                b.disabled = true;
                if (await respondFriendship(b.getAttribute('data-accept'), true)) { toast('🎉 已添加好友'); }
                renderFriendsTab(tab);
            });
        });
        panel.querySelectorAll('[data-reject]').forEach(function (b) {
            b.addEventListener('click', async function () {
                b.disabled = true;
                await respondFriendship(b.getAttribute('data-reject'), false);
                renderFriendsTab(tab);
            });
        });
        panel.querySelectorAll('[data-del]').forEach(function (b) {
            b.addEventListener('click', async function () {
                b.disabled = true;
                await removeFriendship(b.getAttribute('data-del'));
                renderFriendsTab(tab);
            });
        });
        panel.querySelectorAll('[data-open-profile]').forEach(function (n) {
            n.addEventListener('click', function () {
                openProfile(n.getAttribute('data-open-profile'));
            });
        });

        var searchBtn = document.getElementById('frdSearchBtn');
        if (searchBtn) {
            searchBtn.addEventListener('click', doSearch);
            document.getElementById('frdSearchInput').addEventListener('keydown', function (e) {
                if (e.key === 'Enter') doSearch();
            });
        }

        async function doSearch() {
            var q = document.getElementById('frdSearchInput').value.trim().replace(/^@/, '');
            var box = document.getElementById('frdSearchResult');
            if (!q) { box.innerHTML = '<div class="frd-empty">请输入昵称或专属ID</div>'; return; }
            box.innerHTML = '<div class="frd-empty">搜索中…</div>';

            var found = null;
            try {
                var byName = await sb.from('user_profiles')
                    .select('user_id,display_name,custom_id,avatar_url')
                    .eq('display_name', q).limit(1);
                if (!byName.error && byName.data && byName.data.length) found = byName.data[0];
                if (!found) {
                    var byCid = await sb.from('user_profiles')
                        .select('user_id,display_name,custom_id,avatar_url')
                        .eq('custom_id', q).limit(1);
                    if (!byCid.error && byCid.data && byCid.data.length) found = byCid.data[0];
                }
            } catch (e) {}

            if (!found || !found.user_id) {
                box.innerHTML = '<div class="frd-empty">没有找到这位玩家</div>';
                return;
            }
            if (found.user_id === meId) {
                box.innerHTML = '<div class="frd-empty">这是你自己呀 🙂</div>';
                return;
            }

            var rel = await getFriendshipWith(found.user_id);
            var btnHtml = '';
            if (!rel) btnHtml = '<button class="frd-mini-btn" data-add="' + found.user_id + '">＋ 加好友</button>';
            else if (rel.status === 'accepted') btnHtml = '<span style="font-size:.72rem;color:var(--text3);">已是好友</span>';
            else if (rel.status === 'pending') {
                btnHtml = rel.addressee_id === meId
                    ? '<button class="frd-mini-btn" data-add="' + found.user_id + '">✓ 对方想加你，通过</button>'
                    : '<span style="font-size:.72rem;color:var(--text3);">等待对方确认</span>';
            }
            else if (rel.status === 'blocked') btnHtml = '<span style="font-size:.72rem;color:var(--text3);">无法添加</span>';

            box.innerHTML =
                '<div class="frd-item">' + avatarHtmlOf(found, 40) +
                    '<div class="fi-info"><div class="fi-name" data-open-profile="' + esc(found.user_id) + '">' + esc(displayNameOf(found)) + '</div>' +
                    (found.custom_id ? '<div class="fi-sub">@' + esc(found.custom_id) + '</div>' : '') + '</div>' +
                    btnHtml +
                '</div>';

            var addB = box.querySelector('[data-add]');
            if (addB) {
                addB.addEventListener('click', async function () {
                    addB.disabled = true;
                    await sendFriendRequest(addB.getAttribute('data-add'));
                    doSearch();
                });
            }
            var nameEl = box.querySelector('[data-open-profile]');
            if (nameEl) nameEl.addEventListener('click', function () { openProfile(found.user_id); });
        }
    }

    /* ================= 用户菜单注入 ================= */

    function injectDropdownItems(inner) {
        if (!inner || inner.querySelector('#extFriendsItem')) return;
        var friendsItem = document.createElement('div');
        friendsItem.id = 'extFriendsItem';
        friendsItem.className = 'nav-user-dropdown-item';
        friendsItem.innerHTML = '<span class="item-icon">👥</span> 好友';
        friendsItem.addEventListener('click', function (e) {
            e.stopPropagation();
            document.getElementById('navUserDropdown').classList.remove('show');
            openFriends();
        });

        var mineItem = document.createElement('div');
        mineItem.id = 'extMyProfileItem';
        mineItem.className = 'nav-user-dropdown-item';
        mineItem.innerHTML = '<span class="item-icon">🗂️</span> 我的主页';
        mineItem.addEventListener('click', function (e) {
            e.stopPropagation();
            document.getElementById('navUserDropdown').classList.remove('show');
            if (meId) openProfile(meId); else toast('请先登录');
        });

        inner.insertBefore(friendsItem, inner.firstChild);
        inner.insertBefore(mineItem, friendsItem);
    }

    /* ================= 全局初始化 ================= */

    function init() {
        injectStyle();
        ensureModals();

        if (sb) {
            sb.auth.getUser().then(function (r) { meId = r && r.data && r.data.user ? r.data.user.id : null; }).catch(function () {});
            try {
                sb.auth.onAuthStateChange(function (_evt, session) {
                    meId = session && session.user ? session.user.id : null;
                });
            } catch (e) {}
        }

        // 用户菜单追加项
        var inner = document.getElementById('navUserDropdownInner');
        if (inner && window.MutationObserver) {
            new MutationObserver(function () { injectDropdownItems(inner); }).observe(inner, { childList: true });
            injectDropdownItems(inner);
        }

        // 评论区用户名点击 → 主页
        var NAME_SELECTOR = '.comment-name[data-user-id],.comment-reply-item-name[data-user-id],.mod-comment-name[data-user-id],.mod-reply-item-name[data-user-id]';
        document.addEventListener('click', function (e) {
            var nameEl = e.target.closest && e.target.closest(NAME_SELECTOR);
            if (nameEl && nameEl.getAttribute('data-user-id')) {
                openProfile(nameEl.getAttribute('data-user-id'));
            }
        });

        // Esc 关闭
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') {
                var p = document.getElementById('profileModalOverlay2');
                var f = document.getElementById('friendsModalOverlay');
                if (p) p.classList.remove('show');
                if (f) f.classList.remove('show');
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    window.openHerlensProfile = openProfile;
    window.openHerlensFriends = openFriends;
})();
