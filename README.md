# שומעת וקוראת

מדביקים טקסט באנגלית, והאתר מקריא אותו בקול ומסמן את המילה והמשפט. אפשר ללחוץ על מילה ולקבל תרגום לעברית.
אתר סטטי: אין שרת ואין הרשמה. ההגדרות והטקסט האחרון נשמרים בדפדפן.

## מבנה

```
index.html              שלד: מסכים (הדבקה, קריאה, הגדרות, מילון) וחיבור קבצים
css/a11y-base.css       נגישות בסיסית (מהסקיל site-compliance-il)
css/base.css            צבעים וכפתורים
css/screens.css         מסך ההדבקה, מסך הקריאה והפקדים
css/dialogs.css         הגדרות, מילון והודעה קופצת
css/phone.css           התאמות לטלפון ולתנועה
js/shared/              מודולים משותפים: שגיאות, אחסון, נגישות, הסכמה
js/state.js             כלי עזר, אחסון מקומי ומשתני מצב
js/text-parse.js        פירוק הטקסט והצגתו
js/highlight.js         סימון המילה הנוכחית וגלילה
js/voices.js            בחירת קול
js/speech.js            ההקראה עצמה: הפעלה ועצירה, וההקראה של משפט (speakFrom) שמפוצלת לפונקציה לכל אירוע של הקול
js/speech-chunks.js     הקראה בקטעים לפי פסיקים בלבד (לא באמצע ביטוי), לקולות שלא מדווחים על מילים, כדי שסימון המילה יישאר מסונכרן                        (התחלה, דיווח על מילה, סיום, שגיאה) ולשעון עצר
js/pocket/              "המילון שלי": pocket-store (שמירה וקיבוץ לפי טקסט), pocket-markers (סימון ירוק בטקסט),
                        pocket-copy (העתקה לוורד כטבלה), pocket-ui (החלון והכפתור במילון), pocket-events (לחיצות)
js/library/             ספריית טקסטים שמורים: library-store (שמירה), library-ui (חלונות), library-events (לחיצות)
css/library.css         חלונות ספרייה ומילון (מבנה משותף) ושדה "שם לשמירה"
css/pocket.css          סימון מילה חדשה ורשימת "המילון שלי"
js/shared/dom-build.js  בניית אלמנטים בטוחה וכפתור עם אישור שני (מחיקה)
js/edit/                עריכת הטקסט בזמן קריאה: word-diff (השוואת מילים), text-edit (פתיחה, שמירה, מחיקה, ביטול), text-edit-events (לחיצות)
js/notes/               הערות על מילים: notes-store (שמירה והזזה אחרי עריכה), notes-marks (קו גלי בטקסט), notes-ui (החלון), notes-events (לחיצות)
css/notes.css           קו גלי מתחת למילה עם הערה, ושדה ההערה
css/text-edit.css       שורת הכפתורים מעל הטקסט ומסך העריכה
js/navigation.js        ניווט ומהירות
js/dictionary.js        המילון (Google Translate, אחרי הסכמה)
js/context-translate.js  תרגום המילה לפי ההקשר של המשפט (מילה עטופה ב-<b> בתוך משפט ל-Google)
js/sentence-translate.js  כפתור "תרגום המשפט" בחלון המילון (מציג את התרגום באתר)
js/screens.js           מסכים, חלונות וגודל טקסט
js/events.js            חיבור לחיצות ומקשים
js/boot.js              הפעלה
legal/                  הצהרת נגישות, פרטיות ועוגיות, ותנאי שימוש וזכויות יוצרים (נבנות מ-compliance.json)
compliance.json         העובדות של האתר: מה נשמר, מה נשלח, פרטי רכז נגישות, והאם האתר מופיע בחיפוש (indexing)
```

הקבצים ב-`js/` הם סקריפטים רגילים (לא מודולים), שחולקים היקף אחד. הסדר שלהם ב-`index.html` חשוב ואסור לשנות אותו.
כל קובץ קוד עד כ-300 שורות, הפונקציה הארוכה ביותר 38 שורות, וכל פונקציה פותחת בהערה קצרה.

## בדיקות

- סריקה: `python "%USERPROFILE%\.claude\skills\site-compliance-il\tools\audit_site.py" .`
- דפדפן: `python ...\tools\browser_check.py . index.html`
- טלפון: `Desktop\קלוד\כלי בדיקת טלפון\mobile_check.py שומעת`
- דפדפנים אחרים: `$env:SITE_BROWSER="firefox"` (או `edge`, `webkit`) לפני `browser_check.py`, `click_all.py`, `keyboard_flow.py` ו-`aria_snapshot_check.py`
- מה קורא מסך רואה: `python ...\tools\aria_snapshot_check.py . index.html --show`

## גרסאות (git)

התיקייה מחוברת למאגר `reading-with-highlight` (`origin`). ההיסטוריה שם היא הגרסה הישנה, קובץ אחד. `git status` מראה מה שונה מהאתר החי. לא נעשה commit ולא push עד שבעלת האתר מאשרת פרסום.

## פרסום (רק באישור של בעלת האתר)

האתר החי נמצא במאגר `reading-with-highlight`. עד היום עלה לשם קובץ אחד (`index.html`). עכשיו צריך להעלות את כל התיקייה הזאת (כולל `css`, `js`, `legal`), ולא רק את `index.html`.

## יומן

ראו `COMPLIANCE-LOG.md`.
