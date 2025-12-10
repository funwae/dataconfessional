import { PrismaClient } from '@prisma/client';
import { initializeDatabasePath } from '../lib/database-path';

async function main() {
  // Initialize database path before using Prisma
  await initializeDatabasePath();

  const prisma = new PrismaClient();

  console.log('Seeding database...');

  // Create default user (no auth needed)
  const defaultEmail = 'default@data-nexus.local';

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: defaultEmail },
  });

  if (existingUser) {
    console.log('✅ Default user already exists');
    return;
  }

  const defaultUser = await prisma.user.create({
    data: {
      email: defaultEmail,
      password: null, // No password needed
      name: 'Default User',
    },
  });

  console.log('✅ Default user created:');
  console.log(`   Email: ${defaultEmail}`);
  console.log(`   User ID: ${defaultUser.id}`);
  console.log('   (No authentication required)');

  await prisma.$disconnect();
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  });

