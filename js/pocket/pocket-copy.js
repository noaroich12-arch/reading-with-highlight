/* pocket-copy.js: העתקת המילון שלי ללוח, כך שאפשר להדביק בוורד כטבלה: מילה, תרגום.
   נשלחים ללוח שני פורמטים: טבלה (HTML) וטקסט עם טאב בין המילה לתרגום (גם הוא הופך לטבלה בוורד).
   סקריפט רגיל (לא מודול): חולק את אותו היקף גלובלי עם שאר הקבצים, וצריך להיטען לפי הסדר ב-index.html. */
'use strict';

/** מנקה טקסט לפני הכנסה ל-HTML של הלוח. */
const clipEsc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const CLIP_FONT = 'font-family:Arial,sans-serif;font-size:16pt;';   // גופן וגודל בוורד: Arial 16, קריא
const CLIP_CELL = CLIP_FONT + 'padding:6pt 10pt;border:1px solid #444;width:50%;';

/** בונה את תוכן הלוח לקבוצות נתונות: { html, text }. לכל קבוצה כותרת עם שם הטקסט, שורת כותרות (אנגלית, עברית), ואז שורה לכל מילה. */
function buildPocketClipboard(groups){
  let html = '<table dir="rtl" style="border-collapse:collapse;width:100%;">';
  const lines = [];
  groups.forEach(g => {
    html += '<tr><th colspan="2" style="' + CLIP_CELL + 'background:#e8e0cc;">' + clipEsc(g.src) + '</th></tr>';
    html += '<tr><th style="' + CLIP_CELL + 'background:#f3efe2;">אנגלית</th><th style="' + CLIP_CELL + 'background:#f3efe2;">עברית</th></tr>';
    lines.push(g.src, 'אנגלית\tעברית');
    g.items.forEach(e => {
      html += '<tr><td dir="ltr" style="' + CLIP_CELL + 'text-align:left;">' + clipEsc(e.w) + '</td><td style="' + CLIP_CELL + '">' + clipEsc(e.he || '') + '</td></tr>';
      lines.push(e.w + '\t' + (e.he || ''));
    });
    lines.push('');
  });
  return { html: html + '</table>', text: lines.join('\n').trim() };
}

/** מעתיק את הקבוצות ללוח, אחרי שמשלימים תרגום למילים שחסר להן. מוצג דיווח קצר אם הצליח או לא. */
async function copyPocketGroups(groups){
  const missing = groups.flatMap(g => g.items).filter(e => !e.he);
  if (missing.length && (ConsentGate.has('dictionary') || await requestDictConsent())){
    for (const e of missing) await fillTranslation(e.w, false);
  }
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
