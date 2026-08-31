(function () {
    'use strict';

    var SUPABASE_URL = 'https://tydbvpmigvzsnlmsjuby.supabase.co';
    var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5ZGJ2cG1pZ3Z6c25sbXNqdWJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3MjkwMTIsImV4cCI6MjA5NzMwNTAxMn0.AyMX8M24S3biHmmE2DMEPk9Ti93w0VHooQl5ox5YL2g';
    var SUPABASE_ENABLED = SUPABASE_URL.indexOf('supabase.co') >= 0 && SUPABASE_ANON_KEY.length > 10;

    var supabaseClient = null;
    if (SUPABASE_ENABLED && typeof supabase !== 'undefined') {
        try {
            supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
                auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
            });
            var ind = document.getElementById('syncIndicator');
            if (ind) ind.textContent = '● 已连接 Supabase';
        } catch (e) {
            supabaseClient = null;
            var ind2 = document.getElementById('syncIndicator');
            if (ind2) { ind2.textContent = '● 未连接'; ind2.classList.add('offline'); }
        }
    }

    var LOCAL_KEY = 'herlens_bloggers_cache';
    var bloggers = [];
    var editingId = null;
    var tagCollections = { tags: [], subCategories: [], keywords: [] };
    var platforms = [];
    var featuredWorks = [];

    function esc(s) {
        return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function hue(name) {
        var h = 0;
        for (var i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
        return h;
    }

    function showStatus(msg, type) {
        var bar = document.getElementById('statusBar');
        if (!bar) return;
        bar.textContent = msg;
        bar.className = 'status-bar show ' + (type || 'info');
        setTimeout(function () { bar.className = 'status-bar'; }, 2500);
    }

    function loadFromLocal() {
        try {
            var raw = localStorage.getItem(LOCAL_KEY);
            if (raw) bloggers = JSON.parse(raw) || [];
        } catch (e) { bloggers = []; }
    }

    function saveToLocal() {
        try { localStorage.setItem(LOCAL_KEY, JSON.stringify(bloggers)); } catch (e) {}
    }

    async function loadFromCloud() {
        if (!supabaseClient) return false;
        try {
            var { data, error } = await supabaseClient
                .from('bloggers')
                .select('id, data, updated_at')
                .order('updated_at', { ascending: false });
            if (error) throw error;
            if (!data) return false;
            bloggers = data.map(function (row) {
                var b = row.data || {};
                if (!b.id) b.id = row.id;
                return b;
            });
            saveToLocal();
            renderBloggerList();
            showStatus('已从云端同步 ' + bloggers.length + ' 位博主', 'success');
            return true;
        } catch (e) {
            console.warn('[Cloud] 读取博主失败:', e);
            showStatus('云端读取失败: ' + (e.message || e), 'error');
            return false;
        }
    }

    async function upsertBlogger(b) {
        if (!supabaseClient) return false;
        try {
            var { error } = await supabaseClient
                .from('bloggers')
                .upsert({ id: b.id, data: b, updated_at: new Date().toISOString() }, { onConflict: 'id' });
            if (error) throw error;
            return true;
        } catch (e) {
            console.warn('[Cloud] 保存博主失败:', e);
            return false;
        }
    }

    async function deleteBloggerCloud(id) {
        if (!supabaseClient) return false;
        try {
            var { error } = await supabaseClient.from('bloggers').delete().eq('id', id);
            if (error) throw error;
            return true;
        } catch (e) {
            console.warn('[Cloud] 删除博主失败:', e);
            return false;
        }
    }

    function renderBloggerList() {
        var list = document.getElementById('bloggerList');
        if (!bloggers.length) {
            list.innerHTML = '<div class="empty-state"><div class="icon">📭</div><div>暂无博主数据，前往「手动录入」或「批量导入」添加</div></div>';
            document.getElementById('bloggerCount').textContent = '';
            return;
        }
        document.getElementById('bloggerCount').textContent = '共 ' + bloggers.length + ' 位';

        var html = '';
        bloggers.forEach(function (b) {
            var avText = esc(b.avatarText || (b.name || '').charAt(0));
            var h = hue(b.name || '?');
            var bg = 'linear-gradient(135deg,hsl(' + h + ',50%,60%),hsl(' + ((h + 45) % 360) + ',55%,48%))';
            var avatarHtml;
            if (b.avatarUrl) {
                avatarHtml = '<div class="blogger-avatar" style="background:' + (b.avatarUrl.indexOf('data:') === 0 ? 'transparent' : bg) + ';padding:0;"><img src="' + esc(b.avatarUrl) + '" style="width:100%;height:100%;object-fit:cover;border-radius:inherit;" onerror="this.style.display=\'none\';this.parentNode.style.background=\'' + bg + '\';this.parentNode.innerHTML=\'' + avText + '\'"></div>' + '</div>';
            } else {
                avatarHtml = '<div class="blogger-avatar" style="background:' + bg + '">' + avText + '</div>';
            }
            var tagsHtml = '';
            if (b.mainCategory) tagsHtml += '<span class="blogger-tag">' + esc(b.mainCategory) + '</span>';
            (b.subCategories || []).slice(0, 2).forEach(function (t) {
                tagsHtml += '<span class="blogger-tag">' + esc(t) + '</span>';
            });
            var platformLabels = (b.platforms || []).map(function (p) { return esc(p.label); }).join(' · ');
            html += '<div class="blogger-item">' +
                avatarHtml +
                '<div class="blogger-info">' +
                    '<div class="blogger-name">' + esc(b.name) + '</div>' +
                    '<div class="blogger-meta">ID: ' + esc(b.id) + (platformLabels ? ' · ' + platformLabels : '') + '</div>' +
                    '<div class="blogger-bio">' + esc(b.bioShort || b.bioLong || '') + '</div>' +
                    (tagsHtml ? '<div class="blogger-tags">' + tagsHtml + '</div>' : '') +
                '</div>' +
                '<div class="blogger-actions">' +
                    '<button class="btn btn-sm" data-action="edit" data-id="' + esc(b.id) + '">编辑</button>' +
                    '<button class="btn btn-sm btn-danger" data-action="delete" data-id="' + esc(b.id) + '">删除</button>' +
                '</div>' +
            '</div>';
        });
        list.innerHTML = html;

        list.querySelectorAll('[data-action]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var id = btn.getAttribute('data-id');
                var action = btn.getAttribute('data-action');
                if (action === 'edit') openEditForm(id);
                else if (action === 'delete') confirmDelete(id);
            });
        });
    }

    function openEditForm(id) {
        var b = bloggers.find(function (x) { return x.id === id; });
        if (!b) return;
        editingId = id;
        document.getElementById('formTitle').textContent = '✏️ 编辑博主';
        document.getElementById('f_id').value = b.id || '';
        document.getElementById('f_name').value = b.name || '';
        document.getElementById('f_avatarUrl').value = b.avatarUrl || '';
        document.getElementById('f_avatarText').value = b.avatarText || '';
        // 简介统一读 bioLong（老数据 bioShort 兜底合并）
        document.getElementById('f_bio').value = b.bioLong || b.bioShort || '';
        document.getElementById('f_quote').value = b.quote || '';
        // 主分类：5 选 1 单选回填（老数据不在 5 类里的自动清空，提醒重新选）
        setMainCategorySelected(b.mainCategory || '');

        updateAvatarPreview(b.avatarUrl, b.avatarText || b.name.charAt(0));

        // 副分类：合并 subCategories + tags（因为删掉了"其他标签"），只保留在白名单中的项
        var merged = [];
        var ALLOWED_SUB = SUB_CATEGORIES;
        (b.subCategories || []).forEach(function (t) { if (ALLOWED_SUB[t] && merged.indexOf(t) < 0) merged.push(t); });
        (b.tags || []).forEach(function (t) { if (ALLOWED_SUB[t] && merged.indexOf(t) < 0) merged.push(t); });
        setSubCategoriesSelected(merged);

        tagCollections.subCategories = merged.slice();
        tagCollections.tags = merged.slice(); // 同步 tags，兼容老数据读取 tags 展示

        tagCollections.keywords = (b.keywords || []).slice();
        renderTagInput('f_keywords', 'keywords', 'f_keywordsInput');

        // 内容形式多选回填
        setContentTypesSelected(b.contentTypes || []);

        platforms = (b.platforms || []).map(function (p) { return { label: p.label || '', url: p.url || '' }; });
        renderPlatforms();

        // 代表作列表：若 primaryWork 存在，自动作为第一个代表作（兼容老数据）
        var works = [];
        if (b.primaryWork && (b.primaryWork.title || b.primaryWork.url || b.primaryWork.note)) {
            works.push({
                title: b.primaryWork.title || '',
                url: b.primaryWork.url || '',
                note: b.primaryWork.note || ''
            });
        }
        (b.featuredWorks || []).forEach(function (w) {
            works.push({ title: w.title || '', url: w.url || '', note: w.note || '' });
        });
        featuredWorks = works;
        renderFeaturedWorks();

        switchTab('form');
        refreshLivePreview();
    }

    function updateAvatarPreview(url, text) {
        var preview = document.getElementById('avatarPreview');
        if (!preview) return;
        if (url) {
            preview.innerHTML = '<img src="' + esc(url) + '" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display=\'none\';this.parentNode.innerHTML=\'' + esc(text || '?') + '\';">';
        } else {
            preview.textContent = text || '?';
        }
        refreshLivePreview();
    }

    /* ===========================================================
     *   🌟 实时预览 — 直接同步 bloggers.html + claw 卡片最终效果
     * =========================================================== */
    function readFormForPreview() {
        var bioVal = (document.getElementById('f_bio') || {}).value || '';
        // 代表作：第一个视为 primaryWork，其余为 featuredWorks（与 bloggers.html 行为一致）
        var works = featuredWorks.slice();
        var primary = works.length ? works[0] : null;
        var rest = works.slice(1);
        return {
            name:          (document.getElementById('f_name')          || {}).value || '',
            avatarUrl:     (document.getElementById('f_avatarUrl')     || {}).value || '',
            avatarText:    (document.getElementById('f_avatarText')    || {}).value || '',
            bioLong:       bioVal,
            bioShort:      bioVal,     // 同时填充双字段，兼容 bloggers 读 bioLong || bioShort
            mainCategory:  getSelectedMainCategory(),
            quote:         (document.getElementById('f_quote')         || {}).value || '',
            contentTypes:  getSelectedContentTypes(),
            primaryWork:   primary ? { title: primary.title || '', url: primary.url || '', note: primary.note || '' } : null,
            tags:          tagCollections.tags.slice(),
            subCategories: tagCollections.subCategories.slice(), // 副分类独立字段
            keywords:      tagCollections.keywords.slice(),
            platforms:     platforms.slice(),
            featuredWorks: rest.map(function (w) { return { title: w.title || '', url: w.url || '', note: w.note || '' }; })
        };
    }

    function avatarStyleFromName(name, fallbackText) {
        var h = hue(name || fallbackText || '博主');
        var bg = 'linear-gradient(135deg,hsl(' + h + ',50%,62%),hsl(' + ((h + 45) % 360) + ',58%,48%))';
        var text = fallbackText || ((name && name.charAt(0)) ? name.charAt(0) : '?');
        return { bg: bg, text: text };
    }

    function renderPreviewAvatar(b) {
        var el = document.getElementById('p_avatar');
        if (!el) return;
        if (b.avatarUrl) {
            var fb = avatarStyleFromName(b.name, b.avatarText);
            el.style.background = (b.avatarUrl.indexOf('data:') === 0 ? 'transparent' : fb.bg);
            el.innerHTML = '<img src="' + esc(b.avatarUrl) + '" alt="avatar" onerror="var p=this.parentNode;p.style.background=\'' + fb.bg + '\';p.innerHTML=\'' + esc(fb.text) + '\';">';
        } else {
            var st = avatarStyleFromName(b.name, b.avatarText);
            el.style.background = st.bg;
            el.textContent = st.text;
        }
    }

    function joinPreviewTags(b) {
        // 主分类高亮 + 其他标签（subCategories / tags 合并去重显示，与 bloggers/claw 渲染逻辑一致）
        var parts = [];
        var seen = {};
        if (b.mainCategory) {
            parts.push('<span class="p-mini-tag main">' + esc(b.mainCategory) + '</span>');
        }
        (b.subCategories || []).forEach(function (t) {
            if (t && !seen[t]) { seen[t] = 1; parts.push('<span class="p-mini-tag">' + esc(t) + '</span>'); }
        });
        (b.tags || []).forEach(function (t) {
            if (t && !seen[t]) { seen[t] = 1; parts.push('<span class="p-mini-tag">' + esc(t) + '</span>'); }
        });
        return parts.join('');
    }

    /* ===== 内容形式多选：读 / 写 / 样式切换 ===== */
    var CONTENT_TYPE_META = {
        '直播':   { icon: '', color: 'rgba(201, 90, 140, 0.15)',  border: 'rgba(201, 90, 140, 0.40)', text: '#c95a8c' },
        '视频':   { icon: '', color: 'rgba(144, 123, 189, 0.18)', border: 'rgba(144, 123, 189, 0.45)', text: '#7d65b3' },
        '图文':   { icon: '', color: 'rgba(108, 122, 184, 0.14)', border: 'rgba(108, 122, 184, 0.40)', text: '#6c7ab8' }
    };
    var MAIN_CATEGORIES = { '实况': 1, '攻略': 1, '评测': 1, '剧情解说': 1, '游戏史': 1, '角色分析': 1, '资讯': 1, '游戏日常': 1, '游戏杂谈': 1 };

    // 副分类可选项与主分类完全一致（9 项），只是判定逻辑不同：单选 vs 多选
    var SUB_CATEGORIES = { '实况': 1, '攻略': 1, '评测': 1, '剧情解说': 1, '游戏史': 1, '角色分析': 1, '资讯': 1, '游戏日常': 1, '游戏杂谈': 1 };
    var SUB_CAT_STYLE = {
        '实况':    {bg:'rgba(201,90,140,0.14)',bd:'rgba(201,90,140,0.40)',tx:'#c95a8c',sh:'rgba(201,90,140,0.18)'},
        '攻略':    {bg:'rgba(209,123,120,0.14)',bd:'rgba(209,123,120,0.40)',tx:'#c4625e',sh:'rgba(209,123,120,0.18)'},
        '评测':    {bg:'rgba(201,147,63,0.14)',bd:'rgba(201,147,63,0.40)',tx:'#b98534',sh:'rgba(201,147,63,0.18)'},
        '剧情解说':{bg:'rgba(142,99,169,0.14)',bd:'rgba(142,99,169,0.40)',tx:'#8e63a9',sh:'rgba(142,99,169,0.18)'},
        '游戏史':  {bg:'rgba(76,165,134,0.14)',bd:'rgba(76,165,134,0.40)',tx:'#4ca586',sh:'rgba(76,165,134,0.18)'},
        '角色分析':{bg:'rgba(108,122,184,0.14)',bd:'rgba(108,122,184,0.42)',tx:'#6c7ab8',sh:'rgba(108,122,184,0.18)'},
        '资讯':    {bg:'rgba(168,139,184,0.14)',bd:'rgba(168,139,184,0.42)',tx:'#8a6da3',sh:'rgba(168,139,184,0.18)'},
        '游戏日常':{bg:'rgba(143,168,106,0.14)',bd:'rgba(143,168,106,0.40)',tx:'#7d9655',sh:'rgba(143,168,106,0.18)'},
        '游戏杂谈':{bg:'rgba(111,141,158,0.14)',bd:'rgba(111,141,158,0.40)',tx:'#6f8d9e',sh:'rgba(111,141,158,0.18)'}
    };

    function getSelectedMainCategory() {
        var box = document.getElementById('f_mainCategoryOptions');
        if (!box) return '';
        var radio = box.querySelector('input[type="radio"]:checked');
        return radio ? radio.value : '';
    }
    function setMainCategorySelected(val) {
        var box = document.getElementById('f_mainCategoryOptions');
        if (!box) return;
        var ALLOWED = MAIN_CATEGORIES;
        box.querySelectorAll('.main-cat-opt').forEach(function (opt) {
            var v = opt.getAttribute('data-val');
            var cb = opt.querySelector('input[type="radio"]');
            var on = (val === v) && !!ALLOWED[v];
            if (cb) cb.checked = on;
            opt.classList.toggle('selected', on);
        });
    }
    function bindMainCategory() {
        var box = document.getElementById('f_mainCategoryOptions');
        if (!box) return;
        box.querySelectorAll('.main-cat-opt').forEach(function (opt) {
            opt.addEventListener('click', function (e) {
                e.preventDefault();
                var v = opt.getAttribute('data-val');
                box.querySelectorAll('.main-cat-opt').forEach(function (o) {
                    var rb = o.querySelector('input[type="radio"]');
                    var on = (o === opt);
                    if (rb) rb.checked = on;
                    o.classList.toggle('selected', on);
                });
                refreshLivePreview();
            });
        });
    }

    function getSelectedSubCategories() {
        var box = document.getElementById('f_subCategories');
        if (!box) return [];
        var arr = [];
        box.querySelectorAll('.sub-cat-opt input[type="checkbox"]:checked').forEach(function (cb) {
            if (SUB_CATEGORIES[cb.value]) arr.push(cb.value);
        });
        return arr;
    }
    function applySubCatStyle(opt) {
        var v = opt.getAttribute('data-val');
        var style = SUB_CAT_STYLE[v];
        if (!style || !opt.classList.contains('selected')) {
            opt.style.removeProperty('--sc-bg');
            opt.style.removeProperty('--sc-bd');
            opt.style.removeProperty('--sc-tx');
            opt.style.removeProperty('--sc-sh');
            return;
        }
        opt.style.setProperty('--sc-bg', style.bg);
        opt.style.setProperty('--sc-bd', style.bd);
        opt.style.setProperty('--sc-tx', style.tx);
        opt.style.setProperty('--sc-sh', style.sh);
    }
    function setSubCategoriesSelected(values) {
        var box = document.getElementById('f_subCategories');
        if (!box) return;
        var set = {};
        (values || []).forEach(function (t) { if (SUB_CATEGORIES[t]) set[t] = true; });
        box.querySelectorAll('.sub-cat-opt').forEach(function (opt) {
            var v = opt.getAttribute('data-val');
            var cb = opt.querySelector('input[type="checkbox"]');
            var on = !!set[v];
            if (cb) cb.checked = on;
            opt.classList.toggle('selected', on);
            applySubCatStyle(opt);
        });
    }
    function bindSubCategories() {
        var box = document.getElementById('f_subCategories');
        if (!box) return;
        box.querySelectorAll('.sub-cat-opt').forEach(function (opt) {
            opt.addEventListener('click', function (e) {
                e.preventDefault();
                var cb = opt.querySelector('input[type="checkbox"]');
                if (cb) cb.checked = !cb.checked;
                opt.classList.toggle('selected', cb && cb.checked);
                applySubCatStyle(opt);
                // 同步到 tagCollections
                tagCollections.subCategories = getSelectedSubCategories();
                tagCollections.tags = tagCollections.subCategories.slice(); // 兼容 tags 展示
                refreshLivePreview();
            });
        });
    }
    function getSelectedContentTypes() {
        var box = document.getElementById('f_contentTypes');
        if (!box) return [];
        var arr = [];
        box.querySelectorAll('.content-type-opt input[type="checkbox"]:checked').forEach(function (cb) {
            arr.push(cb.value);
        });
        return arr;
    }
    function setContentTypesSelected(types) {
        var box = document.getElementById('f_contentTypes');
        if (!box) return;
        var set = {};
        // 过滤掉已删除的旧选项：切片/评测/杂谈 不再显示
        var ALLOWED = { '直播': 1, '视频': 1, '图文': 1 };
        (types || []).forEach(function (t) { if (ALLOWED[t]) set[t] = true; });
        box.querySelectorAll('.content-type-opt').forEach(function (opt) {
            var v = opt.getAttribute('data-val');
            var cb = opt.querySelector('input[type="checkbox"]');
            var on = !!set[v];
            if (cb) cb.checked = on;
            opt.classList.toggle('selected', on);
        });
    }
    function renderPreviewContentTypes(list) {
        var el = document.getElementById('p_contentTypes');
        if (!el) return;
        var ALLOWED = { '直播': 1, '视频': 1, '图文': 1 };
        var arr = (list || []).filter(function (t) { return ALLOWED[t]; });
        if (!arr.length) { el.textContent = ''; return; }
        el.innerHTML = arr.map(function (t) {
            var meta = CONTENT_TYPE_META[t] || { icon: '', color: 'var(--accent-light)', border: 'var(--border)', text: 'var(--accent)' };
            var iconHtml = meta.icon ? '<span style="margin-right:3px;">' + meta.icon + '</span>' : '';
            return '<span class="p-mini-tag ct-chip" style="background:' + meta.color + ';border:1px solid ' + meta.border + ';color:' + meta.text + ';">' +
                iconHtml + esc(t) + '</span>';
        }).join('');
    }

    function bindContentTypes() {
        var box = document.getElementById('f_contentTypes');
        if (!box) return;
        box.querySelectorAll('.content-type-opt').forEach(function (opt) {
            opt.addEventListener('click', function () {
                var cb = opt.querySelector('input[type="checkbox"]');
                if (cb) cb.checked = !cb.checked;
                opt.classList.toggle('selected', cb && cb.checked);
                refreshLivePreview();
            });
        });
    }
    /* =========================================================== */

    function renderPreviewWorksWithPrimary(b) {
        // 显示顺序：⭐ 主要作品（第一个代表作，若有）→ 🎬 其余代表作
        var pw = b.primaryWork;
        var elMain = document.getElementById('p_mainWork');
        var elRest = document.getElementById('p_works');
        if (!elMain || !elRest) return;

        // 主要作品
        var hasMain = pw && (pw.title || pw.url || pw.note);
        if (!hasMain) {
            elMain.textContent = '';
        } else {
            var html = '';
            if (pw.url) {
                html += '<a class="p-link-btn" href="' + esc(pw.url) + '" target="_blank" rel="noopener noreferrer" style="margin-bottom:6px;">★ ' + esc(pw.title || '（主要作品）') + '</a>';
            } else {
                html += '<div class="p-work-title"><span class="work-main-mark">★</span>' + esc(pw.title || '（主要作品）') + '</div>';
            }
            if (pw.note) html += '<div style="font-size:0.72rem;color:#c95a8c;margin-top:3px;font-weight:600;">' + esc(pw.note) + '</div>';
            elMain.innerHTML = html;
        }

        // 其余代表作
        var list = b.featuredWorks || [];
        var items = list.filter(function (w) { return w && (w.title || w.url || w.note); });
        if (!items.length) { elRest.textContent = ''; return; }
        elRest.innerHTML = items.map(function (w) {
            var line;
            if (w.url) {
                line = '<a class="p-link-btn" href="' + esc(w.url) + '" target="_blank" rel="noopener noreferrer">🎬 ' + esc(w.title || '（作品链接）') + '</a>';
            } else {
                line = '<div class="p-work-title">🎬 ' + esc(w.title || '（作品）') + '</div>';
            }
            if (w.note) line += '<div style="font-size:0.7rem;color:var(--text3);margin:2px 0 4px;">' + esc(w.note) + '</div>';
            return '<div style="display:flex;flex-direction:column;">' + line + '</div>';
        }).join('');
    }

    function refreshLivePreview() {
        if (!document.getElementById('livePreviewCard')) return;
        var b = readFormForPreview();

        // 姓名
        var nameEl = document.getElementById('p_name');
        if (nameEl) nameEl.textContent = b.name;

        // 头像
        renderPreviewAvatar(b);

        // 平台 badges + 链接
        var platforms = b.platforms || [];
        var badgeEl = document.getElementById('p_platformBadges');
        if (badgeEl) {
            badgeEl.innerHTML = platforms.filter(function (p) { return p && p.label; })
                .map(function (p) { return '<span class="p-platform-badge">' + esc(p.label) + '</span>'; })
                .join('');
        }
        var linkEl = document.getElementById('p_links');
        if (linkEl) {
            linkEl.innerHTML = platforms.filter(function (p) { return p && (p.label || p.url); })
                .map(function (p) {
                    var label = p.label || '主页';
                    return '<a class="p-link-btn" href="' + esc(p.url || '#') + '" target="_blank" rel="noopener noreferrer">🔗 ' + esc(label) + '</a>';
                }).join('');
        }

        // 签名
        var qEl = document.getElementById('p_quote');
        if (qEl) qEl.textContent = b.quote;

        // 简介（与 bloggers.html 一致：bioLong || bioShort）
        var bioEl = document.getElementById('p_bio');
        if (bioEl) bioEl.textContent = b.bioLong || b.bioShort;

        // 内容分类（主分类 + 子分类 + tags）
        var tagsTitle = document.getElementById('p_tagsTitle');
        var tagsEl = document.getElementById('p_tags');
        if (tagsEl) tagsEl.innerHTML = joinPreviewTags(b);

        // 关键词
        var kwsTitle = document.getElementById('p_kwsTitle');
        var kwsEl = document.getElementById('p_kws');
        if (kwsEl) {
            kwsEl.innerHTML = (b.keywords || []).filter(Boolean).map(function (k) {
                return '<span class="p-mini-tag kw">' + esc(k) + '</span>';
            }).join('');
        }

        // 内容形式
        renderPreviewContentTypes(b.contentTypes || []);

        // 主要作品 + 代表作（第一个为主要作品，其余为代表作）
        renderPreviewWorksWithPrimary(b);
    }
    /* ============================================================ */

    function resetForm() {
        editingId = null;
        document.getElementById('formTitle').textContent = '✏️ 新增博主';
        ['f_id', 'f_name', 'f_avatarUrl', 'f_avatarText', 'f_bio', 'f_quote'].forEach(function (id) {
            var el = document.getElementById(id);
            if (el) el.value = '';
        });
        setMainCategorySelected('');
        setSubCategoriesSelected([]);
        updateAvatarPreview('', '?');
        tagCollections = { tags: [], subCategories: [], keywords: [] };
        platforms = [];
        featuredWorks = [];
        renderTagInput('f_keywords', 'keywords', 'f_keywordsInput');
        renderPlatforms();
        renderFeaturedWorks();
    }

    function renderTagInput(containerId, key, inputId) {
        var container = document.getElementById(containerId);
        if (!container) return;
        var input = document.getElementById(inputId);
        var inputHtml = input ? input.outerHTML : '';
        var chipsHtml = tagCollections[key].map(function (t, i) {
            return '<span class="tag-chip">' + esc(t) + '<button type="button" data-key="' + key + '" data-idx="' + i + '">×</button></span>';
        }).join('');
        container.innerHTML = chipsHtml + inputHtml;
        var newInput = container.querySelector('input[type="text"]');
        if (newInput) {
            newInput.addEventListener('keydown', function (e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    var val = newInput.value.trim();
                    if (val) {
                        tagCollections[key].push(val);
                        renderTagInput(containerId, key, inputId);
                    }
                } else if (e.key === 'Backspace' && !newInput.value && tagCollections[key].length) {
                    tagCollections[key].pop();
                    renderTagInput(containerId, key, inputId);
                }
            });
        }
        container.querySelectorAll('.tag-chip button').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var k = btn.getAttribute('data-key');
                var idx = parseInt(btn.getAttribute('data-idx'), 10);
                tagCollections[k].splice(idx, 1);
                renderTagInput(containerId, k, inputId);
            });
        });
        refreshLivePreview();
    }

    function renderPlatforms() {
        var list = document.getElementById('f_platforms');
        if (!list) return;
        if (!platforms.length) {
            list.innerHTML = '<div style="font-size:0.8rem;color:var(--text3);padding:8px 0;">暂无平台</div>';
            refreshLivePreview();
            return;
        }
        var html = platforms.map(function (p, i) {
            return '<div class="nested-item">' +
                '<div class="nested-item-header"><span>平台 #' + (i + 1) + '</span><button class="btn btn-sm btn-danger" data-platform-del="' + i + '">删除</button></div>' +
                '<div class="row">' +
                    '<input type="text" placeholder="平台名（如：B站 / 小红书）" value="' + esc(p.label) + '" data-platform-label="' + i + '" />' +
                    '<input type="text" placeholder="主页链接（https://...）" value="' + esc(p.url) + '" data-platform-url="' + i + '" />' +
                '</div>' +
            '</div>';
        }).join('');
        list.innerHTML = html;
        list.querySelectorAll('[data-platform-label]').forEach(function (inp) {
            inp.addEventListener('input', function () {
                var i = parseInt(inp.getAttribute('data-platform-label'), 10);
                platforms[i].label = inp.value;
                refreshLivePreview();
            });
        });
        list.querySelectorAll('[data-platform-url]').forEach(function (inp) {
            inp.addEventListener('input', function () {
                var i = parseInt(inp.getAttribute('data-platform-url'), 10);
                platforms[i].url = inp.value;
                refreshLivePreview();
            });
        });
        list.querySelectorAll('[data-platform-del]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var i = parseInt(btn.getAttribute('data-platform-del'), 10);
                platforms.splice(i, 1);
                renderPlatforms();
            });
        });
        refreshLivePreview();
    }

    function renderFeaturedWorks() {
        var list = document.getElementById('f_featuredWorks');
        if (!list) return;
        if (!featuredWorks.length) {
            list.innerHTML = '<div style="font-size:0.8rem;color:var(--text3);padding:8px 0;">暂无代表作</div>';
            refreshLivePreview();
            return;
        }
        var html = featuredWorks.map(function (w, i) {
            return '<div class="nested-item">' +
                '<div class="nested-item-header"><span>代表作 #' + (i + 1) + '</span><button class="btn btn-sm btn-danger" data-work-del="' + i + '">删除</button></div>' +
                '<div class="row">' +
                    '<input type="text" placeholder="作品标题" value="' + esc(w.title) + '" data-work-title="' + i + '" />' +
                    '<input type="text" placeholder="链接" value="' + esc(w.url) + '" data-work-url="' + i + '" />' +
                    '<input type="text" placeholder="备注" value="' + esc(w.note || '') + '" data-work-note="' + i + '" />' +
                '</div>' +
            '</div>';
        }).join('');
        list.innerHTML = html;
        list.querySelectorAll('[data-work-title]').forEach(function (inp) {
            inp.addEventListener('input', function () {
                var i = parseInt(inp.getAttribute('data-work-title'), 10);
                featuredWorks[i].title = inp.value;
                refreshLivePreview();
            });
        });
        list.querySelectorAll('[data-work-url]').forEach(function (inp) {
            inp.addEventListener('input', function () {
                var i = parseInt(inp.getAttribute('data-work-url'), 10);
                featuredWorks[i].url = inp.value;
                refreshLivePreview();
            });
        });
        list.querySelectorAll('[data-work-note]').forEach(function (inp) {
            inp.addEventListener('input', function () {
                var i = parseInt(inp.getAttribute('data-work-note'), 10);
                featuredWorks[i].note = inp.value;
                refreshLivePreview();
            });
        });
        list.querySelectorAll('[data-work-del]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var i = parseInt(btn.getAttribute('data-work-del'), 10);
                featuredWorks.splice(i, 1);
                renderFeaturedWorks();
            });
        });
        refreshLivePreview();
    }

    // 规范博主对象字段：导入 / 云端读取 / 手动保存后统一补齐缺失字段，
    // 保证与 bloggers.html / claw.html 判定逻辑（筛选、渲染、代表作兜底）完全对齐。
    function normalizeBlogger(b) {
        if (!b) return null;
        var name = String(b.name || '').trim();
        if (!name) return null;
        var id = String(b.id || '').trim() || ('b' + Date.now());
        var bio = String(b.bioShort || b.bioLong || '').trim();
        var works = Array.isArray(b.featuredWorks) ? b.featuredWorks.filter(function (w) {
            return w && ((w.title || '') + (w.url || '') + (w.note || '')).trim();
        }) : [];
        var primary = b.primaryWork && (b.primaryWork.title || b.primaryWork.url || b.primaryWork.note)
            ? { title: b.primaryWork.title || '', url: b.primaryWork.url || '', note: b.primaryWork.note || '' }
            : (works.length ? { title: works[0].title || '', url: works[0].url || '', note: works[0].note || '' } : null);
        var rest = primary && b.primaryWork && (b.primaryWork.title || b.primaryWork.url || b.primaryWork.note)
            ? works
            : works.slice(1);
        // 分类判定优先级：mainCategory + subCategories 为官方字段；老数据/导入数据若只有 tags，
        // 则把 tags 中匹配白名单的项迁入 subCategories，并推举第一个非空作为 mainCategory（若仍缺）。
        var allowedCat = { '实况':1,'攻略':1,'评测':1,'剧情解说':1,'游戏史':1,'角色分析':1,'资讯':1,'游戏日常':1,
                           '剧情杂谈':1,'游戏杂谈':1 };
        var subList = (Array.isArray(b.subCategories) ? b.subCategories : []).filter(function (t) { return allowedCat[t]; });
        var tagsList = (Array.isArray(b.tags) ? b.tags : []).filter(function (t) { return allowedCat[t]; });
        tagsList.forEach(function (t) { if (subList.indexOf(t) < 0) subList.push(t); });
        // 老分类名「剧情杂谈」映射到新名
        subList = subList.map(function (t) { return t === '剧情杂谈' ? '剧情解说' : t; });
        var mainCat = allowedCat[b.mainCategory] ? (b.mainCategory === '剧情杂谈' ? '剧情解说' : b.mainCategory) : (subList[0] || '');
        var contentTypes = (Array.isArray(b.contentTypes) ? b.contentTypes : []).filter(function (t) {
            return t === '直播' || t === '视频' || t === '图文';
        });
        return {
            id: id,
            name: name,
            avatarUrl: String(b.avatarUrl || '').trim(),
            avatarText: String(b.avatarText || '').trim() || name.charAt(0),
            bioShort: bio,
            bioLong:  bio,
            platforms: Array.isArray(b.platforms) ? b.platforms.filter(function (p) { return p && p.label; }).map(function (p) {
                return { label: String(p.label || ''), url: String(p.url || '') };
            }) : [],
            tags: subList.slice(), // 保持与副分类一致，便于老逻辑兜底
            mainCategory: mainCat,
            subCategories: subList.slice(),
            keywords: Array.isArray(b.keywords) ? b.keywords.filter(Boolean) : [],
            contentTypes: contentTypes,
            primaryWork: primary,
            featuredWorks: rest.map(function (w) {
                return { title: w.title || '', url: w.url || '', note: w.note || '' };
            }),
            quote: String(b.quote || '').trim()
        };
    }

    function collectFormData() {
        var name = document.getElementById('f_name').value.trim();
        if (!name) { showStatus('请填写博主姓名', 'error'); return null; }

        var id = editingId || document.getElementById('f_id').value.trim() || ('b' + Date.now());
        var bioVal = document.getElementById('f_bio').value.trim();

        // 主要作品 + 代表作：第一个作为 primaryWork，其余作为 featuredWorks
        // 与 bloggers.html 列表页 primaryWork || featuredWorks[0] 兜底逻辑完全一致
        var works = featuredWorks.filter(function (w) { return w && (w.title || w.url || w.note); });
        var primaryWork = null;
        var restWorks = works;
        if (works.length) {
            primaryWork = {
                title: works[0].title || '',
                url: works[0].url || '',
                note: works[0].note || ''
            };
            restWorks = works.slice(1);
        }

        return {
            id: id,
            name: name,
            avatarUrl: document.getElementById('f_avatarUrl').value.trim(),
            avatarText: document.getElementById('f_avatarText').value.trim() || name.charAt(0),
            bioShort: bioVal,                        // 双字段同时填充，保持向后兼容
            bioLong:  bioVal,
            platforms: platforms.filter(function (p) { return p.label; }),
            tags:      tagCollections.tags.slice(),
            mainCategory: getSelectedMainCategory(),
            subCategories: tagCollections.subCategories.slice(), // 与 副分类栏 保持一致，兼容只看 subCategories 的老逻辑
            keywords:  tagCollections.keywords.slice(),
            contentTypes: getSelectedContentTypes(),
            primaryWork: primaryWork,
            featuredWorks: restWorks.map(function (w) { return { title: w.title, url: w.url, note: w.note }; }),
            quote: document.getElementById('f_quote').value.trim()
        };
    }

    async function uploadAvatarFile(file, bloggerId) {
        if (!supabaseClient || !file) return null;
        try {
            var ext = file.name.split('.').pop().toLowerCase();
            var path = 'bloggers/' + bloggerId + '/avatar.' + ext;
            var { data, error } = await supabaseClient.storage
                .from('avatars')
                .upload(path, file, { upsert: true });
            if (error) throw error;
            var { data: urlData } = supabaseClient.storage
                .from('avatars')
                .getPublicUrl(path);
            return urlData.publicUrl;
        } catch (e) {
            console.warn('[Upload] 头像上传失败:', e);
            return null;
        }
    }

    async function saveBlogger() {
        var b = normalizeBlogger(collectFormData());
        if (!b) return;

        // 保险：若头像还是 data: URL（说明 Storage 上传曾失败 / 手动粘贴了 base64），
        // 在 upsert 前再试一次上传；仍失败则剥离 data URL，否则超大 payload 会触发
        // Supabase REST / Cloudflare 的 body size 限制 → ERR_CONNECTION_CLOSED。
        if (b.avatarUrl && /^data:image\//i.test(b.avatarUrl)) {
            try {
                var status = document.getElementById('avatarUploadStatus');
                if (status) status.textContent = '正在上传头像...';
                var parts = b.avatarUrl.split(',');
                var meta = parts[0] || '';
                var mime = (meta.match(/data:(image\/[a-z0-9+\-.]+)/i) || [])[1] || 'image/png';
                var ext  = (mime.split('/')[1] || 'png').toLowerCase().replace('jpeg', 'jpg');
                var base64 = parts.slice(1).join(',');
                var binary = atob(base64);
                var arr = new Uint8Array(binary.length);
                for (var i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
                var blob = new Blob([arr], { type: mime });
                // Blob 与 File 兼容，name 用于取扩展名
                var fakeFile = new File([blob], 'avatar.' + ext, { type: mime });
                var publicUrl = await uploadAvatarFile(fakeFile, b.id);
                if (publicUrl) {
                    b.avatarUrl = publicUrl;
                    document.getElementById('f_avatarUrl').value = publicUrl;
                    if (status) status.textContent = '✓ 头像已上传';
                } else {
                    // 继续失败 → 剥离，避免 ERR_CONNECTION_CLOSED
                    console.warn('[Save] 头像二次上传仍失败，已从云端 payload 中剥离 base64，改为文字头像兜底');
                    b.avatarUrl = '';
                    if (status) status.textContent = '⚠ 头像上传失败，使用文字占位';
                    showStatus('⚠ 头像上传失败，改用文字头像占位', 'error');
                }
            } catch (e) {
                console.warn('[Save] data URL 上传异常，剥离 base64:', e);
                b.avatarUrl = '';
            }
        }

        var idx = bloggers.findIndex(function (x) { return x.id === b.id; });
        if (idx >= 0) bloggers[idx] = b;
        else bloggers.push(b);
        saveToLocal();
        renderBloggerList();

        var ok = await upsertBlogger(b);
        if (ok) {
            showStatus('✓ 已保存到云端', 'success');
            resetForm();
            switchTab('list');
        } else {
            showStatus('⚠ 本地已保存，云端同步失败', 'error');
        }
    }

    async function confirmDelete(id) {
        var b = bloggers.find(function (x) { return x.id === id; });
        if (!b) return;
        if (!confirm('确定删除博主「' + b.name + '」？此操作不可恢复。')) return;

        var idx = bloggers.findIndex(function (x) { return x.id === id; });
        if (idx >= 0) bloggers.splice(idx, 1);
        saveToLocal();
        renderBloggerList();

        var ok = await deleteBloggerCloud(id);
        if (ok) showStatus('✓ 已从云端删除', 'success');
        else showStatus('⚠ 本地已删除，云端同步失败', 'error');
    }

    function switchTab(tab) {
        document.querySelectorAll('.tab').forEach(function (t) { t.classList.remove('active'); });
        document.querySelectorAll('.tab-panel').forEach(function (p) { p.classList.remove('active'); });
        document.querySelector('.tab[data-tab="' + tab + '"]').classList.add('active');
        document.getElementById('tab-' + tab).classList.add('active');
        if (tab === 'list') renderBloggerList();
    }

    function exportJson() {
        if (!bloggers.length) { showStatus('暂无数据可导出', 'error'); return; }
        var json = JSON.stringify(bloggers, null, 2);
        var blob = new Blob([json], { type: 'application/json' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'bloggers_' + new Date().toISOString().slice(0, 10) + '.json';
        a.click();
        URL.revokeObjectURL(url);
        showStatus('✓ 已导出 JSON 文件', 'success');
    }

    function loadSampleData() {
        var sample = window.HerlensCreators && window.HerlensCreators.bloggers;
        if (!sample || !sample.length) {
            document.getElementById('importArea').value = '// 示例数据不可用，请手动输入 JSON';
            return;
        }
        document.getElementById('importArea').value = JSON.stringify(sample, null, 2);
        showStatus('✓ 已加载示例数据', 'success');
    }

    async function bulkImport() {
        var text = document.getElementById('importArea').value.trim();
        if (!text) { showStatus('请先粘贴 JSON 数据', 'error'); return; }
        var data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            showStatus('JSON 解析失败: ' + e.message, 'error');
            return;
        }
        if (!Array.isArray(data)) { showStatus('数据必须是数组', 'error'); return; }

        var imported = 0, skipped = 0, failed = 0;
        for (var i = 0; i < data.length; i++) {
            var raw = data[i];
            if (!raw || !raw.name) { failed++; continue; }
            if (!raw.id) raw.id = 'b' + Date.now() + '_' + i;
            var b = normalizeBlogger(raw);
            if (!b) { failed++; continue; }

            var idx = bloggers.findIndex(function (x) { return x.id === b.id; });
            if (idx >= 0) {
                if (!confirm('博主「' + b.name + '」已存在，是否覆盖？（共 ' + data.length + ' 条）')) {
                    skipped++; continue;
                }
                bloggers[idx] = b;
            } else {
                bloggers.push(b);
            }

            var ok = await upsertBlogger(b);
            if (ok) imported++;
            else { failed++; console.warn('[Import] 保存失败:', b.id); }
        }
        saveToLocal();
        renderBloggerList();
        var resultEl = document.getElementById('importResult');
        resultEl.innerHTML = '<div class="card" style="padding:14px;margin-top:12px;">' +
            '<strong>导入完成：</strong>成功 ' + imported + ' 条，跳过 ' + skipped + ' 条，失败 ' + failed + ' 条' +
            '</div>';
        showStatus('导入完成: ' + imported + ' 成功', 'success');
    }

    function addPlatform() {
        platforms.push({ label: '', url: '' });
        renderPlatforms();
    }

    function addFeaturedWork() {
        featuredWorks.push({ title: '', url: '', note: '' });
        renderFeaturedWorks();
    }

    function bindLivePreviewEvents() {
        // 文本类输入：输入时直接刷新预览
        var textIds = [
            'f_name', 'f_bio', 'f_mainCategory', 'f_quote'
        ];
        textIds.forEach(function (id) {
            var el = document.getElementById(id);
            if (el) el.addEventListener('input', refreshLivePreview);
        });

        // 头像URL/文字会通过 updateAvatarPreview() 触发 refresh（已绑定）
    }

    function init() {
        loadFromLocal();
        renderBloggerList();

        document.querySelectorAll('.tab').forEach(function (tab) {
            tab.addEventListener('click', function () { switchTab(tab.getAttribute('data-tab')); });
        });

        document.getElementById('btnSaveBlogger').addEventListener('click', saveBlogger);
        document.getElementById('btnResetForm').addEventListener('click', resetForm);
        document.getElementById('btnAddPlatform').addEventListener('click', addPlatform);
        document.getElementById('btnAddWork').addEventListener('click', addFeaturedWork);
        document.getElementById('btnSyncFromCloud').addEventListener('click', function () {
            loadFromCloud().then(function (ok) {
                if (!ok && !supabaseClient) showStatus('Supabase 未连接', 'error');
            });
        });
        document.getElementById('btnExportJson').addEventListener('click', exportJson);
        document.getElementById('btnImport').addEventListener('click', bulkImport);
        document.getElementById('btnLoadSample').addEventListener('click', loadSampleData);

        document.getElementById('f_avatarUrl').addEventListener('input', function () {
            var url = this.value.trim();
            var text = document.getElementById('f_avatarText').value.trim() || '?';
            updateAvatarPreview(url, text);
        });

        document.getElementById('f_avatarFile').addEventListener('change', async function (e) {
            var file = e.target.files && e.target.files[0];
            if (!file) return;
            var status = document.getElementById('avatarUploadStatus');
            status.textContent = '上传中...';
            var tempId = editingId || ('temp_' + Date.now());
            var url = await uploadAvatarFile(file, tempId);
            if (url) {
                document.getElementById('f_avatarUrl').value = url;
                updateAvatarPreview(url, document.getElementById('f_avatarText').value.trim() || '?');
                status.textContent = '✓ 上传成功';
                showStatus('✓ 头像上传成功', 'success');
            } else {
                status.textContent = '上传失败，已生成临时路径';
                var reader = new FileReader();
                reader.onload = function (ev) {
                    var dataUrl = ev.target.result;
                    document.getElementById('f_avatarUrl').value = dataUrl;
                    updateAvatarPreview(dataUrl, document.getElementById('f_avatarText').value.trim() || '?');
                };
                reader.readAsDataURL(file);
                showStatus('⚠ 云端上传失败，使用本地预览', 'error');
            }
        });

        document.getElementById('f_avatarText').addEventListener('input', function () {
            var url = document.getElementById('f_avatarUrl').value.trim();
            updateAvatarPreview(url, this.value.trim() || '?');
        });

        bindLivePreviewEvents();

        bindMainCategory();
        bindSubCategories();
        setSubCategoriesSelected([]);
        renderTagInput('f_keywords', 'keywords', 'f_keywordsInput');
        renderPlatforms();
        renderFeaturedWorks();
        bindContentTypes();
        setMainCategorySelected('');
        updateAvatarPreview('', '?');

        if (supabaseClient) {
            setTimeout(function () {
                loadFromCloud().then(function () {});
            }, 500);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
