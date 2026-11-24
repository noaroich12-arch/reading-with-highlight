/* safe-storage.js: שכבת אחסון מקומי שלא קורסת.
   עוטפת localStorage ב-try/catch, מגנה על נתון משובש, ועוברת לזיכרון זמני כשהאחסון חסום או מלא.
   כל מפתח שהאתר שומר חייב להופיע גם ב-compliance.json (הסורק בודק). */
var SafeStore = (function () {
  'use strict';

  var memory = {};   // גיבוי בזיכרון כשהאחסון לא זמין (מצב פרטי, חסום, מלא)

  /** מחזיר את אובייקט האחסון, או null אם אי אפשר להשתמש בו. */
  function backend() {
    try {
      var s = window.localStorage, t = '__probe__';
      s.setItem(t, '1'); s.removeItem(t);
      return s;
    } catch (e) { return null; }
  }

  /** קורא ערך טקסט. מחזיר את ברירת המחדל אם אין ערך או יש תקלה. */
  function get(key, fallback) {
    var s = backend();
    try {
      var v = s ? s.getItem(key) : (key in memory ? memory[key] : null);
      return v === null || v === undefined ? fallback : v;
    } catch (e) { return fallback; }
  }

  /** כותב ערך טקסט. מחזיר true אם נשמר באחסון הקבוע, false אם רק בזיכרון. */
  function set(key, value) {
    var s = backend();
    memory[key] = String(value);
    if (!s) return false;
    try { s.setItem(key, String(value)); return true; } catch (e) { return false; }
  }

  /** מוחק מפתח אחד. */
  function del(key) {
    delete memory[key];
    var s = backend();
    try { if (s) s.removeItem(key); } catch (e) { /* מתעלמים */ }
  }

  /** קורא JSON. אם הנתון משובש או לא עובר את בדיקת המבנה, מחזיר את ברירת המחדל. */
  function getJSON(key, fallback, validate) {
    var raw = get(key, null);
    if (raw === null) return fallback;
    try {
      var obj = JSON.parse(raw);
      if (validate && !validate(obj)) return fallback;
      return obj;
    } catch (e) { return fallback; }
  }

  /** כותב JSON. */
  function setJSON(key, obj) {
    try { return set(key, JSON.stringify(obj)); } catch (e) { return false; }
  }

  /** מוחק את כל המפתחות שברשימה. מפתח שמסתיים ב-* מתאים לכל מה שמתחיל כמוהו. */
  function clearKeys(patterns) {
    var s = backend(), keys = [], i, j;
    try { if (s) for (i = 0; i < s.length; i++) keys.push(s.key(i)); } catch (e) { /* מתעלמים */ }
    for (var k in memory) keys.push(k);
    for (i = 0; i < keys.length; i++) {
      for (j = 0; j < patterns.length; j++) {
        var p = patterns[j];
        var hit = p.slice(-1) === '*' ? keys[i].indexOf(p.slice(0, -1)) === 0 : keys[i] === p;
        if (hit) { del(keys[i]); break; }
      }
    }
  }

  return { get: get, set: set, del: del, getJSON: getJSON, setJSON: setJSON, clearKeys: clearKeys, available: function () { return !!backend(); } };
})();
