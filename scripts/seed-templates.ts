/**
 * Seed common task templates
 * Run with: npx ts-node scripts/seed-templates.ts
 */

import { PrismaClient, PriorityLevel } from '@prisma/client';

const prisma = new PrismaClient();

const commonTemplates = [
  {
    name: 'Website Development Project',
    description: 'Complete website development workflow from discovery to launch',
    category: 'Web Development',
    isPublic: true,
    tasks: [
      {
        name: 'Discovery & Requirements Gathering',
        description: 'Initial client meeting to understand goals, requirements, and constraints',
        priority: 'HIGH' as PriorityLevel,
        estimatedMinutes: 240, // 4 hours
        orderIndex: 0,
      },
      {
        name: 'Wireframing & User Flow Design',
        description: 'Create wireframes and map out user journeys',
        priority: 'HIGH' as PriorityLevel,
        estimatedMinutes: 360, // 6 hours
        orderIndex: 1,
      },
      {
        name: 'UI/UX Design & Mockups',
        description: 'Design high-fidelity mockups for all pages',
        priority: 'HIGH' as PriorityLevel,
        estimatedMinutes: 480, // 8 hours
        orderIndex: 2,
      },
      {
        name: 'Frontend Development',
        description: 'Build responsive frontend with React/Next.js',
        priority: 'MEDIUM' as PriorityLevel,
        estimatedMinutes: 960, // 16 hours
        orderIndex: 3,
      },
      {
        name: 'Backend API Development',
        description: 'Create RESTful API endpoints and database schema',
        priority: 'MEDIUM' as PriorityLevel,
        estimatedMinutes: 720, // 12 hours
        orderIndex: 4,
      },
      {
        name: 'Testing & QA',
        description: 'Comprehensive testing including unit, integration, and E2E tests',
        priority: 'HIGH' as PriorityLevel,
        estimatedMinutes: 360, // 6 hours
        orderIndex: 5,
      },
      {
        name: 'Client Review & Feedback',
        description: 'Present to client and gather feedback',
        priority: 'MEDIUM' as PriorityLevel,
        estimatedMinutes: 120, // 2 hours
        orderIndex: 6,
      },
      {
        name: 'Revisions & Polish',
        description: 'Implement client feedback and polish',
        priority: 'MEDIUM' as PriorityLevel,
        estimatedMinutes: 240, // 4 hours
        orderIndex: 7,
      },
      {
        name: 'Deployment & Launch',
        description: 'Deploy to production and configure domain',
        priority: 'HIGH' as PriorityLevel,
        estimatedMinutes: 180, // 3 hours
        orderIndex: 8,
      },
    ],
  },
  {
    name: 'Mobile App Development',
    description: 'iOS and Android mobile application development',
    category: 'Mobile Development',
    isPublic: true,
    tasks: [
      {
        name: 'Requirements & User Stories',
        description: 'Define app features and user stories',
        priority: 'HIGH' as PriorityLevel,
        estimatedMinutes: 240, // 4 hours
        orderIndex: 0,
      },
      {
        name: 'UI/UX Design for Mobile',
        description: 'Design mobile-first interface and interactions',
        priority: 'HIGH' as PriorityLevel,
        estimatedMinutes: 480, // 8 hours
        orderIndex: 1,
      },
      {
        name: 'React Native Setup',
        description: 'Initialize project with navigation and state management',
        priority: 'MEDIUM' as PriorityLevel,
        estimatedMinutes: 240, // 4 hours
        orderIndex: 2,
      },
      {
        name: 'Core Features Development',
        description: 'Build main app features and functionality',
        priority: 'HIGH' as PriorityLevel,
        estimatedMinutes: 1200, // 20 hours
        orderIndex: 3,
      },
      {
        name: 'Backend Integration',
        description: 'Connect to APIs and implement data sync',
        priority: 'MEDIUM' as PriorityLevel,
        estimatedMinutes: 480, // 8 hours
        orderIndex: 4,
      },
      {
        name: 'Testing on Devices',
        description: 'Test on iOS and Android devices',
        priority: 'HIGH' as PriorityLevel,
        estimatedMinutes: 360, // 6 hours
        orderIndex: 5,
      },
      {
        name: 'App Store Submission',
        description: 'Prepare and submit to App Store and Play Store',
        priority: 'MEDIUM' as PriorityLevel,
        estimatedMinutes: 240, // 4 hours
        orderIndex: 6,
      },
    ],
  },
  {
    name: 'Marketing Campaign Setup',
    description: 'End-to-end marketing campaign creation',
    category: 'Marketing',
    isPublic: true,
    tasks: [
      {
        name: 'Campaign Strategy & Planning',
        description: 'Define goals, audience, and key messages',
        priority: 'HIGH' as PriorityLevel,
        estimatedMinutes: 180, // 3 hours
        orderIndex: 0,
      },
      {
        name: 'Creative Asset Design',
        description: 'Design banners, graphics, and promotional materials',
        priority: 'HIGH' as PriorityLevel,
        estimatedMinutes: 480, // 8 hours
        orderIndex: 1,
      },
      {
        name: 'Copywriting & Content',
        description: 'Write compelling ad copy and landing page content',
        priority: 'MEDIUM' as PriorityLevel,
        estimatedMinutes: 240, // 4 hours
        orderIndex: 2,
      },
      {
        name: 'Landing Page Development',
        description: 'Build conversion-optimized landing page',
        priority: 'MEDIUM' as PriorityLevel,
        estimatedMinutes: 360, // 6 hours
        orderIndex: 3,
      },
      {
        name: 'Email Campaign Setup',
        description: 'Configure email automation and sequences',
        priority: 'LOW' as PriorityLevel,
        estimatedMinutes: 180, // 3 hours
        orderIndex: 4,
      },
      {
        name: 'Analytics & Tracking Setup',
        description: 'Implement tracking pixels and conversion tracking',
        priority: 'MEDIUM' as PriorityLevel,
        estimatedMinutes: 120, // 2 hours
        orderIndex: 5,
      },
    ],
  },
  {
    name: 'Client Onboarding Process',
    description: 'Standard tasks for onboarding new clients',
    category: 'Onboarding',
    isPublic: true,
    tasks: [
      {
        name: 'Welcome Call & Introduction',
        description: 'Initial call to welcome client and set expectations',
        priority: 'HIGH' as PriorityLevel,
        estimatedMinutes: 60, // 1 hour
        orderIndex: 0,
      },
      {
        name: 'Gather Access & Credentials',
        description: 'Collect necessary logins, API keys, and access',
        priority: 'HIGH' as PriorityLevel,
        estimatedMinutes: 120, // 2 hours
        orderIndex: 1,
      },
      {
        name: 'Project Scope Documentation',
        description: 'Create detailed project scope and timeline',
        priority: 'MEDIUM' as PriorityLevel,
        estimatedMinutes: 180, // 3 hours
        orderIndex: 2,
      },
      {
        name: 'Team Assignment & Introduction',
        description: 'Assign talent and facilitate introductions',
        priority: 'MEDIUM' as PriorityLevel,
        estimatedMinutes: 60, // 1 hour
        orderIndex: 3,
      },
      {
        name: 'Setup Communication Channels',
        description: 'Configure Slack, email groups, and meeting schedules',
        priority: 'LOW' as PriorityLevel,
        estimatedMinutes: 60, // 1 hour
        orderIndex: 4,
      },
    ],
  },
  {
    name: 'API Integration Project',
    description: 'Third-party API integration and testing',
    category: 'Backend Development',
    isPublic: true,
    tasks: [
      {
        name: 'API Research & Documentation Review',
        description: 'Study API docs and plan integration approach',
        priority: 'HIGH' as PriorityLevel,
        estimatedMinutes: 180, // 3 hours
        orderIndex: 0,
      },
      {
        name: 'Authentication Setup',
        description: 'Implement API authentication (OAuth, API keys, etc.)',
        priority: 'HIGH' as PriorityLevel,
        estimatedMinutes: 240, // 4 hours
        orderIndex: 1,
      },
      {
        name: 'Core Integration Development',
        description: 'Build API client and implement endpoints',
        priority: 'MEDIUM' as PriorityLevel,
        estimatedMinutes: 480, // 8 hours
        orderIndex: 2,
      },
      {
        name: 'Error Handling & Retries',
        description: 'Implement robust error handling and retry logic',
        priority: 'MEDIUM' as PriorityLevel,
        estimatedMinutes: 180, // 3 hours
        orderIndex: 3,
      },
      {
        name: 'Integration Testing',
        description: 'Test all API endpoints and edge cases',
        priority: 'HIGH' as PriorityLevel,
        estimatedMinutes: 240, // 4 hours
        orderIndex: 4,
      },
      {
        name: 'Documentation & Handoff',
        description: 'Document integration and create usage guide',
        priority: 'LOW' as PriorityLevel,
        estimatedMinutes: 120, // 2 hours
        orderIndex: 5,
      },
    ],
  },
];

async function seedTemplates() {
  console.log('🌱 Seeding task templates...');

  // Find a manager user to assign as creator
  const manager = await prisma.user.findFirst({
    where: { role: 'MANAGER' },
  });

  if (!manager) {
    console.error('❌ No manager found. Please create a manager user first.');
    return;
  }

  console.log(`✅ Using manager: ${manager.fullName || manager.email}`);

  for (const templateData of commonTemplates) {
    try {
      const template = await prisma.taskTemplate.create({
        data: {
          name: templateData.name,
          description: templateData.description,
          category: templateData.category,
          isPublic: templateData.isPublic,
          createdById: manager.id,
          tasks: {
            create: templateData.tasks,
          },
        },
        include: {
          tasks: true,
        },
      });

      console.log(`✅ Created template: ${template.name} (${template.tasks.length} tasks)`);
    } catch (error) {
      console.error(`❌ Failed to create template ${templateData.name}:`, error);
    }
  }

  console.log('🎉 Template seeding complete!');
}

seedTemplates()
  .catch((error) => {
    console.error('Error seeding templates:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
