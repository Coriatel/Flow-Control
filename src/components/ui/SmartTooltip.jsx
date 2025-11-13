import React, { useState, useRef, useEffect } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

/**
 * SmartTooltip Component
 * ======================
 * 
 * רכיב חכם שמציג Tooltip/Popover בהתאם למצב:
 * 
 * Desktop:
 * --------
 * - אם הטקסט קטוע (overflow) - מציג Tooltip עם הטקסט המלא
 * - אם יש description - מציג Tooltip עם ההסבר
 * - עובד על hover
 * 
 * Mobile:
 * -------
 * - מציג Popover בלחיצה
 * - מציג גם את הטקסט המלא וגם את ההסבר (אם יש)
 * 
 * Props:
 * ------
 * @param {string} content - התוכן להצגה (חובה)
 * @param {string} description - הסבר נוסף על התוכן (אופציונלי)
 * @param {boolean} forceShow - האם להציג תמיד (גם אם לא קטוע)
 * @param {string} className - מחלקות CSS נוספות
 * @param {boolean} isMobile - האם במצב מובייל (default: auto-detect)
 */
export default function SmartTooltip({ 
    content, 
    description, 
    forceShow = false, 
    className = "",
    isMobile: propIsMobile,
    children 
}) {
    const [isOverflowing, setIsOverflowing] = useState(false);
    const [isMobile, setIsMobile] = useState(propIsMobile !== undefined ? propIsMobile : window.innerWidth < 768);
    const contentRef = useRef(null);

    useEffect(() => {
        if (propIsMobile === undefined) {
            const handleResize = () => setIsMobile(window.innerWidth < 768);
            window.addEventListener('resize', handleResize);
            return () => window.removeEventListener('resize', handleResize);
        }
    }, [propIsMobile]);

    useEffect(() => {
        const checkOverflow = () => {
            if (contentRef.current) {
                const element = contentRef.current;
                const isOverflow = element.scrollWidth > element.clientWidth || element.scrollHeight > element.clientHeight;
                setIsOverflowing(isOverflow);
            }
        };

        checkOverflow();
        window.addEventListener('resize', checkOverflow);
        return () => window.removeEventListener('resize', checkOverflow);
    }, [content]);

    const shouldShowTooltip = forceShow || isOverflowing || description;

    if (!shouldShowTooltip) {
        return (
            <span ref={contentRef} className={`truncate ${className}`}>
                {children || content}
            </span>
        );
    }

    const tooltipContent = (
        <div className="text-right" dir="rtl">
            {isOverflowing && <div className="font-medium">{content}</div>}
            {description && (
                <div className={`text-sm ${isOverflowing ? 'mt-1 text-slate-500' : ''}`}>
                    {description}
                </div>
            )}
        </div>
    );

    if (isMobile) {
        return (
            <Popover>
                <PopoverTrigger asChild>
                    <button 
                        className={`truncate text-right hover:underline cursor-pointer ${className}`}
                        type="button"
                    >
                        {children || content}
                    </button>
                </PopoverTrigger>
                <PopoverContent className="w-80" side="bottom" align="center">
                    {tooltipContent}
                </PopoverContent>
            </Popover>
        );
    }

    return (
        <TooltipProvider delayDuration={200}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <span ref={contentRef} className={`truncate cursor-help ${className}`}>
                        {children || content}
                    </span>
                </TooltipTrigger>
                <TooltipContent side="top" align="center" className="max-w-sm">
                    {tooltipContent}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}