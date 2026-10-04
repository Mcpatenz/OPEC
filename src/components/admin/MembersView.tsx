import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Employee, EmploymentStatus } from '../../types';
import { calculateYearsOfService } from '../../lib/loans/eligibility';
import { formatPHP } from '../../lib/loans/calculator';
import {
  Users,
  Search,
  Filter,
  Plus,
  Building,
  UserCheck,
  Calendar,
  CreditCard,
  HeartHandshake,
  CheckCircle2,
  X,
} from 'lucide-react';

export const MembersView: React.FC = () => {
  const { employees, branches, areas, regions, activeLoans, applications, csrProjects, addEmployee } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // New Employee Form State
  const [newEmp, setNewEmp] = useState({
    employeeNumber: `ML-00${employees.length + 1}`,
    firstName: '',
    middleName: '',
    lastName: '',
    birthDate: '1995-01-01',
    dateHired: '2021-06-01',
    employmentStatus: 'PERMANENT' as EmploymentStatus,
    position: 'Branch Associate',
    email: '',
    contactNumber: '+63 9',
    address: 'Ozamiz City',
    regionId: 'reg-10',
    areaId: 'area-ozamiz',
    branchId: 'br-ozamiz-1',
    opecMembership: true,
    opecPosition: 'Member',
    monthlySalary: 22000,
  });

  const filteredEmployees = employees.filter(emp => {
    const searchMatch =
      `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employeeNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.position.toLowerCase().includes(searchTerm.toLowerCase());

    const statusMatch = statusFilter === 'all' || emp.employmentStatus === statusFilter;
    const branchMatch = selectedBranch === 'all' || emp.branchId === selectedBranch;

    return searchMatch && statusMatch && branchMatch;
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmp.firstName || !newEmp.lastName) return;

    addEmployee(newEmp);
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900">Members & Employee Directory</h1>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
              {employees.length} Enrolled Employees
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Section 7 & 8: Centralized roster with automatic Years-of-Service computation, OPEC membership, and branch assignment.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Employee
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, employee #, position..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-700 font-medium"
        >
          <option value="all">All Employment Statuses</option>
          <option value="PERMANENT">PERMANENT</option>
          <option value="PROBATIONARY">PROBATIONARY</option>
          <option value="RESIGNED">RESIGNED</option>
          <option value="RETIRED">RETIRED</option>
        </select>

        <select
          value={selectedBranch}
          onChange={e => setSelectedBranch(e.target.value)}
          className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-700 font-medium"
        >
          <option value="all">All Branches</option>
          {branches.map(b => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      {/* Employees Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEmployees.map(emp => {
          const service = calculateYearsOfService(emp.dateHired);
          const branch = branches.find(b => b.id === emp.branchId);

          return (
            <div
              key={emp.id}
              onClick={() => setViewingEmployee(emp)}
              className="bg-white p-5 rounded-xl border border-slate-200 hover:border-amber-400 shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                      {emp.avatarUrl ? (
                        <img src={emp.avatarUrl} alt={emp.firstName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-bold text-slate-600">
                          {emp.firstName.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 group-hover:text-amber-700 transition-colors">
                        {emp.firstName} {emp.middleName ? `${emp.middleName.charAt(0)}.` : ''} {emp.lastName}
                      </h3>
                      <p className="text-xs font-mono font-medium text-slate-400">{emp.employeeNumber}</p>
                    </div>
                  </div>

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    emp.employmentStatus === 'PERMANENT'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {emp.employmentStatus}
                  </span>
                </div>

                <div className="mt-4 space-y-1 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Position:</span>
                    <span className="font-semibold text-slate-800 text-right truncate max-w-[170px]">{emp.position}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Branch:</span>
                    <span className="font-medium text-slate-800">{branch?.name || 'Main Branch'}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600 pt-1 border-t border-slate-100">
                    <span>Service in Company:</span>
                    <span className="font-bold text-emerald-700">{service.formatted}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="text-amber-700 font-semibold">
                  OPEC: {emp.opecPosition || 'Member'}
                </span>
                <span className="text-slate-400 font-mono">
                  {formatPHP(emp.monthlySalary)}/mo
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Member Profile Modal (Section 8 of specification) */}
      {viewingEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-amber-500 shadow-sm shrink-0">
                  {viewingEmployee.avatarUrl ? (
                    <img src={viewingEmployee.avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-slate-200 flex items-center justify-center font-bold text-lg">
                      {viewingEmployee.firstName.charAt(0)}
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-900">
                      {viewingEmployee.firstName} {viewingEmployee.middleName || ''} {viewingEmployee.lastName}
                    </h2>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {viewingEmployee.employeeNumber}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{viewingEmployee.position}</p>
                  <p className="text-xs text-amber-700 font-semibold mt-0.5">
                    OPEC Position: {viewingEmployee.opecPosition || 'Member'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setViewingEmployee(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Employment & Service Calculation Card */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-500">Date Hired</span>
                <p className="font-semibold text-slate-800">{viewingEmployee.dateHired}</p>
              </div>
              <div>
                <span className="text-slate-500">Years of Service</span>
                <p className="font-bold text-emerald-700">
                  {calculateYearsOfService(viewingEmployee.dateHired).formatted}
                </p>
              </div>
              <div>
                <span className="text-slate-500">Employment Status</span>
                <p className="font-bold text-slate-800">{viewingEmployee.employmentStatus}</p>
              </div>
              <div>
                <span className="text-slate-500">Monthly Compensation</span>
                <p className="font-bold font-mono text-slate-800">{formatPHP(viewingEmployee.monthlySalary)}</p>
              </div>
            </div>

            {/* Branch and Contact */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                <span className="font-bold text-slate-700">Organizational Assignment</span>
                <p className="text-slate-600">Branch: {branches.find(b => b.id === viewingEmployee.branchId)?.name}</p>
                <p className="text-slate-600">Area: {areas.find(a => a.id === viewingEmployee.areaId)?.name}</p>
                <p className="text-slate-600">Region: {regions.find(r => r.id === viewingEmployee.regionId)?.name}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                <span className="font-bold text-slate-700">Contact Information</span>
                <p className="text-slate-600">Email: {viewingEmployee.email}</p>
                <p className="text-slate-600">Phone: {viewingEmployee.contactNumber}</p>
                <p className="text-slate-600">Address: {viewingEmployee.address}</p>
              </div>
            </div>

            {/* Loan Portfolio for this Employee */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                OPEC Loan Accounts & History
              </h3>
              {(() => {
                const userLoans = activeLoans.filter(l => l.employeeId === viewingEmployee.id);
                if (userLoans.length === 0) {
                  return (
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-500 text-center">
                      No active loan obligations on record. Eligible for full credit limit.
                    </div>
                  );
                }
                return (
                  <div className="space-y-2">
                    {userLoans.map(loan => (
                      <div key={loan.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-mono font-bold text-slate-800">{loan.loanNumber}</span>
                          <p className="text-[11px] text-slate-500">Maturity: {loan.maturityDate}</p>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-bold text-amber-700">{formatPHP(loan.balance)} balance</span>
                          <p className="text-[10px] text-slate-400">Total: {formatPHP(loan.totalPayable)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-200">
              <button
                onClick={() => setViewingEmployee(null)}
                className="px-5 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-lg"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <form
            onSubmit={handleAddSubmit}
            className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto text-xs"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">Add New Employee</h3>
              <button type="button" onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Employee Number *</label>
                <input
                  type="text"
                  required
                  value={newEmp.employeeNumber}
                  onChange={e => setNewEmp({ ...newEmp, employeeNumber: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-mono"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Position *</label>
                <input
                  type="text"
                  required
                  value={newEmp.position}
                  onChange={e => setNewEmp({ ...newEmp, position: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">First Name *</label>
                <input
                  type="text"
                  required
                  value={newEmp.firstName}
                  onChange={e => setNewEmp({ ...newEmp, firstName: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Middle Name</label>
                <input
                  type="text"
                  value={newEmp.middleName}
                  onChange={e => setNewEmp({ ...newEmp, middleName: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Last Name *</label>
                <input
                  type="text"
                  required
                  value={newEmp.lastName}
                  onChange={e => setNewEmp({ ...newEmp, lastName: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Date Hired *</label>
                <input
                  type="date"
                  required
                  value={newEmp.dateHired}
                  onChange={e => setNewEmp({ ...newEmp, dateHired: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Employment Status</label>
                <select
                  value={newEmp.employmentStatus}
                  onChange={e => setNewEmp({ ...newEmp, employmentStatus: e.target.value as EmploymentStatus })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                >
                  <option value="PERMANENT">PERMANENT</option>
                  <option value="PROBATIONARY">PROBATIONARY</option>
                  <option value="RESIGNED">RESIGNED</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Branch</label>
                <select
                  value={newEmp.branchId}
                  onChange={e => setNewEmp({ ...newEmp, branchId: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                >
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Monthly Salary (PHP)</label>
                <input
                  type="number"
                  value={newEmp.monthlySalary}
                  onChange={e => setNewEmp({ ...newEmp, monthlySalary: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 font-semibold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg shadow-sm"
              >
                Save Employee Record
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
