
import React from "react";
import { SubCategory, Solution } from "./SolutionTypes";

interface SolutionContentProps {
  solution: Solution;
  subSolution?: SubCategory | null;
}

const SolutionContent: React.FC<SolutionContentProps> = ({ solution, subSolution }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-sarva-blue/10 p-3 rounded-full">
            {solution.icon}
          </div>
          <h2 className="text-3xl font-bold text-sarva-blue-dark">
            {subSolution ? subSolution.title : solution.title}
          </h2>
        </div>
        
        {solution.content.map((paragraph, index) => (
          <p key={index} className="text-lg mb-4 text-gray-700">
            {paragraph}
          </p>
        ))}
      </div>
      <div>
        <img 
          src={subSolution ? subSolution.image : solution.image} 
          alt={subSolution ? subSolution.title : solution.title} 
          className="rounded-lg shadow-lg w-full h-auto object-cover max-h-96" 
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = "https://images.unsplash.com/photo-1565107461944-2e607bc8539c?auto=format&fit=crop&q=80&w=1200";
          }}
        />
      </div>
    </div>
  );
};

export default SolutionContent;
