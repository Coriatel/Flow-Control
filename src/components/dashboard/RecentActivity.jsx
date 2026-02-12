import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { History, ArrowLeft, Package, Beaker, FileText, Truck, User, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

// Map actions/entityTypes to icons and colors
const getActivityConfig = (activity) => {
  const type = activity.entityType || 'default';
  const action = activity.action || '';

  const config = {
    // Inventory
    inventory: { icon: Package, color: 'text-blue-500 bg-blue-50' },
    inventory_count: { icon: History, color: 'text-purple-500 bg-purple-50' },
    reagent: { icon: Beaker, color: 'text-cyan-500 bg-cyan-50' },

    // Orders/Delivery
    order: { icon: FileText, color: 'text-amber-500 bg-amber-50' },
    delivery: { icon: Truck, color: 'text-green-500 bg-green-50' },

    // User
    user: { icon: User, color: 'text-slate-500 bg-slate-50' },

    // Default
    default: { icon: Activity, color: 'text-gray-500 bg-gray-50' }
  };

  // Try to match specific action or entity type
  if (action === 'inventory_count') return config.inventory_count;
  if (action === 'user_login') return config.user;

  return config[type] || config.default;
};

const RecentActivity = ({ activities }) => {
  return (
    <Card className="bg-white shadow-sm border border-gray-200 rounded-lg">
      <CardHeader className="flex flex-row items-center justify-between py-4 px-6">
        <CardTitle className="flex items-center text-lg font-semibold text-slate-800">
          <div className="bg-slate-50 p-2 rounded-lg me-2">
            <History className="h-5 w-5 text-slate-600" />
          </div>
          פעולות אחרונות
        </CardTitle>
        <Link to={createPageUrl('ActivityLog')} className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center transition-colors">
          הצג הכל <ArrowLeft className="h-4 w-4 me-1" />
        </Link>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <ScrollArea className="h-64">
          <div className="space-y-3">
            {activities.length > 0 ? activities.map(activity => {
              // Handle date/timestamp
              const dateStr = activity.timestamp || activity.date || activity.createdAt;
              const date = dateStr ? new Date(dateStr) : new Date();

              // Handle icon/color
              const { icon: Icon, color } = getActivityConfig(activity);

              return (
                <div key={activity.id} className="flex items-start text-right space-x-3 space-x-reverse bg-slate-50 p-3 rounded-lg">
                  <div className="text-left flex-shrink-0">
                    <p className="text-xs text-slate-500">
                      {format(date, 'HH:mm', { locale: he })}
                    </p>
                    <p className="text-xs text-slate-400">
                      {format(date, 'dd/MM', { locale: he })}
                    </p>
                  </div>
                  <div className="flex-grow">
                    <p className="text-sm text-slate-800 font-medium">{activity.description}</p>
                  </div>
                  <div className={`flex-shrink-0 h-8 w-8 rounded-lg flex items-center justify-center ${color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
              );
            }) : (
              <div className="text-center py-8">
                <p className="text-sm text-slate-500">אין פעילות אחרונה</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default RecentActivity;