
import React from "react";
import { Helmet } from "react-helmet-async";
import { useParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SolutionNotFound from "@/components/solutions/SolutionNotFound";
import SolutionHeroBanner from "@/components/solutions/SolutionHeroBanner";
import SolutionContent from "@/components/solutions/SolutionContent";
import SolutionFeatures from "@/components/solutions/SolutionFeatures";
import SolutionSubCategories from "@/components/solutions/SolutionSubCategories";
import SolutionCTA from "@/components/solutions/SolutionCTA";
import { solutionsData } from "@/components/solutions/SolutionData";
import { SubCategory } from "@/components/solutions/SolutionTypes";

const SolutionDetail = () => {
  const { id, subId } = useParams<{ id: string; subId: string }>();
  
  // Make sure to use the correct route parameter
  const solutionId = id || "";
  const solution = solutionsData[solutionId];
  
  let subSolution: SubCategory | null = null;
  
  if (solution && subId && solution.subCategories && solution.subCategories[subId]) {
    subSolution = solution.subCategories[subId];
  }
  
  if (!solution) {
    return <SolutionNotFound />;
  }

  return (
    <>
      <Helmet>
        <title>{subSolution ? subSolution.title : solution.title} | Sarva Express</title>
        <meta name="description" content={subSolution ? subSolution.description : solution.description} />
      </Helmet>
      
      <Navbar />
      
      <main>
        <SolutionHeroBanner solution={solution} subSolution={subSolution} />
        
        {/* Main Content */}
        <section className="py-16 md:py-24 bg-white">
          <div className="container mx-auto px-4">
            <SolutionContent solution={solution} subSolution={subSolution} />
            
            {/* Features */}
            <SolutionFeatures features={solution.features} />
            
            {/* Sub-categories if applicable */}
            {solution.subCategories && !subId && (
              <SolutionSubCategories id={solutionId} subCategories={solution.subCategories} />
            )}
          </div>
        </section>
        
        {/* CTA Section */}
        <SolutionCTA solution={solution} subSolution={subSolution} />
      </main>
      
      <Footer />
    </>
  );
};

export default SolutionDetail;
