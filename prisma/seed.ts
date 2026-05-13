/**
 * Database Seed Script
 * Creates sample data for development and testing
 * 
 * Usage: npm run prisma:seed
 */

import { PrismaClient, UserRole, SubscriptionPlan } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...\n');

  // Create Account Managers
  console.log('👤 Creating account managers...');
  const manager1 = await prisma.user.upsert({
    where: { email: 'andrew.williams@knacksters.com' },
    update: {},
    create: {
      email: 'andrew.williams@knacksters.com',
      role: UserRole.MANAGER,
      firstName: 'Andrew',
      lastName: 'Williams',
      fullName: 'Andrew Williams',
      status: 'ACTIVE',
    },
  });
  console.log(`   ✅ Created manager: ${manager1.fullName}\n`);

  // Create Sample Clients
  console.log('👥 Creating sample clients...');
  
  const client1 = await prisma.user.upsert({
    where: { email: 'john.doe@acmeinc.com' },
    update: {},
    create: {
      email: 'john.doe@acmeinc.com',
      role: UserRole.CLIENT,
      firstName: 'John',
      lastName: 'Doe',
      fullName: 'John Doe',
      companyName: 'Acme Inc',
      phone: '+1-555-0101',
      accountManagerId: manager1.id,
      status: 'ACTIVE',
    },
  });
  console.log(`   ✅ Created client: ${client1.fullName} (${client1.companyName})`);

  const client2 = await prisma.user.upsert({
    where: { email: 'sarah.chen@techcorp.com' },
    update: {},
    create: {
      email: 'sarah.chen@techcorp.com',
      role: UserRole.CLIENT,
      firstName: 'Sarah',
      lastName: 'Chen',
      fullName: 'Sarah Chen',
      companyName: 'TechCorp',
      phone: '+1-555-0102',
      accountManagerId: manager1.id,
      status: 'ACTIVE',
    },
  });
  console.log(`   ✅ Created client: ${client2.fullName} (${client2.companyName})\n`);

  // Create Talent/Knacksters
  console.log('🎨 Creating sample talent...');
  
  const talent1 = await prisma.user.upsert({
    where: { email: 'emma.wilson@knacksters.com' },
    update: {},
    create: {
      email: 'emma.wilson@knacksters.com',
      role: UserRole.TALENT,
      firstName: 'Emma',
      lastName: 'Wilson',
      fullName: 'Emma Wilson',
      status: 'ACTIVE',
    },
  });
  console.log(`   ✅ Created talent: ${talent1.fullName}`);

  const talent2 = await prisma.user.upsert({
    where: { email: 'marcus.rodriguez@knacksters.com' },
    update: {},
    create: {
      email: 'marcus.rodriguez@knacksters.com',
      role: UserRole.TALENT,
      firstName: 'Marcus',
      lastName: 'Rodriguez',
      fullName: 'Marcus Rodriguez',
      status: 'ACTIVE',
    },
  });
  console.log(`   ✅ Created talent: ${talent2.fullName}\n`);

  // Create Subscriptions
  console.log('💳 Creating subscriptions...');
  
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const nextBilling = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const subscription1 = await prisma.subscription.create({
    data: {
      userId: client1.id,
      plan: SubscriptionPlan.FLEX_RETAINER,
      status: 'ACTIVE',
      billingInterval: 'MONTHLY',
      priceAmount: 350000,          // $3,500 onboarding rate in cents
      recurringPriceAmount: 700000, // $7,000 standard rate in cents
      currency: 'USD',
      monthlyHours: 100,
      extraHoursPurchased: 0,
      startDate: periodStart,
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      nextBillingDate: nextBilling,
    },
  });
  console.log(`   ✅ Created subscription for ${client1.fullName}: ${subscription1.plan}`);

  const subscription2 = await prisma.subscription.create({
    data: {
      userId: client2.id,
      plan: SubscriptionPlan.GROWTH,
      status: 'ACTIVE',
      billingInterval: 'MONTHLY',
      priceAmount: 2500000, // $25,000 in cents
      currency: 'USD',
      monthlyHours: 450,
      extraHoursPurchased: 0,
      startDate: periodStart,
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      nextBillingDate: nextBilling,
    },
  });
  console.log(`   ✅ Created subscription for ${client2.fullName}: ${subscription2.plan}\n`);

  // Create Hours Balances
  console.log('⏱️  Creating hours balances...');
  
  await prisma.hoursBalance.create({
    data: {
      userId: client1.id,
      subscriptionId: subscription1.id,
      periodStart,
      periodEnd,
      allocatedHours: 100,
      bonusHours: 0,
      extraPurchasedHours: 0,
      hoursUsed: 62,
      rolloverHours: 0,
    },
  });
  console.log(`   ✅ Created hours balance for ${client1.fullName}: 62/100 hrs used`);

  await prisma.hoursBalance.create({
    data: {
      userId: client2.id,
      subscriptionId: subscription2.id,
      periodStart,
      periodEnd,
      allocatedHours: 450,
      bonusHours: 0,
      extraPurchasedHours: 0,
      hoursUsed: 320,
      rolloverHours: 0,
    },
  });
  console.log(`   ✅ Created hours balance for ${client2.fullName}: 320/450 hrs used\n`);

  // Create Sample Projects
  console.log('📁 Creating sample projects...');
  
  const project1 = await prisma.project.create({
    data: {
      projectNumber: '001',
      clientId: client1.id,
      title: 'Website Redesign',
      description: 'Complete redesign of company website',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      estimatedHours: 120,
      startDate: new Date(now.getFullYear(), now.getMonth(), 1),
      dueDate: new Date(now.getFullYear(), now.getMonth(), 30),
      createdById: manager1.id,
      assignees: {
        create: [
          {
            userId: talent1.id,
            role: 'Lead Designer',
          },
        ],
      },
    },
  });
  console.log(`   ✅ Created project: ${project1.title} for ${client1.companyName}`);

  const project2 = await prisma.project.create({
    data: {
      projectNumber: '002',
      clientId: client2.id,
      title: 'Security Audit',
      description: 'Comprehensive security assessment',
      status: 'IN_PROGRESS',
      priority: 'URGENT',
      estimatedHours: 80,
      startDate: new Date(now.getFullYear(), now.getMonth(), 5),
      dueDate: new Date(now.getFullYear(), now.getMonth(), 20),
      createdById: manager1.id,
      assignees: {
        create: [
          {
            userId: talent2.id,
            role: 'Security Specialist',
          },
        ],
      },
    },
  });
  console.log(`   ✅ Created project: ${project2.title} for ${client2.companyName}\n`);

  // Create Sample Tasks
  console.log('✅ Creating sample tasks...');
  
  await prisma.task.create({
    data: {
      taskNumber: 'T001',
      projectId: project1.id,
      name: 'Homepage Design',
      description: 'Design new homepage layout',
      taskType: 'Design',
      status: 'ACTIVE',
      priority: 'HIGH',
      assignedToId: talent1.id,
      assignedAt: new Date(),
      estimatedMinutes: 480, // 8 hours
      loggedMinutes: 360, // 6 hours
      startDate: new Date(),
      dueDate: new Date(now.getFullYear(), now.getMonth(), 15),
      createdById: manager1.id,
    },
  });
  console.log(`   ✅ Created task: Homepage Design`);

  await prisma.task.create({
    data: {
      taskNumber: 'T002',
      projectId: project2.id,
      name: 'Vulnerability Scan',
      description: 'Run automated vulnerability scans',
      taskType: 'Security',
      status: 'ACTIVE',
      priority: 'URGENT',
      assignedToId: talent2.id,
      assignedAt: new Date(),
      estimatedMinutes: 240, // 4 hours
      loggedMinutes: 180, // 3 hours
      startDate: new Date(),
      dueDate: new Date(now.getFullYear(), now.getMonth(), 10),
      createdById: manager1.id,
    },
  });
  console.log(`   ✅ Created task: Vulnerability Scan\n`);

  // Create Sample Notifications
  console.log('🔔 Creating sample notifications...');
  
  await prisma.notification.create({
    data: {
      userId: client1.id,
      type: 'WARNING',
      title: 'Hours Running Low',
      message: 'You have 58 hours remaining this month.',
      isRead: false,
    },
  });
  
  await prisma.notification.create({
    data: {
      userId: client1.id,
      type: 'SUCCESS',
      title: 'Project Delivered',
      message: 'Homepage Design task completed by Emma Wilson',
      isRead: false,
    },
  });
  console.log(`   ✅ Created 2 notifications for ${client1.fullName}\n`);

  console.log('✨ Seed completed successfully!\n');
  console.log('📊 Summary:');
  console.log(`   - Admin Users: 0 (seed does not create privileged users)`);
  console.log(`   - Account Managers: 1`);
  console.log(`   - Clients: 2`);
  console.log(`   - Talent: 2`);
  console.log(`   - Subscriptions: 2`);
  console.log(`   - Projects: 2`);
  console.log(`   - Tasks: 2`);
  console.log(`   - Notifications: 2\n`);
  console.log('🚀 You can now:');
  console.log(`   - View data: npm run prisma:studio`);
  console.log(`   - Test services: npm run dev`);
  console.log(`   - Admin bootstrap: create one manually (e.g. godmode@knacksters.co)\n`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
