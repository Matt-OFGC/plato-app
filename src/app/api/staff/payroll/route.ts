import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";
import { getCurrentUserAndCompany } from "@/lib/current";

// UK Tax and NI calculation functions
function calculateIncomeTax(grossPay: number, taxCode: string): number {
  // Basic tax allowance for 2024-2025 tax year
  const taxFreeAllowance = 12570;
  
  // For simplicity, using basic rate of 20%
  const basicRate = 0.20;
  
  // Extract number from tax code (e.g., "1250L" -> 1250)
  const multiplier = parseInt(taxCode?.replace(/[^0-9]/g, '')) || 1000;
  const personalAllowance = (multiplier / 10) * 12570;
  
  const taxableIncome = Math.max(0, grossPay * 12 - personalAllowance);
  
  if (taxableIncome <= 0) return 0;
  
  // Basic rate: 20% on income up to £37,700 (annual)
  if (taxableIncome <= 37700) {
    return (taxableIncome * basicRate) / 12;
  }
  
  // Higher rate: 40% on income above £37,700
  const basicRateTax = 37700 * basicRate / 12;
  const higherRateTax = (taxableIncome - 37700) * 0.40 / 12;
  
  return basicRateTax + higherRateTax;
}

function calculateNationalInsurance(earnings: number, niCategory: string = 'A'): number {
  // UK National Insurance rates for 2024-2025
  const weeklyLowerEarningsLimit = 123;
  const weeklyPrimaryThreshold = 242;
  const weeklyUpperEarningsLimit = 967;
  
  const monthlyLower = weeklyLowerEarningsLimit * 52 / 12;
  const monthlyPrimary = weeklyPrimaryThreshold * 52 / 12;
  const monthlyUpper = weeklyUpperEarningsLimit * 52 / 12;
  
  if (earnings < monthlyLower) return 0;
  
  // Class 1 NI contributions
  if (earnings <= monthlyUpper) {
    // Calculate NI on earnings above primary threshold
    return Math.max(0, (earnings - monthlyPrimary) * 0.10);
  } else {
    // Earnings above upper limit
    const standardNI = (monthlyUpper - monthlyPrimary) * 0.10;
    const additionalNI = (earnings - monthlyUpper) * 0.02;
    return standardNI + additionalNI;
  }
}

