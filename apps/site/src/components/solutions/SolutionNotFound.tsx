
import React from "react";
import { Link } from "react-router-dom";
import Navbar from "../Navbar";
import Footer from "../Footer";

const SolutionNotFound: React.FC = () => {
  return (
    <>
      <Navbar />
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-6">Solution Not Found</h1>
          <p>The solution you are looking for does not exist.</p>
          <Link to="/solutions" className="text-sarva-blue hover:underline mt-4 inline-block">
            Back to Solutions
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default SolutionNotFound;
