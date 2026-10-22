export interface FarmerPlot {
  id: string;
  name: string;
  acreage: number;
  soilType: string;
  irrigationSource: string;
}

export interface FarmerCrop {
  id: string;
  name: string;
  variety: string;
  plotName: string;
  areaAcre: number;
  sowingDate: string;
  status: "growing" | "flowering" | "harvesting" | "completed";
}

export interface FarmActivity {
  id: string;
  farmerId: string;
  farmerName: string;
  farmerPhone: string;
  cropName: string;
  plotName: string;
  activityType: "spraying" | "sowing" | "irrigation" | "fertilizer" | "harvest" | "weeding" | "expense" | "other" | string;
  title: string;
  description: string;
  cost: number;
  date: string;
  photoUrl?: string;
  audioDuration?: string;
  hasAudio: boolean;
  audioUri?: string;
  location: string;
  inputsUsed?: string[];
  dosage?: string;
  voiceTranscript?: string;
  aiSummary?: string;
}

export interface Farmer {
  id: string;
  fullName: string;
  phoneNumber: string;
  village: string;
  taluka: string;
  district: string;
  totalAcreage: number;
  plots: FarmerPlot[];
  crops: FarmerCrop[];
  avatarUrl?: string;
  registeredAt: string;
  totalExpenses: number;
  activitiesCount: number;
  email?: string;
  dob?: string;
  state?: string;
  pincode?: string;
  gender?: string;
}

export interface BroadcastMessage {
  id: string;
  title: string;
  message: string;
  category: "weather" | "pest_alert" | "subsidy" | "market";
  severity: "urgent" | "warning" | "info";
  targetDistrict: string;
  author: string;
  createdAt: string;
  views: number;
}

export interface MandiRate {
  id: string;
  commodity: string;
  market: string;
  district: string;
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
  unit: string;
  trend: "up" | "down" | "stable";
  updatedAt: string;
}

export const INITIAL_FARMERS: Farmer[] = [];

export const INITIAL_ACTIVITIES: FarmActivity[] = [];

export const INITIAL_BROADCASTS: BroadcastMessage[] = [
  {
    id: "b_1",
    title: "Weather Alert: Unseasonal Rain Expected in Nashik & Pune Regions",
    message: "IMD forecast predicts light to moderate rainfall with gusty winds over the next 48 hours. Farmers are advised to secure harvested crops in safe storage.",
    category: "weather",
    severity: "urgent",
    targetDistrict: "Pune, Nashik, Ahmednagar",
    author: "Agronomy Advisory Team",
    createdAt: "2026-10-13T08:00:00Z",
    views: 342,
  },
  {
    id: "b_2",
    title: "Pest Advisory: Thrips and Purple Blotch Management in Onion",
    message: "Cloudy weather may increase thrips population. Apply Fipronil 5% SC (2 ml/liter) mixed with a recommended wetting agent.",
    category: "pest_alert",
    severity: "warning",
    targetDistrict: "All Districts",
    author: "Dr. A. B. Salunkhe",
    createdAt: "2026-10-11T10:30:00Z",
    views: 518,
  },
  {
    id: "b_3",
    title: "MahaDBT: Micro-Irrigation (Drip/Sprinkler) Subsidy List Released",
    message: "The government has published the fresh beneficiary allotment list for drip and sprinkler irrigation schemes. Selected farmers must upload documents within 7 days.",
    category: "subsidy",
    severity: "info",
    targetDistrict: "All Districts",
    author: "Agriculture Dept Coordinator",
    createdAt: "2026-10-08T14:00:00Z",
    views: 890,
  }
];

