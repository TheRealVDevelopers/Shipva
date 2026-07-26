
import { ReactNode } from "react";

export interface SubCategory {
  title: string;
  description: string;
  image: string;
}

export interface Solution {
  title: string;
  description: string;
  image: string;
  icon: ReactNode;
  content: string[];
  features: string[];
  subCategories?: Record<string, SubCategory>;
}

export type SolutionsRecord = Record<string, Solution>;
