/* a11y-helpers.js: כלי נגישות קטנים לשימוש חוזר.
   announce: הכרזה לקורא מסך. setScreen: מעבר מסך נגיש. trapFocus: מלכוד פוקוס בחלון.
   upgradeClickables: הופך span/div עם onclick לכפתור שאפשר להגיע אליו במקלדת. escapeHtml: ניקוי טקסט. */
var A11y = (function () {
  'use strict';

  var liveEl = null;

  /** מחזיר (ויוצר אם צריך) אזור הכרזה סמוי. */
  function liveRegion() {
    if (liveEl) return liveEl;
    liveEl = document.createElement('div');
    liveEl.className = 'sr-only';
    liveEl.setAttribute('role', 'status');
    liveEl.setAttribute('aria-live', 'polite');
    document.body.appendChild(liveEl);
    return liveEl;
  }

  /** מכריז הודעה בקול לקורא מסך (בלי להציג אותה). */
  function announce(message) {
    var el = liveRegion();
    el.textContent = '';
    setTimeout(function () { el.textContent = message; }, 60);   // ריקון קצר כדי שגם הודעה חוזרת תוכרז
  }

  /** מעדכן כותרת דף, מזיז פוקוס לכותרת המסך ומכריז. נקרא אחרי כל החלפת מסך. */
  function setScreen(title, headingEl) {
    var site = document.documentElement.getAttribute('data-site-name') || '';
    document.title = (site && title !== site) ? title + ' | ' + site : title;   // בלי כפילות כשהכותרת היא שם האתר
    if (headingEl) {
      if (!headingEl.hasAttribute('tabindex')) headingEl.setAttribute('tabindex', '-1');
      headingEl.focus({ preventScroll: false });
    }
    announce(title);
  }

  /** מחזיר את הרכיבים שאפשר להגיע אליהם בפוקוס בתוך אלמנט. */
  function focusables(container) {
    return Array.prototype.slice.call(container.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )).filter(function (el) { return el.offsetParent !== null; });
  }

  /** מונע מהפוקוס לצאת מחלון. מחזיר פונקציה שמשחררת (וגם מחזירה פוקוס לכפתור שפתח). */
  function trapFocus(container, onEscape) {
    var opener = document.activeElement;
    function onKey(e) {
      if (e.key === 'Escape' && onEscape) { e.preventDefault(); onEscape(); return; }
      if (e.key !== 'Tab') return;
      var f = focusables(container);
      if (!f.length) { e.preventDefault(); return; }
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    container.addEventListener('keydown', onKey);
    var f0 = focusables(container);
    if (f0.length) f0[0].focus();
    return function release() {
      container.removeEventListener('keydown', onKey);
      if (opener && opener.focus) opener.focus();
    };
  }

  /** הופך אלמנט שאינו כפתור אבל יש לו onclick לכפתור נגיש: תפקיד, פוקוס, Enter ורווח. */
  function upgrade(el) {
    if (el.getAttribute('data-a11y-up')) return;
    el.setAttribute('data-a11y-up', '1');
    el.setAttribute('role', 'button');
    if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '0');
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); el.click(); }
    });
  }

  /** משדרג את כל הרכיבים הלחיצים שאינם כפתורים, ועוקב אחרי מסכים שנבנים מחדש. */
  function upgradeClickables(root) {
    var skip = ':not(button):not(a):not(input):not(select):not(textarea):not([role="button"])';
    var sel = '[onclick]' + skip + ', [data-act]' + skip;
    function run(scope) { Array.prototype.forEach.call(scope.querySelectorAll(sel), upgrade); }
    run(root);
    if (!window.MutationObserver) return;
    var pending = false;
    new MutationObserver(function () {
      if (pending) return; pending = true;
      setTimeout(function () { pending = false; run(root); }, 50);
    }).observe(root, { childList: true, subtree: true });
  }

  /** מנקה טקסט לפני הכנסה ל-HTML. */
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  return { announce: announce, setScreen: setScreen, trapFocus: trapFocus, upgradeClickables: upgradeClickables, escapeHtml: escapeHtml };
})();
