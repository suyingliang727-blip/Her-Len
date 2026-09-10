/* ================================================================
 * Her Lens 打赏提醒模块（姊妹口吻 · 全站通用）
 * - 只在"用户创造价值"的动作后，右下角弹一条轻量小卡，5s 自动收
 * - 材质完全复刻主站 toast 的薰衣草玻璃：噪点纸纹 + 细线 + 内阴影
 * - 深浅主题自适应（跟随 body[data-theme]）
 * - 限频：单会话 ≤1 次、每天 ≤2 次（本地记时间）；可永久关闭
 * - 点击卡片 / 主按钮 → 打开落点（默认 window.openTipModal，或自定义回调）
 * 用法：HerLensTip.show({ title, sub, action, onOpen, dismissKey })
 *       HerLensTip.consider(scene, copy)  // 场景去重 + 全局限频封装
 * ================================================================ */
(function (global) {
    'use strict';
    var KEY = 'herlens_tip_v1';
    var DAILY_CAP = 2;
    var SESSION_CAP = 1;
    var shownThisSession = 0;
    var sessionKey = null;          // 每次刷新生成一个会话随机串，写在本地状态里比对

    function read() { try { return JSON.parse(global.localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
    function write(obj) { try { global.localStorage.setItem(KEY, JSON.stringify(obj)); } catch (e) {} }
    function today() { var d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
    function hasShownToday(st) { return st.day === today() && (st.count || 0) >= DAILY_CAP; }
    function canShow(st) { return shownThisSession < SESSION_CAP && !hasShownToday(st); }
    function markShown(st) {
        shownThisSession++;
        if (st.day === today()) st.count = (st.count || 0) + 1; else { st.day = today(); st.count = 1; }
        write(st);
    }

    // ISO-8601 周键（周一为一周起始），用于"本周内不再提醒"
    function weekKey() {
        var d = new Date();
        var day = (d.getDay() + 6) % 7;
        var thursday = new Date(d); thursday.setDate(d.getDate() - day + 3);
        var firstThursday = new Date(thursday.getFullYear(), 0, 4);
        var fd = (firstThursday.getDay() + 6) % 7;
        firstThursday.setDate(firstThursday.getDate() - fd);
        var week = Math.round((thursday - firstThursday) / (7 * 24 * 3600 * 1000)) + 1;
        return thursday.getFullYear() + '-W' + (week < 10 ? '0' : '') + week;
    }

    // 本周内不再提醒（"已支持过 · 本周不再提醒" 等入口调用）；下周自动恢复
    function weekMute() {
        var st = read();
        st.offWeek = weekKey();
        st.day = today(); st.count = DAILY_CAP;   // 同时封顶当日配额
        delete st.off;                            // 移除旧的"永久关闭"标记
        write(st);
    }
    function isOff() { var st = read(); return st.offWeek === weekKey(); }

    function ensureSession(st) {
        if (!st.s || st.s !== sessionKey) { sessionKey = 's' + Date.now().toString(36); st.s = sessionKey; write(st); }
    }

    // 构造 / 注入卡片（居中 fixed，材质复刻 toast；带一块柔焦遮罩，点卡片外即关）
    var card = null, backdrop = null, cardTimer = null, settleTimer = null;
    function buildCard() {
        // 遮罩先插入（层叠在卡片之下，柔焦背景，点击卡片外关闭）
        backdrop = document.createElement('div');
        backdrop.className = 'herlens-tip-backdrop';
        document.body.appendChild(backdrop);
        var c = document.createElement('div');
        c.className = 'herlens-tip-card';
        c.innerHTML =
            '<div class="htc-inner">' +
            '  <p class="htc-title"></p>' +
            '  <p class="htc-sub"></p>' +
            '  <div class="htc-acts">' +
            '    <button type="button" class="htc-ok"></button>' +
            '    <button type="button" class="htc-later">下次再说</button>' +
            '  </div>' +
            '</div>' +
            '<button type="button" class="htc-x" aria-label="关闭">✕</button>';
        document.body.appendChild(c);
        return c;
    }
    function open() { requestAnimationFrame(function () { if (card) card.classList.add('htc-show'); if (backdrop) backdrop.classList.add('htc-show'); }); }
    function dismiss() {
        if (!card) return;
        card.classList.remove('htc-show');
        cardTimer = setTimeout(function () {
            if (card && card.parentNode) card.parentNode.removeChild(card);
            card = null;
            if (backdrop && backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
            backdrop = null;
        }, 420);
    }
    function hideLater(ms) { if (cardTimer) clearTimeout(cardTimer); cardTimer = setTimeout(dismiss, ms || 5000); }

    function show(opts) {
        if (isOff()) return;
        var st = read(); ensureSession(st);
        if (!canShow(st)) return;
        markShown(st);           // 通过门槛立即占位（同步），避免 480ms 内二次触发重复弹
        // 顺延：若在打字/拖拽中，等一瞬再出（页面交互空闲后才真正插入）
        var settle = function () {
            if (card) return;    // 已有卡在展示，不再叠加
            card = buildCard();
            var el = card;
            el.querySelector('.htc-title').textContent = opts.title || '姊妹，谢谢你';
            el.querySelector('.htc-sub').textContent = opts.sub || '';
            el.querySelector('.htc-ok').textContent = opts.action || '随心请茶';
            var acts = el.querySelector('.htc-acts');
            var ok = el.querySelector('.htc-ok');
            var later = el.querySelector('.htc-later');
            var cx = el.querySelector('.htc-x');

            var okHandler = function (e) { e && e.stopPropagation && e.stopPropagation(); try { if (typeof opts.onOpen === 'function') opts.onOpen(); else if (typeof global.openTipModal === 'function') global.openTipModal(); } catch (err) {} dismiss(); };
            ok.addEventListener('click', okHandler);
            later.addEventListener('click', function (e) { e && e.stopPropagation && e.stopPropagation(); dismiss(); });
            cx.addEventListener('click', dismiss);
            el.addEventListener('click', function (e) { if (e.target === el) okHandler(); });
            acts.addEventListener('click', function (e) { e.stopPropagation(); });
            if (backdrop) backdrop.addEventListener('click', dismiss);
            open();
            hideLater(5000);
        };
        if (settleTimer) clearTimeout(settleTimer);
        settleTimer = setTimeout(settle, 480);
    }

    // 场景去重 + 限频封装；同一 scene 每次刷新只弹一次
    var sceneDone = {};
    function consider(scene, copy) {
        if (sceneDone[scene]) return;
        sceneDone[scene] = true;
        show(copy);
    }

    // 主页"看完 N 张卡"统计：外部每开一张调用一次；内部按会话累计到阈值才弹
    var browseCount = 0, browseFloor = 10, browseTriggered = false;
    function noteBrowse(opts) {
        if (browseTriggered) return;
        browseCount++;
        if (browseCount >= browseFloor) {
            browseTriggered = true;
            var co = opts || {};
            show({
                title: co.title || '欢迎使用HerLens',
                sub: co.sub || '喜欢网站的姊妹可以奖励努力工作的比格一个鸡腿吗？',
                action: co.action || '投喂比格',
                onOpen: co.onOpen
            });
        }
    }

    var api = {
        show: show,
        consider: consider,
        noteBrowse: noteBrowse,
        weekMute: weekMute,
        permanentlyOff: weekMute,   // 兼容旧名：现语义为"本周内不再提醒"
        isOff: isOff,
        _markShown: markShown
    };
    global.HerLensTip = api;
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : this);
