/* error-boundary.js: מונע קריסה של האתר כולו בגלל שגיאה אחת.
   טוען ראשון. תופס שגיאות כלליות ודחיות Promise, מציג הודעה ברורה, ולא נכנס ללולאה.
   מגן גם מהטמעה של האתר בתוך אתר זר (clickjacking), כי ב-GitHub Pages אי אפשר להגדיר כותרות שרת. */
(function () {
  'use strict';

  var shownAt = 0;      // מתי הוצגה הודעה אחרונה
  var shownCount = 0;   // כמה הודעות הוצגו בסך הכול

  /** מחזיר true אם השגיאה לא שווה הודעה למשתמש (רעש של דפדפן או תוספים). */
  function isIgnorable(msg, file) {
    var m = String(msg || '');
    if (/ResizeObserver loop/i.test(m)) return true;
    if (/^Script error\.?$/i.test(m)) return true;
    if (file && /^(chrome|moz|safari)-extension:/i.test(file)) return true;
    return false;
  }

  /** בונה כפתור פשוט להודעה. */
  function button(label, onClick) {
    var b = document.createElement('button');
    b.type = 'button';
    b.textContent = label;
    b.addEventListener('click', onClick);
    return b;
  }

  /** מציג הודעה ידידותית (לכל היותר שלוש, ולא יותר מאחת בעשר שניות). */
  function showMessage() {
    var now = Date.now();
    if (shownCount >= 3 || now - shownAt < 10000) return;
    shownAt = now; shownCount++;
    var box = document.createElement('div');
    box.className = 'site-guard';
    box.setAttribute('role', 'alert');
    var p = document.createElement('p');
    p.style.margin = '0';
    p.textContent = 'משהו השתבש באתר. ההתקדמות שנשמרה לא נפגעה. אפשר להמשיך, ואם משהו לא עובד, לטעון את הדף מחדש.';
    box.appendChild(p);
    box.appendChild(button('טעינה מחדש', function () { location.reload(); }));
    box.appendChild(button('סגירה', function () { box.remove(); }));
    document.body.appendChild(box);
  }

  /** מטפל בשגיאה: רושם לקונסולה ומציג הודעה אם צריך. */
  function handle(msg, file) {
    if (isIgnorable(msg, file)) return;
    try { console.error('[site-guard]', msg); } catch (e) { /* אין קונסולה */ }
    if (document.body) showMessage();
  }

  window.addEventListener('error', function (e) { handle(e.message, e.filename); });
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    handle(r && r.message ? r.message : r, '');
  });

  /** עוטף פונקציה כך שכל שגיאה בה נתפסת ולא עוצרת את שאר האתר. */
  function safe(fn, fallback) {
    return function () {
      try { return fn.apply(this, arguments); }
      catch (err) { handle(err && err.message, ''); return fallback; }
    };
  }

  /** אם הדף נטען בתוך מסגרת של אתר אחר: מסתיר אותו ומציע לפתוח ישירות. */
  function guardFraming() {
    var framed = false;
    try { framed = window.top !== window.self && window.top.location.origin !== location.origin; }
    catch (e) { framed = true; }   // גישה חסומה = אתר אחר
    if (!framed) return;
    document.documentElement.style.display = 'none';
    try { window.top.location = location.href; } catch (e) { /* נחסם: נשאר מוסתר */ }
  }

  guardFraming();
  window.SiteGuard = { safe: safe, report: handle };
})();
