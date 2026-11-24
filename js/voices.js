/* voices.js: בחירת קול ההקראה.
   סקריפט רגיל (לא מודול): חולק את אותו היקף גלובלי עם שאר הקבצים, וצריך להיטען לפי הסדר ב-index.html. */
'use strict';

/* ---------------- קולות ---------------- */
/** ציון איכות לקול: קולות טבעיים ומקוונים גבוהים, קולות מכניים נמוכים. עדיפות לאנגלית אמריקאית ובריטית. */
function voiceScore(v){
  const n = v.name, lang = (v.lang || '').replace('_', '-');
  let s = 30;
  if (/natural|neural/i.test(n)) s = 100;
  else if (/online/i.test(n)) s = 90;
  else if (/google uk english female/i.test(n)) s = 72;
  else if (/google us english/i.test(n)) s = 70;
  else if (/google uk english male/i.test(n)) s = 66;
  else if (/google/i.test(n)) s = 60;
  else if (/premium|enhanced/i.test(n)) s = 75;
  else if (/samantha|daniel|karen|moira|serena|ava|allison|tessa|alex|kate|oliver/i.test(n)) s = 55;
  else if (/zira|hazel/i.test(n)) s = 45;
  else if (/david|mark|susan|george|james|richard/i.test(n)) s = 40;
  else if (/espeak/i.test(n)) s = 10;
  if (/^en-(US|GB)$/i.test(lang)) s += 3;
  return s;
}

/** טוען את הקולות האנגליים של הדפדפן לרשימה, ממיין לפי איכות ובוחר את הקול השמור או את הטוב ביותר. */
function loadVoices(){
  if (!synth) return;
  const all = synth.getVoices().filter(v => /^en/i.test((v.lang || '').replace('_', '-')));
  if (!all.length) return;
  all.sort((a, b) => voiceScore(b) - voiceScore(a));
  voices = all;
  const sel = $('#voiceSel');
  sel.textContent = '';
  voices.forEach((v, i) => {
    const o = document.createElement('option');
    o.value = v.name;
    o.textContent = v.name + (i === 0 ? '   ← מומלץ' : '');
    sel.appendChild(o);
  });
  const saved = store.get('tts.voice', '');
  const keep = voice && voices.find(v => v.name === voice.name);
  voice = keep || voices.find(v => v.name === saved) || voices[0];
  sel.value = voice.name;
  updateVoiceNote();
}

/** מעדכן את ההערה מתחת לבחירת הקול: האם ההדגשה מדויקת או מוערכת. */
function updateVoiceNote(){
  if (!voice){ $('#voiceNote').textContent = ''; return; }
  const k = voiceHasBoundary[voice.name];
  let t;
  if (k === true) t = 'בקול הזה ההדגשה של המילה מדויקת.';
  else if (k === false) t = 'בקול הזה ההדגשה של המילה מוערכת לפי קצב הדיבור, ויישור הקו מתחדש בכל משפט.';
  else t = 'הדגשת המילה תתכוונן אוטומטית לפי הקול.';
  $('#voiceNote').textContent = t;
}
