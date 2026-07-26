
import React, { useEffect } from 'react';
import { ArrowRight, Search } from 'lucide-react';
import { Link } from 'react-router-dom';

const Hero = () => {
  useEffect(() => {
    const trackingInput = document.getElementById('trackingInput');
    if (trackingInput) {
      setTimeout(() => {
        trackingInput.classList.add('animate-fade-in');
      }, 1000);
    }
  }, []);

  return (
    <div className="relative min-h-screen flex items-center overflow-hidden pt-16">
      {/* Background Image with Parallax - NO OVERLAY */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-fixed"
        style={{
          backgroundImage: `url('https://plus.unsplash.com/premium_photo-1661879449050-069f67e200bd?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8bG9naXN0aWNzfGVufDB8fDB8fHww')`,
        }}
      />
      
      {/* Content */}
      <div className="container mx-auto relative z-30 flex flex-col items-center text-center px-4">
        <h1 
          className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 opacity-0 animate-fade-in drop-shadow-2xl"
          style={{animationDelay: '0.2s'}}
        >
          Precision. Speed. Trust.
          <span className="block mt-2">Your Logistics Partner for Now and Future.</span>
        </h1>
        
        <p 
          className="text-lg md:text-xl text-white/95 max-w-3xl mx-auto mb-8 opacity-0 animate-fade-in drop-shadow-lg"
          style={{animationDelay: '0.4s'}}
        >
          At Sarva Express, we do more than just deliver cargo—we ensure it moves seamlessly across the country with speed, reliability, and care.
        </p>
        
        <div className="flex flex-col md:flex-row gap-4 w-full max-w-2xl mx-auto opacity-0 animate-fade-in" style={{animationDelay: '0.6s'}}>
          <Link 
            to="/contact" 
            className="bg-sarva-orange hover:bg-opacity-90 text-white py-3 px-6 rounded-md font-medium flex-1 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300"
          >
            Get a Quote <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
          
          <div id="trackingInput" className="opacity-0 bg-white/95 backdrop-blur-sm flex items-center rounded-md px-4 flex-1 min-w-0 shadow-lg">
            <Search className="w-5 h-5 text-gray-400 shrink-0" />
            <input 
              type="text" 
              placeholder="Enter Tracking Number" 
              className="py-3 px-3 w-full outline-none bg-transparent"
            />
            <button className="bg-sarva-blue text-white py-1 px-4 rounded shrink-0 hover:bg-sarva-blue-dark transition-colors">
              Track
            </button>
          </div>
        </div>
        
        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 opacity-0 animate-fade-in" style={{animationDelay: '1.2s'}}>
          <div className="w-8 h-12 rounded-full border-2 border-white/70 flex items-start justify-center p-2">
            <div className="w-1 h-3 bg-white/90 rounded-full animate-bounce"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
