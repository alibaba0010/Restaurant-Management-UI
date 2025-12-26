import { Utensils } from 'lucide-react';
import Link from 'next/link';

const Footer = () => {
  return (
    <footer className="bg-secondary">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <Utensils className="h-6 w-6 text-primary" />
            <span className="font-headline text-xl font-bold text-accent">GourmetHub</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} GourmetHub. All rights reserved.
          </p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
              Terms of Service
            </Link>
            <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
