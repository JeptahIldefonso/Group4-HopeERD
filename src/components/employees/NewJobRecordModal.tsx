'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { addJobRecordAction } from '@/app/actions/employees';
import { formatPHP, formatDate } from '@/lib/utils';
import type { DepartmentItem, JobItem } from '@/lib/data/employees';
import { AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface NewJobRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  empNo: number;
  currentAssignment: {
    jobCode: string;
    jobDesc: string;
    deptCode: string;
    deptName: string;
    salary: number | null;
    effDate: string;
  };
  latestSaleDate: string | null;
  departments: DepartmentItem[];
  jobs: JobItem[];
  onSuccess?: () => void;
}

export function NewJobRecordModal({
  isOpen,
  onClose,
  empNo,
  currentAssignment,
  latestSaleDate,
  departments,
  jobs,
  onSuccess,
}: NewJobRecordModalProps) {
  const router = useRouter();
  const getToday = () => new Date().toISOString().slice(0, 10);

  const [jobCode, setJobCode] = useState(jobs[0]?.jobCode || currentAssignment.jobCode);
  const [deptCode, setDeptCode] = useState(departments[0]?.deptCode || currentAssignment.deptCode);
  const [effDate, setEffDate] = useState(getToday());
  const [salary, setSalary] = useState(
    currentAssignment.salary ? String(currentAssignment.salary) : '25000'
  );

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const res = await addJobRecordAction({
        empNo,
        jobCode,
        deptCode,
        effDate,
        salary: Number(salary),
      });

      if (res.error) {
        setErrorMsg(res.error);
        setIsSubmitting(false);
      } else {
        setIsSubmitting(false);
        onClose();
        if (onSuccess) onSuccess();
        router.refresh();
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to add job record.');
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="New Job Record"
      description="Record a promotion, transfer, or salary adjustment. This appends a permanent record to JOBHISTORY."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="flex items-start gap-2.5 rounded-[4px] border border-red-200 bg-red-50 p-3 text-xs text-red-800">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
            <p className="leading-relaxed">{errorMsg}</p>
          </div>
        )}

        {/* Current Assignment Reference Block */}
        <div className="bg-neutral-50 border border-[rgba(4,26,36,0.1)] rounded-[4px] p-3 text-xs space-y-1">
          <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block mb-1">
            Current Assignment Reference
          </span>
          <div className="grid grid-cols-2 gap-2 text-neutral-700">
            <div>
              <span className="text-neutral-400">Position:</span>{' '}
              <span className="font-medium text-[#041a24]">{currentAssignment.jobDesc}</span>
            </div>
            <div>
              <span className="text-neutral-400">Department:</span>{' '}
              <span className="font-medium text-[#041a24]">{currentAssignment.deptName}</span>
            </div>
            <div>
              <span className="text-neutral-400">Current Salary:</span>{' '}
              <span className="font-mono font-medium text-[#041a24]">
                {currentAssignment.salary != null ? formatPHP(currentAssignment.salary) : '—'}
              </span>
            </div>
            <div>
              <span className="text-neutral-400">Effective Date:</span>{' '}
              <span className="font-mono text-[#041a24]">{formatDate(currentAssignment.effDate)}</span>
            </div>
          </div>
          {latestSaleDate && (
            <p className="text-[11px] text-amber-800 mt-1 pt-1 border-t border-neutral-200">
              * Employee has sales dated up to {formatDate(latestSaleDate)}. The effective date must be after this date to preserve historic departmental revenue attribution.
            </p>
          )}
        </div>

        {/* Form Fields */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-[#041a24] mb-1">
              New Job Position <span className="text-red-500">*</span>
            </label>
            <select
              value={jobCode}
              onChange={(e) => setJobCode(e.target.value)}
              className="w-full h-9 rounded-[4px] border border-[rgba(4,26,36,0.2)] px-3 text-xs text-[#041a24] bg-white focus:outline-none focus:border-[#041a24]"
            >
              {jobs.map((j) => (
                <option key={j.jobCode} value={j.jobCode}>
                  {j.jobDesc} ({j.jobCode})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#041a24] mb-1">
              New Department <span className="text-red-500">*</span>
            </label>
            <select
              value={deptCode}
              onChange={(e) => setDeptCode(e.target.value)}
              className="w-full h-9 rounded-[4px] border border-[rgba(4,26,36,0.2)] px-3 text-xs text-[#041a24] bg-white focus:outline-none focus:border-[#041a24]"
            >
              {departments.map((d) => (
                <option key={d.deptCode} value={d.deptCode}>
                  {d.deptName} ({d.deptCode})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#041a24] mb-1">
                Effective Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={effDate}
                onChange={(e) => setEffDate(e.target.value)}
                className="w-full h-9 rounded-[4px] border border-[rgba(4,26,36,0.2)] px-3 text-xs text-[#041a24] focus:outline-none focus:border-[#041a24]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#041a24] mb-1">
                Salary (PHP) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                placeholder="30000.00"
                className="w-full h-9 rounded-[4px] border border-[rgba(4,26,36,0.2)] px-3 text-xs font-mono text-[#041a24] focus:outline-none focus:border-[#041a24]"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-[rgba(4,26,36,0.12)]">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" disabled={isSubmitting}>
            {isSubmitting ? 'Recording...' : 'Add Job Record'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
