/* consent-gate.js: הסכמה ברגע הצורך לשירות חיצוני או לתכונת מכשיר (מילון, מיקרופון).
   לא באנר כללי: החלון מופיע רק כשלוחצים על הפעולה, ואומר מה יישלח, למי ולמה.
   "אפשר" נשמר (consent.<שם>) וניתן לביטול בעמוד הפרטיות. "לא עכשיו" לא נשמר ולא פוגע בשאר האתר.
   תלוי ב-safe-storage.js וב-a11y-helpers.js. */
var ConsentGate = (function () {
  'use strict';

  var PREFIX = 'consent.';

  /** האם כבר ניתנה הסכמה לשירות הזה. */
  function has(id) { return SafeStore.get(PREFIX + id, '') === 'yes'; }

  /** מבטל הסכמה שניתנה. */
  function revoke(id) { SafeStore.del(PREFIX + id); }

  /** בונה אלמנט עם טקסט. */
  function el(tag, text, cls) {
    var e = document.createElement(tag);
    if (text) e.textContent = text;
    if (cls) e.className = cls;
    return e;
  }

  /** מציג את חלון ההסכמה ומחזיר Promise עם true או false.
      opts: { title, text (שורות מופרדות ב-\n), yes, no, moreUrl, moreLabel } */
  function ask(id, opts) {
    if (has(id)) return Promise.resolve(true);
    return new Promise(function (resolve) {
      var backdrop = el('div', '', 'cg-backdrop');
      var box = el('div', '', 'cg-dialog');
      box.setAttribute('role', 'dialog');
      box.setAttribute('aria-modal', 'true');
      var h = el('h2', opts.title);
      h.id = 'cg-title-' + id;
      box.setAttribute('aria-labelledby', h.id);
      box.appendChild(h);
      String(opts.text || '').split('\n').forEach(function (line) { if (line) box.appendChild(el('p', line)); });
      if (opts.moreUrl) {
        var a = el('a', opts.moreLabel || 'מה עוד כדאי לדעת', 'cg-more');
        a.href = opts.moreUrl; a.target = '_blank'; a.rel = 'noopener noreferrer';
        box.appendChild(a);
      }
      var actions = el('div', '', 'cg-actions');
      var yes = el('button', opts.yes || 'אפשר', 'cg-yes'); yes.type = 'button';
      var no = el('button', opts.no || 'לא עכשיו', 'cg-no'); no.type = 'button';
      actions.appendChild(yes); actions.appendChild(no); box.appendChild(actions);
      backdrop.appendChild(box); document.body.appendChild(backdrop);

      var release = null;
      function finish(answer) {
        if (release) release();
        backdrop.remove();
        if (answer) SafeStore.set(PREFIX + id, 'yes');
        resolve(answer);
      }
      yes.addEventListener('click', function () { finish(true); });
      no.addEventListener('click', function () { finish(false); });
      release = A11y.trapFocus(box, function () { finish(false); });
    });
  }

  return { ask: ask, has: has, revoke: revoke };
})();
