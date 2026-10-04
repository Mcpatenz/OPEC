import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { LoanProduct } from '../../types';
import { formatPHP } from '../../lib/loans/calculator';
import {
  Settings,
  Edit2,
  CheckCircle2,
  DollarSign,
  Shield,
  Layers,
  Save,
  X,
} from 'lucide-react';

export const LoanProductsView: React.FC = () => {
  const { loanProducts, updateLoanProduct } = useApp();
  const [editingProduct, setEditingProduct] = useState<LoanProduct | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    updateLoanProduct(editingProduct);
    setEditingProduct(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900">Loan Products & Policy Engine</h1>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
              OPEC Policy Configurator
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Section 9: Configure maximum amounts, repayment terms, interest calculation formulas, and co-maker service rules.
          </p>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loanProducts.map(prod => (
          <div
            key={prod.id}
            className="bg-white p-5 rounded-xl border border-slate-200 hover:border-amber-400 shadow-xs transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="font-mono text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  {prod.code}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  prod.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                }`}>
                  {prod.active ? 'ACTIVE POLICY' : 'INACTIVE'}
                </span>
              </div>

              <div className="mt-3">
                <h3 className="font-bold text-sm text-slate-900">{prod.name}</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{prod.description}</p>
              </div>

              <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Max Facility Limit:</span>
                  <span className="font-mono font-bold text-slate-900">{formatPHP(prod.maxAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Interest Rate:</span>
                  <span className="font-mono font-bold text-amber-700">{prod.interestRate}% / mo</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Repayment Term:</span>
                  <span className="font-semibold text-slate-800">{prod.minTermMonths} - {prod.maxTermMonths} months</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Processing Fee:</span>
                  <span className="font-mono text-slate-700">{formatPHP(prod.processingFee)}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200">
                  <span className="text-slate-600 font-semibold">Required Co-Makers:</span>
                  <span className="font-bold text-slate-900">
                    {prod.requiredCoMakers > 0
                      ? `${prod.requiredCoMakers} (≥${prod.minServiceYearsCoMaker} yrs)`
                      : 'None (Exempt)'}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-mono">
                {prod.interestMethod}
              </span>
              <button
                onClick={() => setEditingProduct(prod)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-800 hover:text-slate-950 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" />
                Edit Policy
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <form
            onSubmit={handleSave}
            className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">
                Configure Policy: {editingProduct.name}
              </h3>
              <button type="button" onClick={() => setEditingProduct(null)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Max Amount (PHP) *</label>
                <input
                  type="number"
                  required
                  value={editingProduct.maxAmount}
                  onChange={e => setEditingProduct({ ...editingProduct, maxAmount: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono font-bold"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Interest Rate (% / month) *</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={editingProduct.interestRate}
                  onChange={e => setEditingProduct({ ...editingProduct, interestRate: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Max Term (Months) *</label>
                <input
                  type="number"
                  required
                  value={editingProduct.maxTermMonths}
                  onChange={e => setEditingProduct({ ...editingProduct, maxTermMonths: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Processing Fee (PHP) *</label>
                <input
                  type="number"
                  required
                  value={editingProduct.processingFee}
                  onChange={e => setEditingProduct({ ...editingProduct, processingFee: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Required Co-Makers</label>
                <input
                  type="number"
                  value={editingProduct.requiredCoMakers}
                  onChange={e => setEditingProduct({ ...editingProduct, requiredCoMakers: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Co-Maker Min Service (Years)</label>
                <input
                  type="number"
                  value={editingProduct.minServiceYearsCoMaker}
                  onChange={e => setEditingProduct({ ...editingProduct, minServiceYearsCoMaker: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Interest Calculation Formula</label>
              <select
                value={editingProduct.interestMethod}
                onChange={e => setEditingProduct({ ...editingProduct, interestMethod: e.target.value as any })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
              >
                <option value="FLAT_RATE">FLAT_RATE (1.5% × Principal × Months)</option>
                <option value="CUSTOM_OPEC_FORMULA">CUSTOM_OPEC_FORMULA (Approved May 2025 Standard)</option>
                <option value="REDUCING_BALANCE">REDUCING_BALANCE (Declining balance on unpaid principal)</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="px-4 py-2 font-semibold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg shadow-sm"
              >
                Save Policy Parameters
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
