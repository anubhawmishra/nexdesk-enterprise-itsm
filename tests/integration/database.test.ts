import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { TicketPriority, TicketType, TicketStatus } from "@prisma/client";
import { calculateSLADeadlines } from "@/lib/sla/sla-engine";

describe("Database Integration & Multi-Entity Workflows", () => {
  let testUser: any;
  let testCategory: any;
  let createdTicketId: string;

  beforeAll(async () => {
    testUser = await prisma.user.findFirst({
      where: { email: "employee@nexdesk.internal" },
    });
    testCategory = await prisma.category.findFirst();
  });

  afterAll(async () => {
    // Clean up created integration test ticket if exists
    if (createdTicketId) {
      await prisma.ticketComment.deleteMany({ where: { ticketId: createdTicketId } });
      await prisma.ticketStatusHistory.deleteMany({ where: { ticketId: createdTicketId } });
      await prisma.sLATracking.deleteMany({ where: { ticketId: createdTicketId } });
      await prisma.ticket.deleteMany({ where: { id: createdTicketId } });
    }
  });

  it("verifies seeded demo users and categories exist in PostgreSQL", async () => {
    expect(testUser).toBeDefined();
    expect(testUser?.email).toBe("employee@nexdesk.internal");
    expect(testCategory).toBeDefined();

    const totalUsers = await prisma.user.count();
    expect(totalUsers).toBeGreaterThanOrEqual(4);
  });

  it("creates a new ticket with SLA tracking in a database transaction", async () => {
    const { firstResponseDue, resolutionDue } = calculateSLADeadlines(TicketPriority.HIGH);
    const code = `INC-TEST-${Date.now().toString().slice(-4)}`;

    const newTicket = await prisma.$transaction(async (tx) => {
      const ticket = await tx.ticket.create({
        data: {
          ticketCode: code,
          type: TicketType.INCIDENT,
          title: "Integration Test BSOD Diagnostics",
          description: "Evaluating database persistence and foreign key constraints in vitest suite.",
          categoryId: testCategory.id,
          priority: TicketPriority.HIGH,
          status: TicketStatus.NEW,
          requesterId: testUser.id,
          firstResponseDue,
          resolutionDue,
        },
      });

      await tx.sLATracking.create({
        data: {
          ticketId: ticket.id,
          responseDeadline: firstResponseDue,
          resolutionDeadline: resolutionDue,
        },
      });

      return ticket;
    });

    createdTicketId = newTicket.id;
    expect(newTicket.id).toBeDefined();
    expect(newTicket.ticketCode).toBe(code);

    const persisted = await prisma.ticket.findUnique({
      where: { id: newTicket.id },
      include: { slaTracking: true, requester: true },
    });

    expect(persisted?.requester.email).toBe("employee@nexdesk.internal");
    expect(persisted?.slaTracking).toBeDefined();
  });

  it("records ticket comments and internal notes accurately", async () => {
    const comment = await prisma.ticketComment.create({
      data: {
        ticketId: createdTicketId,
        authorId: testUser.id,
        content: "Attached memory dump for technician analysis.",
        isInternal: false,
      },
    });

    expect(comment.id).toBeDefined();

    const commentsInDb = await prisma.ticketComment.findMany({
      where: { ticketId: createdTicketId },
    });
    expect(commentsInDb.length).toBe(1);
    expect(commentsInDb[0].content).toBe("Attached memory dump for technician analysis.");
  });

  it("records asset assignment history when assigning hardware", async () => {
    const asset = await prisma.asset.findFirst();
    expect(asset).toBeDefined();

    if (asset && testUser) {
      const history = await prisma.assetAssignmentHistory.create({
        data: {
          assetId: asset.id,
          assignedToUserId: testUser.id,
          assignedByUserId: testUser.id,
          notes: "Integration test custody audit entry",
        },
      });

      expect(history.id).toBeDefined();

      // Clean up test history record
      await prisma.assetAssignmentHistory.delete({ where: { id: history.id } });
    }
  });
});
