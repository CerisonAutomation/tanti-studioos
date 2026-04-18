'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  User,
  Palette,
  Bell,
  Plug,
  Bot,
  Shield,
  Upload,
  Clock,
  Mail,
  Phone,
  MessageSquare,
  Send,
  Monitor,
  Calendar,
  Type,
  CheckCircle2,
  Database,
  Download,
  Trash2,
  Moon,
  Eye,
  EyeOff,
  Lock,
  AlertTriangle,
  Sparkles,
  Image as ImageIcon,
  Globe,
  Zap,
  MessageCircle,
  Hash,
  RefreshCw,
  HardDrive,
  Timer,
  FileText,
  Key,
  Link,
  ExternalLink,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const tabContentVariants = {
  hidden: { opacity: 0, x: 10 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.25, ease: 'easeOut' } },
  exit: { opacity: 0, x: -10, transition: { duration: 0.15 } },
};

function ColorPicker({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 h-10 rounded-lg cursor-pointer border-2 border-border/40 bg-transparent"
        />
      </div>
      <div className="flex-1">
        <Label className="text-sm font-medium">{label}</Label>
        <div className="flex items-center gap-2 mt-1">
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-28 h-8 text-xs font-mono bg-brand-surface-light/50 border-border/30"
          />
          <span className="text-xs text-muted-foreground">{value}</span>
        </div>
      </div>
    </div>
  );
}

type IntegrationStatus = 'available' | 'coming_soon' | 'connected';

interface IntegrationItem {
  id: string;
  icon: React.ReactNode;
  name: string;
  description: string;
  status: IntegrationStatus;
}

