/* text-edit-events.js: חיבור הלחיצות של עריכת הטקסט.
   סקריפט רגיל (לא מודול): חולק את אותו היקף גלובלי עם שאר הקבצים, וצריך להיטען לפי הסדר ב-index.html. */
'use strict';

$('#editBtn').addEventListener('click', openTextEdit);
$('#editSaveStart').addEventListener('click', () => saveTextEdit(true));
$('#editSaveHere').addEventListener('click', () => saveTextEdit(false));
$('#editClear').addEventListener('click', clearEditBox);
$('#editCancel').addEventListener('click', cancelTextEdit);
$('#editText').addEventListener('input', resetEditCancel);
