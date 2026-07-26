
import React from "react";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import QuoteForm from "@/components/QuoteForm";
import { MapPin, Phone, Mail, Clock } from "lucide-react";

const Contact = () => {
  return (
    <>
      <Helmet>
        <title>Contact Us | Sarva Express</title>
        <meta name="description" content="Get in touch with Sarva Express for all your logistics needs. Contact us for quotes, support, or partnership opportunities." />
      </Helmet>
      
      <Navbar />
      
      <main>
        {/* Hero Section */}
        <section className="relative bg-sarva-blue-dark py-24 md:py-32">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-fixed"
            style={{
              backgroundImage: `url('/lovable-uploads/21c80ee5-d1c8-4182-9286-1cc00db1e858.png')`,
            }}
          />
          <div className="container mx-auto relative z-10 text-center px-4">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 drop-shadow-lg">
              Contact Us
            </h1>
            <p className="text-lg md:text-xl text-white/90 max-w-3xl mx-auto drop-shadow">
              Ready to streamline your logistics? Get in touch with our experts today.
            </p>
          </div>
        </section>

        {/* Contact Form Section */}
        <section className="py-16 md:py-24 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Quote Form */}
              <div>
                <h2 className="text-3xl font-bold mb-6 text-sarva-blue-dark">Get a Quote</h2>
                <p className="text-lg text-gray-700 mb-8">
                  Fill out the form below to request a quote for our logistics services.
                </p>
                <QuoteForm />
              </div>
              
              {/* Contact Information */}
              <div>
                <h2 className="text-3xl font-bold mb-6 text-sarva-blue-dark">Contact Information</h2>
                <p className="text-lg text-gray-700 mb-6">
                  Reach out to us through the following channels:
                </p>
                
                <div className="space-y-4">
                  <div className="flex items-center">
                    <MapPin className="w-5 h-5 text-sarva-blue mr-4" />
                    <div>
                      <h3 className="font-semibold text-gray-700">Address:</h3>
                      <p className="text-gray-600">
                        123 Sarva Express HQ, Logistics Hub, India
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <Phone className="w-5 h-5 text-sarva-blue mr-4" />
                    <div>
                      <h3 className="font-semibold text-gray-700">Phone:</h3>
                      <p className="text-gray-600">+91 9876543210</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <Mail className="w-5 h-5 text-sarva-blue mr-4" />
                    <div>
                      <h3 className="font-semibold text-gray-700">Email:</h3>
                      <p className="text-gray-600">info@sarvaexpress.com</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <Clock className="w-5 h-5 text-sarva-blue mr-4" />
                    <div>
                      <h3 className="font-semibold text-gray-700">Business Hours:</h3>
                      <p className="text-gray-600">
                        Mon-Fri: 9:00 AM - 6:00 PM (IST)
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Customer Support Section */}
        <section className="py-16 md:py-24 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-6 text-sarva-blue-dark">Customer Support</h2>
              <p className="text-lg text-gray-700 max-w-3xl mx-auto">
                We're here to help! Contact our customer support team for any inquiries or assistance.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* FAQ */}
              <div className="bg-gray-50 p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-4 text-sarva-blue-dark">FAQ</h3>
                <p className="text-gray-600">
                  Find answers to common questions about our services and processes.
                </p>
                <a href="/faq" className="text-sarva-blue hover:underline mt-4 inline-block">
                  Visit FAQ Page
                </a>
              </div>
              
              {/* Knowledge Base */}
              <div className="bg-gray-50 p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-4 text-sarva-blue-dark">Knowledge Base</h3>
                <p className="text-gray-600">
                  Explore our knowledge base for detailed guides and tutorials.
                </p>
                <a href="/knowledge-base" className="text-sarva-blue hover:underline mt-4 inline-block">
                  Browse Knowledge Base
                </a>
              </div>
              
              {/* Contact Support */}
              <div className="bg-gray-50 p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-4 text-sarva-blue-dark">Contact Support</h3>
                <p className="text-gray-600">
                  Need personalized assistance? Contact our support team directly.
                </p>
                <a href="/support" className="text-sarva-blue hover:underline mt-4 inline-block">
                  Contact Support
                </a>
              </div>
            </div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="py-16 md:py-24 bg-sarva-blue-dark text-white text-center">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-6">Ready to Transform Your Logistics?</h2>
            <p className="text-lg mb-8 max-w-3xl mx-auto opacity-90">
              Contact Sarva Express today and discover how our tailored logistics solutions can drive your business forward.
            </p>
            <a href="/quote" className="bg-white text-sarva-blue-dark py-3 px-8 rounded-md font-semibold hover:bg-gray-100 inline-block">
              Get a Free Quote
            </a>
          </div>
        </section>
      </main>
      
      <Footer />
    </>
  );
};

export default Contact;
