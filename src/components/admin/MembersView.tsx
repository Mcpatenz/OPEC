import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Employee, EmploymentStatus } from '../../types';
import { calculateYearsOfService } from '../../lib/loans/eligibility';
import { formatPHP } from '../../lib/loans/calculator';
import { getEmployeeCoMakerCount } from '../../lib/loans/comakerLimit';
import { PhotoUploadCameraModal } from '../common/PhotoUploadCameraModal';
import {
  Users,
  Search,
  Plus,
  Building,
  Calendar,
  Lock,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  AlertTriangle,
  X,
  Camera,
  Upload,
  Shield,
  CreditCard,
  UserCheck,
  AlertCircle,
  MapPin,
  Mail,
  Phone,
  Coins,
} from 'lucide-react';
import { evaluateEmployeeCbu } from '../../lib/cbu/cbuCalculator';

const AREA_OPTIONS = ['Area A', 'Area B', 'Area C', 'Area D', 'Area E'];

export const MembersView: React.FC = () => {
  const {
    employees,
    branches,
    activeLoans,
    applications,
    addEmployee,
    updateEmployee,
    deleteEmployee,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [areaFilter, setAreaFilter] = useState<string>('all');
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);

  // Modals
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null);
  const [showPhotoModal, setShowPhotoModal] = useState<boolean>(false);
  const [photoTarget, setPhotoTarget] = useState<'add' | 'edit'>('add');

  // Form State for Add Employee
  const [addForm, setAddForm] = useState({
    employeeNumber: `ML-00${employees.length + 1}`,
    firstName: '',
    middleName: '',
    lastName: '',
    address: 'Ozamiz City, Misamis Occidental',
    gender: 'Male',
    employmentStatus: 'PERMANENT' as EmploymentStatus,
    birthDate: '1995-01-01',
    contactNumber: '+63 9',
    email: '',
    regionNumber: '20', // disabled
    regionName: 'ZASURMIS', // disabled
    areaName: 'Area A', // [from A-E]
    username: '',
    password: 'Password123!',
    avatarUrl: '',
    position: 'Branch Associate',
    dateHired: new Date().toISOString().split('T')[0],
    monthlySalary: 22000,
  });

  // Form State for Edit Employee
  const [editForm, setEditForm] = useState<any>(null);

  // Filtered employees
  const filteredEmployees = employees.filter(emp => {
    const fullName = `${emp.firstName} ${emp.middleName || ''} ${emp.lastName}`.toLowerCase();
    const searchMatch =
      fullName.includes(searchTerm.toLowerCase()) ||
      emp.employeeNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.username || '').toLowerCase().includes(searchTerm.toLowerCase());

    const statusMatch = statusFilter === 'all' || emp.employmentStatus === statusFilter;
    const empArea = emp.areaName || 'Area A';
    const areaMatch = areaFilter === 'all' || empArea === areaFilter;

    return searchMatch && statusMatch && areaMatch;
  });

  // Handle Add Submit
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.firstName.trim() || !addForm.lastName.trim()) {
      alert('First name and last name are required.');
      return;
    }

    addEmployee({
      employeeNumber: addForm.employeeNumber.trim(),
      firstName: addForm.firstName.trim(),
      middleName: addForm.middleName.trim(),
      lastName: addForm.lastName.trim(),
      address: addForm.address.trim(),
      gender: addForm.gender,
      employmentStatus: addForm.employmentStatus,
      birthDate: addForm.birthDate,
      contactNumber: addForm.contactNumber.trim(),
      email: addForm.email.trim() || `${addForm.firstName.toLowerCase()}.${addForm.lastName.toLowerCase()}@opec.aurumgems.org`,
      regionId: 'reg-20',
      regionNumber: '20',
      regionName: 'ZASURMIS',
      areaId: `area-${addForm.areaName.slice(-1).toLowerCase()}`,
      areaName: addForm.areaName,
      branchId: branches[0]?.id || 'br-ozamiz-1',
      username: addForm.username.trim() || `${addForm.firstName.toLowerCase()}.${addForm.lastName.toLowerCase()}`,
      password: addForm.password,
      avatarUrl: addForm.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      position: addForm.position,
      dateHired: addForm.dateHired,
      opecMembership: true,
      opecPosition: 'Member',
      monthlySalary: Number(addForm.monthlySalary) || 20000,
    });

    setShowAddModal(false);
    // Reset form
    setAddForm({
      employeeNumber: `ML-00${employees.length + 2}`,
      firstName: '',
      middleName: '',
      lastName: '',
      address: 'Ozamiz City, Misamis Occidental',
      gender: 'Male',
      employmentStatus: 'PERMANENT',
      birthDate: '1995-01-01',
      contactNumber: '+63 9',
      email: '',
      regionNumber: '20',
      regionName: 'ZASURMIS',
      areaName: 'Area A',
      username: '',
      password: 'Password123!',
      avatarUrl: '',
      position: 'Branch Associate',
      dateHired: new Date().toISOString().split('T')[0],
      monthlySalary: 22000,
    });
  };

  // Open Edit Modal
  const handleOpenEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    setEditForm({
      ...emp,
      regionNumber: '20',
      regionName: 'ZASURMIS',
      areaName: emp.areaName || 'Area A',
      gender: emp.gender || 'Male',
      username: emp.username || `${emp.firstName.toLowerCase()}.${emp.lastName.toLowerCase()}`,
      password: emp.password || 'Password123!',
      middleName: emp.middleName || '',
    });
  };

  // Handle Edit Submit
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm || !editingEmployee) return;

    updateEmployee({
      ...editingEmployee,
      ...editForm,
      regionNumber: '20',
      regionName: 'ZASURMIS',
      areaId: `area-${editForm.areaName.slice(-1).toLowerCase()}`,
    });

    if (viewingEmployee?.id === editingEmployee.id) {
      setViewingEmployee({
        ...viewingEmployee,
        ...editForm,
      });
    }

    setEditingEmployee(null);
    setEditForm(null);
  };

  // Handle Confirm Delete
  const handleConfirmDelete = () => {
    if (!deletingEmployee) return;
    deleteEmployee(deletingEmployee.id);
    if (viewingEmployee?.id === deletingEmployee.id) {
      setViewingEmployee(null);
    }
    setDeletingEmployee(null);
  };

  // Handle Photo Save from Modal
  const handlePhotoSave = (photoUrl: string) => {
    if (photoTarget === 'add') {
      setAddForm(prev => ({ ...prev, avatarUrl: photoUrl }));
    } else if (photoTarget === 'edit' && editForm) {
      setEditForm((prev: any) => ({ ...prev, avatarUrl: photoUrl }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900">Employee Management & Directory</h1>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
              {employees.length} Enrolled Employees
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
              Region 20: ZASURMIS (Areas A–E)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Admin console: Add, update, delete employees with photo upload or live camera capture, automatic co-maker limit validation, and area assignment.
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
            placeholder="Search by name, employee ID, position, or username..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500 bg-white"
          />
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-700 font-medium"
        >
          <option value="all">All Employment Statuses</option>
          <option value="PERMANENT">PERMANENT</option>
          <option value="PROBATIONARY">PROBATIONARY</option>
          <option value="RESIGNED">RESIGNED</option>
          <option value="INACTIVE">INACTIVE</option>
        </select>

        {/* Area Filter [A-E] */}
        <select
          value={areaFilter}
          onChange={e => setAreaFilter(e.target.value)}
          className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-700 font-medium"
        >
          <option value="all">All Areas (A–E)</option>
          {AREA_OPTIONS.map(area => (
            <option key={area} value={area}>
              {area}
            </option>
          ))}
        </select>
      </div>

      {/* Employees Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEmployees.map(emp => {
          const service = calculateYearsOfService(emp.dateHired);
          const coMakerInfo = getEmployeeCoMakerCount(emp.id, applications, activeLoans);
          const areaDisplay = emp.areaName || 'Area A';

          return (
            <div
              key={emp.id}
              className="bg-white p-5 rounded-xl border border-slate-200 hover:border-amber-400 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Top card info */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="relative w-12 h-12 rounded-full overflow-hidden bg-slate-100 border-2 border-amber-400/80 shrink-0">
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
                      <div className="flex items-center gap-1.5 text-xs font-mono font-medium text-slate-400">
                        <span>{emp.employeeNumber}</span>
                        <span>·</span>
                        <span className="text-slate-600 font-sans font-semibold">{areaDisplay}</span>
                      </div>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      emp.employmentStatus === 'PERMANENT'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {emp.employmentStatus}
                  </span>
                </div>

                {/* Details list */}
                <div className="mt-4 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Region / Area:</span>
                    <span className="font-semibold text-slate-800">
                      Region 20 ({emp.regionName || 'ZASURMIS'}) · {areaDisplay}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Gender / Birthdate:</span>
                    <span className="font-medium text-slate-700">
                      {emp.gender || 'Not specified'} · {emp.birthDate || '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Position:</span>
                    <span className="font-semibold text-slate-800 text-right truncate max-w-[170px]">
                      {emp.position}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Username:</span>
                    <span className="font-mono text-slate-700">{emp.username || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600 pt-1 border-t border-slate-100">
                    <span>Tenure / Service:</span>
                    <span className="font-bold text-emerald-700">{service.formatted}</span>
                  </div>
                </div>

                {/* Co-maker commitment status */}
                <div className="mt-3 p-2 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-[11px]">
                  <span className="text-slate-600 font-medium">Co-Maker Commitments:</span>
                  {coMakerInfo.isLimitReached ? (
                    <span className="font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      5/5 Limit Reached
                    </span>
                  ) : (
                    <span className="font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      {coMakerInfo.count}/5 Active Loans
                    </span>
                  )}
                </div>

                {/* CBU & Retainers Fee summary pill */}
                {(() => {
                  const cardCbu = evaluateEmployeeCbu(emp);
                  return (
                    <div className="mt-2 p-2 bg-amber-50/60 rounded-lg border border-amber-200/80 flex items-center justify-between text-[11px]">
                      <span className="text-amber-900 font-semibold flex items-center gap-1">
                        <Coins className="w-3 h-3 text-amber-600" />
                        CBU Balance:
                      </span>
                      <div className="text-right">
                        <span className="font-bold font-mono text-amber-800">{formatPHP(cardCbu.totalCbu)}</span>
                        <span className="text-[10px] text-rose-600 block">(10% Retainer: {formatPHP(cardCbu.retainersFee)})</span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Action buttons */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setViewingEmployee(emp)}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <Eye className="w-3.5 h-3.5 text-slate-500" />
                  View
                </button>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(emp)}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-50 rounded-lg transition-colors"
                    title="Update Employee Records"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-amber-600" />
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeletingEmployee(emp)}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Delete Employee Record"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <form
            onSubmit={handleAddSubmit}
            className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto text-xs"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  HR Admin System
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">Add New Employee</h3>
                <p className="text-xs text-slate-500">Region 20: ZASURMIS · Areas A through E</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Photo / Camera Section */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full overflow-hidden bg-slate-200 border-2 border-amber-500 shrink-0">
                  {addForm.avatarUrl ? (
                    <img src={addForm.avatarUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-slate-500">
                      ID
                    </div>
                  )}
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Employee Photo / ID Badge</span>
                  <span className="text-[11px] text-slate-500">
                    {addForm.avatarUrl ? 'Photo captured & attached' : 'No photo uploaded yet'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setPhotoTarget('add');
                  setShowPhotoModal(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-lg shadow-2xs transition-all"
              >
                <Camera className="w-3.5 h-3.5 text-amber-600" />
                Upload Photo or Use Camera
              </button>
            </div>

            {/* Row 1: Employee ID, Position, Status */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Employee ID *</label>
                <input
                  type="text"
                  required
                  value={addForm.employeeNumber}
                  onChange={e => setAddForm({ ...addForm, employeeNumber: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  placeholder="e.g. ML-0020"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Position *</label>
                <input
                  type="text"
                  required
                  value={addForm.position}
                  onChange={e => setAddForm({ ...addForm, position: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  placeholder="e.g. Branch Associate"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Status</label>
                <select
                  value={addForm.employmentStatus}
                  onChange={e => setAddForm({ ...addForm, employmentStatus: e.target.value as EmploymentStatus })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                >
                  <option value="PERMANENT">PERMANENT</option>
                  <option value="PROBATIONARY">PROBATIONARY</option>
                  <option value="RESIGNED">RESIGNED (10% Retainer Policy)</option>
                  <option value="AWOL">AWOL (10% Retainer Policy)</option>
                  <option value="REMOVED">REMOVED FROM WORK (10% Retainer)</option>
                  <option value="RETIRED">RETIRED</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>
            </div>

            {/* Row 2: Names (First, Middle, Last) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">First Name *</label>
                <input
                  type="text"
                  required
                  value={addForm.firstName}
                  onChange={e => setAddForm({ ...addForm, firstName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Middle Name</label>
                <input
                  type="text"
                  value={addForm.middleName}
                  onChange={e => setAddForm({ ...addForm, middleName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Last Name *</label>
                <input
                  type="text"
                  required
                  value={addForm.lastName}
                  onChange={e => setAddForm({ ...addForm, lastName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Row 3: Gender, Birthdate, Contact Number */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Gender</label>
                <select
                  value={addForm.gender}
                  onChange={e => setAddForm({ ...addForm, gender: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Non-Binary">Non-Binary</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Birthdate</label>
                <input
                  type="date"
                  value={addForm.birthDate}
                  onChange={e => setAddForm({ ...addForm, birthDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Contact Number</label>
                <input
                  type="text"
                  value={addForm.contactNumber}
                  onChange={e => setAddForm({ ...addForm, contactNumber: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                  placeholder="+63 917 000 0000"
                />
              </div>
            </div>

            {/* Row 4: Address, Email Address */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Address</label>
                <input
                  type="text"
                  value={addForm.address}
                  onChange={e => setAddForm({ ...addForm, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  placeholder="Street / Barangay / Municipality / Province"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={addForm.email}
                  onChange={e => setAddForm({ ...addForm, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  placeholder="employee@opec.aurumgems.org"
                />
              </div>
            </div>

            {/* Row 5: Region #: 20 (disabled), Region Name: ZASURMIS (disabled), Area [from A-E] */}
            <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200/80 space-y-2">
              <span className="text-[11px] font-bold text-amber-900 block">
                Regional Jurisdiction & Command Area
              </span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Region #: 20 disabled */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <span>Region #:</span>
                    <span className="text-[10px] text-slate-400 font-normal">(Locked)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      disabled
                      value={addForm.regionNumber}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-slate-100 text-slate-500 font-bold font-mono cursor-not-allowed"
                    />
                    <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5" />
                  </div>
                </div>

                {/* Region Name: ZASURMIS disabled */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <span>Region Name:</span>
                    <span className="text-[10px] text-slate-400 font-normal">(Locked)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      disabled
                      value={addForm.regionName}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-slate-100 text-slate-500 font-bold cursor-not-allowed"
                    />
                    <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5" />
                  </div>
                </div>

                {/* Area [from A-E] */}
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Area [from A–E] *
                  </label>
                  <select
                    value={addForm.areaName}
                    onChange={e => setAddForm({ ...addForm, areaName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border-2 border-amber-400 bg-white font-bold text-slate-900 focus:ring-2 focus:ring-amber-500"
                  >
                    {AREA_OPTIONS.map(a => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Row 6: Username & Password */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Username *</label>
                <input
                  type="text"
                  required
                  value={addForm.username}
                  onChange={e => setAddForm({ ...addForm, username: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                  placeholder="e.g. firstname.lastname"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Password *</label>
                <input
                  type="text"
                  required
                  value={addForm.password}
                  onChange={e => setAddForm({ ...addForm, password: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
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

      {/* Edit Employee Modal */}
      {editingEmployee && editForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <form
            onSubmit={handleEditSubmit}
            className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto text-xs"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  Update Record
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  Edit Employee: {editingEmployee.firstName} {editingEmployee.lastName}
                </h3>
                <p className="text-xs text-slate-500">ID: {editingEmployee.employeeNumber}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingEmployee(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Photo / Camera Section */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full overflow-hidden bg-slate-200 border-2 border-amber-500 shrink-0">
                  {editForm.avatarUrl ? (
                    <img src={editForm.avatarUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-slate-500">
                      ID
                    </div>
                  )}
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Photo / ID Snapshot</span>
                  <span className="text-[11px] text-slate-500">
                    {editForm.avatarUrl ? 'Photo attached' : 'No photo uploaded'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setPhotoTarget('edit');
                  setShowPhotoModal(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-lg shadow-2xs transition-all"
              >
                <Camera className="w-3.5 h-3.5 text-amber-600" />
                Change Photo or Take Camera Snapshot
              </button>
            </div>

            {/* Row 1: Employee ID, Position, Status */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Employee ID *</label>
                <input
                  type="text"
                  required
                  value={editForm.employeeNumber}
                  onChange={e => setEditForm({ ...editForm, employeeNumber: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Position *</label>
                <input
                  type="text"
                  required
                  value={editForm.position}
                  onChange={e => setEditForm({ ...editForm, position: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Status</label>
                <select
                  value={editForm.employmentStatus}
                  onChange={e => setEditForm({ ...editForm, employmentStatus: e.target.value as EmploymentStatus })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                >
                  <option value="PERMANENT">PERMANENT</option>
                  <option value="PROBATIONARY">PROBATIONARY</option>
                  <option value="RESIGNED">RESIGNED (10% Retainer Policy)</option>
                  <option value="AWOL">AWOL (10% Retainer Policy)</option>
                  <option value="REMOVED">REMOVED FROM WORK (10% Retainer)</option>
                  <option value="RETIRED">RETIRED</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>
            </div>

            {/* Row 2: Names (First, Middle, Last) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">First Name *</label>
                <input
                  type="text"
                  required
                  value={editForm.firstName}
                  onChange={e => setEditForm({ ...editForm, firstName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Middle Name</label>
                <input
                  type="text"
                  value={editForm.middleName || ''}
                  onChange={e => setEditForm({ ...editForm, middleName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Last Name *</label>
                <input
                  type="text"
                  required
                  value={editForm.lastName}
                  onChange={e => setEditForm({ ...editForm, lastName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>
            </div>

            {/* Row 3: Gender, Birthdate, Contact */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Gender</label>
                <select
                  value={editForm.gender || 'Male'}
                  onChange={e => setEditForm({ ...editForm, gender: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Non-Binary">Non-Binary</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Birthdate</label>
                <input
                  type="date"
                  value={editForm.birthDate}
                  onChange={e => setEditForm({ ...editForm, birthDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Contact Number</label>
                <input
                  type="text"
                  value={editForm.contactNumber}
                  onChange={e => setEditForm({ ...editForm, contactNumber: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                />
              </div>
            </div>

            {/* Row 4: Address, Email Address */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Address</label>
                <input
                  type="text"
                  value={editForm.address}
                  onChange={e => setEditForm({ ...editForm, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>
            </div>

            {/* Row 5: Region #: 20 (disabled), Region Name: ZASURMIS (disabled), Area [from A-E] */}
            <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200/80 space-y-2">
              <span className="text-[11px] font-bold text-amber-900 block">
                Regional Jurisdiction & Command Area
              </span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <span>Region #:</span>
                    <span className="text-[10px] text-slate-400 font-normal">(Locked)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      disabled
                      value="20"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-slate-100 text-slate-500 font-bold font-mono cursor-not-allowed"
                    />
                    <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5" />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <span>Region Name:</span>
                    <span className="text-[10px] text-slate-400 font-normal">(Locked)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      disabled
                      value="ZASURMIS"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-slate-100 text-slate-500 font-bold cursor-not-allowed"
                    />
                    <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5" />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Area [from A–E] *
                  </label>
                  <select
                    value={editForm.areaName || 'Area A'}
                    onChange={e => setEditForm({ ...editForm, areaName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border-2 border-amber-400 bg-white font-bold text-slate-900"
                  >
                    {AREA_OPTIONS.map(a => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Row 6: Username & Password */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Username *</label>
                <input
                  type="text"
                  required
                  value={editForm.username || ''}
                  onChange={e => setEditForm({ ...editForm, username: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Password *</label>
                <input
                  type="text"
                  required
                  value={editForm.password || ''}
                  onChange={e => setEditForm({ ...editForm, password: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setEditingEmployee(null)}
                className="px-4 py-2 font-semibold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg shadow-sm"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Employee Record?</h3>
                <p className="text-slate-500 text-xs">Action cannot be reversed</p>
              </div>
            </div>

            <p className="text-slate-600">
              Are you sure you want to permanently delete employee record for{' '}
              <strong className="text-slate-900">
                {deletingEmployee.firstName} {deletingEmployee.lastName}
              </strong>{' '}
              ({deletingEmployee.employeeNumber}) belonging to{' '}
              <strong>{deletingEmployee.areaName || 'Area A'}</strong>?
            </p>

            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 text-[11px] space-y-1">
              <p className="font-semibold">Important Notice:</p>
              <p>
                Deleting this record will remove the employee from future loan applications and the co-maker roster.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setDeletingEmployee(null)}
                className="px-4 py-2 font-semibold text-slate-600 hover:text-slate-900 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2 font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-lg shadow-sm transition-all"
              >
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Upload / Camera Modal */}
      {showPhotoModal && (
        <PhotoUploadCameraModal
          isOpen={showPhotoModal}
          onClose={() => setShowPhotoModal(false)}
          onSave={handlePhotoSave}
          currentPhoto={photoTarget === 'add' ? addForm.avatarUrl : editForm?.avatarUrl}
          employeeName={
            photoTarget === 'add'
              ? `${addForm.firstName} ${addForm.lastName}`.trim() || 'New Employee'
              : `${editForm?.firstName} ${editForm?.lastName}`.trim() || 'Employee'
          }
        />
      )}

      {/* Employee Profile View Modal */}
      {viewingEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto text-xs">
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
                  <h2 className="text-base font-bold text-slate-900">
                    {viewingEmployee.firstName} {viewingEmployee.middleName || ''} {viewingEmployee.lastName}
                  </h2>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">{viewingEmployee.employeeNumber}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-bold text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      {viewingEmployee.employmentStatus}
                    </span>
                    <span className="font-semibold text-[10px] px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                      {viewingEmployee.areaName || 'Area A'} · Region 20 (ZASURMIS)
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(viewingEmployee)}
                  className="p-1.5 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition-colors"
                  title="Edit Record"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewingEmployee(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Comprehensive details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-900 block text-[11px] uppercase tracking-wider">
                  Personal & Contact Details
                </span>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Gender:</span>
                    <span className="font-semibold text-slate-800">{viewingEmployee.gender || 'Not specified'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Birthdate:</span>
                    <span className="font-mono text-slate-800">{viewingEmployee.birthDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Contact:</span>
                    <span className="font-mono text-slate-800">{viewingEmployee.contactNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Email:</span>
                    <span className="text-slate-800 truncate max-w-[160px]">{viewingEmployee.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Address:</span>
                    <span className="text-slate-800 truncate max-w-[160px]">{viewingEmployee.address}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-900 block text-[11px] uppercase tracking-wider">
                  Jurisdiction & Credentials
                </span>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Region #:</span>
                    <span className="font-bold text-slate-800 font-mono">20</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Region Name:</span>
                    <span className="font-bold text-slate-800">ZASURMIS</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Command Area:</span>
                    <span className="font-bold text-amber-700">{viewingEmployee.areaName || 'Area A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Username:</span>
                    <span className="font-mono text-slate-800">{viewingEmployee.username || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Service Tenure:</span>
                    <span className="font-bold text-emerald-700">
                      {calculateYearsOfService(viewingEmployee.dateHired).formatted}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Co-Maker Status Banner */}
            {(() => {
              const coMakerInfo = getEmployeeCoMakerCount(viewingEmployee.id, applications, activeLoans);
              return (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-amber-700" />
                    <div>
                      <span className="font-bold text-slate-900 block">
                        Co-Maker Loan Allocation: {coMakerInfo.count} / 5 Loans
                      </span>
                      <span className="text-[11px] text-slate-600">
                        {coMakerInfo.isLimitReached
                          ? 'Employee has reached the maximum OPEC limit of 5 co-maker commitments.'
                          : `Eligible for ${coMakerInfo.remaining} more co-maker guarantee role(s).`}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`font-bold px-2 py-1 rounded text-xs ${
                      coMakerInfo.isLimitReached ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {coMakerInfo.isLimitReached ? 'Limit Reached (Disabled)' : 'Eligible'}
                  </span>
                </div>
              );
            })()}

            {/* Capital Build-Up (CBU) & 10% Retainers Fee Equity Box */}
            {(() => {
              const empCbu = evaluateEmployeeCbu(viewingEmployee);
              return (
                <div className="p-3.5 bg-amber-50/70 rounded-xl border border-amber-200/80 space-y-2">
                  <div className="flex items-center justify-between pb-2 border-b border-amber-200/60">
                    <div className="flex items-center gap-2">
                      <Coins className="w-4 h-4 text-amber-700" />
                      <span className="font-bold text-slate-900 text-xs">
                        Capital Build-Up (CBU) & Retainers Fee Status
                      </span>
                    </div>
                    <span className="font-mono font-bold text-[11px] text-amber-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                      ₱100 / Payday · {empCbu.paydaysCount} Paydays
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[11px]">
                    <div className="p-2 bg-white rounded-lg border border-amber-100">
                      <span className="text-slate-500 block text-[10px]">Total Accumulated</span>
                      <span className="font-bold font-mono text-amber-700 text-xs">{formatPHP(empCbu.totalCbu)}</span>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-amber-100">
                      <span className="text-slate-500 block text-[10px]">10% Retainer (OPEC)</span>
                      <span className="font-bold font-mono text-rose-600 text-xs">{formatPHP(empCbu.retainersFee)}</span>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-amber-100">
                      <span className="text-slate-500 block text-[10px]">90% Net Refundable</span>
                      <span className="font-bold font-mono text-emerald-700 text-xs">{formatPHP(empCbu.netRefundableCbu)}</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-600 leading-tight">
                    {empCbu.statusPolicyNote}
                  </p>
                </div>
              );
            })()}

            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setDeletingEmployee(viewingEmployee);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-rose-600 hover:bg-rose-50 rounded-lg font-semibold"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Employee
              </button>

              <button
                type="button"
                onClick={() => setViewingEmployee(null)}
                className="px-5 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-lg"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
