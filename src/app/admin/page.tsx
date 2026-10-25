
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import * as z from 'zod';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';
import { Users, Eye, TrendingUp, CircleAlert, Loader2, KeyRound, BarChart3, PlusCircle, Trash2, X, MessageSquare, Bell } from 'lucide-react';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, collection, query, orderBy, writeBatch } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { KNOWN_APIS } from '@/lib/metrics';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
});

const ApiKeySchema = z.object({
  name: z.string().min(1, 'Key name is required.'),
  key: z.string().min(1, 'API key is required.'),
});

const settingsSchema = z.object({
  ezoicKey: z.string().optional(),
  adsenseKey: z.string().optional(),
  adSlotId: z.string().optional(),
  gaMeasurementId: z.string().optional(),
  
  newsdataKeys: z.array(ApiKeySchema).optional(),
  activeNewsdataKeyName: z.string().optional(),
  rotateNewsdataKeys: z.boolean().default(false).optional(),

  geminiKeys: z.array(ApiKeySchema).optional(),
  activeGeminiKeyName: z.string().optional(),
});


type ApiUsageData = {
  name: string;
  keys: {
    name: string;
    today: number;
    month: number;
  }[];
  totalToday: number;
  totalMonth: number;
};


const kpiData = {
    totalVisits: '1.2M',
    uniqueVisitors: '876K',
    pageViews: '3.4M',
    bounceRate: '45.7%',
};

const trafficData = [
    { country: 'India', visitors: 45000 },
    { country: 'USA', visitors: 28000 },
    { country: 'Pakistan', visitors: 12000 },
];

const trafficChartConfig = {
    visitors: {
        label: 'Visitors',
        color: 'hsl(var(--primary))',
    },
} satisfies ChartConfig;

const topArticles = [
    { title: 'Global Tech Market Hits New Highs', views: '125.4K' },
    { title: 'National Sports Championship Concludes', views: '98.8K' },
    { title: 'The Future of AI in Entertainment', views: '87.6K' },
    { title: 'Business Trends to Watch in the Next Quarter', views: '76.5K' },
    { title: 'A Deep Dive into International Relations', views: '65.4K' },
];

interface ContactSubmission {
    id: string;
    name: string;
    email: string;
    message: string;
    createdAt: Date | null;
    isRead: boolean;
}

