import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

async function seedSafetyTemplates() {
  console.log('🌱 Seeding Safety system templates...');
  
  try {
    // Get all companies
    const companies = await prisma.$queryRaw<any[]>`
      SELECT id FROM "Company"
    `;

    if (companies.length === 0) {
      console.log('⚠️ No companies found. Skipping seed.');
      return;
    }

    const systemTemplates = [
      {
        name: "Kitchen Opening Checks",
        category: "food_safety",
        emoji: "🌅",
        description: "Daily opening checks to ensure kitchen is ready for service",
        items: [
          { text: "Check all refrigerators are at correct temperature (<5°C)", requiresTemperature: true },
          { text: "Check freezers are at correct temperature (<-18°C)", requiresTemperature: true },
          { text: "Verify all food is properly dated and stored", requiresNotes: true },
          { text: "Check all equipment is clean and operational", requiresPhoto: true },
          { text: "Verify handwashing stations are fully stocked", requiresPhoto: true },
          { text: "Check all surfaces are clean and sanitized", requiresPhoto: true },
        ],
      },
      {
        name: "Fridge Temperature Log",
        category: "food_safety",
        emoji: "❄️",
        description: "Regular temperature checks for refrigerated storage",
        items: [
          { text: "Walk-in Fridge Temperature", requiresTemperature: true },
          { text: "Prep Fridge Temperature", requiresTemperature: true },
          { text: "Dessert Fridge Temperature", requiresTemperature: true },
          { text: "Check door seals are intact", requiresPhoto: true },
          { text: "Verify no signs of condensation or frost build-up", requiresPhoto: true },
        ],
      },
      {
        name: "Equipment Maintenance Check",
        category: "equipment",
        emoji: "⚙️",
        description: "Weekly equipment inspection and maintenance",
        items: [
          { text: "Oven temperature calibration check", requiresTemperature: true },
          { text: "Mixer operation test", requiresNotes: true },
          { text: "Check for any unusual noises or vibrations", requiresNotes: true },
          { text: "Visual inspection for wear or damage", requiresPhoto: true },
          { text: "Clean and lubricate moving parts", requiresPhoto: true },
        ],
      },
      {
        name: "Allergen Check",
        category: "food_safety",
        emoji: "⚠️",
        description: "Daily allergen cross-contamination prevention checks",
        items: [
          { text: "Verify allergen separation zones are maintained", requiresPhoto: true },
          { text: "Check all allergen-containing ingredients are properly labeled", requiresPhoto: true },
          { text: "Verify cleaning procedures prevent cross-contamination", requiresNotes: true },
          { text: "Check allergen information is up to date", requiresNotes: true },
        ],
      },
      {
        name: "Deep Clean Checklist",
        category: "cleaning",
        emoji: "🧹",
        description: "Weekly deep cleaning procedure",
        items: [
          { text: "Clean and sanitize all surfaces", requiresPhoto: true },
          { text: "Clean behind and under equipment", requiresPhoto: true },
          { text: "Deep clean ovens and cooking equipment", requiresPhoto: true },
          { text: "Clean and sanitize storage areas", requiresPhoto: true },
          { text: "Mop and sanitize floors", requiresPhoto: true },
          { text: "Clean ventilation and filters", requiresPhoto: true },
        ],
      },
      {
        name: "Health & Safety Inspection",
        category: "health_safety",
        emoji: "🏥",
        description: "Monthly health and safety audit",
        items: [
          { text: "Check first aid kit is fully stocked", requiresPhoto: true },
          { text: "Verify fire extinguishers are in place and dated", requiresPhoto: true },
          { text: "Check emergency exits are clear and accessible", requiresPhoto: true },
          { text: "Verify staff training records are up to date", requiresNotes: true },
          { text: "Check for any trip hazards or safety concerns", requiresNotes: true },
        ],
      },
      {
        name: "Closing Safety Checks",
        category: "food_safety",
        emoji: "🌙",
        description: "End of day safety and security checks",
        items: [
          { text: "Ensure all food is properly stored and covered", requiresPhoto: true },
          { text: "Check all equipment is turned off and cleaned", requiresPhoto: true },
          { text: "Verify all fridges and freezers are closed properly", requiresPhoto: true },
          { text: "Check waste is properly disposed of", requiresPhoto: true },
          { text: "Verify security measures are in place", requiresNotes: true },
        ],
      },
    ];

    for (const company of companies) {
      console.log(`Creating templates for company ${company.id}...`);
      
      for (const template of systemTemplates) {
        // Check if template already exists
        const existing = await prisma.$queryRaw<any[]>`
          SELECT id FROM "TaskTemplate"
          WHERE "companyId" = ${company.id} 
            AND name = ${template.name}
            AND "isSystemTemplate" = true
        `;

        if (existing.length > 0) {
          console.log(`  ⏭️  Skipping ${template.name} (already exists)`);
          continue;
        }

        // Create template
        const created = await prisma.$queryRaw<any[]>`
          INSERT INTO "TaskTemplate" (
            "companyId", category, name, description, emoji,
            "isSystemTemplate", "isActive", "createdAt", "updatedAt"
          )
          VALUES (
            ${company.id}, ${template.category}, ${template.name}, 
            ${template.description}, ${template.emoji},
            true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
          )
          RETURNING id
        `;

        const templateId = created[0].id;

        // Create checklist items
        for (let i = 0; i < template.items.length; i++) {
          const item = template.items[i];
          await prisma.$executeRaw`
            INSERT INTO "TemplateChecklistItem" (
              "templateId", "itemText", "itemOrder",
              "requiresPhoto", "requiresTemperature", "requiresNotes", "createdAt"
            )
            VALUES (
              ${templateId}, ${item.text}, ${i + 1},
              ${item.requiresPhoto || false},
              ${item.requiresTemperature || false},
              ${item.requiresNotes || false},
              CURRENT_TIMESTAMP
            )
          `;
        }

        console.log(`  ✅ Created ${template.name}`);
      }
    }

    console.log('\n✅ Safety system templates seeded successfully!');
  } catch (error) {
    console.error('❌ Seed error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run seed if called directly
if (require.main === module) {
  seedSafetyTemplates()
    .then(() => {
      console.log('Seed completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seed failed:', error);
      process.exit(1);
    });
}

export { seedSafetyTemplates };

