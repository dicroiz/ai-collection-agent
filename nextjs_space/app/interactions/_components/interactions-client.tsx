"use client"

import { useEffect, useState, useCallback } from 'react'
import {
  Search,
  RefreshCw,
  Loader2,
  MessageSquare,
  Phone,
  ArrowDownLeft,
  ArrowUpRight,
  Inbox,
  Filter,
} from 'lucide-react'
import { motion } from 'framer-motion'

interface Interaction {
  id: string
  channel: string
  direction: string
  content: string | null
  transcript: string | null
  outcome: string | null
  createdAt: string
  debtor?: {
    name: string
    phoneNumber: string
  } | null
}

export function InteractionsClient() {
  const [interactions, setInteractions] = useState<Interaction[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [channelFilter, setChannelFilter] = useState('all')

  const fetchInteractions = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (channelFilter !== 'all') params.set('channel', channelFilter)
      if (search) params.set('search', search)
      const res = await fetch(`/api/interactions?${params.toString()}`)
      const data = await res.json()
      setInteractions(data?.interactions ?? [])
    } catch (err: any) {
      console.error('Failed to fetch interactions:', err)
    } finally {
      setLoading(false)
    }
  }, [channelFilter, search])

  useEffect(() => {
    fetchInteractions()
    const interval = setInterval(fetchInteractions, 30000)
    return () => clearInterval(interval)
  }, [fetchInteractions])

  const formatTimestamp = (val: string) => {
    try {
      return new Date(val).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'UTC',
      })
    } catch {
      return val ?? ''
    }
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by debtor name..."
            className="w-full rounded-lg border border-input bg-secondary/50 py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 sm:w-72"
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Filter className="h-3.5 w-3.5" />
            Channel:
          </div>
          {['all', 'whatsapp', 'voice'].map((ch) => (
            <button
              key={ch}
              onClick={() => setChannelFilter(ch)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                channelFilter === ch
                  ? 'bg-primary/20 text-primary'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              {ch === 'all' ? 'All' : ch === 'whatsapp' ? 'WhatsApp' : 'Voice'}
            </button>
          ))}
          <button
            onClick={fetchInteractions}
            className="ml-2 flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground transition-colors hover:bg-secondary/80"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
        </div>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="rounded-xl bg-card" style={{ boxShadow: 'var(--shadow-md)' }}>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (interactions?.length ?? 0) === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              <Inbox className="mx-auto mb-3 h-10 w-10 opacity-40" />
              <p className="text-sm">No interactions found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/30 text-left">
                    <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Timestamp</th>
                    <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Debtor</th>
                    <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Channel</th>
                    <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Direction</th>
                    <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Content</th>
                    <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Outcome</th>
                  </tr>
                </thead>
                <tbody>
                  {(interactions ?? []).map((item: Interaction, idx: number) => (
                    <motion.tr
                      key={item.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.02 }}
                      className="border-b border-border/20 transition-colors hover:bg-muted/30"
                    >
                      <td className="whitespace-nowrap px-5 py-3 font-mono text-xs text-muted-foreground">
                        {formatTimestamp(item?.createdAt ?? '')}
                      </td>
                      <td className="px-5 py-3 text-sm font-medium">{item?.debtor?.name ?? 'Unknown'}</td>
                      <td className="px-5 py-3">
                        <span className="inline-flex items-center gap-1.5 text-xs">
                          {item?.channel === 'whatsapp' ? (
                            <MessageSquare className="h-3.5 w-3.5 text-green-400" />
                          ) : (
                            <Phone className="h-3.5 w-3.5 text-blue-400" />
                          )}
                          <span className="capitalize">{item?.channel ?? ''}</span>
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="inline-flex items-center gap-1.5 text-xs">
                          {item?.direction === 'inbound' ? (
                            <ArrowDownLeft className="h-3.5 w-3.5 text-yellow-400" />
                          ) : (
                            <ArrowUpRight className="h-3.5 w-3.5 text-primary" />
                          )}
                          <span className="capitalize">{item?.direction ?? ''}</span>
                        </span>
                      </td>
                      <td className="max-w-xs truncate px-5 py-3 text-sm text-muted-foreground">
                        {item?.transcript ?? item?.content ?? '—'}
                      </td>
                      <td className="px-5 py-3">
                        <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-xs font-medium capitalize text-muted-foreground">
                          {(item?.outcome ?? 'unknown').replace(/_/g, ' ')}
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="border-t border-border/30 px-5 py-3 text-xs text-muted-foreground">
            Auto-refreshes every 30 seconds. Showing {interactions?.length ?? 0} interaction{(interactions?.length ?? 0) !== 1 ? 's' : ''}.
          </div>
        </div>
      </motion.div>
    </div>
  )
}
