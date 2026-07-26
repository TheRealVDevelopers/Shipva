
import React from "react";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ArrowRight, Clock, MapPin, Briefcase, CircleDollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";

const Careers = () => {
  const openPositions = [
    {
      id: "driver",
      title: "Delivery Driver",
      location: "Mumbai, Maharashtra",
      department: "Operations",
      type: "Full-time",
      experience: "1-2 years",
      salary: "₹2.5 - ₹3.5 LPA",
      description: "We are looking for a responsible Delivery Driver to distribute products promptly to our customers. You will represent our company in a professional and cost-effective manner to increase profitability and customer satisfaction.",
      responsibilities: [
        "Deliver a wide variety of items to different addresses and through different routes",
        "Follow route and time schedule",
        "Load, unload, prepare, inspect and operate a delivery vehicle",
        "Ask for feedback on provided services and resolve clients’ complaints",
        "Collect payments",
      ],
      requirements: [
        "Proven working experience as a Delivery Driver",
        "Valid professional driver’s license",
        "Ability to operate forklifts and tractors in a variety of weather and traffic conditions",
        "Excellent organizational and time management skills",
        "Good driving record with no traffic violations",
      ],
    },
    {
      id: "warehouse-associate",
      title: "Warehouse Associate",
      location: "Delhi NCR, Haryana",
      department: "Logistics",
      type: "Full-time",
      experience: "0-1 year",
      salary: "₹1.8 - ₹2.4 LPA",
      description: "We are looking for a motivated Warehouse Associate to participate in our warehouse operations and activities. Warehouse Associate responsibilities include storing materials, picking, packing and scanning orders.",
      responsibilities: [
        "Prepare and complete orders for delivery or pickup according to schedule (load, pack, wrap, label, ship)",
        "Receive and process warehouse stock products (pick, unload, label, store)",
        "Perform inventory controls and keep quality standards high for audits",
        "Keep a clean and safe working environment and optimise space utilisation",
        "Operate and maintain preventively warehouse vehicles and equipment",
      ],
      requirements: [
        "Proven working experience as a Warehouse Associate",
        "Familiarity with modern warehousing practices and methods",
        "Good organisational and time management skills",
        "Ability to lift heavy objects",
        "High school degree",
      ],
    },
    {
      id: "customer-service",
      title: "Customer Service Representative",
      location: "Bengaluru, Karnataka",
      department: "Customer Support",
      type: "Full-time",
      experience: "2-3 years",
      salary: "₹3.0 - ₹4.0 LPA",
      description: "We are looking for a skilled Customer Service Representative to provide excellent customer service and to promote this idea throughout the organisation. The goal is to keep the department running in an efficient and profitable manner, to increase customer satisfaction, loyalty and retention and to meet their expectations.",
      responsibilities: [
        "Manage incoming calls and customer service inquiries",
        "Generate sales leads",
        "Identify and assess customers’ needs to achieve satisfaction",
        "Build sustainable relationships and trust with customer accounts through open and interactive communication",
        "Provide accurate, valid and complete information by using the right methods/tools",
      ],
      requirements: [
        "Proven customer support experience or experience as a Client Service Representative",
        "Strong phone contact handling skills and active listening",
        "Familiarity with CRM systems and practices",
        "Customer orientation and ability to adapt/respond to different types of characters",
        "Excellent communication and presentation skills",
      ],
    },
  ];

  return (
    <>
      <Helmet>
        <title>Careers | Sarva Express</title>
        <meta name="description" content="Join Sarva Express and explore exciting career opportunities in logistics, transportation, and supply chain management. Find your dream job with us!" />
      </Helmet>
      
      <Navbar />
      
      <main>
        {/* Hero Banner */}
        <section className="relative py-24 md:py-32">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-fixed"
            style={{
              backgroundImage: `url('/lovable-uploads/7878122d-1189-4912-8d36-f2bcad50bd82.png')`,
            }}
          />
          <div className="container mx-auto relative z-10 text-center px-4">
            <div className="bg-white/90 backdrop-blur-sm p-12 rounded-lg shadow-lg max-w-4xl mx-auto">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-sarva-blue-dark mb-6 opacity-0 animate-fade-in" style={{animationDelay: '0.2s'}}>
                Join Our Team
              </h1>
              <p className="text-lg md:text-xl text-gray-700 max-w-3xl mx-auto mb-8 opacity-0 animate-fade-in" style={{animationDelay: '0.4s'}}>
                Explore exciting career opportunities at Sarva Express and help us redefine logistics
              </p>
            </div>
          </div>
        </section>
        
        {/* Why Sarva Express Section */}
        <section className="py-16 md:py-24 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-sarva-blue-dark">Why Choose Sarva Express?</h2>
              <p className="text-lg max-w-3xl mx-auto text-gray-700">
                At Sarva Express, we believe our people are our greatest asset. We offer a dynamic and inclusive work environment where innovation, collaboration, and growth are not just encouraged—they're expected.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="bg-white shadow-md hover:shadow-xl transition-shadow duration-300">
                <CardContent className="p-6 text-center">
                  <div className="bg-sarva-blue/10 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <Briefcase className="w-8 h-8 text-sarva-blue" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-sarva-blue-dark">Career Growth</h3>
                  <p className="text-gray-700">
                    Opportunities for advancement and professional development
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-white shadow-md hover:shadow-xl transition-shadow duration-300">
                <CardContent className="p-6 text-center">
                  <div className="bg-sarva-blue/10 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <CircleDollarSign className="w-8 h-8 text-sarva-blue" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-sarva-blue-dark">Competitive Benefits</h3>
                  <p className="text-gray-700">
                    Comprehensive health, financial, and wellness packages
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-white shadow-md hover:shadow-xl transition-shadow duration-300">
                <CardContent className="p-6 text-center">
                  <div className="bg-sarva-blue/10 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-8 h-8 text-sarva-blue" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-sarva-blue-dark">Work-Life Balance</h3>
                  <p className="text-gray-700">
                    Flexible work arrangements and a supportive culture
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
        
        {/* Open Positions Section */}
        <section className="py-16 md:py-24 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-sarva-blue-dark">Current Openings</h2>
              <p className="text-lg max-w-3xl mx-auto text-gray-700">
                Explore our current job openings and find the perfect fit for your skills and ambitions
              </p>
            </div>
            
            <Tabs defaultValue={openPositions[0].id} className="w-full">
              <TabsList className="flex justify-center space-x-4">
                {openPositions.map((position) => (
                  <TabsTrigger key={position.id} value={position.id} className="data-[state=active]:bg-sarva-blue data-[state=active]:text-white">
                    {position.title}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {openPositions.map((position) => (
                <TabsContent key={position.id} value={position.id} className="mt-8">
                  <Card className="bg-white shadow-md">
                    <CardContent className="p-8">
                      <div className="md:flex md:justify-between md:items-center mb-6">
                        <div>
                          <h3 className="text-2xl font-bold text-sarva-blue-dark mb-2">{position.title}</h3>
                          <p className="text-gray-700">
                            <MapPin className="inline-block w-4 h-4 mr-1" /> {position.location}
                          </p>
                        </div>
                        <div className="mt-4 md:mt-0">
                          <Button>
                            Apply Now <ArrowRight className="ml-2" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                          <h4 className="text-xl font-semibold text-sarva-blue mb-2">Department</h4>
                          <p className="text-gray-700">{position.department}</p>
                        </div>
                        <div>
                          <h4 className="text-xl font-semibold text-sarva-blue mb-2">Job Type</h4>
                          <p className="text-gray-700">{position.type}</p>
                        </div>
                        <div>
                          <h4 className="text-xl font-semibold text-sarva-blue mb-2">Experience</h4>
                          <p className="text-gray-700">{position.experience}</p>
                        </div>
                        <div>
                          <h4 className="text-xl font-semibold text-sarva-blue mb-2">Salary</h4>
                          <p className="text-gray-700">{position.salary}</p>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-xl font-semibold text-sarva-blue mb-2">Job Description</h4>
                        <p className="text-gray-700 mb-4">{position.description}</p>
                        
                        <h4 className="text-xl font-semibold text-sarva-blue mb-2">Responsibilities</h4>
                        <ul className="list-disc list-inside text-gray-700 mb-4">
                          {position.responsibilities.map((responsibility, index) => (
                            <li key={index}>{responsibility}</li>
                          ))}
                        </ul>
                        
                        <h4 className="text-xl font-semibold text-sarva-blue mb-2">Requirements</h4>
                        <ul className="list-disc list-inside text-gray-700">
                          {position.requirements.map((requirement, index) => (
                            <li key={index}>{requirement}</li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </section>
        
        {/* Benefits Section */}
        <section className="py-16 md:py-24 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-sarva-blue-dark">Our Employee Benefits</h2>
              <p className="text-lg max-w-3xl mx-auto text-gray-700">
                We care about our employees and offer a comprehensive benefits package to support their well-being and success
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  title: "Health & Wellness",
                  description: "Comprehensive health insurance, wellness programs, and mental health support",
                  icon: <Briefcase className="w-6 h-6 text-sarva-blue" />
                },
                {
                  title: "Financial Security",
                  description: "Competitive salaries, retirement plans, and financial planning resources",
                  icon: <CircleDollarSign className="w-6 h-6 text-sarva-blue" />
                },
                {
                  title: "Paid Time Off",
                  description: "Generous vacation, sick leave, and holidays to recharge and relax",
                  icon: <Clock className="w-6 h-6 text-sarva-blue" />
                },
                {
                  title: "Professional Development",
                  description: "Opportunities for training, certifications, and career advancement",
                  icon: <Briefcase className="w-6 h-6 text-sarva-blue" />
                },
                {
                  title: "Employee Discounts",
                  description: "Discounts on company products and services, as well as partner programs",
                  icon: <CircleDollarSign className="w-6 h-6 text-sarva-blue" />
                },
                {
                  title: "Family Support",
                  description: "Parental leave, childcare assistance, and family-friendly policies",
                  icon: <Clock className="w-6 h-6 text-sarva-blue" />
                },
              ].map((benefit, index) => (
                <Card key={index} className="bg-white shadow-md hover:shadow-xl transition-shadow duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center mb-4">
                      <div className="bg-sarva-blue/10 p-3 rounded-full mr-4">
                        {benefit.icon}
                      </div>
                      <h3 className="text-xl font-bold text-sarva-blue-dark">{benefit.title}</h3>
                    </div>
                    <p className="text-gray-700">{benefit.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
        
        {/* How to Apply Section */}
        <section className="py-16 md:py-24 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-sarva-blue-dark">How to Apply</h2>
              <p className="text-lg max-w-3xl mx-auto text-gray-700">
                Ready to take the next step? Here’s how to apply for a position at Sarva Express
              </p>
            </div>
            
            <div className="max-w-2xl mx-auto space-y-6">
              <Card className="bg-white shadow-md hover:shadow-xl transition-shadow duration-300">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-4 text-sarva-blue-dark">1. Explore Open Positions</h3>
                  <p className="text-gray-700">
                    Review our current job openings to find a role that matches your skills and interests.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-white shadow-md hover:shadow-xl transition-shadow duration-300">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-4 text-sarva-blue-dark">2. Submit Your Application</h3>
                  <p className="text-gray-700">
                    Click the "Apply Now" button on the job description page and complete the application form. Be sure to include your resume, cover letter, and any other relevant documents.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-white shadow-md hover:shadow-xl transition-shadow duration-300">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-4 text-sarva-blue-dark">3. Interview Process</h3>
                  <p className="text-gray-700">
                    If your application is selected, you will be contacted for an interview. Our interview process may include phone screenings, in-person interviews, and assessments.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-white shadow-md hover:shadow-xl transition-shadow duration-300">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-4 text-sarva-blue-dark">4. Onboarding</h3>
                  <p className="text-gray-700">
                    If you are offered a position, you will receive an offer letter and onboarding instructions. We’ll guide you through the onboarding process to ensure a smooth transition into your new role.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="py-16 md:py-24 bg-sarva-blue-dark text-white text-center">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Start Your Journey with Sarva Express</h2>
            <p className="text-lg mb-8 max-w-3xl mx-auto opacity-90">
              Join our team and be part of a company that’s shaping the future of logistics
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button size="lg" className="bg-white text-sarva-blue-dark hover:bg-gray-100">
                Explore Open Positions <ArrowRight className="ml-2" />
              </Button>
              <Button variant="outline" size="lg" className="bg-transparent border-white text-white hover:bg-white hover:text-sarva-blue-dark" asChild>
                <Link to="/contact">
                  Contact Our HR Team
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

export default Careers;
