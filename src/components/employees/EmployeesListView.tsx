'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AddEmployeeModal } from './AddEmployeeModal';
import { ManageJobsDeptsModal } from './ManageJobsDeptsModal';
import { formatPHP, formatDate } from '@/lib/utils';
import type {
  EmployeeDirectoryItem,
  DepartmentStat,
  DepartmentItem,
  JobItem,
} from '@/lib/data/employees';
import {
  Search,
  Download,
  Plus,
  Settings2,
  Building2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Users,
} from 'lucide-react';

interface EmployeesListViewProps {
  initialEmployees: EmployeeDirectoryItem[];
  departments: DepartmentStat[];
  departmentLookups: DepartmentItem[];
  jobLookups: JobItem[];
  totalActiveCount: number;
}

type SortField =
  | 'empNo'
  | 'lastName'
  | 'firstName'
  | 'jobDesc'
  | 'hireDate'
  | 'employmentStatus'
  | 'salary'
  | 'deptName';

type SortDirection = 'asc' | 'desc';

export function EmployeesListView({
  initialEmployees,
  departments,
  departmentLookups,
  jobLookups,
  totalActiveCount,
}: EmployeesListViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Selected Department (URL synced)
  const initialDept = searchParams.get('dept') || 'ALL';
  const [selectedDept, setSelectedDept] = useState<string>(initialDept);

  useEffect(() => {
    const deptParam = searchParams.get('dept') || 'ALL';
    setSelectedDept(deptParam);
  }, [searchParams]);

  const handleSelectDept = (code: string) => {
    setSelectedDept(code);
    const params = new URLSearchParams(window.location.search);
    if (code === 'ALL') {
      params.delete('dept');
    } else {
      params.set('dept', code);
    }
    const newSearch = params.toString();
    router.push(newSearch ? `?${newSearch}` : '/employees');
  };

  // Filter Tabs: All, Active, Separated
  const [statusTab, setStatusTab] = useState<'ALL' | 'Active' | 'Separated'>('ALL');

  // Search
  const [searchQuery, setSearchQuery] = useState('');

  // Sorting
  const [sortField, setSortField] = useState<SortField>('empNo');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);

  // Department metadata for the right pane header
  const currentDeptMeta = useMemo(() => {
    if (selectedDept === 'ALL') {
      const allActive = initialEmployees.filter((e) => e.employmentStatus === 'Active').length;
      const allSeparated = initialEmployees.filter((e) => e.employmentStatus === 'Separated').length;
      return {
        title: 'All departments',
        code: null,
        activeCount: allActive,
        separatedCount: allSeparated,
        totalCount: initialEmployees.length,
      };
    }
    const d = departments.find((dept) => dept.deptCode === selectedDept);
    return {
      title: d?.deptName || selectedDept,
      code: selectedDept,
      activeCount: d?.activeCount || 0,
      separatedCount: d?.separatedCount || 0,
      totalCount: d?.totalCount || 0,
    };
  }, [selectedDept, departments, initialEmployees]);

  // Tab counts for the currently selected department
  const tabCounts = useMemo(() => {
    const deptEmployees =
      selectedDept === 'ALL'
        ? initialEmployees
        : initialEmployees.filter((e) => e.deptCode === selectedDept);

    return {
      all: deptEmployees.length,
      active: deptEmployees.filter((e) => e.employmentStatus === 'Active').length,
      separated: deptEmployees.filter((e) => e.employmentStatus === 'Separated').length,
    };
  }, [selectedDept, initialEmployees]);

  // Filtered and Sorted employees
  const processedEmployees = useMemo(() => {
    let result = initialEmployees;

    // 1. Department filter
    if (selectedDept !== 'ALL') {
      result = result.filter((e) => e.deptCode === selectedDept);
    }

    // 2. Status tab
    if (statusTab !== 'ALL') {
      result = result.filter((e) => e.employmentStatus === statusTab);
    }

    // 3. Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((e) => {
        return (
          e.empNo.toString().includes(q) ||
          e.lastName.toLowerCase().includes(q) ||
          e.firstName.toLowerCase().includes(q) ||
          e.jobCode.toLowerCase().includes(q) ||
          e.jobDesc.toLowerCase().includes(q) ||
          e.deptCode.toLowerCase().includes(q) ||
          e.deptName.toLowerCase().includes(q)
        );
      });
    }

    // 4. Sort
    result = [...result].sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = (bVal || '').toLowerCase();
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [initialEmployees, selectedDept, statusTab, searchQuery, sortField, sortDirection]);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedDept, statusTab, searchQuery, pageSize]);

  // Pagination calculation
  const totalItems = processedEmployees.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedEmployees = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedEmployees.slice(start, start + pageSize);
  }, [processedEmployees, currentPage, pageSize]);

  // Sorting header click
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity ml-1" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-[#17231F] ml-1" />
    ) : (
      <ArrowDown className="w-3 h-3 text-[#17231F] ml-1" />
    );
  };

  // CSV Export (Section 15)
  const handleExportCSV = () => {
    const headers = [
      'Emp No',
      'Last name',
      'First name',
      'Gender',
      'Birth date',
      'Hire date',
      'Separation date',
      'Status',
      'Job code',
      'Job description',
      'Department code',
      'Department name',
      'Salary',
    ];

    const rows = processedEmployees.map((e) => [
      e.empNo,
      `"${e.lastName.replace(/"/g, '""')}"`,
      `"${e.firstName.replace(/"/g, '""')}"`,
      e.gender,
      e.birthDate,
      e.hireDate,
      e.sepDate || '',
      e.employmentStatus,
      e.jobCode,
      `"${e.jobDesc.replace(/"/g, '""')}"`,
      e.deptCode,
      `"${e.deptName.replace(/"/g, '""')}"`,
      e.salary != null ? e.salary.toFixed(2) : '',
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const todayStr = new Date().toISOString().slice(0, 10);
    link.setAttribute('href', url);
    link.setAttribute('download', `employees-${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header (Section 7.1) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#DCE3E8] pb-4">
        <div>
          <nav className="flex items-center text-xs text-[#64748B] mb-1 font-mono uppercase tracking-[0.12em]">
            <span>HopeERD</span>
            <span className="mx-1.5">·</span>
            <span className="text-[#172B3A] font-semibold">Employees</span>
          </nav>
          <h1 className="text-2xl sm:text-[28px] font-bold text-[#172B3A] tracking-tight">
            Employees
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
            Employee records, current job assignments and departmental structure.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="h-9 px-3 text-xs"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsManageModalOpen(true)}
            className="h-9 px-3 text-xs"
          >
            <Settings2 className="w-3.5 h-3.5 mr-1.5" />
            Departments & Jobs
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            className="h-9 px-3.5 text-xs font-medium"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Add Employee
          </Button>
        </div>
      </div>

      {/* Responsive Department Select (Tablet / Mobile) */}
      <div className="lg:hidden">
        <label className="block text-xs font-semibold text-[#17231F] mb-1.5">
          Select Department
        </label>
        <select
          value={selectedDept}
          onChange={(e) => handleSelectDept(e.target.value)}
          className="w-full h-10 rounded-md border border-[#CCD5CD] bg-white px-3 text-xs text-[#17231F] font-medium focus:outline-none focus:border-[#245B48]"
        >
          <option value="ALL">All departments ({totalActiveCount} active)</option>
          {departments.map((d) => (
            <option key={d.deptCode} value={d.deptCode}>
              {d.deptName} ({d.deptCode}) — {d.activeCount} active
            </option>
          ))}
        </select>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* 2. Department Sections (Left Column, Desktop) */}
        <div className="hidden lg:block lg:col-span-1">
          <Card className="border border-[#DDE3DE] bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="p-3.5 border-b border-[#DDE3DE] bg-[#FAFBFA] flex items-center justify-between">
              <span className="text-xs font-semibold text-[#17231F] tracking-tight">
                Departments
              </span>
              <span className="text-[11px] font-mono text-[#52615B]">
                {departments.length} units
              </span>
            </div>

            <div className="p-1.5 space-y-0.5">
              {/* All departments */}
              <button
                type="button"
                onClick={() => handleSelectDept('ALL')}
                className={`w-full flex items-center justify-between py-2 px-2.5 rounded-md text-xs transition-colors text-left ${
                  selectedDept === 'ALL'
                    ? 'bg-[#EAF2ED] text-[#245B48] font-semibold border-l-2 border-[#245B48]'
                    : 'text-[#52615B] hover:text-[#17231F] hover:bg-[#F5F6F4]'
                }`}
              >
                <span className="truncate">All departments</span>
                <span className={`text-[11px] font-mono px-1.5 py-0.5 rounded ml-2 ${
                  selectedDept === 'ALL' ? 'bg-[#245B48]/10 text-[#245B48]' : 'bg-[#F0F3F0] text-[#52615B]'
                }`}>
                  {totalActiveCount}
                </span>
              </button>

              {/* Department items */}
              {departments.map((dept) => {
                const isSelected = selectedDept === dept.deptCode;
                return (
                  <button
                    key={dept.deptCode}
                    type="button"
                    onClick={() => handleSelectDept(dept.deptCode)}
                    className={`w-full flex items-center justify-between py-2 px-2.5 rounded-md text-xs transition-colors text-left ${
                      isSelected
                        ? 'bg-[#EAF2ED] text-[#245B48] font-semibold border-l-2 border-[#245B48]'
                        : 'text-[#52615B] hover:text-[#17231F] hover:bg-[#F5F6F4]'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <p className="truncate leading-tight">{dept.deptName}</p>
                      <p className="text-[10px] font-mono text-[#7A8781] mt-0.5">{dept.deptCode}</p>
                    </div>
                    <span
                      className={`text-[11px] font-mono px-1.5 py-0.5 rounded shrink-0 ${
                        isSelected
                          ? 'bg-[#245B48]/10 text-[#245B48]'
                          : dept.activeCount > 0
                          ? 'bg-[#F0F3F0] text-[#52615B]'
                          : 'bg-[#F5F6F4] text-[#A0AAA4]'
                      }`}
                    >
                      {dept.activeCount}
                    </span>
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        {/* 3. Table & Content (Right Column) */}
        <div className="lg:col-span-3 space-y-4">
          <Card className="border border-[#DDE3DE] bg-white rounded-lg shadow-sm overflow-hidden">
            {/* Selected Department Header */}
            <div className="p-4 border-b border-[#DDE3DE] bg-[#FAFBFA] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold text-[#17231F] tracking-tight">
                  {currentDeptMeta.title}
                  {currentDeptMeta.code && (
                    <span className="ml-2 font-mono text-[11px] text-[#7A8781] font-normal">
                      ({currentDeptMeta.code})
                    </span>
                  )}
                </h2>
                <p className="text-[11px] text-[#7A8781] mt-0.5">
                  {currentDeptMeta.activeCount} active, {currentDeptMeta.separatedCount} separated
                </p>
              </div>

              {/* Search Box */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#7A8781]" />
                <input
                  type="text"
                  placeholder="Search name, emp no, job..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-8 pl-8 pr-3 text-xs rounded-md border border-[#CCD5CD] bg-white text-[#17231F] placeholder:text-[#A0AAA4] focus:outline-none focus:border-[#245B48] focus:ring-1 focus:ring-[#245B48]/30 transition-all"
                />
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 px-4 pt-3 border-b border-[#DDE3DE] bg-white">
              <button
                type="button"
                onClick={() => setStatusTab('ALL')}
                className={`py-2 px-3 text-xs font-medium border-b-2 transition-colors ${
                  statusTab === 'ALL'
                    ? 'border-[#245B48] text-[#245B48] font-semibold'
                    : 'border-transparent text-[#52615B] hover:text-[#17231F]'
                }`}
              >
                All ({tabCounts.all})
              </button>
              <button
                type="button"
                onClick={() => setStatusTab('Active')}
                className={`py-2 px-3 text-xs font-medium border-b-2 transition-colors ${
                  statusTab === 'Active'
                    ? 'border-[#245B48] text-[#245B48] font-semibold'
                    : 'border-transparent text-[#52615B] hover:text-[#17231F]'
                }`}
              >
                Active ({tabCounts.active})
              </button>
              <button
                type="button"
                onClick={() => setStatusTab('Separated')}
                className={`py-2 px-3 text-xs font-medium border-b-2 transition-colors ${
                  statusTab === 'Separated'
                    ? 'border-[#245B48] text-[#245B48] font-semibold'
                    : 'border-transparent text-[#52615B] hover:text-[#17231F]'
                }`}
              >
                Separated ({tabCounts.separated})
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAFBFA] border-b border-[#DDE3DE] text-[#17231F] font-semibold">
                  <tr>
                    <th
                      onClick={() => handleSort('empNo')}
                      className="py-2.5 px-3 cursor-pointer select-none group w-20"
                    >
                      <div className="flex items-center">
                        Emp No
                        {renderSortIndicator('empNo')}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('lastName')}
                      className="py-2.5 px-3 cursor-pointer select-none group"
                    >
                      <div className="flex items-center">
                        Last name
                        {renderSortIndicator('lastName')}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('firstName')}
                      className="py-2.5 px-3 cursor-pointer select-none group"
                    >
                      <div className="flex items-center">
                        First name
                        {renderSortIndicator('firstName')}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('jobDesc')}
                      className="py-2.5 px-3 cursor-pointer select-none group"
                    >
                      <div className="flex items-center">
                        Current job
                        {renderSortIndicator('jobDesc')}
                      </div>
                    </th>
                    {selectedDept === 'ALL' && (
                      <th
                        onClick={() => handleSort('deptName')}
                        className="py-2.5 px-3 cursor-pointer select-none group"
                      >
                        <div className="flex items-center">
                          Department
                          {renderSortIndicator('deptName')}
                        </div>
                      </th>
                    )}
                    <th
                      onClick={() => handleSort('hireDate')}
                      className="py-2.5 px-3 cursor-pointer select-none group"
                    >
                      <div className="flex items-center">
                        Hire date
                        {renderSortIndicator('hireDate')}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('employmentStatus')}
                      className="py-2.5 px-3 cursor-pointer select-none group w-24 text-center"
                    >
                      <div className="flex items-center justify-center">
                        Status
                        {renderSortIndicator('employmentStatus')}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('salary')}
                      className="py-2.5 px-3 cursor-pointer select-none group text-right w-28"
                    >
                      <div className="flex items-center justify-end">
                        Salary
                        {renderSortIndicator('salary')}
                      </div>
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#E9EDEA]">
                  {paginatedEmployees.length === 0 ? (
                    <tr>
                      <td
                        colSpan={selectedDept === 'ALL' ? 8 : 7}
                        className="py-12 text-center text-[#52615B]"
                      >
                        {searchQuery.trim() ? (
                          <div className="space-y-1">
                            <p className="font-medium text-[#17231F]">No employees match your search.</p>
                            <p className="text-xs text-[#7A8781]">Try searching for a different name, job, or ID.</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <p className="font-medium text-[#17231F]">No employees in this department yet.</p>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => setIsAddModalOpen(true)}
                              className="text-xs"
                            >
                              <Plus className="w-3.5 h-3.5 mr-1" />
                              Add Employee
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ) : (
                    paginatedEmployees.map((emp) => (
                      <tr
                        key={emp.empNo}
                        onClick={() => router.push(`/employees/${emp.empNo}`)}
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            router.push(`/employees/${emp.empNo}`);
                          }
                        }}
                        className="hover:bg-[#F5F6F4] cursor-pointer transition-colors focus:bg-[#EAF2ED] focus:outline-none"
                      >
                        <td className="py-2.5 px-3 font-mono font-medium text-[#17231F]">
                          {emp.empNo}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-[#17231F]">
                          {emp.lastName}
                        </td>
                        <td className="py-2.5 px-3 text-[#17231F]">
                          {emp.firstName}
                        </td>
                        <td className="py-2.5 px-3 text-[#17231F]">
                          <div>{emp.jobDesc}</div>
                          <div className="text-[10px] font-mono text-[#7A8781]">
                            {emp.jobCode}
                          </div>
                        </td>
                        {selectedDept === 'ALL' && (
                          <td className="py-2.5 px-3 text-[#17231F]">
                            <div>{emp.deptName}</div>
                            <div className="text-[10px] font-mono text-[#7A8781]">
                              {emp.deptCode}
                            </div>
                          </td>
                        )}
                        <td className="py-2.5 px-3 text-[#52615B] font-mono text-[11px]">
                          {formatDate(emp.hireDate)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-medium border uppercase tracking-wider ${
                              emp.employmentStatus === 'Active'
                                ? 'bg-[#E8F4EC] text-[#24734D] border-[#D5DDD6]'
                                : 'bg-[#F0F3F0] text-[#52615B] border-[#DDE3DE]'
                            }`}
                          >
                            {emp.employmentStatus}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-medium tabular-nums text-[#17231F]">
                          {emp.salary != null ? formatPHP(emp.salary) : '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalItems > 0 && (
              <div className="p-2.5 border-t border-[#DDE3DE] bg-[#FAFBFA] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-[11px] text-[#52615B]">
                <div className="flex items-center gap-3">
                  <span className="text-[11px]">
                    Showing {Math.min((currentPage - 1) * pageSize + 1, totalItems)}-
                    {Math.min(currentPage * pageSize, totalItems)} of {totalItems}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-[#7A8781]">Rows per page:</span>
                    <select
                      value={pageSize}
                      onChange={(e) => setPageSize(Number(e.target.value))}
                      className="h-6 px-1.5 text-[11px] rounded border border-[#CCD5CD] bg-white text-[#17231F] focus:outline-none focus:border-[#245B48]"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 px-2 text-[10px]"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <span className="px-2 text-[11px] font-mono text-neutral-400">
                    {currentPage} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 px-2 text-[10px]"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Modals */}
      <AddEmployeeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        departments={departmentLookups}
        jobs={jobLookups}
      />

      <ManageJobsDeptsModal
        isOpen={isManageModalOpen}
        onClose={() => setIsManageModalOpen(false)}
        departments={departmentLookups}
        jobs={jobLookups}
      />
    </div>
  );
}
