
import React from "react";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Home } from "lucide-react";

const NotFound = () => {
  return (
    <>
      <Helmet>
        <title>404 Not Found | Sarva Express</title>
        <meta name="description" content="Page not found on Sarva Express" />
      </Helmet>
      
      <div className="flex flex-col items-center justify-center min-h-screen relative">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-fixed"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1578662996442-48f60103fc96?auto=format&fit=crop&q=80&w=2000')`,
          }}
        />
        <div className="bg-white shadow overflow-hidden sm:rounded-lg backdrop-blur-sm bg-white/90 relative z-10">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              404 - Page Not Found
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              The page you are looking for does not exist.
            </p>
          </div>
          <div className="border-t border-gray-200">
            <div className="p-6">
              <Button asChild>
                <Link to="/">
                  <Home className="mr-2 w-4 h-4" />
                  Go back to Home
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default NotFound;
