import { PrismaClient, UserRole, UserStatus, TicketType, TicketPriority, ImpactLevel, UrgencyLevel, TicketStatus, SLAStatus, AssetType, AssetLifecycleStatus, ArticleStatus, NotificationType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting NexDesk database seeding...");

  // 1. Clean existing records in reverse dependency order
  await prisma.attachmentMetadata.deleteMany();
  await prisma.auditEvent.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.ticketComment.deleteMany();
  await prisma.ticketStatusHistory.deleteMany();
  await prisma.assignmentHistory.deleteMany();
  await prisma.escalationRecord.deleteMany();
  await prisma.sLATracking.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.assetMaintenanceRecord.deleteMany();
  await prisma.assetAssignmentHistory.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.knowledgeArticle.deleteMany();
  await prisma.knowledgeCategory.deleteMany();
  await prisma.subcategory.deleteMany();
  await prisma.category.deleteMany();
  await prisma.sLAPolicy.deleteMany();
  await prisma.employeeProfile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();
  await prisma.applicationSettings.deleteMany();

  console.log("🧹 Cleaned existing records.");

  // 2. Application Settings
  await prisma.applicationSettings.create({
    data: {
      id: "default-settings",
      organizationName: "NexTech Enterprise Solutions (300 Employees)",
      supportEmail: "it-servicedesk@nexdesk.internal",
      defaultTimezone: "UTC",
      businessHoursStart: "08:00",
      businessHoursEnd: "18:00",
      businessDays: "Mon,Tue,Wed,Thu,Fri",
      enableAutoAssignment: true,
      slaWarningThreshold: 30,
    },
  });

  // 3. Departments
  const itDept = await prisma.department.create({
    data: { name: "IT Operations & Infrastructure", code: "IT", description: "Internal IT, Security, and Desktop Support" },
  });
  const engDept = await prisma.department.create({
    data: { name: "Product Engineering", code: "ENG", description: "Software development and DevOps" },
  });
  const mktDept = await prisma.department.create({
    data: { name: "Marketing & Growth", code: "MKT", description: "Brand, content, and digital acquisition" },
  });
  const finDept = await prisma.department.create({
    data: { name: "Finance & Accounting", code: "FIN", description: "Financial reporting, payroll, and compliance" },
  });
  const hrDept = await prisma.department.create({
    data: { name: "People Operations & HR", code: "HR", description: "Talent acquisition, culture, and employee success" },
  });

  // 4. SLA Policies
  await prisma.sLAPolicy.createMany({
    data: [
      {
        name: "Critical Priority SLA (P1)",
        priority: TicketPriority.CRITICAL,
        responseTimeMinutes: 15,
        resolutionTimeMinutes: 120, // 2 hours
        escalationTimeMinutes: 60,
      },
      {
        name: "High Priority SLA (P2)",
        priority: TicketPriority.HIGH,
        responseTimeMinutes: 60, // 1 hour
        resolutionTimeMinutes: 480, // 8 hours
        escalationTimeMinutes: 240,
      },
      {
        name: "Medium Priority SLA (P3)",
        priority: TicketPriority.MEDIUM,
        responseTimeMinutes: 240, // 4 hours
        resolutionTimeMinutes: 1440, // 24 hours
        escalationTimeMinutes: 720,
      },
      {
        name: "Low Priority SLA (P4)",
        priority: TicketPriority.LOW,
        responseTimeMinutes: 480, // 8 hours
        resolutionTimeMinutes: 2880, // 48 hours
        escalationTimeMinutes: 1440,
      },
    ],
  });

  // 5. Users
  const defaultPasswordHash = bcrypt.hashSync("NexDesk@2026!", 10);

  const adminUser = await prisma.user.create({
    data: {
      email: "admin@nexdesk.internal",
      passwordHash: defaultPasswordHash,
      name: "Alex Vance",
      role: UserRole.ADMINISTRATOR,
      status: UserStatus.ACTIVE,
      jobTitle: "IT Director & Chief Security Officer",
      departmentId: itDept.id,
      phone: "+1 (555) 019-2831",
      employeeProfile: {
        create: {
          employeeNumber: "EMP-0001",
          location: "San Francisco HQ - Floor 4",
          officeDesk: "4-A01",
          managerName: "Executive Board",
          hireDate: new Date("2021-03-15"),
        },
      },
    },
  });

  const itManager = await prisma.user.create({
    data: {
      email: "itmanager@nexdesk.internal",
      passwordHash: defaultPasswordHash,
      name: "Marcus Chen",
      role: UserRole.IT_MANAGER,
      status: UserStatus.ACTIVE,
      jobTitle: "IT Support Operations Manager",
      departmentId: itDept.id,
      phone: "+1 (555) 019-2832",
      employeeProfile: {
        create: {
          employeeNumber: "EMP-0012",
          location: "San Francisco HQ - Floor 4",
          officeDesk: "4-B10",
          managerName: "Alex Vance",
          hireDate: new Date("2022-01-10"),
        },
      },
    },
  });

  const agent1 = await prisma.user.create({
    data: {
      email: "agent1@nexdesk.internal",
      passwordHash: defaultPasswordHash,
      name: "Sarah Jenkins",
      role: UserRole.IT_SUPPORT_AGENT,
      status: UserStatus.ACTIVE,
      jobTitle: "Senior IT Support Specialist",
      departmentId: itDept.id,
      phone: "+1 (555) 019-2833",
      employeeProfile: {
        create: {
          employeeNumber: "EMP-0045",
          location: "San Francisco HQ - Floor 2 Support Center",
          officeDesk: "2-IT01",
          managerName: "Marcus Chen",
          hireDate: new Date("2022-06-01"),
        },
      },
    },
  });

  const agent2 = await prisma.user.create({
    data: {
      email: "agent2@nexdesk.internal",
      passwordHash: defaultPasswordHash,
      name: "David Kim",
      role: UserRole.IT_SUPPORT_AGENT,
      status: UserStatus.ACTIVE,
      jobTitle: "Desktop Support Technician",
      departmentId: itDept.id,
      phone: "+1 (555) 019-2834",
      employeeProfile: {
        create: {
          employeeNumber: "EMP-0078",
          location: "San Francisco HQ - Floor 2 Support Center",
          officeDesk: "2-IT04",
          managerName: "Marcus Chen",
          hireDate: new Date("2023-04-15"),
        },
      },
    },
  });

  const employee1 = await prisma.user.create({
    data: {
      email: "employee@nexdesk.internal",
      passwordHash: defaultPasswordHash,
      name: "Elena Rostova",
      role: UserRole.EMPLOYEE,
      status: UserStatus.ACTIVE,
      jobTitle: "Lead UI/UX Designer",
      departmentId: engDept.id,
      phone: "+1 (555) 019-3301",
      employeeProfile: {
        create: {
          employeeNumber: "EMP-0142",
          location: "San Francisco HQ - Floor 3",
          officeDesk: "3-DES-14",
          managerName: "Rachel Thorne",
          hireDate: new Date("2023-02-01"),
        },
      },
    },
  });

  const employee2 = await prisma.user.create({
    data: {
      email: "employee2@nexdesk.internal",
      passwordHash: defaultPasswordHash,
      name: "Carlos Mendez",
      role: UserRole.EMPLOYEE,
      status: UserStatus.ACTIVE,
      jobTitle: "Senior Financial Analyst",
      departmentId: finDept.id,
      phone: "+1 (555) 019-3302",
      employeeProfile: {
        create: {
          employeeNumber: "EMP-0188",
          location: "San Francisco HQ - Floor 5",
          officeDesk: "5-FIN-08",
          managerName: "Gregory Miller",
          hireDate: new Date("2023-09-15"),
        },
      },
    },
  });

  const employee3 = await prisma.user.create({
    data: {
      email: "employee3@nexdesk.internal",
      passwordHash: defaultPasswordHash,
      name: "Aisha Patel",
      role: UserRole.EMPLOYEE,
      status: UserStatus.ACTIVE,
      jobTitle: "Staff Software Engineer",
      departmentId: engDept.id,
      phone: "+1 (555) 019-3303",
      employeeProfile: {
        create: {
          employeeNumber: "EMP-0210",
          location: "Remote - Austin, TX",
          officeDesk: "Remote",
          managerName: "Rachel Thorne",
          hireDate: new Date("2022-11-01"),
        },
      },
    },
  });

  const employee4 = await prisma.user.create({
    data: {
      email: "employee4@nexdesk.internal",
      passwordHash: defaultPasswordHash,
      name: "James Wilson",
      role: UserRole.EMPLOYEE,
      status: UserStatus.ACTIVE,
      jobTitle: "Talent Acquisition Partner",
      departmentId: hrDept.id,
      phone: "+1 (555) 019-3304",
      employeeProfile: {
        create: {
          employeeNumber: "EMP-0245",
          location: "San Francisco HQ - Floor 1",
          officeDesk: "1-HR-04",
          managerName: "Laura Bennett",
          hireDate: new Date("2024-01-08"),
        },
      },
    },
  });

  // 6. Categories & Subcategories
  const catHardware = await prisma.category.create({
    data: {
      name: "Hardware & Peripherals",
      code: "HW",
      description: "Laptops, monitors, docks, keyboards, mice, printers",
      type: TicketType.INCIDENT,
      subcategories: {
        create: [
          { name: "Laptop & Desktop", code: "HW_LAPTOP" },
          { name: "Monitors & Displays", code: "HW_MONITOR" },
          { name: "Printers & Scanners", code: "HW_PRINTER" },
          { name: "Docking Stations & Hubs", code: "HW_DOCK" },
        ],
      },
    },
  });

  const catNetwork = await prisma.category.create({
    data: {
      name: "Network & VPN",
      code: "NET",
      description: "Office Wi-Fi, GlobalProtect VPN, DNS resolution, LAN ports",
      type: TicketType.INCIDENT,
      subcategories: {
        create: [
          { name: "GlobalProtect VPN", code: "NET_VPN" },
          { name: "Office Wi-Fi (802.1X)", code: "NET_WIFI" },
          { name: "DNS & Internet Access", code: "NET_DNS" },
        ],
      },
    },
  });

  const catOS = await prisma.category.create({
    data: {
      name: "Operating System & Software",
      code: "SW",
      description: "Windows 11, macOS, BSOD, software crashes, updates",
      type: TicketType.INCIDENT,
      subcategories: {
        create: [
          { name: "Windows 11 BSOD / Crashing", code: "SW_BSOD" },
          { name: "Disk Space Depletion", code: "SW_DISK" },
          { name: "Software License / Activation", code: "SW_LICENSE" },
        ],
      },
    },
  });

  const catServiceReq = await prisma.category.create({
    data: {
      name: "Service Requests & Access",
      code: "REQ",
      description: "Hardware procurement, software provisioning, onboarding",
      type: TicketType.SERVICE_REQUEST,
      subcategories: {
        create: [
          { name: "New Employee Onboarding Kit", code: "REQ_ONBOARD" },
          { name: "Software Installation Request", code: "REQ_SOFTWARE" },
          { name: "Access Permission & Role Change", code: "REQ_ACCESS" },
          { name: "Hardware Upgrade Request", code: "REQ_UPGRADE" },
        ],
      },
    },
  });

  // 7. IT Assets
  const asset1 = await prisma.asset.create({
    data: {
      assetTag: "AST-1041",
      serialNumber: "PF3A9X81",
      assetType: AssetType.LAPTOP,
      manufacturer: "Lenovo",
      model: "ThinkPad X1 Carbon Gen 11",
      operatingSystem: "Windows 11 Enterprise (23H2)",
      processor: "Intel Core i7-1365U vPro",
      ramGb: 32,
      storageGb: 1000,
      purchaseDate: new Date("2023-04-12"),
      warrantyExpiry: new Date("2026-04-12"),
      lifecycleStatus: AssetLifecycleStatus.IN_USE,
      location: "San Francisco HQ - Floor 3",
      purchaseCost: 2150.0,
      assignedToUserId: employee1.id,
      departmentId: engDept.id,
      notes: "Standard engineering configuration with BitLocker enabled.",
    },
  });

  const asset2 = await prisma.asset.create({
    data: {
      assetTag: "AST-1042",
      serialNumber: "C02G879MD6T0",
      assetType: AssetType.LAPTOP,
      manufacturer: "Apple",
      model: "MacBook Pro 16-inch M3 Pro",
      operatingSystem: "macOS Sonoma 14.5",
      processor: "Apple M3 Pro 12-Core",
      ramGb: 36,
      storageGb: 512,
      purchaseDate: new Date("2023-11-20"),
      warrantyExpiry: new Date("2026-11-20"),
      lifecycleStatus: AssetLifecycleStatus.IN_USE,
      location: "Remote - Austin, TX",
      purchaseCost: 2499.0,
      assignedToUserId: employee3.id,
      departmentId: engDept.id,
      notes: "Enrolled in Apple Business Manager & Jamf Pro MDM.",
    },
  });

  const asset3 = await prisma.asset.create({
    data: {
      assetTag: "AST-1043",
      serialNumber: "8HK30F2",
      assetType: AssetType.LAPTOP,
      manufacturer: "Dell",
      model: "Latitude 7440 Ultralight",
      operatingSystem: "Windows 11 Enterprise (23H2)",
      processor: "Intel Core i5-1345U",
      ramGb: 16,
      storageGb: 512,
      purchaseDate: new Date("2023-09-01"),
      warrantyExpiry: new Date("2026-09-01"),
      lifecycleStatus: AssetLifecycleStatus.IN_USE,
      location: "San Francisco HQ - Floor 5",
      purchaseCost: 1540.0,
      assignedToUserId: employee2.id,
      departmentId: finDept.id,
      notes: "Standard finance build with Excel solver add-ins and SAP GUI.",
    },
  });

  const asset4 = await prisma.asset.create({
    data: {
      assetTag: "AST-2089",
      serialNumber: "CN-034K89-72872",
      assetType: AssetType.MONITOR,
      manufacturer: "Dell",
      model: "UltraSharp U2723QE 27-inch 4K",
      purchaseDate: new Date("2023-02-14"),
      warrantyExpiry: new Date("2026-02-14"),
      lifecycleStatus: AssetLifecycleStatus.IN_USE,
      location: "San Francisco HQ - Floor 3 Desk 3-DES-14",
      purchaseCost: 580.0,
      assignedToUserId: employee1.id,
      departmentId: engDept.id,
      notes: "USB-C hub 90W power delivery display.",
    },
  });

  const asset5 = await prisma.asset.create({
    data: {
      assetTag: "AST-3001",
      serialNumber: "VNB3R89120",
      assetType: AssetType.PRINTER,
      manufacturer: "HP",
      model: "LaserJet Enterprise M608dn",
      purchaseDate: new Date("2022-08-10"),
      warrantyExpiry: new Date("2025-08-10"),
      lifecycleStatus: AssetLifecycleStatus.IN_USE,
      location: "Floor 3 Copy Center (IP: 10.20.4.15)",
      purchaseCost: 1850.0,
      departmentId: itDept.id,
      notes: "Secure pull-printing enabled via badge reader.",
    },
  });

  const asset6 = await prisma.asset.create({
    data: {
      assetTag: "AST-1044",
      serialNumber: "PF4B0Y92",
      assetType: AssetType.LAPTOP,
      manufacturer: "Lenovo",
      model: "ThinkPad T14s Gen 4",
      operatingSystem: "Windows 11 Enterprise (23H2)",
      processor: "AMD Ryzen 7 PRO 7840U",
      ramGb: 32,
      storageGb: 1000,
      purchaseDate: new Date("2024-02-05"),
      warrantyExpiry: new Date("2027-02-05"),
      lifecycleStatus: AssetLifecycleStatus.IN_STORAGE,
      location: "IT Storage Cage 2B - Shelf 3",
      purchaseCost: 1720.0,
      departmentId: itDept.id,
      notes: "Ready for deployment. Windows Autopilot pre-provisioned.",
    },
  });

  // Asset Assignment & Maintenance History
  await prisma.assetAssignmentHistory.create({
    data: {
      assetId: asset1.id,
      assignedToUserId: employee1.id,
      assignedByUserId: itManager.id,
      assignedAt: new Date("2023-04-15"),
      notes: "Initial deployment for Lead UI Designer role.",
    },
  });

  await prisma.assetMaintenanceRecord.create({
    data: {
      assetId: asset1.id,
      maintenanceType: "PREVENTIVE",
      description: "BIOS firmware update to v1.34 and thermal paste inspection.",
      cost: 0,
      performedBy: "David Kim",
      performedAt: new Date("2024-01-20"),
      notes: "Thermal test passed under load.",
    },
  });

  // 8. Knowledge Base Categories & Articles
  const kbCatNetwork = await prisma.knowledgeCategory.create({
    data: {
      name: "Network & VPN",
      slug: "network-vpn",
      description: "Resolving connectivity, DNS, Wi-Fi 802.1X, and VPN problems",
      sortOrder: 1,
    },
  });

  const kbCatWindows = await prisma.knowledgeCategory.create({
    data: {
      name: "Windows & System",
      slug: "windows-system",
      description: "Windows 11 OS troubleshooting, BSOD diagnosis, and performance tuning",
      sortOrder: 2,
    },
  });

  const kbCatSoftware = await prisma.knowledgeCategory.create({
    data: {
      name: "Enterprise Software",
      slug: "enterprise-software",
      description: "Microsoft 365, Outlook, Slack, and collaboration apps",
      sortOrder: 3,
    },
  });

  const kbCatHardware = await prisma.knowledgeCategory.create({
    data: {
      name: "Hardware & Peripherals",
      slug: "hardware-peripherals",
      description: "Display docking, printers, audio headsets, and warranty repairs",
      sortOrder: 4,
    },
  });

  await prisma.knowledgeArticle.createMany({
    data: [
      {
        slug: "vpn-connection-failures-troubleshooting",
        title: "Resolving GlobalProtect VPN Connection & Gateway Failures",
        summary: "Step-by-step resolution for Error 1002, gateway timeout, and certificate expiration in GlobalProtect.",
        categoryId: kbCatNetwork.id,
        status: ArticleStatus.PUBLISHED,
        authorId: agent1.id,
        tags: "vpn,globalprotect,network,remote,gateway",
        troubleshootingSteps: `1. Verify you have active internet connectivity by opening https://1.1.1.1.
2. In the Windows System Tray, right-click the GlobalProtect globe icon and select Settings.
3. Select the Portal 'vpn.nexdesk.internal'.
4. Click 'Refresh Connection' to re-fetch the signed gateway certificate.
5. If authentication fails, test your Okta MFA token in a web browser.
6. Open PowerShell as non-admin and run: Test-NetConnection vpn.nexdesk.internal -Port 443.`,
        prerequisites: "Active employee SSO credentials, authenticating from an approved geolocation.",
        expectedResults: "Status changes from 'Connecting' to 'Connected'. Internal DNS resolves 10.20.0.0/16 subnets.",
        viewCount: 342,
        helpfulCount: 88,
        notHelpfulCount: 3,
        content: `## Overview
NexDesk utilizes Palo Alto GlobalProtect for secure encrypted remote tunneling into internal services (Jira, staging databases, ERP).

### Common Symptoms
- Gateway timed out (Error 1002)
- Server certificate invalid or expired
- Authentication prompt loops repeatedly without signing in

### Resolution Steps
Follow the step-by-step checklist above. If error persists, reboot the 'PanGPS' service or contact IT Support for gateway IP whitelisting.`,
      },
      {
        slug: "windows-11-bsod-and-crash-diagnostics",
        title: "Windows 11 Blue Screen (BSOD) Triage & Dump Analysis",
        summary: "Diagnostic workflow for DRIVER_IRQL_NOT_LESS_OR_EQUAL and CRITICAL_PROCESS_DIED stop codes.",
        categoryId: kbCatWindows.id,
        status: ArticleStatus.PUBLISHED,
        authorId: adminUser.id,
        tags: "windows,bsod,crash,minidump,driver,hardware",
        troubleshootingSteps: `1. Note down the exact Stop Code displayed on the blue screen (e.g., 0x000000D1).
2. Boot into Windows Recovery Mode by holding Shift while selecting Restart.
3. Select Troubleshoot > Advanced Options > Startup Settings > Restart, then press 4 for Safe Mode.
4. Check C:\\Windows\\Minidump for memory dump files.
5. Run System File Checker: sfc /scannow in an elevated command prompt.
6. Check Lenovo Vantage / Dell Command Update for pending firmware and chipset driver updates.`,
        prerequisites: "Physical access to the workstation and BitLocker recovery key available in your IT profile.",
        expectedResults: "Clean boot without recurring bugchecks. System stability restored.",
        viewCount: 195,
        helpfulCount: 52,
        notHelpfulCount: 1,
        content: `## Standard Windows 11 Crash Procedure
Most workplace BSOD events stem from mismatched docking station graphics drivers or outdated Wi-Fi adapter firmware. Never run registry cleaning tools or third-party driver updaters.`,
      },
      {
        slug: "office-365-outlook-sync-profile-repair",
        title: "Outlook Desktop Sync Failures & OST Cache Rebuild",
        summary: "How to resolve 'Disconnected' state, stuck outbox items, and corrupted OST data in Outlook 365.",
        categoryId: kbCatSoftware.id,
        status: ArticleStatus.PUBLISHED,
        authorId: agent2.id,
        tags: "outlook,email,m365,ost,exchange,sync",
        troubleshootingSteps: `1. Check Outlook status bar in the bottom right corner for 'Connected to: Microsoft Exchange'.
2. Close Outlook completely from Task Manager.
3. Press Win+R, type outlook.exe /safe and press Enter to test in safe mode without add-ins.
4. Navigate to Control Panel > Mail (Microsoft Outlook) > Data Files.
5. Highlight your primary email OST file and select 'Open File Location'.
6. Rename current .ost to .ost.old and reopen Outlook to generate a fresh synchronized cache.`,
        prerequisites: "Office 365 Enterprise license and active internet connection.",
        expectedResults: "Outlook completes 'Updating Inbox' and reaches 'All folders are up to date'.",
        viewCount: 421,
        helpfulCount: 130,
        notHelpfulCount: 6,
        content: `## Resolving Mailbox Sync Issues
When mail stops syncing or drafts refuse to send, rebuilding the local cache file (.ost) is the safest non-destructive method that preserves server-side emails.`,
      },
      {
        slug: "enterprise-wifi-8021x-certificate-reconnect",
        title: "Connecting to 'NexDesk-Secure' Enterprise Wi-Fi (802.1X EAP-TLS)",
        summary: "Troubleshoot corporate Wi-Fi authentication, expired device certificates, and roaming drops.",
        categoryId: kbCatNetwork.id,
        status: ArticleStatus.PUBLISHED,
        authorId: agent1.id,
        tags: "wifi,802.1x,wireless,radius,certificate",
        troubleshootingSteps: `1. Forget 'NexDesk-Secure' in Windows Network Settings.
2. Verify that your machine certificate is valid: Run certmgr.msc and look under Personal > Certificates.
3. Select 'NexDesk-Secure' from available networks.
4. When prompted, select 'Connect using a certificate' or enter your AD credentials (username only, without domain).
5. Accept the RADIUS thumbprint matching SHA-256 ending in 4F:9A.`,
        prerequisites: "Machine enrolled in corporate Active Directory or Intune MDM.",
        expectedResults: "Assigned dynamic IP in 10.20.8.0/22 subnet with internet and intranet access.",
        viewCount: 280,
        helpfulCount: 74,
        notHelpfulCount: 2,
        content: `## Enterprise Wi-Fi Policy
NexDesk-Secure uses WPA3-Enterprise with RADIUS certificate-based authentication. Guest network is strictly isolated from internal repositories.`,
      },
      {
        slug: "network-printer-mapping-and-driver-repair",
        title: "Connecting to Floor Printers & Clearing Spooler Jams",
        summary: "Guide to mapping departmental HP LaserJet printers and resetting the Windows Print Spooler.",
        categoryId: kbCatHardware.id,
        status: ArticleStatus.PUBLISHED,
        authorId: agent2.id,
        tags: "printer,hp,laserjet,spooler,paperjam",
        troubleshootingSteps: `1. Open Windows Settings > Bluetooth & devices > Printers & scanners.
2. Select 'Add device' > 'The printer that I want isn't listed'.
3. Select 'Select a shared printer by name' and enter \\\\printserver.nexdesk.internal\\HP-Floor3-Color.
4. If documents are stuck in queue, open Services.msc, restart 'Print Spooler' service.
5. Clear temporary spooler files in C:\\Windows\\System32\\spool\\PRINTERS\\.`,
        prerequisites: "Connected to corporate LAN or GlobalProtect VPN.",
        expectedResults: "Test page prints successfully with employee badge release confirmation.",
        viewCount: 167,
        helpfulCount: 45,
        notHelpfulCount: 4,
        content: `## Print Services Overview
All departmental printers require badge swipe to release jobs to prevent sensitive document exposure and waste.`,
      },
      {
        slug: "low-disk-space-safe-temp-cleanup",
        title: "Safe Disk Space Recovery on Windows Workstations",
        summary: "Purge temporary caches, node_modules, and Windows Update downloads without corrupting applications.",
        categoryId: kbCatWindows.id,
        status: ArticleStatus.PUBLISHED,
        authorId: adminUser.id,
        tags: "disk,storage,cleanup,temp,windows",
        troubleshootingSteps: `1. Press Win+I > System > Storage > Temporary files.
2. Check 'Previous Windows installations' and 'Delivery Optimization Files' (safely reclaims 15-30 GB).
3. Clear user temp folder: Press Win+R, enter %temp%, delete files older than 7 days.
4. For software developers, run: npx npkill to locate oversized abandoned node_modules folders.
5. Run cleanmgr.exe as administrator for system-level component cleanup.`,
        prerequisites: "Local user access.",
        expectedResults: "At least 20 GB free space on OS C: drive.",
        viewCount: 312,
        helpfulCount: 94,
        notHelpfulCount: 0,
        content: `## Storage Policy
Operating systems require at least 15% free disk capacity for swap memory and update staging. Machines below 10 GB free are flagged automatically.`,
      },
    ],
  });

  // 9. Tickets & Incidents
  const now = new Date();
  const subCats = await prisma.subcategory.findMany();
  const subVpn = subCats.find((s) => s.code === "NET_VPN");
  const subLaptop = subCats.find((s) => s.code === "HW_LAPTOP");
  const subBSOD = subCats.find((s) => s.code === "SW_BSOD");
  const subOnboard = subCats.find((s) => s.code === "REQ_ONBOARD");
  const subPrinter = subCats.find((s) => s.code === "HW_PRINTER");
  const subSoftware = subCats.find((s) => s.code === "REQ_SOFTWARE");

  // Ticket 1: CRITICAL Incident - In Progress
  const t1 = await prisma.ticket.create({
    data: {
      ticketCode: "INC-1001",
      type: TicketType.INCIDENT,
      title: "Core VPN Gateway unreachable for US-West engineering cluster",
      description: "Multiple remote engineers are experiencing continuous connection drops when reaching staging Kubernetes clusters through vpn.nexdesk.internal.",
      categoryId: catNetwork.id,
      subcategoryId: subVpn?.id,
      priority: TicketPriority.CRITICAL,
      impact: ImpactLevel.HIGH,
      urgency: UrgencyLevel.HIGH,
      status: TicketStatus.IN_PROGRESS,
      requesterId: employee3.id,
      assignedAgentId: agent1.id,
      firstResponseDue: new Date(now.getTime() - 1000 * 60 * 30),
      firstResponseAt: new Date(now.getTime() - 1000 * 60 * 40),
      resolutionDue: new Date(now.getTime() + 1000 * 60 * 75), // within SLA
      slaStatus: SLAStatus.WITHIN_SLA,
      comments: {
        create: [
          {
            authorId: agent1.id,
            content: "Investigating gateway load balancer logs in AWS Oregon region. Palo Alto tunnel telemetry indicates CPU spike.",
            isInternal: true,
          },
          {
            authorId: agent1.id,
            content: "We have isolated the degraded tunnel and are migrating traffic to redundant Gateway-02. Please allow 5 minutes to reconnect.",
            isInternal: false,
          },
        ],
      },
      statusHistory: {
        create: [
          {
            previousStatus: TicketStatus.NEW,
            newStatus: TicketStatus.TRIAGED,
            changedById: itManager.id,
            changeReason: "Triaged and escalated due to multi-engineer impact.",
          },
          {
            previousStatus: TicketStatus.TRIAGED,
            newStatus: TicketStatus.IN_PROGRESS,
            changedById: agent1.id,
            changeReason: "Assigned to Sarah Jenkins for tunnel failover execution.",
          },
        ],
      },
    },
  });

  // Ticket 2: HIGH Incident - Triaged (Approaching SLA)
  const t2 = await prisma.ticket.create({
    data: {
      ticketCode: "INC-1002",
      type: TicketType.INCIDENT,
      title: "ThinkPad X1 Carbon intermittent BSOD with SYSTEM_SERVICE_EXCEPTION",
      description: "Workstation bluescreens twice a day whenever unplugging from the Dell USB-C dock. BitLocker recovery prompted twice this week.",
      categoryId: catHardware.id,
      subcategoryId: subLaptop?.id,
      priority: TicketPriority.HIGH,
      impact: ImpactLevel.HIGH,
      urgency: UrgencyLevel.MEDIUM,
      status: TicketStatus.TRIAGED,
      requesterId: employee1.id,
      assignedAgentId: agent2.id,
      affectedAssetId: asset1.id,
      firstResponseDue: new Date(now.getTime() + 1000 * 60 * 20),
      resolutionDue: new Date(now.getTime() + 1000 * 60 * 35),
      slaStatus: SLAStatus.APPROACHING_BREACH,
      comments: {
        create: [
          {
            authorId: itManager.id,
            content: "Assigned to David Kim. Check thunderbolt controller firmware and minidump at C:\\Windows\\Minidump.",
            isInternal: true,
          },
        ],
      },
      statusHistory: {
        create: [
          {
            previousStatus: TicketStatus.NEW,
            newStatus: TicketStatus.TRIAGED,
            changedById: itManager.id,
            changeReason: "Hardware diagnostic required.",
          },
        ],
      },
    },
  });

  // Ticket 3: Service Request - New (Awaiting Triage)
  const t3 = await prisma.ticket.create({
    data: {
      ticketCode: "REQ-2001",
      type: TicketType.SERVICE_REQUEST,
      title: "New Hire Onboarding Equipment Request: Marketing Specialist",
      description: "Requesting standard employee workstation, Dell 27-inch display, corporate wireless mouse, and Microsoft 365 E5 license for incoming hire starting Monday.",
      categoryId: catServiceReq.id,
      subcategoryId: subOnboard?.id,
      priority: TicketPriority.MEDIUM,
      impact: ImpactLevel.MEDIUM,
      urgency: UrgencyLevel.MEDIUM,
      status: TicketStatus.NEW,
      requesterId: employee4.id,
      resolutionDue: new Date(now.getTime() + 1000 * 60 * 60 * 20),
      slaStatus: SLAStatus.WITHIN_SLA,
    },
  });

  // Ticket 4: Resolved Incident
  const t4 = await prisma.ticket.create({
    data: {
      ticketCode: "INC-1003",
      type: TicketType.INCIDENT,
      title: "Floor 3 HP LaserJet Printer paper jam and offline in Windows print queue",
      description: "Users on Floor 3 cannot release badge print jobs. Error message 'Printer offline' displayed in Windows printer dialogue.",
      categoryId: catHardware.id,
      subcategoryId: subPrinter?.id,
      priority: TicketPriority.LOW,
      impact: ImpactLevel.LOW,
      urgency: UrgencyLevel.LOW,
      status: TicketStatus.RESOLVED,
      requesterId: employee2.id,
      assignedAgentId: agent2.id,
      affectedAssetId: asset5.id,
      firstResponseDue: new Date(now.getTime() - 1000 * 60 * 60 * 5),
      firstResponseAt: new Date(now.getTime() - 1000 * 60 * 60 * 4),
      resolutionDue: new Date(now.getTime() + 1000 * 60 * 60 * 12),
      resolvedAt: new Date(now.getTime() - 1000 * 60 * 30),
      slaStatus: SLAStatus.WITHIN_SLA,
      resolutionNotes: "Cleared accordion paper jam in Tray 2 roller mechanism. Re-seated roller assembly and ran print test successfully.",
      rootCause: "Heavy 110lb cardstock fed into standard 20lb paper tray.",
      comments: {
        create: [
          {
            authorId: agent2.id,
            content: "Physical inspection completed. Tray 2 rollers cleaned and aligned. Printer back online.",
            isInternal: false,
          },
        ],
      },
      statusHistory: {
        create: [
          {
            previousStatus: TicketStatus.NEW,
            newStatus: TicketStatus.IN_PROGRESS,
            changedById: agent2.id,
            changeReason: "Dispatched to Floor 3 copy room.",
          },
          {
            previousStatus: TicketStatus.IN_PROGRESS,
            newStatus: TicketStatus.RESOLVED,
            changedById: agent2.id,
            changeReason: "Paper jam cleared and test page verified.",
          },
        ],
      },
    },
  });

  // Ticket 5: Breached Incident (Demonstrating SLA breach tracking)
  const t5 = await prisma.ticket.create({
    data: {
      ticketCode: "INC-1004",
      type: TicketType.INCIDENT,
      title: "Financial ERP reporting database slow query timeout",
      description: "Scheduled month-end reporting jobs timing out after 180 seconds on SQL server.",
      categoryId: catHardware.id,
      priority: TicketPriority.HIGH,
      impact: ImpactLevel.HIGH,
      urgency: UrgencyLevel.HIGH,
      status: TicketStatus.IN_PROGRESS,
      requesterId: employee2.id,
      assignedAgentId: agent1.id,
      firstResponseDue: new Date(now.getTime() - 1000 * 60 * 120),
      firstResponseAt: new Date(now.getTime() - 1000 * 60 * 110),
      resolutionDue: new Date(now.getTime() - 1000 * 60 * 45), // BREACHED
      slaStatus: SLAStatus.BREACHED,
      comments: {
        create: [
          {
            authorId: agent1.id,
            content: "Database index maintenance scheduled with DBA team.",
            isInternal: true,
          },
        ],
      },
    },
  });

  // SLA Tracking Records
  await prisma.sLATracking.create({
    data: {
      ticketId: t1.id,
      responseDeadline: t1.firstResponseDue || now,
      resolutionDeadline: t1.resolutionDue || now,
      isResponseBreached: false,
      isResolutionBreached: false,
    },
  });

  await prisma.sLATracking.create({
    data: {
      ticketId: t5.id,
      responseDeadline: t5.firstResponseDue || now,
      resolutionDeadline: t5.resolutionDue || now,
      isResponseBreached: false,
      isResolutionBreached: true,
      resolutionBreachedAt: t5.resolutionDue,
    },
  });

  // 10. In-App Notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: employee1.id,
        title: "Ticket Update: INC-1002",
        message: "Your ticket 'ThinkPad X1 Carbon intermittent BSOD' has been triaged and assigned to David Kim.",
        type: NotificationType.TICKET_ASSIGNED,
        linkUrl: `/tickets/${t2.id}`,
        isRead: false,
      },
      {
        userId: agent1.id,
        title: "SLA Warning: INC-1004 Breached",
        message: "Resolution deadline has expired for 'Financial ERP reporting database slow query timeout'.",
        type: NotificationType.SLA_BREACHED,
        linkUrl: `/tickets/${t5.id}`,
        isRead: false,
      },
      {
        userId: adminUser.id,
        title: "Critical Incident Created",
        message: "INC-1001: Core VPN Gateway unreachable for US-West engineering cluster.",
        type: NotificationType.TICKET_CREATED,
        linkUrl: `/tickets/${t1.id}`,
        isRead: true,
      },
    ],
  });

  // 11. Audit Events
  await prisma.auditEvent.createMany({
    data: [
      {
        actorId: adminUser.id,
        actorEmail: adminUser.email,
        actorRole: "ADMINISTRATOR",
        action: "SYSTEM_INITIALIZED",
        entityType: "System",
        entityId: "system",
        description: "NexDesk enterprise platform seeded and initial configuration applied.",
        ipAddress: "127.0.0.1",
        userAgent: "NexDesk Provisioning Engine",
      },
      {
        actorId: itManager.id,
        actorEmail: itManager.email,
        actorRole: "IT_MANAGER",
        action: "TICKET_TRIAGED",
        entityType: "Ticket",
        entityId: t1.id,
        description: "Triage completed for INC-1001 with Critical priority.",
        ipAddress: "192.168.1.105",
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      },
      {
        actorId: agent2.id,
        actorEmail: agent2.email,
        actorRole: "IT_SUPPORT_AGENT",
        action: "TICKET_RESOLVED",
        entityType: "Ticket",
        entityId: t4.id,
        description: "INC-1003 status changed to RESOLVED with root cause documented.",
        ipAddress: "192.168.1.112",
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      },
    ],
  });

  console.log("✅ Seed completed successfully with demo users, assets, articles, and tickets!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
