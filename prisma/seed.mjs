/**
 * Demo data for local development.
 *
 * Creates the first allow-listed user along with roles, a typical day of
 * meetings across three teams, and a spread of tasks. Safe to re-run: it clears
 * this user's meetings, tasks and plan first.
 *
 * Run with: npm run db:seed
 */
import {PrismaClient} from '@prisma/client';

const prisma = new PrismaClient();

const dateKey = date => date.toISOString().slice(0, 10);
const dayAt = key => new Date(`${key}T00:00:00.000Z`);
const shift = (key, days) => {
  const date = dayAt(key);
  date.setUTCDate(date.getUTCDate() + days);
  return dateKey(date);
};

const main = async () => {
  const email = (process.env.ALLOWED_EMAILS ?? '').split(',')[0]?.trim().toLowerCase();
  if (!email) throw new Error('Set ALLOWED_EMAILS in .env before seeding.');

  const user = await prisma.user.upsert({
    where: {email},
    update: {},
    create: {email, name: email.split('@')[0]},
  });

  await prisma.userSettings.upsert({
    where: {userId: user.id},
    update: {},
    create: {userId: user.id},
  });

  // Start from a clean slate for this user.
  await prisma.dailyTask.deleteMany({where: {userId: user.id}});
  await prisma.task.deleteMany({where: {userId: user.id}});
  await prisma.meeting.deleteMany({where: {userId: user.id}});
  await prisma.role.deleteMany({where: {userId: user.id}});

  const roleData = [
    {name: 'Platform', shortName: 'PLAT', colour: '#3373b0', sortOrder: 0},
    {name: 'Payments', shortName: 'PAY', colour: '#2f9e6f', sortOrder: 1},
    {name: 'Data', shortName: 'DATA', colour: '#d9822b', sortOrder: 2},
    {name: 'Personal', shortName: 'PERS', colour: '#8e6bbf', sortOrder: 3},
  ];

  const roles = {};
  for (const role of roleData) {
    const created = await prisma.role.create({data: {...role, userId: user.id}});
    roles[role.shortName] = created.id;
  }

  const today = dateKey(new Date());

  const meetings = [
    {
      title: 'Platform stand-up',
      roleId: roles.PLAT,
      date: today,
      startMinutes: 9 * 60 + 30,
      endMinutes: 9 * 60 + 45,
      recurrence: 'WEEKDAYS',
    },
    {
      title: 'Payments sprint planning',
      roleId: roles.PAY,
      date: today,
      startMinutes: 11 * 60,
      endMinutes: 12 * 60,
      recurrence: 'FORTNIGHTLY',
      notes: 'Bring the throughput numbers from last sprint.',
    },
    {
      title: 'Data platform design review',
      roleId: roles.DATA,
      date: today,
      startMinutes: 14 * 60,
      endMinutes: 15 * 60,
      recurrence: 'NONE',
    },
    {
      title: 'Payments / Platform sync',
      roleId: roles.PAY,
      date: today,
      startMinutes: 16 * 60 + 30,
      endMinutes: 17 * 60,
      recurrence: 'WEEKLY',
    },
    {
      title: 'Data weekly',
      roleId: roles.DATA,
      date: shift(today, 1),
      startMinutes: 10 * 60,
      endMinutes: 11 * 60,
      recurrence: 'WEEKLY',
    },
  ];

  for (const meeting of meetings) {
    await prisma.meeting.create({
      data: {...meeting, userId: user.id, date: dayAt(meeting.date)},
    });
  }

  const tasks = [
    {
      title: 'Review the connection pooling change',
      roleId: roles.PLAT,
      status: 'TODO',
      jiraUrl: 'https://jira.example.com/browse/PLAT-482',
      plan: true,
    },
    {
      title: 'Write up the refund retry decision',
      roleId: roles.PAY,
      status: 'TODO',
      jiraUrl: 'https://jira.example.com/browse/PAY-1140',
      plan: true,
    },
    {
      title: 'Chase the warehouse migration sign-off',
      roleId: roles.DATA,
      status: 'TODO',
      dueDate: today,
      plan: true,
    },
    {
      title: 'Draft Q4 platform roadmap',
      roleId: roles.PLAT,
      status: 'BACKLOG',
      notes: 'Needs input from all three teams before it is worth starting.',
    },
    {
      title: 'Reconcile the settlement report',
      roleId: roles.PAY,
      status: 'BACKLOG',
      jiraUrl: 'https://jira.example.com/browse/PAY-1155',
    },
    {
      title: 'Deprecate the legacy ingest job',
      roleId: roles.DATA,
      status: 'BACKLOG',
    },
    {
      title: 'Book the dentist',
      roleId: roles.PERS,
      status: 'BACKLOG',
      dueDate: shift(today, 5),
    },
    {
      title: 'Renew the on-call rota',
      roleId: roles.PLAT,
      status: 'BACKLOG',
      dueDate: shift(today, -2),
    },
    {
      title: 'Close out the incident review',
      roleId: roles.PLAT,
      status: 'DONE',
      completedAt: new Date(),
    },
  ];

  let sortOrder = 0;
  for (const {plan, dueDate, ...task} of tasks) {
    const created = await prisma.task.create({
      data: {
        ...task,
        userId: user.id,
        dueDate: dueDate ? dayAt(dueDate) : null,
      },
    });

    if (plan) {
      await prisma.dailyTask.create({
        data: {userId: user.id, taskId: created.id, date: dayAt(today), sortOrder: sortOrder++},
      });
    }
  }

  console.log(`Seeded demo data for ${email}`);
};

main()
  .catch(error => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
