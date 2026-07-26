
import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { toast } from 'sonner';

const QuoteForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    pickupLocation: '',
    deliveryLocation: '',
    cargoType: '',
    weight: '',
    shippingMethod: '',
    urgency: 'normal',
    message: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Format WhatsApp message with form data
    const formattedMessage = `
*New Quote Request*
Name: ${formData.name}
Email: ${formData.email}
Phone: ${formData.phone}
Pickup: ${formData.pickupLocation}
Delivery: ${formData.deliveryLocation}
Cargo Type: ${formData.cargoType || 'Not specified'}
Weight: ${formData.weight || 'Not specified'}
Shipping Method: ${formData.shippingMethod || 'Not specified'}
Urgency: ${formData.urgency}
Message: ${formData.message || 'None'}
    `.trim();
    
    // Encode the message for WhatsApp URL
    const encodedMessage = encodeURIComponent(formattedMessage);
    
    // Open WhatsApp with the form data - using the specified number
    window.open(`https://wa.me/919740674867?text=${encodedMessage}`, '_blank');
    
    toast.success('Quote request submitted! Redirecting you to WhatsApp.');
    setIsSubmitting(false);
    setFormData({
      name: '',
      email: '',
      phone: '',
      pickupLocation: '',
      deliveryLocation: '',
      cargoType: '',
      weight: '',
      shippingMethod: '',
      urgency: 'normal',
      message: ''
    });
  };

  return (
    <section 
      id="quote" 
      className="section-padding bg-white relative"
      style={{
        backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.95)), url('/lovable-uploads/789a2b3c-4d56-7e89-0123-456789abcdef.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      <div className="container mx-auto">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-sarva-blue-dark mb-4">
              Get a Quote
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Fill out the form below, and our team will provide you with a customized quote tailored to your specific logistics needs.
            </p>
          </div>
          
          <div className="bg-gray-50 rounded-xl p-6 md:p-8 shadow-sm">
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name*
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-sarva-blue"
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address*
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-sarva-blue"
                />
              </div>
              
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number*
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-sarva-blue"
                />
              </div>
              
              <div>
                <label htmlFor="pickupLocation" className="block text-sm font-medium text-gray-700 mb-1">
                  Pickup Location*
                </label>
                <input
                  id="pickupLocation"
                  name="pickupLocation"
                  type="text"
                  required
                  value={formData.pickupLocation}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-sarva-blue"
                />
              </div>
              
              <div>
                <label htmlFor="deliveryLocation" className="block text-sm font-medium text-gray-700 mb-1">
                  Delivery Location*
                </label>
                <input
                  id="deliveryLocation"
                  name="deliveryLocation"
                  type="text"
                  required
                  value={formData.deliveryLocation}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-sarva-blue"
                />
              </div>
              
              <div>
                <label htmlFor="cargoType" className="block text-sm font-medium text-gray-700 mb-1">
                  Type of Cargo
                </label>
                <input
                  id="cargoType"
                  name="cargoType"
                  type="text"
                  value={formData.cargoType}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-sarva-blue"
                  placeholder="e.g. Electronics, Perishables, etc."
                />
              </div>
              
              <div>
                <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-1">
                  Estimated Weight/Volume
                </label>
                <input
                  id="weight"
                  name="weight"
                  type="text"
                  value={formData.weight}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-sarva-blue"
                  placeholder="e.g. 100 kg, 2 cubic meters"
                />
              </div>
              
              <div>
                <label htmlFor="shippingMethod" className="block text-sm font-medium text-gray-700 mb-1">
                  Preferred Shipping Method
                </label>
                <select
                  id="shippingMethod"
                  name="shippingMethod"
                  value={formData.shippingMethod}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-sarva-blue"
                >
                  <option value="">Select an option</option>
                  <option value="road">Road Transport</option>
                  <option value="rail">Rail Transport</option>
                  <option value="air">Air Freight</option>
                  <option value="sea">Sea Freight</option>
                  <option value="express">Express Delivery</option>
                  <option value="not_sure">Not Sure (Need Consultation)</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="urgency" className="block text-sm font-medium text-gray-700 mb-1">
                  Urgency Level
                </label>
                <select
                  id="urgency"
                  name="urgency"
                  value={formData.urgency}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-sarva-blue"
                >
                  <option value="normal">Normal</option>
                  <option value="urgent">Urgent (24-48 hours)</option>
                  <option value="very_urgent">Very Urgent (Same Day/Next Day)</option>
                </select>
              </div>
              
              <div className="md:col-span-2">
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Details
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={4}
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-sarva-blue"
                  placeholder="Please provide any specific requirements or questions"
                />
              </div>
              
              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-sarva-orange hover:bg-opacity-90 text-white py-3 px-6 rounded-md font-medium flex items-center justify-center disabled:opacity-70"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit Quote Request
                    </>
                  )}
                </button>
                
                <p className="text-xs text-gray-500 mt-2 text-center">
                  By submitting this form, you agree to our Privacy Policy and Terms of Service.
                </p>
              </div>
            </form>
          </div>
          
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-6 bg-sarva-blue-light rounded-lg">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-sarva-blue rounded-full text-white">
                  <Check className="h-5 w-5" />
                </div>
                <h3 className="ml-3 font-semibold text-sarva-blue-dark">Fast Response</h3>
              </div>
              <p className="text-gray-600">
                Get a detailed quote within 24 hours of submitting your request.
              </p>
            </div>
            
            <div className="p-6 bg-sarva-blue-light rounded-lg">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-sarva-blue rounded-full text-white">
                  <Check className="h-5 w-5" />
                </div>
                <h3 className="ml-3 font-semibold text-sarva-blue-dark">Custom Solutions</h3>
              </div>
              <p className="text-gray-600">
                Personalized logistics plans tailored to your specific needs.
              </p>
            </div>
            
            <div className="p-6 bg-sarva-blue-light rounded-lg">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-sarva-blue rounded-full text-white">
                  <Check className="h-5 w-5" />
                </div>
                <h3 className="ml-3 font-semibold text-sarva-blue-dark">Transparent Pricing</h3>
              </div>
              <p className="text-gray-600">
                Clear, detailed quotes with no hidden fees or surprises.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default QuoteForm;
