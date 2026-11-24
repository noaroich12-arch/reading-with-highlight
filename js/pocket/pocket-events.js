/* pocket-events.js: חיבור הלחיצות של מילון הכיס.
   סקריפט רגיל (לא מודול): חולק את אותו היקף גלובלי עם שאר הקבצים, וצריך להיטען לפי הסדר ב-index.html. */
'use strict';

document.querySelectorAll('[data-open-pocket]').forEach(b => b.addEventListener('click', openPocket));
$('#pocketClose').addEventListener('click', () => closeDialog('pocket'));
$('#pocket').addEventListener('click', e => { if (e.target.id === 'pocket') closeDialog('pocket'); });
$('#newWordBtn').addEventListener('click', addCurrentWord);
$('#pocketCopyAll').addEventListener('click', () => copyPocketGroups(pocketGroups()));
$('#dictPocketBtn').addEventListener('click', onDictPocketClick);