function calculatePension(grossPay: number, pensionRate: number | null): number {
  if (!pensionRate || pensionRate <= 0) return 0;
  return grossPay * (pensionRate / 100);
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { companyId } = await getCurrentUserAndCompany();
    
    const { searchParams } = new URL(request.url);
    const periodStart = searchParams.get('periodStart');
    const periodEnd = searchParams.get('periodEnd');

    if (!periodStart || !periodEnd) {
      return NextResponse.json(
        { error: "Period start and end dates required" },
        { status: 400 }
      );
    }

    // Get payroll runs for the period
    const payrollRuns = await prisma.payrollRun.findMany({
      where: {
        companyId: companyId!,
        periodStart: { gte: new Date(periodStart) },
        periodEnd: { lte: new Date(periodEnd) },
      },
      include: {
        payrollLines: {
          include: {
            membership: {
              include: {
                user: {
                  select: {
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { periodStart: 'desc' },
    });

    return NextResponse.json({ payrollRuns });
  } catch (error) {
    console.error("Get payroll error:", error);
    return NextResponse.json(
      { error: "Failed to get payroll data" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { companyId } = await getCurrentUserAndCompany();
    
    const body = await request.json();
    const {
      periodStart,
      periodEnd,
      payDate,
      timesheetIds,
    } = body;

    if (!periodStart || !periodEnd || !payDate) {
      return NextResponse.json(
        { error: "Period dates and pay date required" },
        { status: 400 }
      );
    }

    // Get approved timesheets for the period
    const timesheets = await prisma.timesheet.findMany({
      where: {
        companyId: companyId!,
        id: timesheetIds ? { in: timesheetIds } : undefined,
        status: 'approved',
        clockInAt: {
          gte: new Date(periodStart),
          lte: new Date(periodEnd),
        },
      },
      include: {
        membership: true,
      },
    });

    // Group timesheets by membership and calculate totals
    const membersData = new Map<number, {
      membership: any;
      totalHours: number;
      timesheets: any[];
    }>();

    for (const timesheet of timesheets) {
      const existing = membersData.get(timesheet.membershipId);
      const hours = timesheet.totalHours ? parseFloat(timesheet.totalHours.toString()) : 0;
      
      if (existing) {
        existing.totalHours += hours;
        existing.timesheets.push(timesheet);
      } else {
        membersData.set(timesheet.membershipId, {
          membership: timesheet.membership,
          totalHours: hours,
          timesheets: [timesheet],
        });
      }
    }

    // Create payroll run
    const payrollRun = await prisma.payrollRun.create({
      data: {
        companyId: companyId!,
        periodStart: new Date(periodStart),
        periodEnd: new Date(periodEnd),
        payDate: new Date(payDate),
        status: 'draft',
      },
    });

    let totalGross = 0;
    let totalTax = 0;
    let totalNI = 0;
    let totalPension = 0;

    // Create payroll lines for each member
    const payrollLines = [];
    for (const [membershipId, data] of membersData) {
      const membership = data.membership;
      const hourlyRate = membership.hourlyRate ? parseFloat(membership.hourlyRate.toString()) : 0;
      
      if (hourlyRate === 0) continue; // Skip if no rate set
      
      const grossPay = data.totalHours * hourlyRate;
      const taxDeduction = calculateIncomeTax(grossPay, membership.taxCode || '1250L');
      const niDeduction = calculateNationalInsurance(grossPay, membership.niCategory || 'A');
      const pensionAmount = calculatePension(grossPay, membership.pensionRate);
      const netPay = grossPay - taxDeduction - niDeduction - pensionAmount;

      totalGross += grossPay;
      totalTax += taxDeduction;
      totalNI += niDeduction;
      totalPension += pensionAmount;

      const line = await prisma.payrollLine.create({
        data: {
          payrollRunId: payrollRun.id,
          membershipId: membershipId,
          hoursWorked: data.totalHours,
          hourlyRate,
          grossPay,
          taxDeduction,
          niDeduction,
          pensionAmount,
          otherDeductions: 0,
          netPay,
        },
      });

      payrollLines.push(line);
    }

    // Update payroll run totals
    const updatedRun = await prisma.payrollRun.update({
      where: { id: payrollRun.id },
      data: {
        totalGross,
        totalTax,
        totalNI,
        totalPension,
        totalNet: totalGross - totalTax - totalNI - totalPension,
        status: 'calculated',
      },
      include: {
        payrollLines: {
          include: {
            membership: {
              include: {
                user: {
                  select: {
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ payrollRun: updatedRun }, { status: 201 });
  } catch (error) {
    console.error("Calculate payroll error:", error);
    return NextResponse.json(
      { error: "Failed to calculate payroll" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { companyId } = await getCurrentUserAndCompany();
    
    const body = await request.json();
    const { id, action, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Payroll run ID required" },
        { status: 400 }
      );
    }

    const data: any = { ...updates };
    
    if (action === "approve") {
      data.status = "approved";
      data.approvedBy = session.id;
      data.approvedAt = new Date();
    } else if (action === "mark_paid") {
      data.status = "paid";
    }

    if (data.periodStart) data.periodStart = new Date(data.periodStart);
    if (data.periodEnd) data.periodEnd = new Date(data.periodEnd);
    if (data.payDate) data.payDate = new Date(data.payDate);

    const payrollRun = await prisma.payrollRun.update({
      where: { id },
      data,
      include: {
        payrollLines: {
          include: {
            membership: {
              include: {
                user: {
                  select: {
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ payrollRun });
  } catch (error) {
    console.error("Update payroll error:", error);
    return NextResponse.json(
      { error: "Failed to update payroll" },
      { status: 500 }
    );
  }
}
