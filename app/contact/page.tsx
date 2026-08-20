'use client';

import { useState } from 'react';
import { SiteHeader } from '@/src/components/layout/site-header';
import { SiteFooter } from '@/src/components/layout/site-footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { siteConfig } from '@/config/siteConfig';
import {
  Phone,
  Mail,
  MapPin,
  MessageSquare,
  Send,
  Building,
  Clock,
  Instagram,
  Facebook,
  Twitter,
  ExternalLink,
} from 'lucide-react';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) {
      toast.error('Please fill in your name, email address, and message.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, subject, message }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit inquiry.');

      toast.success(data.message || 'Inquiry submitted successfully.');
      setName('');
      setEmail('');
      setPhone('');
      setSubject('');
      setMessage('');
    } catch (err: any) {
      toast.error(err.message || 'Error submitting message.');
    } finally {
      setSubmitting(false);
    }
  };

  const whatsappUrl = siteConfig.getWhatsAppChatLink(
    'Hello Concierge Team, I would like to inquire about booking a private stay at Suroor Villa Kashmir.'
  );

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <SiteHeader />

      <main className="flex-1 pt-28 pb-16 px-5 sm:px-8 max-w-7xl mx-auto w-full space-y-12">
        {/* Page Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-xs uppercase tracking-widest text-accent font-semibold">
            Concierge & Location
          </span>
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground">
            Contact Suroor Villa
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Whether planning a private family gathering, a mountain honeymoon, or an exclusive corporate retreat, our dedicated Kashmir estate butler team is at your service.
          </p>
        </div>

        {/* Contact Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="p-6 rounded-lg bg-card border border-border space-y-2 text-center">
            <Phone className="w-6 h-6 text-accent mx-auto" />
            <h3 className="font-serif font-bold text-sm">Direct Phone</h3>
            <a
              href={siteConfig.phoneHref}
              className="text-xs text-muted-foreground hover:text-accent transition-colors block font-medium"
            >
              {siteConfig.ownerPhone}
            </a>
            <p className="text-[11px] text-muted-foreground">Available 24/7 for Guests</p>
          </div>

          <div className="p-6 rounded-lg bg-card border border-border space-y-2 text-center">
            <Mail className="w-6 h-6 text-accent mx-auto" />
            <h3 className="font-serif font-bold text-sm">Concierge Email</h3>
            <a
              href={siteConfig.emailHref}
              className="text-xs text-muted-foreground hover:text-accent transition-colors block font-medium"
            >
              {siteConfig.ownerEmail}
            </a>
            <p className="text-[11px] text-muted-foreground">Response within 2 hours</p>
          </div>

          <div className="p-6 rounded-lg bg-card border border-border space-y-2 text-center">
            <MessageSquare className="w-6 h-6 text-emerald-600 mx-auto" />
            <h3 className="font-serif font-bold text-sm">WhatsApp Concierge</h3>
            <p className="text-xs text-muted-foreground">{siteConfig.whatsappNumber}</p>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center text-xs font-semibold text-emerald-600 hover:underline pt-1"
            >
              Open WhatsApp Chat <ExternalLink className="w-3 h-3 ml-1" />
            </a>
          </div>

          <div className="p-6 rounded-lg bg-card border border-border space-y-2 text-center">
            <MapPin className="w-6 h-6 text-accent mx-auto" />
            <h3 className="font-serif font-bold text-sm">Estate Address</h3>
            <p className="text-xs text-muted-foreground">{siteConfig.address}</p>
          </div>
        </div>

        {/* Form and Google Map */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Contact Form */}
          <div className="p-8 border border-border rounded-lg bg-card space-y-6 shadow-sm">
            <div>
              <h2 className="font-serif text-2xl font-bold text-foreground">Send a Concierge Inquiry</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Protected by server-side rate-limiting and spam validation.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="c-name" className="text-xs">Full Name *</Label>
                  <Input
                    id="c-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="e.g. Radhika Kapoor"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="c-email" className="text-xs">Email Address *</Label>
                  <Input
                    id="c-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="radhika@example.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="c-phone" className="text-xs">Phone Number (Optional)</Label>
                  <Input
                    id="c-phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="c-subject" className="text-xs">Subject</Label>
                  <Input
                    id="c-subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Wedding photoshoot or Private chef inquiry"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="c-msg" className="text-xs">Message / Requests *</Label>
                <Textarea
                  id="c-msg"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  rows={4}
                  placeholder="Please describe your planned dates, preferred suites, special dietary or transport requirements..."
                />
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 font-semibold text-xs"
              >
                {submitting ? 'Sending Message...' : 'Submit Inquiry'} <Send className="w-3.5 h-3.5 ml-2" />
              </Button>
            </form>
          </div>

          {/* Interactive Google Map and Social Channels */}
          <div className="space-y-6">
            <div className="border border-border rounded-lg overflow-hidden h-[360px] bg-card relative shadow-sm">
              <iframe
                title="Suroor Villa Location"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d52820.5841028373!2d74.3784!3d34.0568!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x38e1b3e8a8a8a8a8%3A0x8e8a7e082f42a10!2sGulmarg%2C%20Jammu%20and%20Kashmir!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="p-6 border border-border rounded-lg bg-card space-y-4">
              <h3 className="font-serif font-bold text-lg">Connect With Suroor Villa</h3>
              <p className="text-xs text-muted-foreground">
                Follow our official estate stories for snow season updates, culinary specials, and private guest showcases.
              </p>

              <div className="flex gap-4">
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noreferrer"
                  className="p-2.5 rounded-full bg-muted hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <Instagram className="w-4 h-4" />
                </a>
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noreferrer"
                  className="p-2.5 rounded-full bg-muted hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <Facebook className="w-4 h-4" />
                </a>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noreferrer"
                  className="p-2.5 rounded-full bg-muted hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <Twitter className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
