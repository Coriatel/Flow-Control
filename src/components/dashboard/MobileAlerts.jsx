import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Link } from 'react-router-dom';
import { AlertTriangle, ChevronLeft, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const priorityConfig = {
  critical: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    icon: 'text-red-600',
    text: 'text-red-800',
    dot: 'bg-red-500',
  },
  high: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    icon: 'text-amber-600',
    text: 'text-amber-800',
    dot: 'bg-amber-500',
  },
  medium: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: 'text-blue-600',
    text: 'text-blue-800',
    dot: 'bg-blue-500',
  },
};

const MobileAlerts = ({ actions }) => {
  const [expandedIndex, setExpandedIndex] = useState(null);

  if (!actions || actions.length === 0) {
    return (
      <Card className="bg-green-50 border border-green-200 rounded-xl">
        <CardContent className="p-3 flex items-center justify-end gap-2">
          <span className="text-sm font-medium text-green-700">הכל מעודכן!</span>
          <CheckCircle2 className="h-4 w-4 text-green-600" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {actions.map((action, index) => {
        const style = priorityConfig[action.priority] || priorityConfig.medium;
        const isExpanded = expandedIndex === index;

        return (
          <Card key={index} className={`${style.bg} border ${style.border} rounded-xl overflow-hidden`}>
            <button
              type="button"
              className="w-full px-3 py-2.5 flex items-center gap-2 text-right"
              onClick={() => setExpandedIndex(isExpanded ? null : index)}
            >
              <AlertTriangle className={`h-4 w-4 flex-shrink-0 ${style.icon}`} />
              <span className={`text-sm font-medium truncate flex-1 ${style.text}`}>
                {action.title}{action.description ? ` - ${action.description}` : ''}
              </span>
              <motion.div
                animate={{ rotate: isExpanded ? 90 : 0 }}
                transition={{ duration: 0.15 }}
                className="flex-shrink-0"
              >
                <ChevronLeft className={`h-3.5 w-3.5 ${style.icon}`} />
              </motion.div>
            </button>

            <AnimatePresence initial={false}>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                  style={{ overflow: 'hidden' }}
                >
                  <div className="px-3 pb-3 pt-0">
                    <p className={`text-xs ${style.text} mb-2`}>
                      {action.description}
                    </p>
                    {action.route && (
                      <Link
                        to={action.route}
                        className={`inline-flex items-center gap-1 text-xs font-medium ${style.text} hover:underline`}
                      >
                        עבור לטיפול
                        <ChevronLeft className="h-3 w-3" />
                      </Link>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        );
      })}
    </div>
  );
};

export default MobileAlerts;
