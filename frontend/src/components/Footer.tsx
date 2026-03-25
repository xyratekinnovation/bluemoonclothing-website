import { Link } from "react-router-dom";
import { Instagram, Facebook, Twitter } from "lucide-react";
import logo from "@/assets/logo.png";

const Footer = () => (
  <footer className="bg-charcoal text-muted py-16">
    <div className="container">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
        <div className="md:col-span-1">
          <img src={logo} alt="Bluemoon" className="h-12 w-auto mb-4" />
          <p className="text-sm text-muted-foreground leading-relaxed">
            Every fit feels like a Blue Moon.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold tracking-widest uppercase mb-4 text-gold">Shop</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/category/men" className="text-muted-foreground hover:text-gold transition-colors">Men</Link></li>
            <li><Link to="/category/women" className="text-muted-foreground hover:text-gold transition-colors">Women</Link></li>
            <li><Link to="/category/kids" className="text-muted-foreground hover:text-gold transition-colors">Kids</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold tracking-widest uppercase mb-4 text-gold">Company</h4>
          <ul className="space-y-2 text-sm">
            <li><span className="text-muted-foreground">About Us</span></li>
            <li><span className="text-muted-foreground">Contact</span></li>
            <li><span className="text-muted-foreground">Careers</span></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold tracking-widest uppercase mb-4 text-gold">Follow Us</h4>
          <div className="flex gap-4">
            <a href="#" className="text-muted-foreground hover:text-gold transition-colors" aria-label="Instagram"><Instagram className="w-5 h-5" /></a>
            <a href="#" className="text-muted-foreground hover:text-gold transition-colors" aria-label="Facebook"><Facebook className="w-5 h-5" /></a>
            <a href="#" className="text-muted-foreground hover:text-gold transition-colors" aria-label="Twitter"><Twitter className="w-5 h-5" /></a>
          </div>
        </div>
      </div>
      <div className="border-t border-charcoal-light pt-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Bluemoon Clothing. All rights reserved.
      </div>
    </div>
  </footer>
);

export default Footer;
