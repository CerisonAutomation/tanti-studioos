'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Palette,
  Bell,
  Plug,
  Bot,
  Upload,
  Clock,
  Mail,
  Phone,
  MapPin,
  MessageSquare,
  Send,
  Monitor,
  Calendar,
  Type,
  ImageIcon,
  CheckCircle2,
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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
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

function IntegrationCard({
  icon,
  name,
  description,
  connected,
  onToggle,
}: {
  icon: React.ReactNode;
  name: string;
  description: string;
  connected: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-brand-surface-light/30 border border-border/20 hover:border-border/40 transition-colors">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-brand-surface-lighter flex items-center justify-center text-muted-foreground">
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium">{name}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Badge
          className={`text-[10px] ${
            connected
              ? 'bg-brand-cyan/20 text-brand-cyan border-brand-cyan/30'
              : 'bg-muted text-muted-foreground border-border/30'
          }`}
        >
          {connected ? 'Connected' : 'Not Connected'}
        </Badge>
        <Button
          variant={connected ? 'ghost' : 'default'}
          size="sm"
          onClick={onToggle}
          className={connected ? 'text-muted-foreground' : 'bg-brand-indigo hover:bg-brand-indigo-light text-white'}
        >
          {connected ? 'Disconnect' : 'Connect'}
        </Button>
      </div>
    </div>
  );
}

