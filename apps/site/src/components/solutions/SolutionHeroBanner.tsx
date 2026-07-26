
import React from "react";
import { SubCategory, Solution } from "./SolutionTypes";

interface SolutionHeroBannerProps {
  solution: Solution;
  subSolution?: SubCategory | null;
}

const SolutionHeroBanner: React.FC<SolutionHeroBannerProps> = ({ solution, subSolution }) => {
  const fallbackImage = "https://images.unsplash.com/photo-1565107461944-2e607bc8539c?auto=format&fit=crop&q=80&w=1200";
  
  return (
    <section className="relative py-24 md:py-32 min-h-[60vh] flex items-center">
      <div 
        className="absolute inset-0 bg-cover bg-center bg-fixed" 
        style={{ 
          backgroundImage: `url(${subSolution?.image || solution.image || fallbackImage})` 
        }}
      />
      <div className="container mx-auto relative z-10 text-center px-4">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 drop-shadow-2xl">
          {subSolution ? subSolution.title : solution.title}
        </h1>
        <p className="text-lg md:text-xl text-white/95 max-w-3xl mx-auto mb-8 drop-shadow-lg">
          {subSolution ? subSolution.description : solution.description}
        </p>
      </div>
    </section>
  );
};

export default SolutionHeroBanner;
