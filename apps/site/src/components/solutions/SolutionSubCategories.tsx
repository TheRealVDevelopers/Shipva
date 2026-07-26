
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { SubCategory } from "./SolutionTypes";

interface SolutionSubCategoriesProps {
  id: string;
  subCategories: Record<string, SubCategory>;
}

const SolutionSubCategories: React.FC<SolutionSubCategoriesProps> = ({ id, subCategories }) => {
  return (
    <div className="mt-16">
      <h3 className="text-2xl font-bold mb-8 text-sarva-blue-dark text-center">
        Specialized Services
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {Object.entries(subCategories).map(([key, subCat]) => (
          <div key={key} className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="h-48 overflow-hidden">
              <img 
                src={subCat.image} 
                alt={subCat.title} 
                className="w-full h-full object-cover transition-transform hover:scale-105" 
                loading="lazy"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "https://images.unsplash.com/photo-1565107461944-2e607bc8539c?auto=format&fit=crop&q=80&w=1200";
                }}
              />
            </div>
            <div className="p-6">
              <h4 className="text-xl font-bold mb-2">{subCat.title}</h4>
              <p className="text-gray-700 mb-4">{subCat.description}</p>
              <Button asChild>
                <Link to={`/solutions/${id}/${key}`}>
                  Learn More <ArrowRight className="ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SolutionSubCategories;
