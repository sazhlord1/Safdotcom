import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const sampleUsers = [
  {
    telegramId: 100000001,
    firstName: "علی",
    lastName: "احمدی",
    username: "ali_ahmadi",
    photoUrl: null,
    isAdmin: true,
  },
  {
    telegramId: 100000002,
    firstName: "سارا",
    lastName: "محمدی",
    username: "sara_mohammadi",
    photoUrl: null,
    isAdmin: false,
  },
  {
    telegramId: 100000003,
    firstName: "محمد",
    lastName: "رضایی",
    username: "mohammad_rezaei",
    photoUrl: null,
    isAdmin: false,
  },
  {
    telegramId: 100000004,
    firstName: "زهرا",
    lastName: "کریمی",
    username: "zahra_karimi",
    photoUrl: null,
    isAdmin: false,
  },
  {
    telegramId: 100000005,
    firstName: "امیر",
    lastName: "حسینی",
    username: "amir_hosseini",
    photoUrl: null,
    isAdmin: false,
  },
  {
    telegramId: 100000006,
    firstName: "نازنین",
    lastName: "فتحی",
    username: "nazanin_fathi",
    photoUrl: null,
    isAdmin: false,
  },
  {
    telegramId: 100000007,
    firstName: "رضا",
    lastName: "مرادی",
    username: "reza_moradi",
    photoUrl: null,
    isAdmin: false,
  },
  {
    telegramId: 100000008,
    firstName: "هانیه",
    lastName: "صالحی",
    username: "haniyeh_salehi",
    photoUrl: null,
    isAdmin: false,
  },
];

async function main() {
  console.log("Seeding database...");

  // Create users
  for (const userData of sampleUsers) {
    await prisma.user.upsert({
      where: { telegramId: userData.telegramId },
      update: {},
      create: userData,
    });
    console.log(`  Created user: ${userData.firstName} ${userData.lastName}`);
  }

  // Add some queue entries for today
  const today = new Date();
  const queueDate = new Date(
    Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
  );

  const users = await prisma.user.findMany();

  // Create queue entries for some users (alternating between microwaves)
  for (let i = 0; i < Math.min(5, users.length); i++) {
    const status = i === 0 ? "ACTIVE" : "WAITING";
    const startedAt = i === 0 ? new Date() : null;
    const microwaveId = (i % 2) + 1; // Alternate: 1, 2, 1, 2, 1

    await prisma.queueEntry.upsert({
      where: {
        queueDate_position_microwaveId: { queueDate, position: i, microwaveId },
      },
      update: {},
      create: {
        queueDate,
        position: i,
        microwaveId,
        status: status as any,
        userId: users[i].id,
        startedAt,
      },
    });
    console.log(
      `  Created queue entry: ${users[i].firstName} at position ${i} in microwave ${microwaveId} (${status})`
    );
  }

  // Add a swap offer
  const firstEntry = await prisma.queueEntry.findFirst({
    where: { queueDate, position: 1, microwaveId: 2 },
  });

  if (firstEntry) {
    await prisma.swapOffer.upsert({
      where: { id: 1 },
      update: {},
      create: {
        queueEntryId: firstEntry.id,
        message: "در ازای یک قهوه",
        status: "PENDING",
      },
    });
    console.log("  Created swap offer");
  }

  // Add audit logs
  await prisma.auditLog.createMany({
    data: [
      { action: "JOIN", userId: users[0]?.id, details: { position: 0 } },
      { action: "JOIN", userId: users[1]?.id, details: { position: 1 } },
      { action: "JOIN", userId: users[2]?.id, details: { position: 2 } },
      {
        action: "ADMIN_REORDER",
        userId: users[0]?.id,
        details: { order: [1, 2, 3] },
      },
    ],
    skipDuplicates: true,
  });

  console.log("  Created audit logs");

  console.log("\nSeeding complete!");
  console.log("\nSample users:");
  sampleUsers.forEach((u) => {
    console.log(
      `  ${u.firstName} ${u.lastName} (@${u.username}) - Admin: ${u.isAdmin}`
    );
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
