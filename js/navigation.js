/* navigation.js: ניווט בין מילים, משפטים ופסקאות, ושינוי מהירות וסנכרון.
   סקריפט רגיל (לא מודול): חולק את אותו היקף גלובלי עם שאר הקבצים, וצריך להיטען לפי הסדר ב-index.html. */
'use strict';

/* ---------------- ניווט ---------------- */
/** עובר למילה i. בזמן הקראה עוצר, ומתחיל להקריא משם אחרי רגע קצר. */
function go(i){
  if (!words.length) return;
  i = clamp(i, 0, words.length - 1);
  finished = false;
  if (playing){
    halt();
    setCur(i);
    clearTimeout(queueT);
    queueT = setTimeout(() => { if (playing) speakFrom(cur); }, 220);
  } else {
    setCur(i);
  }
}

/** המילה הבאה. */
const wordNext = () => go(cur + 1);
/** המילה הקודמת. */
const wordPrev = () => go(cur - 1);
/** תחילת המשפט הבא. */
function sentNext(){
  const s = sentences[words[cur].s];
  go(s.last + 1 >= words.length ? cur : s.last + 1);
}
/** תחילת המשפט הנוכחי, ואם כבר שם אז תחילת המשפט הקודם. */
function sentPrev(){
  const si = words[cur].s, s = sentences[si];
  if (cur > s.first + 1 || si === 0) go(s.first);
  else go(sentences[si - 1].first);
}
/** תחילת הפסקה הבאה. */
function paraNext(){
  const p = paras[words[cur].p];
  go(p.last + 1 >= words.length ? cur : p.last + 1);
}
/** תחילת הפסקה הנוכחית, ואם כבר שם אז תחילת הפסקה הקודמת. */
function paraPrev(){
  const pi = words[cur].p, p = paras[pi];
  if (cur > p.first + 1 || pi === 0) go(p.first);
  else go(paras[pi - 1].first);
}

/** קובע מהירות הקראה (0.3 עד 2), שומר, ואם מקריאים מתחיל מחדש במהירות החדשה. */
function setRate(r){
  rate = Math.round(clamp(r, 0.3, 2) * 100) / 100;
  $('#rateVal').textContent = rate.toFixed(2);
  store.set('tts.rate65', String(rate));
  if (playing){
    halt();
    clearTimeout(queueT);
    queueT = setTimeout(() => { if (playing) speakFrom(cur); }, 250);
  }
}

/** קובע כמה מילים להקדים את ההדגשה (0 עד 6) ושומר. */
function setLead(n){
  lead = clamp(n, 0, 6);
  $('#leadVal').textContent = String(lead);
  store.set('tts.lead', String(lead));
}
