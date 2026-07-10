/**
 * 设计模式
 * 
 * 用途：在浏览器中模拟小程序 web-view 的真实渲染效果，与小程序实际效果一致。
 * 
 * 使用方式：
 *   方式1：URL 加参数 ?design=mp  (推荐，会自动跨页面保持)
 *   方式2：Console 输入 enableDesignMode()
 *   退出：Console 输入 disableDesignMode() 或去掉 URL 参数刷新
 * 
 * 模拟内容：
 *   1. 顶部插入小程序原生导航栏（状态栏 + 标题栏 + 胶囊按钮）
 *   2. 激活 .in-miniprogram CSS 适配规则
 *   3. 隐藏 H5 自带的返回按钮、头像等冗余元素
 *   4. 跨页面跳转自动保持设计模式（通过 sessionStorage）
 */

(function () {
    'use strict';

    var STORAGE_KEY = 'design_mode_mp';

    // 小程序导航栏 HTML 模板（模拟 iPhone X 尺寸）
    var MP_NAV_HTML = '' +
        '<div id="mp-nav-simulator" style="' +
        'position: fixed; top: 0; left: 0; right: 0; z-index: 99999;' +
        'background: #fff;' +
        'font-family: -apple-system, BlinkMacSystemFont, PingFang SC, sans-serif;' +
        'box-shadow: 0 1px 0 rgba(0,0,0,0.05);' +
        '">' +
        // 状态栏（iPhone X 高度 44px）
        '<div style="height: 44px; background: #fff;"></div>' +
        // 导航栏内容区（高度 44px）
        '<div style="' +
        'height: 44px; display: flex; align-items: center; justify-content: center;' +
        'position: relative; padding: 0 16px;' +
        '">' +
        // 返回按钮
        '<div onclick="history.back()" style="position: absolute; left: 16px; top: 50%; transform: translateY(-50%); display: flex; align-items: center; gap: 4px; cursor: pointer;">' +
        '<svg width="12" height="20" viewBox="0 0 12 20" fill="none"><path d="M10 2L2 10L10 18" stroke="#333" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
        '</div>' +
        // 标题
        '<span style="font-size: 17px; font-weight: 600; color: #000;">智能营销</span>' +
        // 胶囊按钮
        '<div style="' +
        'position: absolute; right: 10px; top: 50%; transform: translateY(-50%);' +
        'display: flex; align-items: center;' +
        'border: 0.5px solid rgba(0,0,0,0.15);' +
        'border-radius: 16px; height: 32px; background: rgba(0,0,0,0.03);' +
        'overflow: hidden;' +
        '">' +
        // 三个点
        '<div style="width: 43px; display: flex; align-items: center; justify-content: center;">' +
        '<svg width="20" height="5" viewBox="0 0 20 5"><circle cx="3" cy="2.5" r="2" fill="#666"/><circle cx="10" cy="2.5" r="2" fill="#666"/><circle cx="17" cy="2.5" r="2" fill="#666"/></svg>' +
        '</div>' +
        // 分隔线
        '<div style="width: 0.5px; height: 18px; background: rgba(0,0,0,0.15);"></div>' +
        // 关闭圆圈（点击退出设计模式）
        '<div onclick="exitDesignMode()" style="width: 43px; display: flex; align-items: center; justify-content: center; cursor: pointer;">' +
        '<svg style="pointer-events:none" width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="7" stroke="#666" stroke-width="1.2" fill="none"/><line x1="5" y1="5" x2="11" y2="11" stroke="#666" stroke-width="1.2" stroke-linecap="round"/><line x1="11" y1="5" x2="5" y2="11" stroke="#666" stroke-width="1.2" stroke-linecap="round"/></svg>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '</div>' +
        // 占位元素（撑开 body 顶部空间，88px = 状态栏44 + 导航栏44）
        '<div id="mp-nav-spacer" style="height: 88px; flex-shrink: 0;"></div>';

    // 详情页专用导航栏（蓝色背景）
    var MP_NAV_DETAIL_HTML = '' +
        '<div id="mp-nav-simulator" style="' +
        'position: fixed; top: 0; left: 0; right: 0; z-index: 99999;' +
        'background: #2563eb;' +
        'font-family: -apple-system, BlinkMacSystemFont, PingFang SC, sans-serif;' +
        '">' +
        '<div style="height: 44px; background: transparent;"></div>' +
        '<div style="' +
        'height: 44px; display: flex; align-items: center; justify-content: center;' +
        'position: relative; padding: 0 16px;' +
        '">' +
        '<div onclick="history.back()" style="position: absolute; left: 16px; top: 50%; transform: translateY(-50%); display: flex; align-items: center; gap: 4px; cursor: pointer;">' +
        '<svg width="12" height="20" viewBox="0 0 12 20" fill="none"><path d="M10 2L2 10L10 18" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
        '</div>' +
        '<span style="font-size: 17px; font-weight: 600; color: #fff;">客户详情</span>' +
        '<div style="' +
        'position: absolute; right: 10px; top: 50%; transform: translateY(-50%);' +
        'display: flex; align-items: center;' +
        'border: 0.5px solid rgba(255,255,255,0.3);' +
        'border-radius: 16px; height: 32px; background: rgba(255,255,255,0.15);' +
        'overflow: hidden;' +
        '">' +
        '<div style="width: 43px; display: flex; align-items: center; justify-content: center;">' +
        '<svg width="20" height="5" viewBox="0 0 20 5"><circle cx="3" cy="2.5" r="2" fill="#fff"/><circle cx="10" cy="2.5" r="2" fill="#fff"/><circle cx="17" cy="2.5" r="2" fill="#fff"/></svg>' +
        '</div>' +
        '<div style="width: 0.5px; height: 18px; background: rgba(255,255,255,0.3);"></div>' +
        '<div onclick="disableDesignMode();location.reload()" style="width: 43px; display: flex; align-items: center; justify-content: center; cursor: pointer;">' +
        '<svg style="pointer-events:none" width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="7" stroke="#fff" stroke-width="1.2" fill="none"/><line x1="5" y1="5" x2="11" y2="11" stroke="#fff" stroke-width="1.2" stroke-linecap="round"/><line x1="11" y1="5" x2="5" y2="11" stroke="#fff" stroke-width="1.2" stroke-linecap="round"/></svg>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '<div id="mp-nav-spacer" style="height: 88px; flex-shrink: 0;"></div>';

    // 判断是否为详情页
    function isDetailPage() {
        return document.querySelector('.blue-header') !== null;
    }

    // 获取当前页面标题映射
    function getPageTitle() {
        var path = window.location.pathname;
        if (path.indexOf('detail') > -1) return '客户详情';
        if (path.indexOf('allocation') > -1) return '名单分配';
        if (path.indexOf('customers') > -1) return '客户名单';
        if (path.indexOf('follow') > -1) return '跟进管理';
        if (path.indexOf('admin-dashboard') > -1) return '营销平台';
        if (path.indexOf('admin-team') > -1) return '团队管理';
        return '智能营销';
    }

    // 启用设计模式
    window.enableDesignMode = function () {
        // 防止重复启用
        if (document.getElementById('mp-nav-simulator')) return;

        // 1. 激活小程序 CSS 适配规则
        document.documentElement.classList.add('in-miniprogram');
        document.documentElement.classList.add('design-mode-mp');

        // 2. 持久化到 sessionStorage，跨页面保持
        try { sessionStorage.setItem(STORAGE_KEY, '1'); } catch(e) {}

        // 3. 插入模拟导航栏
        var isDetail = isDetailPage();
        var navHTML = isDetail ? MP_NAV_DETAIL_HTML : MP_NAV_HTML;

        // 更新标题
        var title = getPageTitle();
        navHTML = navHTML.replace('>智能营销<', '>' + title + '<')
            .replace('>客户详情<', '>' + title + '<');

        document.body.insertAdjacentHTML('afterbegin', navHTML);

        // 5. 详情页特殊处理：蓝色 Header 与原生导航栏融合
        if (isDetail) {
            var blueHeader = document.querySelector('.blue-header');
            if (blueHeader) {
                blueHeader.style.paddingTop = '16px';
            }
        }

        console.log('[设计模式] ✅ 已启用，点击胶囊「×」退出');
    };

    // 禁用设计模式
    window.disableDesignMode = function () {
        document.documentElement.classList.remove('in-miniprogram');
        document.documentElement.classList.remove('design-mode-mp');

        // 清除持久化状态
        try { sessionStorage.removeItem(STORAGE_KEY); } catch(e) {}

        var nav = document.getElementById('mp-nav-simulator');
        var spacer = document.getElementById('mp-nav-spacer');
        if (nav) nav.remove();
        if (spacer) spacer.remove();

        // 恢复详情页 Header
        var blueHeader = document.querySelector('.blue-header');
        if (blueHeader) {
            blueHeader.style.paddingTop = '';
        }

        console.log('[设计模式] ❌ 已退出小程序模拟模式');
    };

    // 退出设计模式并刷新（去掉 URL 中的 design 参数）
    window.exitDesignMode = function () {
        window.disableDesignMode();
        // 去掉 URL 中的 design=mp 参数，避免刷新后重新激活
        var url = new URL(window.location.href);
        url.searchParams.delete('design');
        window.location.replace(url.toString());
    };

    // 判断是否应该启用设计模式：URL 参数 或 sessionStorage 持久化
    function shouldEnable() {
        // URL 参数优先
        if (window.location.search.indexOf('design=mp') > -1) return true;
        // sessionStorage 跨页面持久化
        try { return sessionStorage.getItem(STORAGE_KEY) === '1'; } catch(e) { return false; }
    }

    // 自动启用
    if (shouldEnable()) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', window.enableDesignMode);
        } else {
            window.enableDesignMode();
        }
    }
})();
