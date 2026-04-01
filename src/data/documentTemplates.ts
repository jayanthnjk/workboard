import type { ParseResult } from '@/types'

// Document extraction templates for mocked document parsing
export const documentTemplates: Record<string, ParseResult> = {
  // PDF Policy Documents
  'working-time-policy': {
    id: 'template-1',
    fileName: 'working_time_policy.pdf',
    fileType: 'pdf',
    rules: [
      {
        id: 'wtp-1',
        type: 'rest-period',
        description: 'Minimum daily rest period',
        value: '11 hours',
        confidence: 0.95,
        source: 'Section 2.1 - Daily Rest Requirements',
      },
      {
        id: 'wtp-2',
        type: 'weekly-rest',
        description: 'Minimum weekly rest period',
        value: '24 hours',
        confidence: 0.93,
        source: 'Section 2.2 - Weekly Rest Requirements',
      },
      {
        id: 'wtp-3',
        type: 'max-weekly-hours',
        description: 'Maximum average weekly working hours',
        value: '48 hours',
        confidence: 0.97,
        source: 'Section 3.1 - Working Time Limits',
      },
      {
        id: 'wtp-4',
        type: 'night-work-limit',
        description: 'Maximum night work hours per 24-hour period',
        value: '8 hours',
        confidence: 0.91,
        source: 'Section 4.1 - Night Work Provisions',
      },
    ],
    overallConfidence: 0.94,
    warnings: [],
    summary: 'Standard working time regulations document compliant with EU Working Time Directive.',
    parsedAt: new Date().toISOString(),
  },

  // DOCX Schedule Templates
  'shift-rotation-schedule': {
    id: 'template-2',
    fileName: 'shift_rotation_schedule.docx',
    fileType: 'docx',
    rules: [
      {
        id: 'srs-1',
        type: 'rotation-pattern',
        description: 'Standard 3-week rotation cycle',
        value: 'Morning → Afternoon → Night',
        confidence: 0.88,
        source: 'Table 1 - Rotation Schedule',
      },
      {
        id: 'srs-2',
        type: 'weekend-rotation',
        description: 'Weekend shift distribution',
        value: 'Every 3rd weekend on duty',
        confidence: 0.82,
        source: 'Section 3 - Weekend Coverage',
      },
      {
        id: 'srs-3',
        type: 'consecutive-days',
        description: 'Maximum consecutive working days',
        value: '6 days',
        confidence: 0.90,
        source: 'Section 4 - Consecutive Work Limits',
      },
    ],
    overallConfidence: 0.87,
    warnings: ['Weekend rotation rule has lower confidence - manual verification recommended'],
    summary: 'Shift rotation schedule with 3-week cycle pattern.',
    parsedAt: new Date().toISOString(),
  },

  // TXT Configuration Files
  'scheduling-rules-config': {
    id: 'template-3',
    fileName: 'scheduling_rules.txt',
    fileType: 'txt',
    rules: [
      {
        id: 'src-1',
        type: 'skill-requirement',
        description: 'Forklift certification required for warehouse shifts',
        value: 'forklift-certified',
        confidence: 0.96,
        source: 'Line 15 - Skill Requirements',
      },
      {
        id: 'src-2',
        type: 'minimum-staff',
        description: 'Minimum staff per shift',
        value: '3 employees',
        confidence: 0.94,
        source: 'Line 22 - Staffing Levels',
      },
      {
        id: 'src-3',
        type: 'overtime-threshold',
        description: 'Overtime trigger threshold',
        value: '40 hours/week',
        confidence: 0.98,
        source: 'Line 30 - Overtime Rules',
      },
    ],
    overallConfidence: 0.96,
    warnings: [],
    summary: 'Plain text configuration file with scheduling rules.',
    parsedAt: new Date().toISOString(),
  },

  // Image-based Documents (OCR simulation)
  'handwritten-schedule': {
    id: 'template-4',
    fileName: 'schedule_scan.jpg',
    fileType: 'image',
    rules: [
      {
        id: 'hs-1',
        type: 'shift-assignment',
        description: 'Morning shift assignment',
        value: 'Team A - 06:00-14:00',
        confidence: 0.72,
        source: 'OCR - Top section',
      },
      {
        id: 'hs-2',
        type: 'shift-assignment',
        description: 'Afternoon shift assignment',
        value: 'Team B - 14:00-22:00',
        confidence: 0.68,
        source: 'OCR - Middle section',
      },
    ],
    overallConfidence: 0.70,
    warnings: [
      'Low confidence due to image quality - manual review strongly recommended',
      'Some text could not be recognized clearly',
    ],
    summary: 'Scanned schedule image with OCR extraction. Quality affects accuracy.',
    parsedAt: new Date().toISOString(),
  },

  // Multi-language Support Template
  'international-policy': {
    id: 'template-5',
    fileName: 'international_policy.pdf',
    fileType: 'pdf',
    rules: [
      {
        id: 'ip-1',
        type: 'rest-period',
        description: 'Minimum rest between shifts (Mindestens Ruhezeit)',
        value: '11 hours',
        confidence: 0.89,
        source: 'Page 5 - Arbeitszeit (Working Time)',
      },
      {
        id: 'ip-2',
        type: 'annual-leave',
        description: 'Minimum annual leave entitlement (Jahresurlaub)',
        value: '20 days',
        confidence: 0.92,
        source: 'Page 8 - Urlaubsanspruch (Leave Entitlement)',
      },
    ],
    overallConfidence: 0.90,
    warnings: ['Document contains multiple languages - German and English detected'],
    summary: 'International policy document with German and English content.',
    parsedAt: new Date().toISOString(),
  },

  // Complex Rules with Ambiguity
  'complex-scheduling-policy': {
    id: 'template-6',
    fileName: 'complex_policy.pdf',
    fileType: 'pdf',
    rules: [
      {
        id: 'csp-1',
        type: 'conditional-rule',
        description: 'Holiday premium pay condition',
        value: '1.5x for public holidays, 2x for Christmas/New Year',
        confidence: 0.85,
        source: 'Section 5.2 - Holiday Compensation',
      },
      {
        id: 'csp-2',
        type: 'seniority-rule',
        description: 'Shift preference by seniority',
        value: 'Employees with 5+ years get first choice',
        confidence: 0.78,
        source: 'Section 6.1 - Seniority Benefits',
      },
      {
        id: 'csp-3',
        type: 'ambiguous-rule',
        description: 'Flexible working arrangement',
        value: 'Subject to manager approval',
        confidence: 0.65,
        source: 'Section 7 - Flexible Working',
      },
    ],
    overallConfidence: 0.76,
    warnings: [
      'Rule "Flexible working arrangement" is ambiguous and requires clarification',
      'Seniority rule may conflict with skill-based assignment rules',
    ],
    summary: 'Complex policy document with conditional and potentially conflicting rules.',
    parsedAt: new Date().toISOString(),
  },
}

// Helper function to match uploaded file to template
export const matchFileToTemplate = (fileName: string, _fileType: string): ParseResult | null => {
  const ext = fileName.split('.').pop()?.toLowerCase()
  
  // Match by file type and name patterns
  if (ext === 'pdf') {
    if (fileName.toLowerCase().includes('policy') || fileName.toLowerCase().includes('regulation')) {
      return { ...documentTemplates['working-time-policy'], fileName }
    }
    if (fileName.toLowerCase().includes('complex') || fileName.toLowerCase().includes('advanced')) {
      return { ...documentTemplates['complex-scheduling-policy'], fileName }
    }
    if (fileName.toLowerCase().includes('international') || fileName.toLowerCase().includes('global')) {
      return { ...documentTemplates['international-policy'], fileName }
    }
    return { ...documentTemplates['working-time-policy'], fileName }
  }
  
  if (ext === 'docx' || ext === 'doc') {
    return { ...documentTemplates['shift-rotation-schedule'], fileName }
  }
  
  if (ext === 'txt') {
    return { ...documentTemplates['scheduling-rules-config'], fileName }
  }
  
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(ext || '')) {
    return { ...documentTemplates['handwritten-schedule'], fileName }
  }
  
  return null
}

export default documentTemplates
