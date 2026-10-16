import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  Panel,
  Handle,
  Position,
  MarkerType,
  Connection,
  Edge,
  Node,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useApp } from '../../context/AppContext';
import { Employee } from '../../types';
import {
  Building2,
  MapPin,
  Users,
  Shield,
  Layers,
  ChevronRight,
  Phone,
  ArrowRight,
  Search,
  RotateCcw,
  LayoutGrid,
  GitBranch,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Move,
  UserCheck,
  Building,
  Briefcase,
  X,
  ExternalLink,
  Crown,
  Share2,
} from 'lucide-react';

type OrgNodeData = {
  employee: Employee;
  manager?: Employee;
  directReportsCount: number;
  branchName: string;
  areaName: string;
  isHighlighted?: boolean;
  onReassign: (emp: Employee) => void;
  onViewDetails: (emp: Employee) => void;
  [key: string]: unknown;
};

type OrgNodeType = Node<OrgNodeData, 'orgNode'>;

// Custom Org Chart Node Component
const OrgNode: React.FC<NodeProps<OrgNodeType>> = ({ data }) => {
  const { employee, directReportsCount, branchName, areaName, isHighlighted, onReassign, onViewDetails } = data;

  // Determine badge styling based on position / role
  const isPresident = employee.opecPosition === 'OPEC President';
  const isRegional = employee.position.includes('Regional') || employee.opecPosition === 'Regional Manager';
  const isArea = employee.position.includes('Area') || employee.opecPosition === 'Area Manager';
  const isOfficer = employee.opecPosition && employee.opecPosition !== 'Member';

  const badgeColor = isPresident
    ? 'bg-amber-500 text-slate-950 font-black'
    : isRegional
    ? 'bg-blue-600 text-white font-bold'
    : isArea
    ? 'bg-purple-600 text-white font-bold'
    : isOfficer
    ? 'bg-emerald-600 text-white font-bold'
    : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold';

  return (
    <div
      className={`w-72 bg-white dark:bg-slate-900 rounded-2xl border-2 transition-all shadow-md group ${
        isHighlighted
          ? 'border-amber-400 ring-4 ring-amber-400/40 shadow-xl'
          : isPresident
          ? 'border-amber-500 shadow-amber-500/10'
          : isRegional
          ? 'border-blue-500 shadow-blue-500/10'
          : isArea
          ? 'border-purple-500 shadow-purple-500/10'
          : 'border-slate-300 dark:border-slate-700 hover:border-amber-500/80'
      }`}
    >
      {/* Top Handle - Connects to Supervisor (Target) */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-4 !h-4 !bg-amber-500 !border-2 !border-white dark:!border-slate-900 !-top-2 cursor-crosshair hover:!scale-125 transition-transform shadow-xs"
        title="Drop incoming supervisor line here"
      />

      {/* Node Header Pill */}
      <div className="p-3.5 pb-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
        <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1 ${badgeColor}`}>
          {isPresident && <Crown className="w-3 h-3 text-slate-950" />}
          <span>{employee.opecPosition || 'Member'}</span>
        </span>

        <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500">
          {employee.employeeNumber}
        </span>
      </div>

      {/* Node Body */}
      <div className="p-4 pt-3 space-y-2.5">
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 shadow-2xs">
              {employee.avatarUrl ? (
                <img src={employee.avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-bold text-slate-600 dark:text-slate-300">
                  {employee.firstName.charAt(0)}
                  {employee.lastName.charAt(0)}
                </div>
              )}
            </div>
            <span
              className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900 ${
                employee.employmentStatus === 'PERMANENT' ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
              title={`Status: ${employee.employmentStatus}`}
            />
          </div>

          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-black text-slate-900 dark:text-white truncate">
              {employee.suffix ? `${employee.suffix} ` : ''}
              {employee.firstName} {employee.lastName}
            </h4>
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 truncate">
              {employee.position}
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
              {branchName} · {areaName}
            </p>
          </div>
        </div>

        {/* Reporting metrics */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
          <span className="font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-amber-500" />
            {directReportsCount} Direct Report{directReportsCount !== 1 ? 's' : ''}
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onReassign(employee)}
              className="px-2 py-1 text-[10px] font-bold rounded-md bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 hover:bg-amber-200 border border-amber-300 dark:border-amber-700 cursor-pointer transition-colors"
              title="Change manager / supervisor"
            >
              Reassign
            </button>
            <button
              onClick={() => onViewDetails(employee)}
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              title="View details"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Handle - Connects to Direct Reports (Source) */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-4 !h-4 !bg-amber-500 !border-2 !border-white dark:!border-slate-900 !-bottom-2 cursor-crosshair hover:!scale-125 transition-transform shadow-xs"
        title="Drag connection to link a subordinate"
      />
    </div>
  );
};

export const OrganizationView: React.FC = () => {
  const { regions, areas, branches, employees, updateEmployee, notify } = useApp();

  // Active view tab: 'CHART' | 'EXPLORER' | 'OFFICERS'
  const [activeTab, setActiveTab] = useState<'CHART' | 'EXPLORER' | 'OFFICERS'>('CHART');

  // Search & Filters for Org Chart
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedAreaFilter, setSelectedAreaFilter] = useState<string>('ALL');

  // Geographic explorer state
  const [selectedRegionId, setSelectedRegionId] = useState<string>(regions[0]?.id || '');
  const [selectedAreaId, setSelectedAreaId] = useState<string>(areas[0]?.id || '');

  // Modal / details states
  const [selectedEmployeeForModal, setSelectedEmployeeForModal] = useState<Employee | null>(null);
  const [reassignModalEmployee, setReassignModalEmployee] = useState<Employee | null>(null);
  const [newSupervisorId, setNewSupervisorId] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const currentAreas = areas.filter(a => a.regionId === selectedRegionId);
  const currentBranches = branches.filter(b => b.areaId === selectedAreaId);
  const officers = employees.filter(e => e.opecPosition && e.opecPosition !== 'Member');

  // Helper mapping
  const branchMap = useMemo(() => new Map(branches.map(b => [b.id, b])), [branches]);
  const areaMap = useMemo(() => new Map(areas.map(a => [a.id, a])), [areas]);
  const employeeMap = useMemo(() => new Map(employees.map(e => [e.id, e])), [employees]);

  // Compute direct reports count per employee
  const directReportsCountMap = useMemo(() => {
    const counts = new Map<string, number>();
    for (const emp of employees) {
      if (emp.reportsToId) {
        counts.set(emp.reportsToId, (counts.get(emp.reportsToId) || 0) + 1);
      }
    }
    return counts;
  }, [employees]);

  // Determine tree depth / level for hierarchical auto-layout
  const getEmployeeLevel = useCallback(
    (empId: string, visited = new Set<string>()): number => {
      if (visited.has(empId)) return 0;
      visited.add(empId);
      const emp = employeeMap.get(empId);
      if (!emp || !emp.reportsToId) return 0;
      return 1 + getEmployeeLevel(emp.reportsToId, visited);
    },
    [employeeMap]
  );

  // Check if a node is an ancestor/descendant to avoid loops
  const isDescendant = useCallback(
    (potentialAncestorId: string, targetId: string, visited = new Set<string>()): boolean => {
      if (potentialAncestorId === targetId) return true;
      if (visited.has(targetId)) return false;
      visited.add(targetId);
      const targetEmp = employeeMap.get(targetId);
      if (!targetEmp || !targetEmp.reportsToId) return false;
      return isDescendant(potentialAncestorId, targetEmp.reportsToId, visited);
    },
    [employeeMap]
  );

  // Generate Hierarchical Nodes & Edges
  const generateChartElements = useCallback(() => {
    // Filter employees if area filter is applied (always include executives to keep root connected)
    const filteredEmployees = employees.filter(emp => {
      if (selectedAreaFilter === 'ALL') return true;
      if (!emp.reportsToId) return true; // keep root leaders
      return emp.areaId === selectedAreaFilter;
    });

    // Group employees by hierarchical level
    const levelGroups: { [level: number]: Employee[] } = {};
    filteredEmployees.forEach(emp => {
      const lvl = getEmployeeLevel(emp.id);
      if (!levelGroups[lvl]) levelGroups[lvl] = [];
      levelGroups[lvl].push(emp);
    });

    const newNodes: OrgNodeType[] = [];
    const newEdges: Edge[] = [];

    const LEVEL_HEIGHT = 220;
    const NODE_WIDTH = 320;

    Object.entries(levelGroups).forEach(([levelStr, groupEmps]) => {
      const level = parseInt(levelStr, 10);
      const count = groupEmps.length;
      const totalWidth = count * NODE_WIDTH;
      const startX = -(totalWidth / 2) + NODE_WIDTH / 2 + 500;

      groupEmps.forEach((emp, index) => {
        const x = startX + index * NODE_WIDTH;
        const y = level * LEVEL_HEIGHT + 50;

        const branch = branchMap.get(emp.branchId);
        const area = areaMap.get(emp.areaId);
        const manager = emp.reportsToId ? employeeMap.get(emp.reportsToId) : undefined;
        const directCount = directReportsCountMap.get(emp.id) || 0;

        const isMatch =
          searchQuery.trim() !== '' &&
          (`${emp.firstName} ${emp.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
            emp.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
            emp.employeeNumber.toLowerCase().includes(searchQuery.toLowerCase()));

        newNodes.push({
          id: emp.id,
          type: 'orgNode',
          position: { x, y },
          data: {
            employee: emp,
            manager,
            directReportsCount: directCount,
            branchName: branch?.name || 'Main Office',
            areaName: area?.name || emp.areaName || 'ZASURMIS',
            isHighlighted: isMatch,
            onReassign: (e: Employee) => {
              setReassignModalEmployee(e);
              setNewSupervisorId(e.reportsToId || '');
            },
            onViewDetails: (e: Employee) => setSelectedEmployeeForModal(e),
          },
        });

        // Add edge if reporting to an existing node
        if (emp.reportsToId && filteredEmployees.some(fe => fe.id === emp.reportsToId)) {
          newEdges.push({
            id: `edge-${emp.reportsToId}-${emp.id}`,
            source: emp.reportsToId,
            target: emp.id,
            type: 'smoothstep',
            animated: true,
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: '#f59e0b',
              width: 18,
              height: 18,
            },
            style: {
              stroke: '#f59e0b',
              strokeWidth: 2.5,
            },
            label: 'Reports to',
            labelStyle: { fill: '#64748b', fontSize: 10, fontWeight: 700 },
          });
        }
      });
    });

    return { initialNodes: newNodes, initialEdges: newEdges };
  }, [
    employees,
    selectedAreaFilter,
    getEmployeeLevel,
    branchMap,
    areaMap,
    employeeMap,
    directReportsCountMap,
    searchQuery,
  ]);

  const { initialNodes, initialEdges } = useMemo(() => generateChartElements(), [generateChartElements]);

  const [nodes, setNodes, onNodesChange] = useNodesState<OrgNodeType>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync nodes & edges when data changes
  useEffect(() => {
    const { initialNodes: freshNodes, initialEdges: freshEdges } = generateChartElements();
    setNodes(freshNodes);
    setEdges(freshEdges);
  }, [employees, selectedAreaFilter, searchQuery, generateChartElements, setNodes, setEdges]);

  // Node types registration
  const nodeTypes = useMemo(() => ({ orgNode: OrgNode }), []);

  // Handle Drag-and-Drop Connection: User connects Supervisor to Subordinate
  const onConnect = useCallback(
    (connection: Connection) => {
      const supervisorId = connection.source;
      const subordinateId = connection.target;

      if (!supervisorId || !subordinateId) return;

      if (supervisorId === subordinateId) {
        showToast('Error: An employee cannot report to themselves.');
        return;
      }

      // Check circular reporting
      if (isDescendant(subordinateId, supervisorId)) {
        showToast('Error: Circular reporting detected. A manager cannot report to their own subordinate.');
        return;
      }

      const subordinate = employeeMap.get(subordinateId);
      const supervisor = employeeMap.get(supervisorId);

      if (!subordinate || !supervisor) return;

      // Update the subordinate's reportsToId
      const updatedSubordinate: Employee = {
        ...subordinate,
        reportsToId: supervisorId,
      };

      updateEmployee(updatedSubordinate);

      notify(
        'Reporting Structure Updated',
        `${subordinate.firstName} ${subordinate.lastName} now directly reports to ${supervisor.firstName} ${supervisor.lastName}.`,
        'INFO',
        ['SUPER_ADMIN', 'ADMIN']
      );

      showToast(
        `Hierarchy updated: ${subordinate.firstName} ${subordinate.lastName} now reports to ${supervisor.firstName} ${supervisor.lastName}`
      );
    },
    [employeeMap, isDescendant, updateEmployee, notify]
  );

  // Execute manual supervisor reassign
  const handleConfirmReassign = () => {
    if (!reassignModalEmployee) return;

    if (newSupervisorId === reassignModalEmployee.id) {
      showToast('Error: Employee cannot be their own supervisor.');
      return;
    }

    if (newSupervisorId && isDescendant(reassignModalEmployee.id, newSupervisorId)) {
      showToast('Error: Circular hierarchy loop detected.');
      return;
    }

    const updated: Employee = {
      ...reassignModalEmployee,
      reportsToId: newSupervisorId ? newSupervisorId : undefined,
    };

    updateEmployee(updated);

    const supName = newSupervisorId
      ? `${employeeMap.get(newSupervisorId)?.firstName} ${employeeMap.get(newSupervisorId)?.lastName}`
      : 'Executive Directorate (Independent)';

    showToast(`Reporting structure updated: ${updated.firstName} ${updated.lastName} now reports to ${supName}.`);

    setReassignModalEmployee(null);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Reset to default OPEC organizational structure
  const handleResetToDefault = () => {
    localStorage.removeItem('oagims_employees');
    window.location.reload();
  };

  // Auto-layout button triggers fresh hierarchical alignment
  const handleAutoLayout = () => {
    const { initialNodes: freshNodes, initialEdges: freshEdges } = generateChartElements();
    setNodes(freshNodes);
    setEdges(freshEdges);
    showToast('Hierarchical layout re-aligned successfully.');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Mode Tabs */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-amber-500 text-slate-950 flex items-center gap-1">
              <GitBranch className="w-3.5 h-3.5" />
              Organizational Management
            </span>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              Interactive React-Flow Hierarchy
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-2 tracking-tight">
            Organizational Structure & Hierarchy Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Drag-and-drop connection handles or nodes to adjust reporting lines, manage branch leadership, and review governing directorates.
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0">
          <button
            onClick={() => setActiveTab('CHART')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'CHART'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <GitBranch className="w-3.5 h-3.5" />
            <span>Interactive Org Chart</span>
          </button>
          <button
            onClick={() => setActiveTab('EXPLORER')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'EXPLORER'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Branches Explorer</span>
          </button>
          <button
            onClick={() => setActiveTab('OFFICERS')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'OFFICERS'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Officers ({officers.length})</span>
          </button>
        </div>
      </div>

      {/* Floating Status Notification Toast */}
      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-amber-500 text-slate-950 border border-amber-600 font-bold text-xs flex items-center justify-between shadow-lg animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="p-1 hover:bg-amber-600 rounded">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* View 1: Interactive React Flow Org Chart */}
      {activeTab === 'CHART' && (
        <div className="space-y-4">
          {/* Controls & Filter Bar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search Box */}
            <div className="flex items-center gap-3 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search officer, employee, or ID..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Area filter */}
              <select
                value={selectedAreaFilter}
                onChange={e => setSelectedAreaFilter(e.target.value)}
                className="py-2 px-3 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
              >
                <option value="ALL">All Areas (ZASURMIS)</option>
                {areas.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleAutoLayout}
                className="px-3 py-2 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 cursor-pointer transition-colors"
                title="Automatically align nodes in hierarchical tree"
              >
                <LayoutGrid className="w-3.5 h-3.5 text-amber-500" />
                <span>Auto-Layout Hierarchy</span>
              </button>

              <button
                onClick={handleResetToDefault}
                className="px-3 py-2 rounded-lg text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-center gap-1.5 cursor-pointer transition-colors"
                title="Reset hierarchy to default OPEC blueprint"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Structure</span>
              </button>
            </div>
          </div>

          {/* Canvas Notice / Instructions */}
          <div className="bg-amber-50 dark:bg-amber-950/40 p-3 rounded-xl border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Move className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Drag-and-Drop Enabled:</strong> Drag yellow connection circles from any supervisor (bottom handle) to subordinate (top handle) to reassign reporting structure. Drag cards to freely reposition.
              </span>
            </div>
            <span className="text-[11px] font-mono font-bold shrink-0 hidden sm:inline">
              {employees.length} Personnel Linked
            </span>
          </div>

          {/* Interactive Flow Canvas */}
          <div className="relative w-full h-[680px] rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 overflow-hidden shadow-inner">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              nodeTypes={nodeTypes}
              fitView
              fitViewOptions={{ padding: 0.2 }}
              minZoom={0.2}
              maxZoom={1.5}
              defaultEdgeOptions={{
                animated: true,
                style: { stroke: '#f59e0b', strokeWidth: 2.5 },
                markerEnd: { type: MarkerType.ArrowClosed, color: '#f59e0b' },
              }}
            >
              <Background variant={BackgroundVariant.Dots} gap={20} size={1.5} color="#94a3b833" />
              <Controls className="!bg-white dark:!bg-slate-900 !border !border-slate-200 dark:!border-slate-750 !rounded-xl !shadow-md" />
              <MiniMap
                zoomable
                pannable
                nodeStrokeWidth={3}
                nodeColor={node => {
                  const emp = (node.data as any)?.employee as Employee | undefined;
                  if (emp?.opecPosition === 'OPEC President') return '#f59e0b';
                  if (emp?.opecPosition === 'Regional Manager') return '#2563eb';
                  if (emp?.opecPosition === 'Area Manager') return '#9333ea';
                  return '#10b981';
                }}
                className="!bg-white/90 dark:!bg-slate-900/90 !border !border-slate-200 dark:!border-slate-750 !rounded-xl !shadow-lg"
              />
              <Panel position="top-right" className="bg-white/95 dark:bg-slate-900/95 p-3 rounded-xl border border-slate-200 dark:border-slate-750 shadow-md text-xs space-y-1.5 backdrop-blur-xs">
                <span className="font-bold text-slate-800 dark:text-slate-200 block text-[11px] uppercase tracking-wider">
                  Hierarchy Legend
                </span>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span className="text-[11px] text-slate-600 dark:text-slate-300">Executive President</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                  <span className="text-[11px] text-slate-600 dark:text-slate-300">Regional Leadership</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
                  <span className="text-[11px] text-slate-600 dark:text-slate-300">Area Management</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                  <span className="text-[11px] text-slate-600 dark:text-slate-300">Branch Operations & Tellers</span>
                </div>
              </Panel>
            </ReactFlow>
          </div>
        </div>
      )}

      {/* View 2: Geographic Regions -> Areas -> Branches Explorer */}
      {activeTab === 'EXPLORER' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Regions Column */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              <Layers className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>1. Regions ({regions.length})</span>
            </div>

            <div className="space-y-2">
              {regions.map(r => (
                <div
                  key={r.id}
                  onClick={() => {
                    setSelectedRegionId(r.id);
                    const firstArea = areas.find(a => a.regionId === r.id);
                    if (firstArea) setSelectedAreaId(firstArea.id);
                  }}
                  className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between text-xs ${
                    selectedRegionId === r.id
                      ? 'border-amber-500 bg-amber-50/80 dark:bg-amber-950/40 text-slate-950 dark:text-white font-bold shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <div>
                    <span className="block font-semibold">{r.name}</span>
                    <span className="font-mono text-[10px] text-slate-400">{r.code}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              ))}
            </div>
          </div>

          {/* Areas Column */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              <MapPin className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>2. Areas ({currentAreas.length})</span>
            </div>

            <div className="space-y-2">
              {currentAreas.map(a => (
                <div
                  key={a.id}
                  onClick={() => setSelectedAreaId(a.id)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between text-xs ${
                    selectedAreaId === a.id
                      ? 'border-amber-500 bg-amber-50/80 dark:bg-amber-950/40 text-slate-950 dark:text-white font-bold shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <div>
                    <span className="block font-semibold">{a.name}</span>
                    <span className="font-mono text-[10px] text-slate-400">{a.code}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              ))}
            </div>
          </div>

          {/* Branches Column */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              <Building2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>3. Branches ({currentBranches.length})</span>
            </div>

            <div className="space-y-2">
              {currentBranches.map(b => {
                const staffCount = employees.filter(e => e.branchId === b.id).length;

                return (
                  <div key={b.id} className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white">{b.name}</span>
                      <span className="font-mono text-[10px] text-slate-400 font-semibold">{b.code}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{b.address}</p>
                    <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {b.contactNumber}
                      </span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">{staffCount} Personnel</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* View 3: Officers & Executive Directorate */}
      {activeTab === 'OFFICERS' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              OPEC Aurum Gems Executive Directorate & Committee Leads
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Governing officers for loan committee sign-offs, credit policy, and chapter administration.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {officers.map(off => {
              const branch = branches.find(b => b.id === off.branchId);
              const supervisor = off.reportsToId ? employeeMap.get(off.reportsToId) : undefined;

              return (
                <div key={off.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-800 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-amber-500 shrink-0">
                    {off.avatarUrl ? (
                      <img src={off.avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-800 dark:text-white">
                        {off.firstName.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 text-xs">
                    <span className="font-bold text-slate-900 dark:text-white block truncate">
                      {off.suffix ? `${off.suffix} ` : ''}
                      {off.firstName} {off.lastName}
                    </span>
                    <span className="font-semibold text-amber-700 dark:text-amber-400 block truncate">
                      {off.opecPosition}
                    </span>
                    <span className="text-slate-400 text-[11px] block truncate">
                      {branch?.name}
                    </span>
                    {supervisor && (
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate mt-0.5">
                        Reports to: {supervisor.firstName} {supervisor.lastName}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal: Reassign Reporting Supervisor */}
      {reassignModalEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Reassign Reporting Supervisor
              </h3>
              <button
                onClick={() => setReassignModalEmployee(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden border border-amber-500 shrink-0">
                {reassignModalEmployee.avatarUrl ? (
                  <img src={reassignModalEmployee.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-slate-200 flex items-center justify-center font-bold">
                    {reassignModalEmployee.firstName.charAt(0)}
                  </div>
                )}
              </div>
              <div className="text-xs">
                <span className="font-bold text-slate-900 dark:text-white block">
                  {reassignModalEmployee.firstName} {reassignModalEmployee.lastName}
                </span>
                <span className="text-slate-500 dark:text-slate-400 block">
                  {reassignModalEmployee.position} · {reassignModalEmployee.employeeNumber}
                </span>
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <label className="font-bold text-slate-700 dark:text-slate-300 block">
                Select Direct Manager / Supervisor:
              </label>
              <select
                value={newSupervisorId}
                onChange={e => setNewSupervisorId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-amber-500"
              >
                <option value="">Executive Directorate / Board (Top-Level Root)</option>
                {employees
                  .filter(e => e.id !== reassignModalEmployee.id && !isDescendant(reassignModalEmployee.id, e.id))
                  .map(mgr => (
                    <option key={mgr.id} value={mgr.id}>
                      {mgr.firstName} {mgr.lastName} ({mgr.opecPosition || mgr.position}) - {mgr.employeeNumber}
                    </option>
                  ))}
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                Notice: Circular dependencies are automatically excluded from the options.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setReassignModalEmployee(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReassign}
                className="px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg shadow-sm cursor-pointer"
              >
                Save Reporting Structure
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Employee Details Slide-out / Popup */}
      {selectedEmployeeForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Employee Profile & Reporting Structure
              </h3>
              <button
                onClick={() => setSelectedEmployeeForModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-amber-500 shrink-0">
                {selectedEmployeeForModal.avatarUrl ? (
                  <img src={selectedEmployeeForModal.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-slate-200 flex items-center justify-center font-bold text-lg">
                    {selectedEmployeeForModal.firstName.charAt(0)}
                  </div>
                )}
              </div>
              <div>
                <h4 className="text-base font-black text-slate-900 dark:text-white">
                  {selectedEmployeeForModal.suffix ? `${selectedEmployeeForModal.suffix} ` : ''}
                  {selectedEmployeeForModal.firstName} {selectedEmployeeForModal.lastName}
                </h4>
                <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                  {selectedEmployeeForModal.opecPosition || 'Member'} · {selectedEmployeeForModal.position}
                </p>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  ID: {selectedEmployeeForModal.employeeNumber} · Hired: {selectedEmployeeForModal.dateHired}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs pt-2">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Branch & Area</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {branchMap.get(selectedEmployeeForModal.branchId)?.name || 'Main Branch'}
                </span>
                <span className="text-[11px] text-slate-500 block">
                  {areaMap.get(selectedEmployeeForModal.areaId)?.name || 'Region 20'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Direct Supervisor</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {selectedEmployeeForModal.reportsToId
                    ? `${employeeMap.get(selectedEmployeeForModal.reportsToId)?.firstName} ${employeeMap.get(selectedEmployeeForModal.reportsToId)?.lastName}`
                    : 'Board of Directors'}
                </span>
                <span className="text-[11px] text-slate-500 block">
                  {selectedEmployeeForModal.reportsToId
                    ? employeeMap.get(selectedEmployeeForModal.reportsToId)?.opecPosition || 'Manager'
                    : 'Root Executive'}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Subordinates</span>
              <p className="text-slate-700 dark:text-slate-300">
                This employee supervises <strong>{directReportsCountMap.get(selectedEmployeeForModal.id) || 0} direct team members</strong>.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => {
                  const emp = selectedEmployeeForModal;
                  setSelectedEmployeeForModal(null);
                  setReassignModalEmployee(emp);
                  setNewSupervisorId(emp.reportsToId || '');
                }}
                className="px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg cursor-pointer"
              >
                Change Reporting Manager
              </button>
              <button
                onClick={() => setSelectedEmployeeForModal(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
