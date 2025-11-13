import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

/**
 * StatusBadgeTooltip Component
 * ============================
 * 
 * רכיב Badge עם Tooltip מובנה להסבר על הסטטוס
 * 
 * Props:
 * ------
 * @param {string} status - מזהה הסטטוס
 * @param {string} label - הטקסט להצגה ב-Badge
 * @param {string} description - הסבר על הסטטוס
 * @param {string} className - מחלקות CSS נוספות ל-Badge
 */
export default function StatusBadgeTooltip({ status, label, description, className = "" }) {
    if (!description) {
        return <Badge className={className}>{label}</Badge>;
    }

    return (
        <TooltipProvider delayDuration={200}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <button type="button" className="cursor-help">
                        <Badge className={className}>{label}</Badge>
                    </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs text-right" dir="rtl">
                    <div>
                        <div className="font-semibold mb-1">{label}</div>
                        <p className="text-sm">{description}</p>
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}