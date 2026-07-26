
import React from 'react';
import { Truck, Warehouse, Thermometer, Package, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const Services = () => {
  const services = [
    {
      icon: <Truck className="w-8 h-8" />,
      title: "Transportation & Freight",
      description: "Comprehensive transportation solutions across India with real-time tracking and guaranteed delivery schedules.",
      features: ["Door-to-door delivery", "Real-time GPS tracking", "Scheduled pickups", "Express delivery options"],
      image: "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&q=80&w=800",
      link: "/solutions/transportation"
    },
    {
      icon: <Warehouse className="w-8 h-8" />,
      title: "Warehousing & Distribution",
      description: "State-of-the-art warehousing facilities with advanced inventory management and distribution networks.",
      features: ["Climate-controlled storage", "Inventory management", "Order fulfillment", "Cross-docking services"],
      image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=800",
      link: "/solutions/warehousing"
    },
    {
      icon: <Thermometer className="w-8 h-8" />,
      title: "Cold Chain Logistics",
      description: "Temperature-controlled logistics solutions for pharmaceuticals, food, and other temperature-sensitive goods.",
      features: ["Temperature monitoring", "Pharmaceutical grade", "Food safety compliance", "Cold storage facilities"],
      image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?auto=format&fit=crop&q=80&w=800",
      link: "/solutions/cold-chain"
    },
    {
      icon: <Package className="w-8 h-8" />,
      title: "Supply Chain Management",
      description: "End-to-end supply chain optimization with advanced analytics and seamless integration capabilities.",
      features: ["Supply chain optimization", "Vendor management", "Analytics & reporting", "Risk management"],
      image: "https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&q=80&w=800",
      link: "/solutions/supply-chain"
    }
  ];

  return (
    <section className="section-padding relative">
      <div 
        className="absolute inset-0 bg-cover bg-center bg-fixed"
        style={{
          backgroundImage: `url('/lovable-uploads/c0dd1d79-3245-4a61-891b-8c85bc695b4a.png')`,
        }}
      />
      <div className="container mx-auto relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 drop-shadow-lg">Our Solutions</h2>
          <p className="text-lg text-white/90 max-w-3xl mx-auto drop-shadow">
            Comprehensive logistics solutions designed to meet your unique business needs with precision, reliability, and efficiency.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {services.map((service, index) => (
            <div key={index} className="group bg-black/20 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-white/10">
              <div className="relative overflow-hidden">
                <div 
                  className="h-56 bg-cover bg-center transition-transform duration-300 group-hover:scale-110"
                  style={{ backgroundImage: `url(${service.image})` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                  <div className="absolute bottom-4 left-4 bg-black/30 backdrop-blur-sm p-3 rounded-full shadow-lg border border-white/20">
                    <div className="text-white">
                      {service.icon}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-8">
                <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-sarva-orange transition-colors duration-300">{service.title}</h3>
                <p className="text-white/80 mb-6 leading-relaxed">{service.description}</p>
                
                <div className="space-y-3 mb-6">
                  {service.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center text-sm text-white/70">
                      <div className="w-2 h-2 bg-gradient-to-r from-sarva-orange to-sarva-blue rounded-full mr-3 flex-shrink-0"></div>
                      <span className="font-medium">{feature}</span>
                    </div>
                  ))}
                </div>
                
                <Link 
                  to={service.link}
                  className="inline-flex items-center bg-gradient-to-r from-sarva-blue to-sarva-blue-dark text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transition-all duration-300 group-hover:from-sarva-orange group-hover:to-sarva-orange"
                >
                  Explore Solution <ArrowRight className="ml-2 w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          ))}
        </div>
        
        <div className="text-center mt-16">
          <Link 
            to="/solutions" 
            className="bg-gradient-to-r from-sarva-blue to-sarva-blue-dark hover:from-sarva-orange hover:to-sarva-orange text-white py-4 px-10 rounded-lg font-medium inline-flex items-center transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            View All Solutions <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Services;
