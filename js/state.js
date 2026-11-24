/* state.js: מצב האתר: כלי עזר, אחסון מקומי ומשתני מצב משותפים.
   סקריפט רגיל (לא מודול): חולק את אותו היקף גלובלי עם שאר הקבצים, וצריך להיטען לפי הסדר ב-index.html. */
'use strict';

/** בוחר אלמנט בדף לפי סלקטור. */
const $ = s => document.querySelector(s);
const synth = window.speechSynthesis;

/** גישה בטוחה לאחסון המקומי: אם האחסון חסום או מלא מחזירים ברירת מחדל ולא נכשלים. */
const store = {
  get(k, d){ try { const v = localStorage.getItem(k); return v === null ? d : v; } catch(e){ return d; } },
  set(k, v){ try { localStorage.setItem(k, v); return true; } catch(e){ return false; } },
  del(k){ try { localStorage.removeItem(k); } catch(e){} }
};

/* ---------------- מצב ---------------- */
let words = [], sentences = [], paras = [];
let cur = 0, curWordEl = null, curSentEl = null, curSent = -1;
let playing = false, finished = false;
let gen = 0;                       // מזהה דור: מתעלם מאירועים ישנים של הקראה שבוטלה
let rate = clamp(parseFloat(store.get('tts.rate65', '0.65')) || 0.65, 0.3, 2);
let lead = clamp(parseInt(store.get('tts.lead', '2'), 10), 0, 6);   // כמה מילים להקדים את הסימון, כי הקול "מאחר" לדווח איפה הוא
if (isNaN(lead)) lead = 2;
const dictCache = {};
let fontSize = clamp(parseInt(store.get('tts.size', '32'), 10) || 32, 20, 72);
let voices = [], voice = null;
const voiceHasBoundary = {};
let cpsMap = {};
try { cpsMap = JSON.parse(store.get('tts.cps', '{}')) || {}; } catch(e){}
let estTimer = null, fbTimer = null, watchT = null, queueT = null, saveT = null, toastT = null;
let retries = 0;
let utterRef = null;               // מחזיקים הפניה כדי ש-Chrome לא ימחק את ההקראה

/** מגביל את המספר v לטווח בין a ל-b. */
function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }
