/* pocket-add.js: הוספת מילה ל"המילון שלי". מילה נכנסת רק בלחיצה על "מילה חדשה" (או על הכפתור שבחלון המילון).
   פתיחת המילון רק לצורך תרגום לא מוסיפה כלום.
   סקריפט רגיל (לא מודול): חולק את אותו היקף גלובלי עם שאר הקבצים, וצריך להיטען לפי הסדר ב-index.html. */
'use strict';

/** שם הטקסט הפתוח, אם הוא שמור בספרייה. */
function currentSourceTitle(){ return (libraryFind(libraryCurrentId()) || {}).title; }

/** מוסיף מילה עם שם הטקסט הפתוח ומסמן אותה בטקסט. מחזיר true אם נוספה. */
function addWordToMyDictionary(word, he){
  if (!pocketAdd(word, he, currentSourceTitle())){
    toast('אין מקום לשמור בדפדפן. אפשר למחוק מילים ישנות מהמילון שלי.');
    return false;
  }
  applyPocketMarks();
  return true;
}

/** משלים תרגום למילה שנוספה בלי תרגום. בלי הסכמה למילון: רק אם askConsent, ואז שואל. */
async function fillTranslation(key, askConsent){
  const e = pocketEntry(key);
  if (!e || e.he) return;
  if (!ConsentGate.has('dictionary')){
    if (!askConsent || !(await requestDictConsent())) return;
  }
  try {
    const res = await lookup(e.w);
    pocketSetHe(key, res.main);
    if (!$('#pocket').hidden) renderPocketList();
  } catch(err){
    if (askConsent) toast('לא הצלחתי למצוא תרגום עכשיו. אפשר לנסות שוב בעוד רגע.');
  }
}

/** כפתור "מילה חדשה": מוסיף את המילה הנוכחית למילון שלי (בלי לפתוח את המילון). */
function addCurrentWord(){
  if (!words.length) return;
  const w = cleanWord(words[cur].t);
  if (!w){ toast('במילה הזאת אין מה להוסיף. אפשר לבחור מילה אחרת.'); return; }
  const key = pocketKey(w), e = pocketEntry(key);
  if (e && e.st === 'new'){ toast('המילה כבר במילון שלי: ' + w); return; }
  if (e){ pocketSetStatus(key, 'new'); applyPocketMarks(); toast('סומנה שוב כמילה חדשה: ' + w); return; }
  if (!addWordToMyDictionary(w, '')) return;
  toast('נוספה למילון שלי: ' + w);
  fillTranslation(key, false);
}