export const INITIAL_MANDI_RATES: MandiRate[] = [
  {
    id: "m_1",
    commodity: "Red Onion",
    market: "Lasalgaon",
    district: "Nashik",
    minPrice: 1800,
    maxPrice: 3250,
    modalPrice: 2850,
    unit: "per Quintal (Rs/Qtl)",
    trend: "up",
    updatedAt: "2026-10-14T06:00:00Z",
  },
  {
    id: "m_2",
    commodity: "Tomato",
    market: "Narayangaon / Otur",
    district: "Pune",
    minPrice: 800,
    maxPrice: 1650,
    modalPrice: 1350,
    unit: "per Crate (20 kg)",
    trend: "down",
    updatedAt: "2026-10-14T06:30:00Z",
  },
  {
    id: "m_3",
    commodity: "Soybean",
    market: "Latur",
    district: "Latur",
    minPrice: 4200,
    maxPrice: 4850,
    modalPrice: 4650,
    unit: "per Quintal (Rs/Qtl)",
    trend: "stable",
    updatedAt: "2026-10-14T07:00:00Z",
  },
  {
    id: "m_4",
    commodity: "Medium Staple Cotton",
    market: "Akola",
    district: "Akola",
    minPrice: 6800,
    maxPrice: 7650,
    modalPrice: 7350,
    unit: "per Quintal (Rs/Qtl)",
    trend: "up",
    updatedAt: "2026-10-14T07:15:00Z",
  },
  {
    id: "m_5",
    commodity: "Raw Banana",
    market: "Raver",
    district: "Jalgaon",
    minPrice: 1200,
    maxPrice: 2100,
    modalPrice: 1850,
    unit: "per Quintal (Rs/Qtl)",
    trend: "up",
    updatedAt: "2026-10-14T06:45:00Z",
  },
  {
    id: "m_6",
    commodity: "Bhagwa Pomegranate",
    market: "Solapur",
    district: "Solapur",
    minPrice: 6000,
    maxPrice: 14500,
    modalPrice: 9500,
    unit: "per Quintal (Rs/Qtl)",
    trend: "stable",
    updatedAt: "2026-10-14T06:15:00Z",
  }
];

export interface SeedFarmerUsage {
  farmerId: string;
  farmerName: string;
  farmerPhone: string;
  village: string;
  district: string;
  plotName: string;
  areaAcre: number;
  sowingDate: string;
  soilType: string;
  status: "growing" | "flowering" | "harvesting" | "completed";
}

export interface SeedItem {
  id: string;
  varietyName: string;
  cropName: string;
  category: "Vegetables" | "Fruits" | "Cash Crops" | "Oilseeds" | "Cereals";
  companyOrInstitute: string;
  seedType: "Hybrid Seed" | "Certified University Seed" | "Tissue Culture Plantlets" | "Rooted Cuttings" | "Selected Seed Rhizomes";
  seedRate: string;
  durationDays: string;
  features: string;
  totalAcreage: number;
  farmersCount: number;
  users: SeedFarmerUsage[];
}

