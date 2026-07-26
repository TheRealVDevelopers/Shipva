import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Instagram, Facebook, Linkedin, Youtube } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-sarva-blue-dark text-white">
      {/* Main Footer Content */}
      <div className="container mx-auto py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
          {/* Company Information */}
          <div>
            <div className="mb-6">
              <img 
                src="/uploads/85583ea5-2f51-41fd-a4ea-aeaa0387a085.png" 
                alt="Sarva Express Logo" 
                className="h-14 mb-4"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?auto=format&fit=crop&q=80&w=200&h=80";
                }}
              />
              <p className="text-white/80 mb-4">
                Your trusted logistics partner for seamless, efficient, and reliable transportation and supply chain solutions across India and beyond.
              </p>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-start">
                <MapPin className="w-5 h-5 text-sarva-orange shrink-0 mt-0.5 mr-2" />
                <p className="text-white/80">
                 No. 46, Ground floor 12th Main Rd 9thcross, 
                  Shakambari Nagar, 1st Phase, J. P. Nagar,
                  Karnataka 560078

                </p>
              </div>
              
              <div className="flex items-center">
                <Phone className="w-5 h-5 text-sarva-orange shrink-0 mr-2" />
                <a href="tel+91 9740674867" className="text-white/80 hover:text-white">
                  +91 9740674867
                </a>
              </div>
              
              <div className="flex items-center">
                <Mail className="w-5 h-5 text-sarva-orange shrink-0 mr-2" />
                <a href="mailto:info@sarvaexpress.com" className="text-white/80 hover:text-white">
                  info@sarvaexpress.com
                </a>
              </div>
            </div>
          </div>
          
          {/* Company Links */}
          <div>
            <h3 className="text-xl font-bold mb-4">Company</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/about" className="text-white/80 hover:text-white">About Us</Link>
              </li>
              <li>
                <Link to="/industries" className="text-white/80 hover:text-white">Industries</Link>
              </li>
              <li>
                <Link to="/sustainability" className="text-white/80 hover:text-white">Sustainability</Link>
              </li>
              <li>
                <Link to="/careers" className="text-white/80 hover:text-white">Careers</Link>
              </li>
              <li>
                <Link to="/news" className="text-white/80 hover:text-white">Media & News</Link>
              </li>
              <li>
                <Link to="/blog" className="text-white/80 hover:text-white">Blog & Insights</Link>
              </li>
              <li>
                <Link to="/testimonials" className="text-white/80 hover:text-white">Testimonials</Link>
              </li>
            </ul>
          </div>
          
          {/* Solutions Links */}
          <div>
            <h3 className="text-xl font-bold mb-4">Solutions</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/solutions/cf-agent" className="text-white/80 hover:text-white">C & F Agent</Link>
              </li>
              <li>
                <Link to="/solutions/global-forwarding" className="text-white/80 hover:text-white">Global Forwarding</Link>
              </li>
              <li>
                <Link to="/solutions/contract/3pl" className="text-white/80 hover:text-white">3PL</Link>
              </li>
              <li>
                <Link to="/solutions/contract/factory" className="text-white/80 hover:text-white">Factory Logistics</Link>
              </li>
              <li>
                <Link to="/solutions/transportation" className="text-white/80 hover:text-white">Transportation</Link>
              </li>
              <li>
                <Link to="/solutions/cold-chain" className="text-white/80 hover:text-white">Cold Chain Logistics</Link>
              </li>
              <li>
                <Link to="/solutions/projects" className="text-white/80 hover:text-white">Projects</Link>
              </li>
            </ul>
          </div>
          
          {/* Newsletter and Social */}
          <div>
            <h3 className="text-xl font-bold mb-4">Stay Connected</h3>
            <p className="text-white/80 mb-4">
              Subscribe to our newsletter for the latest updates, industry insights, and logistics news.
            </p>
            
            <form className="mb-6">
              <div className="flex">
                <input
                  type="email"
                  placeholder="Your email address"
                  className="px-4 py-2 rounded-l-md flex-grow text-gray-800 focus:outline-none"
                />
                <button
                  type="submit"
                  className="bg-sarva-orange hover:bg-opacity-90 px-4 py-2 rounded-r-md"
                >
                  Subscribe
                </button>
              </div>
            </form>
            
            <h4 className="font-medium mb-2">Follow Us</h4>
            <div className="flex space-x-4">
              <a href="#" className="text-white/80 hover:text-white">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="text-white/80 hover:text-white">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="text-white/80 hover:text-white">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="#" className="text-white/80 hover:text-white">
                <Youtube className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom Footer */}
      <div className="bg-black/20 py-4">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-white/70 text-sm">
              &copy; {currentYear} Sarva Express. All rights reserved.
            </p>
             <Link to="https://therealvdevelopers.in/" className="text-white/70 hover:text-white text-sm">
                Project By : The Real V Developers 
              </Link>
            
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link to="/privacy-policy" className="text-white/70 hover:text-white text-sm">
                Privacy Policy
              </Link>
              <Link to="/terms-conditions" className="text-white/70 hover:text-white text-sm">
                Terms & Conditions
              </Link>
              <Link to="/sitemap" className="text-white/70 hover:text-white text-sm">
                Sitemap
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
