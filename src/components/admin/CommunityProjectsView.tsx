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
  Edit3,
  Trash2,
  Image as ImageIcon,
  Video as VideoIcon,
  Play,
  Film,
  UploadCloud,
  ExternalLink,
  ChevronRight,
  Maximize2,
  AlertTriangle,
  Info,
} from 'lucide-react';

const SAMPLE_PHOTO_PRESETS = [
  'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80',
];

export const CommunityProjectsView: React.FC = () => {
  const {
    csrProjects,
    employees,
    addCSRProject,
    updateCSRProject,
    deleteCSRProject,
    updateCSRProjectStatus,
    checkInAttendance,
    addProjectDonation,
    addProjectExpense,
  } = useApp();

  const [selectedProject, setSelectedProject] = useState<CSRProject | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'media' | 'beneficiaries' | 'events' | 'donations' | 'expenses'>('overview');
  
  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modal controls
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingProject, setEditingProject] = useState<CSRProject | null>(null);
  const [deleteTargetProject, setDeleteTargetProject] = useState<CSRProject | null>(null);
  const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null);

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formBeneficiaries, setFormBeneficiaries] = useState('');
  const [formCategory, setFormCategory] = useState<CSRProject['category']>('EDUCATION');
  const [formDescription, setFormDescription] = useState('');
  const [formObjective, setFormObjective] = useState('');
  const [formStartDate, setFormStartDate] = useState('2026-10-15');
  const [formEndDate, setFormEndDate] = useState('2026-11-30');
  const [formBudget, setFormBudget] = useState<number>(50000);
  const [formSpent, setFormSpent] = useState<number>(0);
  const [formStatus, setFormStatus] = useState<ProjectStatus>('APPROVED');
  const [formLeader, setFormLeader] = useState('Sarah Jane Alcantara');
  const [formLeaderId, setFormLeaderId] = useState('emp-0011');
  const [formPhotos, setFormPhotos] = useState<string[]>([]);
  const [formVideos, setFormVideos] = useState<string[]>([]);
  const [formVideoLink, setFormVideoLink] = useState('');

  // Field QR check-in & messages
  const [qrAttendeeEmpId, setQrAttendeeEmpId] = useState(employees[0]?.id || '');
  const [attendanceSuccessMsg, setAttendanceSuccessMsg] = useState('');

  // Donation modal
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [donorName, setDonorName] = useState('');
  const [donationType, setDonationType] = useState<any>('CASH');
  const [donationValue, setDonationValue] = useState<number>(5000);
  const [donationRemarks, setDonationRemarks] = useState('');

  // Expense modal
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseCat, setExpenseCat] = useState<any>('SUPPLIES');
  const [expenseAmount, setExpenseAmount] = useState<number>(2500);
  const [expensePayee, setExpensePayee] = useState('');
  const [expenseReceipt, setExpenseReceipt] = useState('');
  const [expenseDesc, setExpenseDesc] = useState('');

  // Helper: Open Create Modal
  const handleOpenCreate = () => {
    setEditingProject(null);
    setFormTitle('');
    setFormAddress('Ozamiz City Central School & Brgy. Pulot Elementary School, Misamis Occidental');
    setFormBeneficiaries('350 Elementary Students & 25 Public School Teachers');
    setFormCategory('EDUCATION');
    setFormDescription('Community initiative supporting local beneficiaries with resources and cooperative volunteers.');
    setFormObjective('Equip beneficiaries with essential materials and classroom improvements.');
    setFormStartDate(new Date().toISOString().split('T')[0]);
    setFormEndDate(new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]);
    setFormBudget(50000);
    setFormSpent(0);
    setFormStatus('APPROVED');
    setFormLeader('Sarah Jane Alcantara');
    setFormLeaderId('emp-0011');
    setFormPhotos([]);
    setFormVideos([]);
    setFormVideoLink('');
    setShowFormModal(true);
  };

  // Helper: Open Edit Modal
  const handleOpenEdit = (project: CSRProject) => {
    setEditingProject(project);
    setFormTitle(project.projectTitle || project.name);
    setFormAddress(project.projectAddress || project.location);
    setFormBeneficiaries(project.projectBeneficiaries || (project.beneficiaries?.map(b => b.name).join(', ') || ''));
    setFormCategory(project.category);
    setFormDescription(project.description);
    setFormObjective(project.objective || '');
    setFormStartDate(project.startDate);
    setFormEndDate(project.endDate);
    setFormBudget(project.budget);
    setFormSpent(project.spentAmount);
    setFormStatus(project.status);
    setFormLeader(project.projectLeader);
    setFormLeaderId(project.projectLeaderId);
    setFormPhotos(project.photos || []);
    setFormVideos(project.videos || []);
    setFormVideoLink(project.videoLink || '');
    setShowFormModal(true);
  };

  // Multiple Photos Upload Handler
  const handleMultiplePhotosUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setFormPhotos(prev => [...prev, result]);
      };
      reader.readAsDataURL(file);
    });
  };

  // Remove Photo from form
  const handleRemovePhoto = (indexToRemove: number) => {
    setFormPhotos(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Add Sample Photos Preset
  const handleAddSamplePhotos = () => {
    setFormPhotos(prev => Array.from(new Set([...prev, ...SAMPLE_PHOTO_PRESETS.slice(0, 3)])));
  };

  // Video File Upload Handler
  const handleVideoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setFormVideos([result]);
    };
    reader.readAsDataURL(file);
  };

  // Save Add / Edit OPEC Activity
  const handleSubmitProjectForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formAddress.trim()) return;

    if (editingProject) {
      const updated: CSRProject = {
        ...editingProject,
        name: formTitle,
        projectTitle: formTitle,
        location: formAddress,
        projectAddress: formAddress,
        projectBeneficiaries: formBeneficiaries,
        category: formCategory,
        description: formDescription,
        objective: formObjective,
        startDate: formStartDate,
        endDate: formEndDate,
        budget: Number(formBudget),
        spentAmount: Number(formSpent),
        status: formStatus,
        projectLeader: formLeader,
        projectLeaderId: formLeaderId,
        photos: formPhotos,
        videos: formVideos,
        videoLink: formVideoLink,
      };
      updateCSRProject(updated);
      if (selectedProject?.id === updated.id) {
        setSelectedProject(updated);
      }
    } else {
      addCSRProject({
        name: formTitle,
        projectTitle: formTitle,
        location: formAddress,
        projectAddress: formAddress,
        projectBeneficiaries: formBeneficiaries,
        category: formCategory,
        description: formDescription,
        objective: formObjective,
        startDate: formStartDate,
        endDate: formEndDate,
        budget: Number(formBudget),
        spentAmount: Number(formSpent),
        status: formStatus,
        projectLeader: formLeader,
        projectLeaderId: formLeaderId,
        photos: formPhotos,
        videos: formVideos,
        videoLink: formVideoLink,
        beneficiaries: formBeneficiaries
          ? [
              {
                id: `ben-${Date.now()}`,
                name: formBeneficiaries,
                type: 'COMMUNITY',
                barangay: formAddress.split(',')[0] || 'Local Community',
                municipality: formAddress.split(',')[1] || 'Ozamiz City',
                province: 'Misamis Occidental',
                contactPerson: formLeader,
                estimatedBeneficiaries: 100,
                actualBeneficiaries: 100,
                description: formBeneficiaries,
              },
            ]
          : [],
        events: [],
        donations: [],
        expenses: [],
      });
    }

    setShowFormModal(false);
    setEditingProject(null);
  };

  // Confirm Delete
  const handleConfirmDelete = () => {
    if (deleteTargetProject) {
      deleteCSRProject(deleteTargetProject.id);
      if (selectedProject?.id === deleteTargetProject.id) {
        setSelectedProject(null);
      }
      setDeleteTargetProject(null);
    }
  };

  // Field QR Scan
  const handleSimulateQRScan = (eventId: string) => {
    checkInAttendance(eventId, qrAttendeeEmpId);
    const scannedEmp = employees.find(e => e.id === qrAttendeeEmpId);
    setAttendanceSuccessMsg(`Successfully verified QR Check-in for ${scannedEmp?.firstName} ${scannedEmp?.lastName}!`);
    setTimeout(() => setAttendanceSuccessMsg(''), 4000);
  };

  // Save Donation
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

  // Save Expense
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

  // Extract YouTube video embed URL
  const getYouTubeEmbedUrl = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? `https://www.youtube.com/embed/${match[2]}` : null;
  };

  // Filter projects
  const filteredProjects = csrProjects.filter(p => {
    const title = (p.projectTitle || p.name).toLowerCase();
    const address = (p.projectAddress || p.location).toLowerCase();
    const beneficiaries = (p.projectBeneficiaries || '').toLowerCase();
    const matchesSearch =
      searchTerm === '' ||
      title.includes(searchTerm.toLowerCase()) ||
      address.includes(searchTerm.toLowerCase()) ||
      beneficiaries.includes(searchTerm.toLowerCase());

    const matchesCategory = categoryFilter === 'ALL' || p.category === categoryFilter;
    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-2 bg-rose-500/20 text-rose-400 rounded-lg border border-rose-500/30">
              <HeartHandshake className="w-5 h-5" />
            </span>
            <span className="text-xs font-bold tracking-widest text-rose-400 uppercase">
              OPEC Community & Outreach Desk
            </span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            OPEC Activities & CSR Programs
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Manage official OPEC activities with project titles, addresses, beneficiary registries, multi-photo galleries, and outreach videos.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            Add OPEC Activity
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search OPEC activities by title, address, beneficiaries..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 font-semibold"
          >
            <option value="ALL">All Categories</option>
            <option value="EDUCATION">Education</option>
            <option value="ENVIRONMENT_TREE_PLANTING">Tree Planting & Environment</option>
            <option value="HEALTH_NUTRITION">Health & Nutrition</option>
            <option value="CALAMITY_RELIEF">Calamity Relief</option>
            <option value="LIVELIHOOD">Livelihood</option>
            <option value="COMMUNITY_DEVELOPMENT">Community Development</option>
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 font-semibold"
          >
            <option value="ALL">All Statuses</option>
            <option value="ONGOING">Ongoing</option>
            <option value="APPROVED">Approved / Scheduled</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredProjects.map(proj => {
          const budgetPercent = Math.min(100, Math.round((proj.spentAmount / (proj.budget || 1)) * 100));
          const title = proj.projectTitle || proj.name;
          const address = proj.projectAddress || proj.location;
          const beneficiaries = proj.projectBeneficiaries || (proj.beneficiaries?.map(b => b.name).join(', ') || 'Community residents');
          const photos = proj.photos || [];
          const hasVideo = !!(proj.videoLink || (proj.videos && proj.videos.length > 0));

          return (
            <div
              key={proj.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500 shadow-xs hover:shadow-lg transition-all duration-200 flex flex-col justify-between overflow-hidden group"
            >
              {/* Media Thumbnail Banner (if photos or videos exist) */}
              {photos.length > 0 ? (
                <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
                  <img
                    src={photos[0]}
                    alt={title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onClick={() => setLightboxPhoto(photos[0])}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-black/20" />
                  
                  {/* Photo Count Pill */}
                  <div className="absolute bottom-2.5 left-3 flex items-center gap-1.5 text-[11px] font-bold text-white bg-black/60 px-2 py-0.5 rounded-full backdrop-blur-xs">
                    <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                    <span>{photos.length} Photo{photos.length > 1 ? 's' : ''}</span>
                  </div>

                  {/* Video Badge */}
                  {hasVideo && (
                    <div className="absolute bottom-2.5 right-3 flex items-center gap-1 text-[11px] font-bold text-white bg-rose-600/90 px-2 py-0.5 rounded-full shadow-xs">
                      <Play className="w-3 h-3 fill-white" />
                      <span>Video Available</span>
                    </div>
                  )}

                  {/* Project Number */}
                  <span className="absolute top-2.5 left-3 font-mono text-[10px] font-bold bg-slate-900/80 text-white px-2 py-0.5 rounded border border-white/20">
                    {proj.projectNumber}
                  </span>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="font-mono text-[11px] font-bold text-slate-500">{proj.projectNumber}</span>
                  {hasVideo && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                      <Play className="w-3 h-3 fill-rose-600" />
                      Video Link
                    </span>
                  )}
                </div>
              )}

              {/* Card Body */}
              <div className="p-5 space-y-3.5 flex-1">
                {/* Category & Status */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                    {proj.category.replace(/_/g, ' ')}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      proj.status === 'COMPLETED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : proj.status === 'ONGOING'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {proj.status.replace(/_/g, ' ')}
                  </span>
                </div>

                {/* Project Title */}
                <div>
                  <h3
                    onClick={() => {
                      setSelectedProject(proj);
                      setActiveTab('overview');
                    }}
                    className="font-bold text-base text-slate-900 dark:text-white group-hover:text-amber-600 transition-colors cursor-pointer line-clamp-1"
                  >
                    {title}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                    {proj.description}
                  </p>
                </div>

                {/* Project Address */}
                <div className="flex items-start gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                  <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                  <span className="font-medium line-clamp-1">{address}</span>
                </div>

                {/* Project Beneficiaries */}
                <div className="flex items-start gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                  <Users className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                  <span className="line-clamp-1">
                    Beneficiaries: <strong className="text-slate-800 dark:text-slate-200">{beneficiaries}</strong>
                  </span>
                </div>

                {/* Budget Progress Bar */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <div className="flex justify-between font-semibold mb-1 text-[11px]">
                    <span className="text-slate-500">Budget Spent</span>
                    <span className="font-mono text-slate-800 dark:text-slate-200">
                      {formatPHP(proj.spentAmount)} / {formatPHP(proj.budget)}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full" style={{ width: `${budgetPercent}%` }} />
                  </div>
                </div>
              </div>

              {/* Card Footer: Quick Actions */}
              <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-850/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <button
                  onClick={() => {
                    setSelectedProject(proj);
                    setActiveTab('overview');
                  }}
                  className="font-bold text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  Open Desk →
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      handleOpenEdit(proj);
                    }}
                    className="p-1.5 rounded-lg text-blue-700 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800 transition-all cursor-pointer"
                    title="Update Activity"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={e => {
                      e.stopPropagation();
                      setDeleteTargetProject(proj);
                    }}
                    className="p-1.5 rounded-lg text-red-700 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-400 border border-red-200 dark:border-red-800 transition-all cursor-pointer"
                    title="Delete Activity"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* DETAILED PROJECT MANAGEMENT MODAL */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6 max-h-[90vh] overflow-y-auto text-xs">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    {selectedProject.projectNumber}
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {selectedProject.category.replace(/_/g, ' ')}
                  </span>
                  <span className="text-xs font-bold text-emerald-700">{selectedProject.status}</span>
                </div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white pt-1">
                  {selectedProject.projectTitle || selectedProject.name}
                </h2>
                <div className="flex flex-wrap items-center gap-3 text-slate-500 pt-0.5">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-rose-500" />
                    {selectedProject.projectAddress || selectedProject.location}
                  </span>
                  <span>·</span>
                  <span>Lead: <strong className="text-slate-700 dark:text-slate-300">{selectedProject.projectLeader}</strong></span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenEdit(selectedProject)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-blue-50 text-blue-700 rounded-lg border border-blue-200 hover:bg-blue-100"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit Activity
                </button>
                <button
                  onClick={() => setDeleteTargetProject(selectedProject)}
                  className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200"
                  title="Delete Activity"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setSelectedProject(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Segmented Control Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg overflow-x-auto">
              {[
                { id: 'overview', label: 'Overview & Summary' },
                { id: 'media', label: `Photos & Video (${(selectedProject.photos?.length || 0) + (selectedProject.videoLink || (selectedProject.videos?.length || 0) ? 1 : 0)})` },
                { id: 'beneficiaries', label: `Beneficiaries (${selectedProject.beneficiaries?.length || 1})` },
                { id: 'events', label: `Events & QR Attendance (${selectedProject.events?.length || 0})` },
                { id: 'donations', label: `Donations (${selectedProject.donations?.length || 0})` },
                { id: 'expenses', label: `Expenses & Receipts (${selectedProject.expenses?.length || 0})` },
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id as any)}
                  className={`px-3 py-1.5 font-bold rounded-md transition-all whitespace-nowrap ${
                    activeTab === t.id
                      ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* TAB 1: OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="space-y-5">
                {/* Highlight Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider block flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-rose-500" />
                      Project Address
                    </span>
                    <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                      {selectedProject.projectAddress || selectedProject.location}
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider block flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-blue-500" />
                      Project Beneficiaries
                    </span>
                    <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                      {selectedProject.projectBeneficiaries || (selectedProject.beneficiaries?.map(b => b.name).join(', ') || 'Underprivileged sector members')}
                    </p>
                  </div>
                </div>

                {/* Description & Objective */}
                <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                  <h3 className="font-bold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider">
                    Project Narrative & Objectives
                  </h3>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                    {selectedProject.description}
                  </p>
                  {selectedProject.objective && (
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-900 dark:text-amber-300">
                      <strong>Specific Target Outcome:</strong> {selectedProject.objective}
                    </div>
                  )}
                </div>

                {/* Financial Summary */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                    <span className="text-[10px] text-slate-500 block">Total Budget</span>
                    <span className="text-base font-mono font-bold text-slate-900 dark:text-white">
                      {formatPHP(selectedProject.budget)}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                    <span className="text-[10px] text-slate-500 block">Total Spent</span>
                    <span className="text-base font-mono font-bold text-amber-700">
                      {formatPHP(selectedProject.spentAmount)}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                    <span className="text-[10px] text-slate-500 block">Remaining</span>
                    <span className="text-base font-mono font-bold text-emerald-700">
                      {formatPHP(Math.max(0, selectedProject.budget - selectedProject.spentAmount))}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                    <span className="text-[10px] text-slate-500 block">Timeline</span>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {selectedProject.startDate} to {selectedProject.endDate}
                    </span>
                  </div>
                </div>

                {/* Status Updater */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    Update Activity Lifecycle Stage:
                  </span>
                  <div className="flex items-center gap-2">
                    {['APPROVED', 'ONGOING', 'COMPLETED', 'CANCELLED'].map(st => (
                      <button
                        key={st}
                        onClick={() => updateCSRProjectStatus(selectedProject.id, st as ProjectStatus)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                          selectedProject.status === st
                            ? 'bg-amber-500 text-slate-950 border-amber-600'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: MEDIA (PHOTOS & VIDEOS) */}
            {activeTab === 'media' && (
              <div className="space-y-6">
                {/* Photo Gallery Section */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-amber-600" />
                      <h3 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
                        Project Photo Documentation ({selectedProject.photos?.length || 0})
                      </h3>
                    </div>
                    <button
                      onClick={() => handleOpenEdit(selectedProject)}
                      className="text-xs text-amber-700 font-bold hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add More Photos
                    </button>
                  </div>

                  {(!selectedProject.photos || selectedProject.photos.length === 0) ? (
                    <div className="p-8 text-center bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                      <ImageIcon className="w-10 h-10 text-slate-300 mx-auto" />
                      <p className="text-slate-500 font-medium">No photos uploaded for this OPEC activity yet.</p>
                      <button
                        onClick={() => handleOpenEdit(selectedProject)}
                        className="px-4 py-2 bg-amber-500 text-slate-950 font-bold text-xs rounded-lg"
                      >
                        Upload Photos Now
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {selectedProject.photos.map((photoUrl, idx) => (
                        <div
                          key={idx}
                          onClick={() => setLightboxPhoto(photoUrl)}
                          className="relative h-44 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 group cursor-pointer"
                        >
                          <img
                            src={photoUrl}
                            alt={`Documentation ${idx + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold gap-1 text-xs">
                            <Maximize2 className="w-4 h-4" />
                            View Full Photo
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Video Documentation Section */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Film className="w-4 h-4 text-rose-600" />
                      <h3 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
                        Outreach Video Documentation
                      </h3>
                    </div>
                  </div>

                  {/* Render YouTube or Uploaded Video */}
                  {selectedProject.videoLink ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200">
                        <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-md">
                          Video URL: {selectedProject.videoLink}
                        </span>
                        <a
                          href={selectedProject.videoLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-blue-600 font-bold text-xs hover:underline shrink-0"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Open Link
                        </a>
                      </div>

                      {getYouTubeEmbedUrl(selectedProject.videoLink) ? (
                        <div className="relative pt-[56.25%] rounded-xl overflow-hidden shadow-lg border border-slate-200 bg-black">
                          <iframe
                            src={getYouTubeEmbedUrl(selectedProject.videoLink)!}
                            title="OPEC Activity Video Player"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="absolute inset-0 w-full h-full"
                          />
                        </div>
                      ) : (
                        <div className="p-6 bg-slate-900 text-white rounded-xl text-center space-y-2">
                          <VideoIcon className="w-8 h-8 text-amber-400 mx-auto" />
                          <p className="font-bold">External Outreach Video</p>
                          <a
                            href={selectedProject.videoLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 text-slate-950 font-bold rounded-lg text-xs"
                          >
                            Watch Video in New Window
                          </a>
                        </div>
                      )}
                    </div>
                  ) : selectedProject.videos && selectedProject.videos.length > 0 ? (
                    <div className="rounded-xl overflow-hidden bg-black shadow-lg">
                      <video
                        controls
                        src={selectedProject.videos[0]}
                        className="w-full max-h-96 mx-auto"
                      >
                        Your browser does not support HTML5 video tag.
                      </video>
                    </div>
                  ) : (
                    <div className="p-6 text-center bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                      <VideoIcon className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
                      <p className="text-slate-500">No video uploaded or linked yet.</p>
                      <button
                        onClick={() => handleOpenEdit(selectedProject)}
                        className="mt-2 px-3 py-1.5 bg-slate-900 text-white font-bold rounded-lg text-xs"
                      >
                        Add Video Link
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: BENEFICIARIES */}
            {activeTab === 'beneficiaries' && (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-800 space-y-1">
                  <span className="font-bold text-blue-900 dark:text-blue-300 block text-xs">
                    Primary Beneficiaries Summary:
                  </span>
                  <p className="text-blue-800 dark:text-blue-200 font-medium leading-relaxed">
                    {selectedProject.projectBeneficiaries || '450 Elementary Students & Community Families'}
                  </p>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  {(selectedProject.beneficiaries || []).map(b => (
                    <div key={b.id} className="p-4 bg-white dark:bg-slate-900 flex items-start justify-between">
                      <div className="space-y-1">
                        <span className="font-bold text-slate-900 dark:text-white text-sm">{b.name}</span>
                        <p className="text-slate-500 text-xs">
                          {b.barangay}, {b.municipality}, {b.province} · Contact: <strong>{b.contactPerson}</strong>
                        </p>
                        <p className="text-slate-600 dark:text-slate-400 text-xs">{b.description}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[10px] text-slate-400 block">Headcount</span>
                        <span className="text-sm font-bold text-slate-900 dark:text-white">{b.actualBeneficiaries || b.estimatedBeneficiaries} Pax</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 4: EVENTS & QR ATTENDANCE */}
            {activeTab === 'events' && (
              <div className="space-y-4">
                {attendanceSuccessMsg && (
                  <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-lg flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{attendanceSuccessMsg}</span>
                  </div>
                )}

                {(!selectedProject.events || selectedProject.events.length === 0) ? (
                  <p className="text-slate-400 p-6 text-center bg-slate-50 rounded-xl">No scheduled community events.</p>
                ) : (
                  <div className="space-y-4">
                    {selectedProject.events.map(ev => (
                      <div key={ev.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 dark:bg-slate-800/40 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white text-sm">{ev.eventName}</span>
                            <p className="text-xs text-slate-500">{ev.location} · {ev.date}</p>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            ev.status === 'CONCLUDED' ? 'bg-slate-200 text-slate-700' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {ev.status}
                          </span>
                        </div>

                        {/* QR check-in simulator */}
                        <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <QrCode className="w-6 h-6 text-amber-600" />
                            <div>
                              <span className="font-bold text-slate-800 dark:text-slate-200 block">Volunteer Field QR Scanner</span>
                              <span className="text-[11px] text-slate-500">
                                Attendees: <strong className="text-slate-900 dark:text-white">{ev.actualParticipants}</strong> / {ev.expectedParticipants} Target
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 w-full sm:w-auto">
                            <select
                              value={qrAttendeeEmpId}
                              onChange={e => setQrAttendeeEmpId(e.target.value)}
                              className="px-2.5 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                            >
                              {employees.map(e => (
                                <option key={e.id} value={e.id}>
                                  {e.firstName} {e.lastName} ({e.employeeNumber})
                                </option>
                              ))}
                            </select>
                            <button
                              onClick={() => handleSimulateQRScan(ev.id)}
                              className="px-3 py-1.5 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded shadow-xs shrink-0 cursor-pointer"
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

            {/* TAB 5: DONATIONS */}
            {activeTab === 'donations' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider">
                    Donations & Counterpart Funds
                  </h3>
                  <button
                    onClick={() => setShowDonationModal(true)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-amber-500 text-slate-950 rounded-lg shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Record Donation
                  </button>
                </div>

                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {(selectedProject.donations || []).map(d => (
                    <div key={d.id} className="p-3 bg-white dark:bg-slate-900 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white">{d.donorName}</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                            {d.donationType}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{d.remarks || 'General Donation'} · Received {d.dateReceived}</p>
                      </div>
                      <span className="font-mono font-bold text-emerald-700">
                        {formatPHP(d.estimatedValue)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 6: EXPENSES */}
            {activeTab === 'expenses' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider">
                    Expenses & Official Receipts
                  </h3>
                  <button
                    onClick={() => setShowExpenseModal(true)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-amber-500 text-slate-950 rounded-lg shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Record Expense
                  </button>
                </div>

                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {(selectedProject.expenses || []).map(exp => (
                    <div key={exp.id} className="p-3 bg-white dark:bg-slate-900 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white">{exp.payee}</span>
                          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600">
                            {exp.receiptNumber}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{exp.description} · {exp.date}</p>
                      </div>
                      <span className="font-mono font-bold text-red-600">
                        {formatPHP(exp.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ADD / EDIT OPEC ACTIVITY MODAL */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <form
            onSubmit={handleSubmitProjectForm}
            className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto text-xs"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-amber-500/20 text-amber-600 rounded-lg">
                  <HeartHandshake className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {editingProject ? 'Update OPEC Activity' : 'Add New OPEC Activity'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Specify project title, address, beneficiaries, and upload outreach media.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowFormModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 1. Project Title */}
            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                Project Title *
              </label>
              <input
                type="text"
                required
                value={formTitle}
                onChange={e => setFormTitle(e.target.value)}
                placeholder="e.g. Brigada Eskwela & School Supplies Drive 2026"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* 2. Project Address */}
            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                Project Address *
              </label>
              <input
                type="text"
                required
                value={formAddress}
                onChange={e => setFormAddress(e.target.value)}
                placeholder="e.g. Brgy. Aguada Covered Court, Ozamiz City, Misamis Occidental 7200"
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* 3. Project Beneficiaries */}
            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-blue-500" />
                Project Beneficiaries *
              </label>
              <input
                type="text"
                required
                value={formBeneficiaries}
                onChange={e => setFormBeneficiaries(e.target.value)}
                placeholder="e.g. 450 Elementary Pupils (Grades 1-4) & 35 Public School Teachers"
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* 4. Multiple Photos Upload */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-amber-600" />
                  Upload Multiple Photos
                </label>
                <button
                  type="button"
                  onClick={handleAddSamplePhotos}
                  className="text-[11px] font-bold text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  Load Sample Photo Presets
                </button>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleMultiplePhotosUpload}
                  className="w-full text-xs text-slate-500 file:mr-2 file:py-2 file:px-3.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-amber-100 file:text-amber-900 hover:file:bg-amber-200 cursor-pointer"
                />
              </div>

              {/* Photos Preview Thumbnails */}
              {formPhotos.length > 0 && (
                <div className="pt-2">
                  <span className="text-[11px] text-slate-500 block mb-1.5">
                    Attached Photos ({formPhotos.length}):
                  </span>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {formPhotos.map((photo, idx) => (
                      <div key={idx} className="relative h-16 rounded-lg overflow-hidden border border-slate-300 group">
                        <img src={photo} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(idx)}
                          className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full p-0.5 hover:bg-red-700"
                          title="Remove Photo"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 5. Upload Videos OR Video Link */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
              <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <VideoIcon className="w-4 h-4 text-rose-600" />
                Upload Videos OR Provide Video Link
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Video Link */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    Option A: Video Link (YouTube, Vimeo, MP4 URL)
                  </label>
                  <input
                    type="url"
                    value={formVideoLink}
                    onChange={e => setFormVideoLink(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                {/* Video File Upload */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    Option B: Upload Video File (MP4, WebM)
                  </label>
                  <input
                    type="file"
                    accept="video/mp4,video/webm,video/ogg"
                    onChange={handleVideoFileUpload}
                    className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-rose-100 file:text-rose-900 hover:file:bg-rose-200 cursor-pointer"
                  />
                </div>
              </div>

              {/* Video Preview status */}
              {(formVideoLink || formVideos.length > 0) && (
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-[11px] flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Video attached: {formVideoLink ? 'Web Video URL Linked' : 'Local Video File Uploaded'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setFormVideoLink('');
                      setFormVideos([]);
                    }}
                    className="text-red-600 font-bold hover:underline"
                  >
                    Clear Video
                  </button>
                </div>
              )}
            </div>

            {/* Category & Status */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">Category</label>
                <select
                  value={formCategory}
                  onChange={e => setFormCategory(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                >
                  <option value="EDUCATION">EDUCATION</option>
                  <option value="ENVIRONMENT_TREE_PLANTING">ENVIRONMENT & TREE PLANTING</option>
                  <option value="HEALTH_NUTRITION">HEALTH & NUTRITION</option>
                  <option value="CALAMITY_RELIEF">CALAMITY RELIEF</option>
                  <option value="LIVELIHOOD">LIVELIHOOD</option>
                  <option value="COMMUNITY_DEVELOPMENT">COMMUNITY DEVELOPMENT</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">Status</label>
                <select
                  value={formStatus}
                  onChange={e => setFormStatus(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                >
                  <option value="APPROVED">APPROVED (Scheduled)</option>
                  <option value="ONGOING">ONGOING</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>
            </div>

            {/* Budget & Leader */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">Budget Allocation (PHP) *</label>
                <input
                  type="number"
                  required
                  value={formBudget}
                  onChange={e => setFormBudget(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">Project Leader</label>
                <input
                  type="text"
                  value={formLeader}
                  onChange={e => setFormLeader(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">Description</label>
              <textarea
                rows={2}
                value={formDescription}
                onChange={e => setFormDescription(e.target.value)}
                placeholder="Comprehensive summary of outreach scope, community partnerships, and volunteer activities..."
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowFormModal(false)}
                className="px-4 py-2 font-bold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl shadow-md transition-all cursor-pointer"
              >
                {editingProject ? 'Save & Update Activity' : 'Publish OPEC Activity'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* LIGHTBOX PHOTO MODAL */}
      {lightboxPhoto && (
        <div
          onClick={() => setLightboxPhoto(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 cursor-pointer"
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img src={lightboxPhoto} alt="Documentation Enlarge" className="rounded-xl max-h-[85vh] w-auto mx-auto object-contain shadow-2xl" />
            <button
              onClick={() => setLightboxPhoto(null)}
              className="absolute -top-3 -right-3 bg-white text-black rounded-full p-1.5 shadow-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteTargetProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 text-red-700 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Delete OPEC Activity?
                </h3>
                <p className="text-slate-500 mt-0.5">
                  This will permanently delete this outreach project, along with its photos, videos, and records.
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="font-bold text-slate-900 dark:text-white block">
                {deleteTargetProject.projectTitle || deleteTargetProject.name}
              </span>
              <span className="text-[11px] text-slate-500 block">
                {deleteTargetProject.projectAddress || deleteTargetProject.location}
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTargetProject(null)}
                className="px-4 py-2 font-bold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2 font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-xs cursor-pointer"
              >
                Yes, Delete Activity
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
              <h3 className="text-base font-bold text-slate-900">Record Donation</h3>
              <button type="button" onClick={() => setShowDonationModal(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Donor Name *</label>
              <input
                type="text"
                required
                value={donorName}
                onChange={e => setDonorName(e.target.value)}
                placeholder="e.g. M Lhuillier Region 10 Officers"
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
    </div>
  );
};
