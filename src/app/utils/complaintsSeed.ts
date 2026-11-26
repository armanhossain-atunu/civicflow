import { prisma } from "../lib/prisma";

const categories = [
  { name: "Road & Transport", department: "Roads and Highways" },
  { name: "Water & Drainage", department: "Drainage Department" },
  { name: "Electricity", department: "Electricity Department" },
  { name: "Waste Management", department: "Waste Management" },
  { name: "Public Safety", department: "City Corporation" },
];

const complaintSeeds = [
  {
    title: "Large pothole on the main road",
    description: "A large pothole is causing accidents and traffic congestion.",
    category: "Road & Transport",
    department: "Roads and Highways",
    location: "Mirpur 10, Dhaka",
  },
  {
    title: "Broken road near the school",
    description: "The road surface is badly damaged near the school entrance.",
    category: "Road & Transport",
    department: "Roads and Highways",
    location: "Uttara, Dhaka",
  },
  {
    title: "Damaged footpath",
    description: "The footpath is broken and difficult for pedestrians to use.",
    category: "Road & Transport",
    department: "City Corporation",
    location: "Mohammadpur, Dhaka",
  },
  {
    title: "Traffic signal not working",
    description: "The traffic signal has stopped working at the intersection.",
    category: "Road & Transport",
    department: "Traffic Department",
    location: "Farmgate, Dhaka",
  },
  {
    title: "Waterlogging after rain",
    description: "Water is accumulating on the road after rainfall.",
    category: "Water & Drainage",
    department: "Drainage Department",
    location: "Dhanmondi, Dhaka",
  },
  {
    title: "Blocked drainage system",
    description: "The drainage system is blocked and needs cleaning.",
    category: "Water & Drainage",
    department: "Drainage Department",
    location: "Mirpur, Dhaka",
  },
  {
    title: "Leaking water pipeline",
    description: "Water is leaking continuously from the underground pipeline.",
    category: "Water & Drainage",
    department: "WASA",
    location: "Banani, Dhaka",
  },
  {
    title: "Open drain causing safety concerns",
    description: "An open drain is dangerous for pedestrians and children.",
    category: "Water & Drainage",
    department: "Drainage Department",
    location: "Badda, Dhaka",
  },
  {
    title: "Street light is not working",
    description: "The street light has been off for several days.",
    category: "Electricity",
    department: "Electricity Department",
    location: "Gulshan, Dhaka",
  },
  {
    title: "Broken street light",
    description: "Several street lights are not working on this road.",
    category: "Electricity",
    department: "Electricity Department",
    location: "Rampura, Dhaka",
  },
  {
    title: "Exposed electrical wires",
    description: "Exposed electrical wires are creating a safety hazard.",
    category: "Electricity",
    department: "Electricity Department",
    location: "Khilgaon, Dhaka",
  },
  {
    title: "Power pole damage",
    description: "An electrical pole appears damaged and requires inspection.",
    category: "Electricity",
    department: "Electricity Department",
    location: "Jatrabari, Dhaka",
  },
  {
    title: "Garbage not collected",
    description: "Garbage has not been collected for several days.",
    category: "Waste Management",
    department: "Waste Management",
    location: "Lalbagh, Dhaka",
  },
  {
    title: "Overflowing public dustbin",
    description:
      "The public dustbin is overflowing and creating an unpleasant smell.",
    category: "Waste Management",
    department: "Waste Management",
    location: "New Market, Dhaka",
  },
  {
    title: "Illegal waste dumping",
    description: "People are dumping waste on the roadside.",
    category: "Waste Management",
    department: "City Corporation",
    location: "Savar, Dhaka",
  },
  {
    title: "Unclean public area",
    description: "The public area needs cleaning and waste removal.",
    category: "Waste Management",
    department: "City Corporation",
    location: "Kawran Bazar, Dhaka",
  },
  {
    title: "Unsafe pedestrian crossing",
    description: "Pedestrians are having difficulty crossing the busy road.",
    category: "Public Safety",
    department: "Traffic Department",
    location: "Shahbagh, Dhaka",
  },
  {
    title: "Damaged public park fence",
    description: "The park fence is damaged and needs repair.",
    category: "Public Safety",
    department: "City Corporation",
    location: "Ramna, Dhaka",
  },
  {
    title: "Broken public bench",
    description: "The public bench is damaged and unsafe for visitors.",
    category: "Public Safety",
    department: "City Corporation",
    location: "Mirpur, Dhaka",
  },
  {
    title: "Unsafe construction debris",
    description:
      "Construction debris is blocking part of the pedestrian walkway.",
    category: "Public Safety",
    department: "City Corporation",
    location: "Tejgaon, Dhaka",
  },
];

async function seed() {
  console.log("Seeding categories...");

  for (const category of categories) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: { department: category.department },
      create: category,
    });
  }

  console.log("Categories created.");

  console.log("Seeding complaints...");

  const seedCitizen = await prisma.user.upsert({
    where: { email: "seed-citizen@civicflow.local" },
    update: {},
    create: {
      name: "CivicFlow Seed Citizen",
      email: "seed-citizen@civicflow.local",
      role: "CITIZEN",
    },
  });

  for (const complaint of complaintSeeds) {
    const category = await prisma.category.findFirst({
      where: { name: complaint.category },
    });

    if (!category) {
      throw new Error(`Category not found: ${complaint.category}`);
    }

    const trackingId = `CF-SEED-${String(complaintSeeds.indexOf(complaint) + 1).padStart(3, "0")}`;

    await prisma.complaint.upsert({
      where: { trackingId },
      update: {},
      create: {
        trackingId,
        title: complaint.title,
        description: complaint.description,
        citizenId: seedCitizen.id,
        categoryId: category.id,
        categoryName: category.name,
        department: complaint.department,
        location: complaint.location,
      },
    });
  }

  console.log("20 complaints seeded successfully!");
}

seed()
  .catch((error) => {
    console.error("Seed error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
