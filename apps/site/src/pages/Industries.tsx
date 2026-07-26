
import React from "react";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ArrowRight, Pill, Car, Wrench, ShoppingBag, Beaker, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Industries = () => {
  const industries = [
    {
      id: "pharma",
      name: "Pharmaceuticals",
      icon: <Pill className="w-8 h-8 text-sarva-blue" />,
      image: "https://images.unsplash.com/photo-1631549916768-4119b2e5f926?auto=format&fit=crop&q=80",
      description: "Specialized logistics solutions for pharmaceutical products, ensuring temperature control, regulatory compliance, and timely delivery of life-saving medications.",
      features: [
        "Temperature-controlled transportation for sensitive medications",
        "GDP-compliant warehousing and handling",
        "Real-time monitoring and tracking systems",
        "Specialized packaging solutions for pharmaceuticals",
        "Regulatory documentation and compliance management"
      ],
      link: "/industries/pharma"
    },
    {
      id: "automotive",
      name: "Automotive",
      icon: <Car className="w-8 h-8 text-sarva-blue" />,
      image: "https://images.unsplash.com/photo-1518987048-93e29699e79a?auto=format&fit=crop&q=80",
      description: "Streamlined logistics for the automotive industry, including just-in-time delivery, supplier management, and specialized handling of automotive parts and vehicles.",
      features: [
        "Just-in-time delivery for production efficiency",
        "Sequenced logistics for assembly lines",
        "Specialized vehicle transport solutions",
        "Parts management and warehousing",
        "Returnable packaging management systems"
      ],
      link: "/industries/automotive"
    },
    {
      id: "engineering",
      name: "Engineering",
      icon: <Wrench className="w-8 h-8 text-sarva-blue" />,
      image: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80",
      description: "Comprehensive logistics solutions for the engineering sector, handling everything from raw materials to finished products with precision and care.",
      features: [
        "Project cargo handling for oversized equipment",
        "Heavy lift capabilities for industrial machinery",
        "Supply chain solutions for engineering components",
        "Specialized packaging for sensitive parts",
        "Inventory management systems for engineering workflows"
      ],
      link: "/industries/engineering"
    },
    {
      id: "fashion-retail",
      name: "Fashion and Retail",
      icon: <ShoppingBag className="w-8 h-8 text-sarva-blue" />,
      image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80",
      description: "Tailored logistics for the fast-paced fashion and retail industry, enabling quick response to market trends and efficient inventory management.",
      features: [
        "Omnichannel fulfillment solutions",
        "Garment-on-hanger transport capabilities",
        "Seasonal inventory management",
        "E-commerce fulfillment services",
        "Retail store replenishment systems"
      ],
      link: "/industries/fashion-retail"
    },
    {
      id: "chemicals",
      name: "Chemicals",
      icon: <Beaker className="w-8 h-8 text-sarva-blue" />,
      image: "https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?auto=format&fit=crop&q=80",
      description: "Specialized handling and transportation of chemical products, ensuring safety, regulatory compliance, and environmental protection throughout the supply chain.",
      features: [
        "ADR-compliant transportation for hazardous materials",
        "Specialized chemical warehousing facilities",
        "Safety protocols and emergency response planning",
        "Environmental compliance management",
        "Bulk chemical transport solutions"
      ],
      link: "/industries/chemicals"
    },
    {
      id: "energy",
      name: "Energy",
      icon: <Zap className="w-8 h-8 text-sarva-blue" />,
      image: "https://images.unsplash.com/photo-1587381419916-78fc843a36f1?auto=format&fit=crop&q=80",
      description: "Specialized logistics solutions for the energy sector, handling equipment, components, and supplies for conventional and renewable energy projects.",
      features: [
        "Project logistics for power plant construction",
        "Specialized transport for wind turbine components",
        "Solar panel logistics and handling",
        "Supply chain solutions for energy infrastructure",
        "Remote site delivery capabilities"
      ],
      link: "/industries/energy"
    }
  ];

  return (
    <>
      <Helmet>
        <title>Industries We Serve | Sarva Express</title>
        <meta name="description" content="Discover how Sarva Express provides specialized logistics solutions for pharmaceuticals, automotive, engineering, fashion & retail, chemicals, and energy sectors." />
      </Helmet>
      
      <Navbar />
      
      <main>
        {/* Hero Banner */}
        <section 
          className="relative bg-sarva-blue-dark py-24 md:py-32"
          style={{
            backgroundImage: `url('/lovable-uploads/7878122d-1189-4912-8d36-f2bcad50bd82.png')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-black/60"></div>
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMwMDAiIGZpbGwtb3BhY2l0eT0iLjAyIj48cGF0aCBkPSJNMzYgMzRoLTJ2LTRoMnY0em0wLTZoLTJ2LTRoMnY0em0wLTZoLTJWNGgydjEyem0tNiA4aC00di0yaDR2MnptLTYgMGgtNHYtMmg0djJ6bTE4LThoLTR2LTJoNHYyem0tMTIgMGgtNHYtMmg0djJ6bTYgMGgtNHYtMmg0djJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-10"></div>
          <div className="container mx-auto relative z-10 text-center px-4">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 opacity-0 animate-fade-in" style={{animationDelay: '0.2s'}}>
              Industries We Serve
            </h1>
            <p className="text-lg md:text-xl text-white/90 max-w-3xl mx-auto mb-8 opacity-0 animate-fade-in" style={{animationDelay: '0.4s'}}>
              Specialized logistics solutions tailored for your industry's unique needs
            </p>
          </div>
        </section>
        
        {/* Overview Section */}
        <section className="py-16 md:py-24 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-sarva-blue-dark">Industry-Specific Expertise</h2>
              <p className="text-lg mb-6 text-gray-700">
                At Sarva Express, we understand that different industries have unique logistics requirements. Our specialized teams develop deep industry knowledge to provide tailored solutions that address your sector's specific challenges and opportunities.
              </p>
              <p className="text-lg text-gray-700">
                From pharmaceutical cold chains to automotive just-in-time delivery, our industry-focused approach ensures that your logistics operations are optimized for efficiency, compliance, and competitive advantage.
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-16">
              {industries.map((industry) => (
                <div key={industry.id} className="text-center">
                  <Link to={industry.link} className="block group">
                    <div className="bg-white rounded-full w-20 h-20 mx-auto flex items-center justify-center border border-gray-200 shadow-sm group-hover:shadow-md group-hover:border-sarva-blue transition-all duration-300">
                      {industry.icon}
                    </div>
                    <h3 className="mt-4 font-semibold text-sarva-blue-dark group-hover:text-sarva-blue transition-colors duration-300">{industry.name}</h3>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
        
        {/* Industries Detail Sections */}
        {industries.map((industry, index) => (
          <section key={industry.id} className={`py-16 md:py-20 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`} id={industry.id}>
            <div className="container mx-auto px-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className={index % 2 !== 0 ? 'order-2 lg:order-1' : ''}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-sarva-blue/10 p-3 rounded-full">
                      {industry.icon}
                    </div>
                    <h2 className="text-3xl font-bold text-sarva-blue-dark">{industry.name}</h2>
                  </div>
                  
                  <p className="text-lg mb-6 text-gray-700">
                    {industry.description}
                  </p>
                  
                  <div className="mb-8">
                    <h3 className="text-xl font-semibold mb-4 text-sarva-blue">Key Features</h3>
                    <ul className="space-y-2">
                      {industry.features.map((feature, fIdx) => (
                        <li key={fIdx} className="flex items-start">
                          <span className="text-sarva-orange font-bold mr-2 mt-1">•</span>
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <Button asChild>
                    <Link to={industry.link}>
                      Learn More <ArrowRight className="ml-2" />
                    </Link>
                  </Button>
                </div>
                <div className={index % 2 !== 0 ? 'order-1 lg:order-2' : ''}>
                  <img 
                    src={industry.image} 
                    alt={industry.name} 
                    className="rounded-lg shadow-lg w-full h-80 object-cover" 
                  />
                </div>
              </div>
            </div>
          </section>
        ))}
        
        {/* CTA Section */}
        <section className="py-16 md:py-24 bg-sarva-blue-dark text-white text-center">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Need a Custom Industry Solution?</h2>
            <p className="text-lg mb-8 max-w-3xl mx-auto opacity-90">
              Our logistics experts can design a tailored solution for your industry-specific challenges, no matter how complex or unique they may be.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button size="lg" asChild>
                <Link to="/contact">
                  Discuss Your Requirements <ArrowRight className="ml-2" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="bg-transparent border-white text-white hover:bg-white hover:text-sarva-blue-dark" asChild>
                <Link to="/solutions">
                  Explore All Solutions
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </>
  );
};

export default Industries;
