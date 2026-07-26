
import React, { useEffect, useRef, useState } from 'react';

const Stats = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setIsVisible(true);
        observer.unobserve(entries[0].target);
      }
    }, { threshold: 0.3 });
    
    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }
    
    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);
  
  const stats = [
    { value: 10, label: "Years of Experience" },
    { value: 500, label: "Clients Served" },
    { value: 1000, label: "Daily Deliveries" },
    { value: 95, label: "On-Time Delivery %" },
  ];

  return (
    <section 
      ref={sectionRef}
      className="py-16 md:py-24 relative"
      style={{
        backgroundImage: `url('/lovable-uploads/27677ec8-b519-47dd-b3f5-0a7d6a7d8f8b.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <div className="bg-white/90 backdrop-blur-sm p-8 rounded-lg shadow-lg inline-block">
            <h2 className="text-3xl md:text-4xl font-bold text-sarva-blue-dark mb-4">
              Reliable Logistics Partner
            </h2>
            <p className="text-gray-700 max-w-2xl mx-auto">
              With over a decade of experience, Sarva Express has established itself as a trusted name in the logistics industry.
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="bg-white/95 backdrop-blur-sm p-6 rounded-lg shadow-lg">
                <div className="text-4xl md:text-5xl lg:text-6xl font-bold text-sarva-orange mb-2">
                  {!isVisible ? 0 : (
                    <>
                      {stat.label.includes('%') ? (
                        <CountUp end={stat.value} duration={2} suffix="%" />
                      ) : (
                        <CountUp end={stat.value} duration={2} suffix="+" />
                      )}
                    </>
                  )}
                </div>
                <p className="text-gray-700">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="flex flex-wrap justify-center items-center mt-16 gap-8">
          <div className="bg-white/95 backdrop-blur-sm px-6 py-4 rounded-lg shadow-lg">
            <p className="text-sarva-blue-dark font-medium">ISO 9001:2015 Certified</p>
          </div>
          <div className="bg-white/95 backdrop-blur-sm px-6 py-4 rounded-lg shadow-lg">
            <p className="text-sarva-blue-dark font-medium">Pan-India Network</p>
          </div>
          <div className="bg-white/95 backdrop-blur-sm px-6 py-4 rounded-lg shadow-lg">
            <p className="text-sarva-blue-dark font-medium">24/7 Operations</p>
          </div>
          <div className="bg-white/95 backdrop-blur-sm px-6 py-4 rounded-lg shadow-lg">
            <p className="text-sarva-blue-dark font-medium">Real-Time Tracking</p>
          </div>
        </div>
      </div>
    </section>
  );
};

// CountUp component to animate counting from 0 to target value
const CountUp = ({ end, duration, suffix = "" }) => {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    let startTime: number | null = null;
    const startValue = 0;
    const endValue = end;
    
    const animateCount = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      const currentCount = Math.floor(progress * (endValue - startValue) + startValue);
      
      setCount(currentCount);
      
      if (progress < 1) {
        requestAnimationFrame(animateCount);
      } else {
        setCount(endValue);
      }
    };
    
    requestAnimationFrame(animateCount);
  }, [end, duration]);
  
  return <>{count}{suffix}</>;
};

export default Stats;
