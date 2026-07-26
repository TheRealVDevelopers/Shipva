
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { SubCategory, Solution } from "./SolutionTypes";

interface SolutionCTAProps {
  solution: Solution;
  subSolution?: SubCategory | null;
}

const SolutionCTA: React.FC<SolutionCTAProps> = ({ solution, subSolution }) => {
  return (
    <section className="py-16 md:py-20 bg-sarva-blue-dark text-white text-center">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Optimize Your Logistics?</h2>
        <p className="text-lg mb-8 max-w-3xl mx-auto opacity-90">
          Contact us today to discuss your specific requirements and discover how our {subSolution ? subSolution.title.toLowerCase() : solution.title.toLowerCase()} solutions can benefit your business.
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
    </section>
  );
};

export default SolutionCTA;
