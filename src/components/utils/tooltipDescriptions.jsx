/**
 * Tooltip Descriptions
 * ====================
 * 
 * קובץ מרכזי המכיל את כל ההסברים והתיאורים שמוצגים ב-Tooltips
 * ברחבי המערכת. מאורגן לפי נושאים.
 */

export const STATUS_DESCRIPTIONS = {
    // Order Statuses
    order: {
        pending_sap_details: {
            label: 'ממתין לפרטי SAP',
            description: 'ההזמנה נוצרה במערכת אך טרם התקבלו פרטי הזמנה קבועים ממערכת SAP'
        },
        pending_sap_permanent_id: {
            label: 'ממתין למספר הזמנה קבוע',
            description: 'ההזמנה ממתינה למספר הזמנה קבוע ממערכת SAP'
        },
        pending_sap_po_number: {
            label: 'ממתין למספר PO',
            description: 'ההזמנה ממתינה למספר הזמנת רכש (PO) ממערכת SAP'
        },
        approved: {
            label: 'מאושרת',
            description: 'ההזמנה אושרה וממתינה לאספקה'
        },
        partially_received: {
            label: 'התקבלה חלקית',
            description: 'חלק מהפריטים בהזמנה התקבלו, אך עדיין יש יתרה פתוחה'
        },
        fully_received: {
            label: 'התקבלה במלואה',
            description: 'כל הפריטים בהזמנה התקבלו'
        },
        closed: {
            label: 'סגורה',
            description: 'ההזמנה נסגרה (ללא תלות בכמות שהתקבלה)'
        },
        cancelled: {
            label: 'בוטלה',
            description: 'ההזמנה בוטלה ולא תתקבל'
        }
    },
    
    // Withdrawal Statuses
    withdrawal: {
        draft: {
            label: 'טיוטה',
            description: 'בקשת המשיכה נמצאת בשלב טיוטה וטרם הוגשה'
        },
        submitted: {
            label: 'הוגשה',
            description: 'בקשת המשיכה הוגשה וממתינה לאישור'
        },
        approved: {
            label: 'מאושרת',
            description: 'בקשת המשיכה אושרה וממתינה לאספקה'
        },
        rejected: {
            label: 'נדחתה',
            description: 'בקשת המשיכה נדחתה ולא תבוצע'
        },
        in_delivery: {
            label: 'באספקה',
            description: 'הפריטים נמצאים בדרך אליך'
        },
        completed: {
            label: 'הושלמה',
            description: 'בקשת המשיכה הושלמה והפריטים התקבלו'
        },
        cancelled: {
            label: 'בוטלה',
            description: 'בקשת המשיכה בוטלה (ככל הנראה נמחקה ממערכת)'
        }
    },

    // Batch Statuses
    batch: {
        incoming: {
            label: 'נכנסת',
            description: 'האצווה בדרך למעבדה'
        },
        quarantine: {
            label: 'הסגר',
            description: 'האצווה בהסגר וממתינה לבדיקה'
        },
        qc_pending: {
            label: 'ממתינה לבקרת איכות',
            description: 'האצווה ממתינה לביצוע בדיקות איכות'
        },
        active: {
            label: 'פעילה',
            description: 'האצווה פעילה וזמינה לשימוש'
        },
        expired: {
            label: 'פגת תוקף',
            description: 'האצווה עברה את תאריך התפוגה'
        },
        consumed: {
            label: 'נצרכה',
            description: 'האצווה נצרכה במלואה'
        },
        recalled: {
            label: 'נקראה חזרה',
            description: 'האצווה נקראה חזרה על ידי היצרן/ספק'
        },
        returned: {
            label: 'הוחזרה',
            description: 'האצווה הוחזרה לספק'
        }
    }
};

export const COLUMN_DESCRIPTIONS = {
    // Inventory Replenishment
    inventoryReplenishment: {
        name: 'שם הריאגנט/מוצר',
        effective_monthly_usage: 'צריכה חודשית ממוצעת - מבוססת על שימוש ממשי או הזנה ידנית',
        total_quantity_all_batches: 'סך המלאי הזמין כעת מכל האצוות הפעילות',
        months_of_stock: 'כמה חודשים אנחנו מכוסים עם המלאי הנוכחי (מלאי / צריכה חודשית)',
        available_framework_quantity: 'יתרות זמינות למשיכה מהזמנות מסגרת פעילות. המספר בסוגריים מציג כמה פריטים כבר נמצאים בבקשות משיכה ממתינות',
        suggested_order_quantity: 'כמות מוצעת להזמנה בהתבסס על צריכה חודשית ומלאי ביטחון'
    },

    // Orders
    orders: {
        order_number_temp: 'מספר דרישה זמני שהוקצה במערכת',
        order_number_permanent: 'מספר הזמנה קבוע שהתקבל ממערכת SAP',
        purchase_order_number_sap: 'מספר הזמנת רכש (PO) ממערכת SAP',
        supplier_name_snapshot: 'שם הספק בזמן יצירת ההזמנה',
        order_date: 'תאריך יצירת ההזמנה/דרישה',
        order_type: 'סוג ההזמנה: "מיידי" לאספקה מיידית, "מסגרת" להזמנת מסגרת עם משיכות עתידיות',
        status: 'סטטוס ההזמנה - מצב עדכני של ההזמנה במערכת'
    },

    // Withdrawals
    withdrawals: {
        withdrawal_number: 'מספר בקשת המשיכה הייחודי',
        framework_order_number_snapshot: 'מספר הזמנת המסגרת ממנה מבוצעת המשיכה',
        supplier_snapshot: 'שם הספק ממנו מבוצעת המשיכה',
        request_date: 'תאריך הגשת בקשת המשיכה',
        requested_delivery_date: 'תאריך אספקה מבוקש',
        urgency_level: 'רמת דחיפות: "שגרתי", "דחוף", או "חירום"',
        status: 'סטטוס בקשת המשיכה - מצב עדכני במערכת'
    },

    // Reagents
    reagents: {
        name: 'שם הריאגנט/מוצר',
        catalog_number: 'מספר קטלוגי של היצרן',
        supplier: 'ספק נוכחי של הריאגנט',
        category: 'קטגוריה: ריאגנטים, תאים, בקרות, תמיסות, או מתכלים',
        total_quantity_all_batches: 'סך המלאי מכל האצוות',
        active_batches_count: 'מספר אצוות פעילות',
        nearest_expiry_date: 'תאריך תפוגה הקרוב ביותר מבין כל האצוות',
        current_stock_status: 'מצב המלאי: "במלאי", "מלאי נמוך", "אזל מהמלאי", או "מלאי עודף"'
    }
};

export const GENERAL_DESCRIPTIONS = {
    created_date: 'תאריך יצירת הרשומה במערכת',
    created_by: 'משתמש שיצר את הרשומה',
    updated_date: 'תאריך עדכון אחרון',
    is_deleted: 'האם הרשומה נמחקה (מחיקה רכה)'
};