/* library-events.js: חיבור הלחיצות של ספריית הטקסטים.
   צריך להיטען אחרי events.js, כי ההאזנה ל"התחילי לקרוא" כאן רצה אחרי ההאזנה שפותחת את הקריאה.
   סקריפט רגיל (לא מודול): חולק את אותו היקף גלובלי עם שאר הקבצים, וצריך להיטען לפי הסדר ב-index.html. */
'use strict';

// אחרי שהקריאה נפתחה: אם נכתב שם בתיבת "שם לשמירה" שומרים בספרייה, ואם לא, הטקסט נחשב לא שמור
$('#startBtn').addEventListener('click', () => {
  if ($('#readView').hidden) return;
  const name = $('#saveName').value.trim();
  librarySetCurrent('');
  if (name) saveCurrentText(name);
  $('#saveName').value = '';
  refreshTextTitle();
});

// כותרת בראש הקריאה: נשמרת כשמסיימים לכתוב (יציאה מהתיבה או Enter)
$('#textTitle').addEventListener('change', commitTextTitle);
$('#textTitle').addEventListener('keydown', e => { if (e.key === 'Enter'){ e.preventDefault(); e.target.blur(); } });

$('#libBtn').addEventListener('click', openLibrary);
$('#libraryClose').addEventListener('click', () => closeDialog('library'));
$('#library').addEventListener('click', e => { if (e.target.id === 'library') closeDialog('library'); });

$('#saveBtn').addEventListener('click', openSaveDialog);
$('#saveConfirm').addEventListener('click', () => { if (saveCurrentText($('#saveTitle').value)) closeDialog('saveText'); });
$('#saveCancel').addEventListener('click', () => closeDialog('saveText'));
$('#saveText').addEventListener('click', e => { if (e.target.id === 'saveText') closeDialog('saveText'); });
$('#saveTitle').addEventListener('keydown', e => { if (e.key === 'Enter'){ e.preventDefault(); $('#saveConfirm').click(); } });

window.addEventListener('beforeunload', () => libraryRememberPos(cur));
