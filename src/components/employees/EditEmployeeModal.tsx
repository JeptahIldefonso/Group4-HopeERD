'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { updateEmployeeAction } from '@/app/actions/employees';
import type { EmployeeDirectoryItem } from '@/lib/data/employees';
import { AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface EditEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: EmployeeDirectoryItem;
  onSuccess?: () => void;
}

export function EditEmployeeModal({
  isOpen,
  onClose,
  employee,
  onSuccess,
}: EditEmployeeModalProps) {
  const router = useRouter();

  const [lastName, setLastName] = useState(employee.lastName);
  const [firstName, setFirstName] = useState(employee.firstName);
  const [gender, setGender] = useState<'M' | 'F'>(
    employee.gender.toUpperCase() === 'F' ? 'F' : 'M'
  );
  const [birthDate, setBirthDate] = useState(employee.birthDate);
  const [hireDate, setHireDate] = useState(employee.hireDate);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const res = await updateEmployeeAction({
        empNo: employee.empNo,
        lastName,
        firstName,
        gender,
        birthDate,
        hireDate,
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
      setErrorMsg(err?.message || 'Failed to update employee.');
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Employee"
      description={`Update personal details for Employee #${employee.empNo}.`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="flex items-start gap-2.5 rounded-md border border-[#FDECEA] bg-[#FDECEA]/60 p-3 text-xs text-[#B42318]">
            <AlertCircle className="h-4 w-4 shrink-0 text-[#B42318] mt-0.5" />
            <p className="leading-relaxed">{errorMsg}</p>
          </div>
        )}

        <div className="space-y-3">
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
                onChange={(e) => setHireDate(e.target.value)}
                className="w-full h-9 rounded-md border border-[#CCD5CD] px-3 text-xs text-[#17231F] focus:outline-none focus:border-[#245B48] focus:ring-1 focus:ring-[#245B48]/30 transition-all"
              />
            </div>
          </div>

          <p className="text-[11px] text-[#52615B]">
            Hire date cannot be later than earliest job history record or earliest recorded sale.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#DDE3DE]">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
