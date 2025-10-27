"use client";

interface Shift {
  id: number;
  membershipId: number;
  startTime: string;
  endTime: string;
  breakDuration: number;
}

interface Member {
  id: number;
  user: {
    name: string | null;
    email: string;
  };
}

interface CoverageWarning {
  type: 'over_hours' | 'understaffed' | 'overstaffed';
  severity: 'warning' | 'error';
  message: string;
  details?: string;
}

interface CoverageWarningsProps {
  shifts: Shift[];
  members: Member[];
  maxHoursPerWeek?: number;
  minStaffPerHour?: number;
  maxStaffPerHour?: number;
}

export function CoverageWarnings({
  shifts,
  members,
  maxHoursPerWeek = 48,
  minStaffPerHour = 2,
  maxStaffPerHour = 10,
}: CoverageWarningsProps) {
  const warnings = generateWarnings(
    shifts,
    members,
    maxHoursPerWeek,
    minStaffPerHour,
    maxStaffPerHour
  );

  if (warnings.length === 0) {
    return (
      <div className="bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-200 rounded-xl p-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white">
            ✓
          </div>
          <div>
            <div className="font-bold text-green-900">All Good!</div>
            <div className="text-sm text-green-700">
              No scheduling conflicts or coverage issues detected
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {warnings.map((warning, idx) => (
        <div
          key={idx}
          className={`border-2 rounded-xl p-4 ${
            warning.severity === 'error'
              ? 'bg-gradient-to-r from-red-50 to-red-100 border-red-200'
              : 'bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200'
          }`}
        >
          <div className="flex items-start space-x-3">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-white flex-shrink-0 ${
                warning.severity === 'error' ? 'bg-red-600' : 'bg-amber-600'
              }`}
            >
              {warning.severity === 'error' ? '!' : '⚠'}
            </div>
            <div className="flex-1">
              <div
                className={`font-bold ${
                  warning.severity === 'error' ? 'text-red-900' : 'text-amber-900'
                }`}
              >
                {getWarningTitle(warning.type)}
              </div>
              <div
                className={`text-sm mt-1 ${
                  warning.severity === 'error' ? 'text-red-700' : 'text-amber-700'
                }`}
              >
                {warning.message}
              </div>
              {warning.details && (
                <div
                  className={`text-xs mt-2 ${
                    warning.severity === 'error' ? 'text-red-600' : 'text-amber-600'
                  }`}
                >
                  {warning.details}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function getWarningTitle(type: string): string {
  switch (type) {
    case 'over_hours':
      return 'Excessive Hours';
    case 'understaffed':
      return 'Understaffed Period';
    case 'overstaffed':
      return 'Overstaffed Period';
    default:
      return 'Warning';
  }
}

function generateWarnings(
  shifts: Shift[],
  members: Member[],
  maxHoursPerWeek: number,
  minStaffPerHour: number,
  maxStaffPerHour: number
): CoverageWarning[] {
  const warnings: CoverageWarning[] = [];

  // Check for excessive hours per staff member
  const hoursByMember = new Map<number, number>();

  for (const shift of shifts) {
    const hours =
      (new Date(shift.endTime).getTime() - new Date(shift.startTime).getTime()) /
      (1000 * 60 * 60) -
      shift.breakDuration / 60;

    hoursByMember.set(
      shift.membershipId,
      (hoursByMember.get(shift.membershipId) || 0) + hours
    );
  }

  for (const [membershipId, hours] of hoursByMember.entries()) {
    if (hours > maxHoursPerWeek) {
      const member = members.find((m) => m.id === membershipId);
      const memberName = member?.user.name || member?.user.email.split('@')[0] || 'Staff member';

      warnings.push({
        type: 'over_hours',
        severity: 'error',
        message: `${memberName} is scheduled for ${hours.toFixed(1)} hours (max: ${maxHoursPerWeek}h)`,
        details: 'This exceeds the maximum weekly hours. Consider redistributing shifts.',
      });
    } else if (hours > maxHoursPerWeek * 0.9) {
      const member = members.find((m) => m.id === membershipId);
      const memberName = member?.user.name || member?.user.email.split('@')[0] || 'Staff member';

      warnings.push({
        type: 'over_hours',
        severity: 'warning',
        message: `${memberName} is scheduled for ${hours.toFixed(1)} hours (approaching limit of ${maxHoursPerWeek}h)`,
        details: 'Close to maximum weekly hours.',
      });
    }
  }

  // Check for coverage gaps (understaffed/overstaffed periods)
  const coverageMap = buildCoverageMap(shifts);

  for (const [hour, staffCount] of coverageMap.entries()) {
    if (staffCount < minStaffPerHour && staffCount > 0) {
      warnings.push({
        type: 'understaffed',
        severity: 'warning',
        message: `Only ${staffCount} staff at ${formatHour(hour)} (min: ${minStaffPerHour})`,
        details: 'Consider adding more staff during this period.',
      });
    }

    if (staffCount > maxStaffPerHour) {
      warnings.push({
        type: 'overstaffed',
        severity: 'warning',
        message: `${staffCount} staff at ${formatHour(hour)} (max: ${maxStaffPerHour})`,
        details: 'Too many staff scheduled. Consider redistributing.',
      });
    }
  }

  return warnings;
}

function buildCoverageMap(shifts: Shift[]): Map<number, number> {
  const coverageMap = new Map<number, number>();

  for (const shift of shifts) {
    const start = new Date(shift.startTime);
    const end = new Date(shift.endTime);

    // Count staff per hour
    for (let hour = start.getHours(); hour <= end.getHours(); hour++) {
      coverageMap.set(hour, (coverageMap.get(hour) || 0) + 1);
    }
  }

  return coverageMap;
}

function formatHour(hour: number): string {
  if (hour === 0) return '12:00 AM';
  if (hour < 12) return `${hour}:00 AM`;
  if (hour === 12) return '12:00 PM';
  return `${hour - 12}:00 PM`;
}
