
import React from "react";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ArrowRight, Leaf, Recycle, Bolt, Trees, Droplets, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";

const Sustainability = () => {
  const sustainabilityInitiatives = [
    {
      icon: <Recycle className="w-8 h-8 text-sarva-blue" />,
      title: "Green Fleet Management",
      description: "We're transitioning to a more sustainable fleet with electric vehicles, alternative fuels, and optimized routing to reduce emissions.",
      metrics: "20% reduction in fleet carbon emissions since 2020"
    },
    {
      icon: <Leaf className="w-8 h-8 text-sarva-blue" />,
      title: "Sustainable Warehousing",
      description: "Our warehouses implement renewable energy, energy-efficient lighting, and water conservation practices to minimize environmental impact.",
      metrics: "Solar-powered operations at 3 major facilities across India"
    },
    {
      icon: <Bolt className="w-8 h-8 text-sarva-blue" />,
      title: "Packaging Optimization",
      description: "We develop eco-friendly packaging solutions that minimize waste while maintaining product protection throughout the supply chain.",
      metrics: "50% reduction in packaging waste through innovative solutions"
    },
    {
      icon: <Trees className="w-8 h-8 text-sarva-blue" />,
      title: "Carbon Footprint Reduction",
      description: "We measure, track, and actively work to reduce our carbon footprint across all operations, setting ambitious targets for improvement.",
      metrics: "Comprehensive carbon accounting across our entire network"
    },
    {
      icon: <Droplets className="w-8 h-8 text-sarva-blue" />,
      title: "Community Engagement",
      description: "We engage with local communities through environmental initiatives, educational programs, and sustainable development projects.",
      metrics: "Active partnerships with 5 environmental organizations"
    },
    {
      icon: <Flag className="w-8 h-8 text-sarva-blue" />,
      title: "Sustainability Certifications",
      description: "We pursue and maintain relevant sustainability certifications to validate our environmental commitment and practices.",
      metrics: "ISO 14001 Environmental Management System certified"
    }
  ];

  return (
    <>
      <Helmet>
        <title>Sustainability | Sarva Express</title>
        <meta name="description" content="Learn about Sarva Express's commitment to sustainability through green logistics practices, carbon footprint reduction, and environmental initiatives." />
      </Helmet>
      
      <Navbar />
      
      <main>
        {/* Hero Banner with Background Image */}
        <section className="relative py-24 md:py-32 min-h-[60vh] flex items-center">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-fixed" 
            style={{ 
              backgroundImage: `url('/lovable-uploads/e132ccd5-96d6-4886-a54a-a697231f6445.png')` 
            }}
          />
          <div className="container mx-auto relative z-10 text-center px-4">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 opacity-0 animate-fade-in drop-shadow-lg" style={{animationDelay: '0.2s'}}>
              Sustainability
            </h1>
            <p className="text-lg md:text-xl text-white/90 max-w-3xl mx-auto mb-8 opacity-0 animate-fade-in drop-shadow" style={{animationDelay: '0.4s'}}>
              Our commitment to environmentally responsible logistics operations
            </p>
          </div>
        </section>
        
        {/* Overview Section with Background */}
        <section className="relative py-16 md:py-24">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-fixed"
            style={{
              backgroundImage: `url('/lovable-uploads/f3ebe06e-b92b-482b-b059-1e2a1070c4f8.png')`,
            }}
          />
          <div className="container mx-auto relative z-10 px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="bg-black/20 backdrop-blur-sm p-8 rounded-lg shadow-lg border border-white/10">
                <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white drop-shadow-lg">Our Sustainability Vision</h2>
                <p className="text-lg mb-6 text-white/90 drop-shadow">
                  At Sarva Express, we believe that responsible logistics is not just about efficient delivery—it's about making a positive impact on our planet. We are committed to sustainable practices that reduce our environmental footprint while maintaining the highest standards of service.
                </p>
                <p className="text-lg mb-6 text-white/90 drop-shadow">
                  Through innovative solutions, strategic investments, and continuous improvement, we're working to make our operations greener, cleaner, and more sustainable for future generations. Our approach encompasses everything from fleet management and warehousing to packaging and community engagement.
                </p>
                <p className="text-lg text-white/90 drop-shadow">
                  We understand that true sustainability requires measurable actions and transparent reporting. That's why we set clear environmental targets and regularly track our progress, sharing our journey with stakeholders and partners who share our commitment to a more sustainable future.
                </p>
              </div>
              <div>
                <div className="bg-black/20 backdrop-blur-sm p-6 rounded-lg shadow-lg border border-white/10">
                  <img 
                    src="https://images.unsplash.com/photo-1623288516140-77f378e6257c?auto=format&fit=crop&q=80" 
                    alt="Sustainable Logistics" 
                    className="rounded-lg shadow-lg w-full h-auto" 
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Sustainability Initiatives with Background */}
        <section className="relative py-16 md:py-24">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-fixed"
            style={{
              backgroundImage: `url('/lovable-uploads/d62803b2-29ff-445f-9f31-a0cd95d8e6cc.png')`,
            }}
          />
          <div className="container mx-auto relative z-10 px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white drop-shadow-lg">Our Sustainability Initiatives</h2>
              <p className="text-lg text-white/90 drop-shadow">
                Discover how we're implementing green practices across our operations to build a more sustainable logistics ecosystem
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {sustainabilityInitiatives.map((initiative, index) => (
                <Card key={index} className="bg-black/20 backdrop-blur-sm shadow-md hover:shadow-xl transition-shadow duration-300 h-full border border-white/10">
                  <CardContent className="p-6">
                    <div className="bg-sarva-blue/30 backdrop-blur-sm p-4 rounded-full w-16 h-16 flex items-center justify-center mb-4 border border-white/20">
                      {initiative.icon}
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-white drop-shadow">{initiative.title}</h3>
                    <p className="text-white/80 mb-4 drop-shadow">{initiative.description}</p>
                    <div className="mt-auto">
                      <div className="bg-sarva-blue/30 backdrop-blur-sm p-3 rounded-md text-white font-medium border border-white/20">
                        {initiative.metrics}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
        
        {/* Green Logistics Feature */}
        <section className="relative py-16 md:py-24">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-fixed"
            style={{
              backgroundImage: `url('/lovable-uploads/27677ec8-b519-47dd-b3f5-0a7d6a7d8f8b.png')`,
            }}
          />
          <div className="container mx-auto relative z-10 px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-1 bg-black/20 backdrop-blur-sm p-8 rounded-lg shadow-lg border border-white/10">
                <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white drop-shadow-lg">Green Logistics in Action</h2>
                <p className="text-lg text-white/90 drop-shadow">
                  See how our sustainability commitments translate into real-world actions and measurable impacts across our operations.
                </p>
                <div className="mt-8">
                  <Button asChild>
                    <Link to="/contact">
                      Learn About Our Green Solutions <ArrowRight className="ml-2" />
                    </Link>
                  </Button>
                </div>
              </div>
              <div className="md:col-span-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="bg-black/20 backdrop-blur-sm p-6 rounded-lg shadow-lg border border-white/10">
                    <h3 className="text-xl font-bold mb-3 text-white drop-shadow">Electric Fleet Transition</h3>
                    <p className="text-white/80 mb-4 drop-shadow">
                      We're gradually transitioning our delivery fleet to electric vehicles, focusing initially on last-mile deliveries in urban areas.
                    </p>
                    <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                      <div className="bg-sarva-blue h-full" style={{width: '35%'}}></div>
                    </div>
                    <div className="flex justify-between mt-2 text-sm">
                      <span className="font-medium text-white/90">Progress: 35%</span>
                      <span className="text-white/70">Target: 75% by 2028</span>
                    </div>
                  </div>
                  
                  <div className="bg-black/20 backdrop-blur-sm p-6 rounded-lg shadow-lg border border-white/10">
                    <h3 className="text-xl font-bold mb-3 text-white drop-shadow">Sustainable Packaging</h3>
                    <p className="text-white/80 mb-4 drop-shadow">
                      We've introduced eco-friendly packaging options and are working to minimize overall packaging usage in our operations.
                    </p>
                    <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                      <div className="bg-sarva-blue h-full" style={{width: '60%'}}></div>
                    </div>
                    <div className="flex justify-between mt-2 text-sm">
                      <span className="font-medium text-white/90">Progress: 60%</span>
                      <span className="text-white/70">Target: 90% by 2026</span>
                    </div>
                  </div>
                  
                  <div className="bg-black/20 backdrop-blur-sm p-6 rounded-lg shadow-lg border border-white/10">
                    <h3 className="text-xl font-bold mb-3 text-white drop-shadow">Renewable Energy</h3>
                    <p className="text-white/80 mb-4 drop-shadow">
                      Our facilities are being upgraded with solar panels and other renewable energy sources to reduce grid dependency.
                    </p>
                    <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                      <div className="bg-sarva-blue h-full" style={{width: '25%'}}></div>
                    </div>
                    <div className="flex justify-between mt-2 text-sm">
                      <span className="font-medium text-white/90">Progress: 25%</span>
                      <span className="text-white/70">Target: 50% by 2027</span>
                    </div>
                  </div>
                  
                  <div className="bg-black/20 backdrop-blur-sm p-6 rounded-lg shadow-lg border border-white/10">
                    <h3 className="text-xl font-bold mb-3 text-white drop-shadow">Waste Reduction</h3>
                    <p className="text-white/80 mb-4 drop-shadow">
                      We've implemented comprehensive waste management and recycling programs across all our facilities.
                    </p>
                    <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                      <div className="bg-sarva-blue h-full" style={{width: '80%'}}></div>
                    </div>
                    <div className="flex justify-between mt-2 text-sm">
                      <span className="font-medium text-white/90">Progress: 80%</span>
                      <span className="text-white/70">Target: 95% by 2025</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Sustainability Partnerships */}
        <section className="relative py-16 md:py-24">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-fixed"
            style={{
              backgroundImage: `url('/lovable-uploads/b809a650-9323-47d6-88ec-a9eef8de5978.png')`,
            }}
          />
          <div className="container mx-auto relative z-10 px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white drop-shadow-lg">Our Partnerships for a Sustainable Future</h2>
              <p className="text-lg text-white/90 drop-shadow">
                We collaborate with organizations that share our commitment to environmental stewardship and sustainable development
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="bg-black/20 backdrop-blur-sm p-6 rounded-lg shadow-md flex items-center justify-center border border-white/10">
                  <div className="h-16 w-full bg-white/20 rounded flex items-center justify-center text-white/70">
                    Partner Logo
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-12 text-center">
              <div className="bg-black/20 backdrop-blur-sm p-8 rounded-lg shadow-lg max-w-4xl mx-auto border border-white/10">
                <p className="text-lg mb-6 text-white/90 drop-shadow">
                  Interested in collaborating on sustainability initiatives? We're always open to partnering with organizations that share our vision for a greener future.
                </p>
                <Button asChild>
                  <Link to="/contact">
                    Become a Sustainability Partner <ArrowRight className="ml-2" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
        
        {/* Testimonials */}
        <section className="relative py-16 md:py-24">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-fixed"
            style={{
              backgroundImage: `url('/lovable-uploads/6db7704c-a866-40b9-9069-9d0efc32646e.png')`,
            }}
          />
          <div className="container mx-auto relative z-10 px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white drop-shadow-lg">What Our Partners Say</h2>
              <p className="text-lg text-white/90 drop-shadow">
                Hear from businesses who have benefited from our sustainable logistics solutions
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="bg-black/20 backdrop-blur-sm shadow-md hover:shadow-xl transition-shadow duration-300 border border-white/10">
                <CardContent className="p-8">
                  <div className="flex items-center mb-6">
                    <div className="w-16 h-16 bg-white/20 rounded-full mr-4"></div>
                    <div>
                      <h3 className="text-lg font-bold text-white drop-shadow">Greenleaf Organics</h3>
                      <p className="text-white/70">Sustainable Food Producer</p>
                    </div>
                  </div>
                  <p className="text-lg text-white/80 italic mb-6 drop-shadow">
                    "Sarva Express's commitment to sustainable logistics has helped us reduce our carbon footprint while maintaining the integrity of our organic products. Their temperature-controlled fleet ensures our products reach consumers in perfect condition."
                  </p>
                  <p className="text-white/70 font-medium">- Amit Sharma, CEO</p>
                </CardContent>
              </Card>
              
              <Card className="bg-black/20 backdrop-blur-sm shadow-md hover:shadow-xl transition-shadow duration-300 border border-white/10">
                <CardContent className="p-8">
                  <div className="flex items-center mb-6">
                    <div className="w-16 h-16 bg-white/20 rounded-full mr-4"></div>
                    <div>
                      <h3 className="text-lg font-bold text-white drop-shadow">EcoTech Solutions</h3>
                      <p className="text-white/70">Renewable Energy Equipment Manufacturer</p>
                    </div>
                  </div>
                  <p className="text-lg text-white/80 italic mb-6 drop-shadow">
                    "As a company focused on renewable energy solutions, we needed a logistics partner that shares our environmental values. Sarva Express not only provides excellent service but also demonstrates real commitment to sustainable practices."
                  </p>
                  <p className="text-white/70 font-medium">- Priya Patel, Operations Director</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
        
        {/* CTA Section with Background */}
        <section className="relative py-16 md:py-24 text-white text-center">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-fixed" 
            style={{ 
              backgroundImage: `url('/lovable-uploads/c0dd1d79-3245-4a61-891b-8c85bc695b4a.png')` 
            }}
          />
          <div className="container mx-auto relative z-10 px-4">
            <div className="bg-sarva-blue-dark/70 backdrop-blur-sm p-12 rounded-lg shadow-lg max-w-4xl mx-auto border border-white/10">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 drop-shadow-lg">Partner with Us for Sustainable Logistics</h2>
              <p className="text-lg mb-8 opacity-90 drop-shadow">
                Join us on our sustainability journey. Discover how our green logistics solutions can help your business reduce its environmental footprint.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button size="lg" className="bg-white text-sarva-blue-dark hover:bg-gray-100" asChild>
                  <Link to="/contact">
                    Contact Our Sustainability Team <ArrowRight className="ml-2" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" className="bg-transparent border-white text-white hover:bg-white hover:text-sarva-blue-dark" asChild>
                  <Link to="/solutions">
                    Explore Green Solutions
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

export default Sustainability;
