import { PrismaClient, UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Seed admin
  const adminEmail = 'admin@purplemerit.com'
  const adminPassword = 'Admin@123'

  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } })
  if (existingAdmin) {
    console.log('Admin user already exists:', adminEmail)
  } else {
    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash: await bcrypt.hash(adminPassword, 12),
        role: UserRole.ADMIN,
      },
    })
    console.log('Seeded admin user')
    console.log('  Email:', adminEmail)
    console.log('  Password:', adminPassword)
  }

  // Seed sample employee
  const empEmail = 'employee@purplemerit.com'
  const empPassword = 'Employee@123'

  const existingEmp = await prisma.user.findUnique({ where: { email: empEmail } })
  if (existingEmp) {
    console.log('Employee user already exists:', empEmail)
  } else {
    const employee = await prisma.employee.create({
      data: {
        name: 'Ayushma Tripathi',
        employeeId: 'EMP001',
        designation: 'Software Developer',
        department: 'Engineering',
        joiningDate: new Date('2026-01-01T12:00:00'),
        email: empEmail,
        phone: '9876543210',
        grossSalary: 30000,
        paymentMode: 'Bank Transfer',
      },
    })

    await prisma.user.create({
      data: {
        email: empEmail,
        passwordHash: await bcrypt.hash(empPassword, 12),
        role: UserRole.EMPLOYEE,
        employeeId: employee.id,
      },
    })

    console.log('Seeded employee user')
    console.log('  Email:', empEmail)
    console.log('  Password:', empPassword)
    console.log('  Name: Ayushma Tripathi')
    console.log('  Employee ID: EMP001')
    console.log('  Monthly Salary: ₹30,000')
  }

  const holidays = [
    { name: 'Republic Day', date: new Date('2026-01-26T12:00:00') },
    { name: 'Holi', date: new Date('2026-03-03T12:00:00') },
    { name: 'Independence Day', date: new Date('2026-08-15T12:00:00') },
    { name: 'Raksha Bandhan', date: new Date('2026-08-28T12:00:00') },
    { name: "Mahatma Gandhi's Birthday", date: new Date('2026-10-02T12:00:00') },
    { name: 'Dussehra', date: new Date('2026-10-20T12:00:00') },
    { name: 'Diwali', date: new Date('2026-11-08T12:00:00') },
    { name: 'Christmas', date: new Date('2026-12-25T12:00:00') },
  ]

  for (const holiday of holidays) {
    await prisma.publicHoliday.upsert({
      where: { date: holiday.date },
      create: holiday,
      update: { name: holiday.name },
    })
  }
  console.log(`Seeded ${holidays.length} public holidays for 2026`)

  console.log('\n--- Login Credentials ---')
  console.log('Admin:    admin@purplemerit.com / Admin@123')
  console.log('Employee: employee@purplemerit.com / Employee@123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
