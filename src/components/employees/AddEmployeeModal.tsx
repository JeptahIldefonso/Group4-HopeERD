'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { addEmployeeAction } from '@/app/actions/employees';
import type { DepartmentItem, JobItem } from '@/lib/data/employees';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface AddEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  departments: DepartmentItem[];
  jobs: JobItem[];
  onSuccess?: () => void;
}

export function AddEmployeeModal({
  isOpen,
  onClose,
  departments,
  jobs,
  onSuccess,
}: AddEmployeeModalProps) {
  const router = useRouter();

  const getToday = () => new Date().toISOString().slice(0, 10);

  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [gender, setGender] = useState<'M' | 'F'>('M');
  const [birthDate, setBirthDate] = useState('1995-01-01');
  const [hireDate, setHireDate] = useState(getToday());
  const [jobCode, setJobCode] = useState(jobs[0]?.jobCode || '');
  const [deptCode, setDeptCode] = useState(departments[0]?.deptCode || '');
  const [effDate, setEffDate] = useState(getToday());
  const [salary, setSalary] = useState('25000');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync effDate with hireDate by default when hireDate changes
  const handleHireDateChange = (val: string) => {
    setHireDate(val);
    setEffDate(val);
  };

  useEffect(() => {
    if (jobs.length > 0 && !jobCode) setJobCode(jobs[0].jobCode);
    if (departments.length > 0 && !deptCode) setDeptCode(departments[0].deptCode);
  }, [jobs, departments, jobCode, deptCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const res = await addEmployeeAction({
        lastName,
        firstName,
        gender,
        birthDate,
        hireDate,
        jobCode,
        deptCode,
        salary: Number(salary),
        effDate,
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
      setErrorMsg(err?.message || 'Failed to add employee.');
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Employee"
      description="Create a new employee profile and their initial job history assignment."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="flex items-start gap-2.5 rounded-md border border-[#FDECEA] bg-[#FDECEA]/60 p-3 text-xs text-[#B42318]">
            <AlertCircle className="h-4 w-4 shrink-0 text-[#B42318] mt-0.5" />
            <p className="leading-relaxed">{errorMsg}</p>
          </div>
        )}

        {/* Section: Personal Information */}
        <div className="space-y-3 border-b border-[#DDE3DE] pb-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#17231F] uppercase tracking-wider">
              1. Employee Information
            </span>
            <span className="text-[11px] font-mono text-[#52615B]">
              Emp No: Auto-assigned sequence
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#17231F] mb-1">
                Last name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="e.g. Santos"
                className="w-full h-9 rounded-md border border-[#CCD5CD] px-3 text-xs text-[#17231F] focus:outline-none focus:border-[#245B48] focus:ring-1 focus:ring-[#245B48]/30 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#17231F] mb-1">
                First name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="e.g. Maria"
                className="w-full h-9 rounded-md border border-[#CCD5CD] px-3 text-xs text-[#17231F] focus:outline-none focus:border-[#245B48] focus:ring-1 focus:ring-[#245B48]/30 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#17231F] mb-1">
                Gender <span className="text-red-500">*</span>
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as 'M' | 'F')}
                className="w-full h-9 rounded-md border border-[#CCD5CD] px-3 text-xs text-[#17231F] bg-white focus:outline-none focus:border-[#245B48] focus:ring-1 focus:ring-[#245B48]/30 transition-all"
              >
                <option value="M">Male</option>
                <option value="F">Female</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#17231F] mb-1">
                Birth date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full h-9 rounded-md border border-[#CCD5CD] px-3 text-xs text-[#17231F] focus:outline-none focus:border-[#245B48] focus:ring-1 focus:ring-[#245B48]/30 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#17231F] mb-1">
                Hire date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={hireDate}
                onChange={(e) => handleHireDateChange(e.target.value)}
                className="w-full h-9 rounded-md border border-[#CCD5CD] px-3 text-xs text-[#17231F] focus:outline-none focus:border-[#245B48] focus:ring-1 focus:ring-[#245B48]/30 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Section: First Job Record */}
        <div className="space-y-3">
          <span className="text-xs font-semibold text-[#17231F] uppercase tracking-wider block">
            2. Initial Job Record (JOBHISTORY)
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#17231F] mb-1">
                Job position <span className="text-red-500">*</span>
              </label>
              <select
                value={jobCode}
                onChange={(e) => setJobCode(e.target.value)}
                className="w-full h-9 rounded-md border border-[#CCD5CD] px-3 text-xs text-[#17231F] bg-white focus:outline-none focus:border-[#245B48] focus:ring-1 focus:ring-[#245B48]/30 transition-all"
              >
                {jobs.map((j) => (
                  <option key={j.jobCode} value={j.jobCode}>
                    {j.jobDesc} ({j.jobCode})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#17231F] mb-1">
                Department <span className="text-red-500">*</span>
              </label>
              <select
                value={deptCode}
                onChange={(e) => setDeptCode(e.target.value)}
                className="w-full h-9 rounded-md border border-[#CCD5CD] px-3 text-xs text-[#17231F] bg-white focus:outline-none focus:border-[#245B48] focus:ring-1 focus:ring-[#245B48]/30 transition-all"
              >
                {departments.map((d) => (
                  <option key={d.deptCode} value={d.deptCode}>
                    {d.deptName} ({d.deptCode})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#17231F] mb-1">
                Effective date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={effDate}
                onChange={(e) => setEffDate(e.target.value)}
                className="w-full h-9 rounded-md border border-[#CCD5CD] px-3 text-xs text-[#17231F] focus:outline-none focus:border-[#245B48] focus:ring-1 focus:ring-[#245B48]/30 transition-all"
              />
              <p className="text-[11px] text-[#52615B] mt-0.5">
                Defaults to hire date. Cannot precede hire date.
              </p>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#17231F] mb-1">
                Salary (PHP) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                placeholder="25000.00"
                className="w-full h-9 rounded-md border border-[#CCD5CD] px-3 text-xs font-mono text-[#17231F] focus:outline-none focus:border-[#245B48] focus:ring-1 focus:ring-[#245B48]/30 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#DDE3DE]">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Add Employee'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
