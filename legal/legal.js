/* legal.js: כפתורי "מחיקת הנתונים שלי" ו"ביטול הסכמה" בעמוד הפרטיות.
   עצמאי: לא תלוי בקבצים אחרים של האתר. המפתחות לניקוי מגיעים מהתכונות data-keys ו-data-caches בדף. */
(function () {
  'use strict';

  /** מציג הודעת מצב בתוך אזור שמוכרז לקורא מסך. */
  function say(msg) {
    var s = document.getElementById('status');
    if (s) s.textContent = msg;
  }

  /** קורא רשימה (JSON) מתכונת של אלמנט. */
  function list(el, attr) {
    try { return JSON.parse(el.getAttribute(attr) || '[]'); } catch (e) { return []; }
  }

  /** מוחק מפתחות מהאחסון המקומי. מפתח שמסתיים ב-* מתאים לכל מה שמתחיל כמוהו. */
  function clearStorage(patterns) {
    var keys = [], i, j;
    try { for (i = 0; i < localStorage.length; i++) keys.push(localStorage.key(i)); } catch (e) { return; }
    keys.forEach(function (k) {
      for (j = 0; j < patterns.length; j++) {
        var p = patterns[j];
        if ((p.slice(-1) === '*' && k.indexOf(p.slice(0, -1)) === 0) || k === p) {
          try { localStorage.removeItem(k); } catch (e) { /* מתעלמים */ }
          break;
        }
      }
    });
  }

  /** מוחק קבצים שנשמרו במטמון ומבטל רישום של service worker. */
  function clearCaches(names) {
    if (window.caches) names.forEach(function (n) { caches.delete(n); });
    if (navigator.serviceWorker && navigator.serviceWorker.getRegistrations) {
      navigator.serviceWorker.getRegistrations().then(function (rs) { rs.forEach(function (r) { r.unregister(); }); });
    }
  }

  /** כפתור המחיקה: לחיצה ראשונה מבקשת אישור, שנייה מוחקת. */
  function wireClear(btn) {
    var armed = false, label = btn.textContent;
    btn.addEventListener('click', function () {
      if (!armed) { armed = true; btn.textContent = 'לחיצה נוספת תמחק הכול. כדי לבטל, אפשר פשוט לעבור לדף אחר'; say('נדרש אישור נוסף'); return; }
      clearStorage(list(btn, 'data-keys'));
      clearCaches(list(btn, 'data-caches'));
      armed = false; btn.textContent = label; say('הנתונים השמורים במכשיר הזה נמחקו.');
    });
  }

  /** מציג כפתור ביטול לכל הסכמה שניתנה (consent.*). */
  function wireConsents(box) {
    var ids = [], i;
    try { for (i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k.indexOf('consent.') === 0) ids.push(k); } } catch (e) { return; }
    if (!ids.length) { box.textContent = 'לא ניתנו הסכמות במכשיר הזה.'; return; }
    ids.forEach(function (k) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'btn secondary';
      b.textContent = 'ביטול ההסכמה: ' + k.replace('consent.', '');
      b.addEventListener('click', function () { try { localStorage.removeItem(k); } catch (e) { /* מתעלמים */ } b.remove(); say('ההסכמה בוטלה.'); });
      box.appendChild(b); box.appendChild(document.createTextNode(' '));
    });
  }

  document.querySelectorAll('[data-clear-data]').forEach(wireClear);
  document.querySelectorAll('[data-consents]').forEach(wireConsents);
})();
