import { useState } from 'react'
import { LoadingSpinner } from '@/components/common'
import type { ParseResult, ExtractedRule } from '@/types'

// Mocked document parsing results
const mockParseResults: Record<string, ParseResult> = {
  'policy.pdf': {
    id: 'parse-1',
    fileName: 'policy.pdf',
    fileType: 'pdf',
    rules: [
      { id: 'r1', type: 'rest-period', description: 'Minimum rest between shifts', value: '11 hours', confidence: 0.95, source: 'Page 3, Section 2.1' },
      { id: 'r2', type: 'max-hours', description: 'Maximum weekly hours', value: '48 hours', confidence: 0.92, source: 'Page 5, Section 3.2' },
      { id: 'r3', type: 'consecutive-days', description: 'Maximum consecutive working days', value: '6 days', confidence: 0.88, source: 'Page 6, Section 3.4' },
    ],
    overallConfidence: 0.92,
    warnings: [],
    summary: 'Standard working time regulations document with 3 extractable rules.',
    parsedAt: new Date().toISOString(),
  },
  'schedule.docx': {
    id: 'parse-2',
    fileName: 'schedule.docx',
    fileType: 'docx',
    rules: [
      { id: 'r4', type: 'shift-pattern', description: 'Standard rotation pattern', value: '3-week cycle', confidence: 0.85, source: 'Table 1' },
      { id: 'r5', type: 'weekend-rotation', description: 'Weekend shift distribution', value: 'Every 3rd weekend', confidence: 0.78, source: 'Section 4' },
    ],
    overallConfidence: 0.82,
    warnings: ['Low confidence on weekend rotation rule - manual review recommended'],
    summary: 'Shift scheduling document with rotation patterns.',
    parsedAt: new Date().toISOString(),
  },
}

const DocumentUploadPage = () => {
  const [uploading, setUploading] = useState(false)
  const [parseResult, setParseResult] = useState<ParseResult | null>(null)
  const [uploadHistory, setUploadHistory] = useState<ParseResult[]>([])
  const [selectedRules, setSelectedRules] = useState<Set<string>>(new Set())

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    // Simulate parsing delay
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Return mocked result based on file extension
    const ext = file.name.split('.').pop()?.toLowerCase()
    const mockKey = ext === 'pdf' ? 'policy.pdf' : 'schedule.docx'
    const result = { ...mockParseResults[mockKey], fileName: file.name, id: `parse-${Date.now()}` }
    
    setParseResult(result)
    setUploadHistory(prev => [result, ...prev])
    setUploading(false)
  }

  const toggleRule = (ruleId: string) => {
    setSelectedRules(prev => {
      const next = new Set(prev)
      if (next.has(ruleId)) next.delete(ruleId)
      else next.add(ruleId)
      return next
    })
  }

  const createRotationRules = () => {
    alert(`Creating ${selectedRules.size} rotation rules from selected extractions`)
    setSelectedRules(new Set())
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-600'
    if (confidence >= 0.7) return 'text-amber-600'
    return 'text-red-600'
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Document Upload & Parsing</h1>

      <div className="bg-white dark:bg-gray-800 rounded shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Upload Document</h2>
        <p className="text-sm text-gray-500 mb-4">
          Upload policy documents, schedules, or rule files. Supported formats: PDF, DOCX, TXT, images.
        </p>
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
          <input
            type="file"
            onChange={handleFileUpload}
            accept=".pdf,.docx,.doc,.txt,.png,.jpg,.jpeg"
            className="hidden"
            id="file-upload"
            disabled={uploading}
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            {uploading ? (
              <div className="flex flex-col items-center">
                <LoadingSpinner />
                <span className="mt-2 text-sm text-gray-500">Parsing document...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <svg className="w-12 h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span className="text-sm text-gray-500">Click to upload or drag and drop</span>
                <span className="text-xs text-gray-400 mt-1">PDF, DOCX, TXT, or images up to 10MB</span>
              </div>
            )}
          </label>
        </div>
      </div>

      {parseResult && (
        <div className="bg-white dark:bg-gray-800 rounded shadow p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-lg font-semibold">{parseResult.fileName}</h2>
              <p className="text-sm text-gray-500">{parseResult.summary}</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Overall Confidence</div>
              <div className={`text-2xl font-bold ${getConfidenceColor(parseResult.overallConfidence)}`}>
                {Math.round(parseResult.overallConfidence * 100)}%
              </div>
            </div>
          </div>

          {parseResult.warnings.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded p-3 mb-4">
              <div className="text-sm text-amber-800 dark:text-amber-200">
                {parseResult.warnings.map((w, i) => <div key={i}>⚠️ {w}</div>)}
              </div>
            </div>
          )}

          <h3 className="font-medium mb-2">Extracted Rules</h3>
          <div className="space-y-2">
            {parseResult.rules.map((rule: ExtractedRule) => (
              <div key={rule.id} className="flex items-center gap-3 p-3 border rounded dark:border-gray-700">
                <input
                  type="checkbox"
                  checked={selectedRules.has(rule.id)}
                  onChange={() => toggleRule(rule.id)}
                  className="h-4 w-4"
                />
                <div className="flex-1">
                  <div className="font-medium">{rule.description}</div>
                  <div className="text-sm text-gray-500">
                    Type: {rule.type} | Value: {rule.value} | Source: {rule.source}
                  </div>
                </div>
                <div className={`text-sm font-medium ${getConfidenceColor(rule.confidence)}`}>
                  {Math.round(rule.confidence * 100)}%
                </div>
              </div>
            ))}
          </div>

          {selectedRules.size > 0 && (
            <button onClick={createRotationRules} className="mt-4 px-4 py-2 bg-primary text-white rounded">
              Create {selectedRules.size} Rotation Rule(s)
            </button>
          )}
        </div>
      )}

      {uploadHistory.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Upload History</h2>
          <div className="space-y-2">
            {uploadHistory.map(result => (
              <div key={result.id} className="flex justify-between items-center p-3 border rounded dark:border-gray-700">
                <div>
                  <div className="font-medium">{result.fileName}</div>
                  <div className="text-sm text-gray-500">{result.rules.length} rules extracted</div>
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(result.parsedAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default DocumentUploadPage
