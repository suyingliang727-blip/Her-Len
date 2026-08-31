/* ================================================================
 * Her Lens 双钱包系统
 * 娃娃机币(claw) / 抽卡币(gacha)
 * 来源：每日登录各+1；评论游戏各+1（每日前3条）
 * 新用户初始各2枚
 * ================================================================ */
(function () {
    var KEY = 'herlens_wallet_v1';
    var DEFAULTS = { claw: 2, gacha: 2, lastLoginDate: '', commentDate: '', commentCount: 0 };
    var DAILY_COMMENT_LIMIT = 3;

    function todayStr() {
        var d = new Date();
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    }

    function load() {
        try {
            var raw = localStorage.getItem(KEY);
            if (raw) {
                var d = JSON.parse(raw);
                return Object.assign({}, DEFAULTS, d);
            }
        } catch (e) {}
        return Object.assign({}, DEFAULTS);
    }

    var state = load();

    function save() {
        try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
    }

    function notify(kind, delta, reason) {
        try {
            document.dispatchEvent(new CustomEvent('herlens_wallet_change', {
                detail: { kind: kind, balance: state[kind] | 0, delta: delta, reason: reason }
            }));
        } catch (e) {}
    }

    /* ===== 自带轻量 toast（跨页面可用，不依赖 app.js） ===== */
    var toastTimer = null;
    function toast(msg) {
        try {
            var el = document.getElementById('herlensWalletToast');
            if (!el) {
                el = document.createElement('div');
                el.id = 'herlensWalletToast';
                el.style.cssText = 'position:fixed;left:50%;bottom:80px;transform:translateX(-50%) translateY(20px);z-index:99999;background:rgba(20,14,38,0.92);color:#f0e9ff;padding:10px 22px;border-radius:24px;font-size:0.85rem;box-shadow:0 6px 24px rgba(0,0,0,0.35);opacity:0;transition:all 0.35s ease;pointer-events:none;max-width:86vw;text-align:center;';
                (document.body || document.documentElement).appendChild(el);
            }
            el.textContent = msg;
            requestAnimationFrame(function () {
                el.style.opacity = '1';
                el.style.transform = 'translateX(-50%) translateY(0)';
            });
            if (toastTimer) clearTimeout(toastTimer);
            toastTimer = setTimeout(function () {
                el.style.opacity = '0';
                el.style.transform = 'translateX(-50%) translateY(20px)';
            }, 2600);
        } catch (e) {}
    }

    function getBalance(kind) { return state[kind] | 0; }

    function add(kind, amount, reason, silent) {
        if (!amount) return;
        state[kind] = (state[kind] | 0) + amount;
        save();
        notify(kind, amount, reason || 'add');
        if (!silent) {
            var name = kind === 'claw' ? '娃娃机币' : '抽卡币';
            toast('🪙 ' + name + ' +' + amount + '（余额 ' + state[kind] + '）');
        }
    }

    function spend(kind, amount) {
        if ((state[kind] | 0) < amount) return false;
        state[kind] = (state[kind] | 0) - amount;
        save();
        notify(kind, -amount, 'spend');
        return true;
    }

    function checkDailyLogin() {
        var t = todayStr();
        if (state.lastLoginDate === t) return false;
        state.lastLoginDate = t;
        state.claw = (state.claw | 0) + 1;
        state.gacha = (state.gacha | 0) + 1;
        save();
        notify('claw', 1, 'login');
        notify('gacha', 1, 'login');
        setTimeout(function () { toast('🪙 每日登录奖励：娃娃机币 +1 · 抽卡币 +1'); }, 600);
        return true;
    }

    function rewardComment() {
        var t = todayStr();
        if (state.commentDate !== t) { state.commentDate = t; state.commentCount = 0; }
        if ((state.commentCount | 0) >= DAILY_COMMENT_LIMIT) return false;
        state.commentCount = (state.commentCount | 0) + 1;
        state.claw = (state.claw | 0) + 1;
        state.gacha = (state.gacha | 0) + 1;
        save();
        notify('claw', 1, 'comment');
        notify('gacha', 1, 'comment');
        toast('🪙 评论奖励：娃娃机币 +1 · 抽卡币 +1（今日 ' + state.commentCount + '/' + DAILY_COMMENT_LIMIT + '）');
        return true;
    }

    var grantedToday = checkDailyLogin();

    window.HerlensWallet = {
        getBalance: getBalance,
        add: add,
        spend: spend,
        rewardComment: rewardComment,
        checkDailyLogin: checkDailyLogin,
        grantedToday: grantedToday,
        snapshot: function () { return Object.assign({}, state); },
        DAILY_COMMENT_LIMIT: DAILY_COMMENT_LIMIT
    };
})();
