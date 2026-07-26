import React from "react";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ArrowRight, Award, Clock, Globe, Shield, Target, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";

const About = () => {
  return (
    <>
      <Helmet>
        <title>About Us | Sarva Express</title>
        <meta name="description" content="Learn about Sarva Express's journey, mission, vision, and values as India's trusted logistics partner" />
      </Helmet>
      
      <Navbar />
      
      <main>
        {/* Hero Banner */}
        <section 
          className="relative bg-sarva-blue-dark py-24 md:py-32"
          style={{
            backgroundImage: `url('/lovable-uploads/fad3a28a-03a6-407e-9d98-aac85d938c36.png')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-black/60"></div>
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMwMDAiIGZpbGwtb3BhY2l0eT0iLjAyIj48cGF0aCBkPSJNMzYgMzRoLTJ2LTRoMnY0em0wLTZoLTJ2LTRoMnY0em0wLTZoLTJWNGgydjEyem0tNiA4aC00di0yaDR2MnptLTYgMGgtNHYtMmg0djJ6bTE4LThoLTR2LTJoNHYyem0tMTIgMGgtNHYtMmg0djJ6bTYgMGgtNHYtMmg0djJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-10"></div>
          <div className="container mx-auto relative z-10 text-center px-4">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 opacity-0 animate-fade-in" style={{animationDelay: '0.2s'}}>
              Our Story
            </h1>
            <p className="text-lg md:text-xl text-white/90 max-w-3xl mx-auto mb-8 opacity-0 animate-fade-in" style={{animationDelay: '0.4s'}}>
              The journey that led us to become India's trusted logistics partner
            </p>
          </div>
        </section>
        
        {/* Our Journey Section */}
        <section className="relative py-16 md:py-24">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-fixed"
            style={{
              backgroundImage: `url('/lovable-uploads/21c80ee5-d1c8-4182-9286-1cc00db1e858.png')`,
            }}
          />
          <div className="container mx-auto relative z-10 px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="order-2 lg:order-1">
                <div className="bg-white/90 backdrop-blur-sm p-8 rounded-lg shadow-lg">
                  <h2 className="text-3xl md:text-4xl font-bold mb-6 text-sarva-blue-dark">Our Journey</h2>
                  <p className="text-lg mb-6 text-gray-700">
                    At Sarva Express, we bring over a decade of expertise in the logistics industry. While our journey under the Sarva Express name began in 2020, our foundation was laid in 2015, operating under a distinct brand.
                  </p>
                  <p className="text-lg mb-6 text-gray-700">
                    Over the years, we have grown into a trusted provider of efficient, reliable, and customer-centric logistics solutions across the country.
                  </p>
                  <p className="text-lg mb-6 text-gray-700">
                    With 10 years of experience, a strong nationwide network, and a commitment to excellence, we specialize in delivering seamless transportation, freight forwarding, supply chain management, and express delivery solutions.
                  </p>
                  <p className="text-lg font-semibold text-sarva-blue">
                    At Sarva Express, we don't just move shipments—we drive success.
                  </p>
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <div className="relative">
                  <div className="bg-white/90 backdrop-blur-sm p-6 rounded-lg shadow-lg">
                    <img 
                      src="https://images.unsplash.com/photo-1494412519320-aa613dfb7738?auto=format&fit=crop&q=80"
                      alt="Sarva Express Timeline" 
                      className="rounded-lg shadow-lg w-full h-auto" 
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Mission, Vision, Values Section */}
        <section className="relative py-16 md:py-24">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-fixed"
            style={{
              backgroundImage: `url('/lovable-uploads/b809a650-9323-47d6-88ec-a9eef8de5978.png')`,
            }}
          />
          <div className="container mx-auto relative z-10 px-4">
            <div className="text-center mb-16">
              <div className="bg-white/90 backdrop-blur-sm p-8 rounded-lg shadow-lg max-w-4xl mx-auto">
                <h2 className="text-3xl md:text-4xl font-bold mb-6 text-sarva-blue-dark">Mission, Vision & Values</h2>
                <p className="text-lg text-gray-700">
                  Our guiding principles shape everything we do at Sarva Express, from daily operations to long-term strategic decisions.
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="bg-white shadow-md hover:shadow-xl transition-shadow duration-300 h-full">
                <CardContent className="p-6">
                  <div className="bg-sarva-blue/10 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                    <Target className="w-8 h-8 text-sarva-blue" />
                  </div>
                  <h3 className="text-xl font-bold mb-4 text-sarva-blue-dark">Our Mission</h3>
                  <p className="text-gray-700">
                    To provide businesses with hassle-free logistics, ensuring their cargo moves swiftly and securely to its destination, while driving growth through innovative and sustainable supply chain solutions.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-white shadow-md hover:shadow-xl transition-shadow duration-300 h-full">
                <CardContent className="p-6">
                  <div className="bg-sarva-orange/10 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                    <Globe className="w-8 h-8 text-sarva-orange" />
                  </div>
                  <h3 className="text-xl font-bold mb-4 text-sarva-blue-dark">Our Vision</h3>
                  <p className="text-gray-700">
                    To be India's most trusted and customer-centric logistics partner, known for operational excellence, technological innovation, and sustainable practices that contribute positively to our clients, community, and environment.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-white shadow-md hover:shadow-xl transition-shadow duration-300 h-full">
                <CardContent className="p-6">
                  <div className="bg-sarva-blue-light p-4 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                    <Award className="w-8 h-8 text-sarva-blue-dark" />
                  </div>
                  <h3 className="text-xl font-bold mb-4 text-sarva-blue-dark">Our Values</h3>
                  <ul className="text-gray-700 space-y-2">
                    <li className="flex items-start">
                      <span className="text-sarva-orange font-bold mr-2">•</span>
                      <span>Customer First: We prioritize customer needs above all else.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-sarva-orange font-bold mr-2">•</span>
                      <span>Innovation: We continuously evolve our solutions.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-sarva-orange font-bold mr-2">•</span>
                      <span>Integrity: We operate with transparency and ethical standards.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-sarva-orange font-bold mr-2">•</span>
                      <span>Excellence: We strive for operational perfection in every delivery.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-sarva-orange font-bold mr-2">•</span>
                      <span>Sustainability: We commit to environmentally responsible practices.</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
        
        {/* Leadership Team */}
        <section className="py-16 md:py-24 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-sarva-blue-dark">Our Leadership</h2>
              <p className="text-lg max-w-3xl mx-auto text-gray-700">
                Meet the experienced team driving Sarva Express forward with vision and expertise.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  name: "Rajesh Sharma",
                  position: "Chief Executive Officer",
                  image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80",
                  description: "With 20+ years in logistics, Rajesh leads Sarva Express with strategic vision and industry expertise."
                },
                {
                  name: "Priya Mehta",
                  position: "Chief Operations Officer",
                  image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80",
                  description: "Priya oversees our nationwide operations, ensuring excellent service delivery and operational efficiency."
                },
                {
                  name: "Vikram Singh",
                  position: "Chief Technology Officer",
                  image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80",
                  description: "Vikram leads our digital transformation, implementing innovative tech solutions for logistics excellence."
                }
              ].map((leader, index) => (
                <Card key={index} className="bg-white shadow-md hover:shadow-xl transition-shadow duration-300">
                  <CardContent className="p-0">
                    <img 
                      src={leader.image} 
                      alt={leader.name} 
                      className="w-full h-64 object-cover object-center" 
                    />
                    <div className="p-6">
                      <h3 className="text-xl font-bold mb-1 text-sarva-blue-dark">{leader.name}</h3>
                      <p className="text-sarva-orange font-medium mb-4">{leader.position}</p>
                      <p className="text-gray-700">{leader.description}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
        
        {/* Key Achievements */}
        <section className="relative py-16 md:py-24">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-fixed"
            style={{
              backgroundImage: `url('/lovable-uploads/6db7704c-a866-40b9-9069-9d0efc32646e.png')`,
            }}
          />
          <div className="container mx-auto relative z-10 px-4">
            <div className="text-center mb-16">
              <div className="bg-white/90 backdrop-blur-sm p-8 rounded-lg shadow-lg max-w-4xl mx-auto">
                <h2 className="text-3xl md:text-4xl font-bold mb-6 text-sarva-blue-dark">Key Milestones</h2>
                <p className="text-lg text-gray-700">
                  Our journey of growth and excellence in the logistics industry
                </p>
              </div>
            </div>
            
            <div className="bg-white/90 backdrop-blur-sm p-8 rounded-lg shadow-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {[
                  {
                    year: 2015,
                    title: "Foundation",
                    icon: <Clock className="w-6 h-6 text-white" />,
                    description: "Started operations under our previous brand name"
                  },
                  {
                    year: 2017,
                    title: "Expansion",
                    icon: <Globe className="w-6 h-6 text-white" />,
                    description: "Expanded to 5 major Indian cities with dedicated warehouses"
                  },
                  {
                    year: 2019,
                    title: "Innovation",
                    icon: <Target className="w-6 h-6 text-white" />,
                    description: "Launched proprietary logistics tracking technology"
                  },
                  {
                    year: 2020,
                    title: "Rebranding",
                    icon: <Award className="w-6 h-6 text-white" />,
                    description: "Rebranded as Sarva Express with enhanced service offerings"
                  },
                  {
                    year: 2021,
                    title: "Partnerships",
                    icon: <Shield className="w-6 h-6 text-white" />,
                    description: "Formed strategic partnerships with major e-commerce players"
                  },
                  {
                    year: 2023,
                    title: "Nationwide",
                    icon: <Truck className="w-6 h-6 text-white" />,
                    description: "Achieved pan-India coverage with presence in 20+ states"
                  }
                ].map((milestone, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="bg-sarva-blue rounded-full w-12 h-12 flex items-center justify-center flex-shrink-0">
                      {milestone.icon}
                    </div>
                    <div>
                      <span className="text-sarva-orange font-bold">{milestone.year}</span>
                      <h3 className="text-xl font-bold mb-2 text-sarva-blue-dark">{milestone.title}</h3>
                      <p className="text-gray-700">{milestone.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="py-16 md:py-24 bg-sarva-blue-dark text-white text-center">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Experience Logistics Excellence?</h2>
            <p className="text-lg mb-8 max-w-3xl mx-auto opacity-90">
              Partner with Sarva Express for seamless, efficient, and reliable logistics solutions tailored to your business needs.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button size="lg" asChild>
                <Link to="/contact">
                  Contact Us <ArrowRight className="ml-2" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="bg-transparent border-white text-white hover:bg-white hover:text-sarva-blue-dark" asChild>
                <Link to="/solutions">
                  Explore Solutions
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

export default About;
