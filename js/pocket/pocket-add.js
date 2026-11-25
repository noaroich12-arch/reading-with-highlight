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

/** מחזיר תרגום ראשי למילה, או '' אם אי אפשר. בלי הסכמה למילון: רק אם askConsent, ואז שואל.
    inContext: המילה היא המילה הנוכחית בטקסט, אז קודם מנסים תרגום לפי ההקשר של המשפט. */
async function translationFor(word, askConsent, inContext){
  if (!ConsentGate.has('dictionary')){
    if (!askConsent || !(await requestDictConsent())) return '';
  }
  if (inContext){
    const ctx = await contextTranslationNow();
    if (ctx) return ctx;
  }
  try { return (await lookup(word)).main; } catch(err){ return ''; }
}

/** משלים תרגום למילה שנוספה בלי תרגום. מחזיר true אם הצליח. */
async function fillTranslation(key, askConsent){
  const e = pocketEntry(key);
  if (!e || e.he) return !!(e && e.he);
  const he = await translationFor(e.w, askConsent);
  if (!he){
    if (askConsent) toast('לא הצלחתי למצוא תרגום עכשיו. אפשר לנסות שוב בעוד רגע.');
    return false;
  }
  pocketSetHe(key, he);
  if (!$('#pocket').hidden) renderPocketList();
  return true;
}

/** משלים תרגום לכל המילים שנשמרו בלי תרגום (רק אם כבר יש הסכמה למילון). נקרא כשפותחים את "המילון שלי". */
async function fillAllMissingTranslations(){
  if (!ConsentGate.has('dictionary')) return;
  const missing = Object.values(pocketAll()).filter(x => x && x.w && !x.he && !x.man);
  for (const e of missing) await fillTranslation(e.w, false);
}

/** כפתור "מילה חדשה": מביא את התרגום ושומר את המילה הנוכחית יחד איתו במילון שלי. */
async function addCurrentWord(){
  if (!words.length) return;
  const w = cleanWord(words[cur].t);
  if (!w){ toast('במילה הזאת אין מה להוסיף. אפשר לבחור מילה אחרת.'); return; }
  const key = pocketKey(w), e = pocketEntry(key);
  if (e && e.st === 'new'){ toast('המילה כבר במילון שלי: ' + w); return; }
  if (e){ pocketSetStatus(key, 'new'); applyPocketMarks(); toast('סומנה שוב כמילה חדשה: ' + w); return; }
  const he = await translationFor(w, true, true);
  if (!addWordToMyDictionary(w, he)) return;
  toast(he ? 'נוספה למילון שלי: ' + w + ' = ' + he
           : 'נוספה בלי תרגום: ' + w + '. אפשר ללחוץ "תרגום" ב"המילון שלי".');
}
