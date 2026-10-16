import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Announcement, AnnouncementCategory, AnnouncementPriority } from '../../types';
import {
  Megaphone,
  Plus,
  Search,
  Pin,
  Calendar,
  Clock,
  User,
  Tag,
  AlertTriangle,
  CheckCircle2,
  Edit3,
  Trash2,
  Eye,
  Filter,
  Sparkles,
  X,
  UploadCloud,
  FileText,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

const CATEGORY_STYLES: Record<AnnouncementCategory, { label: string; bg: string; text: string; border: string }> = {
  GENERAL: { label: 'General Announcement', bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-800 dark:text-slate-200', border: 'border-slate-300 dark:border-slate-700' },
  LOAN_POLICY: { label: 'Loan Policy & Products', bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-800 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800' },
  COMMUNITY: { label: 'OPEC Community & CSR', bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-800 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800' },
  PAYROLL: { label: 'Payroll & Cutoffs', bg: 'bg-blue-50 dark:bg-blue-950/40', text: 'text-blue-800 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800' },
  URGENT: { label: 'Urgent Advisory', bg: 'bg-red-50 dark:bg-red-950/40', text: 'text-red-800 dark:text-red-300', border: 'border-red-200 dark:border-red-800' },
  EVENT: { label: 'Event & Assembly', bg: 'bg-purple-50 dark:bg-purple-950/40', text: 'text-purple-800 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-800' },
};

const PRIORITY_BADGES: Record<AnnouncementPriority, { label: string; badgeClass: string; dotClass: string }> = {
  LOW: { label: 'Low', badgeClass: 'bg-slate-100 text-slate-700 border-slate-200', dotClass: 'bg-slate-400' },
  MEDIUM: { label: 'Medium', badgeClass: 'bg-blue-50 text-blue-700 border-blue-200', dotClass: 'bg-blue-500' },
  HIGH: { label: 'High Priority', badgeClass: 'bg-amber-50 text-amber-800 border-amber-300 font-bold', dotClass: 'bg-amber-500' },
  CRITICAL: { label: 'Critical / Urgent', badgeClass: 'bg-red-100 text-red-900 border-red-300 font-bold animate-pulse', dotClass: 'bg-red-600' },
};

export const AnnouncementsView: React.FC = () => {
  const { announcements, addAnnouncement, updateAnnouncement, deleteAnnouncement, currentUser } = useApp();

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | AnnouncementCategory>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | Announcement['status']>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | AnnouncementPriority>('ALL');

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [previewAnnouncement, setPreviewAnnouncement] = useState<Announcement | null>(null);

  // Form State
  const initialFormState: Omit<Announcement, 'id' | 'createdAt' | 'updatedAt'> = {
    title: '',
    content: '',
    category: 'GENERAL',
    priority: 'MEDIUM',
    targetAudience: 'ALL',
    isPinned: false,
    authorName: currentUser.name || 'Admin Officer',
    authorRole: currentUser.role ? currentUser.role.replace(/_/g, ' ') : 'Administrator',
    publishDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    imageUrl: '',
    attachmentName: '',
    tags: [],
    status: 'PUBLISHED',
  };

  const [formData, setFormData] = useState(initialFormState);
  const [tagInput, setTagInput] = useState('');
  const [imagePreview, setImagePreview] = useState<string>('');

  // Handle Photo / Image Upload
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImagePreview(result);
        setFormData(prev => ({ ...prev, imageUrl: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingAnnouncement(null);
    setFormData({
      ...initialFormState,
      authorName: currentUser.name || 'Admin Officer',
      authorRole: currentUser.role ? currentUser.role.replace(/_/g, ' ') : 'Administrator',
    });
    setTagInput('');
    setImagePreview('');
    setIsCreateModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      category: announcement.category,
      priority: announcement.priority,
      targetAudience: announcement.targetAudience,
      isPinned: !!announcement.isPinned,
      authorName: announcement.authorName,
      authorRole: announcement.authorRole || '',
      publishDate: announcement.publishDate,
      expiryDate: announcement.expiryDate || '',
      imageUrl: announcement.imageUrl || '',
      attachmentName: announcement.attachmentName || '',
      tags: announcement.tags || [],
      status: announcement.status,
    });
    setTagInput(announcement.tags?.join(', ') || '');
    setImagePreview(announcement.imageUrl || '');
    setIsCreateModalOpen(true);
  };

  // Submit Add / Edit Form
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) return;

    const parsedTags = tagInput
      ? tagInput.split(',').map(t => t.trim()).filter(Boolean)
      : formData.tags || [];

    if (editingAnnouncement) {
      updateAnnouncement({
        ...editingAnnouncement,
        ...formData,
        tags: parsedTags,
      });
    } else {
      addAnnouncement({
        ...formData,
        tags: parsedTags,
      });
    }

    setIsCreateModalOpen(false);
    setEditingAnnouncement(null);
  };

  // Confirm Delete
  const handleConfirmDelete = () => {
    if (deleteTargetId) {
      deleteAnnouncement(deleteTargetId);
      setDeleteTargetId(null);
    }
  };

  // Quick Pin Toggle
  const handleTogglePin = (announcement: Announcement) => {
    updateAnnouncement({
      ...announcement,
      isPinned: !announcement.isPinned,
    });
  };

  // Quick Status Toggle (Draft vs Published)
  const handleToggleStatus = (announcement: Announcement) => {
    const newStatus = announcement.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    updateAnnouncement({
      ...announcement,
      status: newStatus,
    });
  };

  // Filtered Announcements
  const filteredAnnouncements = useMemo(() => {
    return announcements
      .filter(a => {
        const matchesSearch =
          searchTerm === '' ||
          a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          a.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
          a.authorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          a.tags?.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesCategory = categoryFilter === 'ALL' || a.category === categoryFilter;
        const matchesStatus = statusFilter === 'ALL' || a.status === statusFilter;
        const matchesPriority = priorityFilter === 'ALL' || a.priority === priorityFilter;

        return matchesSearch && matchesCategory && matchesStatus && matchesPriority;
      })
      .sort((a, b) => {
        // Pinned first, then by publishDate descending
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime();
      });
  }, [announcements, searchTerm, categoryFilter, statusFilter, priorityFilter]);

  // Statistics
  const stats = useMemo(() => {
    return {
      total: announcements.length,
      published: announcements.filter(a => a.status === 'PUBLISHED').length,
      pinned: announcements.filter(a => a.isPinned).length,
      critical: announcements.filter(a => a.priority === 'CRITICAL' || a.priority === 'HIGH').length,
    };
  }, [announcements]);

  return (
    <div className="space-y-6">
      {/* Top Banner & KPI Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-2 bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/30">
              <Megaphone className="w-5 h-5" />
            </span>
            <span className="text-xs font-bold tracking-widest text-amber-400 uppercase">
              OPEC Broadcast & Communications
            </span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Announcements & Bulletins Desk
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Create, update, and manage official notices, loan policy memos, assembly schedules, and payroll advisories visible to employees and cooperative members across all branches.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            New Announcement
          </button>
        </div>
      </div>

      {/* Quick KPI Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 block">Total Announcements</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white mt-0.5 block">{stats.total}</span>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Megaphone className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 block">Live Published</span>
            <span className="text-2xl font-black text-emerald-600 mt-0.5 block">{stats.published}</span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 block">Pinned Notices</span>
            <span className="text-2xl font-black text-amber-600 mt-0.5 block">{stats.pinned}</span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Pin className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 block">High / Critical Alerts</span>
            <span className="text-2xl font-black text-red-600 mt-0.5 block">{stats.critical}</span>
          </div>
          <div className="p-3 bg-red-50 text-red-600 rounded-xl">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filters & Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search announcements by title, content, author, or tags..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white"
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value as any)}
              className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 font-semibold"
            >
              <option value="ALL">All Categories</option>
              <option value="GENERAL">General</option>
              <option value="LOAN_POLICY">Loan Policy</option>
              <option value="COMMUNITY">Community & CSR</option>
              <option value="PAYROLL">Payroll & Cutoffs</option>
              <option value="URGENT">Urgent Advisory</option>
              <option value="EVENT">Event & Assembly</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 font-semibold"
            >
              <option value="ALL">All Statuses</option>
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Draft</option>
              <option value="ARCHIVED">Archived</option>
            </select>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={e => setPriorityFilter(e.target.value as any)}
              className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 font-semibold"
            >
              <option value="ALL">All Priorities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Announcements List */}
      {filteredAnnouncements.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-800">
          <Megaphone className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No announcements found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search query or filters, or create a new announcement using the button above.
          </p>
          <button
            onClick={handleOpenAdd}
            className="mt-4 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-all"
          >
            Create First Announcement
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAnnouncements.map(announcement => {
            const catStyle = CATEGORY_STYLES[announcement.category] || CATEGORY_STYLES.GENERAL;
            const priorityBadge = PRIORITY_BADGES[announcement.priority] || PRIORITY_BADGES.MEDIUM;

            return (
              <div
                key={announcement.id}
                className={`bg-white dark:bg-slate-900 rounded-xl border transition-all duration-200 hover:shadow-md ${
                  announcement.isPinned
                    ? 'border-amber-400 dark:border-amber-500/80 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="p-5">
                  {/* Card Header */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {announcement.isPinned && (
                          <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800">
                            <Pin className="w-3 h-3 fill-amber-500 text-amber-600" />
                            Pinned Notice
                          </span>
                        )}

                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}>
                          {catStyle.label}
                        </span>

                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded border flex items-center gap-1.5 ${priorityBadge.badgeClass}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${priorityBadge.dotClass}`} />
                          {priorityBadge.label}
                        </span>

                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                          announcement.status === 'PUBLISHED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400'
                            : announcement.status === 'DRAFT'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {announcement.status}
                        </span>

                        <span className="text-[11px] text-slate-500 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                          Audience: <strong className="text-slate-700 dark:text-slate-300">{announcement.targetAudience}</strong>
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900 dark:text-white pt-1">
                        {announcement.title}
                      </h3>
                    </div>

                    {/* Action Buttons: Edit, Delete, Pin, Preview */}
                    <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-start">
                      <button
                        onClick={() => handleTogglePin(announcement)}
                        title={announcement.isPinned ? 'Unpin Announcement' : 'Pin to Top'}
                        className={`p-2 rounded-lg text-xs font-semibold border transition-all ${
                          announcement.isPinned
                            ? 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <Pin className={`w-3.5 h-3.5 ${announcement.isPinned ? 'fill-amber-500' : ''}`} />
                      </button>

                      <button
                        onClick={() => handleToggleStatus(announcement)}
                        title={announcement.status === 'PUBLISHED' ? 'Set as Draft' : 'Publish Announcement'}
                        className="px-2.5 py-1.5 text-xs font-bold bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg border border-slate-200 dark:border-slate-700 transition-all"
                      >
                        {announcement.status === 'PUBLISHED' ? 'Draft' : 'Publish'}
                      </button>

                      <button
                        onClick={() => handleOpenEdit(announcement)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800 transition-all"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Edit
                      </button>

                      <button
                        onClick={() => setDeleteTargetId(announcement.id)}
                        className="p-2 text-xs font-bold bg-red-50 hover:bg-red-100 text-red-700 rounded-lg border border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800 transition-all"
                        title="Delete Announcement"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Body Content & Image */}
                  <div className="pt-3.5 text-xs text-slate-700 dark:text-slate-300 space-y-3">
                    <p className="leading-relaxed whitespace-pre-line">
                      {announcement.content}
                    </p>

                    {/* Image Preview if attached */}
                    {announcement.imageUrl && (
                      <div className="pt-1">
                        <img
                          src={announcement.imageUrl}
                          alt={announcement.title}
                          className="max-h-56 w-auto object-cover rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs cursor-pointer hover:opacity-95 transition-opacity"
                          onClick={() => setPreviewAnnouncement(announcement)}
                        />
                      </div>
                    )}

                    {/* Tags */}
                    {announcement.tags && announcement.tags.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <Tag className="w-3 h-3 text-slate-400" />
                        {announcement.tags.map((tag, i) => (
                          <span
                            key={i}
                            className="text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded font-medium"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Card Footer: Metadata */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between text-[11px] text-slate-500 gap-2">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1 font-medium">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        By: <strong className="text-slate-700 dark:text-slate-300">{announcement.authorName}</strong> ({announcement.authorRole || 'Admin'})
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        Published: {announcement.publishDate}
                      </span>
                      {announcement.expiryDate && (
                        <span className="flex items-center gap-1 text-amber-700 dark:text-amber-400">
                          <Clock className="w-3.5 h-3.5" />
                          Expires: {announcement.expiryDate}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => setPreviewAnnouncement(announcement)}
                      className="text-amber-700 dark:text-amber-400 font-bold hover:underline flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View Full Bulletin
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 max-h-[90vh] overflow-y-auto text-xs">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-amber-500/20 text-amber-600 rounded-lg">
                  <Megaphone className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {editingAnnouncement ? 'Update Announcement' : 'Create New Announcement'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Publish an official bulletin or notification for OPEC cooperative members.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitForm} className="space-y-4">
              {/* Title */}
              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Announcement Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. OPEC 2026 Annual General Assembly & Financial Report Notice"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Category, Priority & Audience */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                  >
                    <option value="GENERAL">General</option>
                    <option value="LOAN_POLICY">Loan Policy & Products</option>
                    <option value="COMMUNITY">OPEC Community & CSR</option>
                    <option value="PAYROLL">Payroll & Cutoffs</option>
                    <option value="URGENT">Urgent Advisory</option>
                    <option value="EVENT">Event & Assembly</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Priority Level *
                  </label>
                  <select
                    value={formData.priority}
                    onChange={e => setFormData({ ...formData, priority: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High Priority</option>
                    <option value="CRITICAL">Critical / Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Target Audience *
                  </label>
                  <select
                    value={formData.targetAudience}
                    onChange={e => setFormData({ ...formData, targetAudience: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                  >
                    <option value="ALL">All Members & Staff</option>
                    <option value="MEMBERS">Active Members Only</option>
                    <option value="OFFICERS">OPEC Officers Only</option>
                    <option value="MANAGEMENT">Management / Regional</option>
                  </select>
                </div>
              </div>

              {/* Status, Pinned & Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Publication Status *
                  </label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                  >
                    <option value="PUBLISHED">Published (Live)</option>
                    <option value="DRAFT">Draft</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Publish Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.publishDate}
                    onChange={e => setFormData({ ...formData, publishDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Expiry Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={formData.expiryDate}
                    onChange={e => setFormData({ ...formData, expiryDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Pin to Top Checkbox */}
              <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800">
                <input
                  type="checkbox"
                  id="isPinnedCheck"
                  checked={formData.isPinned}
                  onChange={e => setFormData({ ...formData, isPinned: e.target.checked })}
                  className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                />
                <label htmlFor="isPinnedCheck" className="text-xs font-bold text-amber-900 dark:text-amber-300 cursor-pointer flex items-center gap-1.5">
                  <Pin className="w-3.5 h-3.5 fill-amber-500" />
                  Pin this announcement to the top of all member dashboards
                </label>
              </div>

              {/* Content Body */}
              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Announcement Details & Body *
                </label>
                <textarea
                  rows={5}
                  required
                  value={formData.content}
                  onChange={e => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Provide complete details, instructions, action items, dates, and contacts for members..."
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white leading-relaxed focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Image Upload or URL */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                <label className="block font-bold text-slate-800 dark:text-slate-200">
                  Featured Photo or Banner (Optional)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-500 block mb-1">Upload Photo File</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-amber-100 file:text-amber-900 hover:file:bg-amber-200 cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500 block mb-1">Or Enter Image URL</label>
                    <input
                      type="url"
                      value={formData.imageUrl}
                      onChange={e => {
                        setFormData({ ...formData, imageUrl: e.target.value });
                        setImagePreview(e.target.value);
                      }}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>
                </div>

                {imagePreview && (
                  <div className="relative inline-block mt-2">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="h-24 w-auto rounded-lg border border-slate-300 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview('');
                        setFormData({ ...formData, imageUrl: '' });
                      }}
                      className="absolute -top-1.5 -right-1.5 bg-red-600 text-white rounded-full p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Tags */}
              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  placeholder="e.g. General Assembly, Dividends, CBU, Notice"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              {/* Author & Role */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Author Name
                  </label>
                  <input
                    type="text"
                    value={formData.authorName}
                    onChange={e => setFormData({ ...formData, authorName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Designation / Title
                  </label>
                  <input
                    type="text"
                    value={formData.authorRole}
                    onChange={e => setFormData({ ...formData, authorRole: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl shadow-md transition-all cursor-pointer"
                >
                  {editingAnnouncement ? 'Save & Update Announcement' : 'Publish Announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FULL BULLETIN PREVIEW MODAL */}
      {previewAnnouncement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto text-xs">
            <div className="flex items-start justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${CATEGORY_STYLES[previewAnnouncement.category]?.bg} ${CATEGORY_STYLES[previewAnnouncement.category]?.text} ${CATEGORY_STYLES[previewAnnouncement.category]?.border}`}>
                    {CATEGORY_STYLES[previewAnnouncement.category]?.label}
                  </span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${PRIORITY_BADGES[previewAnnouncement.priority]?.badgeClass}`}>
                    {PRIORITY_BADGES[previewAnnouncement.priority]?.label}
                  </span>
                  {previewAnnouncement.isPinned && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900">
                      Pinned
                    </span>
                  )}
                </div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white pt-1">
                  {previewAnnouncement.title}
                </h2>
              </div>
              <button
                onClick={() => setPreviewAnnouncement(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {previewAnnouncement.imageUrl && (
              <img
                src={previewAnnouncement.imageUrl}
                alt={previewAnnouncement.title}
                className="w-full max-h-72 object-cover rounded-xl border border-slate-200"
              />
            )}

            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-line text-sm">
              {previewAnnouncement.content}
            </div>

            <div className="flex flex-wrap items-center justify-between text-slate-500 pt-2 text-xs border-t border-slate-100 dark:border-slate-800">
              <div>
                Published on <strong>{previewAnnouncement.publishDate}</strong> by <strong>{previewAnnouncement.authorName}</strong> ({previewAnnouncement.authorRole})
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const toEdit = previewAnnouncement;
                    setPreviewAnnouncement(null);
                    handleOpenEdit(toEdit);
                  }}
                  className="px-3 py-1.5 bg-blue-50 text-blue-700 font-bold rounded-lg border border-blue-200"
                >
                  Edit Announcement
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 text-red-700 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Delete Announcement?
                </h3>
                <p className="text-slate-500 mt-0.5">
                  This action cannot be undone. Members will no longer see this broadcast notice.
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
              <span className="font-bold text-slate-800 dark:text-slate-200 block">
                {announcements.find(a => a.id === deleteTargetId)?.title}
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTargetId(null)}
                className="px-4 py-2 font-bold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2 font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-xs"
              >
                Yes, Delete Announcement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
