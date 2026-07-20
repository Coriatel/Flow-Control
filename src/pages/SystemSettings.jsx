import React, { useState, useEffect } from 'react';
import { SystemSettings } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Paperclip, ScanLine } from 'lucide-react';
import { UploadFile } from '@/api/integrations';
import { apiClient } from '@/api/client';

export default function SystemSettingsPage() {
    const { toast } = useToast();
    const [settings, setSettings] = useState({
        mainHeaderName: '',
        sidebarHeaderName: '',
        logoUrl: ''
    });
    const [logoFile, setLogoFile] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSettings = async () => {
            setLoading(true);
            try {
                const existingSettings = await SystemSettings.list();
                if (existingSettings && existingSettings.length > 0) {
                    setSettings(existingSettings[0]);
                }
            } catch (error) {
                toast({
                    title: "שגיאה בטעינת הגדרות",
                    description: "לא ניתן היה לטעון את הגדרות המערכת.",
                    variant: "destructive"
                });
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, [toast]);

    // Inventory method settings state (hooks must run on every render — before any early return)
    const [inventorySettings, setInventorySettings] = useState({
        consumption_method: 'barcode',
        manual_entry_policy: 'admin_only',
        receiving_default_method: 'purchase_request',
    });
    const [savingInventorySettings, setSavingInventorySettings] = useState(false);

    useEffect(() => {
        const fetchInventorySettings = async () => {
            try {
                const response = await apiClient.get('/systemsettings');
                const allSettings = Array.isArray(response) ? response : (response?.data || response || []);
                const settingsArray = Array.isArray(allSettings) ? allSettings : [];
                const invSettings = {};
                const invKeys = ['consumption_method', 'manual_entry_policy', 'receiving_default_method'];
                settingsArray.forEach(s => {
                    if (invKeys.includes(s.key)) {
                        invSettings[s.key] = s.value;
                    }
                });
                if (Object.keys(invSettings).length > 0) {
                    setInventorySettings(prev => ({ ...prev, ...invSettings }));
                }
            } catch (e) {
                // Settings may not exist yet
            }
        };
        fetchInventorySettings();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setLogoFile(e.target.files[0]);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            let dataToSave = { ...settings };

            if (logoFile) {
                toast({ title: 'מעלה תמונה...', description: 'אנא המתן.' });
                const { file_url } = await UploadFile({ file: logoFile });
                dataToSave.logoUrl = file_url;
            }
            
            // Check if there's an existing settings document
            const existingSettings = await SystemSettings.list();
            if (existingSettings && existingSettings.length > 0) {
                // Update existing settings
                await SystemSettings.update(existingSettings[0].id, dataToSave);
            } else {
                // Create new settings document
                await SystemSettings.create(dataToSave);
            }

            toast({
                title: "ההגדרות נשמרו בהצלחה",
                description: "השינויים יופיעו ברחבי המערכת.",
                variant: "success",
            });
            setLogoFile(null); // Clear the file after saving
            // Optionally, force a reload to see changes everywhere immediately
            window.location.reload();
        } catch (error) {
            toast({
                title: "שגיאה בשמירת ההגדרות",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setIsSaving(false);
        }
    };
    
    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            </div>
        );
    }

    const handleSaveInventorySettings = async () => {
        setSavingInventorySettings(true);
        try {
            for (const [key, value] of Object.entries(inventorySettings)) {
                await apiClient.post('/systemsettings', { key, value });
            }
            toast({ title: "הגדרות מלאי נשמרו", variant: "success" });
        } catch (err) {
            toast({ title: "שגיאה בשמירת הגדרות מלאי", description: err.message, variant: "destructive" });
        } finally {
            setSavingInventorySettings(false);
        }
    };

    const logoPreviewUrl = logoFile ? URL.createObjectURL(logoFile) : settings.logoUrl;

    return (
        <div dir="rtl" className="p-6 space-y-6">
            <h1 className="text-2xl font-bold">הגדרות מערכת</h1>
            <Card className="max-w-2xl">
                <CardHeader>
                    <CardTitle>התאמה אישית של המערכת</CardTitle>
                    <CardDescription>
                        כאן תוכל לעדכן את השמות והלוגו שיופיעו במערכת.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="mainHeaderName">כותרת ראשית</Label>
                        <Input 
                            id="mainHeaderName" 
                            name="mainHeaderName" 
                            value={settings.mainHeaderName} 
                            onChange={handleChange}
                            placeholder="השם שמופיע בסרגל העליון (מובייל)"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="sidebarHeaderName">כותרת תפריט צד</Label>
                        <Input 
                            id="sidebarHeaderName" 
                            name="sidebarHeaderName" 
                            value={settings.sidebarHeaderName} 
                            onChange={handleChange}
                            placeholder="השם המלא שמופיע בתפריט הצד"
                        />
                    </div>
                    <div className="space-y-4">
                        <Label>לוגו המערכת</Label>
                        <div className="flex items-center gap-4">
                            {logoPreviewUrl && (
                                <img src={logoPreviewUrl} alt="תצוגה מקדימה" className="h-16 w-16 rounded-full object-contain border p-1 bg-gray-50" />
                            )}
                            <Button asChild variant="outline">
                                <Label htmlFor="logoUrl" className="cursor-pointer flex items-center">
                                    <Paperclip className="h-4 w-4 ms-2" />
                                    {logoFile ? 'החלף קובץ' : 'בחר קובץ'}
                                </Label>
                            </Button>
                            <Input 
                                id="logoUrl" 
                                type="file"
                                className="hidden"
                                accept="image/png, image/jpeg, image/gif, image/webp"
                                onChange={handleFileChange}
                            />
                        </div>
                        {logoFile && <p className="text-sm text-gray-600">קובץ שנבחר: {logoFile.name}</p>}
                    </div>
                </CardContent>
                <CardFooter>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving && <Loader2 className="h-4 w-4 ms-2 animate-spin" />}
                        שמור שינויים
                    </Button>
                </CardFooter>
            </Card>

            {/* Inventory Methods Settings */}
            <Card className="max-w-2xl">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ScanLine className="h-5 w-5 text-blue-600" />
                        שיטות מלאי
                    </CardTitle>
                    <CardDescription>
                        הגדרות שיטת הצריכה, הזנה ידנית וקליטת משלוחים
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label>שיטת חישוב צריכה</Label>
                        <Select
                            value={inventorySettings.consumption_method}
                            onValueChange={(val) => setInventorySettings(prev => ({ ...prev, consumption_method: val }))}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="barcode">סריקת ברקוד (מומלץ)</SelectItem>
                                <SelectItem value="inference">הסקה מספירת מלאי</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">ברקוד - רישום הוצאה בזמן אמת. הסקה - חישוב אוטומטי לפי הפרש ספירות.</p>
                    </div>
                    <div className="space-y-2">
                        <Label>מדיניות הזנה ידנית</Label>
                        <Select
                            value={inventorySettings.manual_entry_policy}
                            onValueChange={(val) => setInventorySettings(prev => ({ ...prev, manual_entry_policy: val }))}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="admin_only">מנהלים בלבד</SelectItem>
                                <SelectItem value="all_users">כל המשתמשים</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">מי רשאי להזין כמויות ידנית ללא סריקת ברקוד.</p>
                    </div>
                    <div className="space-y-2">
                        <Label>שיטת קליטה ברירת מחדל</Label>
                        <Select
                            value={inventorySettings.receiving_default_method}
                            onValueChange={(val) => setInventorySettings(prev => ({ ...prev, receiving_default_method: val }))}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="purchase_request">דרישת רכש</SelectItem>
                                <SelectItem value="barcode_scan">סריקת ברקוד</SelectItem>
                                <SelectItem value="manual">הזנה ידנית</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">השיטה שתשמש כברירת מחדל בקליטת משלוחים.</p>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button onClick={handleSaveInventorySettings} disabled={savingInventorySettings}>
                        {savingInventorySettings && <Loader2 className="h-4 w-4 ms-2 animate-spin" />}
                        שמור הגדרות מלאי
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}