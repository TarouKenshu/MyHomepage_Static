'use strict';
//ここからJava Scriptを書いていきます
 
    (function () {
      'use strict';

      var docMain = document.getElementById('docMain');
      var docNavList = document.getElementById('docNavList');
      var outlineList = document.getElementById('outlineList');
      var docSearch = document.getElementById('docSearch');
      var panels = Array.prototype.slice.call(document.querySelectorAll('.doc-panel'));
      var navLinks = Array.prototype.slice.call(document.querySelectorAll('#docNavList .doc-link'));

      /* ---------- 左ナビ：項目切り替え ---------- */
      function activateDoc(docId, opts) {
        opts = opts || {};
        var panel = null;
        panels.forEach(function (p) {
          var isTarget = p.getAttribute('data-doc') === docId;
          if (isTarget) { panel = p; }
          if (opts.pushHash === false) {
            p.hidden = !isTarget;
          } else {
            p.hidden = !isTarget;
          }
        });
        if (!panel) { return; }

        navLinks.forEach(function (link) {
          var isActive = link.getAttribute('data-doc') === docId;
          link.classList.toggle('active', isActive);
          if (isActive) { link.setAttribute('aria-current', 'page'); }
          else { link.removeAttribute('aria-current'); }
        });

        if (opts.pushHash !== false) {
          // 直リンク可能にする（例: document.html#cards）
          if (history.replaceState) {
            history.replaceState(null, '', '#' + docId);
          } else {
            location.hash = docId;
          }
        }

        buildOutline(panel);
        docMain.scrollTop = 0;
        document.title = (panel.querySelector('h1') || {}).textContent + ' | ドキュメント';
      }

      navLinks.forEach(function (link) {
        link.addEventListener('click', function (event) {
          event.preventDefault();
          activateDoc(link.getAttribute('data-doc'));
        });
      });

      /* ---------- 右アウトライン：現在の記事から自動生成 ---------- */
      function buildOutline(panel) {
        outlineList.innerHTML = '';
        var headings = panel.querySelectorAll('h2, h3');
        if (!headings.length) {
          outlineList.innerHTML = '<li><a href="#" aria-disabled="true">見出しがありません</a></li>';
          return;
        }
        headings.forEach(function (heading, index) {
          // id が無い見出しにも一意な id を付ける（ひな形として便利）
          if (!heading.id) {
            heading.id = 'heading-' + index;
          }
          var li = document.createElement('li');
          var a = document.createElement('a');
          a.href = '#' + heading.id;
          a.textContent = heading.textContent.trim();
          a.dataset.targetId = heading.id;
          a.style.paddingLeft = heading.tagName === 'H3' ? '2rem' : '1rem';
          a.addEventListener('click', function (event) {
            event.preventDefault();
            scrollToHeading(heading);
          });
          li.appendChild(a);
          outlineList.appendChild(li);
        });
        updateActiveOutline();
      }

      /* ---------- アウトラインクリック：中央だけをその見出し位置に移動 ---------- */
      function scrollToHeading(heading) {
        // ページ全体ではなく中央カラム(#docMain)の scrollTop を計算する
        var mainRect = docMain.getBoundingClientRect();
        var headingRect = heading.getBoundingClientRect();
        var offset = 16; // 上部の余白
        var top = docMain.scrollTop + (headingRect.top - mainRect.top) - offset;

        docMain.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
        heading.setAttribute('tabindex', '-1');
        // フォーカスはスクロール完了後に軽く合わせる（キーボード操作補助）
        // 表示がずれる環境のため preventScroll で二重スクロールを防ぐ
        heading.focus({ preventScroll: true });
      }

      /* ---------- Scrollspy：中央のスクロール位置でアウトラインをハイライト ---------- */
      var ticking = false;
      function updateActiveOutline() {
        var links = outlineList.querySelectorAll('a[data-target-id]');
        if (!links.length) { return; }

        var mainRect = docMain.getBoundingClientRect();
        var currentId = null;
        links.forEach(function (link) {
          var target = document.getElementById(link.dataset.targetId);
          if (!target) { return; }
          var rect = target.getBoundingClientRect();
          // 見出しが中央カラムの上端を過ぎたものを「現在位置」とみなす
          if (rect.top - mainRect.top <= 24) {
            currentId = link.dataset.targetId;
          }
        });
        links.forEach(function (link) {
          var isActive = link.dataset.targetId === currentId;
          link.classList.toggle('active', isActive);
          if (isActive) { link.setAttribute('aria-current', 'true'); }
          else { link.removeAttribute('aria-current'); }
        });
      }

      docMain.addEventListener('scroll', function () {
        if (!ticking) {
          requestAnimationFrame(function () {
            updateActiveOutline();
            ticking = false;
          });
          ticking = true;
        }
      }, { passive: true });

      /* ---------- 左ナビの絞り込み（任意） ---------- */
      if (docSearch) {
        docSearch.addEventListener('input', function () {
          var query = docSearch.value.trim().toLowerCase();
          navLinks.forEach(function (link) {
            var text = link.textContent.trim().toLowerCase();
            link.style.display = (!query || text.indexOf(query) !== -1) ? '' : 'none';
          });
        });
      }

      /* ---------- 初期表示：URL のハッシュに対応する項目を開く ---------- */
      var initial = (location.hash || '').replace(/^#/, '');
      var initialPanel = panels.some(function (p) { return p.getAttribute('data-doc') === initial; })
        ? initial
        : (panels[0] && panels[0].getAttribute('data-doc'));

      if (initialPanel) {
        activateDoc(initialPanel, { pushHash: false });
      }

      window.addEventListener('hashchange', function () {
        var id = (location.hash || '').replace(/^#/, '');
        var matched = panels.some(function (p) { return p.getAttribute('data-doc') === id; });
        var target = matched ? id : (panels[0] && panels[0].getAttribute('data-doc'));
        if (target) { activateDoc(target, { pushHash: false }); }
      });
    })();
