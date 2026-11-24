/* dom-build.js: בניית אלמנטים בטוחה (הטקסט נכנס כטקסט ולא כ-HTML) וכפתור עם אישור שני.
   משמש את חלונות הספרייה ומילון הכיס. סקריפט רגיל, נטען לפני שאר הקבצים. */
var DomBuild = (function () {
  'use strict';

  /** יוצר אלמנט עם מחלקה וטקסט. */
  function make(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text) e.textContent = text;
    return e;
  }

  /** יוצר כפתור שלחיצה עליו מפעילה את onClick. */
  function button(text, cls, onClick) {
    var b = make('button', 'btn ' + cls, text);
    b.type = 'button';
    b.addEventListener('click', onClick);
    return b;
  }

  /** כפתור שדורש לחיצה שנייה לאישור. אחרי 4 שניות בלי לחיצה שנייה הוא חוזר לטקסט המקורי. */
  function confirmButton(text, confirmText, cls, onConfirm) {
    var armed = false, timer = null;
    var b = button(text, cls, function () {
      if (!armed) {
        armed = true;
        b.textContent = confirmText;
        timer = setTimeout(function () { armed = false; b.textContent = text; }, 4000);
        return;
      }
      clearTimeout(timer);
      onConfirm();
    });
    return b;
  }

  return { make: make, button: button, confirmButton: confirmButton };
})();
