import Link from 'next/link';
import { Briefcase, Linkedin, Twitter, Facebook, Instagram } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-secondary border-t border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-3 lg:col-span-1 mb-6 lg:mb-0">
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <Briefcase className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold text-primary">VocaHire</span>
            </Link>
            <p className="text-sm text-foreground/70">
              Revolutionizing hiring with AI-powered voice interviews.
            </p>
            <div className="flex space-x-4 mt-6">
              <Link href="#" className="text-foreground/60 hover:text-primary transition-colors">
                <Linkedin className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-foreground/60 hover:text-primary transition-colors">
                <Twitter className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-foreground/60 hover:text-primary transition-colors">
                <Facebook className="h-5 w-5" />
              </Link>
               <Link href="#" className="text-foreground/60 hover:text-primary transition-colors">
                <Instagram className="h-5 w-5" />
              </Link>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">Product</h3>
            <ul className="space-y-3">
              <li><Link href="#features" className="text-sm text-foreground/70 hover:text-primary transition-colors">Features</Link></li>
              <li><Link href="#how-it-works" className="text-sm text-foreground/70 hover:text-primary transition-colors">How It Works</Link></li>
              <li><Link href="#" className="text-sm text-foreground/70 hover:text-primary transition-colors">Pricing</Link></li>
              <li><Link href="#demo" className="text-sm text-foreground/70 hover:text-primary transition-colors">Demo</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">Company</h3>
            <ul className="space-y-3">
              <li><Link href="#" className="text-sm text-foreground/70 hover:text-primary transition-colors">About Us</Link></li>
              <li><Link href="#" className="text-sm text-foreground/70 hover:text-primary transition-colors">Careers</Link></li>
              <li><Link href="#" className="text-sm text-foreground/70 hover:text-primary transition-colors">Contact Us</Link></li>
              <li><Link href="#" className="text-sm text-foreground/70 hover:text-primary transition-colors">Blog</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">Legal</h3>
            <ul className="space-y-3">
              <li><Link href="#" className="text-sm text-foreground/70 hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link href="#" className="text-sm text-foreground/70 hover:text-primary transition-colors">Terms of Service</Link></li>
              <li><Link href="#" className="text-sm text-foreground/70 hover:text-primary transition-colors">Cookie Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-border pt-8 text-center">
          <p className="text-sm text-foreground/60">
            &copy; {currentYear} VocaHire. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
