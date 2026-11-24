/* dictionary.js: מילון: תרגום מילה דרך Google Translate והשמעת המילה.
   סקריפט רגיל (לא מודול): חולק את אותו היקף גלובלי עם שאר הקבצים, וצריך להיטען לפי הסדר ב-index.html. */
'use strict';

/* ---------------- מילון ---------------- */
/** מנקה מילה לחיפוש במילון: בלי סימנים בהתחלה ובסוף, ובלי הסיומת 's. */
function cleanWord(t){
  return t.replace(/^[^A-Za-z0-9À-ɏ]+/, '').replace(/[^A-Za-z0-9À-ɏ]+$/, '')
          .replace(/[’]s$/i, '').replace(/'s$/i, '');
}

/* המילון: Google Translate, תרגום ראשי + משמעויות לפי סוג מילה (עם ניקוד, כמו שהוא נותן, כי בלי ניקוד נוצרות מילים בכתיב שגוי).
   המקור הקודם (MyMemory, מאגר שכל אחד מוסיף לו) נתן "לא מושלם" למילה perfectly, ולכן הוסר גם כגיבוי:
   תרגום הפוך גרוע מלא להציג תרגום. אם Google לא עונה, מוצגת הודעה עם כפתור לפתיחה ב-Google Translate. */
const NIQQUD_RE = /[\u0591-\u05C7]/g;
/** האם הטקסט מכיל אותיות עבריות. */
const isHe = s => /[\u0590-\u05FF]/.test(s || '');
/** מנקה רווחים מיותרים בטקסט עברי. */
const heClean = s => (s || '').replace(/\s+/g, ' ').trim();
/** מפתח להשוואת מילים עבריות בלי ניקוד. */
const heKey = s => s.replace(NIQQUD_RE, '');
const POS_HE = { noun: 'שם עצם', verb: 'פועל', adjective: 'תואר', adverb: 'תואר הפועל', conjunction: 'מילת חיבור',
  preposition: 'מילת יחס', pronoun: 'כינוי', interjection: 'מילת קריאה', article: 'סוג מילה', abbreviation: 'ראשי תיבות' };

/** מביא JSON מהכתובת url, עם הגבלת זמן ms. נכשל אם התשובה לא תקינה. */
async function fetchJson(url, ms){
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), ms);
  try {
    const r = await fetch(url, { signal: ctl.signal });
    if (!r.ok) throw new Error('http ' + r.status);
    return await r.json();
  } finally { clearTimeout(timer); }
}

/** מחפש תרגום לעברית ב-Google Translate: תרגום ראשי ועד שלוש קבוצות משמעויות לפי סוג מילה. התוצאה נשמרת בזיכרון. */
async function lookup(word){
  const key = word.toLowerCase();
  if (dictCache[key]) return dictCache[key];
  const j = await fetchJson('https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=iw&dt=t&dt=bd&q=' + encodeURIComponent(key), 9000);
  const main = heClean(Array.isArray(j[0]) ? j[0].map(p => (p && p[0]) || '').join('') : '');
  if (!isHe(main)) throw new Error('empty');
  const seen = new Set([heKey(main)]);
  const groups = [];
  for (const pos of (Array.isArray(j[1]) ? j[1] : [])){
    if (groups.length >= 3) break;
    const entries = Array.isArray(pos[2]) ? pos[2].map(x => x && x[0]) : (pos[1] || []);
    const words = [];
    for (const e of entries){
      const t = heClean(e);
      if (!isHe(t) || seen.has(heKey(t))) continue;
      seen.add(heKey(t));
      words.push(t);
      if (words.length >= (groups.length ? 2 : 3)) break;
    }
    if (words.length) groups.push({ label: POS_HE[pos[0]] || (isHe(pos[0]) ? pos[0] : 'עוד'), words });
  }
  dictCache[key] = { main, groups };
  return dictCache[key];
}

/* מבקש הסכמה (פעם אחת) לשליחת המילה ל-Google Translate. ההסכמה נשמרת עד שמבטלים אותה בדף הפרטיות */
function requestDictConsent(){
  return ConsentGate.ask('dictionary', {
    title: 'המילון משתמש ב-Google Translate',
    text: 'כדי להציג תרגום, המילה שנבחרה נשלחת לשרתים של Google, יחד עם כתובת ה-IP של המכשיר.\nבלי אישור המילה לא נשלחת, ושאר האתר ממשיך לעבוד כרגיל.',
    yes: 'אפשר', no: 'לא עכשיו', moreUrl: 'legal/privacy.html', moreLabel: 'פרטים נוספים בדף הפרטיות'
  });
}

let dictWordNow = '';
let dictHeNow = '';      // התרגום הראשי שהוצג, כדי לשמור אותו במילון הכיס
/** פותח את חלון המילון למילה הנוכחית: מבקש הסכמה, מחפש תרגום ומציג אותו. */
async function openDict(){
  if (!words.length) return;
  if (playing) pause();
  const w = cleanWord(words[cur].t);
  if (!w){ toast('במילה הזאת אין מה לתרגם. אפשר לבחור מילה אחרת.'); return; }
  dictWordNow = w;
  dictHeNow = '';
  refreshDictPocket();
  $('#dictWord').textContent = w;
  $('#dictHe').textContent = 'מחפש תרגום…';
  $('#dictGoogle').href = 'https://translate.google.com/?sl=en&tl=iw&op=translate&text=' + encodeURIComponent(w);
  openDialog('dict', '#dictClose');
  try {
    if (!(await requestDictConsent())){
      $('#dictHe').textContent = 'המילון לא הופעל. אפשר לתרגם בלחיצה על "פתיחה ב-Google Translate", שפותח את האתר של Google.';
      return;
    }
    const res = await lookup(w);
    if (dictWordNow !== w) return;
    dictHeNow = res.main;
    const he = $('#dictHe');
    he.textContent = '';
    const main = document.createElement('div');
    main.textContent = res.main;
    he.appendChild(main);
    res.groups.forEach(g => {
      const d = document.createElement('div');
      d.className = 'alt';
      if (g.label){
        const b = document.createElement('b');
        b.textContent = g.label + ': ';
        d.appendChild(b);
      }
      g.words.forEach(t => { const sp = document.createElement('span'); sp.className = 'dw'; sp.textContent = t; d.appendChild(sp); });
      he.appendChild(d);
    });
  } catch(e){
    if (dictWordNow !== w) return;
    $('#dictHe').textContent = 'לא הצלחתי למצוא תרגום עכשיו. אפשר ללחוץ על הכפתור "פתיחה ב-Google Translate", או לנסות שוב בעוד רגע.';
  }
}

/** משמיע את המילה שבחלון המילון. */
function sayWord(){ speakSingleWord(dictWordNow); }

/** משמיע מילה אחת באנגלית (גם מחלון המילון וגם ממילון הכיס). */
function speakSingleWord(w){
  if (!synth || !w) return;
  try { synth.cancel(); } catch(e){}
  const u = new SpeechSynthesisUtterance(w);
  utterRef = u;
  if (voice){ u.voice = voice; u.lang = voice.lang; } else u.lang = 'en-US';
  u.rate = Math.min(rate, 0.8);
  synth.speak(u);
}
