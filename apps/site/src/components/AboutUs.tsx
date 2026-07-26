
import React, { useEffect, useRef } from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const AboutUs = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-fade-in');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    
    const childElements = sectionRef.current?.querySelectorAll('.animate-on-scroll');
    childElements?.forEach(el => {
      el.classList.add('opacity-0');
      observer.observe(el);
    });
    
    return () => {
      if (childElements) {
        childElements.forEach(el => observer.unobserve(el));
      }
    };
  }, []);

  return (
    <section 
      id="about-us" 
      ref={sectionRef} 
      className="section-padding relative"
      style={{
        backgroundImage: `url('/lovable-uploads/c0dd1d79-3245-4a61-891b-8c85bc695b4a.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      <div className="container mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="bg-white/90 backdrop-blur-sm p-8 rounded-lg shadow-lg">
              <h2 className="text-3xl md:text-4xl font-bold text-sarva-blue-dark mb-6 animate-on-scroll">
                Our Story
              </h2>
              <p className="text-gray-700 mb-4 animate-on-scroll">
                At Sarva Express, we bring over a decade of expertise in the logistics industry. While our journey under the Sarva Express name began in 2020, our foundation was laid in 2015, operating under a distinct brand.
              </p>
              <p className="text-gray-700 mb-6 animate-on-scroll">
                Over the years, we have grown into a trusted provider of efficient, reliable, and customer-centric logistics solutions across the country. With 10 years of experience, a strong nationwide network, and a commitment to excellence, we specialize in delivering seamless transportation, freight forwarding, supply chain management, and express delivery solutions.
              </p>
              <div className="animate-on-scroll">
                <Link to="/about" className="inline-flex items-center text-sarva-blue font-medium hover:underline">
                  Learn more about our journey <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
          
          <div className="animate-on-scroll">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/95 backdrop-blur-sm p-6 rounded-lg shadow-lg">
                <div className="w-12 h-12 bg-sarva-blue rounded-full flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-sarva-blue-dark mb-2">Efficiency</h3>
                <p className="text-gray-600">Optimized operations for faster, more reliable deliveries</p>
              </div>
              
              <div className="bg-white/95 backdrop-blur-sm p-6 rounded-lg shadow-lg">
                <div className="w-12 h-12 bg-sarva-blue rounded-full flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-sarva-blue-dark mb-2">Expertise</h3>
                <p className="text-gray-600">Decade of industry knowledge and specialized skills</p>
              </div>
              
              <div className="bg-white/95 backdrop-blur-sm p-6 rounded-lg shadow-lg">
                <div className="w-12 h-12 bg-sarva-blue rounded-full flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-sarva-blue-dark mb-2">Compliance</h3>
                <p className="text-gray-600">Adherence to all regulatory and industry standards</p>
              </div>
              
              <div className="bg-white/95 backdrop-blur-sm p-6 rounded-lg shadow-lg">
                <div className="w-12 h-12 bg-sarva-blue rounded-full flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-sarva-blue-dark mb-2">Technology</h3>
                <p className="text-gray-600">Cutting-edge solutions for real-time tracking and optimization</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="text-center mt-16 animate-on-scroll">
          <div className="bg-white/90 backdrop-blur-sm p-6 rounded-lg shadow-lg inline-block">
            <p className="text-xl font-medium text-sarva-blue-dark italic">
              "At Sarva Express, we don't just move shipments—we drive success."
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutUs;
