import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Edit2, Phone, Mail, User, Building2, Briefcase } from 'lucide-react';

const contactTypeLabels = {
  service: 'שירות',
  manager: 'מנהל',
  general: 'כללי',
  technical: 'טכני',
  sales: 'מכירות',
  orders: 'הזמנות',
  logistics: 'לוגיסטיקה',
  other: 'אחר'
};

export default function ContactCard({ contact, onEdit }) {
  return (
    <Card className="mb-3 hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        {/* Header Row - Name + Status */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2 flex-1">
            <User className="h-5 w-5 text-gray-400 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-base font-bold text-gray-900">
                {contact.full_name}
              </h3>
              {contact.job_title && (
                <p className="text-xs text-gray-500 mt-0.5">{contact.job_title}</p>
              )}
            </div>
          </div>
          
          {contact.is_active ? (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
              פעיל
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-300">
              לא פעיל
            </Badge>
          )}
        </div>

        {/* Info Grid */}
        <div className="space-y-2 text-sm">
          {/* Supplier + Contact Type */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <Link
                to={`${createPageUrl('ManageSuppliers')}?supplier=${encodeURIComponent(contact.supplier)}`}
                className="text-blue-600 hover:text-blue-800 hover:underline text-xs"
              >
                {contact.supplier}
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <span className="text-xs">{contactTypeLabels[contact.contact_type] || contact.contact_type}</span>
            </div>
          </div>

          {/* Department */}
          {contact.department && (
            <div className="text-xs text-gray-600">
              <span className="font-medium">מחלקה:</span> {contact.department}
            </div>
          )}

          {/* Contact Methods */}
          <div className="space-y-1.5 pt-2 border-t">
            {/* Phone */}
            {contact.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <a href={`tel:${contact.phone}`} className="text-blue-600 hover:underline text-sm">
                  {contact.phone}
                </a>
                {contact.preferred_contact_method === 'phone' && (
                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">מועדף</Badge>
                )}
              </div>
            )}

            {/* Mobile */}
            {contact.mobile && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <a href={`tel:${contact.mobile}`} className="text-blue-600 hover:underline text-sm">
                  {contact.mobile}
                </a>
                {contact.preferred_contact_method === 'mobile' && (
                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">מועדף</Badge>
                )}
              </div>
            )}

            {/* Email */}
            {contact.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <a href={`mailto:${contact.email}`} className="text-blue-600 hover:underline text-xs break-all">
                  {contact.email}
                </a>
                {contact.preferred_contact_method === 'email' && (
                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">מועדף</Badge>
                )}
              </div>
            )}
          </div>

          {/* Notes */}
          {contact.notes && (
            <div className="pt-2 border-t">
              <p className="text-xs text-gray-600 line-clamp-2">{contact.notes}</p>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="mt-3 pt-3 border-t flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(contact)}
          >
            <Edit2 className="h-4 w-4 ml-1" />
            עריכה
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}