import React from "react";
import { Helmet } from "react-helmet-async";
import { useParams, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const IndustryDetail = () => {
  const { id } = useParams();
  
  const industries = {
    "pharma": {
      title: "Pharmaceutical Logistics Solutions",
      description: "Specialized logistics for the pharmaceutical industry ensuring temperature control, regulatory compliance, and timely delivery.",
      image: "https://images.unsplash.com/photo-1631549916768-4119b2e5f926?auto=format&fit=crop&q=80&w=1200",
      content: [
        "Our pharmaceutical logistics solutions are designed to meet the stringent requirements of the pharmaceutical industry, ensuring that your products are transported and stored in optimal conditions.",
        "We maintain a temperature-controlled supply chain to preserve the integrity and efficacy of your pharmaceutical products, from manufacturing facilities to distribution points and healthcare providers.",
        "Our team is well-versed in pharmaceutical regulations and compliance requirements, ensuring that your shipments meet all necessary standards and documentation."
      ],
      features: [
        "Temperature-controlled transportation and storage",
        "GDP-compliant warehousing",
        "Real-time monitoring and tracking",
        "Regulatory documentation management",
        "Specialized pharmaceutical packaging"
      ]
    },
    "automotive": {
      title: "Automotive Logistics Solutions",
      description: "Streamlined logistics for the automotive industry with just-in-time delivery and specialized handling.",
      image: "https://images.unsplash.com/photo-1518987048-93e29699e79a?auto=format&fit=crop&q=80&w=1200",
      content: [
        "Our automotive logistics solutions are tailored to the unique needs of the automotive industry, providing efficient and reliable services for manufacturers, suppliers, and dealerships.",
        "We understand the importance of just-in-time delivery in automotive manufacturing, and our logistics services are designed to ensure that parts and components arrive exactly when needed.",
        "Our specialized handling capabilities allow us to transport everything from small components to complete vehicles safely and efficiently."
      ],
      features: [
        "Just-in-time delivery",
        "Sequenced logistics for assembly lines",
        "Specialized vehicle transport",
        "Parts management and warehousing",
        "Returnable packaging management"
      ]
    },
    "engineering": {
      title: "Engineering Logistics Solutions",
      description: "Comprehensive logistics for the engineering sector, handling everything from raw materials to finished products.",
      image: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=1200",
      content: [
        "Our engineering logistics solutions are designed to support the complex supply chains of the engineering sector, ensuring smooth operations from raw material sourcing to final product delivery.",
        "We provide specialized handling for oversized equipment and heavy machinery, with the expertise and equipment necessary to transport these items safely and efficiently.",
        "Our inventory management systems are tailored to engineering workflows, helping you maintain optimal stock levels and improve operational efficiency."
      ],
      features: [
        "Project cargo handling for oversized equipment",
        "Heavy lift capabilities",
        "Supply chain solutions for engineering components",
        "Specialized packaging for sensitive parts",
        "Inventory management systems"
      ]
    },
    "fashion-retail": {
      title: "Fashion & Retail Logistics Solutions",
      description: "Tailored logistics for the fast-paced fashion and retail industry with quick response to market trends.",
      image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=1200",
      content: [
        "Our fashion and retail logistics solutions are designed to meet the dynamic needs of the industry, with services that help you respond quickly to changing market trends and consumer demands.",
        "We offer omnichannel fulfillment solutions that integrate seamlessly with your retail operations, whether you're selling in-store, online, or through a combination of channels.",
        "Our seasonal inventory management strategies help you prepare for peak seasons and promotional periods, ensuring that you have the right products in the right places at the right times."
      ],
      features: [
        "Omnichannel fulfillment solutions",
        "Garment-on-hanger transport",
        "Seasonal inventory management",
        "E-commerce fulfillment",
        "Retail store replenishment"
      ]
    },
    "chemicals": {
      title: "Chemical Logistics Solutions",
      description: "Specialized handling and transportation of chemical products with safety and regulatory compliance.",
      image: "https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?auto=format&fit=crop&q=80&w=1200",
      content: [
        "Our chemical logistics solutions are designed with safety and compliance at the forefront, ensuring that hazardous materials are handled according to all applicable regulations and standards.",
        "We maintain specialized facilities and equipment for the storage and transportation of chemical products, with strict protocols to prevent accidents and mitigate risks.",
        "Our team is trained in emergency response procedures and equipped to handle any situation that may arise during the transportation or storage of chemical products."
      ],
      features: [
        "ADR-compliant transportation",
        "Specialized chemical warehousing",
        "Safety protocols and emergency response",
        "Environmental compliance management",
        "Bulk chemical transport solutions"
      ]
    },
    "energy": {
      title: "Energy Logistics Solutions",
      description: "Specialized solutions for the energy sector, handling equipment and supplies for various energy projects.",
      image: "https://images.unsplash.com/photo-1587381419916-78fc843a36f1?auto=format&fit=crop&q=80&w=1200",
      content: [
        "Our energy logistics solutions cater to the unique needs of both conventional and renewable energy sectors, providing reliable services for projects of all sizes and complexities.",
        "We offer project logistics capabilities for power plant construction and infrastructure development, ensuring that all components arrive on schedule and in perfect condition.",
        "Our specialized transport services for renewable energy components, such as wind turbine blades and solar panels, are designed to handle these sensitive and often oversized items with care."
      ],
      features: [
        "Project logistics for power plant construction",
        "Specialized transport for wind turbine components",
        "Solar panel logistics and handling",
        "Supply chain solutions for energy infrastructure",
        "Remote site delivery capabilities"
      ]
    }
  };
  
  const industry = industries[id as keyof typeof industries];
  
  if (!industry) {
    return (
      <>
        <Navbar />
        <main className="pt-24 pb-12">
          <div className="container mx-auto px-4">
            <h1 className="text-3xl font-bold mb-6">Industry Not Found</h1>
            <p>The industry you are looking for does not exist.</p>
            <Link to="/industries" className="text-sarva-blue hover:underline mt-4 inline-block">
              Back to Industries
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>{industry.title} | Sarva Express</title>
        <meta name="description" content={industry.description} />
      </Helmet>
      
      <Navbar />
      
      <main>
        {/* Hero Banner with Background */}
        <section className="relative py-24 md:py-32 min-h-[60vh] flex items-center">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-fixed" 
            style={{ 
              backgroundImage: `url(${industry.image})` 
            }}
          />
          <div className="container mx-auto relative z-10 text-center px-4">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 drop-shadow-2xl">
              {industry.title}
            </h1>
            <p className="text-lg md:text-xl text-white/95 max-w-3xl mx-auto mb-8 drop-shadow-lg">
              {industry.description}
            </p>
          </div>
        </section>
        
        {/* Main Content with Background */}
        <section className="relative py-16 md:py-24">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-fixed opacity-15"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?auto=format&fit=crop&q=80&w=2000')`,
            }}
          />
          <div className="container mx-auto relative z-10 px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="bg-white/90 backdrop-blur-sm p-8 rounded-lg shadow-lg">
                <h2 className="text-3xl font-bold mb-6 text-sarva-blue-dark">
                  Industry-Specific Solutions
                </h2>
                {industry.content.map((paragraph, index) => (
                  <p key={index} className="text-lg mb-4 text-gray-700">
                    {paragraph}
                  </p>
                ))}
              </div>
              <div>
                <img 
                  src={industry.image} 
                  alt={industry.title} 
                  className="rounded-lg shadow-lg w-full h-auto object-cover" 
                />
              </div>
            </div>
            
            {/* Features */}
            <div className="mt-16">
              <div className="text-center mb-8">
                <div className="bg-white/90 backdrop-blur-sm p-6 rounded-lg shadow-lg max-w-2xl mx-auto">
                  <h3 className="text-2xl font-bold text-sarva-blue-dark">
                    Key Features
                  </h3>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {industry.features.map((feature, index) => (
                  <div key={index} className="bg-white/90 backdrop-blur-sm p-6 rounded-lg shadow-lg">
                    <div className="w-10 h-10 rounded-full bg-sarva-blue flex items-center justify-center text-white mb-4">
                      {index + 1}
                    </div>
                    <h4 className="text-lg font-semibold mb-2">{feature}</h4>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
        
        {/* CTA Section with Background */}
        <section className="relative py-16 md:py-20 text-white text-center">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-fixed" 
            style={{ 
              backgroundImage: `url('https://images.unsplash.com/photo-1433086966358-54859d0ed716?auto=format&fit=crop&q=80&w=2000')` 
            }}
          />
          <div className="container mx-auto relative z-10 px-4">
            <div className="bg-sarva-blue-dark/90 backdrop-blur-sm p-12 rounded-lg shadow-lg max-w-4xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Optimize Your {id?.charAt(0).toUpperCase()}{id?.slice(1)} Logistics?</h2>
              <p className="text-lg mb-8 opacity-90">
                Contact us today to discuss your specific requirements and discover how our tailored solutions can benefit your business.
              </p>
              <Button 
                size="lg" 
                className="bg-white text-sarva-blue-dark hover:bg-gray-100"
                asChild
              >
                <Link to="/contact">
                  Get in Touch <ArrowRight className="ml-2" />
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

export default IndustryDetail;
