import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Lightbulb, AlertTriangle, ChevronLeft } from 'lucide-react';

const CriticalActions = ({ actions }) => {
  if (!actions || actions.length === 0) {
    return (
        <Card className="bg-white shadow-sm border border-gray-200 rounded-lg">
            <CardContent className="p-4">
                <div className="flex items-center text-right justify-end">
                    <div className="text-right">
                        <h3 className="font-semibold text-slate-800">הכל מעודכן!</h3>
                        <p className="text-sm text-slate-600">אין פעולות קריטיות הדורשות טיפול מיידי.</p>
                    </div>
                    <div className="bg-green-100 p-3 rounded-lg mr-4">
                        <Lightbulb className="h-5 w-5 text-green-600" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
  }

  const priorityStyles = {
    critical: {
      border: 'border-red-200',
      bg: 'bg-red-50',
      icon: 'text-red-600',
      text: 'text-red-800',
      hover: 'hover:bg-red-100'
    },
    high: {
      border: 'border-amber-200',
      bg: 'bg-amber-50',
      icon: 'text-amber-700',
      text: 'text-amber-800',
      hover: 'hover:bg-amber-100'
    },
    medium: {
      border: 'border-blue-200',
      bg: 'bg-blue-50',
      icon: 'text-blue-600',
      text: 'text-blue-800',
      hover: 'hover:bg-blue-100'
    },
  };

  return (
    <Card className="bg-white shadow-sm border border-gray-200 rounded-lg">
        <CardHeader className="py-3 px-4">
            <CardTitle className="text-base font-semibold text-slate-800 flex items-center justify-end">
                 <span>המלצות ופעולות קריטיות</span>
                 <div className="bg-amber-100 p-1.5 rounded-lg mr-2">
                    <Lightbulb className="h-4 w-4 text-amber-600"/>
                </div>
            </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
            <div className="space-y-2">
                {actions.map((action, index) => {
                    const styles = priorityStyles[action.priority];
                    return (
                        <Link to={createPageUrl(action.link)} key={index} className="block group">
                            <div className={`${styles.bg} ${styles.border} ${styles.hover} border rounded-lg p-3 transition-all duration-200`}>
                                <div className="flex items-center justify-between text-right">
                                    <ChevronLeft className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors flex-shrink-0" />
                                    <div className="flex items-center flex-1 justify-end">
                                        <p className={`text-sm font-medium text-right w-full ${styles.text} group-hover:font-semibold`}>
                                            {action.text}
                                        </p>
                                        <AlertTriangle className={`h-4 w-4 ml-2 flex-shrink-0 ${styles.icon}`} />
                                    </div>
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </CardContent>
    </Card>
  );
};

export default CriticalActions;