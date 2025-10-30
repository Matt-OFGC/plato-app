"use client";

import { useState, useEffect } from "react";
import { format, addDays, startOfWeek, endOfWeek, isSameWeek } from "date-fns";

interface Shift {
  id: number;
  staffId: number;
  startTime: Date;
  endTime: Date;
  breakDuration: number;
  staff: {
    id: number;
    name: string;
    email: string;
  };
}

interface CopyWeekModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCopy: (sourceWeek: Date, targetWeek: Date, options: CopyOptions) => Promise<void>;
  existingShifts: Shift[];
  staff: Array<{ id: number; name: string; email: string }>;
}

interface CopyOptions {
  copyStaffAssignments: boolean;
  copyTimeBlocks: boolean;
  conflictResolution: 'skip' | 'replace' | 'ask';
}

export function CopyWeekModal({ 
  isOpen, 
  onClose, 
  onCopy, 
  existingShifts, 
  staff 
}: CopyWeekModalProps) {
  const [sourceWeek, setSourceWeek] = useState<Date>(new Date());
  const [targetWeek, setTargetWeek] = useState<Date>(new Date());
  const [options, setOptions] = useState<CopyOptions>({
    copyStaffAssignments: true,
    copyTimeBlocks: true,
    conflictResolution: 'ask',
  });
  const [preview, setPreview] = useState<{
    shiftsToCopy: Shift[];
    conflicts: Array<{ source: Shift; target: Shift }>;
    totalHours: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'select' | 'preview' | 'confirm'>('select');

  // Generate week options (last 4 weeks and next 4 weeks)
  const weekOptions = Array.from({ length: 9 }, (_, i) => {
    const date = addDays(new Date(), (i - 4) * 7);
    return {
      date: startOfWeek(date, { weekStartsOn: 1 }), // Monday start
      label: `Week of ${format(startOfWeek(date, { weekStartsOn: 1 }), 'MMM dd')}`,
    };
  });

  // Calculate preview when source/target weeks change
  useEffect(() => {
    if (sourceWeek && targetWeek && !isSameWeek(sourceWeek, targetWeek)) {
      calculatePreview();
    }
  }, [sourceWeek, targetWeek, options]);

  function calculatePreview() {
    const sourceWeekStart = startOfWeek(sourceWeek, { weekStartsOn: 1 });
    const sourceWeekEnd = endOfWeek(sourceWeek, { weekStartsOn: 1 });
    const targetWeekStart = startOfWeek(targetWeek, { weekStartsOn: 1 });
    
    // Find shifts in source week
    const shiftsToCopy = existingShifts.filter(shift => {
      const shiftDate = new Date(shift.startTime);
      return shiftDate >= sourceWeekStart && shiftDate <= sourceWeekEnd;
    });

    // Find conflicts in target week
    const targetWeekEnd = endOfWeek(targetWeek, { weekStartsOn: 1 });
    const conflicts: Array<{ source: Shift; target: Shift }> = [];
    
    existingShifts.forEach(targetShift => {
      const targetDate = new Date(targetShift.startTime);
      if (targetDate >= targetWeekStart && targetDate <= targetWeekEnd) {
        // Check if there's a corresponding shift in source week
        const dayOfWeek = targetDate.getDay();
        const sourceShift = shiftsToCopy.find(shift => {
          const sourceDate = new Date(shift.startTime);
          return sourceDate.getDay() === dayOfWeek;
        });
        
        if (sourceShift) {
          conflicts.push({ source: sourceShift, target: targetShift });
        }
      }
    });

    // Calculate total hours
    const totalHours = shiftsToCopy.reduce((total, shift) => {
      const duration = (new Date(shift.endTime).getTime() - new Date(shift.startTime).getTime()) / (1000 * 60 * 60);
      return total + duration - shift.breakDuration;
    }, 0);

    setPreview({
      shiftsToCopy,
      conflicts,
      totalHours,
    });
  }

  function handleNext() {
    if (step === 'select') {
      setStep('preview');
    } else if (step === 'preview') {
      setStep('confirm');
    }
  }

  function handleBack() {
    if (step === 'preview') {
      setStep('select');
    } else if (step === 'confirm') {
      setStep('preview');
    }
  }

  async function handleConfirm() {
    setIsLoading(true);
    try {
      await onCopy(sourceWeek, targetWeek, options);
      onClose();
    } catch (error) {
      console.error('Failed to copy week:', error);
    } finally {
      setIsLoading(false);
    }
  }

  function getStaffName(staffId: number): string {
    const staffMember = staff.find(s => s.id === staffId);
    return staffMember?.name || 'Unknown Staff';
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Copy Week Schedule</h2>
              <p className="text-emerald-100 mt-1">
                Duplicate shifts from one week to another
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-emerald-200 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            {['Select Weeks', 'Preview', 'Confirm'].map((stepName, index) => {
              const stepIndex = ['select', 'preview', 'confirm'].indexOf(step);
              const isActive = index === stepIndex;
              const isCompleted = index < stepIndex;
              
              return (
                <div key={stepName} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    isActive ? 'bg-emerald-600 text-white' :
                    isCompleted ? 'bg-emerald-100 text-emerald-600' :
                    'bg-gray-200 text-gray-500'
                  }`}>
                    {isCompleted ? '✓' : index + 1}
                  </div>
                  <span className={`ml-2 text-sm font-medium ${
                    isActive ? 'text-emerald-600' :
                    isCompleted ? 'text-emerald-600' :
                    'text-gray-500'
                  }`}>
                    {stepName}
                  </span>
                  {index < 2 && (
                    <div className={`w-8 h-0.5 mx-4 ${
                      isCompleted ? 'bg-emerald-600' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {step === 'select' && (
            <div className="space-y-6">
              {/* Source Week Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Copy From (Source Week)
                </label>
                <select
                  value={sourceWeek.toISOString()}
                  onChange={(e) => setSourceWeek(new Date(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  {weekOptions.map((option) => (
                    <option key={option.date.toISOString()} value={option.date.toISOString()}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Target Week Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Copy To (Target Week)
                </label>
                <select
                  value={targetWeek.toISOString()}
                  onChange={(e) => setTargetWeek(new Date(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  {weekOptions.map((option) => (
                    <option key={option.date.toISOString()} value={option.date.toISOString()}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Copy Options */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Copy Options</h3>
                
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={options.copyStaffAssignments}
                      onChange={(e) => setOptions(prev => ({ ...prev, copyStaffAssignments: e.target.checked }))}
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Copy staff assignments</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={options.copyTimeBlocks}
                      onChange={(e) => setOptions(prev => ({ ...prev, copyTimeBlocks: e.target.checked }))}
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Copy time blocks only</span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Conflict Resolution
                  </label>
                  <select
                    value={options.conflictResolution}
                    onChange={(e) => setOptions(prev => ({ ...prev, conflictResolution: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="skip">Skip conflicting shifts</option>
                    <option value="replace">Replace conflicting shifts</option>
                    <option value="ask">Ask for each conflict</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 'preview' && preview && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-blue-600 text-sm font-medium">Shifts to Copy</div>
                  <div className="text-2xl font-bold text-blue-900">{preview.shiftsToCopy.length}</div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="text-yellow-600 text-sm font-medium">Conflicts</div>
                  <div className="text-2xl font-bold text-yellow-900">{preview.conflicts.length}</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-green-600 text-sm font-medium">Total Hours</div>
                  <div className="text-2xl font-bold text-green-900">{preview.totalHours.toFixed(1)}h</div>
                </div>
              </div>

              {/* Shifts Preview */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Shifts to Copy</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {preview.shiftsToCopy.map((shift) => (
                    <div key={shift.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium">{getStaffName(shift.staffId)}</div>
                        <div className="text-sm text-gray-600">
                          {format(new Date(shift.startTime), 'EEE, MMM dd')} • {' '}
                          {format(new Date(shift.startTime), 'HH:mm')} - {format(new Date(shift.endTime), 'HH:mm')}
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        {((new Date(shift.endTime).getTime() - new Date(shift.startTime).getTime()) / (1000 * 60 * 60) - shift.breakDuration).toFixed(1)}h
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Conflicts Preview */}
              {preview.conflicts.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Conflicts Found</h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {preview.conflicts.map((conflict, index) => (
                      <div key={index} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="font-medium text-yellow-900">
                          {format(new Date(conflict.source.startTime), 'EEE, MMM dd')}
                        </div>
                        <div className="text-sm text-yellow-700">
                          Source: {getStaffName(conflict.source.staffId)} • {' '}
                          Target: {getStaffName(conflict.target.staffId)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 'confirm' && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Ready to Copy</h3>
              <p className="text-gray-600">
                This will copy {preview?.shiftsToCopy.length || 0} shifts from{' '}
                {format(startOfWeek(sourceWeek, { weekStartsOn: 1 }), 'MMM dd')} to{' '}
                {format(startOfWeek(targetWeek, { weekStartsOn: 1 }), 'MMM dd')}.
              </p>
              {preview?.conflicts.length > 0 && (
                <p className="text-yellow-600">
                  {preview.conflicts.length} conflicts will be resolved according to your settings.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-between">
          <button
            onClick={handleBack}
            disabled={step === 'select'}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Back
          </button>
          
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            
            {step === 'confirm' ? (
              <button
                onClick={handleConfirm}
                disabled={isLoading}
                className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Copying...' : 'Copy Week'}
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={!sourceWeek || !targetWeek || isSameWeek(sourceWeek, targetWeek)}
                className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}



