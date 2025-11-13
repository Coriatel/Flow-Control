import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Edit2, Phone, Mail, MapPin, Globe, Users, CheckCircle2, XCircle } from 'lucide-react';

export default function SupplierCard({ supplier, contactsCount, onEdit }) {
  return (
    <Card className="mb-3 hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        {/* Header Row - Name + Status */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <h3 className="text-base font-bold text-gray-900">
              {supplier.display_name || supplier.name}
            </h3>
            {supplier.code && (
              <p className="text-xs text-gray-500 mt-1">קוד: {supplier.code}</p>
            )}
          </div>
          
          {supplier.is_active ? (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
              פעיל
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-300">
              לא פעיל
            </Badge>
          )}
        </div>

        {/* Contact Info Grid */}
        <div className="space-y-2 text-sm">
          {/* Contact Person */}
          {supplier.contact_person && (
            <div className="flex items-center gap-2 text-gray-700">
              <Users className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <span>{supplier.contact_person}</span>
            </div>
          )}

          {/* Phone */}
          {supplier.phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <a href={`tel:${supplier.phone}`} className="text-blue-600 hover:underline">
                {supplier.phone}
              </a>
            </div>
          )}

          {/* Email */}
          {supplier.email && (
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <a href={`mailto:${supplier.email}`} className="text-blue-600 hover:underline text-xs">
                {supplier.email}
              </a>
            </div>
          )}

          {/* Address */}
          {supplier.address && (
            <div className="flex items-start gap-2 text-gray-700">
              <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
              <span className="text-xs">{supplier.address}</span>
            </div>
          )}

          {/* Website */}
          {supplier.website && (
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <a href={supplier.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs">
                {supplier.website}
              </a>
            </div>
          )}
        </div>

        {/* Contacts Link */}
        <div className="mt-3 pt-3 border-t">
          <Link
            to={`${createPageUrl('Contacts')}?supplier=${encodeURIComponent(supplier.name)}`}
            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 hover:underline"
          >
            <Users className="h-4 w-4" />
            <span>{contactsCount} {contactsCount === 1 ? 'איש קשר' : 'אנשי קשר'}</span>
          </Link>
        </div>

        {/* Data Status */}
        <div className="mt-3 pt-3 border-t flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            {supplier.has_associated_data ? (
              <>
                <CheckCircle2 className="h-3 w-3 text-green-600" />
                <span>קיימים נתונים משוייכים</span>
              </>
            ) : (
              <>
                <XCircle className="h-3 w-3 text-gray-400" />
                <span>אין נתונים משוייכים</span>
              </>
            )}
          </div>

          {/* Action Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(supplier)}
          >
            <Edit2 className="h-4 w-4 ml-1" />
            עריכה
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}