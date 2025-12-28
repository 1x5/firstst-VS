// ==UserScript==
// @name         Mail.ru News Reader
// @namespace    https://github.com/1x5
// @version      2.5.0
// @description  Читалка новостей Mail.ru — только новости на весь экран + тёмная/светлая тема
// @author       1x5
// @match        *://news.mail.ru/*
// @match        *://mail.ru/*
// @match        *://www.mail.ru/*
// @include      *news.mail.ru*
// @include      *mail.ru*
// @grant        none
// @run-at       document-end
// @noframes
// ==/UserScript==

(function() {
    'use strict';

    console.log('%c[Mail.ru News Reader] 🚀 v2.5.0', 'color: lime; font-size: 14px;');

    var STORAGE_KEY = 'mailru-news-theme';
    
    // Определяем тип страницы
    var isArticlePage = window.location.pathname.match(/\/\d+\/?$/) || 
                        window.location.pathname.includes('/article/') ||
                        window.location.pathname.includes('/story/');

    function getTheme() {
        try { return localStorage.getItem(STORAGE_KEY) || 'light'; } catch(e) { return 'light'; }
    }

    function setTheme(theme) {
        try { localStorage.setItem(STORAGE_KEY, theme); } catch(e) {}
        applyTheme(theme);
    }

    function toggleTheme() {
        setTheme(getTheme() === 'dark' ? 'light' : 'dark');
    }

    // ========== ОБЩИЕ СТИЛИ ==========
    var baseCSS = '\
        /* === СКРЫТЬ ШАПКУ === */\
        header,\
        nav,\
        [class*="ph-project"],\
        [class*="pm-project"],\
        [class*="portal"],\
        [data-module="toolbar"],\
        [class*="TopLine"],\
        [class*="topline"],\
        [class*="Header"],\
        [class*="header"]:not([class*="article"]),\
        [class*="Navbar"],\
        [class*="navbar"],\
        [role="navigation"],\
        nav[aria-label="Проекты"],\
        nav[aria-label="Навигация"] {\
            display: none !important;\
        }\
        \
        /* === СКРЫТЬ КНОПКУ ВОЙТИ === */\
        [class*="login"],\
        [class*="Login"],\
        [class*="auth"],\
        [class*="Auth"],\
        a[href*="signup"],\
        a[href*="login"] {\
            display: none !important;\
        }\
        \
        /* === СКРЫТЬ БОКОВУЮ ПАНЕЛЬ === */\
        [role="complementary"],\
        aside,\
        [class*="sidebar"],\
        [class*="Sidebar"],\
        [class*="Digest"],\
        [class*="digest"] {\
            display: none !important;\
        }\
        \
        /* === СКРЫТЬ FOOTER === */\
        footer,\
        [role="contentinfo"],\
        [class*="footer"],\
        [class*="Footer"] {\
            display: none !important;\
        }\
        \
        /* === СКРЫТЬ РЕКЛАМУ === */\
        [class*="banner"],\
        [class*="Banner"],\
        [class*="advert"],\
        [class*="Advert"],\
        [id*="banner"],\
        [id*="yandex"],\
        iframe:not([src*="video"]) {\
            display: none !important;\
        }\
        \
        /* === СКРЫТЬ COOKIE === */\
        [class*="cookie"],\
        [class*="Cookie"],\
        [class*="consent"],\
        [class*="Consent"] {\
            display: none !important;\
        }\
        \
        /* === УБРАТЬ ЛИШНИЕ ОБЁРТКИ === */\
        html, body {\
            background: transparent !important;\
            margin: 0 !important;\
            padding: 0 !important;\
            overflow-x: hidden !important;\
        }\
        \
        /* === СКРЫТЬ ЛЕНТУ === */\
        .nr-hidden {\
            display: none !important;\
        }\
    ';

    // ========== СТИЛИ ДЛЯ ГЛАВНОЙ СТРАНИЦЫ ==========
    var mainPageCSS = '\
        /* === ОСНОВНОЙ КОНТЕНТ БЕЗ РАМКИ === */\
        main,\
        [role="main"],\
        article {\
            width: 100% !important;\
            max-width: 1200px !important;\
            margin: 30px auto !important;\
            padding: 20px 40px !important;\
            box-sizing: border-box !important;\
            background: transparent !important;\
            box-shadow: none !important;\
            border: none !important;\
            border-radius: 0 !important;\
        }\
        \
        /* === УВЕЛИЧИТЬ ШРИФТ НА 30% === */\
        article a,\
        article li,\
        article span,\
        article div,\
        [class*="news"] a,\
        [class*="News"] a,\
        [class*="item"] a,\
        [class*="Item"] a {\
            font-size: 23px !important;\
            line-height: 1.7 !important;\
        }\
        \
        article li,\
        [class*="news"] li {\
            padding: 14px 0 !important;\
            margin: 0 !important;\
        }\
        \
        /* Главная новость ещё крупнее */\
        article li:first-child a,\
        [class*="news"]:first-child a {\
            font-size: 28px !important;\
            font-weight: 600 !important;\
        }\
    ';

    // ========== СТИЛИ ДЛЯ СТРАНИЦЫ СТАТЬИ ==========
    var articlePageCSS = '\
        /* === КОНТЕНТ СТАТЬИ === */\
        main,\
        [role="main"],\
        article,\
        [class*="article"],\
        [class*="Article"],\
        [class*="content"],\
        [class*="Content"],\
        [class*="body"],\
        [class*="Body"],\
        [class*="text"],\
        [class*="Text"] {\
            display: block !important;\
            visibility: visible !important;\
            opacity: 1 !important;\
            width: 100% !important;\
            max-width: 900px !important;\
            margin: 30px auto !important;\
            padding: 20px 40px !important;\
            box-sizing: border-box !important;\
            background: transparent !important;\
            box-shadow: none !important;\
        }\
        \
        /* === ПОКАЗАТЬ ТЕКСТ СТАТЬИ === */\
        article p,\
        article h1,\
        article h2,\
        article h3,\
        article h4,\
        article div,\
        article span,\
        article img,\
        article figure,\
        article blockquote,\
        [class*="article"] p,\
        [class*="article"] div,\
        [class*="article"] span,\
        [class*="article"] img,\
        [class*="paragraph"],\
        [class*="Paragraph"] {\
            display: block !important;\
            visibility: visible !important;\
            opacity: 1 !important;\
        }\
        \
        /* === УВЕЛИЧИТЬ ШРИФТ СТАТЬИ НА 30% === */\
        article p,\
        article div,\
        article span,\
        article li,\
        [class*="article"] p,\
        [class*="content"] p,\
        [class*="text"] {\
            font-size: 21px !important;\
            line-height: 1.8 !important;\
        }\
        \
        article h1,\
        [class*="article"] h1,\
        [class*="title"] {\
            font-size: 36px !important;\
            line-height: 1.3 !important;\
            font-weight: 700 !important;\
            margin-bottom: 20px !important;\
        }\
        \
        article h2 {\
            font-size: 28px !important;\
        }\
        \
        article h3 {\
            font-size: 24px !important;\
        }\
        \
        article img {\
            max-width: 100% !important;\
            height: auto !important;\
            display: block !important;\
            margin: 20px auto !important;\
        }\
        \
        article blockquote {\
            font-size: 20px !important;\
            font-style: italic !important;\
            border-left: 4px solid #666 !important;\
            padding-left: 20px !important;\
            margin: 20px 0 !important;\
        }\
    ';

    // ========== ТЁМНАЯ ТЕМА ==========
    var darkCSS = '\
        html, body {\
            background: #0a0a0a !important;\
            color: #e0e0e0 !important;\
        }\
        \
        main, article, section, div, p, span, h1, h2, h3, h4, h5, h6, li, a, blockquote {\
            color: #e0e0e0 !important;\
            background-color: transparent !important;\
        }\
        \
        a {\
            color: #7cb8ff !important;\
        }\
        \
        a:hover {\
            color: #a8d4ff !important;\
        }\
        \
        img {\
            opacity: 0.9 !important;\
            filter: brightness(0.95) !important;\
        }\
        \
        #nr-theme-btn {\
            color: #ddd !important;\
        }\
        #nr-theme-btn:hover {\
            color: #fff !important;\
        }\
    ';

    // ========== СВЕТЛАЯ ТЕМА ==========
    var lightCSS = '\
        html, body {\
            background: #fafafa !important;\
        }\
        \
        main, article {\
            background: transparent !important;\
        }\
        \
        #nr-theme-btn {\
            color: #333 !important;\
        }\
        #nr-theme-btn:hover {\
            color: #000 !important;\
        }\
    ';

    function applyTheme(theme) {
        var old = document.getElementById('nr-theme-css');
        if (old) old.remove();

        var style = document.createElement('style');
        style.id = 'nr-theme-css';
        style.textContent = theme === 'dark' ? darkCSS : lightCSS;
        document.head.appendChild(style);

        var btn = document.getElementById('nr-theme-btn');
        if (btn) {
            btn.textContent = theme === 'dark' ? '☀' : '☽';
            btn.title = theme === 'dark' ? 'Светлая тема' : 'Тёмная тема';
        }
    }

    function addStyles() {
        var style = document.createElement('style');
        style.id = 'nr-main-css';
        style.textContent = baseCSS + (isArticlePage ? articlePageCSS : mainPageCSS);
        document.head.appendChild(style);
    }

    function createButton() {
        var btn = document.createElement('button');
        btn.id = 'nr-theme-btn';
        btn.textContent = getTheme() === 'dark' ? '☀' : '☽';
        btn.title = getTheme() === 'dark' ? 'Светлая тема' : 'Тёмная тема';
        btn.style.cssText = '\
            position: fixed !important;\
            top: 25px !important;\
            right: 25px !important;\
            z-index: 2147483647 !important;\
            padding: 0 !important;\
            background: transparent !important;\
            border: none !important;\
            cursor: pointer !important;\
            font-size: 36px !important;\
            line-height: 1 !important;\
            opacity: 0.8 !important;\
            transition: opacity 0.2s ease, transform 0.2s ease !important;\
        ';
        btn.onmouseover = function() { 
            this.style.opacity = '1'; 
            this.style.transform = 'scale(1.1)';
        };
        btn.onmouseout = function() { 
            this.style.opacity = '0.8'; 
            this.style.transform = 'scale(1)';
        };
        btn.onclick = toggleTheme;
        document.body.appendChild(btn);
    }

    // === СКРЫТЬ ЭЛЕМЕНТЫ (только для главной) ===
    function hideElements() {
        if (isArticlePage) return; // Не скрываем на странице статьи

        // Скрыть кнопки Войти/Регистрация
        document.querySelectorAll('button, a').forEach(function(el) {
            var text = el.textContent.trim();
            if (text === 'Войти' || text === 'Регистрация') {
                el.style.display = 'none';
            }
        });

        // Скрыть "Лента новостей" полностью
        document.querySelectorAll('h2').forEach(function(h2) {
            if (h2.textContent.includes('Лента новостей')) {
                var container = h2.parentElement;
                for (var i = 0; i < 5; i++) {
                    if (container && container.parentElement) {
                        container = container.parentElement;
                    }
                }
                if (container) {
                    container.classList.add('nr-hidden');
                }
            }
        });

        // Скрыть все article кроме первого
        var articles = document.querySelectorAll('article');
        if (articles.length > 1) {
            for (var i = 1; i < articles.length; i++) {
                articles[i].classList.add('nr-hidden');
            }
        }

        // Скрыть всё после основного article
        var mainArticle = document.querySelector('article');
        if (mainArticle) {
            var next = mainArticle.nextElementSibling;
            while (next) {
                next.classList.add('nr-hidden');
                next = next.nextElementSibling;
            }
        }
    }

    function init() {
        console.log('[Mail.ru News Reader] Тип страницы:', isArticlePage ? 'Статья' : 'Главная');
        
        addStyles();
        createButton();
        applyTheme(getTheme());
        
        hideElements();
        setTimeout(hideElements, 500);
        setTimeout(hideElements, 1500);
        
        console.log('[Mail.ru News Reader] ✅ Готово!');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
