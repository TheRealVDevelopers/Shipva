
import React from 'react';
import { Package, Search } from 'lucide-react';
import { Link } from 'react-router-dom';

const TrackingSection = () => {
  return (
    <section className="py-12 relative">
      <div 
        className="absolute inset-0 bg-cover bg-center bg-fixed"
        style={{
          backgroundImage: `url('/lovable-uploads/fad3a28a-03a6-407e-9d98-aac85d938c36.png')`,
        }}
      />
      <div className="container mx-auto relative z-10">
        <div className="text-center mb-8">
          <div className="bg-white/90 backdrop-blur-sm p-8 rounded-lg shadow-lg inline-block">
            <h2 className="text-3xl font-bold text-sarva-blue-dark mb-4">Track Your Shipment</h2>
            <p className="text-gray-700 max-w-xl mx-auto">
              Real-time tracking information for your shipments. Enter your tracking number to get the latest status update.
            </p>
          </div>
        </div>
        
        <div className="max-w-2xl mx-auto bg-white/95 backdrop-blur-sm p-8 rounded-lg shadow-lg">
          <form className="space-y-6">
            <div>
              <label htmlFor="tracking" className="block text-sm font-medium text-gray-700 mb-1">
                Tracking Number
              </label>
              <div className="flex">
                <div className="relative flex-grow">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Package className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="tracking"
                    name="tracking"
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-l-md focus:outline-none focus:ring-sarva-blue focus:border-sarva-blue"
                    placeholder="Enter your tracking number"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-sarva-blue hover:bg-opacity-90 text-white px-6 py-3 rounded-r-md flex items-center justify-center transition-colors"
                >
                  <Search className="mr-2 h-5 w-5" />
                  <span>Track</span>
                </button>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Example: SEXP1234567890
              </p>
            </div>
            
            <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-4">
              <Link
                to="/track"
                className="text-sarva-blue hover:text-sarva-blue-dark text-sm flex items-center"
              >
                <span>Advanced Tracking Options</span>
              </Link>
              <Link
                to="/contact"
                className="text-sarva-blue hover:text-sarva-blue-dark text-sm flex items-center"
              >
                <span>Need Help with Tracking?</span>
              </Link>
            </div>
          </form>
        </div>
        
        <div className="mt-8 flex flex-col md:flex-row justify-center items-center space-y-4 md:space-y-0 md:space-x-8 text-center">
          <div className="bg-white/90 backdrop-blur-sm p-4 rounded-lg shadow-lg">
            <div className="font-bold mb-1 text-sarva-blue-dark">WhatsApp Tracking</div>
            <p className="text-gray-700 text-sm">Send your tracking ID to +91 9740674867</p>
          </div>
          
          <div className="bg-white/90 backdrop-blur-sm p-4 rounded-lg shadow-lg">
            <div className="font-bold mb-1 text-sarva-blue-dark">Email Tracking</div>
            <p className="text-gray-700 text-sm">Email your query to track@sarvaexpress.com</p>
          </div>
          
          <div className="bg-white/90 backdrop-blur-sm p-4 rounded-lg shadow-lg">
            <div className="font-bold mb-1 text-sarva-blue-dark">Customer Support</div>
            <p className="text-gray-700 text-sm">Call us at 9740674867</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrackingSection;
