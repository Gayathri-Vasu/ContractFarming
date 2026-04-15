import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const statusLabel = (raw) => {
  const s = (raw || '').toString().toLowerCase()
  if (s === 'active') return { text: 'Active', cls: 'bg-green-100 text-green-800' }
  if (s === 'completed') return { text: 'Completed', cls: 'bg-blue-100 text-blue-800' }
  if (s === 'signed' || s === 'partially signed')
    return { text: 'Partially Signed', cls: 'bg-yellow-100 text-yellow-800' }
  if (s === 'pending signature')
    return { text: 'Pending Signature', cls: 'bg-gray-100 text-gray-800' }
  return { text: 'Pending', cls: 'bg-gray-100 text-gray-800' }
}

export default function DigiContractTable({ limit = 5 }) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    let mounted = true
    const load = async () => {
      if (!user) return
      setLoading(true)
      try {
        const userId = user._id || user.id
        const res = await axios.get(`/api/digicontracts/user/${userId}`)
        if (!mounted) return
        setItems(res.data?.data || [])
      } catch {
        setItems([])
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [user])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return (items || []).filter((c) => {
      const s = (c.status || '').toString().toLowerCase()
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'pending' && (s === 'pending' || s === 'pending signature')) ||
        (statusFilter === 'partial' && (s === 'signed' || s === 'partially signed')) ||
        (statusFilter === 'active' && s === 'active') ||
        (statusFilter === 'completed' && s === 'completed')
      if (!matchesStatus) return false
      if (!term) return true
      const id = (c.digiContractId || c._id || '').toString().toLowerCase()
      const crop = (c.product?.cropName || '').toString().toLowerCase()
      return id.includes(term) || crop.includes(term)
    })
  }, [items, search, statusFilter])

  const list = limit ? filtered.slice(0, limit) : filtered

  return (
    <div className="bg-white shadow-md border border-gray-200 rounded-md p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Digi Contracts</h3>
        <div className="flex items-center gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ID or Crop"
            className="input-field w-56"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field"
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="partial">Partially Signed</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
          </select>
          <Link to="/digi-contracts" className="btn-secondary">
            View All
          </Link>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                DigiContract ID
              </th>
              <th className="text-left px-4 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Crop
              </th>
              <th className="text-left px-4 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Total Amount
              </th>
              <th className="text-left px-4 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Status
              </th>
              <th className="text-left px-4 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                View
              </th>
              <th className="text-left px-4 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Download
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" className="px-6 py-10 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : list.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-10 text-center text-gray-500">
                  No contracts found
                </td>
              </tr>
            ) : (
              list.map((c) => {
                const label = statusLabel(c.status)
                const total =
                  c.product?.totalAmount ??
                  (typeof c.totalAmount === 'number'
                    ? c.totalAmount
                    : (Number(c.quantity) || 0) * (Number(c.pricePerUnit) || 0))
                return (
                  <tr key={c._id} className="border-t">
                    <td className="px-4 py-3 font-mono text-sm">
                      {c.digiContractId || c._id}
                    </td>
                    <td className="px-4 py-3">
                      {c.product?.cropName || c.crop || '—'}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900">
                      ₹{total.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${label.cls}`}>
                        {label.text}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={c.referenceContractId ? `/contracts/${c.referenceContractId}/digi` : '/digi-contracts'}
                        className="btn-primary"
                      >
                        View
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={`/api/digicontracts/${c._id}/pdf`}
                        className="btn-secondary"
                        title="Download PDF"
                      >
                        Download
                      </a>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

