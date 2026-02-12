import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';

const colorSchemes = {
  red: {
    headerBg: 'bg-gradient-to-l from-red-50 to-red-100/50',
    headerBorder: 'border-red-200',
    countColor: 'text-red-700',
    iconColor: 'text-red-600',
    iconBg: 'bg-red-100',
    titleColor: 'text-red-800',
    rowHover: 'hover:bg-red-50/60',
    badge: 'bg-red-100 text-red-700',
  },
  orange: {
    headerBg: 'bg-gradient-to-l from-amber-50 to-amber-100/50',
    headerBorder: 'border-amber-200',
    countColor: 'text-amber-700',
    iconColor: 'text-amber-600',
    iconBg: 'bg-amber-100',
    titleColor: 'text-amber-800',
    rowHover: 'hover:bg-amber-50/60',
    badge: 'bg-amber-100 text-amber-700',
  },
  blue: {
    headerBg: 'bg-gradient-to-l from-blue-50 to-blue-100/50',
    headerBorder: 'border-blue-200',
    countColor: 'text-blue-700',
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-100',
    titleColor: 'text-blue-800',
    rowHover: 'hover:bg-blue-50/60',
    badge: 'bg-blue-100 text-blue-700',
  },
  purple: {
    headerBg: 'bg-gradient-to-l from-purple-50 to-purple-100/50',
    headerBorder: 'border-purple-200',
    countColor: 'text-purple-700',
    iconColor: 'text-purple-600',
    iconBg: 'bg-purple-100',
    titleColor: 'text-purple-800',
    rowHover: 'hover:bg-purple-50/60',
    badge: 'bg-purple-100 text-purple-700',
  },
};

const InfoCard = ({
  icon,
  title,
  count,
  titleLinkTo,
  color = 'blue',
  rows = [],
  initialVisibleRows = 4,
  defaultCollapsed = false,
  emptyMessage = 'אין פריטים להצגה',
}) => {
  const isMobile = useIsMobile();
  const scheme = colorSchemes[color] || colorSchemes.blue;

  // On mobile with defaultCollapsed, the card body starts collapsed
  const [bodyOpen, setBodyOpen] = useState(!isMobile || !defaultCollapsed);
  const [showAll, setShowAll] = useState(false);

  const visibleRows = showAll ? rows : rows.slice(0, initialVisibleRows);
  const hiddenCount = rows.length - initialVisibleRows;

  const IconElement = icon ? React.cloneElement(icon, { className: `h-5 w-5 ${scheme.iconColor}` }) : null;

  return (
    <Card className={`bg-white shadow-sm border ${scheme.headerBorder} rounded-xl overflow-hidden hover:shadow-lg transition-shadow`}>
      {/* Header - always visible */}
      <button
        type="button"
        className={`w-full ${scheme.headerBg} px-4 py-3 flex items-center justify-between cursor-pointer md:cursor-default`}
        onClick={() => isMobile && setBodyOpen(!bodyOpen)}
      >
        <div className="flex items-center gap-3">
          {IconElement && (
            <div className={`flex-shrink-0 p-2 rounded-lg ${scheme.iconBg}`}>
              {IconElement}
            </div>
          )}
          <span className={`text-3xl font-extrabold tabular-nums ${scheme.countColor} leading-none`}>{count}</span>
          {titleLinkTo ? (
            <Link
              to={titleLinkTo}
              className={`text-sm font-semibold ${scheme.titleColor} hover:underline`}
              onClick={(e) => e.stopPropagation()}
            >
              {title}
            </Link>
          ) : (
            <span className={`text-sm font-semibold ${scheme.titleColor}`}>{title}</span>
          )}
        </div>
        {isMobile && (
          <motion.div
            animate={{ rotate: bodyOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className={`h-4 w-4 ${scheme.iconColor}`} />
          </motion.div>
        )}
      </button>

      {/* Body */}
      <AnimatePresence initial={false}>
        {bodyOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <CardContent className="p-0">
              {rows.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-slate-500">
                  {emptyMessage}
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {visibleRows.map((row, index) => {
                    const RowWrapper = row.linkTo ? Link : 'div';
                    const wrapperProps = row.linkTo ? { to: row.linkTo } : {};
                    return (
                      <RowWrapper
                        key={row.key || index}
                        {...wrapperProps}
                        className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${scheme.rowHover} ${row.linkTo ? 'cursor-pointer' : ''}`}
                      >
                        {row.cells.map((cell, cellIndex) => (
                          <span
                            key={cellIndex}
                            className={`truncate ${cell.className || ''} ${
                              cellIndex === 0 ? 'flex-1 font-medium text-slate-800' : 'flex-shrink-0 text-slate-600'
                            }`}
                            title={cell.fullText || cell.text}
                          >
                            {cell.text}
                          </span>
                        ))}
                      </RowWrapper>
                    );
                  })}

                  {/* Show more / Show less toggle */}
                  {hiddenCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowAll(!showAll)}
                      className="w-full flex items-center justify-center gap-1 px-4 py-2.5 text-xs font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      {showAll ? (
                        <>
                          <ChevronUp className="h-3.5 w-3.5" />
                          הסתר
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-3.5 w-3.5" />
                          הצג {hiddenCount} נוספים
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};

export default InfoCard;