export default function SettingsModule() {
  // Profile state
  const [studioName, setStudioName] = useState('Tanti Interiors');
  const [email, setEmail] = useState('info@tanti-interiors.com');
  const [phone, setPhone] = useState('+356 2123 4567');
  const [address, setAddress] = useState('Valletta, Malta');
  const [businessHours, setBusinessHours] = useState('Mon-Fri: 9:00 - 18:00, Sat: 10:00 - 14:00');

  // Branding state
  const [primaryColor, setPrimaryColor] = useState('#3A0CA3');
  const [accentColor, setAccentColor] = useState('#00F5D4');
  const [goldColor, setGoldColor] = useState('#D4AF37');
  const [font, setFont] = useState('space-grotesk');
  const [logoPlacement, setLogoPlacement] = useState('top-left');

  // Notifications state
  const [notifyNewMessage, setNotifyNewMessage] = useState(true);
  const [notifyQuoteAccepted, setNotifyQuoteAccepted] = useState(true);
  const [notifyMilestone, setNotifyMilestone] = useState(true);
  const [notifyTaskOverdue, setNotifyTaskOverdue] = useState(true);
  const [notifyWhatsApp, setNotifyWhatsApp] = useState(false);
  const [notifyTelegram, setNotifyTelegram] = useState(false);
  const [notifyDesktop, setNotifyDesktop] = useState(true);

  // Integrations state
  const [whatsappConnected, setWhatsappConnected] = useState(false);
  const [telegramConnected, setTelegramConnected] = useState(false);
  const [appleMailConnected, setAppleMailConnected] = useState(false);
  const [appleNotesConnected, setAppleNotesConnected] = useState(false);
  const [calendarSync, setCalendarSync] = useState(true);

  // AI Config state
  const [aiPersonality, setAiPersonality] = useState(
    'You are the AI assistant for Tanti Interiors, a luxury interior design studio in Malta. You communicate with elegance and professionalism, reflecting the premium nature of our services. You help clients with design inquiries, project updates, and quote requests.'
  );
  const [responseStyle, setResponseStyle] = useState('professional');
  const [autoReply, setAutoReply] = useState(true);
  const [businessHoursAutoReply, setBusinessHoursAutoReply] = useState(true);
  const [fallbackMessage, setFallbackMessage] = useState(
    'Thank you for reaching out to Tanti Interiors. Our team will get back to you shortly during business hours. For urgent matters, please call +356 2123 4567.'
  );

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
            <TabsTrigger value="ai" className="gap-1.5 text-xs data-[state=active]:bg-brand-indigo/20 data-[state=active]:text-brand-cyan">
              <Bot className="h-3.5 w-3.5" /> AI Config
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card className="glass-card border-border/20">
                  <CardHeader>
                    <CardTitle className="text-base font-['Space_Grotesk'] flex items-center gap-2">
                      <User className="h-4 w-4 text-brand-cyan" /> Studio Information
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
                        <Label className="text-sm flex items-center gap-1.5">
                          <Mail className="h-3 w-3" /> Email
                        </Label>
                        <Input
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          type="email"
                          className="bg-brand-surface-light/50 border-border/30"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm flex items-center gap-1.5">
                          <Phone className="h-3 w-3" /> Phone
                        </Label>
                        <Input
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="bg-brand-surface-light/50 border-border/30"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm flex items-center gap-1.5">
                          <MapPin className="h-3 w-3" /> Address
                        </Label>
                        <Input
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          className="bg-brand-surface-light/50 border-border/30"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm flex items-center gap-1.5">
                        <Clock className="h-3 w-3" /> Business Hours
                      </Label>
                      <Input
                        value={businessHours}
                        onChange={(e) => setBusinessHours(e.target.value)}
                        className="bg-brand-surface-light/50 border-border/30"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="glass-card border-border/20">
                  <CardHeader>
                    <CardTitle className="text-base font-['Space_Grotesk']">Studio Logo</CardTitle>
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

                <Card className="glass-card border-border/20">
                  <CardHeader>
                    <CardTitle className="text-base font-['Space_Grotesk'] flex items-center gap-2">
                      <Clock className="h-4 w-4 text-brand-gold" /> Quick Stats
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
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
            </div>
          </TabsContent>

          {/* Branding Tab */}
          <TabsContent value="branding" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
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

                <Card className="glass-card border-border/20">
                  <CardHeader>
                    <CardTitle className="text-base font-['Space_Grotesk'] flex items-center gap-2">
                      <Type className="h-4 w-4 text-brand-cyan" /> Typography
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm">Primary Font</Label>
                      <Select value={font} onValueChange={setFont}>
                        <SelectTrigger className="w-full bg-brand-surface-light/50 border-border/30">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border/30">
                          <SelectItem value="space-grotesk">Space Grotesk</SelectItem>
                          <SelectItem value="inter">Inter</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="p-4 rounded-xl bg-brand-surface-light/30 border border-border/20">
                      <p className="text-xs text-muted-foreground mb-2">Preview</p>
                      <p className={`text-xl font-bold ${font === 'space-grotesk' ? "font-['Space_Grotesk']" : "font-['Inter']"}`}>
                        Tanti Interiors
                      </p>
                      <p className={`text-sm text-muted-foreground mt-1 ${font === 'space-grotesk' ? "font-['Space_Grotesk']" : "font-['Inter']"}`}>
                        Luxury Design Studio
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="glass-card border-border/20">
                  <CardHeader>
                    <CardTitle className="text-base font-['Space_Grotesk'] flex items-center gap-2">
                      <ImageIcon className="h-4 w-4 text-brand-gold" /> Logo Placement
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {[
                      { value: 'top-left', label: 'Top Left' },
                      { value: 'top-center', label: 'Top Center' },
                      { value: 'top-right', label: 'Top Right' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setLogoPlacement(option.value)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
                          logoPlacement === option.value
                            ? 'bg-brand-indigo/15 border-brand-cyan/30 glow-cyan'
                            : 'bg-brand-surface-light/30 border-border/20 hover:border-border/40'
                        }`}
                      >
                        <div className={`h-8 w-16 rounded border border-border/30 flex items-center justify-${
                          option.value === 'top-left' ? 'start' : option.value === 'top-center' ? 'center' : 'end'
                        } p-1`}>
                          <div className="h-5 w-5 rounded bg-brand-indigo flex items-center justify-center">
                            <span className="text-[6px] text-white font-bold">TI</span>
                          </div>
                        </div>
                        <span className="text-sm">{option.label}</span>
                        {logoPlacement === option.value && (
                          <CheckCircle2 className="h-4 w-4 text-brand-cyan ml-auto" />
                        )}
                      </button>
                    ))}
                  </CardContent>
                </Card>

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
                        <span className="font-bold text-sm">Tanti Interiors</span>
                      </div>
                      <div className="space-y-1.5">
                        <div className="h-2 rounded-full w-3/4" style={{ backgroundColor: accentColor }} />
                        <div className="h-2 rounded-full w-1/2" style={{ backgroundColor: goldColor }} />
                        <div className="h-2 rounded-full w-2/3" style={{ backgroundColor: primaryColor, opacity: 0.5 }} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="glass-card border-border/20">
                <CardHeader>
                  <CardTitle className="text-base font-['Space_Grotesk'] flex items-center gap-2">
                    <Mail className="h-4 w-4 text-brand-cyan" /> Email Notifications
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { label: 'New Message', desc: 'Get notified when a client sends a message', checked: notifyNewMessage, onChange: setNotifyNewMessage, icon: <MessageSquare className="h-4 w-4" /> },
                    { label: 'Quote Accepted', desc: 'Notify when a client accepts a quote', checked: notifyQuoteAccepted, onChange: setNotifyQuoteAccepted, icon: <CheckCircle2 className="h-4 w-4" /> },
                    { label: 'Project Milestone', desc: 'Notify on project milestone completion', checked: notifyMilestone, onChange: setNotifyMilestone, icon: <ExternalLink className="h-4 w-4" /> },
                    { label: 'Task Overdue', desc: 'Alert when a task passes its due date', checked: notifyTaskOverdue, onChange: setNotifyTaskOverdue, icon: <Clock className="h-4 w-4" /> },
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

              <Card className="glass-card border-border/20">
                <CardHeader>
                  <CardTitle className="text-base font-['Space_Grotesk'] flex items-center gap-2">
                    <Bell className="h-4 w-4 text-brand-gold" /> Push & Messaging
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { label: 'WhatsApp Notifications', desc: 'Receive notifications via WhatsApp', checked: notifyWhatsApp, onChange: setNotifyWhatsApp, icon: <MessageSquare className="h-4 w-4" /> },
                    { label: 'Telegram Notifications', desc: 'Receive notifications via Telegram bot', checked: notifyTelegram, onChange: setNotifyTelegram, icon: <Send className="h-4 w-4" /> },
                    { label: 'Desktop Notifications', desc: 'Browser push notifications for updates', checked: notifyDesktop, onChange: setNotifyDesktop, icon: <Monitor className="h-4 w-4" /> },
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
            </div>
          </TabsContent>

          {/* Integrations Tab */}
          <TabsContent value="integrations" className="mt-6">
            <div className="space-y-6">
              <Card className="glass-card border-border/20">
                <CardHeader>
                  <CardTitle className="text-base font-['Space_Grotesk'] flex items-center gap-2">
                    <Plug className="h-4 w-4 text-brand-cyan" /> Messaging Integrations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <IntegrationCard
                    icon={<MessageSquare className="h-5 w-5 text-green-400" />}
                    name="WhatsApp Business API"
                    description="Connect your WhatsApp Business account for client messaging"
                    connected={whatsappConnected}
                    onToggle={() => setWhatsappConnected(!whatsappConnected)}
                  />
                  <IntegrationCard
                    icon={<Send className="h-5 w-5 text-blue-400" />}
                    name="Telegram Bot"
                    description="Set up a Telegram bot for notifications and client support"
                    connected={telegramConnected}
                    onToggle={() => setTelegramConnected(!telegramConnected)}
                  />
                </CardContent>
              </Card>

              <Card className="glass-card border-border/20">
                <CardHeader>
                  <CardTitle className="text-base font-['Space_Grotesk'] flex items-center gap-2">
                    <ExternalLink className="h-4 w-4 text-brand-gold" /> Apple Integrations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <IntegrationCard
                    icon={<Mail className="h-5 w-5 text-muted-foreground" />}
                    name="Apple Mail"
                    description="Sync emails and client communications"
                    connected={appleMailConnected}
                    onToggle={() => setAppleMailConnected(!appleMailConnected)}
                  />
                  <IntegrationCard
                    icon={<Bot className="h-5 w-5 text-muted-foreground" />}
                    name="Apple Notes"
                    description="Sync project notes and design observations"
                    connected={appleNotesConnected}
                    onToggle={() => setAppleNotesConnected(!appleNotesConnected)}
                  />
                </CardContent>
              </Card>

              <Card className="glass-card border-border/20">
                <CardHeader>
                  <CardTitle className="text-base font-['Space_Grotesk'] flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-brand-indigo-light" /> Calendar & Scheduling
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-brand-surface-light/30 border border-border/20">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-brand-surface-lighter flex items-center justify-center text-muted-foreground">
                        <Calendar className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Calendar Sync</p>
                        <p className="text-xs text-muted-foreground">Sync project deadlines and meetings with your calendar</p>
                      </div>
                    </div>
                    <Switch checked={calendarSync} onCheckedChange={setCalendarSync} />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* AI Configuration Tab */}
          <TabsContent value="ai" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card className="glass-card border-border/20">
                  <CardHeader>
                    <CardTitle className="text-base font-['Space_Grotesk'] flex items-center gap-2">
                      <Bot className="h-4 w-4 text-brand-cyan" /> AI Personality & Behavior
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm">AI Personality Prompt</Label>
                      <Textarea
                        value={aiPersonality}
                        onChange={(e) => setAiPersonality(e.target.value)}
                        rows={6}
                        className="bg-brand-surface-light/50 border-border/30 resize-none text-sm"
                      />
                      <p className="text-xs text-muted-foreground">Define how your AI assistant communicates with clients</p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm">Response Style</Label>
                      <Select value={responseStyle} onValueChange={setResponseStyle}>
                        <SelectTrigger className="w-full bg-brand-surface-light/50 border-border/30">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border/30">
                          <SelectItem value="professional">Professional</SelectItem>
                          <SelectItem value="friendly">Friendly</SelectItem>
                          <SelectItem value="concise">Concise</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Separator className="bg-border/20" />

                    <div className="space-y-2">
                      <Label className="text-sm">Fallback Message</Label>
                      <Textarea
                        value={fallbackMessage}
                        onChange={(e) => setFallbackMessage(e.target.value)}
                        rows={3}
                        className="bg-brand-surface-light/50 border-border/30 resize-none text-sm"
                      />
                      <p className="text-xs text-muted-foreground">Sent when AI cannot handle the inquiry</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="glass-card border-border/20">
                  <CardHeader>
                    <CardTitle className="text-base font-['Space_Grotesk'] flex items-center gap-2">
                      <Bot className="h-4 w-4 text-brand-gold" /> Auto-Reply Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-brand-surface-light/30 border border-border/20">
                      <div>
                        <p className="text-sm font-medium">Auto-Reply</p>
                        <p className="text-xs text-muted-foreground">AI responds automatically to messages</p>
                      </div>
                      <Switch checked={autoReply} onCheckedChange={setAutoReply} />
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-brand-surface-light/30 border border-border/20">
                      <div>
                        <p className="text-sm font-medium">Business Hours Only</p>
                        <p className="text-xs text-muted-foreground">Auto-reply only during business hours</p>
                      </div>
                      <Switch checked={businessHoursAutoReply} onCheckedChange={setBusinessHoursAutoReply} />
                    </div>
                  </CardContent>
                </Card>

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
                      <span className="text-muted-foreground">Style</span>
                      <Badge className="bg-brand-indigo/20 text-brand-indigo-light border-brand-indigo/30 text-[10px] capitalize">
                        {responseStyle}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Save Button */}
      <motion.div variants={itemVariants} className="flex justify-end">
        <Button className="bg-gradient-to-r from-brand-indigo to-brand-indigo-light hover:from-brand-indigo-light hover:to-brand-indigo text-white">
          <CheckCircle2 className="h-4 w-4 mr-2" /> Save Settings
        </Button>
      </motion.div>
    </motion.div>
  );
}
