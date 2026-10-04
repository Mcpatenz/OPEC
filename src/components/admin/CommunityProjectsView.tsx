import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CSRProject, ProjectStatus } from '../../types';
import { formatPHP } from '../../lib/loans/calculator';
import {
  HeartHandshake,
  Plus,
  Search,
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Receipt,
  QrCode,
  Gift,
  CheckCircle2,
  Clock,
  Sparkles,
  X,
} from 'lucide-react';

export const CommunityProjectsView: React.FC = () => {
  const {
    csrProjects,
    employees,
    addCSRProject,
    updateCSRProjectStatus,
    checkInAttendance,
    addProjectDonation,
    addProjectExpense,
  } = useApp();

  const [selectedProject, setSelectedProject] = useState<CSRProject | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'beneficiaries' | 'events' | 'donations' | 'expenses'>('overview');
  const [showAddProject, setShowAddProject] = useState(false);
  const [qrAttendeeEmpId, setQrAttendeeEmpId] = useState(employees[0]?.id || '');
  const [attendanceSuccessMsg, setAttendanceSuccessMsg] = useState('');

  // Donation form state
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [donorName, setDonorName] = useState('');
  const [donationType, setDonationType] = useState<any>('CASH');
  const [donationValue, setDonationValue] = useState<number>(5000);
  const [donationRemarks, setDonationRemarks] = useState('');

  // Expense form state
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseCat, setExpenseCat] = useState<any>('SUPPLIES');
  const [expenseAmount, setExpenseAmount] = useState<number>(2500);
  const [expensePayee, setExpensePayee] = useState('');
  const [expenseReceipt, setExpenseReceipt] = useState('');
  const [expenseDesc, setExpenseDesc] = useState('');

  // New Project Form
  const [newProject, setNewProject] = useState({
    name: '',
    category: 'EDUCATION' as CSRProject['category'],
    description: '',
    objective: '',
    location: 'Ozamiz City, Misamis Occidental',
    startDate: '2026-10-15',
    endDate: '2026-11-30',
    budget: 50000,
    spentAmount: 0,
    status: 'APPROVED' as ProjectStatus,
    projectLeader: 'Sarah Jane Alcantara',
    projectLeaderId: 'emp-0011',
    beneficiaries: [],
    events: [],
    donations: [],
    expenses: [],
  });

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.name) return;
    addCSRProject(newProject);
    setShowAddProject(false);
  };

  const handleSimulateQRScan = (eventId: string) => {
    checkInAttendance(eventId, qrAttendeeEmpId);
    const scannedEmp = employees.find(e => e.id === qrAttendeeEmpId);
    setAttendanceSuccessMsg(`Successfully verified QR Check-in for ${scannedEmp?.firstName} ${scannedEmp?.lastName}!`);
    setTimeout(() => setAttendanceSuccessMsg(''), 4000);
  };

  const handleSaveDonation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !donorName) return;

    addProjectDonation(selectedProject.id, {
      donorName,
      donationType,
      estimatedValue: donationValue,
      dateReceived: new Date().toISOString().split('T')[0],
      receivedBy: 'OPEC Community Coordinator',
      remarks: donationRemarks,
    });
    setShowDonationModal(false);
    setDonorName('');
  };

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || expenseAmount <= 0) return;

    addProjectExpense(selectedProject.id, {
      category: expenseCat,
      amount: expenseAmount,
      date: new Date().toISOString().split('T')[0],
      payee: expensePayee,
      receiptNumber: expenseReceipt || `OR-${Math.floor(10000 + Math.random() * 90000)}`,
      approvedBy: 'Elena Corazon Mendoza (Treasurer)',
      description: expenseDesc,
    });
    setShowExpenseModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900">Community & CSR Initiatives</h1>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800">
              {csrProjects.length} Active Programs
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Section 24–29: Community outreach, disaster relief, school adoptions, QR attendance, donations, and expense vouchers.
          </p>
        </div>

        <button
          onClick={() => setShowAddProject(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          New CSR Project
        </button>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {csrProjects.map(proj => {
          const budgetPercent = Math.min(100, Math.round((proj.spentAmount / proj.budget) * 100));

          return (
            <div
              key={proj.id}
              onClick={() => {
                setSelectedProject(proj);
                setActiveTab('overview');
              }}
              className="bg-white p-5 rounded-xl border border-slate-200 hover:border-amber-400 shadow-xs transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="font-mono text-[11px] font-bold text-slate-500">{proj.projectNumber}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    proj.status === 'COMPLETED'
                      ? 'bg-emerald-100 text-emerald-800'
                      : proj.status === 'ONGOING'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {proj.status.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="mt-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
                    {proj.category.replace(/_/g, ' ')}
                  </span>
                  <h3 className="font-bold text-sm text-slate-900 group-hover:text-amber-700 transition-colors mt-0.5">
                    {proj.name}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1">{proj.description}</p>
                </div>

                <div className="mt-4 flex items-center gap-2 text-xs text-slate-600">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{proj.location}</span>
                </div>

                {/* Budget usage */}
                <div className="mt-4 pt-3 border-t border-slate-100 text-xs">
                  <div className="flex justify-between font-semibold mb-1">
                    <span className="text-slate-500">Budget Spent</span>
                    <span className="font-mono text-slate-800">{formatPHP(proj.spentAmount)} / {formatPHP(proj.budget)}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full" style={{ width: `${budgetPercent}%` }} />
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Lead: <strong className="text-slate-800">{proj.projectLeader}</strong></span>
                <span className="font-semibold text-amber-700 group-hover:underline">Open Project Desk →</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Project Full Management Modal */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 space-y-6 max-h-[90vh] overflow-y-auto text-xs">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-200">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    {selectedProject.projectNumber}
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    {selectedProject.category.replace(/_/g, ' ')}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-slate-900 mt-1">{selectedProject.name}</h2>
                <p className="text-xs text-slate-500 mt-0.5">{selectedProject.location} · Lead: {selectedProject.projectLeader}</p>
              </div>
              <button onClick={() => setSelectedProject(null)} className="p-1.5 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Segmented Control Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
              {[
                { id: 'overview', label: 'Overview & Lifecycle' },
                { id: 'beneficiaries', label: `Beneficiaries (${selectedProject.beneficiaries?.length || 0})` },
                { id: 'events', label: `Events & QR Attendance (${selectedProject.events?.length || 0})` },
                { id: 'donations', label: `Donations (${selectedProject.donations?.length || 0})` },
                { id: 'expenses', label: `Expenses & Budget (${selectedProject.expenses?.length || 0})` },
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id as any)}
                  className={`px-3 py-1.5 font-bold rounded-md transition-all ${
                    activeTab === t.id
                      ? 'bg-white text-slate-950 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab 1: Overview & Lifecycle Workflow (Section 25 of specification) */}
            {activeTab === 'overview' && (
              <div className="space-y-5">
                <div>
                  <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-2">
                    Project Objective & Goals
                  </h3>
                  <p className="text-slate-700 bg-slate-50 p-3.5 rounded-lg border border-slate-200 leading-relaxed">
                    {selectedProject.objective}
                  </p>
                </div>

                {/* Workflow Status Progression */}
                <div>
                  <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-2">
                    Workflow Lifecycle Progression (Section 25)
                  </h3>
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 text-center">
                    {[
                      'DRAFT',
                      'SUBMITTED',
                      'REVIEW',
                      'APPROVED',
                      'ONGOING',
                      'COMPLETED',
                      'ACCOMPLISHMENT_REPORT',
                      'CLOSED',
                    ].map((st, i) => {
                      const isCurrent = selectedProject.status === st;
                      return (
                        <button
                          key={st}
                          type="button"
                          onClick={() => updateCSRProjectStatus(selectedProject.id, st as ProjectStatus)}
                          className={`p-2 rounded border text-[10px] font-bold transition-all ${
                            isCurrent
                              ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-xs'
                              : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <div className="font-mono text-[9px]">{i + 1}</div>
                          <div className="truncate">{st.replace(/_/g, ' ')}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Accomplishment report summary */}
                <div>
                  <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-1">
                    Accomplishment Report Summary
                  </h3>
                  <p className="text-slate-600 italic bg-amber-50/50 p-3 rounded-lg border border-amber-200">
                    {selectedProject.accomplishmentSummary || 'Activities ongoing. Full accomplishment report pending conclusion.'}
                  </p>
                </div>
              </div>
            )}

            {/* Tab 2: Beneficiaries (Section 26) */}
            {activeTab === 'beneficiaries' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                    Targeted Community Beneficiaries
                  </h3>
                </div>

                {selectedProject.beneficiaries?.length === 0 ? (
                  <p className="text-slate-400 p-6 text-center bg-slate-50 rounded-xl">No beneficiaries registered yet.</p>
                ) : (
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                    {selectedProject.beneficiaries.map(ben => (
                      <div key={ben.id} className="p-4 bg-white flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{ben.name}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                              {ben.type}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {ben.barangay}, {ben.municipality}, {ben.province} · Contact: {ben.contactPerson}
                          </p>
                          <p className="text-xs text-slate-600 mt-1">{ben.description}</p>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-slate-900 text-sm">{ben.estimatedBeneficiaries}</span>
                          <span className="block text-[10px] text-slate-400">Target Individuals</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Events & Field QR Attendance (Section 27) */}
            {activeTab === 'events' && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                    Community Events & Participant Roll
                  </h3>
                </div>

                {attendanceSuccessMsg && (
                  <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-lg flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{attendanceSuccessMsg}</span>
                  </div>
                )}

                {selectedProject.events?.length === 0 ? (
                  <p className="text-slate-400 p-6 text-center bg-slate-50 rounded-xl">No scheduled events.</p>
                ) : (
                  <div className="space-y-4">
                    {selectedProject.events.map(ev => (
                      <div key={ev.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="font-bold text-slate-900 text-sm">{ev.eventName}</span>
                            <p className="text-xs text-slate-500">{ev.location} · {ev.date}</p>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            ev.status === 'CONCLUDED' ? 'bg-slate-200 text-slate-700' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {ev.status}
                          </span>
                        </div>

                        {/* QR check-in simulator */}
                        <div className="p-3 bg-white rounded-lg border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <QrCode className="w-6 h-6 text-amber-600" />
                            <div>
                              <span className="font-bold text-slate-800 block">Volunteer Field QR Scanner</span>
                              <span className="text-[11px] text-slate-500">
                                Attendees: <strong className="text-slate-900">{ev.actualParticipants}</strong> / {ev.expectedParticipants} Target
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 w-full sm:w-auto">
                            <select
                              value={qrAttendeeEmpId}
                              onChange={e => setQrAttendeeEmpId(e.target.value)}
                              className="px-2.5 py-1.5 text-xs rounded border border-slate-300 bg-white"
                            >
                              {employees.map(e => (
                                <option key={e.id} value={e.id}>
                                  {e.firstName} {e.lastName} ({e.employeeNumber})
                                </option>
                              ))}
                            </select>
                            <button
                              onClick={() => handleSimulateQRScan(ev.id)}
                              className="px-3 py-1.5 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded shadow-xs shrink-0"
                            >
                              Scan QR
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab 4: Donations (Section 28) */}
            {activeTab === 'donations' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                    Donations & Corporate Counterparts
                  </h3>
                  <button
                    onClick={() => setShowDonationModal(true)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Record Donation
                  </button>
                </div>

                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {selectedProject.donations?.map(d => (
                    <div key={d.id} className="p-3 bg-white flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{d.donorName}</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                            {d.donationType}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{d.remarks || d.quantity || 'Voluntary outreach gift'}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-emerald-700">{formatPHP(d.estimatedValue)}</span>
                        <span className="block text-[10px] text-slate-400">{d.dateReceived}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 5: Expenses (Section 29) */}
            {activeTab === 'expenses' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                    Official Project Expenses & Receipts
                  </h3>
                  <button
                    onClick={() => setShowExpenseModal(true)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Record Expense
                  </button>
                </div>

                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {selectedProject.expenses?.map(exp => (
                    <div key={exp.id} className="p-3 bg-white flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{exp.payee}</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                            {exp.category}
                          </span>
                          <span className="font-mono text-[10px] text-slate-400">OR: {exp.receiptNumber}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{exp.description}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-slate-900">{formatPHP(exp.amount)}</span>
                        <span className="block text-[10px] text-slate-400">{exp.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-slate-200">
              <button
                onClick={() => setSelectedProject(null)}
                className="px-5 py-2 font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-lg"
              >
                Close Project
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Record Donation Modal */}
      {showDonationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <form
            onSubmit={handleSaveDonation}
            className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">Record CSR Donation</h3>
              <button type="button" onClick={() => setShowDonationModal(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Donor Name / Organization *</label>
              <input
                type="text"
                required
                value={donorName}
                onChange={e => setDonorName(e.target.value)}
                placeholder="e.g. M Lhuillier Region 10, Branch Team..."
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Donation Type</label>
                <select
                  value={donationType}
                  onChange={e => setDonationType(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                >
                  <option value="CASH">CASH</option>
                  <option value="FOOD">FOOD</option>
                  <option value="SUPPLIES">SUPPLIES</option>
                  <option value="EQUIPMENT">EQUIPMENT</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Estimated Value (PHP) *</label>
                <input
                  type="number"
                  required
                  value={donationValue}
                  onChange={e => setDonationValue(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono font-bold"
                />
              </div>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Remarks / Items Description</label>
              <input
                type="text"
                value={donationRemarks}
                onChange={e => setDonationRemarks(e.target.value)}
                placeholder="e.g. 50 packs assorted relief goods..."
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDonationModal(false)}
                className="px-4 py-2 font-semibold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg shadow-sm"
              >
                Save Donation Record
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Record Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <form
            onSubmit={handleSaveExpense}
            className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">Record Project Expense</h3>
              <button type="button" onClick={() => setShowExpenseModal(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Expense Category</label>
                <select
                  value={expenseCat}
                  onChange={e => setExpenseCat(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                >
                  <option value="FOOD">FOOD</option>
                  <option value="TRANSPORTATION">TRANSPORTATION</option>
                  <option value="SUPPLIES">SUPPLIES</option>
                  <option value="EQUIPMENT">EQUIPMENT</option>
                  <option value="VENUE">VENUE</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Amount (PHP) *</label>
                <input
                  type="number"
                  required
                  value={expenseAmount}
                  onChange={e => setExpenseAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono font-bold"
                />
              </div>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Payee / Merchant *</label>
              <input
                type="text"
                required
                value={expensePayee}
                onChange={e => setExpensePayee(e.target.value)}
                placeholder="Store or supplier name..."
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Official Receipt No.</label>
              <input
                type="text"
                value={expenseReceipt}
                onChange={e => setExpenseReceipt(e.target.value)}
                placeholder="OR-99120..."
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Description</label>
              <input
                type="text"
                value={expenseDesc}
                onChange={e => setExpenseDesc(e.target.value)}
                placeholder="Specific items procured..."
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowExpenseModal(false)}
                className="px-4 py-2 font-semibold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg shadow-sm"
              >
                Post Expense
              </button>
            </div>
          </form>
        </div>
      )}

      {/* New Project Modal */}
      {showAddProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <form
            onSubmit={handleCreateProject}
            className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto text-xs"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">Create CSR Community Project</h3>
              <button type="button" onClick={() => setShowAddProject(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Project Title *</label>
              <input
                type="text"
                required
                value={newProject.name}
                onChange={e => setNewProject({ ...newProject, name: e.target.value })}
                placeholder="e.g. Tree Planting & Mangrove Conservation..."
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Category</label>
                <select
                  value={newProject.category}
                  onChange={e => setNewProject({ ...newProject, category: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                >
                  <option value="EDUCATION">EDUCATION</option>
                  <option value="CALAMITY_RELIEF">CALAMITY_RELIEF</option>
                  <option value="HEALTH_NUTRITION">HEALTH_NUTRITION</option>
                  <option value="LIVELIHOOD">LIVELIHOOD</option>
                  <option value="ENVIRONMENT_TREE_PLANTING">ENVIRONMENT_TREE_PLANTING</option>
                  <option value="COMMUNITY_DEVELOPMENT">COMMUNITY_DEVELOPMENT</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Budget Allocation (PHP) *</label>
                <input
                  type="number"
                  required
                  value={newProject.budget}
                  onChange={e => setNewProject({ ...newProject, budget: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Objective</label>
              <textarea
                rows={2}
                value={newProject.objective}
                onChange={e => setNewProject({ ...newProject, objective: e.target.value })}
                placeholder="Measurable objectives and target outcomes..."
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Project Leader</label>
              <input
                type="text"
                value={newProject.projectLeader}
                onChange={e => setNewProject({ ...newProject, projectLeader: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowAddProject(false)}
                className="px-4 py-2 font-semibold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg shadow-sm"
              >
                Save CSR Project
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
