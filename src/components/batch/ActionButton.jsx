import React from 'react';
import { Button } from '@/components/ui/button';
import { Wrench } from 'lucide-react';

const ActionButton = ({ item, isUrgent, onClick }) => {
  if (item.action_taken) {
    return null; // Don't show button if already handled
  }

  const urgentClasses = "bg-orange-500 hover:bg-orange-600 text-white shadow-sm";
  const neutralClasses = "bg-white hover:bg-slate-100 text-slate-700 border border-slate-300";

  return (
    <Button
      size="sm"
      className={`h-7 px-3 text-xs flex items-center gap-1.5 transition-all duration-200 ${isUrgent ? urgentClasses : neutralClasses}`}
      onClick={onClick}
    >
      <Wrench className="h-3 w-3" />
      <span>טפל</span>
    </Button>
  );
};

export default ActionButton;