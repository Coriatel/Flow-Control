import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ChevronLeft } from 'lucide-react';

export const NavGroupAccordion = ({ navItems, adminNavItems, userRole }) => {

  const groupedNavItems = navItems.reduce((groups, item) => {
    const group = item.group || 'other';
    if (!groups[group]) groups[group] = [];
    groups[group].push(item);
    return groups;
  }, {});

  const groupHeadings = {
    dashboard: {
      title: 'בית',
      emoji: '🏠',
      color: 'text-slate-700',
      bg: 'bg-slate-100',
      border: 'border-slate-200'
    },
    inventory: {
      title: 'ניהול מלאי',
      emoji: '📦',
      color: 'text-blue-800',
      bg: 'bg-blue-50',
      border: 'border-blue-200'
    },
    procurement: {
      title: 'רכש והזמנות',
      emoji: '🛒',
      color: 'text-amber-800',
      bg: 'bg-amber-50',
      border: 'border-amber-200'
    },
    shipments: {
      title: 'ניהול משלוחים',
      emoji: '🚚',
      color: 'text-sky-800',
      bg: 'bg-sky-50',
      border: 'border-sky-200'
    },
    operations: {
      title: 'תפעול ודוחות',
      emoji: '⚙️',
      color: 'text-slate-800',
      bg: 'bg-slate-100',
      border: 'border-slate-200'
    },
    contacts: {
      title: 'אנשי קשר',
      emoji: '👥',
      color: 'text-purple-800',
      bg: 'bg-purple-50',
      border: 'border-purple-200'
    },
    documentation: {
      title: 'מסמכי מערכת',
      emoji: '📄',
      color: 'text-gray-700',
      bg: 'bg-gray-100',
      border: 'border-gray-200'
    }
  };

  const adminGrouped = {
      admin: {
        title: 'ניהול מתקדם',
        emoji: '⚙️',
        color: 'text-red-700',
        bg: 'bg-red-50',
        border: 'border-red-200',
        items: adminNavItems
      }
  };

  const getIconBgColor = (item) => {
    const group = item.group || 'other';
    const groupInfo = groupHeadings[group];
    return groupInfo ? groupInfo.bg : 'bg-slate-100';
  };
  
  const getIconColor = (item) => {
    const group = item.group || 'other';
    const groupInfo = groupHeadings[group];
    return groupInfo ? groupInfo.color : 'text-slate-600';
  }

  const renderLink = (item) => (
      <Link
        key={item.name}
        to={createPageUrl(item.href)}
        className="flex items-center justify-between p-2.5 rounded-lg text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-all duration-200 group"
      >
        <div className="flex items-center">
            <div className={`p-1.5 rounded-lg ml-2 ${getIconBgColor(item)} group-hover:scale-105 transition-transform duration-200`}>
              <item.icon className={`h-4 w-4 ${getIconColor(item)}`} />
            </div>
            <span className="font-medium text-sm">{item.name}</span>
        </div>
        <ChevronLeft className="h-4 w-4 text-slate-400 group-hover:text-slate-600 transition-colors"/>
      </Link>
  );

  return (
    <div className="w-full">
      <Accordion type="multiple" defaultValue={['inventory']} className="w-full space-y-2">
        {Object.entries(groupedNavItems).map(([groupName, items]) => {
          const groupInfo = groupHeadings[groupName];
          return (
            <AccordionItem key={groupName} value={groupName} className={`bg-white border-0 shadow-sm rounded-lg overflow-hidden`}>
              <AccordionTrigger className={`p-3 text-sm font-semibold hover:no-underline ${groupInfo.bg} ${groupInfo.color}`}>
                <div className="flex items-center">
                  <span className="text-base ml-2">{groupInfo.emoji}</span>
                  <span>{groupInfo.title}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="p-2">
                  <div className="space-y-1">
                      {items.map(item => renderLink(item))}
                  </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
         {userRole === 'admin' && (
             <AccordionItem value="admin" className={`bg-white border-0 shadow-sm rounded-lg overflow-hidden`}>
                <AccordionTrigger className={`p-3 text-sm font-semibold hover:no-underline ${adminGrouped.admin.bg} ${adminGrouped.admin.color}`}>
                  <div className="flex items-center">
                    <span className="text-base ml-2">{adminGrouped.admin.emoji}</span>
                    <span>{adminGrouped.admin.title}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="p-2">
                    <div className="space-y-1">
                        {adminGrouped.admin.items.map(item => renderLink(item))}
                    </div>
                </AccordionContent>
            </AccordionItem>
         )}
      </Accordion>
    </div>
  );
};