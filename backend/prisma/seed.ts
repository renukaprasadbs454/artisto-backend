import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing database...');
  await prisma.postLike.deleteMany();
  await prisma.postComment.deleteMany();
  await prisma.post.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.order.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.filmCredit.deleteMany();
  await prisma.actorProfile.deleteMany();
  await prisma.workExperience.deleteMany();
  await prisma.portfolioItem.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.user.deleteMany();

  console.log('Creating users...');
  
  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. ADMIN USER
  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      email: 'admin@artisto.local',
      passwordHash,
      role: 'ADMIN',
      emailVerified: true,
      profile: {
        create: {
          displayName: 'Artisto Admin',
          headline: 'System Administrator',
          bio: 'I run things around here.',
        }
      }
    }
  });

  // 2. SELLER USER
  const seller = await prisma.user.create({
    data: {
      username: 'seller',
      email: 'seller@artisto.local',
      passwordHash,
      role: 'SELLER',
      emailVerified: true,
      profile: {
        create: {
          displayName: 'Creative Seller',
          headline: 'Expert Graphic Designer & Videographer',
          location: 'New York, NY',
          skills: ['Photoshop', 'Premiere', 'Figma'],
        }
      },
      actorProfile: {
        create: {
          availabilityStatus: 'AVAILABLE',
          filmCredits: {
            create: [
              { tmdbMovieId: 550, title: 'Fight Club', releaseYear: 1999, roleName: 'Extra' }
            ]
          }
        }
      }
    }
  });

  // 3. BUYER USER
  const buyer = await prisma.user.create({
    data: {
      username: 'buyer',
      email: 'buyer@artisto.local',
      passwordHash,
      role: 'BUYER',
      emailVerified: true,
      profile: {
        create: {
          displayName: 'Agency Buyer',
          headline: 'Talent Scout',
          location: 'Los Angeles, CA',
        }
      }
    }
  });

  console.log('Creating listings...');

  await prisma.listing.create({
    data: {
      sellerId: seller.id,
      title: 'I will design a stunning modern logo',
      description: 'Professional logo design for your brand with 3 revisions.',
      category: 'Graphic Design',
      price: 150.00,
      deliveryDays: 3,
      status: 'ACTIVE',
    }
  });

  await prisma.listing.create({
    data: {
      sellerId: seller.id,
      title: 'I will edit your short film or commercial',
      description: 'High quality video editing with color grading.',
      category: 'Video Editing',
      price: 500.00,
      deliveryDays: 7,
      status: 'ACTIVE',
    }
  });

  console.log('Database seeded successfully!');
  console.log('-----------------------------------');
  console.log('Test Accounts (Password: password123)');
  console.log('Admin:  admin@artisto.local');
  console.log('Seller: seller@artisto.local');
  console.log('Buyer:  buyer@artisto.local');
  console.log('-----------------------------------');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
