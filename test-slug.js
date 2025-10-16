// Test slug generation
function generateSlug(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function generateUniqueSlug(baseText, checkExists) {
  let slug = generateSlug(baseText);
  let counter = 1;
  
  while (await checkExists(slug)) {
    slug = `${generateSlug(baseText)}-${counter}`;
    counter++;
  }
  
  return slug;
}

async function testSlugGeneration() {
  const { PrismaClient } = require('./src/generated/prisma');
  const prisma = new PrismaClient();
  
  try {
    console.log('Testing slug generation...');
    
    const company = 'Test Company & Co.';
    
    const slug = await generateUniqueSlug(company, async (slug) => {
      const existing = await prisma.company.findUnique({ where: { slug } });
      return !!existing;
    });
    
    console.log('Generated slug:', slug);
    
    // Test creating company with generated slug
    const testCompany = await prisma.company.create({
      data: {
        name: company,
        slug: slug,
        businessType: 'restaurant',
        country: 'United Kingdom',
        phone: '1234567890'
      }
    });
    
    console.log('Company created with slug:', testCompany.slug);
    
    // Clean up
    await prisma.company.delete({ where: { id: testCompany.id } });
    console.log('Test company deleted');
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Full error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSlugGeneration();
