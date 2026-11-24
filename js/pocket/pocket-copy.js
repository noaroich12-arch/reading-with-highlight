/* pocket-copy.js: העתקת המילון שלי ללוח, כך שאפשר להדביק בוורד כטבלה: מילה, תרגום.
   נשלחים ללוח שני פורמטים: טבלה (HTML) וטקסט עם טאב בין המילה לתרגום (גם הוא הופך לטבלה בוורד).
   סקריפט רגיל (לא מודול): חולק את אותו היקף גלובלי עם שאר הקבצים, וצריך להיטען לפי הסדר ב-index.html. */
'use strict';

/** מנקה טקסט לפני הכנסה ל-HTML של הלוח. */
const clipEsc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** בונה את תוכן הלוח לקבוצות נתונות: { html, text }. לכל קבוצה שורת כותרת עם שם הטקסט, ואז שורה לכל מילה. */
function buildPocketClipboard(groups){
  let html = '<table dir="rtl" border="1" cellpadding="6" cellspacing="0">';
  const lines = [];
  groups.forEach(g => {
    html += '<tr><th colspan="2">' + clipEsc(g.src) + '</th></tr>';
    lines.push(g.src);
    g.items.forEach(e => {
      html += '<tr><td dir="ltr">' + clipEsc(e.w) + '</td><td>' + clipEsc(e.he || '') + '</td></tr>';
      lines.push(e.w + '\t' + (e.he || ''));
    });
    lines.push('');
  });
  return { html: html + '</table>', text: lines.join('\n').trim() };
}

/** מעתיק את הקבוצות ללוח. מוצג דיווח קצר אם הצליח או לא. */
async function copyPocketGroups(groups){
  const data = buildPocketClipboard(groups);
  try {
    if (window.ClipboardItem && navigator.clipboard && navigator.clipboard.write){
      await navigator.clipboard.write([new ClipboardItem({
        'text/html': new Blob([data.html], { type: 'text/html' }),
        'text/plain': new Blob([data.text], { type: 'text/plain' })
      })]);
    } else {
      await navigator.clipboard.writeText(data.text);
    }
    toast('הועתק. אפשר להדביק בוורד.');
  } catch(e){
    toast('ההעתקה לא הצליחה בדפדפן הזה.');
  }
}
