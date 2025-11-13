import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Pin,
  PinOff,
  Check,
  CheckCircle,
  Clock,
  AlertTriangle,
  Archive,
  ArrowLeft,
  Loader2,
  Calendar,
  Eye,
  X,
  Filter
} from 'lucide-react';
import { format, parseISO, isValid, isBefore, isAfter } from 'date-fns';
import { he } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useToast } from "@/components/ui/use-toast";

import { DashboardNote } from '@/api/entities';
import { User } from '@/api/entities';

const priorityLabels = {
  "low": "נמוכה",
  "medium": "בינונית", 
  "high": "גבוהה",
  "urgent": "דחופה"
};

const priorityColors = {
  "low": "bg-blue-100 text-blue-800",
  "medium": "bg-yellow-100 text-yellow-800",
  "high": "bg-orange-100 text-orange-800", 
  "urgent": "bg-red-100 text-red-800"
};

const statusLabels = {
  "active": "פעיל",
  "acknowledged": "נקרא",
  "completed": "הושלם",
  "archived": "בארכיון"
};

export default function DashboardNotesPage() {
  const { toast } = useToast();
  const navigate = useNavigate();

  // State management
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('active');
  
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [viewingNote, setViewingNote] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  // Form data
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: 'medium',
    reminder_date: '',
    tags: [],
    related_activity_date: '',
    is_pinned: false
  });

  const [tagInput, setTagInput] = useState('');

  // Load current user and notes
  useEffect(() => {
    const loadData = async () => {
      try {
        const user = await User.me();
        setCurrentUser(user);
        await fetchNotes();
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    loadData();
  }, []);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const notesData = await DashboardNote.list('-created_date');
      setNotes(Array.isArray(notesData) ? notesData : []);
    } catch (error) {
      console.error('Error fetching notes:', error);
      toast({
        title: "שגיאה בטעינת הערות",
        description: "לא ניתן היה לטעון את רשימת ההערות",
        variant: "destructive"
      });
      setNotes([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter notes based on tab and search
  const filteredNotes = notes.filter(note => {
    const matchesSearch = !searchTerm || 
      note.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesPriority = priorityFilter === 'all' || note.priority === priorityFilter;
    
    const matchesTab = (() => {
      switch (activeTab) {
        case 'active': return note.status === 'active';
        case 'acknowledged': return note.status === 'acknowledged';
        case 'completed': return note.status === 'completed';
        case 'archived': return note.status === 'archived';
        default: return true;
      }
    })();

    return matchesSearch && matchesPriority && matchesTab;
  });

  // Sort notes - pinned first, then by creation date
  const sortedNotes = filteredNotes.sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;
    return parseISO(b.created_date) - parseISO(a.created_date);
  });

  // Handle form submission
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.content.trim()) {
      toast({
        title: "שגיאת ולידציה",
        description: "יש להזין תוכן להערה",
        variant: "destructive"
      });
      return;
    }

    try {
      const noteData = {
        ...formData,
        title: formData.title.trim() || null,
        content: formData.content.trim(),
        reminder_date: formData.reminder_date || null,
        related_activity_date: formData.related_activity_date || null,
        tags: formData.tags.length > 0 ? formData.tags : null
      };

      if (editingNote) {
        await DashboardNote.update(editingNote.id, noteData);
        toast({
          title: "הערה עודכנה",
          description: "ההערה עודכנה בהצלחה",
          variant: "default"
        });
      } else {
        await DashboardNote.create(noteData);
        toast({
          title: "הערה נוספה",
          description: "הערה חדשה נוספה למערכת",
          variant: "default"
        });
      }
      
      resetForm();
      fetchNotes();
    } catch (error) {
      console.error('Error saving note:', error);
      toast({
        title: "שגיאה בשמירה",
        description: "אירעה שגיאה בשמירת ההערה",
        variant: "destructive"
      });
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      priority: 'medium',
      reminder_date: '',
      tags: [],
      related_activity_date: '',
      is_pinned: false
    });
    setTagInput('');
    setEditingNote(null);
    setShowForm(false);
  };

  // Handle note status changes
  const handleStatusChange = async (note, newStatus) => {
    try {
      const updateData = { status: newStatus };
      
      if (newStatus === 'acknowledged' && !note.acknowledged_date) {
        updateData.acknowledged_date = new Date().toISOString();
        updateData.acknowledged_by = currentUser?.email || 'Unknown';
      } else if (newStatus === 'completed' && !note.completion_date) {
        updateData.completion_date = new Date().toISOString();
      }

      await DashboardNote.update(note.id, updateData);
      
      toast({
        title: "סטטוס עודכן",
        description: `ההערה סומנה כ${statusLabels[newStatus]}`,
        variant: "default"
      });
      
      fetchNotes();
    } catch (error) {
      console.error('Error updating note status:', error);
      toast({
        title: "שגיאה בעדכון",
        description: "אירעה שגיאה בעדכון הסטטוס",
        variant: "destructive"
      });
    }
  };

  // Handle pin/unpin
  const handleTogglePin = async (note) => {
    try {
      await DashboardNote.update(note.id, { is_pinned: !note.is_pinned });
      
      toast({
        title: note.is_pinned ? "הערה הוסרה מנעיצה" : "הערה נעוצה",
        description: note.is_pinned ? "ההערה הוסרה מהראש" : "ההערה תופיע בראש הרשימה",
        variant: "default"
      });
      
      fetchNotes();
    } catch (error) {
      console.error('Error toggling pin:', error);
      toast({
        title: "שגיאה בעדכון",
        description: "אירעה שגיאה בעדכון הנעיצה",
        variant: "destructive"
      });
    }
  };

  // Handle delete
  const handleDelete = async (note) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק הערה זו?')) return;
    
    try {
      await DashboardNote.delete(note.id);
      
      toast({
        title: "הערה נמחקה",
        description: "ההערה נמחקה מהמערכת",
        variant: "default"
      });
      
      fetchNotes();
    } catch (error) {
      console.error('Error deleting note:', error);
      toast({
        title: "שגיאה במחיקה",
        description: "אירעה שגיאה במחיקת ההערה",
        variant: "destructive"
      });
    }
  };

  // Handle edit
  const handleEdit = (note) => {
    setFormData({
      title: note.title || '',
      content: note.content || '',
      priority: note.priority || 'medium',
      reminder_date: note.reminder_date ? note.reminder_date.substring(0, 16) : '',
      tags: note.tags || [],
      related_activity_date: note.related_activity_date || '',
      is_pinned: note.is_pinned || false
    });
    setEditingNote(note);
    setShowForm(true);
  };

  // Handle view
  const handleView = (note) => {
    setViewingNote(note);
    setShowViewDialog(true);
  };

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle tags
  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && e.target.id === 'tagInput') {
      e.preventDefault();
      handleAddTag();
    }
  };

  // Get counts for tabs
  const getCounts = () => {
    return {
      active: notes.filter(n => n.status === 'active').length,
      acknowledged: notes.filter(n => n.status === 'acknowledged').length,
      completed: notes.filter(n => n.status === 'completed').length,
      archived: notes.filter(n => n.status === 'archived').length
    };
  };

  const counts = getCounts();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64" dir="rtl">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
        <p className="ml-3 text-lg text-gray-600">טוען הערות...</p>
      </div>
    );
  }

  return (
    <div className="p-6" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className="mr-2"
            onClick={() => navigate(createPageUrl('Dashboard'))}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">ניהול הערות ומשימות</h1>
            <p className="text-gray-600">תיעוד פעילות יומיומית ומעקב אחר משימות</p>
          </div>
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          הוסף הערה
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="חפש הערות..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="עדיפות" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל העדיפויות</SelectItem>
              {Object.entries(priorityLabels).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="active" className="flex items-center gap-2">
            פעיל ({counts.active})
          </TabsTrigger>
          <TabsTrigger value="acknowledged" className="flex items-center gap-2">
            נקרא ({counts.acknowledged})
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center gap-2">
            הושלם ({counts.completed})
          </TabsTrigger>
          <TabsTrigger value="archived" className="flex items-center gap-2">
            ארכיון ({counts.archived})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {sortedNotes.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-gray-500">אין הערות להצגה</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {sortedNotes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  onStatusChange={handleStatusChange}
                  onTogglePin={handleTogglePin}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onView={handleView}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add/Edit Note Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>
              {editingNote ? 'עריכת הערה' : 'הוספת הערה חדשה'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">כותרת (אופציונלי)</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="הזן כותרת להערה..."
              />
            </div>

            <div>
              <Label htmlFor="content">תוכן ההערה *</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => handleInputChange('content', e.target.value)}
                placeholder="הזן את תוכן ההערה..."
                rows={4}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="priority">עדיפות</Label>
                <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(priorityLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="reminder_date">תאריך תזכורת</Label>
                <Input
                  id="reminder_date"
                  type="datetime-local"
                  value={formData.reminder_date}
                  onChange={(e) => handleInputChange('reminder_date', e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="related_activity_date">תאריך פעילות קשורה</Label>
              <Input
                id="related_activity_date"
                type="date"
                value={formData.related_activity_date}
                onChange={(e) => handleInputChange('related_activity_date', e.target.value)}
              />
            </div>

            {/* Tags */}
            <div>
              <Label htmlFor="tagInput">תגיות</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  id="tagInput"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="הזן תגית והקש Enter"
                />
                <Button type="button" onClick={handleAddTag} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => handleRemoveTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-2 space-x-reverse">
              <input
                type="checkbox"
                id="is_pinned"
                checked={formData.is_pinned}
                onChange={(e) => handleInputChange('is_pinned', e.target.checked)}
                className="h-4 w-4"
              />
              <Label htmlFor="is_pinned">נעץ הערה בראש הרשימה</Label>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={resetForm}>
                ביטול
              </Button>
              <Button type="submit">
                {editingNote ? 'עדכן הערה' : 'הוסף הערה'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Note Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>
              {viewingNote?.title || 'הצגת הערה'}
            </DialogTitle>
          </DialogHeader>
          
          {viewingNote && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge className={priorityColors[viewingNote.priority]}>
                  {priorityLabels[viewingNote.priority]}
                </Badge>
                <Badge variant="outline">
                  {statusLabels[viewingNote.status]}
                </Badge>
                {viewingNote.is_pinned && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Pin className="h-3 w-3" />
                    נעוץ
                  </Badge>
                )}
              </div>

              <div>
                <Label>תוכן:</Label>
                <div className="bg-gray-50 p-3 rounded-md mt-1">
                  {viewingNote.content}
                </div>
              </div>

              {viewingNote.tags && viewingNote.tags.length > 0 && (
                <div>
                  <Label>תגיות:</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {viewingNote.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {viewingNote.reminder_date && (
                <div>
                  <Label>תזכורת:</Label>
                  <p className="text-sm text-gray-600">
                    {format(parseISO(viewingNote.reminder_date), 'dd/MM/yyyy HH:mm', { locale: he })}
                  </p>
                </div>
              )}

              {viewingNote.related_activity_date && (
                <div>
                  <Label>תאריך פעילות קשורה:</Label>
                  <p className="text-sm text-gray-600">
                    {format(parseISO(viewingNote.related_activity_date), 'dd/MM/yyyy', { locale: he })}
                  </p>
                </div>
              )}

              <div className="text-xs text-gray-500 pt-2 border-t">
                <p>נוצר: {format(parseISO(viewingNote.created_date), 'dd/MM/yyyy HH:mm', { locale: he })}</p>
                {viewingNote.acknowledged_date && (
                  <p>נקרא: {format(parseISO(viewingNote.acknowledged_date), 'dd/MM/yyyy HH:mm', { locale: he })} על ידי {viewingNote.acknowledged_by}</p>
                )}
                {viewingNote.completion_date && (
                  <p>הושלם: {format(parseISO(viewingNote.completion_date), 'dd/MM/yyyy HH:mm', { locale: he })}</p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowViewDialog(false)}>
                  סגור
                </Button>
                <Button onClick={() => {
                  setShowViewDialog(false);
                  handleEdit(viewingNote);
                }}>
                  <Edit className="h-4 w-4 mr-2" />
                  ערוך
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Note Card Component
function NoteCard({ note, onStatusChange, onTogglePin, onEdit, onDelete, onView }) {
  const hasReminder = note.reminder_date && isAfter(parseISO(note.reminder_date), new Date());
  const isOverdue = note.reminder_date && isBefore(parseISO(note.reminder_date), new Date());

  return (
    <Card className={`${note.is_pinned ? 'border-blue-500 bg-blue-50' : ''} ${isOverdue ? 'border-red-300' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {note.is_pinned && <Pin className="h-4 w-4 text-blue-600" />}
              {note.title && (
                <h3 className="font-semibold text-gray-900">{note.title}</h3>
              )}
              <Badge className={priorityColors[note.priority]}>
                {priorityLabels[note.priority]}
              </Badge>
              {hasReminder && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  תזכורת
                </Badge>
              )}
              {isOverdue && (
                <Badge variant="outline" className="flex items-center gap-1 border-red-300 text-red-600">
                  <AlertTriangle className="h-3 w-3" />
                  פגת תוקף
                </Badge>
              )}
            </div>
            <p className="text-gray-700 text-sm line-clamp-3">
              {note.content}
            </p>
            {note.tags && note.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {note.tags.slice(0, 3).map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {note.tags.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{note.tags.length - 3}
                  </Badge>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => onView(note)}>
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onTogglePin(note)}>
              {note.is_pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onEdit(note)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onDelete(note)} className="text-red-600">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500">
            נוצר: {format(parseISO(note.created_date), 'dd/MM HH:mm', { locale: he })}
            {note.reminder_date && (
              <span className="ml-3">
                תזכורת: {format(parseISO(note.reminder_date), 'dd/MM HH:mm', { locale: he })}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            {note.status === 'active' && (
              <>
                <Button size="sm" variant="outline" onClick={() => onStatusChange(note, 'acknowledged')}>
                  <Check className="h-4 w-4 mr-1" />
                  סמן כנקרא
                </Button>
                <Button size="sm" onClick={() => onStatusChange(note, 'completed')}>
                  <CheckCircle className="h-4 w-4 mr-1" />
                  סמן כהושלם
                </Button>
              </>
            )}
            {note.status === 'acknowledged' && (
              <Button size="sm" onClick={() => onStatusChange(note, 'completed')}>
                <CheckCircle className="h-4 w-4 mr-1" />
                סמן כהושלם
              </Button>
            )}
            {(note.status === 'completed' || note.status === 'acknowledged') && (
              <Button size="sm" variant="outline" onClick={() => onStatusChange(note, 'archived')}>
                <Archive className="h-4 w-4 mr-1" />
                העבר לארכיון
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}