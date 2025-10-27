/**
 * Database Seeding Script
 * 
 * This script creates consistent test data for development.
 * Run with: npx prisma db seed
 */

import { PrismaClient } from '../src/generated/prisma';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create test companies
  const companies = await Promise.all([
    prisma.company.upsert({
      where: { slug: 'test-bakery' },
      update: {},
      create: {
        name: 'Test Bakery',
        slug: 'test-bakery',
        businessType: 'Bakery',
        country: 'United Kingdom',
        phone: '+44 20 1234 5678',
        email: 'hello@testbakery.com',
        website: 'https://testbakery.com',
        address: '123 Baker Street',
        city: 'London',
        postcode: 'SW1A 1AA',
        isProfilePublic: true,
        profileBio: 'A test bakery for development purposes',
        maxSeats: 5,
        seatsUsed: 1
      }
    }),
    prisma.company.upsert({
      where: { slug: 'demo-cafe' },
      update: {},
      create: {
        name: 'Demo Café',
        slug: 'demo-cafe',
        businessType: 'Café',
        country: 'United Kingdom',
        phone: '+44 20 8765 4321',
        email: 'info@democafe.com',
        website: 'https://democafe.com',
        address: '456 Coffee Lane',
        city: 'Manchester',
        postcode: 'M1 1AA',
        isProfilePublic: true,
        profileBio: 'A demo café for testing features',
        maxSeats: 3,
        seatsUsed: 1
      }
    })
  ]);

  console.log('✅ Created companies:', companies.map(c => c.name));

  // Create test users
  const passwordHash = await bcrypt.hash('password123', 10);
  
  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'admin@testbakery.com' },
      update: {},
      create: {
        email: 'admin@testbakery.com',
        name: 'Admin User',
        passwordHash,
        isAdmin: true,
        hasCompletedOnboarding: true,
        subscriptionStatus: 'active',
        subscriptionTier: 'professional'
      }
    }),
    prisma.user.upsert({
      where: { email: 'demo@democafe.com' },
      update: {},
      create: {
        email: 'demo@democafe.com',
        name: 'Demo User',
        passwordHash,
        isAdmin: false,
        hasCompletedOnboarding: true,
        subscriptionStatus: 'active',
        subscriptionTier: 'starter'
      }
    })
  ]);

  console.log('✅ Created users:', users.map(u => u.email));

  // Create memberships
  await Promise.all([
    prisma.membership.upsert({
      where: {
        userId_companyId: {
          userId: users[0].id,
          companyId: companies[0].id
        }
      },
      update: {},
      create: {
        userId: users[0].id,
        companyId: companies[0].id,
        role: 'OWNER',
        isActive: true,
        acceptedAt: new Date()
      }
    }),
    prisma.membership.upsert({
      where: {
        userId_companyId: {
          userId: users[1].id,
          companyId: companies[1].id
        }
      },
      update: {},
      create: {
        userId: users[1].id,
        companyId: companies[1].id,
        role: 'OWNER',
        isActive: true,
        acceptedAt: new Date()
      }
    })
  ]);

  console.log('✅ Created memberships');

  // Create categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: {
        name_companyId: {
          name: 'Breads',
          companyId: companies[0].id
        }
      },
      update: {},
      create: {
        name: 'Breads',
        description: 'Fresh baked breads',
        color: '#8B4513',
        order: 1,
        companyId: companies[0].id
      }
    }),
    prisma.category.upsert({
      where: {
        name_companyId: {
          name: 'Pastries',
          companyId: companies[0].id
        }
      },
      update: {},
      create: {
        name: 'Pastries',
        description: 'Sweet pastries and desserts',
        color: '#FFB6C1',
        order: 2,
        companyId: companies[0].id
      }
    }),
    prisma.category.upsert({
      where: {
        name_companyId: {
          name: 'Beverages',
          companyId: companies[1].id
        }
      },
      update: {},
      create: {
        name: 'Beverages',
        description: 'Hot and cold drinks',
        color: '#4169E1',
        order: 1,
        companyId: companies[1].id
      }
    })
  ]);

  console.log('✅ Created categories:', categories.map(c => c.name));

  // Create ingredients
  const ingredients = await Promise.all([
    // Bakery ingredients
    prisma.ingredient.upsert({
      where: {
        name_companyId: {
          name: 'Strong White Flour',
          companyId: companies[0].id
        }
      },
      update: {},
      create: {
        name: 'Strong White Flour',
        packQuantity: 12.5,
        packUnit: 'g',
        originalUnit: 'kg',
        packPrice: 8.50,
        currency: 'GBP',
        allergens: ['gluten'],
        companyId: companies[0].id
      }
    }),
    prisma.ingredient.upsert({
      where: {
        name_companyId: {
          name: 'Fresh Yeast',
          companyId: companies[0].id
        }
      },
      update: {},
      create: {
        name: 'Fresh Yeast',
        packQuantity: 500,
        packUnit: 'g',
        originalUnit: 'g',
        packPrice: 2.50,
        currency: 'GBP',
        allergens: [],
        companyId: companies[0].id
      }
    }),
    prisma.ingredient.upsert({
      where: {
        name_companyId: {
          name: 'Butter',
          companyId: companies[0].id
        }
      },
      update: {},
      create: {
        name: 'Butter',
        packQuantity: 1,
        packUnit: 'g',
        originalUnit: 'kg',
        packPrice: 4.20,
        currency: 'GBP',
        allergens: ['milk'],
        companyId: companies[0].id
      }
    }),
    // Café ingredients
    prisma.ingredient.upsert({
      where: {
        name_companyId: {
          name: 'Coffee Beans',
          companyId: companies[1].id
        }
      },
      update: {},
      create: {
        name: 'Coffee Beans',
        packQuantity: 1,
        packUnit: 'g',
        originalUnit: 'kg',
        packPrice: 12.00,
        currency: 'GBP',
        allergens: [],
        companyId: companies[1].id
      }
    }),
    prisma.ingredient.upsert({
      where: {
        name_companyId: {
          name: 'Milk',
          companyId: companies[1].id
        }
      },
      update: {},
      create: {
        name: 'Milk',
        packQuantity: 1,
        packUnit: 'ml',
        originalUnit: 'l',
        packPrice: 1.20,
        currency: 'GBP',
        allergens: ['milk'],
        companyId: companies[1].id
      }
    })
  ]);

  console.log('✅ Created ingredients:', ingredients.map(i => i.name));

  // Create recipes
  const recipes = await Promise.all([
    // Sourdough Bread
    prisma.recipe.upsert({
      where: {
        name_companyId: {
          name: 'Sourdough Bread',
          companyId: companies[0].id
        }
      },
      update: {},
      create: {
        name: 'Sourdough Bread',
        description: 'Classic sourdough bread with crispy crust',
        yieldQuantity: 1,
        yieldUnit: 'each',
        portionsPerBatch: 1,
        method: 'Mix ingredients, knead, proof, bake at 220°C for 30 minutes',
        categoryId: categories[0].id,
        bakeTime: 30,
        bakeTemp: 220,
        companyId: companies[0].id
      }
    }),
    // Cappuccino
    prisma.recipe.upsert({
      where: {
        name_companyId: {
          name: 'Cappuccino',
          companyId: companies[1].id
        }
      },
      update: {},
      create: {
        name: 'Cappuccino',
        description: 'Classic Italian coffee drink',
        yieldQuantity: 1,
        yieldUnit: 'each',
        portionsPerBatch: 1,
        method: 'Extract espresso, steam milk, combine',
        categoryId: categories[2].id,
        companyId: companies[1].id
      }
    })
  ]);

  console.log('✅ Created recipes:', recipes.map(r => r.name));

  // Create recipe items
  await Promise.all([
    // Sourdough ingredients
    prisma.recipeItem.create({
      data: {
        recipeId: recipes[0].id,
        ingredientId: ingredients[0].id,
        quantity: 500,
        unit: 'g'
      }
    }),
    prisma.recipeItem.create({
      data: {
        recipeId: recipes[0].id,
        ingredientId: ingredients[1].id,
        quantity: 10,
        unit: 'g'
      }
    }),
    // Cappuccino ingredients
    prisma.recipeItem.create({
      data: {
        recipeId: recipes[1].id,
        ingredientId: ingredients[3].id,
        quantity: 18,
        unit: 'g'
      }
    }),
    prisma.recipeItem.create({
      data: {
        recipeId: recipes[1].id,
        ingredientId: ingredients[4].id,
        quantity: 150,
        unit: 'ml'
      }
    })
  ]);

  console.log('✅ Created recipe items');

  // Create storage and shelf life options
  await Promise.all([
    prisma.storageOption.upsert({
      where: {
        name_companyId: {
          name: 'Room Temperature',
          companyId: companies[0].id
        }
      },
      update: {},
      create: {
        name: 'Room Temperature',
        description: 'Store at room temperature',
        icon: '🌡️',
        order: 1,
        companyId: companies[0].id
      }
    }),
    prisma.shelfLifeOption.upsert({
      where: {
        name_companyId: {
          name: '2-3 Days',
          companyId: companies[0].id
        }
      },
      update: {},
      create: {
        name: '2-3 Days',
        description: 'Best consumed within 2-3 days',
        order: 1,
        companyId: companies[0].id
      }
    })
  ]);

  console.log('✅ Created storage and shelf life options');

  console.log('🎉 Database seeding completed successfully!');
  console.log('');
  console.log('Test accounts created:');
  console.log('📧 admin@testbakery.com / password123 (Admin)');
  console.log('📧 demo@democafe.com / password123 (User)');
  console.log('');
  console.log('Companies:');
  console.log('🏢 Test Bakery (test-bakery)');
  console.log('🏢 Demo Café (demo-cafe)');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });