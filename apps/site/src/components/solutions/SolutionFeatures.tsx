
import React from "react";

interface SolutionFeaturesProps {
  features: string[];
}

const SolutionFeatures: React.FC<SolutionFeaturesProps> = ({ features }) => {
  return (
    <div className="mt-16">
      <h3 className="text-2xl font-bold mb-8 text-sarva-blue-dark text-center">
        Key Features
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {features.map((feature, index) => (
          <div key={index} className="bg-gray-50 p-6 rounded-lg shadow-sm">
            <div className="w-10 h-10 rounded-full bg-sarva-blue flex items-center justify-center text-white mb-4">
              {index + 1}
            </div>
            <h4 className="text-lg font-semibold mb-2">{feature}</h4>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SolutionFeatures;