function MessagesTab({ messages, loading }: { messages: ContactSubmission[], loading: boolean }) {
  return (
     <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageSquare className="mr-2 h-5 w-5" />
            Contact Form Messages
          </CardTitle>
          <CardDescription>
            Messages submitted through the contact form, sorted by most recent.
          </CardDescription>
        </CardHeader>
        <CardContent>
            {loading ? (
                <div className="flex items-center justify-center h-24">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            ) : messages.length === 0 ? (
                <p className="text-muted-foreground text-sm">No messages have been received yet.</p>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[150px]">Received</TableHead>
                            <TableHead className="w-[200px]">From</TableHead>
                            <TableHead>Message</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {messages.map((msg) => (
                            <TableRow key={msg.id} data-state={!msg.isRead ? 'selected' : undefined}>
                                <TableCell className="text-xs">
                                    <div className="flex items-center gap-2">
                                        {!msg.isRead && (
                                            <span className="relative flex h-2 w-2" title="Unread">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                                            </span>
                                        )}
                                        <span className="text-muted-foreground">
                                            {msg.createdAt ? formatDistanceToNow(msg.createdAt, { addSuffix: true }) : 'N/A'}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="font-medium">{msg.name}</div>
                                    <div className="text-xs text-muted-foreground">{msg.email}</div>
                                </TableCell>
                                <TableCell className="whitespace-pre-wrap">{msg.message}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}
        </CardContent>
     </Card>
  );
}


function AdminPanel({ onLogout }: { onLogout: () => void }) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [apiUsage, setApiUsage] = useState<ApiUsageData[] | null>(null);
  const [currentNewsdataKey, setCurrentNewsdataKey] = useState<string | null>(null);
  const [currentGeminiKey, setCurrentGeminiKey] = useState<string | null>(null);
  const [messages, setMessages] = useState<ContactSubmission[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [activeTab, setActiveTab] = React.useState('settings');
  
  const unreadCount = useMemo(() => {
    return messages.filter(msg => !msg.isRead).length;
  }, [messages]);

  const unreadMessageIds = useMemo(() => {
    return messages.filter(msg => !msg.isRead).map(msg => msg.id);
  }, [messages]);
  
  useEffect(() => {
    const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutes
    let inactivityTimer: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        toast({
          title: 'Session Expired',
          description: 'You have been logged out due to inactivity.',
        });
        onLogout();
      }, INACTIVITY_TIMEOUT);
    };

    const activityEvents: (keyof WindowEventMap)[] = ['mousemove', 'keydown', 'click', 'scroll'];
    activityEvents.forEach(event => window.addEventListener(event, resetTimer));

    resetTimer(); // Initial setup

    return () => {
      clearTimeout(inactivityTimer);
      activityEvents.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [onLogout, toast]);

  const form = useForm<z.infer<typeof settingsSchema>>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      ezoicKey: '',
      adsenseKey: 'ca-pub-4135832301482741',
      adSlotId: '',
      gaMeasurementId: '',
      newsdataKeys: [],
      activeNewsdataKeyName: '',
      rotateNewsdataKeys: false,
      geminiKeys: [],
      activeGeminiKeyName: '',
    },
  });
  
  const { fields: newsdataFields, append: appendNewsdataKey, remove: removeNewsdataKey } = useFieldArray({
    control: form.control,
    name: "newsdataKeys",
  });
  
  const { fields: geminiFields, append: appendGeminiKey, remove: removeGeminiKey } = useFieldArray({
    control: form.control,
    name: "geminiKeys",
  });
  
  const watchedNewsdataKeys = useWatch({ control: form.control, name: 'newsdataKeys' });
  const watchedGeminiKeys = useWatch({ control: form.control, name: 'geminiKeys' });
  const rotateNewsdataKeys = useWatch({ control: form.control, name: 'rotateNewsdataKeys' });

  // Fetch static settings once to populate the form
  useEffect(() => {
    const fetchSettings = async () => {
        if (!db) return;
        try {
            const adSettingsDocRef = doc(db, 'settings', 'ads');
            const apiKeysDocRef = doc(db, 'settings', 'apiKeys');

            const [adSettingsSnap, apiKeysSnap] = await Promise.all([
                getDoc(adSettingsDocRef),
                getDoc(apiKeysDocRef),
            ]);
            
            const adData = adSettingsSnap.exists() ? adSettingsSnap.data() : {};
            const apiKeysData = apiKeysSnap.exists() ? apiKeysSnap.data() : {};

            form.reset({
                ezoicKey: adData.ezoicKey || '',
                adsenseKey: adData.adsenseKey || 'ca-pub-4135832301482741',
                adSlotId: adData.adSlotId || '',
                gaMeasurementId: adData.gaMeasurementId || '',
                newsdataKeys: apiKeysData.newsdata?.keys || [],
                activeNewsdataKeyName: apiKeysData.newsdata?.activeKeyName || '',
                rotateNewsdataKeys: apiKeysData.newsdata?.rotate || false,
                geminiKeys: apiKeysData.gemini?.keys || [],
                activeGeminiKeyName: apiKeysData.gemini?.activeKeyName || '',
            });
        } catch (error) {
            console.error("Error fetching settings from Firestore:", error);
            toast({
                variant: 'destructive',
                title: 'Load Failed',
                description: 'Could not load settings from the database.',
            });
        }
    };
    fetchSettings();
  }, [form, toast]);

  // Listen for real-time updates to the active key when rotation is on
  useEffect(() => {
    if (!db || !rotateNewsdataKeys) {
        setCurrentNewsdataKey(null);
        return;
    };
    const apiStateDocRef = doc(db, 'settings', 'apiState');

    const unsubscribe = onSnapshot(apiStateDocRef, (docSnap) => {
        if (docSnap.exists()) {
            setCurrentNewsdataKey(docSnap.data().lastUsedNewsdataKeyName);
        } else {
            setCurrentNewsdataKey(null);
        }
    }, (error) => {
        console.error("Error listening to API state:", error);
    });

    return () => unsubscribe();
  }, [rotateNewsdataKeys]);

  // Listen for real-time updates to the active Gemini key
  useEffect(() => {
    if (!db) return;
    const apiKeysDocRef = doc(db, 'settings', 'apiKeys');

    const unsubscribe = onSnapshot(apiKeysDocRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            setCurrentGeminiKey(data.gemini?.activeKeyName);
        } else {
            setCurrentGeminiKey(null);
        }
    }, (error) => {
        console.error("Error listening to active Gemini key:", error);
    });

    return () => unsubscribe();
  }, []);


  useEffect(() => {
    const fetchUsageData = async () => {
      if (!db) return;
      
      const today = new Date();
      const year = today.getUTCFullYear();
      const month = (today.getUTCMonth() + 1).toString().padStart(2, '0');
      const day = today.getUTCDate().toString().padStart(2, '0');
      const monthKey = `${year}-${month}`;
      const dayKey = `${year}-${month}-${day}`;

      try {
        const allConfiguredKeys = {
            'Newsdata.io API': watchedNewsdataKeys,
            'Gemini (Generate Article)': watchedGeminiKeys,
            'Gemini (Translate Article)': watchedGeminiKeys,
            'Gemini (Generate Audio)': watchedGeminiKeys,
        };

        const usagePromises = KNOWN_APIS.map(async (api) => {
            const configuredKeys = allConfiguredKeys[api.name as keyof typeof allConfiguredKeys] || [];
            if (!configuredKeys || configuredKeys.length === 0) return null;

            const keysUsagePromises = configuredKeys
              .filter(key => key && key.name)
              .map(async (configuredKey) => {
                  const keyUsageDocRef = doc(db, 'apiUsage', api.id, 'keys', configuredKey.name);
                  const docSnap = await getDoc(keyUsageDocRef);
                  const data = docSnap.exists() ? docSnap.data() : {};
                  return {
                      name: configuredKey.name,
                      today: data?.daily?.[dayKey] || 0,
                      month: data?.monthly?.[monthKey] || 0,
                  };
              });

            const keysData = await Promise.all(keysUsagePromises);
            const totalToday = keysData.reduce((sum, key) => sum + key.today, 0);
            const totalMonth = keysData.reduce((sum, key) => sum + key.month, 0);

            return { name: api.name, keys: keysData, totalToday, totalMonth };
        });

        const allUsageData = (await Promise.all(usagePromises)).filter((u): u is ApiUsageData => u !== null);
        setApiUsage(allUsageData);

      } catch (error) {
        console.error("Error fetching API usage data:", error);
        setApiUsage([]); 
      }
    };
    fetchUsageData();
  }, [watchedNewsdataKeys, watchedGeminiKeys]);
  
  useEffect(() => {
    if (!db) {
      setMessagesLoading(false);
      return;
    }

    const q = query(collection(db, 'contactSubmissions'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const submissions: ContactSubmission[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        submissions.push({
          id: doc.id,
          name: data.name,
          email: data.email,
          message: data.message,
          createdAt: data.createdAt?.toDate() || null,
          isRead: data.isRead || false,
        });
      });
      setMessages(submissions);
      setMessagesLoading(false);
    }, (error) => {
      console.error("Error fetching contact submissions:", error);
      setMessagesLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const markMessagesAsRead = async () => {
      if (!db) {
        console.error("Firebase is not configured.");
        return;
      }
      if (unreadMessageIds.length === 0) return;
      
      try {
        const batch = writeBatch(db);
        const submissionsRef = collection(db, 'contactSubmissions');
        
        unreadMessageIds.forEach(id => {
          const docRef = doc(submissionsRef, id);
          batch.update(docRef, { isRead: true });
        });
        
        await batch.commit();
      } catch (error) {
        console.error("Error marking messages as read:", error);
        toast({
          variant: 'destructive',
          title: 'Error updating messages',
          description: (error as Error).message || 'Could not mark messages as read.',
        });
      }
    };

    if (activeTab === 'messages' && unreadMessageIds.length > 0) {
      markMessagesAsRead();
    }
  }, [activeTab, unreadMessageIds, toast]);

  async function onSubmit(values: z.infer<typeof settingsSchema>) {
    setIsSaving(true);
    if (!db || !auth.currentUser) {
      toast({
        variant: 'destructive',
        title: 'Save Failed',
        description: 'You must be logged in to save settings.',
      });
      setIsSaving(false);
      return;
    }

    try {
      const adSettingsDocRef = doc(db, 'settings', 'ads');
      const apiKeysDocRef = doc(db, 'settings', 'apiKeys');

      const adSettings = {
        ezoicKey: values.ezoicKey || '',
        adsenseKey: values.adsenseKey || '',
        adSlotId: values.adSlotId || '',
        gaMeasurementId: values.gaMeasurementId || '',
      };
      
      const apiKeysData = {
        newsdata: {
          keys: values.newsdataKeys || [],
          activeKeyName: values.activeNewsdataKeyName || '',
          rotate: values.rotateNewsdataKeys || false,
        },
        gemini: {
          keys: values.geminiKeys || [],
          activeKeyName: values.activeGeminiKeyName || '',
        },
      };
      
      await Promise.all([
        setDoc(adSettingsDocRef, adSettings, { merge: true }),
        setDoc(apiKeysDocRef, apiKeysData, { merge: true }),
      ]);

      toast({
        title: 'Settings Saved',
        description: 'Your settings have been saved successfully.',
      });

      router.refresh();

    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast({
        variant: 'destructive',
        title: 'Save Error',
        description: `Failed to save settings: ${error.message}`,
      });
    } finally {
      setIsSaving(false);
    }
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-headline font-bold">Admin Panel</h1>
          <CardDescription className="pt-1">Manage settings, view analytics, and read messages.</CardDescription>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" aria-label="View Messages" onClick={() => handleTabChange('messages')} className="relative">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs font-bold text-destructive-foreground">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </Button>
            <Button variant="outline" onClick={onLogout}>Logout</Button>
        </div>
      </div>

       <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
          <TabsTrigger value="settings">Settings & Analytics</TabsTrigger>
          <TabsTrigger value="messages">
            Messages
          </TabsTrigger>
        </TabsList>
        <TabsContent value="settings" className="mt-6 space-y-8">
            <Card>
                <CardHeader>
                <div>
                    <CardTitle>Site Settings</CardTitle>
                    <CardDescription className="pt-1">Manage your integrations and API keys. Settings are saved in Firebase.</CardDescription>
                </div>
                </CardHeader>
                <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium flex items-center"><KeyRound className="mr-2 h-5 w-5" /> API Keys</h3>
                        <div className="space-y-6 rounded-lg border p-4">
                            {/* Newsdata.io Keys */}
                            <div className="space-y-4">
                            <FormLabel>Newsdata.io API Keys</FormLabel>
                            <div className="space-y-2">
                                {newsdataFields.map((field, index) => (
                                <div key={field.id} className="grid grid-cols-1 md:grid-cols-[1fr_2fr_auto] gap-2 items-start">
                                    <FormField control={form.control} name={`newsdataKeys.${index}.name`} render={({ field }) => (
                                        <FormItem>
                                            <FormControl><Input placeholder="Key Name (e.g., Primary)" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}/>
                                    <FormField control={form.control} name={`newsdataKeys.${index}.key`} render={({ field }) => (
                                        <FormItem>
                                            <FormControl><Input placeholder="API Key" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}/>
                                    <Button type="button" variant="ghost" size="icon" onClick={() => removeNewsdataKey(index)} aria-label="Remove key">
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                                ))}
                            </div>
                            <Button type="button" variant="outline" size="sm" onClick={() => appendNewsdataKey({ name: '', key: '' })}>
                                <PlusCircle className="mr-2 h-4 w-4" /> Add Key
                            </Button>

                                <FormField
                                    control={form.control}
                                    name="rotateNewsdataKeys"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                            <FormLabel>
                                            Automatically rotate Newsdata.io keys
                                            </FormLabel>
                                            <FormDescription>
                                            If checked, the app will cycle through all available keys. If unchecked, it will use the selected active key below.
                                            </FormDescription>
                                        </div>
                                        </FormItem>
                                    )}
                                />

                            <FormField control={form.control} name="activeNewsdataKeyName" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Active Newsdata.io Key</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value} disabled={rotateNewsdataKeys}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select an active key" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {watchedNewsdataKeys?.filter(key => key.name && key.key).map(key => (
                                            <SelectItem key={key.name} value={key.name}>{key.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                    </Select>
                                    <FormDescription>Select the key to use for fetching news. Changes will apply site-wide after saving.</FormDescription>
                                    <FormMessage />
                                 </FormItem>
                            )}/>

                                {rotateNewsdataKeys && currentNewsdataKey && (
                                    <div className="text-sm p-3 bg-muted/50 rounded-lg">
                                        Currently using: <span className="font-semibold text-primary">{currentNewsdataKey}</span> (updates on the next article fetch)
                                    </div>
                                )}
                            </div>

                            <Separator />

                            {/* Gemini Keys */}
                            <div className="space-y-4">
                            <FormLabel>Google Gemini API Keys</FormLabel>
                            <div className="space-y-2">
                                {geminiFields.map((field, index) => (
                                <div key={field.id} className="grid grid-cols-1 md:grid-cols-[1fr_2fr_auto] gap-2 items-start">
                                    <FormField control={form.control} name={`geminiKeys.${index}.name`} render={({ field }) => (
                                        <FormItem>
                                            <FormControl><Input placeholder="Key Name (e.g., AI Features)" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}/>
                                    <FormField control={form.control} name={`geminiKeys.${index}.key`} render={({ field }) => (
                                        <FormItem>
                                            <FormControl><Input placeholder="API Key" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}/>
                                    <Button type="button" variant="ghost" size="icon" onClick={() => removeGeminiKey(index)} aria-label="Remove key">
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                                ))}
                            </div>
                            <Button type="button" variant="outline" size="sm" onClick={() => appendGeminiKey({ name: '', key: '' })}>
                                <PlusCircle className="mr-2 h-4 w-4" /> Add Key
                            </Button>
                            <FormField control={form.control} name="activeGeminiKeyName" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Active Gemini Key</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select an active key" />
                                        </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                        {watchedGeminiKeys?.filter(key => key.name && key.key).map(key => (
                                            <SelectItem key={key.name} value={key.name}>{key.name}</SelectItem>
                                        ))}
                                        </SelectContent>
                                    </Select>
                                    <FormDescription>Select the key to use for all AI features. Changes will apply site-wide after saving.</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                            {watchedGeminiKeys && watchedGeminiKeys.length > 0 && (
                                <div className="text-sm p-3 bg-muted/50 rounded-lg mt-2">
                                    Currently using: <span className="font-semibold text-primary">{currentGeminiKey || 'None selected'}</span>
                                </div>
                            )}
                            </div>
                        </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">Advertising & Analytics</h3>
                        <div className="space-y-4 rounded-lg border p-4">
                            <FormField control={form.control} name="ezoicKey" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Ezoic Key</FormLabel>
                                <FormControl><Input placeholder="Enter your Ezoic key" {...field} /></FormControl>
                                <FormDescription>Your Ezoic integration key.</FormDescription>
                                <FormMessage />
                            </FormItem>
                            )}/>
                            <FormField control={form.control} name="adsenseKey" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Google AdSense Publisher ID</FormLabel>
                                <FormControl><Input placeholder="ca-pub-xxxxxxxxxxxxxxxx" {...field} /></FormControl>
                                <FormDescription>Your Google AdSense client ID.</FormDescription>
                                <FormMessage />
                            </FormItem>
                            )}/>
                            <FormField control={form.control} name="adSlotId" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Google AdSense Ad Slot ID</FormLabel>
                                <FormControl><Input placeholder="Enter your Ad Slot ID" {...field} /></FormControl>
                                <FormDescription>The ID of the specific ad unit to display (e.g., 1234567890).</FormDescription>
                                <FormMessage />
                            </FormItem>
                            )}/>
                            <FormField control={form.control} name="gaMeasurementId" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Google Analytics Measurement ID</FormLabel>
                                <FormControl><Input placeholder="G-XXXXXXXXXX" {...field} /></FormControl>
                                <FormDescription>Your GA4 Measurement ID for tracking page views.</FormDescription>
                                <FormMessage />
                            </FormItem>
                            )}/>
                        </div>
                    </div>
                    <Button type="submit" disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Settings
                    </Button>
                    </form>
                </Form>
                </CardContent>
            </Card>
      
            <Card>
                <CardHeader>
                <CardTitle className="flex items-center">
                    <BarChart3 className="mr-2 h-5 w-5" />
                    API Usage Metrics
                </CardTitle>
                <CardDescription>
                    Daily and monthly API call counts per named key. Counts are updated in real-time.
                </CardDescription>
                </CardHeader>
                <CardContent>
                {apiUsage === null ? (
                    <div className="flex items-center justify-center h-24">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : apiUsage.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No API usage data available. Configure and use keys to see metrics here.</p>
                ) : (
                    <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>API Service / Key Name</TableHead>
                        <TableHead className="text-right">Today's Calls</TableHead>
                        <TableHead className="text-right">This Month's Calls</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {apiUsage.map((service) => (
                        <React.Fragment key={service.name}>
                            <TableRow className="bg-muted/50">
                                <TableCell className="font-semibold">{service.name}</TableCell>
                                <TableCell className="text-right font-semibold">{service.totalToday.toLocaleString()}</TableCell>
                                <TableCell className="text-right font-semibold">{service.totalMonth.toLocaleString()}</TableCell>
                            </TableRow>
                            {service.keys.map((key) => (
                                <TableRow key={key.name}>
                                    <TableCell className="pl-8">{key.name}</TableCell>
                                    <TableCell className="text-right">{key.today.toLocaleString()}</TableCell>
                                    <TableCell className="text-right">{key.month.toLocaleString()}</TableCell>
                                </TableRow>
                            ))}
                        </React.Fragment>
                        ))}
                    </TableBody>
                    </Table>
                )}
                </CardContent>
            </Card>

            <div>
                <h2 className="text-2xl font-headline font-bold mb-4">Website Analytics</h2>
                <CardDescription className="mb-4 -mt-2">
                    Currently displaying placeholder data. Connect Google Analytics above to begin tracking live metrics.
                </CardDescription>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Visits</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                    <div className="text-2xl font-bold">{kpiData.totalVisits}</div>
                    <p className="text-xs text-muted-foreground">+20.1% from last month</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Page Views</CardTitle>
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                    <div className="text-2xl font-bold">{kpiData.pageViews}</div>
                    <p className="text-xs text-muted-foreground">+180.1% from last month</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Unique Visitors</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                    <div className="text-2xl font-bold">{kpiData.uniqueVisitors}</div>
                    <p className="text-xs text-muted-foreground">+19% from last month</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Bounce Rate</CardTitle>
                    <CircleAlert className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                    <div className="text-2xl font-bold">{kpiData.bounceRate}</div>
                    <p className="text-xs text-muted-foreground">-2.5% from last month</p>
                    </CardContent>
                </Card>
                </div>
                <div className="grid gap-4 mt-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="lg:col-span-4">
                    <CardHeader>
                    <CardTitle>Traffic by Country</CardTitle>
                    <CardDescription>Your top traffic sources by country for the last 30 days.</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                    <ChartContainer config={trafficChartConfig} className="min-h-[300px] w-full">
                        <BarChart accessibilityLayer data={trafficData}>
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="country"
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                        />
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent indicator="dot" />}
                        />
                        <Bar dataKey="visitors" fill="var(--color-visitors)" radius={4} />
                        </BarChart>
                    </ChartContainer>
                    </CardContent>
                </Card>
                <Card className="lg:col-span-3">
                    <CardHeader>
                    <CardTitle>Top Articles</CardTitle>
                    <CardDescription>Your most viewed articles in the last 30 days.</CardDescription>
                    </CardHeader>
                    <CardContent>
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>Article</TableHead>
                            <TableHead className="text-right">Views</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {topArticles.map((article) => (
                            <TableRow key={article.title}>
                            <TableCell className="font-medium truncate max-w-xs">{article.title}</TableCell>
                            <TableCell className="text-right">{article.views}</TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                    </CardContent>
                </Card>
                </div>
            </div>
        </TabsContent>
        <TabsContent value="messages" className="mt-6">
          <MessagesTab messages={messages} loading={messagesLoading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}


function LoginForm() {
  const { toast } = useToast();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    if (!auth) return;
    setIsLoggingIn(true);
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      toast({
        title: 'Login Successful',
        description: 'Welcome to the admin panel.',
      });
    } catch (error: any) {
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
            toast({
                variant: 'destructive',
                title: 'Login Failed',
                description: 'Invalid email or password. Ensure the admin user exists in Firebase.',
            });
        } else {
             toast({
                variant: 'destructive',
                title: 'Login Error',
                description: 'An unexpected error occurred. Please try again.',
            });
            console.error("Firebase login error:", error);
        }
    } finally {
      setIsLoggingIn(false);
    }
  }

  return (
     <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Admin Login</CardTitle>
          <CardDescription className="pt-1">Enter your credentials to access the admin panel.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="admin@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoggingIn}>
                {isLoggingIn && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Login
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
  );
}


export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  if (!auth || !db) {
    return (
      <div className="container py-10">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><CircleAlert className="text-destructive"/> Admin Panel Unavailable</CardTitle>
              <CardDescription>Firebase has not been configured correctly.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm">
                <p>The admin panel requires a connection to Firebase to manage settings and authentication.</p>
                <p>Please ensure that all <code className="bg-muted px-1 py-0.5 rounded-sm">NEXT_PUBLIC_FIREBASE_*</code> environment variables are set correctly in your <code className="bg-muted px-1 py-0.5 rounded-sm">.env</code> file.</p>
                <p>Once configured, please restart the application server.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = useCallback(async () => {
    if (!auth) return;
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Logout failed:", error);
    }
  }, []);
  
  if (loading) {
    return (
        <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <div className="container py-10">
      <div className="max-w-7xl mx-auto">
          {user ? (
            <AdminPanel onLogout={handleLogout} />
          ) : (
            <LoginForm />
          )}
      </div>
    </div>
  );
}
