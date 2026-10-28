'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { separateEmployeeAction } from '@/app/actions/employees';
import { formatDate } from '@/lib/utils';
import type { EmployeeDirectoryItem } from '@/lib/data/employees';
import { AlertTriangle, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SeparateEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: EmployeeDirectoryItem;
  latestSaleDate: string | null;
  onSuccess?: () => void;
}

export function SeparateEmployeeModal({
  isOpen,
  onClose,
  employee,
  latestSaleDate,
  onSuccess,
}: SeparateEmployeeModalProps) {
  const router = useRouter();
  const getToday = () => new Date().toISOString().slice(0, 10);

  const [sepDate, setSepDate] = useState(getToday());
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const res = await separateEmployeeAction({
        empNo: employee.empNo,
        sepDate,
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
      setErrorMsg(err?.message || 'Failed to separate employee.');
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Separate Employee"
      description="Record an official employment separation date."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="flex items-start gap-2.5 rounded-[4px] border border-red-200 bg-red-50 p-3 text-xs text-red-800">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
            <p className="leading-relaxed">{errorMsg}</p>
          </div>
        )}

        <div className="flex items-start gap-3 rounded-[4px] border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-900">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-amber-950">Important Notice</p>
            <p className="leading-relaxed">
              This marks <strong>{employee.fullName}</strong> as separated. They can no longer be assigned to new sales or receive new job records. The record is kept permanently for audit integrity and employees are never deleted.
            </p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-[#041a24] mb-1">
            Separation Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            required
            value={sepDate}
            onChange={(e) => setSepDate(e.target.value)}
            className="w-full h-9 rounded-[4px] border border-[rgba(4,26,36,0.2)] px-3 text-xs text-[#041a24] focus:outline-none focus:border-[#041a24]"
          />
          <p className="text-[11px] text-neutral-500 mt-1">
            Cannot precede hire date ({formatDate(employee.hireDate)})
            {latestSaleDate ? ` or latest sale date (${formatDate(latestSaleDate)})` : ''}. Cannot be in the future.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-[rgba(4,26,36,0.12)]">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="destructive"
            size="sm"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Separating...' : 'Confirm Separation'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
