/**
 * Create Admin User Script
 * 
 * Creates an admin user in the database.
 * The admin will then sign up/log in through SuperTokens with this email.
 * 
 * Usage:
 *   npm run create-admin
 * 
 * Or with custom email:
 *   ADMIN_EMAIL=admin@example.com npm run create-admin
 */

import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import * as readline from 'readline';

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function createAdmin() {
  console.log('🔐 Admin User Creation Script\n');

  try {
    // Get email from environment or prompt
    let email = process.env.ADMIN_EMAIL;

    if (!email) {
      email = await question('Enter admin email address: ');
      
      if (!email || !email.includes('@')) {
        console.error('❌ Invalid email address');
        process.exit(1);
      }
    }

    console.log(`\nCreating admin user for: ${email}`);

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      console.log('\n⚠️  User already exists!');
      const update = await question('Update to ADMIN role? (y/n): ');
      
      if (update.toLowerCase() !== 'y') {
        console.log('❌ Cancelled');
        process.exit(0);
      }

      // Update existing user to admin
      const admin = await prisma.user.update({
        where: { email },
        data: {
          role: UserRole.ADMIN,
          status: UserStatus.ACTIVE,
        },
      });

      console.log('\n✅ User updated to ADMIN role');
      console.log(`   ID: ${admin.id}`);
      console.log(`   Email: ${admin.email}`);
      console.log(`   Name: ${admin.fullName || 'Not set'}`);
      console.log(`   Role: ${admin.role}`);
    } else {
      // Create new admin user
      const firstName = await question('Enter first name: ') || 'Admin';
      const lastName = await question('Enter last name: ') || 'User';

      const admin = await prisma.user.create({
        data: {
          email,
          role: UserRole.ADMIN,
          firstName,
          lastName,
          fullName: `${firstName} ${lastName}`,
          status: UserStatus.ACTIVE,
        },
      });

      console.log('\n✅ Admin user created successfully!');
      console.log(`   ID: ${admin.id}`);
      console.log(`   Email: ${admin.email}`);
      console.log(`   Name: ${admin.fullName}`);
      console.log(`   Role: ${admin.role}`);
    }

    console.log('\n📝 Next steps:');
    console.log('1. The admin user needs to sign up via SuperTokens:');
    console.log('   - Go to your app signup page');
    console.log('   - Sign up with the email: ' + email);
    console.log('   - Complete the signup process');
    console.log('2. Once signed up, they will automatically have ADMIN role');
    console.log('3. They can access admin endpoints with their SuperTokens session\n');

  } catch (error) {
    console.error('\n❌ Error creating admin:', error);
    process.exit(1);
  }
}

createAdmin()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  })
  .finally(async () => {
    rl.close();
    await prisma.$disconnect();
  });