export const INITIAL_SEEDS: SeedItem[] = [
  {
    id: "seed_01",
    varietyName: "Phule Samarth",
    cropName: "Onion",
    category: "Vegetables",
    companyOrInstitute: "MPKV Rahuri University",
    seedType: "Certified University Seed",
    seedRate: "3.5 - 4.0 kg per acre",
    durationDays: "135 - 140 days",
    features: "Dark red bulb, high keeping storage quality (up to 5 months), thrips tolerant.",
    totalAcreage: 2.5,
    farmersCount: 1,
    users: [
      {
        farmerId: "f_001",
        farmerName: "Pawan Patil",
        farmerPhone: "9823012345",
        village: "Manchar",
        district: "Pune",
        plotName: "Farm Plot A",
        areaAcre: 2.5,
        sowingDate: "2026-08-15",
        soilType: "Black Fertile Soil",
        status: "growing",
      }
    ]
  },
  {
    id: "seed_02",
    varietyName: "Abhinav (Seminis)",
    cropName: "Tomato",
    category: "Vegetables",
    companyOrInstitute: "Bayer Seminis",
    seedType: "Hybrid Seed",
    seedRate: "40 - 50 grams per acre (14,000 seedlings)",
    durationDays: "120 - 130 days",
    features: "Determinate hybrid, firm red square-round fruits with thick skin, excellent long distance transport.",
    totalAcreage: 1.5,
    farmersCount: 1,
    users: [
      {
        farmerId: "f_001",
        farmerName: "Pawan Patil",
        farmerPhone: "9823012345",
        village: "Manchar",
        district: "Pune",
        plotName: "Well Plot",
        areaAcre: 1.5,
        sowingDate: "2026-09-02",
        soilType: "Red Loamy Soil",
        status: "flowering",
      }
    ]
  },
  {
    id: "seed_03",
    varietyName: "Thomson Seedless",
    cropName: "Table Grapes",
    category: "Fruits",
    companyOrInstitute: "NRC for Grapes / Dogridge Rootstock",
    seedType: "Rooted Cuttings",
    seedRate: "1,000 to 1,200 vines per acre",
    durationDays: "Perennial (130 days from October pruning)",
    features: "Elongated sweet golden berries, high brix sugar content, export standard quality.",
    totalAcreage: 4.0,
    farmersCount: 1,
    users: [
      {
        farmerId: "f_002",
        farmerName: "Ganesh Shinde",
        farmerPhone: "9422055667",
        village: "Niphad",
        district: "Nashik",
        plotName: "Vineyard Orchard",
        areaAcre: 4.0,
        sowingDate: "2025-10-20",
        soilType: "Medium Black Soil",
        status: "growing",
      }
    ]
  },
  {
    id: "seed_04",
    varietyName: "JS 335",
    cropName: "Soybean",
    category: "Oilseeds",
    companyOrInstitute: "JNKVV / Certified State Seeds",
    seedType: "Certified University Seed",
    seedRate: "30 kg per acre",
    durationDays: "95 - 100 days",
    features: "High oil (20%) and protein (40%), shatter resistant pods, high podding capacity.",
    totalAcreage: 2.0,
    farmersCount: 1,
    users: [
      {
        farmerId: "f_002",
        farmerName: "Ganesh Shinde",
        farmerPhone: "9422055667",
        village: "Niphad",
        district: "Nashik",
        plotName: "Vegetable Plot",
        areaAcre: 2.0,
        sowingDate: "2026-06-25",
        soilType: "Clay Soil",
        status: "harvesting",
      }
    ]
  },
  {
    id: "seed_05",
    varietyName: "Co 86032 (Nira)",
    cropName: "Sugarcane",
    category: "Cash Crops",
    companyOrInstitute: "Vasantdada Sugar Institute (VSI)",
    seedType: "Certified University Seed",
    seedRate: "25,000 two-bud setts per acre",
    durationDays: "12 - 14 months (Adsali / Suru)",
    features: "High sucrose recovery (13.5%), drought and red rot resistant, erect thick solid canes.",
    totalAcreage: 6.0,
    farmersCount: 1,
    users: [
      {
        farmerId: "f_003",
        farmerName: "Sambhaji Jagtap",
        farmerPhone: "9890123478",
        village: "Shirol",
        district: "Kolhapur",
        plotName: "Cane Field",
        areaAcre: 6.0,
        sowingDate: "2026-01-10",
        soilType: "Heavy Clay Soil",
        status: "growing",
      }
    ]
  },
  {
    id: "seed_06",
    varietyName: "Varada",
    cropName: "Ginger",
    category: "Cash Crops",
    companyOrInstitute: "ICAR-IISR Calicut",
    seedType: "Selected Seed Rhizomes",
    seedRate: "8 - 10 quintals seed rhizomes per acre",
    durationDays: "210 - 240 days",
    features: "Plump bold rhizomes, low fiber content, high oleoresin and essential aroma oil.",
    totalAcreage: 2.5,
    farmersCount: 1,
    users: [
      {
        farmerId: "f_003",
        farmerName: "Sambhaji Jagtap",
        farmerPhone: "9890123478",
        village: "Shirol",
        district: "Kolhapur",
        plotName: "Ginger Field",
        areaAcre: 2.5,
        sowingDate: "2026-05-20",
        soilType: "Loamy Soil",
        status: "growing",
      }
    ]
  },
  {
    id: "seed_07",
    varietyName: "Bhagwa (Sindhuri)",
    cropName: "Pomegranate",
    category: "Fruits",
    companyOrInstitute: "MPKV Rahuri / NRC on Pomegranate",
    seedType: "Rooted Cuttings",
    seedRate: "350 - 400 air-layered plants per acre",
    durationDays: "Perennial (160 days from Hasta/Mrig bahar)",
    features: "Deep saffron red arils, soft seeds, attractive glossy rind, high market consumer demand.",
    totalAcreage: 3.5,
    farmersCount: 1,
    users: [
      {
        farmerId: "f_004",
        farmerName: "Vijay Deshmukh",
        farmerPhone: "9766432190",
        village: "Karmala",
        district: "Solapur",
        plotName: "Pomegranate Orchard",
        areaAcre: 3.5,
        sowingDate: "2025-08-14",
        soilType: "Gravelly Light Soil",
        status: "flowering",
      }
    ]
  },
  {
    id: "seed_08",
    varietyName: "Maldandi M 35-1",
    cropName: "Jowar",
    category: "Cereals",
    companyOrInstitute: "Rabi Sorghum Research Station, Solapur",
    seedType: "Certified University Seed",
    seedRate: "4 - 5 kg per acre",
    durationDays: "115 - 120 days",
    features: "Pearly white bold grain, superior roti taste, drought hardy rabi dryland champion.",
    totalAcreage: 1.5,
    farmersCount: 1,
    users: [
      {
        farmerId: "f_004",
        farmerName: "Vijay Deshmukh",
        farmerPhone: "9766432190",
        village: "Karmala",
        district: "Solapur",
        plotName: "Jowar Field",
        areaAcre: 1.5,
        sowingDate: "2026-09-20",
        soilType: "Black Soil",
        status: "growing",
      }
    ]
  },
  {
    id: "seed_09",
    varietyName: "Grand Naine (G9)",
    cropName: "Banana",
    category: "Fruits",
    companyOrInstitute: "Jain Irrigation Tissue Culture",
    seedType: "Tissue Culture Plantlets",
    seedRate: "1,200 - 1,450 tissue culture plants per acre",
    durationDays: "11 - 12 months",
    features: "Uniform cylindrical heavy bunches (30-35 kg average), attractive yellow fingers, disease free planting material.",
    totalAcreage: 5.0,
    farmersCount: 1,
    users: [
      {
        farmerId: "f_005",
        farmerName: "Dattatray Mahajan",
        farmerPhone: "9850987612",
        village: "Raver",
        district: "Jalgaon",
        plotName: "Banana Orchard",
        areaAcre: 5.0,
        sowingDate: "2026-04-10",
        soilType: "Deep Alluvial Soil",
        status: "growing",
      }
    ]
  },
  {
    id: "seed_10",
    varietyName: "Bt Cotton RCH 659",
    cropName: "Cotton",
    category: "Cash Crops",
    companyOrInstitute: "Rasi Seeds (BG-II Hybrid)",
    seedType: "Hybrid Seed",
    seedRate: "2 packets (450g + 120g refuge) per acre",
    durationDays: "160 - 170 days",
    features: "Bollworm resistant Bollgard-II, heavy big boll size (5-5.5g), excellent staple length.",
    totalAcreage: 2.0,
    farmersCount: 1,
    users: [
      {
        farmerId: "f_005",
        farmerName: "Dattatray Mahajan",
        farmerPhone: "9850987612",
        village: "Raver",
        district: "Jalgaon",
        plotName: "Cotton Field",
        areaAcre: 2.0,
        sowingDate: "2026-06-15",
        soilType: "Black Cotton Soil",
        status: "harvesting",
      }
    ]
  }
];

