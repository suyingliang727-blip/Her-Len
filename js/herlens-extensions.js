/* ================================================================
 * Her Lens 扩展模块
 * - 「她们」选择弹层（开机桌面入口）
 * - 工具栏游戏币徽章
 * - 用户菜单追加：钱包余额 / 健康贴士开关
 * ================================================================ */
(function () {
    /* ===== 「她们」选择弹层 ===== */
    function openCreatorsPicker() {
        var ov = document.getElementById('creatorsPickerOverlay');
        if (ov) ov.classList.add('show');
    }
    function closeCreatorsPicker() {
        var ov = document.getElementById('creatorsPickerOverlay');
        if (ov) ov.classList.remove('show');
    }
    window.openCreatorsPicker = openCreatorsPicker;
    window.closeCreatorsPicker = closeCreatorsPicker;

    document.addEventListener('DOMContentLoaded', function () {
        var closeBtn = document.getElementById('creatorsPickerClose');
        var overlay = document.getElementById('creatorsPickerOverlay');
        if (closeBtn) closeBtn.addEventListener('click', closeCreatorsPicker);
        if (overlay) overlay.addEventListener('click', function (e) { if (e.target === overlay) closeCreatorsPicker(); });

        /* ===== 导航「她们」下拉 ===== */
        var wrap = document.getElementById('creatorsNavWrap');
        var btn = document.getElementById('navCreatorsBtn');
        if (wrap && btn) {
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                wrap.classList.toggle('open');
            });
            document.addEventListener('click', function (e) {
                if (!wrap.contains(e.target)) wrap.classList.remove('open');
            });
        }

        /* ===== 工具栏游戏币徽章已移除，游戏币信息迁移至设置页面 ===== */

        /* ===== 开机导航补丁：creators 目标 ===== */
        var navTimer = setInterval(function () {
            if (typeof window.herlensBootNavigate === 'function' && !window.herlensBootNavigate.__extPatched) {
                var orig = window.herlensBootNavigate;
                var wrapped = function (target) {
                    if (target === 'creators') { openCreatorsPicker(); return; }
                    return orig(target);
                };
                wrapped.__extPatched = true;
                window.herlensBootNavigate = wrapped;
                clearInterval(navTimer);
            }
        }, 300);
        setTimeout(function () { clearInterval(navTimer); }, 15000);
    });

    /* ===== 用户菜单追加项已迁移到设置页面，不再注入下拉菜单 ===== */
    // 游戏币、健康贴士开关、屏蔽内容管理已统一收录到设置页面 (openSettingsPage)
    // 此处保留空函数以兼容旧的 MutationObserver 调用
    function injectDropdownExtras(inner) {
        // 不再向下拉菜单注入项
    }
    window.injectDropdownExtras = injectDropdownExtras;
})();
