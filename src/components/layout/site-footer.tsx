import Link from 'next/link';
import { Mountain, Instagram, Mail, Phone, MessageCircle } from 'lucide-react';
import { villaInfo, footerLinks } from '@/config/content';
import { siteConfig } from '@/config/siteConfig';

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-primary text-primary-foreground">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-primary-foreground/30">
                <Mountain className="h-4 w-4" />
              </span>
              <span className="font-serif text-xl font-medium tracking-wide-luxe">
                Suroor Villa
              </span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-primary-foreground/70">
              {villaInfo.tagline}.
            </p>
            <div className="mt-6 flex items-center gap-3">
              <a
                href={siteConfig.whatsappHref}
                target="_blank"
                rel="noreferrer"
                aria-label="WhatsApp"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-primary-foreground/20 transition-colors hover:border-accent hover:text-accent"
              >
                <MessageCircle className="h-4 w-4" />
              </a>
              <a
                href={siteConfig.emailHref}
                aria-label="Email"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-primary-foreground/20 transition-colors hover:border-accent hover:text-accent"
              >
                <Mail className="h-4 w-4" />
              </a>
              <a
                href={siteConfig.phoneHref}
                aria-label="Phone"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-primary-foreground/20 transition-colors hover:border-accent hover:text-accent"
              >
                <Phone className="h-4 w-4" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-primary-foreground/20 transition-colors hover:border-accent hover:text-accent"
              >
                <Instagram className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Explore */}
          <div>
            <h3 className="text-xs font-medium uppercase tracking-luxe text-primary-foreground/60">
              Explore
            </h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.explore.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-primary-foreground/80 transition-colors hover:text-accent"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Stays */}
          <div>
            <h3 className="text-xs font-medium uppercase tracking-luxe text-primary-foreground/60">
              Stays
            </h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.stays.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-primary-foreground/80 transition-colors hover:text-accent"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-xs font-medium uppercase tracking-luxe text-primary-foreground/60">
              Concierge
            </h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.contact.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-sm text-primary-foreground/80 transition-colors hover:text-accent"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-primary-foreground/60">
              {villaInfo.location}
            </p>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-primary-foreground/15 pt-8 text-xs text-primary-foreground/50 sm:flex-row">
          <p>
            © {new Date().getFullYear()} {villaInfo.name}. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link href="#" className="transition-colors hover:text-accent">
              Privacy
            </Link>
            <Link href="#" className="transition-colors hover:text-accent">
              Terms
            </Link>
            <Link href="#" className="transition-colors hover:text-accent">
              Cancellation Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
