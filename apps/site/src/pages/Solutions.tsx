
import React from "react";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ArrowRight, Truck, Box, Clock, BarChart, LayoutGrid, Snowflake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";

const Solutions = () => {
  const navigate = useNavigate();
  
  const solutions = [
    {
      id: "transportation",
      name: "Transportation",
      icon: <Truck className="w-8 h-8 text-sarva-blue" />,
      description: "Efficient and reliable transportation services across India, including road, rail, and multimodal options.",
      features: [
        "Full Truckload (FTL) and Less than Truckload (LTL) services",
        "Real-time tracking and monitoring",
        "Specialized transport for oversized and heavy cargo",
        "Temperature-controlled transportation",
        "Multimodal transport solutions"
      ],
      link: "/solutions/transportation"
    },
    {
      id: "warehousing",
      name: "Warehousing",
      icon: <Box className="w-8 h-8 text-sarva-blue" />,
      description: "Secure and strategically located warehousing facilities with advanced inventory management systems.",
      features: [
        "Bonded and non-bonded warehousing options",
        "Climate-controlled storage",
        "Inventory management and order fulfillment",
        "Cross-docking and transloading services",
        "Value-added services like labeling and packaging"
      ],
      link: "/solutions/warehousing"
    },
    {
      id: "supply-chain-management",
      name: "Supply Chain Management",
      icon: <LayoutGrid className="w-8 h-8 text-sarva-blue" />,
      description: "End-to-end supply chain solutions designed to optimize efficiency, reduce costs, and improve visibility.",
      features: [
        "Supply chain design and optimization",
        "Demand planning and forecasting",
        "Procurement and vendor management",
        "Order management and fulfillment",
        "Performance monitoring and reporting"
      ],
      link: "/solutions/supply-chain-management"
    },
    {
      id: "cold-chain",
      name: "Cold Chain Logistics",
      icon: <Snowflake className="w-8 h-8 text-sarva-blue" />,
      description: "Specialized logistics solutions for temperature-sensitive goods, ensuring product integrity from origin to destination.",
      features: [
        "Temperature-controlled transportation",
        "Refrigerated warehousing facilities",
        "Real-time temperature monitoring",
        "GDP-compliant processes",
        "Specialized packaging solutions"
      ],
      link: "/solutions/cold-chain"
    },
    {
      id: "express-delivery",
      name: "Express Delivery",
      icon: <Clock className="w-8 h-8 text-sarva-blue" />,
      description: "Fast and reliable express delivery services for time-critical shipments, with guaranteed delivery times.",
      features: [
        "Same-day and next-day delivery options",
        "Dedicated vehicles for urgent shipments",
        "Real-time tracking and delivery confirmation",
        "Door-to-door service",
        "Customs clearance for international express"
      ],
      link: "/solutions/express-delivery"
    },
    {
      id: "data-analytics",
      name: "Data Analytics & Reporting",
      icon: <BarChart className="w-8 h-8 text-sarva-blue" />,
      description: "Advanced data analytics and reporting tools to provide insights into your logistics operations, helping you make informed decisions.",
      features: [
        "Customizable dashboards and reports",
        "Real-time visibility into key performance indicators (KPIs)",
        "Predictive analytics for demand forecasting",
        "Supply chain optimization recommendations",
        "Data integration with existing systems"
      ],
      link: "/solutions/data-analytics"
    }
  ];

  const handleGetConsultation = () => {
    navigate('/contact');
  };

  return (
    <>
      <Helmet>
        <title>Our Solutions | Sarva Express</title>
        <meta name="description" content="Explore Sarva Express's comprehensive logistics solutions, including transportation, warehousing, supply chain management, cold chain logistics, express delivery, and data analytics." />
      </Helmet>
      
      <Navbar />
      
      <main>
        {/* Hero Banner with Background */}
        <section className="relative py-24 md:py-32 min-h-[60vh] flex items-center">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-fixed" 
            style={{ 
              backgroundImage: `url('https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=2000')` 
            }}
          />
          <div className="container mx-auto relative z-10 text-center px-4">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 opacity-0 animate-fade-in drop-shadow-2xl" style={{animationDelay: '0.2s'}}>
              Our Solutions
            </h1>
            <p className="text-lg md:text-xl text-white/95 max-w-3xl mx-auto mb-8 opacity-0 animate-fade-in drop-shadow-lg" style={{animationDelay: '0.4s'}}>
              Comprehensive logistics solutions to meet your business needs
            </p>
          </div>
        </section>
        
        {/* Overview Section with Background */}
        <section className="relative py-16 md:py-24">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-fixed opacity-15"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&q=80&w=2000')`,
            }}
          />
          <div className="container mx-auto relative z-10 px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <div className="bg-white/90 backdrop-blur-sm p-8 rounded-lg shadow-lg">
                <h2 className="text-3xl md:text-4xl font-bold mb-6 text-sarva-blue-dark">Comprehensive Logistics Solutions</h2>
                <p className="text-lg mb-6 text-gray-700">
                  At Sarva Express, we offer a wide range of logistics solutions designed to streamline your supply chain, reduce costs, and improve overall efficiency. Our services are tailored to meet the unique needs of your business, ensuring seamless operations from start to finish.
                </p>
                <p className="text-lg text-gray-700">
                  Explore our solutions below to discover how we can help you optimize your logistics and gain a competitive edge.
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {solutions.map((solution) => (
                <div key={solution.id} className="bg-white/95 backdrop-blur-sm rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300">
                  <div className="p-6">
                    <div className="bg-sarva-blue/10 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                      {solution.icon}
                    </div>
                    <h3 className="text-xl font-bold mb-2 text-sarva-blue-dark">{solution.name}</h3>
                    <p className="text-gray-700 mb-4">{solution.description}</p>
                    <ul className="list-disc list-inside mb-4">
                      {solution.features.map((feature, index) => (
                        <li key={index} className="text-gray-600 text-sm">{feature}</li>
                      ))}
                    </ul>
                    <Button asChild>
                      <Link to={solution.link}>
                        Learn More <ArrowRight className="ml-2" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        
        {/* CTA Section with Background */}
        <section className="relative py-16 md:py-24 text-white text-center">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-fixed" 
            style={{ 
              backgroundImage: `url('https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&q=80&w=2000')` 
            }}
          />
          <div className="container mx-auto relative z-10 px-4">
            <div className="bg-sarva-blue-dark/90 backdrop-blur-sm p-12 rounded-lg shadow-lg max-w-4xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Optimize Your Logistics?</h2>
              <p className="text-lg mb-8 opacity-90">
                Contact us today to discuss your logistics needs and discover how our tailored solutions can benefit your business.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button 
                  size="lg" 
                  className="bg-white text-sarva-blue-dark hover:bg-gray-100"
                  onClick={handleGetConsultation}
                >
                  Get a Free Consultation <ArrowRight className="ml-2" />
                </Button>
                <Button variant="outline" size="lg" className="bg-transparent border-white text-white hover:bg-white hover:text-sarva-blue-dark" asChild>
                  <Link to="/industries">
                    Explore Industries We Serve
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </>
  );
};

export default Solutions;