function IntegrationCard({ integration, onToggle }: { integration: IntegrationItem; onToggle: () => void }) {
  const isConnected = integration.status === 'connected';
  const isAvailable = integration.status === 'available';
  const isComingSoon = integration.status === 'coming_soon';

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      className={`relative p-4 rounded-xl border transition-all ${
        isConnected
          ? 'bg-brand-cyan/5 border-brand-cyan/30 glow-cyan'
          : 'bg-brand-surface-light/30 border-border/20 hover:border-border/40'
      }`}
    >
      {isConnected && (
        <div className="absolute top-3 right-3">
          <span className="h-2.5 w-2.5 rounded-full bg-brand-cyan pulse-cyan block" />
        </div>
      )}
      <div className="flex items-start gap-3 mb-3">
        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
          isConnected ? 'bg-brand-cyan/15' : 'bg-brand-surface-lighter'
        }`}>
          {integration.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{integration.name}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{integration.description}</p>
        </div>
      </div>
      <div className="flex items-center justify-between mt-2">
        <Badge
          className={`text-[10px] ${
            isConnected
              ? 'bg-brand-cyan/20 text-brand-cyan border-brand-cyan/30'
              : isAvailable
                ? 'bg-brand-gold/20 text-brand-gold border-brand-gold/30'
                : 'bg-muted/50 text-muted-foreground border-border/30'
          }`}
        >
          {isConnected ? 'Connected' : isAvailable ? 'Available' : 'Coming Soon'}
        </Badge>
        <Button
          variant={isConnected ? 'ghost' : 'default'}
          size="sm"
          onClick={onToggle}
          disabled={isComingSoon}
          className={
            isComingSoon
              ? 'opacity-40 cursor-not-allowed'
              : isConnected
                ? 'text-muted-foreground'
                : 'bg-brand-indigo hover:bg-brand-indigo-light text-white'
          }
        >
          {isConnected ? 'Disconnect' : 'Connect'}
        </Button>
      </div>
    </motion.div>
  );
}

export default function SettingsModule() {
  // Profile state
  const [userName, setUserName] = useState('Maria Tanti');
  const [userEmail, setUserEmail] = useState('maria@tanti-interiors.com');
  const [userPhone, setUserPhone] = useState('+356 7912 3456');
  const [userRole, setUserRole] = useState('admin');
  const [studioSignature, setStudioSignature] = useState(
    'Best regards,\nMaria Tanti\nFounder & Lead Designer\nTanti Interiors | Valletta, Malta\n+356 2123 4567 | tanti-interiors.com'
  );

  // Studio Branding state
  const [studioName, setStudioName] = useState('Tanti Interiors');
  const [studioTagline, setStudioTagline] = useState('Luxury Interior Design Studio');
  const [primaryColor, setPrimaryColor] = useState('#3A0CA3');
  const [accentColor, setAccentColor] = useState('#00F5D4');
  const [goldColor, setGoldColor] = useState('#D4AF37');
  const [invoiceFooter, setInvoiceFooter] = useState('Tanti Interiors | VAT: MT12345678 | IBAN: MT84MALT011000012345MTLCAST001S');
  const [currency, setCurrency] = useState('EUR');
  const [taxRate, setTaxRate] = useState('18');

  // Notifications state
  const [notifyNewMessage, setNotifyNewMessage] = useState(true);
  const [notifyWhatsApp, setNotifyWhatsApp] = useState(false);
  const [notifyDeadline1d, setNotifyDeadline1d] = useState(true);
  const [notifyDeadline3d, setNotifyDeadline3d] = useState(true);
  const [notifyDeadline1w, setNotifyDeadline1w] = useState(false);
  const [notifyQuoteAccepted, setNotifyQuoteAccepted] = useState(true);
  const [notifyWeeklyDigest, setNotifyWeeklyDigest] = useState(true);
  const [notifyAiSuggestions, setNotifyAiSuggestions] = useState(true);
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(false);
  const [quietHoursFrom, setQuietHoursFrom] = useState('22:00');
  const [quietHoursTo, setQuietHoursTo] = useState('08:00');

  // Integrations state
  const [integrations, setIntegrations] = useState<IntegrationItem[]>([
    {
      id: 'whatsapp',
      icon: <MessageCircle className="h-5 w-5 text-green-400" />,
      name: 'WhatsApp Business API',
      description: 'Connect your WhatsApp Business account for client messaging and automated responses',
      status: 'coming_soon',
    },
    {
      id: 'telegram',
      icon: <Send className="h-5 w-5 text-blue-400" />,
      name: 'Telegram Bot',
      description: 'Set up a Telegram bot for notifications and client support',
      status: 'coming_soon',
    },
    {
      id: 'supabase',
      icon: <Database className="h-5 w-5 text-emerald-400" />,
      name: 'Supabase Auth',
      description: 'Enterprise-grade authentication with social login and row-level security',
      status: 'coming_soon',
    },
    {
      id: 'apple-mcp',
      icon: <Zap className="h-5 w-5 text-gray-300" />,
      name: 'Apple MCP',
      description: 'Model Context Protocol for seamless Apple ecosystem integration',
      status: 'coming_soon',
    },
    {
      id: 'langgraph',
      icon: <Bot className="h-5 w-5 text-violet-400" />,
      name: 'LangGraph Agents',
      description: 'Advanced multi-agent orchestration for complex design workflows',
      status: 'coming_soon',
    },
    {
      id: 'google-calendar',
      icon: <Calendar className="h-5 w-5 text-brand-cyan" />,
      name: 'Google Calendar',
      description: 'Sync project deadlines, client meetings, and studio events',
      status: 'connected',
    },
    {
      id: 'slack',
      icon: <Hash className="h-5 w-5 text-purple-400" />,
      name: 'Slack Notifications',
      description: 'Push project updates and alerts to your Slack workspace channels',
      status: 'coming_soon',
    },
  ]);

  // Data & Privacy state
  const [privacyAnalytics, setPrivacyAnalytics] = useState(true);
  const [privacyCrashReports, setPrivacyCrashReports] = useState(true);
  const [privacyAiTraining, setPrivacyAiTraining] = useState(false);
  const [dbSize] = useState('24.7 MB');
  const [dbLastBackup] = useState('2026-03-03 02:00 AM');

  // AI Settings state
  const [aiPersonality, setAiPersonality] = useState('professional');
  const [aiDefaultConversation, setAiDefaultConversation] = useState('design');
  const [aiImageQuality, setAiImageQuality] = useState('standard');
  const [aiAutoSuggest, setAiAutoSuggest] = useState(true);
  const [aiResponseLanguage, setAiResponseLanguage] = useState('english');

  // API Keys state
  const [googleGenAIKey, setGoogleGenAIKey] = useState('');
  const [showGoogleGenAIKey, setShowGoogleGenAIKey] = useState(false);
  const [openrouterKey, setOpenrouterKey] = useState('');
  const [showOpenrouterKey, setShowOpenrouterKey] = useState(false);

  const handleToggleIntegration = (id: string) => {
    setIntegrations((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        if (item.status === 'coming_soon') return item;
        return {
          ...item,
          status: item.status === 'connected' ? 'available' : 'connected',
        };
      })
    );
    const integration = integrations.find((i) => i.id === id);
    if (integration?.status === 'connected') {
      toast.info(`${integration.name} disconnected`);
    } else if (integration?.status === 'available') {
      toast.success(`${integration.name} connected successfully`);
    }
  };

  const handleSave = (section: string) => {
    toast.success(`${section} settings saved`, {
      description: 'Your changes have been applied successfully.',
    });
  };

  const handleExportData = () => {
    toast.success('Data export started', {
      description: 'Your CSV file will be ready for download shortly.',
    });
  };

  const handleClearCache = () => {
    toast.success('Cache cleared', {
      description: 'All cached data has been removed.',
    });
  };

  const getRoleBadge = () => {
    switch (userRole) {
      case 'admin':
        return <Badge className="bg-brand-indigo/20 text-brand-indigo-light border-brand-indigo/30 text-[10px]">Admin</Badge>;
      case 'designer':
        return <Badge className="bg-brand-cyan/20 text-brand-cyan border-brand-cyan/30 text-[10px]">Designer</Badge>;
      case 'manager':
        return <Badge className="bg-brand-gold/20 text-brand-gold border-brand-gold/30 text-[10px]">Manager</Badge>;
      default:
        return null;
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="p-6 space-y-6"
    >
      <motion.div variants={itemVariants}>
        <h2 className="text-2xl font-bold font-['Space_Grotesk']">Settings</h2>
        <p className="text-muted-foreground mt-1 text-sm">Manage your studio configuration, branding, and integrations</p>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="bg-brand-surface-light/50 border border-border/20 flex flex-wrap h-auto p-1 gap-1">
            <TabsTrigger value="profile" className="gap-1.5 text-xs data-[state=active]:bg-brand-indigo/20 data-[state=active]:text-brand-cyan">
              <User className="h-3.5 w-3.5" /> Profile
            </TabsTrigger>
            <TabsTrigger value="branding" className="gap-1.5 text-xs data-[state=active]:bg-brand-indigo/20 data-[state=active]:text-brand-cyan">
              <Palette className="h-3.5 w-3.5" /> Branding
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-1.5 text-xs data-[state=active]:bg-brand-indigo/20 data-[state=active]:text-brand-cyan">
              <Bell className="h-3.5 w-3.5" /> Notifications
            </TabsTrigger>
            <TabsTrigger value="integrations" className="gap-1.5 text-xs data-[state=active]:bg-brand-indigo/20 data-[state=active]:text-brand-cyan">
              <Plug className="h-3.5 w-3.5" /> Integrations
            </TabsTrigger>
            <TabsTrigger value="data" className="gap-1.5 text-xs data-[state=active]:bg-brand-indigo/20 data-[state=active]:text-brand-cyan">
              <Shield className="h-3.5 w-3.5" /> Data & Privacy
            </TabsTrigger>
            <TabsTrigger value="ai" className="gap-1.5 text-xs data-[state=active]:bg-brand-indigo/20 data-[state=active]:text-brand-cyan">
              <Bot className="h-3.5 w-3.5" /> AI Settings
            </TabsTrigger>
          </TabsList>

          {/* ===================== PROFILE TAB ===================== */}
          <TabsContent value="profile" className="mt-6">
            <AnimatePresence mode="wait">
              <motion.div
                key="profile-content"
                variants={tabContentVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="grid grid-cols-1 lg:grid-cols-3 gap-6"
              >
                <div className="lg:col-span-2 space-y-6">
                  <Card className="glass-card border-border/20">
                    <CardHeader>
                      <CardTitle className="text-base font-['Space_Grotesk'] flex items-center gap-2">
                        <User className="h-4 w-4 text-brand-cyan" /> Personal Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm">Full Name</Label>
                          <Input
                            value={userName}
                            onChange={(e) => setUserName(e.target.value)}
                            className="bg-brand-surface-light/50 border-border/30"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm flex items-center gap-1.5">
                            <Mail className="h-3 w-3" /> Email
                          </Label>
                          <Input
                            value={userEmail}
                            onChange={(e) => setUserEmail(e.target.value)}
                            type="email"
                            className="bg-brand-surface-light/50 border-border/30"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm flex items-center gap-1.5">
                            <Phone className="h-3 w-3" /> Phone
                          </Label>
                          <Input
                            value={userPhone}
                            onChange={(e) => setUserPhone(e.target.value)}
                            className="bg-brand-surface-light/50 border-border/30"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">Role</Label>
                          <Select value={userRole} onValueChange={setUserRole}>
                            <SelectTrigger className="w-full bg-brand-surface-light/50 border-border/30">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-popover border-border/30">
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="designer">Designer</SelectItem>
                              <SelectItem value="manager">Manager</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <Separator className="bg-border/20" />

                      <div className="space-y-2">
                        <Label className="text-sm flex items-center gap-1.5">
                          <FileText className="h-3 w-3" /> Studio Signature
                        </Label>
                        <Textarea
                          value={studioSignature}
                          onChange={(e) => setStudioSignature(e.target.value)}
                          rows={4}
                          className="bg-brand-surface-light/50 border-border/30 resize-none text-sm"
                          placeholder="Your email signature for client communications..."
                        />
                        <p className="text-xs text-muted-foreground">This signature will be appended to all outgoing emails and quotes</p>
                      </div>

                      <div className="flex justify-end pt-2">
                        <Button
                          onClick={() => handleSave('Profile')}
                          className="bg-gradient-to-r from-brand-indigo to-brand-indigo-light hover:from-brand-indigo-light hover:to-brand-indigo text-white"
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" /> Save Profile
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-6">
                  {/* Avatar Card */}
                  <Card className="glass-card border-border/20">
                    <CardHeader>
                      <CardTitle className="text-base font-['Space_Grotesk']">Avatar</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col items-center gap-4">
                        <div className="relative">
                          <div className="h-24 w-24 rounded-full p-[3px] bg-gradient-to-br from-brand-indigo via-brand-cyan to-brand-gold">
                            <Avatar className="h-full w-full rounded-full border-2 border-background">
                              <AvatarFallback className="bg-brand-indigo text-white text-xl font-bold font-['Space_Grotesk']">
                                {userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                          <button className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-brand-indigo hover:bg-brand-indigo-light text-white flex items-center justify-center shadow-lg transition-colors">
                            <Upload className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full border-border/30 hover:border-brand-cyan/50"
                        >
                          <Upload className="h-3.5 w-3.5 mr-2" /> Change Avatar
                        </Button>
                        <p className="text-xs text-muted-foreground text-center">
                          PNG, JPG or GIF (max 2MB)
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Role & Quick Stats Card */}
                  <Card className="glass-card border-border/20">
                    <CardHeader>
                      <CardTitle className="text-base font-['Space_Grotesk'] flex items-center gap-2">
                        <Clock className="h-4 w-4 text-brand-gold" /> Account
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between text-sm items-center">
                        <span className="text-muted-foreground">Role</span>
                        {getRoleBadge()}
                      </div>
                      <Separator className="bg-border/20" />
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Active Since</span>
                        <span className="font-medium">2020</span>
                      </div>
                      <Separator className="bg-border/20" />
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Plan</span>
                        <Badge className="bg-brand-gold/20 text-brand-gold border-brand-gold/30 text-[10px]">Premium</Badge>
                      </div>
                      <Separator className="bg-border/20" />
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Team Members</span>
                        <span className="font-medium">3</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            </AnimatePresence>
          </TabsContent>

          {/* ===================== STUDIO BRANDING TAB ===================== */}
          <TabsContent value="branding" className="mt-6">
            <AnimatePresence mode="wait">
              <motion.div
                key="branding-content"
                variants={tabContentVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="grid grid-cols-1 lg:grid-cols-3 gap-6"
              >
                <div className="lg:col-span-2 space-y-6">
                  {/* Studio Identity */}
                  <Card className="glass-card border-border/20">
                    <CardHeader>
                      <CardTitle className="text-base font-['Space_Grotesk'] flex items-center gap-2">
                        <Palette className="h-4 w-4 text-brand-cyan" /> Studio Identity
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm">Studio Name</Label>
                          <Input
                            value={studioName}
                            onChange={(e) => setStudioName(e.target.value)}
                            className="bg-brand-surface-light/50 border-border/30"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">Studio Tagline</Label>
                          <Input
                            value={studioTagline}
                            onChange={(e) => setStudioTagline(e.target.value)}
                            className="bg-brand-surface-light/50 border-border/30"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Brand Colors */}
                  <Card className="glass-card border-border/20">
                    <CardHeader>
                      <CardTitle className="text-base font-['Space_Grotesk'] flex items-center gap-2">
                        <Palette className="h-4 w-4 text-brand-cyan" /> Brand Colors
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <ColorPicker label="Primary Color" value={primaryColor} onChange={setPrimaryColor} />
                      <Separator className="bg-border/20" />
                      <ColorPicker label="Accent Color" value={accentColor} onChange={setAccentColor} />
                      <Separator className="bg-border/20" />
                      <ColorPicker label="Gold Color" value={goldColor} onChange={setGoldColor} />
                    </CardContent>
                  </Card>

                  {/* Invoice & Billing */}
                  <Card className="glass-card border-border/20">
                    <CardHeader>
                      <CardTitle className="text-base font-['Space_Grotesk'] flex items-center gap-2">
                        <FileText className="h-4 w-4 text-brand-gold" /> Invoice & Billing
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm">Currency</Label>
                          <Select value={currency} onValueChange={setCurrency}>
                            <SelectTrigger className="w-full bg-brand-surface-light/50 border-border/30">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-popover border-border/30">
                              <SelectItem value="EUR">EUR (&euro;)</SelectItem>
                              <SelectItem value="GBP">GBP (&pound;)</SelectItem>
                              <SelectItem value="USD">USD ($)</SelectItem>
                              <SelectItem value="CHF">CHF (Fr)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">Tax Rate (%)</Label>
                          <Input
                            type="number"
                            value={taxRate}
                            onChange={(e) => setTaxRate(e.target.value)}
                            className="bg-brand-surface-light/50 border-border/30"
                            placeholder="18"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">Invoice Footer Text</Label>
                        <Textarea
                          value={invoiceFooter}
                          onChange={(e) => setInvoiceFooter(e.target.value)}
                          rows={2}
                          className="bg-brand-surface-light/50 border-border/30 resize-none text-sm"
                        />
                        <p className="text-xs text-muted-foreground">Appears at the bottom of all generated invoices and quotes</p>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex justify-end">
                    <Button
                      onClick={() => handleSave('Branding')}
                      className="bg-gradient-to-r from-brand-indigo to-brand-indigo-light hover:from-brand-indigo-light hover:to-brand-indigo text-white"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" /> Save Branding
                    </Button>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Logo Upload */}
                  <Card className="glass-card border-border/20">
                    <CardHeader>
                      <CardTitle className="text-base font-['Space_Grotesk'] flex items-center gap-2">
                        <ImageIcon className="h-4 w-4 text-brand-gold" /> Studio Logo
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col items-center gap-4">
                        <div className="h-24 w-24 rounded-xl bg-gradient-to-br from-brand-indigo to-brand-indigo-light flex items-center justify-center glow-indigo">
                          <span className="text-white font-bold font-['Space_Grotesk'] text-2xl tracking-tight">TI</span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full border-border/30 hover:border-brand-cyan/50"
                        >
                          <Upload className="h-3.5 w-3.5 mr-2" /> Upload Logo
                        </Button>
                        <p className="text-xs text-muted-foreground text-center">
                          PNG, SVG or JPG (max 2MB)
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Brand Preview */}
                  <Card className="glass-card border-border/20">
                    <CardHeader>
                      <CardTitle className="text-base font-['Space_Grotesk']">Brand Preview</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="p-4 rounded-xl border border-border/20" style={{ backgroundColor: `${primaryColor}15` }}>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: primaryColor }}>
                            <span className="text-white font-bold text-xs">TI</span>
                          </div>
                          <div>
                            <span className="font-bold text-sm block">{studioName}</span>
                            <span className="text-[10px] text-muted-foreground">{studioTagline}</span>
                          </div>
                        </div>
                        <div className="space-y-1.5 mt-3">
                          <div className="h-2 rounded-full w-3/4" style={{ backgroundColor: accentColor }} />
                          <div className="h-2 rounded-full w-1/2" style={{ backgroundColor: goldColor }} />
                          <div className="h-2 rounded-full w-2/3" style={{ backgroundColor: primaryColor, opacity: 0.5 }} />
                        </div>
                        <div className="mt-3 pt-2 border-t border-border/20">
                          <p className="text-[9px] text-muted-foreground">{invoiceFooter}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Typography Preview */}
                  <Card className="glass-card border-border/20">
                    <CardHeader>
                      <CardTitle className="text-base font-['Space_Grotesk'] flex items-center gap-2">
                        <Type className="h-4 w-4 text-brand-cyan" /> Typography
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="p-4 rounded-xl bg-brand-surface-light/30 border border-border/20">
                        <p className="text-xl font-bold font-['Space_Grotesk']">
                          {studioName}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1 font-['Space_Grotesk']">
                          {studioTagline}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            </AnimatePresence>
          </TabsContent>

          {/* ===================== NOTIFICATIONS TAB ===================== */}
          <TabsContent value="notifications" className="mt-6">
            <AnimatePresence mode="wait">
              <motion.div
                key="notifications-content"
                variants={tabContentVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="grid grid-cols-1 lg:grid-cols-2 gap-6"
              >
                {/* Email & Message Notifications */}
                <Card className="glass-card border-border/20">
                  <CardHeader>
                    <CardTitle className="text-base font-['Space_Grotesk'] flex items-center gap-2">
                      <Mail className="h-4 w-4 text-brand-cyan" /> Email & Messages
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      { label: 'New Messages', desc: 'Get notified when a client sends a message', checked: notifyNewMessage, onChange: setNotifyNewMessage, icon: <MessageSquare className="h-4 w-4" /> },
                      { label: 'WhatsApp Alerts', desc: 'Integration alerts for WhatsApp Business', checked: notifyWhatsApp, onChange: setNotifyWhatsApp, icon: <MessageCircle className="h-4 w-4" /> },
                      { label: 'Quote Acceptance', desc: 'Notify when a client accepts a quote', checked: notifyQuoteAccepted, onChange: setNotifyQuoteAccepted, icon: <CheckCircle2 className="h-4 w-4" /> },
                      { label: 'Weekly Digest', desc: 'Summary email with weekly studio activity', checked: notifyWeeklyDigest, onChange: setNotifyWeeklyDigest, icon: <Mail className="h-4 w-4" /> },
                      { label: 'AI Assistant Suggestions', desc: 'Receive AI-generated insights and recommendations', checked: notifyAiSuggestions, onChange: setNotifyAiSuggestions, icon: <Sparkles className="h-4 w-4" /> },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between p-3 rounded-xl bg-brand-surface-light/30 border border-border/20">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-brand-surface-lighter flex items-center justify-center text-muted-foreground">
                            {item.icon}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{item.label}</p>
                            <p className="text-xs text-muted-foreground">{item.desc}</p>
                          </div>
                        </div>
                        <Switch checked={item.checked} onCheckedChange={item.onChange} />
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Deadline Reminders */}
                <div className="space-y-6">
                  <Card className="glass-card border-border/20">
                    <CardHeader>
                      <CardTitle className="text-base font-['Space_Grotesk'] flex items-center gap-2">
                        <Timer className="h-4 w-4 text-brand-gold" /> Project Deadline Reminders
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {[
                        { label: '1 Day Before', desc: 'Urgent reminder the day before a deadline', checked: notifyDeadline1d, onChange: setNotifyDeadline1d, icon: <AlertTriangle className="h-4 w-4 text-red-400" /> },
                        { label: '3 Days Before', desc: 'Early warning three days before', checked: notifyDeadline3d, onChange: setNotifyDeadline3d, icon: <Clock className="h-4 w-4 text-yellow-400" /> },
                        { label: '1 Week Before', desc: 'Advance notice a week before the deadline', checked: notifyDeadline1w, onChange: setNotifyDeadline1w, icon: <Calendar className="h-4 w-4 text-brand-cyan" /> },
                      ].map((item) => (
                        <div key={item.label} className="flex items-center justify-between p-3 rounded-xl bg-brand-surface-light/30 border border-border/20">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-brand-surface-lighter flex items-center justify-center text-muted-foreground">
                              {item.icon}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{item.label}</p>
                              <p className="text-xs text-muted-foreground">{item.desc}</p>
                            </div>
                          </div>
                          <Switch checked={item.checked} onCheckedChange={item.onChange} />
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Quiet Hours */}
                  <Card className="glass-card border-border/20">
                    <CardHeader>
                      <CardTitle className="text-base font-['Space_Grotesk'] flex items-center gap-2">
                        <Moon className="h-4 w-4 text-brand-indigo-light" /> Quiet Hours
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between p-3 rounded-xl bg-brand-surface-light/30 border border-border/20">
                        <div>
                          <p className="text-sm font-medium">Enable Quiet Hours</p>
                          <p className="text-xs text-muted-foreground">Silence notifications during specified hours</p>
                        </div>
                        <Switch checked={quietHoursEnabled} onCheckedChange={setQuietHoursEnabled} />
                      </div>
                      {quietHoursEnabled && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-4"
                        >
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-sm">From</Label>
                              <Input
                                type="time"
                                value={quietHoursFrom}
                                onChange={(e) => setQuietHoursFrom(e.target.value)}
                                className="bg-brand-surface-light/50 border-border/30"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm">To</Label>
                              <Input
                                type="time"
                                value={quietHoursTo}
                                onChange={(e) => setQuietHoursTo(e.target.value)}
                                className="bg-brand-surface-light/50 border-border/30"
                              />
                            </div>
                          </div>
                          <div className="flex items-center gap-2 p-3 rounded-xl bg-brand-indigo/10 border border-brand-indigo/20">
                            <Moon className="h-4 w-4 text-brand-indigo-light" />
                            <p className="text-xs text-muted-foreground">
                              Notifications will be silenced from <span className="text-brand-indigo-light font-medium">{quietHoursFrom}</span> to <span className="text-brand-indigo-light font-medium">{quietHoursTo}</span>
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </CardContent>
                  </Card>

                  <div className="flex justify-end">
                    <Button
                      onClick={() => handleSave('Notifications')}
                      className="bg-gradient-to-r from-brand-indigo to-brand-indigo-light hover:from-brand-indigo-light hover:to-brand-indigo text-white"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" /> Save Notifications
                    </Button>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </TabsContent>

          {/* ===================== INTEGRATIONS TAB ===================== */}
          <TabsContent value="integrations" className="mt-6">
            <AnimatePresence mode="wait">
              <motion.div
                key="integrations-content"
                variants={tabContentVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="space-y-6"
              >
                {/* Connected Integrations */}
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-brand-cyan pulse-cyan" />
                    Connected
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {integrations.filter(i => i.status === 'connected').map((integration) => (
                      <IntegrationCard
                        key={integration.id}
                        integration={integration}
                        onToggle={() => handleToggleIntegration(integration.id)}
                      />
                    ))}
                    {integrations.filter(i => i.status === 'connected').length === 0 && (
                      <p className="text-sm text-muted-foreground col-span-full text-center py-8">No connected integrations yet</p>
                    )}
                  </div>
                </div>

                <Separator className="bg-border/20" />

                {/* Available Integrations */}
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                    <Zap className="h-3.5 w-3.5 text-brand-gold" />
                    Available
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {integrations.filter(i => i.status === 'available').map((integration) => (
                      <IntegrationCard
                        key={integration.id}
                        integration={integration}
                        onToggle={() => handleToggleIntegration(integration.id)}
                      />
                    ))}
                    {integrations.filter(i => i.status === 'available').length === 0 && (
                      <p className="text-sm text-muted-foreground col-span-full text-center py-8">No available integrations</p>
                    )}
                  </div>
                </div>

                <Separator className="bg-border/20" />

                {/* Coming Soon */}
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    Coming Soon
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {integrations.filter(i => i.status === 'coming_soon').map((integration) => (
                      <IntegrationCard
                        key={integration.id}
                        integration={integration}
                        onToggle={() => handleToggleIntegration(integration.id)}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </TabsContent>

          {/* ===================== DATA & PRIVACY TAB ===================== */}
          <TabsContent value="data" className="mt-6">
            <AnimatePresence mode="wait">
              <motion.div
                key="data-content"
                variants={tabContentVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="grid grid-cols-1 lg:grid-cols-2 gap-6"
              >
                {/* Data Management */}
                <Card className="glass-card border-border/20">
                  <CardHeader>
                    <CardTitle className="text-base font-['Space_Grotesk'] flex items-center gap-2">
                      <Database className="h-4 w-4 text-brand-cyan" /> Data Management
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-brand-surface-light/30 border border-border/20">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-brand-cyan/10 flex items-center justify-center">
                          <Download className="h-5 w-5 text-brand-cyan" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Export All Data</p>
                          <p className="text-xs text-muted-foreground">Download all studio data as CSV files</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExportData}
                        className="border-brand-cyan/30 hover:border-brand-cyan/60 text-brand-cyan"
                      >
                        <Download className="h-3.5 w-3.5 mr-1.5" /> Export
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl bg-brand-surface-light/30 border border-border/20">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-brand-gold/10 flex items-center justify-center">
                          <RefreshCw className="h-5 w-5 text-brand-gold" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Clear Cache</p>
                          <p className="text-xs text-muted-foreground">Remove cached data and refresh the application</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleClearCache}
                        className="border-brand-gold/30 hover:border-brand-gold/60 text-brand-gold"
                      >
                        <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Clear
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Database Status */}
                <Card className="glass-card border-border/20">
                  <CardHeader>
                    <CardTitle className="text-base font-['Space_Grotesk'] flex items-center gap-2">
                      <HardDrive className="h-4 w-4 text-brand-gold" /> Database Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 rounded-xl bg-brand-surface-light/30 border border-border/20">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="h-10 w-10 rounded-lg bg-brand-indigo/15 flex items-center justify-center">
                          <Database className="h-5 w-5 text-brand-indigo-light" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">SQLite Database</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="h-2 w-2 rounded-full bg-brand-cyan pulse-cyan" />
                            <span className="text-xs text-brand-cyan">Healthy</span>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Engine</span>
                          <span className="font-medium text-xs">SQLite 3</span>
                        </div>
                        <Separator className="bg-border/20" />
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Size</span>
                          <span className="font-medium text-xs">{dbSize}</span>
                        </div>
                        <Separator className="bg-border/20" />
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Last Backup</span>
                          <span className="font-medium text-xs">{dbLastBackup}</span>
                        </div>
                        <Separator className="bg-border/20" />
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Tables</span>
                          <span className="font-medium text-xs">11</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Privacy Settings */}
                <Card className="glass-card border-border/20">
                  <CardHeader>
                    <CardTitle className="text-base font-['Space_Grotesk'] flex items-center gap-2">
                      <Eye className="h-4 w-4 text-brand-cyan" /> Privacy Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      { label: 'Usage Analytics', desc: 'Help improve StudioOS with anonymous usage data', checked: privacyAnalytics, onChange: setPrivacyAnalytics, icon: <Monitor className="h-4 w-4" /> },
                      { label: 'Crash Reports', desc: 'Automatically send error reports for faster fixes', checked: privacyCrashReports, onChange: setPrivacyCrashReports, icon: <AlertTriangle className="h-4 w-4" /> },
                      { label: 'AI Training Data', desc: 'Allow conversation data to improve AI models', checked: privacyAiTraining, onChange: setPrivacyAiTraining, icon: <Bot className="h-4 w-4" /> },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between p-3 rounded-xl bg-brand-surface-light/30 border border-border/20">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-brand-surface-lighter flex items-center justify-center text-muted-foreground">
                            {item.icon}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{item.label}</p>
                            <p className="text-xs text-muted-foreground">{item.desc}</p>
                          </div>
                        </div>
                        <Switch checked={item.checked} onCheckedChange={item.onChange} />
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Danger Zone */}
                <Card className="glass-card border-red-500/20">
                  <CardHeader>
                    <CardTitle className="text-base font-['Space_Grotesk'] flex items-center gap-2 text-red-400">
                      <AlertTriangle className="h-4 w-4" /> Danger Zone
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20">
                      <p className="text-sm font-medium text-red-400">Delete Account</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Permanently delete your account and all associated data. This action cannot be undone.
                      </p>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-3 border-red-500/30 hover:border-red-500/60 text-red-400 hover:bg-red-500/10"
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Delete Account
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="glass-strong border-border/30">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="font-['Space_Grotesk']">Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete your account and remove all of your data from our servers, including clients, projects, quotes, and documents.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction className="bg-red-600 hover:bg-red-700 text-white">
                              Delete Account
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        onClick={() => handleSave('Privacy')}
                        className="bg-gradient-to-r from-brand-indigo to-brand-indigo-light hover:from-brand-indigo-light hover:to-brand-indigo text-white"
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" /> Save Privacy Settings
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>
          </TabsContent>

          {/* ===================== AI SETTINGS TAB ===================== */}
          <TabsContent value="ai" className="mt-6">
            <AnimatePresence mode="wait">
              <motion.div
                key="ai-content"
                variants={tabContentVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="grid grid-cols-1 lg:grid-cols-3 gap-6"
              >
                <div className="lg:col-span-2 space-y-6">
                  {/* AI Personality */}
                  <Card className="glass-card border-border/20">
                    <CardHeader>
                      <CardTitle className="text-base font-['Space_Grotesk'] flex items-center gap-2">
                        <Bot className="h-4 w-4 text-brand-cyan" /> AI Assistant Configuration
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-sm">AI Personality</Label>
                        <Select value={aiPersonality} onValueChange={setAiPersonality}>
                          <SelectTrigger className="w-full bg-brand-surface-light/50 border-border/30">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-border/30">
                            <SelectItem value="professional">
                              <span className="flex items-center gap-2">
                                <Bot className="h-3.5 w-3.5 text-brand-indigo-light" /> Professional
                              </span>
                            </SelectItem>
                            <SelectItem value="creative">
                              <span className="flex items-center gap-2">
                                <Sparkles className="h-3.5 w-3.5 text-brand-cyan" /> Creative
                              </span>
                            </SelectItem>
                            <SelectItem value="concise">
                              <span className="flex items-center gap-2">
                                <Zap className="h-3.5 w-3.5 text-brand-gold" /> Concise
                              </span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          {aiPersonality === 'professional' && 'Formal, detailed responses with industry-specific language'}
                          {aiPersonality === 'creative' && 'Inspiring, descriptive responses with design-focused vocabulary'}
                          {aiPersonality === 'concise' && 'Brief, direct responses that get straight to the point'}
                        </p>
                      </div>

                      <Separator className="bg-border/20" />

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm">Default Conversation Type</Label>
                          <Select value={aiDefaultConversation} onValueChange={setAiDefaultConversation}>
                            <SelectTrigger className="w-full bg-brand-surface-light/50 border-border/30">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-popover border-border/30">
                              <SelectItem value="design">Design Consultation</SelectItem>
                              <SelectItem value="quote">Quote Assistance</SelectItem>
                              <SelectItem value="procurement">Procurement Help</SelectItem>
                              <SelectItem value="general">General Inquiry</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">AI Response Language</Label>
                          <Select value={aiResponseLanguage} onValueChange={setAiResponseLanguage}>
                            <SelectTrigger className="w-full bg-brand-surface-light/50 border-border/30">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-popover border-border/30">
                              <SelectItem value="english">
                                <span className="flex items-center gap-2">🇬🇧 English</span>
                              </SelectItem>
                              <SelectItem value="maltese">
                                <span className="flex items-center gap-2">🇲🇹 Maltese</span>
                              </SelectItem>
                              <SelectItem value="italian">
                                <span className="flex items-center gap-2">🇮🇹 Italian</span>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <Separator className="bg-border/20" />

                      <div className="space-y-2">
                        <Label className="text-sm flex items-center gap-1.5">
                          <ImageIcon className="h-3 w-3" /> Image Generation Quality
                        </Label>
                        <Select value={aiImageQuality} onValueChange={setAiImageQuality}>
                          <SelectTrigger className="w-full bg-brand-surface-light/50 border-border/30">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-border/30">
                            <SelectItem value="standard">Standard (1024×1024)</SelectItem>
                            <SelectItem value="hd">HD (1792×1024)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <Separator className="bg-border/20" />

                      {/* API Keys - Stored securely in DB */}
                      <Card className="glass-card border-border/20">
                        <CardHeader>
                          <CardTitle className="text-base font-['Space_Grotesk'] flex items-center gap-2">
                            <Key className="h-4 w-4 text-brand-gold" /> API Keys
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <p className="text-xs text-muted-foreground">
                            Your API keys are encrypted and stored securely in the database.
                          </p>

                          {/* Google GenAI Key */}
                          <div className="space-y-2">
                            <Label className="text-sm flex items-center gap-1.5">
                              <Link className="h-3 w-3" /> Google Generative AI API Key
                            </Label>
                            <div className="flex gap-2">
                              <div className="relative flex-1">
                                <Input
                                  type={showGoogleGenAIKey ? 'text' : 'password'}
                                  value={googleGenAIKey}
                                  onChange={(e) => setGoogleGenAIKey(e.target.value)}
                                  placeholder="AIza..."
                                  className="bg-brand-surface-light/50 border-border/30 pr-10"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowGoogleGenAIKey(!showGoogleGenAIKey)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                  {showGoogleGenAIKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Get your key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener" className="text-brand-cyan hover:underline inline-flex items-center gap-1">Google AI Studio <ExternalLink className="h-3 w-3" /></a>
                            </p>
                          </div>

                          <Separator className="bg-border/20" />

                          {/* OpenRouter Key */}
                          <div className="space-y-2">
                            <Label className="text-sm flex items-center gap-1.5">
                              <Globe className="h-3 w-3" /> OpenRouter API Key
                            </Label>
                            <div className="flex gap-2">
                              <div className="relative flex-1">
                                <Input
                                  type={showOpenrouterKey ? 'text' : 'password'}
                                  value={openrouterKey}
                                  onChange={(e) => setOpenrouterKey(e.target.value)}
                                  placeholder="sk-or-v1-..."
                                  className="bg-brand-surface-light/50 border-border/30 pr-10"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowOpenrouterKey(!showOpenrouterKey)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                  {showOpenrouterKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Get your key from <a href="https://openrouter.ai/settings" target="_blank" rel="noopener" className="text-brand-cyan hover:underline inline-flex items-center gap-1">OpenRouter <ExternalLink className="h-3 w-3" /></a>
                            </p>
                          </div>

                          <Separator className="bg-border/20" />

                          <div className="flex items-center gap-2 text-xs text-green-500">
                            <Lock className="h-3 w-3" /> Keys are encrypted and stored securely
                          </div>
                        </CardContent>
                      </Card>
                    </CardContent>
                  </Card>

                  <div className="flex justify-end">
                    <Button
                      onClick={() => handleSave('AI')}
                      className="bg-gradient-to-r from-brand-indigo to-brand-indigo-light hover:from-brand-indigo-light hover:to-brand-indigo text-white"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" /> Save AI Settings
                    </Button>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Auto-Suggest Toggle */}
                  <Card className="glass-card border-border/20">
                    <CardHeader>
                      <CardTitle className="text-base font-['Space_Grotesk'] flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-brand-gold" /> Smart Features
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between p-3 rounded-xl bg-brand-surface-light/30 border border-border/20">
                        <div>
                          <p className="text-sm font-medium">Auto-Suggest</p>
                          <p className="text-xs text-muted-foreground">AI suggests responses and actions</p>
                        </div>
                        <Switch checked={aiAutoSuggest} onCheckedChange={setAiAutoSuggest} />
                      </div>
                    </CardContent>
                  </Card>

                  {/* AI Status */}
                  <Card className="glass-card border-border/20">
                    <CardHeader>
                      <CardTitle className="text-base font-['Space_Grotesk']">AI Status</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-brand-cyan pulse-cyan" />
                        <span className="text-sm text-brand-cyan">AI Assistant Active</span>
                      </div>
                      <Separator className="bg-border/20" />
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Model</span>
                        <span className="font-medium text-xs">GPT-4o</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Conversations</span>
                        <span className="font-medium text-xs">142</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Response Time</span>
                        <span className="font-medium text-xs">~1.2s</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Personality</span>
                        <Badge className="bg-brand-indigo/20 text-brand-indigo-light border-brand-indigo/30 text-[10px] capitalize">
                          {aiPersonality}
                        </Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Image Quality</span>
                        <Badge className="bg-brand-gold/20 text-brand-gold border-brand-gold/30 text-[10px] uppercase">
                          {aiImageQuality}
                        </Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Language</span>
                        <Badge className="bg-brand-cyan/20 text-brand-cyan border-brand-cyan/30 text-[10px] capitalize">
                          {aiResponseLanguage}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            </AnimatePresence>
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
}
