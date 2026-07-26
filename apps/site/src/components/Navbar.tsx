
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, ChevronDown, ChevronRight, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { STAFF_APP_URL } from '@/lib/staffApp';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  
  const handleDropdownToggle = (dropdown: string) => {
    setOpenDropdown(openDropdown === dropdown ? null : dropdown);
  };
  
  const menuItems = [
    { name: 'Home', path: '/' },
    { name: 'About Us', path: '/about' },
    { 
      name: 'Our Solutions', 
      path: '/solutions',
      submenu: [
        { 
          name: 'Transportation', 
          submenu: [
            { name: 'Local Transportation', path: '/solutions/transportation/local' },
            { name: 'OTR', path: '/solutions/transportation/otr' },
            { name: 'Rail Car Transloading', path: '/solutions/transportation/rail' },
            { name: 'Airport Cargo Transfer', path: '/solutions/transportation/airport' },
          ] 
        },
        { 
          name: 'Global Forwarding', 
          submenu: [
            { name: 'Sea Freight', path: '/solutions/global-forwarding/sea' },
            { name: 'Air Freight', path: '/solutions/global-forwarding/air' },
          ] 
        },
        { 
          name: 'C & F Agent', 
          path: '/solutions/cf-agent' 
        },
        { 
          name: 'Contract Logistics', 
          submenu: [
            { name: 'Inbound Logistics', path: '/solutions/contract/inbound' },
            { name: 'Outbound Logistics', path: '/solutions/contract/outbound' },
            { name: 'Reverse Logistics', path: '/solutions/contract/reverse' },
            { name: '3PL', path: '/solutions/contract/3pl' },
            { name: '4PL', path: '/solutions/contract/4pl' },
            { name: 'Factory Logistics', path: '/solutions/contract/factory' },
            { name: 'Ecommerce', path: '/solutions/contract/ecommerce' },
          ] 
        },
        { 
          name: 'Supply Chain Management (SCM)', 
          path: '/solutions/scm' 
        },
        { 
          name: 'Courier And Express Delivery', 
          path: '/solutions/courier' 
        },
        { 
          name: 'Cold Chain Logistics', 
          path: '/solutions/cold-chain' 
        },
        { 
          name: 'Projects', 
          path: '/solutions/projects' 
        },
      ] 
    },
    { 
      name: 'Industries', 
      path: '/industries',
      submenu: [
        { name: 'Pharma', path: '/industries/pharma' },
        { name: 'Automotive', path: '/industries/automotive' },
        { name: 'Engineering', path: '/industries/engineering' },
        { name: 'Fashion and Retail', path: '/industries/fashion-retail' },
        { name: 'Chemicals', path: '/industries/chemicals' },
        { name: 'Energy', path: '/industries/energy' },
      ] 
    },
    { name: 'Careers', path: '/careers' },
    { name: 'Sustainability', path: '/sustainability' },
    { name: 'Contact Us', path: '/contact' },
  ];

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 w-full z-50 transition-all duration-300",
        isScrolled ? "bg-white shadow-md py-2" : "bg-white py-4"
      )}
    >
      <div className="container mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <img 
            src="/uploads/85583ea5-2f51-41fd-a4ea-aeaa0387a085.png" 
            alt="Sarva Express Logo" 
            className="h-12" 
          />
        </Link>
        
        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center space-x-6">
          {menuItems.map((item) => (
            <div key={item.name} className="relative group">
              {item.submenu ? (
                <div 
                  className="flex items-center cursor-pointer text-sarva-blue-dark hover:text-sarva-blue font-medium"
                  onClick={() => handleDropdownToggle(item.name)}
                >
                  <span>{item.name}</span>
                  <ChevronDown className="ml-1 w-4 h-4" />
                  
                  {/* First Level Dropdown */}
                  {openDropdown === item.name && (
                    <div className="absolute top-full left-0 mt-2 w-60 bg-white shadow-lg rounded-md py-2 z-50">
                      {item.submenu.map((subitem) => (
                        <div key={subitem.name} className="relative group/sub">
                          {subitem.submenu ? (
                            <div className="px-4 py-2 hover:bg-sarva-blue-light flex justify-between items-center">
                              <span>{subitem.name}</span>
                              <ChevronRight className="w-4 h-4" />
                              
                              {/* Second Level Dropdown */}
                              <div className="absolute left-full top-0 w-60 bg-white shadow-lg rounded-md py-2 hidden group-hover/sub:block">
                                {subitem.submenu.map((subsubitem) => (
                                  <Link
                                    key={subsubitem.name}
                                    to={subsubitem.path}
                                    className="block px-4 py-2 hover:bg-sarva-blue-light"
                                  >
                                    {subsubitem.name}
                                  </Link>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <Link
                              to={subitem.path}
                              className="block px-4 py-2 hover:bg-sarva-blue-light"
                            >
                              {subitem.name}
                            </Link>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to={item.path}
                  className="text-sarva-blue-dark hover:text-sarva-blue font-medium"
                >
                  {item.name}
                </Link>
              )}
            </div>
          ))}
        </div>
        
        {/* Staff Login — leaves the website for the CRM at /app. A plain
            anchor, not a router Link: the CRM is a separate application served
            under the same domain, so this must be a real navigation. */}
        <div className="hidden lg:block">
          <a
            href={STAFF_APP_URL}
            className="bg-sarva-orange text-white py-2 px-4 rounded-md flex items-center hover:bg-opacity-90 transition-all"
          >
            <Lock className="mr-2 w-4 h-4" />
            <span>Staff Login</span>
          </a>
        </div>
        
        {/* Mobile Menu Button */}
        <button className="lg:hidden" onClick={toggleMenu}>
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
      
      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="lg:hidden bg-white p-4 shadow-lg absolute top-full left-0 right-0 max-h-[80vh] overflow-auto">
          {menuItems.map((item) => (
            <div key={item.name} className="py-2">
              {item.submenu ? (
                <div className="space-y-2">
                  <div 
                    className="flex items-center justify-between font-medium"
                    onClick={() => handleDropdownToggle(item.name)}
                  >
                    <span>{item.name}</span>
                    <ChevronDown className="w-4 h-4" />
                  </div>
                  
                  {openDropdown === item.name && (
                    <div className="pl-4 space-y-2">
                      {item.submenu.map((subitem) => (
                        <div key={subitem.name} className="py-1">
                          {subitem.submenu ? (
                            <div className="space-y-2">
                              <div 
                                className="flex items-center justify-between"
                                onClick={() => handleDropdownToggle(subitem.name)}
                              >
                                <span>{subitem.name}</span>
                                <ChevronDown className="w-4 h-4" />
                              </div>
                              
                              {openDropdown === subitem.name && (
                                <div className="pl-4 space-y-2">
                                  {subitem.submenu.map((subsubitem) => (
                                    <Link
                                      key={subsubitem.name}
                                      to={subsubitem.path}
                                      className="block py-1"
                                      onClick={toggleMenu}
                                    >
                                      {subsubitem.name}
                                    </Link>
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : (
                            <Link
                              to={subitem.path}
                              className="block"
                              onClick={toggleMenu}
                            >
                              {subitem.name}
                            </Link>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to={item.path}
                  className="block font-medium"
                  onClick={toggleMenu}
                >
                  {item.name}
                </Link>
              )}
            </div>
          ))}
          
          <a
            href={STAFF_APP_URL}
            className="bg-sarva-orange text-white py-2 px-4 rounded-md flex items-center mt-4 hover:bg-opacity-90 transition-all w-full justify-center"
            onClick={toggleMenu}
          >
            <Lock className="mr-2 w-4 h-4" />
            <span>Staff Login</span>
          </a>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
