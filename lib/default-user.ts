import { prisma } from './prisma';

// Get or create a default user for the app
export async function getDefaultUser() {
  try {
    // Try to find an existing default user
    let user = await prisma.user.findFirst({
      where: {
        email: 'default@data-nexus.local',
      },
    });

    // If no user exists, create one
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: 'default@data-nexus.local',
          name: 'Default User',
          password: null, // No password needed
        },
      });
    }

    return user;
  } catch (error: any) {
    // If database connection fails, provide helpful error
    if (error.code === 'P1001' || error.message?.includes('Can\'t reach database')) {
      throw new Error('Database is not running. Please start it with: docker compose up -d');
    }
    throw error;
  }
}

