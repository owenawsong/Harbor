import React, { useState } from 'react'
import { Download, Upload, Trash2, Check } from 'lucide-react'
import { exportAllData, importData, downloadExportAsFile, parseImportFile, getExportFileName } from '../../shared/dataManager'

interface Props {
  onBack: () => void
}

export default function DataManager({ onBack }: Props) {
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [overwrite, setOverwrite] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleExport = async () => {
    try {
      setExporting(true)
      const data = await exportAllData()
      downloadExportAsFile(data)
      setMessage({ type: 'success', text: `✓ Data exported as ${getExportFileName()}` })
    } catch (error) {
      setMessage({ type: 'error', text: 'Export failed. Please try again.' })
    } finally {
      setExporting(false)
    }
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setImporting(true)
      const parsed = await parseImportFile(file)

      if (!parsed.success) {
        setMessage({ type: 'error', text: `Import failed: ${parsed.error}` })
        return
      }

      const result = await importData(parsed.data!, { overwrite })
      if (result.success) {
        setMessage({ type: 'success', text: result.message })
        // Refresh the page to load new data
        setTimeout(() => window.location.reload(), 1500)
      } else {
        setMessage({ type: 'error', text: result.message })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Import failed. Check file format and try again.' })
    } finally {
      setImporting(false)
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold" style={{ color: 'rgb(var(--harbor-text))' }}>Data Management</h2>
        <button
          onClick={onBack}
          className="text-sm px-3 py-1 rounded hover:bg-opacity-10 hover:bg-white transition"
          style={{ color: 'rgb(var(--harbor-text-faint))' }}
        >
          ← Back
        </button>
      </div>

      {message && (
        <div
          className={`p-4 rounded-lg mb-6 flex items-center gap-3 ${
            message.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
              : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
          }`}
        >
          {message.type === 'success' ? <Check className="w-5 h-5" /> : <span>⚠️</span>}
          {message.text}
        </div>
      )}

      <div className="space-y-6">
        {/* Export Section */}
        <div className="border rounded-lg p-6" style={{ borderColor: 'rgb(var(--harbor-border))', background: 'rgb(var(--harbor-surface))' }}>
          <h3 className="font-semibold mb-2" style={{ color: 'rgb(var(--harbor-text))' }}>
            📥 Export All Data
          </h3>
          <p className="text-sm mb-4" style={{ color: 'rgb(var(--harbor-text-faint))' }}>
            Download a backup of your settings, conversations, and preferences. This file is safe to share — it doesn't contain API keys.
          </p>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              color: '#fff',
              cursor: exporting ? 'not-allowed' : 'pointer',
            }}
          >
            <Download className="w-4 h-4" />
            {exporting ? 'Exporting...' : 'Export Backup'}
          </button>
          <p className="text-xs mt-3" style={{ color: 'rgb(var(--harbor-text-faint))' }}>
            File will be saved as: <code>{getExportFileName()}</code>
          </p>
        </div>

        {/* Import Section */}
        <div className="border rounded-lg p-6" style={{ borderColor: 'rgb(var(--harbor-border))', background: 'rgb(var(--harbor-surface))' }}>
          <h3 className="font-semibold mb-2" style={{ color: 'rgb(var(--harbor-text))' }}>
            📤 Import Data
          </h3>
          <p className="text-sm mb-4" style={{ color: 'rgb(var(--harbor-text-faint))' }}>
            Restore a previously exported backup. Choose whether to merge with existing data or replace everything.
          </p>

          <div className="mb-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={overwrite}
                onChange={(e) => setOverwrite(e.target.checked)}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm" style={{ color: 'rgb(var(--harbor-text))' }}>
                Replace existing data (overwrite mode)
              </span>
            </label>
            <p className="text-xs mt-2 ml-7" style={{ color: 'rgb(var(--harbor-text-faint))' }}>
              {overwrite ? 'All current data will be replaced' : 'New data will be merged with existing data'}
            </p>
          </div>

          <button
            onClick={handleImportClick}
            disabled={importing}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition disabled:opacity-50"
            style={{
              background: 'rgba(79, 70, 229, 0.2)',
              border: '1px solid rgba(79, 70, 229, 0.3)',
              color: '#4f46e5',
              cursor: importing ? 'not-allowed' : 'pointer',
            }}
          >
            <Upload className="w-4 h-4" />
            {importing ? 'Importing...' : 'Select Backup File'}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImportFile}
            className="hidden"
            disabled={importing}
          />

          <p className="text-xs mt-3" style={{ color: 'rgb(var(--harbor-text-faint))' }}>
            Select a JSON backup file (harbor-backup-*.json) to restore
          </p>
        </div>

        {/* Storage Info */}
        <div className="border rounded-lg p-6" style={{ borderColor: 'rgb(var(--harbor-border))', background: 'rgba(79, 70, 229, 0.05)' }}>
          <h3 className="font-semibold mb-2" style={{ color: 'rgb(var(--harbor-text))' }}>
            💾 Storage
          </h3>
          <p className="text-sm" style={{ color: 'rgb(var(--harbor-text-faint))' }}>
            Harbor stores all your data locally in your browser. Your conversations, settings, and bookmarks are never sent to our servers.
          </p>
        </div>

        {/* Clear Data */}
        <div className="border rounded-lg p-6 border-red-200 dark:border-red-800" style={{ background: 'rgba(239, 68, 68, 0.05)' }}>
          <h3 className="font-semibold mb-2 text-red-700 dark:text-red-300">⚠️ Clear All Data</h3>
          <p className="text-sm mb-4" style={{ color: 'rgb(var(--harbor-text-faint))' }}>
            This will permanently delete all your Harbor data. This action cannot be undone.
          </p>
          <button
            onClick={() => {
              if (confirm('Are you sure? This will permanently delete all Harbor data.')) {
                chrome.storage.local.clear()
                setMessage({ type: 'success', text: 'All data cleared. Reloading...' })
                setTimeout(() => window.location.reload(), 1500)
              }
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition hover:opacity-90"
            style={{
              background: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#dc2626',
              cursor: 'pointer',
            }}
          >
            <Trash2 className="w-4 h-4" />
            Clear All Data
          </button>
        </div>
      </div>
    </div>
  )
}
