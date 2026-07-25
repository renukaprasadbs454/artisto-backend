import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Clearing existing database records...');
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

  console.log('👤 Creating Users & Profiles...');
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
          displayName: 'Artisto SuperAdmin',
          headline: 'Chief Executive & System Administrator',
          bio: 'Supervision & Content Moderation Portal Administrator.',
          location: 'Mumbai, India',
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
        },
      },
    },
  });

  // 2. RECRUITERS (BUYERS)
  const recruiter1 = await prisma.user.create({
    data: {
      username: 'paramount_casting',
      email: 'casting@paramount.com',
      passwordHash,
      role: 'BUYER',
      emailVerified: true,
      profile: {
        create: {
          displayName: 'Paramount Studios Casting',
          headline: 'Head of Feature Film Casting',
          bio: 'Recruiting lead & supporting talent for upcoming international feature films and OTT series.',
          location: 'Los Angeles, CA & Mumbai',
          avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
          skills: ['Film Direction', 'Talent Scouting', 'Production'],
        },
      },
    },
  });

  const recruiter2 = await prisma.user.create({
    data: {
      username: 'netflix_india_talent',
      email: 'talent@netflix.in',
      passwordHash,
      role: 'BUYER',
      emailVerified: true,
      profile: {
        create: {
          displayName: 'Netflix India Talent Team',
          headline: 'Senior Casting Director',
          bio: 'Scouting fresh acting talent, voiceover artists, and stunt performers for original series.',
          location: 'Mumbai, India',
          avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
          skills: ['Series Casting', 'Auditioning', 'Drama'],
        },
      },
    },
  });

  const recruiter3 = await prisma.user.create({
    data: {
      username: 'yrf_casting_dept',
      email: 'casting@yrf.in',
      passwordHash,
      role: 'BUYER',
      emailVerified: true,
      profile: {
        create: {
          displayName: 'YRF Casting Department',
          headline: 'Lead Talent Manager',
          bio: 'Spotting next-gen cinema actors, dancers, and background cast.',
          location: 'Mumbai, India',
          avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
        },
      },
    },
  });

  // 3. ACTORS & CREATORS (SELLERS)
  const actor1 = await prisma.user.create({
    data: {
      username: 'renuka_prasad',
      email: 'renuka@artisto.local',
      passwordHash,
      role: 'SELLER',
      emailVerified: true,
      profile: {
        create: {
          displayName: 'Renuka Prasad',
          headline: 'Method Actor & Action Choreographer',
          bio: 'Versatile dramatic actor with 6+ years of theatre and web-series experience. Trained in classical martial arts and vocal range.',
          location: 'Bengaluru / Mumbai',
          avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80',
          bannerUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80',
          skills: ['Method Acting', 'Action Sequences', 'Hindi', 'Kannada', 'English'],
        },
      },
      actorProfile: {
        create: {
          availabilityStatus: 'AVAILABLE',
          filmCredits: {
            create: [
              { tmdbMovieId: 550, title: 'Fight Club', releaseYear: 1999, roleName: 'Stunt Double / Extra' },
              { tmdbMovieId: 155, title: 'The Dark Knight', releaseYear: 2008, roleName: 'Gothan Cop' },
            ],
          },
        },
      },
    },
  });

  const actor2 = await prisma.user.create({
    data: {
      username: 'aria_sharma',
      email: 'aria@artisto.local',
      passwordHash,
      role: 'SELLER',
      emailVerified: true,
      profile: {
        create: {
          displayName: 'Aria Sharma',
          headline: 'Lead Actress & Classical Dancer',
          bio: 'Experienced in commercial ad films, independent cinema, and voiceover projects for animated features.',
          location: 'Mumbai, India',
          avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80',
          bannerUrl: 'https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?auto=format&fit=crop&w=1200&q=80',
          skills: ['Lead Performance', 'Kathak', 'Voiceover', 'Hindi', 'English'],
        },
      },
      actorProfile: {
        create: {
          availabilityStatus: 'AVAILABLE',
          filmCredits: {
            create: [
              { tmdbMovieId: 680, title: 'Pulp Fiction', releaseYear: 1994, roleName: 'Dancer' },
            ],
          },
        },
      },
    },
  });

  const actor3 = await prisma.user.create({
    data: {
      username: 'vikram_singh',
      email: 'vikram@artisto.local',
      passwordHash,
      role: 'SELLER',
      emailVerified: true,
      profile: {
        create: {
          displayName: 'Vikram Singh',
          headline: 'Director of Photography & Camera Specialist',
          bio: 'Cinematographer specializing in anamorphic lenses, low-light night shots, and high-energy music videos.',
          location: 'Delhi / Mumbai',
          avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80',
          skills: ['Cinematography', 'ARRI Alexa', 'RED V-Raptor', 'Color Grading'],
        },
      },
      actorProfile: {
        create: {
          availabilityStatus: 'BUSY',
        },
      },
    },
  });

  console.log('📋 Creating Casting Call & Service Listings...');
  const listing1 = await prisma.listing.create({
    data: {
      sellerId: recruiter1.id,
      title: 'Casting Call: Lead Male Actor for Upcoming Action Thriller',
      description: 'Paramount Studios is seeking a male actor aged 25-35 with strong physical fitness for an upcoming action feature film shoot starting September 2026.',
      category: 'Acting & Auditions',
      price: 50000.00,
      deliveryDays: 30,
      status: 'ACTIVE',
    },
  });

  const listing2 = await prisma.listing.create({
    data: {
      sellerId: recruiter2.id,
      title: 'Casting Call: Supporting Actress for Netflix Original Series',
      description: 'Looking for a talented actress fluent in Hindi & English for a prominent recurring role in a crime drama series.',
      category: 'Acting & Auditions',
      price: 35000.00,
      deliveryDays: 14,
      status: 'ACTIVE',
    },
  });

  const listing3 = await prisma.listing.create({
    data: {
      sellerId: actor1.id,
      title: 'Professional Acting & Stunt Choreography Services',
      description: 'Available for feature films, web series, and commercial video shoots with custom stunt sequence coordination.',
      category: 'Performance Services',
      price: 15000.00,
      deliveryDays: 5,
      status: 'ACTIVE',
    },
  });

  const listing4 = await prisma.listing.create({
    data: {
      sellerId: actor2.id,
      title: 'Voiceover & Dubbing in Hindi and English (Studio Quality)',
      description: 'High definition Neumann U87 voice recordings for movie dubbing, audiobooks, commercials, and game characters.',
      category: 'Voiceover',
      price: 8000.00,
      deliveryDays: 2,
      status: 'ACTIVE',
    },
  });

  const listing5 = await prisma.listing.create({
    data: {
      sellerId: actor3.id,
      title: 'Complete 4K/8K Cinematography & Lighting Package',
      description: 'Includes camera gear, lighting setup, and professional DP services for indie movies, ads, and music videos.',
      category: 'Cinematography',
      price: 45000.00,
      deliveryDays: 3,
      status: 'ACTIVE',
    },
  });

  console.log('📦 Creating Applications & Orders...');
  const order1 = await prisma.order.create({
    data: {
      listingId: listing1.id,
      buyerId: actor1.id, // Actor applied to Recruiter's casting call
      sellerId: recruiter1.id,
      requirements: 'Application Pitch: I am a trained action actor with 6 years experience in martial arts. Monologue reel attached.',
      status: 'ACCEPTED',
    },
  });

  const order2 = await prisma.order.create({
    data: {
      listingId: listing2.id,
      buyerId: actor2.id, // Actress applied to Netflix casting call
      sellerId: recruiter2.id,
      requirements: 'Application Pitch: Audition tape prepared. Fluent in both languages with recent drama series credits.',
      status: 'IN_PROGRESS',
    },
  });

  console.log('💬 Creating Conversations & Messages...');
  const convo1 = await prisma.conversation.create({
    data: {
      participantOneId: actor1.id,
      participantTwoId: recruiter1.id,
      orderId: order1.id,
      messages: {
        create: [
          {
            senderId: actor1.id,
            content: 'Hello Paramount Casting team! I submitted my pitch reel for the Action Thriller audition.',
          },
          {
            senderId: recruiter1.id,
            content: 'Hi Renuka! We loved your audition clip. Your action choreography is impressive. Expect an official callback schedule tomorrow!',
          },
        ],
      },
    },
  });

  console.log('📰 Creating Feed Posts & Likes...');
  const post1 = await prisma.post.create({
    data: {
      authorId: actor1.id,
      content: 'Just finished an intense 3-hour stunt rehearsal for the upcoming feature project! Staying ready. 🎭🎬 #Artisto #ActingLife #Stunts',
      likes: {
        create: [{ userId: recruiter1.id }],
      },
    },
  });

  const post2 = await prisma.post.create({
    data: {
      authorId: recruiter2.id,
      content: 'We are officially scouting for 5 new lead roles in our upcoming 2026 OTT series! Check our active casting calls on the Artisto Marketplace. 🚀',
    },
  });

  console.log('✅ Database seeded with complete Recruiters, Actors, Listings, Orders, and Messages!');
  console.log('----------------------------------------------------');
  console.log('🔑 Test Accounts (Password: password123)');
  console.log('Admin:               admin@artisto.local');
  console.log('Recruiter 1:        casting@paramount.com (Paramount Studios)');
  console.log('Recruiter 2:        talent@netflix.in (Netflix India)');
  console.log('Actor 1:            renuka@artisto.local (Renuka Prasad)');
  console.log('Actor 2:            aria@artisto.local (Aria Sharma)');
  console.log('----------------------------------------------------');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
