import { SolutionsRecord } from "./SolutionTypes";
import { Truck, Box, Clock, BarChart, LayoutGrid, Snowflake, Ship, Plane, Package, Thermometer, Refrigerator } from "lucide-react";
import React from "react";

// Updated image URLs to more reliable sources
export const solutionsData: SolutionsRecord = {
  "transportation": {
    title: "Transportation Solutions",
    description: "Efficient and reliable transportation services across India, including road, rail, and multimodal options.",
    image: "https://images.unsplash.com/photo-1580674285054-bed31e145f59?auto=format&fit=crop&q=80&w=1200",
    icon: <Truck className="w-8 h-8 text-sarva-blue" />,
    content: [
      "Our comprehensive transportation services are designed to move your cargo efficiently and reliably across India and beyond. With our extensive network and fleet capabilities, we provide seamless logistics solutions tailored to your specific needs.",
      "Whether you need full truckload (FTL) services for large shipments or less than truckload (LTL) options for smaller consignments, our team ensures optimal routing and timely delivery.",
      "Our real-time tracking systems allow you to monitor your shipments throughout the journey, providing peace of mind and enhancing supply chain visibility."
    ],
    features: [
      "Full Truckload (FTL) and Less than Truckload (LTL) services",
      "Real-time tracking and monitoring",
      "Specialized transport for oversized and heavy cargo",
      "Temperature-controlled transportation",
      "Multimodal transport solutions"
    ],
    subCategories: {
      "local": {
        title: "Local Transportation",
        description: "Efficient and reliable last-mile delivery services within city limits.",
        image: "https://images.unsplash.com/photo-1626863905121-3b0c0ed7b8c4?auto=format&fit=crop&q=80&w=1200"
      },
      "otr": {
        title: "Over-the-Road (OTR) Transportation",
        description: "Long-haul transportation services across states and regions.",
        image: "https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&q=80&w=1200"
      },
      "rail": {
        title: "Rail Car Transloading",
        description: "Efficient transfer of goods between rail and road transportation.",
        image: "https://images.unsplash.com/photo-1473862170180-84427c485aca?auto=format&fit=crop&q=80&w=1200"
      },
      "airport": {
        title: "Airport Cargo Transfer",
        description: "Seamless movement of cargo to and from airports for air freight connections.",
        image: "https://images.unsplash.com/photo-1513009766917-7a5674497be2?auto=format&fit=crop&q=80&w=1200"
      }
    }
  },
  "warehousing": {
    title: "Warehousing Solutions",
    description: "Secure and strategically located warehousing facilities with advanced inventory management systems.",
    image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=1200",
    icon: <Box className="w-8 h-8 text-sarva-blue" />,
    content: [
      "Our warehousing solutions provide secure and efficient storage for your products, with strategically located facilities across India to optimize your distribution network and reduce transit times.",
      "We offer a range of warehousing services, from basic storage to complex inventory management and order fulfillment, all supported by advanced technologies and experienced personnel.",
      "Our facilities are equipped to handle various types of goods, including temperature-sensitive products, hazardous materials, and high-value items, with appropriate security measures and environmental controls."
    ],
    features: [
      "Bonded and non-bonded warehousing options",
      "Climate-controlled storage",
      "Inventory management and order fulfillment",
      "Cross-docking and transloading services",
      "Value-added services like labeling and packaging"
    ]
  },
  "global-forwarding": {
    title: "Global Forwarding",
    description: "International shipping solutions including sea freight and air freight for global trade.",
    image: "https://images.unsplash.com/photo-1494412651409-8963ce7935a7?auto=format&fit=crop&q=80&w=1200",
    icon: <Ship className="w-8 h-8 text-sarva-blue" />,
    content: [
      "Our global forwarding services connect your business to international markets, handling all aspects of cross-border logistics to ensure smooth and compliant operations.",
      "We offer comprehensive solutions for both imports and exports, including documentation, customs clearance, and transportation, simplifying the complexities of international trade.",
      "With our global network of partners and agents, we provide reliable service and local expertise in major markets worldwide, supporting your global business objectives."
    ],
    features: [
      "Sea freight services (FCL and LCL)",
      "Air freight services",
      "Customs clearance and documentation",
      "Trade compliance assistance",
      "Project cargo and special shipments"
    ],
    subCategories: {
      "sea": {
        title: "Sea Freight",
        description: "Comprehensive sea freight solutions for global shipping needs.",
        image: "https://images.unsplash.com/photo-1577236544203-9d1a9fe84352?auto=format&fit=crop&q=80&w=1200"
      },
      "air": {
        title: "Air Freight",
        description: "Fast and reliable air freight services for time-sensitive shipments.",
        image: "https://images.unsplash.com/photo-1586843589503-747d8ef9197f?auto=format&fit=crop&q=80&w=1200"
      }
    }
  },
  "supply-chain-management": {
    title: "Supply Chain Management",
    description: "End-to-end supply chain solutions designed to optimize efficiency, reduce costs, and improve visibility.",
    image: "https://images.unsplash.com/photo-1586528116493-8599c95a4048?auto=format&fit=crop&q=80&w=1200",
    icon: <LayoutGrid className="w-8 h-8 text-sarva-blue" />,
    content: [
      "Our supply chain management services provide integrated solutions that optimize your entire supply chain, from procurement and production to distribution and delivery.",
      "We leverage advanced technologies and analytics to enhance visibility, streamline processes, and identify opportunities for improvement, helping you achieve greater efficiency and cost savings.",
      "Our team works closely with you to understand your business needs and develop customized strategies that align with your objectives and enhance your competitive advantage."
    ],
    features: [
      "Supply chain design and optimization",
      "Demand planning and forecasting",
      "Procurement and vendor management",
      "Order management and fulfillment",
      "Performance monitoring and reporting"
    ]
  },
  "cold-chain": {
    title: "Cold Chain Logistics",
    description: "Specialized logistics solutions for temperature-sensitive goods, ensuring product integrity from origin to destination.",
    image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=1200",
    icon: <Refrigerator className="w-8 h-8 text-sarva-blue" />,
    content: [
      "Our cold chain logistics solutions are designed to maintain the integrity of temperature-sensitive products throughout the supply chain, from production to final delivery.",
      "We utilize advanced temperature-controlled vehicles, warehouses, and monitoring systems to ensure that your products remain within the required temperature range at all times.",
      "Our team is trained in handling various types of temperature-sensitive goods, including pharmaceuticals, food products, and chemicals, with strict adherence to regulatory requirements and quality standards."
    ],
    features: [
      "Temperature-controlled transportation",
      "Refrigerated warehousing facilities",
      "Real-time temperature monitoring",
      "GDP-compliant processes",
      "Specialized packaging solutions"
    ]
  },
  "express-delivery": {
    title: "Express Delivery",
    description: "Fast and reliable express delivery services for time-critical shipments, with guaranteed delivery times.",
    image: "https://images.unsplash.com/photo-1513618364580-cbf87333a46f?auto=format&fit=crop&q=80&w=1200",
    icon: <Clock className="w-8 h-8 text-sarva-blue" />,
    content: [
      "Our express delivery services are designed for time-critical shipments that require fast and reliable transportation with guaranteed delivery times.",
      "We offer a range of express services, including same-day and next-day delivery options, to meet your urgent shipping needs and ensure that your time-sensitive items reach their destination promptly.",
      "Our dedicated fleet and streamlined processes enable us to provide expedited services without compromising on safety or reliability, giving you peace of mind for your most important deliveries."
    ],
    features: [
      "Same-day and next-day delivery options",
      "Dedicated vehicles for urgent shipments",
      "Real-time tracking and delivery confirmation",
      "Door-to-door service",
      "Customs clearance for international express"
    ]
  },
  "data-analytics": {
    title: "Data Analytics & Reporting",
    description: "Advanced data analytics and reporting tools to provide insights into your logistics operations.",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1200",
    icon: <BarChart className="w-8 h-8 text-sarva-blue" />,
    content: [
      "Our data analytics and reporting solutions provide valuable insights into your logistics operations, helping you make informed decisions and optimize your supply chain.",
      "We leverage advanced analytics tools and methodologies to transform raw data into actionable intelligence, identifying trends, patterns, and opportunities for improvement.",
      "Our customizable dashboards and reports give you visibility into key performance indicators and metrics, allowing you to monitor performance and track progress toward your business objectives."
    ],
    features: [
      "Customizable dashboards and reports",
      "Real-time visibility into key performance indicators (KPIs)",
      "Predictive analytics for demand forecasting",
      "Supply chain optimization recommendations",
      "Data integration with existing systems"
    ]
  },
  "contract": {
    title: "Contract Logistics",
    description: "Comprehensive 3PL, 4PL, factory logistics, and ecommerce fulfillment services.",
    image: "https://images.unsplash.com/photo-1569137248594-a640f38d42f3?auto=format&fit=crop&q=80&w=1200",
    icon: <Box className="w-8 h-8 text-sarva-blue" />,
    content: [
      "Our contract logistics services provide comprehensive solutions for your ongoing logistics needs, allowing you to focus on your core business while we handle the complexities of your supply chain.",
      "We offer a range of services, from basic transportation and warehousing to integrated third-party logistics (3PL) and fourth-party logistics (4PL) solutions, tailored to your specific requirements.",
      "Our team works as an extension of your business, providing dedicated resources, expertise, and technology to optimize your logistics operations and support your growth objectives."
    ],
    features: [
      "Dedicated resources and facilities",
      "Customized logistics processes",
      "Performance metrics and continuous improvement",
      "Scalable solutions to accommodate growth",
      "Integration with your business systems"
    ],
    subCategories: {
      "inbound": {
        title: "Inbound Logistics",
        description: "Efficient management of incoming materials and supplies to support production and operations.",
        image: "https://images.unsplash.com/photo-1616401784845-180882ba9ba8?auto=format&fit=crop&q=80&w=1200"
      },
      "outbound": {
        title: "Outbound Logistics",
        description: "Streamlined processes for the storage, handling, and distribution of finished products.",
        image: "https://images.unsplash.com/photo-1586528116493-8599c95a4048?auto=format&fit=crop&q=80&w=1200"
      },
      "reverse": {
        title: "Reverse Logistics",
        description: "Efficient handling of product returns, recycling, and disposal processes.",
        image: "https://images.unsplash.com/photo-1635783174695-ae10069268cb?auto=format&fit=crop&q=80&w=1200"
      },
      "3pl": {
        title: "3PL Services",
        description: "Third-party logistics services to outsource elements of your distribution, warehousing, and fulfillment.",
        image: "https://images.unsplash.com/photo-1586528116493-8599c95a4048?auto=format&fit=crop&q=80&w=1200"
      },
      "4pl": {
        title: "4PL Services",
        description: "Fourth-party logistics services to manage your entire supply chain and logistics providers.",
        image: "https://images.unsplash.com/photo-1607083206517-b6a27a6f2c98?auto=format&fit=crop&q=80&w=1200"
      },
      "factory": {
        title: "Factory Logistics",
        description: "Specialized logistics services for manufacturing facilities, ensuring smooth operations.",
        image: "https://images.unsplash.com/photo-1518782040592-e4e4e4cc272e?auto=format&fit=crop&q=80&w=1200"
      },
      "ecommerce": {
        title: "Ecommerce Fulfillment",
        description: "End-to-end logistics solutions for online retailers, from order processing to delivery.",
        image: "https://images.unsplash.com/photo-1591085686350-798c0f9faa7f?auto=format&fit=crop&q=80&w=1200"
      }
    }
  },
  "cf-agent": {
    title: "C & F Agent Services",
    description: "Comprehensive clearing and forwarding services for imports and exports.",
    image: "https://images.unsplash.com/photo-1608287629503-842f9108fd6d?auto=format&fit=crop&q=80&w=1200",
    icon: <Plane className="w-8 h-8 text-sarva-blue" />,
    content: [
      "Our Clearing and Forwarding (C&F) agent services simplify the complexities of international trade, handling customs clearance, documentation, and regulatory compliance for your imports and exports.",
      "We leverage our expertise and relationships with customs authorities to expedite the clearance process, minimizing delays and ensuring smooth movement of your goods across borders.",
      "Our team stays updated on the latest trade regulations and requirements, providing guidance and support to ensure that your shipments comply with all applicable laws and regulations."
    ],
    features: [
      "Customs clearance for imports and exports",
      "Documentation preparation and verification",
      "Tariff classification and duty calculation",
      "Regulatory compliance assistance",
      "Liaison with customs authorities"
    ]
  },
  "courier": {
    title: "Courier and Express Delivery",
    description: "Fast and reliable delivery services for documents and parcels.",
    image: "https://images.unsplash.com/photo-1616401784845-180882ba9ba8?auto=format&fit=crop&q=80&w=1200",
    icon: <Clock className="w-8 h-8 text-sarva-blue" />,
    content: [
      "Our courier and express delivery services provide fast and reliable transportation for documents, parcels, and small shipments, with options for same-day, next-day, and scheduled delivery.",
      "We cover both domestic and international destinations, with a seamless process that includes pickup, tracking, and delivery confirmation, ensuring that your items reach their recipients safely and on time.",
      "Our user-friendly booking system and customer service support make it easy to arrange shipments and get updates, enhancing your experience and providing peace of mind for your important deliveries."
    ],
    features: [
      "Door-to-door delivery services",
      "Same-day and next-day options",
      "Real-time tracking and notifications",
      "Proof of delivery",
      "Insurance coverage"
    ]
  },
  "projects": {
    title: "Project Logistics",
    description: "Specialized logistics solutions for complex and large-scale projects.",
    image: "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&q=80&w=1200",
    icon: <LayoutGrid className="w-8 h-8 text-sarva-blue" />,
    content: [
      "Our project logistics services are designed for complex and large-scale projects that require specialized handling, equipment, and expertise, such as infrastructure development, factory relocations, and major installations.",
      "We provide end-to-end solutions that encompass planning, transportation, storage, and on-site logistics, coordinating all aspects to ensure seamless execution and timely completion of your projects.",
      "Our experienced team works closely with you to understand your project requirements and develop customized logistics strategies that address your specific challenges and objectives."
    ],
    features: [
      "Project planning and scheduling",
      "Heavy lift and oversized cargo handling",
      "Site logistics management",
      "Equipment rental and mobilization",
      "Customs clearance for project cargo"
    ]
  },
  "scm": {
    title: "Supply Chain Management",
    description: "End-to-end supply chain solutions designed to optimize efficiency, reduce costs, and improve visibility.",
    image: "https://images.unsplash.com/photo-1616401784845-180882ba9ba8?auto=format&fit=crop&q=80&w=1200",
    icon: <LayoutGrid className="w-8 h-8 text-sarva-blue" />,
    content: [
      "Our supply chain management services provide integrated solutions that optimize your entire supply chain, from procurement and production to distribution and delivery.",
      "We leverage advanced technologies and analytics to enhance visibility, streamline processes, and identify opportunities for improvement, helping you achieve greater efficiency and cost savings.",
      "Our team works closely with you to understand your business needs and develop customized strategies that align with your objectives and enhance your competitive advantage."
    ],
    features: [
      "Supply chain design and optimization",
      "Demand planning and forecasting",
      "Procurement and vendor management",
      "Order management and fulfillment",
      "Performance monitoring and reporting"
    ]
  }
};
