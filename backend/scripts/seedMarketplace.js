const mongoose = require('mongoose');
const dotenv = require('dotenv');
const MarketplaceProduct = require('../models/MarketplaceProduct');

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/contract-farming';

// Common Indian crops with realistic prices (in INR per kg)
const crops = [
  // Grains
  {
    name: 'Rice',
    category: 'grain',
    pricePerKg: 45,
    unit: 'kg',
    season: 'kharif',
    description: 'Staple food grain, widely consumed across India'
  },
  {
    name: 'Wheat',
    category: 'grain',
    pricePerKg: 28,
    unit: 'kg',
    season: 'rabi',
    description: 'Major cereal crop, used for making flour and bread'
  },
  {
    name: 'Maize',
    category: 'grain',
    pricePerKg: 22,
    unit: 'kg',
    season: 'kharif',
    description: 'Corn used for food, feed, and industrial purposes'
  },
  {
    name: 'Barley',
    category: 'grain',
    pricePerKg: 25,
    unit: 'kg',
    season: 'rabi',
    description: 'Cereal grain used for food and animal feed'
  },
  {
    name: 'Jowar (Sorghum)',
    category: 'grain',
    pricePerKg: 30,
    unit: 'kg',
    season: 'kharif',
    description: 'Millet crop, important in dryland agriculture'
  },
  {
    name: 'Bajra (Pearl Millet)',
    category: 'grain',
    pricePerKg: 28,
    unit: 'kg',
    season: 'kharif',
    description: 'Drought-resistant millet, staple in arid regions'
  },
  {
    name: 'Ragi (Finger Millet)',
    category: 'grain',
    pricePerKg: 35,
    unit: 'kg',
    season: 'kharif',
    description: 'Nutritious millet, rich in calcium and iron'
  },

  // Pulses
  {
    name: 'Tur Dal (Pigeon Pea)',
    category: 'pulse',
    pricePerKg: 120,
    unit: 'kg',
    season: 'kharif',
    description: 'Popular dal, rich in protein'
  },
  {
    name: 'Moong Dal (Green Gram)',
    category: 'pulse',
    pricePerKg: 110,
    unit: 'kg',
    season: 'kharif',
    description: 'Light and easy to digest pulse'
  },
  {
    name: 'Chana Dal (Bengal Gram)',
    category: 'pulse',
    pricePerKg: 95,
    unit: 'kg',
    season: 'rabi',
    description: 'Split chickpeas, versatile in Indian cuisine'
  },
  {
    name: 'Urad Dal (Black Gram)',
    category: 'pulse',
    pricePerKg: 130,
    unit: 'kg',
    season: 'kharif',
    description: 'Black gram, used in idli and dosa batter'
  },
  {
    name: 'Masoor Dal (Red Lentil)',
    category: 'pulse',
    pricePerKg: 100,
    unit: 'kg',
    season: 'rabi',
    description: 'Quick-cooking red lentil'
  },
  {
    name: 'Rajma (Kidney Beans)',
    category: 'pulse',
    pricePerKg: 140,
    unit: 'kg',
    season: 'rabi',
    description: 'Large red beans, popular in North Indian cuisine'
  },
  {
    name: 'Chole (Chickpeas)',
    category: 'pulse',
    pricePerKg: 90,
    unit: 'kg',
    season: 'rabi',
    description: 'Whole chickpeas, used in various dishes'
  },

  // Vegetables
  {
    name: 'Tomato',
    category: 'vegetable',
    pricePerKg: 40,
    unit: 'kg',
    season: 'all-year',
    description: 'Essential vegetable, used in curries and salads'
  },
  {
    name: 'Onion',
    category: 'vegetable',
    pricePerKg: 35,
    unit: 'kg',
    season: 'rabi',
    description: 'Base ingredient for most Indian dishes'
  },
  {
    name: 'Potato',
    category: 'vegetable',
    pricePerKg: 25,
    unit: 'kg',
    season: 'rabi',
    description: 'Staple vegetable, versatile in cooking'
  },
  {
    name: 'Brinjal (Eggplant)',
    category: 'vegetable',
    pricePerKg: 30,
    unit: 'kg',
    season: 'kharif',
    description: 'Purple vegetable, used in curries'
  },
  {
    name: 'Okra (Lady Finger)',
    category: 'vegetable',
    pricePerKg: 45,
    unit: 'kg',
    season: 'kharif',
    description: 'Green vegetable, popular in South Indian cuisine'
  },
  {
    name: 'Cauliflower',
    category: 'vegetable',
    pricePerKg: 35,
    unit: 'kg',
    season: 'rabi',
    description: 'White flower vegetable, nutritious'
  },
  {
    name: 'Cabbage',
    category: 'vegetable',
    pricePerKg: 20,
    unit: 'kg',
    season: 'rabi',
    description: 'Leafy vegetable, used in salads and curries'
  },
  {
    name: 'Carrot',
    category: 'vegetable',
    pricePerKg: 40,
    unit: 'kg',
    season: 'rabi',
    description: 'Orange root vegetable, rich in beta-carotene'
  },
  {
    name: 'Capsicum (Bell Pepper)',
    category: 'vegetable',
    pricePerKg: 60,
    unit: 'kg',
    season: 'all-year',
    description: 'Colorful peppers, used in various dishes'
  },
  {
    name: 'Cucumber',
    category: 'vegetable',
    pricePerKg: 25,
    unit: 'kg',
    season: 'zaid',
    description: 'Cooling vegetable, used in salads and raita'
  },
  {
    name: 'Bottle Gourd',
    category: 'vegetable',
    pricePerKg: 20,
    unit: 'kg',
    season: 'kharif',
    description: 'Light vegetable, easy to digest'
  },
  {
    name: 'Ridge Gourd',
    category: 'vegetable',
    pricePerKg: 30,
    unit: 'kg',
    season: 'kharif',
    description: 'Ribbed gourd, used in curries'
  },
  {
    name: 'Bitter Gourd',
    category: 'vegetable',
    pricePerKg: 50,
    unit: 'kg',
    season: 'kharif',
    description: 'Medicinal vegetable, known for health benefits'
  },
  {
    name: 'Spinach',
    category: 'vegetable',
    pricePerKg: 30,
    unit: 'kg',
    season: 'rabi',
    description: 'Leafy green, rich in iron'
  },
  {
    name: 'Fenugreek Leaves',
    category: 'vegetable',
    pricePerKg: 80,
    unit: 'kg',
    season: 'rabi',
    description: 'Aromatic leaves, used in cooking'
  },

  // Fruits
  {
    name: 'Mango',
    category: 'fruit',
    pricePerKg: 80,
    unit: 'kg',
    season: 'zaid',
    description: 'King of fruits, seasonal delicacy'
  },
  {
    name: 'Banana',
    category: 'fruit',
    pricePerKg: 40,
    unit: 'kg',
    season: 'all-year',
    description: 'Year-round fruit, rich in potassium'
  },
  {
    name: 'Orange',
    category: 'fruit',
    pricePerKg: 60,
    unit: 'kg',
    season: 'rabi',
    description: 'Citrus fruit, rich in vitamin C'
  },
  {
    name: 'Apple',
    category: 'fruit',
    pricePerKg: 120,
    unit: 'kg',
    season: 'rabi',
    description: 'Crisp fruit, mostly grown in hilly regions'
  },
  {
    name: 'Guava',
    category: 'fruit',
    pricePerKg: 50,
    unit: 'kg',
    season: 'all-year',
    description: 'Tropical fruit, rich in vitamin C'
  },
  {
    name: 'Papaya',
    category: 'fruit',
    pricePerKg: 30,
    unit: 'kg',
    season: 'all-year',
    description: 'Tropical fruit, aids digestion'
  },
  {
    name: 'Pomegranate',
    category: 'fruit',
    pricePerKg: 100,
    unit: 'kg',
    season: 'rabi',
    description: 'Red seeds fruit, antioxidant-rich'
  },
  {
    name: 'Grapes',
    category: 'fruit',
    pricePerKg: 80,
    unit: 'kg',
    season: 'zaid',
    description: 'Sweet berries, used fresh and for wine'
  },
  {
    name: 'Watermelon',
    category: 'fruit',
    pricePerKg: 20,
    unit: 'kg',
    season: 'zaid',
    description: 'Summer fruit, high water content'
  },
  {
    name: 'Muskmelon',
    category: 'fruit',
    pricePerKg: 35,
    unit: 'kg',
    season: 'zaid',
    description: 'Sweet melon, refreshing summer fruit'
  },

  // Oilseeds
  {
    name: 'Groundnut (Peanut)',
    category: 'oilseed',
    pricePerKg: 120,
    unit: 'kg',
    season: 'kharif',
    description: 'Popular oilseed, also consumed as snack'
  },
  {
    name: 'Mustard',
    category: 'oilseed',
    pricePerKg: 65,
    unit: 'kg',
    season: 'rabi',
    description: 'Oilseed crop, used for cooking oil'
  },
  {
    name: 'Sesame',
    category: 'oilseed',
    pricePerKg: 150,
    unit: 'kg',
    season: 'kharif',
    description: 'Tiny seeds, used in cooking and sweets'
  },
  {
    name: 'Sunflower',
    category: 'oilseed',
    pricePerKg: 70,
    unit: 'kg',
    season: 'rabi',
    description: 'Oilseed crop, produces cooking oil'
  },
  {
    name: 'Soybean',
    category: 'oilseed',
    pricePerKg: 55,
    unit: 'kg',
    season: 'kharif',
    description: 'Protein-rich oilseed, versatile crop'
  },
  {
    name: 'Castor',
    category: 'oilseed',
    pricePerKg: 45,
    unit: 'kg',
    season: 'kharif',
    description: 'Industrial oilseed crop'
  },

  // Spices
  {
    name: 'Turmeric',
    category: 'spice',
    pricePerKg: 180,
    unit: 'kg',
    season: 'kharif',
    description: 'Golden spice, anti-inflammatory properties'
  },
  {
    name: 'Chilli',
    category: 'spice',
    pricePerKg: 150,
    unit: 'kg',
    season: 'kharif',
    description: 'Hot spice, essential in Indian cooking'
  },
  {
    name: 'Coriander',
    category: 'spice',
    pricePerKg: 200,
    unit: 'kg',
    season: 'rabi',
    description: 'Aromatic seeds and leaves'
  },
  {
    name: 'Cumin',
    category: 'spice',
    pricePerKg: 250,
    unit: 'kg',
    season: 'rabi',
    description: 'Aromatic spice, used whole or ground'
  },
  {
    name: 'Fenugreek Seeds',
    category: 'spice',
    pricePerKg: 180,
    unit: 'kg',
    season: 'rabi',
    description: 'Bitter seeds, used in pickles and curries'
  },
  {
    name: 'Black Pepper',
    category: 'spice',
    pricePerKg: 400,
    unit: 'kg',
    season: 'all-year',
    description: 'King of spices, adds heat to dishes'
  },
  {
    name: 'Cardamom',
    category: 'spice',
    pricePerKg: 1200,
    unit: 'kg',
    season: 'all-year',
    description: 'Queen of spices, aromatic and expensive'
  },
  {
    name: 'Ginger',
    category: 'spice',
    pricePerKg: 200,
    unit: 'kg',
    season: 'kharif',
    description: 'Rhizome spice, aids digestion'
  },
  {
    name: 'Garlic',
    category: 'spice',
    pricePerKg: 150,
    unit: 'kg',
    season: 'rabi',
    description: 'Pungent bulb, flavor enhancer'
  }
];

const run = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected');

    // Clear existing marketplace products (optional - comment out if you want to keep existing)
    const existingCount = await MarketplaceProduct.countDocuments();
    if (existingCount > 0) {
      console.log(`Found ${existingCount} existing products. Clearing...`);
      await MarketplaceProduct.deleteMany({});
      console.log('✅ Cleared existing products');
    }

    console.log('Seeding marketplace products...');
    const products = await MarketplaceProduct.insertMany(crops);

    console.log(`✅ Successfully seeded ${products.length} marketplace products!`);
    console.log('\n📊 Summary by category:');
    
    const categoryCounts = {};
    products.forEach(product => {
      categoryCounts[product.category] = (categoryCounts[product.category] || 0) + 1;
    });
    
    Object.entries(categoryCounts).forEach(([category, count]) => {
      console.log(`   ${category}: ${count} products`);
    });

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding marketplace:', err);
    process.exit(1);
  }
};

run();
