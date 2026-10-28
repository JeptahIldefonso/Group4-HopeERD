'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { NewJobRecordModal } from './NewJobRecordModal';
import { EditEmployeeModal } from './EditEmployeeModal';
import { SeparateEmployeeModal } from './SeparateEmployeeModal';
import { formatPHP, formatDate } from '@/lib/utils';
import type {
  EmployeeDetailPageData,
  DepartmentItem,
  JobItem,
} from '@/lib/data/employees';
import {
  ArrowLeft,
  Plus,
  Edit2,
  UserX,
  Briefcase,
  Building2,
  Calendar,
  DollarSign,
  Clock,
  Shield,
  Info,
} from 'lucide-react';

interface EmployeeDetailViewProps {
  data: EmployeeDetailPageData;
  departments: DepartmentItem[];
  jobs: JobItem[];
}

export function EmployeeDetailView({
  data,
  departments,
  jobs,
}: EmployeeDetailViewProps) {
  const { employee, currentAssignment, history, latestSaleDate } = data;
  const isSeparated = employee.employmentStatus === 'Separated';

  // Modals state
  const [isNewJobOpen, setIsNewJobOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSeparateOpen, setIsSeparateOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* 8.1 Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[rgba(4,26,36,0.12)] pb-4">
        <div>
          <Link
            href="/employees"
            className="inline-flex items-center text-xs text-neutral-500 hover:text-[#041a24] mb-2 transition-colors font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            Employees
          </Link>

          <div className="flex items-center gap-3">
            <h1 className="font-editorial text-2xl sm:text-3xl font-normal text-[#041a24] tracking-tight">
              {employee.lastName}, {employee.firstName}
            </h1>
            <span
              className={`inline-block px-2.5 py-0.5 rounded-[2px] text-[10px] font-mono font-medium border uppercase tracking-wider ${
                isSeparated
                  ? 'bg-neutral-100 text-neutral-700 border-neutral-300'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
              }`}
            >
              {employee.employmentStatus}
            </span>
          </div>

          <p className="text-xs text-neutral-500 font-mono mt-0.5">
            Employee no. {employee.empNo}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* New Job Record button */}
          <div className="relative group">
            <Button
              variant="outline"
              size="sm"
              disabled={isSeparated}
              onClick={() => setIsNewJobOpen(true)}
              className="h-9 px-3 text-xs"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              New job record
            </Button>
            {isSeparated && (
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-neutral-900 text-white text-[11px] py-1 px-2 rounded whitespace-nowrap z-10 shadow">
                Separated employees cannot receive new job records
              </span>
            )}
          </div>

          {/* Edit Employee button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditOpen(true)}
            className="h-9 px-3 text-xs"
          >
            <Edit2 className="w-3.5 h-3.5 mr-1.5" />
            Edit employee
          </Button>

          {/* Separate Employee button */}
          <div className="relative group">
            <Button
              variant="destructive"
              size="sm"
              disabled={isSeparated}
              onClick={() => setIsSeparateOpen(true)}
              className="h-9 px-3 text-xs"
            >
              <UserX className="w-3.5 h-3.5 mr-1.5" />
              Separate employee
            </Button>
            {isSeparated && (
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-neutral-900 text-white text-[11px] py-1 px-2 rounded whitespace-nowrap z-10 shadow">
                Employee is already marked as separated
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Two Top Cards: Employee Info + Current Assignment */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 8.2 Card: Employee information (All 7 fields in exact specified order) */}
        <Card className="border border-[rgba(4,26,36,0.12)] bg-white rounded-[4px] shadow-none overflow-hidden">
          <div className="p-3.5 border-b border-[rgba(4,26,36,0.08)] bg-neutral-50/50 flex items-center justify-between">
            <span className="text-xs font-semibold text-[#041a24] tracking-tight">
              Employee information
            </span>
            <span className="text-[11px] font-mono text-neutral-400">
              EMPLOYEE Table (7 columns)
            </span>
          </div>

          <div className="p-4 space-y-3 text-xs">
            {/* 1. Employee no. */}
            <div className="flex items-center justify-between py-1.5 border-b border-[rgba(4,26,36,0.06)]">
              <span className="text-neutral-500 font-medium">Employee no.</span>
              <span className="font-mono font-semibold text-[#041a24]">
                {employee.empNo}
              </span>
            </div>

            {/* 2. Last name */}
            <div className="flex items-center justify-between py-1.5 border-b border-[rgba(4,26,36,0.06)]">
              <span className="text-neutral-500 font-medium">Last name</span>
              <span className="font-medium text-[#041a24]">{employee.lastName}</span>
            </div>

            {/* 3. First name */}
            <div className="flex items-center justify-between py-1.5 border-b border-[rgba(4,26,36,0.06)]">
              <span className="text-neutral-500 font-medium">First name</span>
              <span className="font-medium text-[#041a24]">{employee.firstName}</span>
            </div>

            {/* 4. Gender */}
            <div className="flex items-center justify-between py-1.5 border-b border-[rgba(4,26,36,0.06)]">
              <span className="text-neutral-500 font-medium">Gender</span>
              <span className="text-[#041a24]">{employee.genderDisplay}</span>
            </div>

            {/* 5. Birth date */}
            <div className="flex items-center justify-between py-1.5 border-b border-[rgba(4,26,36,0.06)]">
              <span className="text-neutral-500 font-medium">Birth date</span>
              <span className="font-mono text-[#041a24]">{formatDate(employee.birthDate)}</span>
            </div>

            {/* 6. Hire date + tenure */}
            <div className="flex items-center justify-between py-1.5 border-b border-[rgba(4,26,36,0.06)]">
              <span className="text-neutral-500 font-medium">Hire date</span>
              <div className="text-right">
                <span className="font-mono text-[#041a24]">{formatDate(employee.hireDate)}</span>
                <span className="text-[11px] text-neutral-500 ml-2">
                  ({employee.tenureText})
                </span>
              </div>
            </div>

            {/* 7. Separation date */}
            <div className="flex items-center justify-between py-1.5">
              <span className="text-neutral-500 font-medium">Separation date</span>
              <span className="font-mono text-[#041a24]">
                {employee.sepDate ? formatDate(employee.sepDate) : '—'}
              </span>
            </div>
          </div>
        </Card>

        {/* 8.3 Card: Current assignment */}
        <Card className="border border-[rgba(4,26,36,0.12)] bg-white rounded-[4px] shadow-none overflow-hidden">
          <div className="p-3.5 border-b border-[rgba(4,26,36,0.08)] bg-neutral-50/50 flex items-center justify-between">
            <span className="text-xs font-semibold text-[#041a24] tracking-tight">
              Current assignment
            </span>
            <span className="text-[11px] font-mono text-neutral-400">
              Latest Effective Appointment
            </span>
          </div>

          <div className="p-4 space-y-3 text-xs">
            {/* Job */}
            <div className="flex items-center justify-between py-1.5 border-b border-[rgba(4,26,36,0.06)]">
              <span className="text-neutral-500 font-medium">Job position</span>
              <div className="text-right">
                <span className="font-medium text-[#041a24]">{currentAssignment.jobDesc}</span>
                <span className="font-mono text-[10px] text-neutral-400 ml-1.5">
                  ({currentAssignment.jobCode})
                </span>
              </div>
            </div>

            {/* Department */}
            <div className="flex items-center justify-between py-1.5 border-b border-[rgba(4,26,36,0.06)]">
              <span className="text-neutral-500 font-medium">Department</span>
              <div className="text-right">
                <span className="font-medium text-[#041a24]">{currentAssignment.deptName}</span>
                <span className="font-mono text-[10px] text-neutral-400 ml-1.5">
                  ({currentAssignment.deptCode})
                </span>
              </div>
            </div>

            {/* Salary */}
            <div className="flex items-center justify-between py-1.5 border-b border-[rgba(4,26,36,0.06)]">
              <span className="text-neutral-500 font-medium">Salary</span>
              <span className="font-mono font-semibold tabular-nums text-base text-[#041a24]">
                {currentAssignment.salary != null ? formatPHP(currentAssignment.salary) : '—'}
              </span>
            </div>

            {/* Effective date */}
            <div className="flex items-center justify-between py-1.5">
              <span className="text-neutral-500 font-medium">Effective date</span>
              <span className="font-mono text-[#041a24]">{formatDate(currentAssignment.effDate)}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* 8.4 Table: Job history */}
      <Card className="border border-[rgba(4,26,36,0.12)] bg-white rounded-[4px] shadow-none overflow-hidden">
        <div className="p-4 border-b border-[rgba(4,26,36,0.08)] bg-neutral-50/40 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[#041a24] tracking-tight">
              Job history
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Complete chronological record of appointments, departmental transfers, and salary changes (newest first).
            </p>
          </div>
          <span className="text-xs font-mono text-neutral-500">
            {history.length} {history.length === 1 ? 'record' : 'records'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50/80 border-b border-[rgba(4,26,36,0.1)] text-neutral-600 font-medium">
              <tr>
                <th className="py-2.5 px-3 w-28">Employee no.</th>
                <th className="py-2.5 px-3 w-24">Job code</th>
                <th className="py-2.5 px-3">Job description</th>
                <th className="py-2.5 px-3 w-32">Effective date</th>
                <th className="py-2.5 px-3 w-28">Department code</th>
                <th className="py-2.5 px-3">Department name</th>
                <th className="py-2.5 px-3 w-32 text-right">Salary</th>
                <th className="py-2.5 px-3 w-20 text-center">Current</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(4,26,36,0.06)]">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-neutral-500">
                    No job records found.
                  </td>
                </tr>
              ) : (
                history.map((rec, idx) => (
                  <tr
                    key={`${rec.empNo}-${rec.jobCode}-${rec.effDate}-${idx}`}
                    className={`hover:bg-neutral-50/60 transition-colors ${
                      rec.isCurrent ? 'bg-neutral-50/30' : ''
                    }`}
                  >
                    <td className="py-2.5 px-3 font-mono text-[#041a24]">
                      {rec.empNo}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-medium text-[#041a24]">
                      {rec.jobCode}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-[#041a24]">
                      {rec.jobDesc}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-neutral-600">
                      {formatDate(rec.effDate)}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[#041a24]">
                      {rec.deptCode}
                    </td>
                    <td className="py-2.5 px-3 text-neutral-800">
                      {rec.deptName}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-medium tabular-nums text-right text-[#041a24]">
                      {rec.salary != null ? formatPHP(rec.salary) : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {rec.isCurrent ? (
                        <span className="inline-block px-1.5 py-0.5 rounded-[2px] text-[10px] font-mono font-medium bg-[#041a24] text-white">
                          Current
                        </span>
                      ) : (
                        <span className="text-neutral-300 font-mono">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modals */}
      <NewJobRecordModal
        isOpen={isNewJobOpen}
        onClose={() => setIsNewJobOpen(false)}
        empNo={employee.empNo}
        currentAssignment={currentAssignment}
        latestSaleDate={latestSaleDate}
        departments={departments}
        jobs={jobs}
      />

      <EditEmployeeModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        employee={employee}
      />

      <SeparateEmployeeModal
        isOpen={isSeparateOpen}
        onClose={() => setIsSeparateOpen(false)}
        employee={employee}
        latestSaleDate={latestSaleDate}
      />
    </div>
  );
}
