import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from 'lucide-react';

/**
 * TableHeaderTooltip Component
 * ============================
 * 
 * רכיב להצגת הסבר על כותרת עמודה בטבלה
 * 
 * Props:
 * ------
 * @param {string} header - שם העמודה
 * @param {string} description - הסבר על העמודה
 * @param {ReactNode} icon - אייקון מותאם (default: Info)
 */
export default function TableHeaderTooltip({ header, description, icon }) {
    if (!description) {
        return <span>{header}</span>;
    }

    const IconComponent = icon || Info;

    return (
        <div className="flex items-center justify-center gap-2">
            <span>{header}</span>
            <TooltipProvider delayDuration={200}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button type="button" className="text-slate-400 hover:text-slate-600 transition-colors">
                            <IconComponent className="h-4 w-4" />
                        </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs text-right" dir="rtl">
                        <p>{description}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
    );
}