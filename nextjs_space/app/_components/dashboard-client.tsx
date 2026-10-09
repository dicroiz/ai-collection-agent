"use client"

import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import {
  UserPlus,
  Phone,
  MessageSquare,
  RefreshCw,
  Loader2,
  Users,
  DollarSign,
  Calendar,
  Hash,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Debtor {
  id: string
  name: string
  phoneNumber: string
  debtAmount: number
  dueDate: string
  status: string
  createdAt: string
  _count?: { interactions: number }
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  new: { label: 'New', className: 'bg-slate-500/20 text-slate-300' },
  contacted: { label: 'Contacted', className: 'bg-blue-500/20 text-blue-300' },
  in_negotiation: { label: 'In Negotiation', className: 'bg-yellow-500/20 text-yellow-300' },
  resolved: { label: 'Resolved', className: 'bg-green-500/20 text-green-300' },
}

export function DashboardClient() {
  const [debtors, setDebtors] = useState<Debtor[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<Record<string, string>>({})

  // Form state
  const [formName, setFormName] = useState('')
  const [formPhone, setFormPhone] = useState('')
  const [formAmount, setFormAmount] = useState('')
  const [formDate, setFormDate] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchDebtors = useCallback(async () => {
    try {
      const res = await fetch('/api/debtors')
      const data = await res.json()
      setDebtors(data?.debtors ?? [])
    } catch (err: any) {
      console.error('Failed to fetch debtors:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDebtors()
  }, [fetchDebtors])

  const handleSaveDebtor = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName || !formPhone || !formAmount || !formDate) {
      toast.error('All fields are required')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/debtors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          phoneNumber: formPhone,
          debtAmount: parseFloat(formAmount),
          dueDate: formDate,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error ?? 'Failed to save')
      toast.success(`Debtor "${formName}" saved`)
      setFormName('')
      setFormPhone('')
      setFormAmount('')
      setFormDate('')
      fetchDebtors()
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to save debtor')
    } finally {
      setSaving(false)
    }
  }

  const handleWhatsApp = async (debtor: Debtor) => {
    setActionLoading((prev) => ({ ...(prev ?? {}), [debtor.id]: 'whatsapp' }))
    try {
      const res = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ debtorId: debtor.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error ?? 'Failed')
      if (data?.mock) {
        toast.info('Demo mode: WhatsApp message logged (API not configured)')
      } else {
        toast.success('WhatsApp message sent!')
      }
      fetchDebtors()
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to send WhatsApp')
    } finally {
      setActionLoading((prev) => {
        const copy = { ...(prev ?? {}) }
        delete copy[debtor.id]
        return copy
      })
    }
  }

  const handleCall = async (debtor: Debtor) => {
    setActionLoading((prev) => ({ ...(prev ?? {}), [debtor.id]: 'call' }))
    try {
      const res = await fetch('/api/calls/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ debtorId: debtor.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error ?? 'Failed')
      if (data?.mock) {
        toast.info('Demo mode: Voice call logged (API not configured)')
      } else {
        toast.success('Outbound call initiated!')
      }
      fetchDebtors()
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to trigger call')
    } finally {
      setActionLoading((prev) => {
        const copy = { ...(prev ?? {}) }
        delete copy[debtor.id]
        return copy
      })
    }
  }

  const formatCurrency = (val: number) => {
    return `R$ ${(val ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const formatDate = (val: string) => {
    try {
      return new Date(val).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC',
      })
    } catch {
      return val ?? ''
    }
  }

  return (
    <div className="space-y-8">
      {/* Add Debtor Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="rounded-xl bg-card p-6" style={{ boxShadow: 'var(--shadow-md)' }}>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold font-display">
            <UserPlus className="h-5 w-5 text-primary" />
            Add New Debtor
          </h2>
          <form onSubmit={handleSaveDebtor} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Users className="h-3.5 w-3.5" /> Full Name
              </label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="João Silva"
                className="w-full rounded-lg border border-input bg-secondary/50 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Phone className="h-3.5 w-3.5" /> Phone (+55)
              </label>
              <input
                type="text"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                placeholder="+5511999999999"
                className="w-full rounded-lg border border-input bg-secondary/50 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <DollarSign className="h-3.5 w-3.5" /> Debt Amount (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
                placeholder="1500.00"
                className="w-full rounded-lg border border-input bg-secondary/50 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" /> Due Date
              </label>
              <input
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="w-full rounded-lg border border-input bg-secondary/50 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={saving}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                Save Debtor
              </button>
            </div>
          </form>
        </div>
      </motion.div>

      {/* Debtor Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
      >
        <div className="rounded-xl bg-card" style={{ boxShadow: 'var(--shadow-md)' }}>
          <div className="flex items-center justify-between border-b border-border/50 p-5">
            <h2 className="flex items-center gap-2 text-lg font-semibold font-display">
              <Hash className="h-5 w-5 text-primary" />
              Debtors ({debtors?.length ?? 0})
            </h2>
            <button
              onClick={fetchDebtors}
              className="flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground transition-colors hover:bg-secondary/80"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (debtors?.length ?? 0) === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              <Users className="mx-auto mb-3 h-10 w-10 opacity-40" />
              <p className="text-sm">No debtors yet. Add one above to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/30 text-left">
                    <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Name</th>
                    <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Phone</th>
                    <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Debt Amount</th>
                    <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Due Date</th>
                    <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</th>
                    <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {(debtors ?? []).map((debtor: Debtor, idx: number) => {
                      const statusCfg = STATUS_CONFIG[debtor?.status ?? 'new'] ?? STATUS_CONFIG.new
                      const isActionPending = !!actionLoading?.[debtor.id]
                      return (
                        <motion.tr
                          key={debtor.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.03 }}
                          className="border-b border-border/20 transition-colors hover:bg-muted/30"
                        >
                          <td className="px-5 py-3.5 text-sm font-medium">{debtor?.name ?? ''}</td>
                          <td className="px-5 py-3.5 font-mono text-sm text-muted-foreground">{debtor?.phoneNumber ?? ''}</td>
                          <td className="px-5 py-3.5 font-mono text-sm font-medium text-green-400">
                            {formatCurrency(debtor?.debtAmount ?? 0)}
                          </td>
                          <td className="px-5 py-3.5 text-sm text-muted-foreground">{formatDate(debtor?.dueDate ?? '')}</td>
                          <td className="px-5 py-3.5">
                            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusCfg?.className ?? ''}`}>
                              {statusCfg?.label ?? 'Unknown'}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleWhatsApp(debtor)}
                                disabled={isActionPending}
                                className="flex items-center gap-1.5 rounded-lg bg-green-600/20 px-3 py-1.5 text-xs font-medium text-green-400 transition-all hover:bg-green-600/30 disabled:opacity-50"
                              >
                                {actionLoading?.[debtor.id] === 'whatsapp' ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <MessageSquare className="h-3.5 w-3.5" />
                                )}
                                WhatsApp
                              </button>
                              <button
                                onClick={() => handleCall(debtor)}
                                disabled={isActionPending}
                                className="flex items-center gap-1.5 rounded-lg bg-blue-600/20 px-3 py-1.5 text-xs font-medium text-blue-400 transition-all hover:bg-blue-600/30 disabled:opacity-50"
                              >
                                {actionLoading?.[debtor.id] === 'call' ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Phone className="h-3.5 w-3.5" />
                                )}
                                Call
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      )
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
