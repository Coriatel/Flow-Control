# אפיון תפקודי - אצוות ריאגנטים

**תאריך עדכון:** 10.11.2025
**גרסה:** 1.0
**נתיב:** entities/ReagentBatch.json

---

# אפיון תפקודי - ReagentBatch Entity

## מטרה
ייצוג אצווה פיזית בודדת של ריאגנט - batch number, תפוגה, כמות נוכחית, מצב, COA.

## תיאור למשתמש
כל קבלת משלוח יוצרת אצווה חדשה:
- 🏷️ מספר אצווה מהיצרן (batch number)
- 📅 תאריך תפוגה
- 📊 כמות נוכחית (current_quantity)
- 📦 כמות התחלתית (initial_quantity)
- ✅ סטטוס (incoming/active/expired/consumed)
- 📄 תעודת אנליזה (COA)
- 🔬 בקרת איכות (QC)
- 📍 מיקום אחסון
- 📝 יומן שימוש

## מחזור חיים של אצווה

### 1. incoming → קליטה
- נוצר בקליטת משלוח
- יש batch_number + expiry_date
- current_quantity = initial_quantity
- status = 'incoming'

### 2. quarantine/qc_pending → בקרת איכות
- אם requires_coa = true → צריך COA
- אם requires QC → qc_status = 'pending'
- לא זמין לשימוש

### 3. active → פעיל לשימוש
- COA uploaded (אם נדרש)
- QC passed (אם נדרש)
- status = 'active'
- זמין למשיכה

### 4. expired/consumed → סיום
- פג תוקף → status = 'expired'
- נצרך לגמרי → status = 'consumed'
- לא זמין למשיכה

## שדות מפתח

### זיהוי:
- catalog_item_id - קישור לקטלוג
- reagent_id - קישור לריאגנט הראשי
- batch_number - מזהה ייחודי מהיצרן

### כמויות:
- initial_quantity - מה התקבל
- current_quantity - מה נשאר עכשיו
- reserved_quantity - שמור (QC וכו')
- available_quantity = current - reserved

### תאריכים:
- manufacture_date - ייצור
- expiry_date - תפוגה **חובה**
- received_date - קבלה במעבדה
- first_use_date - שימוש ראשון
- last_use_date - שימוש אחרון

### מסמכים:
- coa_document_url - קישור ל-COA
- coa_uploaded_by - מי העלה
- coa_upload_date - מתי

### בקרת איכות:
- qc_status: not_required/pending/in_progress/passed/failed
- qc_performed_by - מי ביצע
- qc_date - מתי
- qc_notes - ממצאים
- qc_documents[] - מסמכים

## מקרי שימוש

### UC1: קליטת אצווה חדשה
1. משלוח מגיע: Anti-A, batch ABC123, 50 יח', פג 31/12/2025
2. המערכת יוצרת ReagentBatch:
   - batch_number = "ABC123"
   - expiry_date = "2025-12-31"
   - initial_quantity = 50
   - current_quantity = 50
   - status = 'incoming'
3. אם requires_coa → qc_status = 'pending'

### UC2: העלאת COA
1. האצווה ב-status: 'qc_pending'
2. מעלים COA (PDF)
3. coa_document_url מתעדכן
4. coa_uploaded_by = user.email
5. אם לא נדרש QC נוסף → status = 'active'

### UC3: משיכת כמות
1. משיכה: 10 יח' מ-ABC123
2. current_quantity: 50 → 40
3. usage_log[] += { date, quantity: -10, used_by }
4. last_use_date = today
5. אם זה שימוש ראשון: first_use_date = today

### UC4: אצווה פגה
1. expiry_date < today
2. scheduled job מזהה
3. status = 'expired'
4. אם current_quantity > 0 → יוצר ExpiredProductLog
5. מסיר מ-total_quantity_all_batches של Reagent

## כללי עסקיים

1. **Unique Constraint**: (reagent_id + batch_number) ייחודי
2. **Expiry Required**: אם reagent.requires_expiry_date = true
3. **COA Required**: אם reagent.requires_coa = true
4. **Quantities**: current_quantity >= 0 (אף פעם לא שלילי)
5. **Status Flow**: incoming → quarantine → active → expired/consumed