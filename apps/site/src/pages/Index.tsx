
import React from "react";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Services from "@/components/Services";
import AboutUs from "@/components/AboutUs";
import Stats from "@/components/Stats";
import TrackingSection from "@/components/TrackingSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <>
      <Helmet>
        <title>Sarva Express | Leading Logistics Solutions Provider in India</title>
        <meta name="description" content="Sarva Express provides comprehensive logistics solutions across India with excellence in transportation, warehousing, cold chain logistics, and supply chain management." />
        <meta name="keywords" content="logistics, supply chain, transportation, warehousing, cold chain logistics, India logistics, freight forwarding, 3PL" />
      </Helmet>
      
      <Navbar />
      <Hero />
      <Services />
      <AboutUs />
      <Stats />
      <TrackingSection />
      <Footer />
    </>
  );
};

export default Index;
