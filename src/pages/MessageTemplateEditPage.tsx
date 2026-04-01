import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useLanguage } from '@/context/LanguageContext'

type Channel = 'whatsapp' | 'sms' | 'email'
type EventType = 'schedule_update' | 'adhoc_request' | 'location_change' | 'leave_update' | 'rotation_change' | 'guard_duty'

const EVENTS: { id: EventType; label: string }[] = [
  { id: 'schedule_update', label: 'Schedule Update' },
  { id: 'adhoc_request', label: 'Adhoc Request' },
  { id: 'location_change', label: 'Location Change' },
  { id: 'leave_update', label: 'Leave Update' },
  { id: 'rotation_change', label: 'Rotation Change' },
  { id: 'guard_duty', label: 'Guard Duty Alert' },
]

const CHANNELS: { id: Channel; label: string; color: string }[] = [
  { id: 'whatsapp', label: 'WhatsApp', color: '#25D366' },
  { id: 'sms', label: 'SMS', color: '#2563eb' },
  { id: 'email', label: 'Email', color: '#7c3aed' },
]

const FROM_OPTIONS = [
  'KSP WorkBoard <noreply@ksp.gov.in>',
  'CAR Unit Mangaluru <car.mangaluru@ksp.gov.in>',
  'DCP Office <dcp.car@ksp.gov.in>',
]

const VARIABLES = ['{{duty_type}}', '{{location}}', '{{date}}', '{{start_date}}', '{{end_date}}', '{{platoon}}', '{{personnel_name}}', '{{personnel_id}}', '{{status}}', '{{reason}}', '{{approver}}', '{{cycle}}', '{{shift}}', '{{shift_time}}', '{{team_count}}', '{{officer_name}}', '{{request_id}}', '{{leave_type}}', '{{location_code}}']

export default function MessageTemplateEditPage() {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const [params] = useSearchParams()
  const templateId = params.get('id')
  const isNew = !templateId

  const [name, setName] = useState(isNew ? '' : 'Schedule Change Alert')
  const [event, setEvent] = useState<EventType>(isNew ? 'schedule_update' : 'schedule_update')
  const [channels, setChannels] = useState<Channel[]>(isNew ? [] : ['whatsapp', 'sms'])
  const [fromAddress, setFromAddress] = useState(FROM_OPTIONS[0])
  const [customFrom, setCustomFrom] = useState('')
  const [useCustomFrom, setUseCustomFrom] = useState(false)
  const [subject, setSubject] = useState(isNew ? '' : 'Duty Schedule Updated - {{personnel_name}}')
  const [body, setBody] = useState(isNew ? '' : 'Your duty schedule has been updated. New assignment: {{duty_type}} at {{location}} from {{start_date}}. Report to {{location}} by {{shift_time}}.')
  const [whatsappBody, setWhatsappBody] = useState(isNew ? '' : 'Duty Update: {{duty_type}} at {{location}}, {{start_date}}. Report by {{shift_time}}.')
  const [smsBody, setSmsBody] = useState(isNew ? '' : 'KSP: Duty changed to {{duty_type}} at {{location}} from {{start_date}}.')

  const toggleChannel = (ch: Channel) => setChannels(prev => prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch])

  const effectiveFrom = useCustomFrom ? customFrom : fromAddress

  const handleSubmit = () => {
    // In real app, save to dataStore
    navigate('/messaging')
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/messaging')} className="p-2 rounded-lg hover:bg-[var(--color-bg-secondary)] text-[var(--color-text-light)] transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
        </button>
        <div>
          <h1 className="text-lg font-semibold text-[var(--color-text-dark)]">{isNew ? t('new_message_template') : t('edit_template')}</h1>
          <p className="text-xs text-[var(--color-text-light)]">{t('configure_message_content')}</p>
        </div>
      </div>

      {/* Form */}
      <div className="card rounded-xl p-6 space-y-5">
        {/* Template Name */}
        <div>
          <label className="text-[10px] uppercase tracking-wider text-[var(--color-text-light)] font-semibold mb-2 block">{t('template_name')}</label>
          <input value={name} onChange={e => setName(e.target.value)} className="input" placeholder="e.g. Schedule Change Alert" />
        </div>

        {/* Event Type */}
        <div>
          <label className="text-[10px] uppercase tracking-wider text-[var(--color-text-light)] font-semibold mb-2 block">{t('trigger_event')}</label>
          <select value={event} onChange={e => setEvent(e.target.value as EventType)} className="input">
            {EVENTS.map(ev => <option key={ev.id} value={ev.id}>{ev.label}</option>)}
          </select>
        </div>

        {/* Delivery Channels */}
        <div>
          <label className="text-[10px] uppercase tracking-wider text-[var(--color-text-light)] font-semibold mb-2 block">{t('delivery_channels')}</label>
          <div className="flex gap-2">
            {CHANNELS.map(ch => {
              const active = channels.includes(ch.id)
              return (
                <button key={ch.id} onClick={() => toggleChannel(ch.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium transition-all min-h-[44px] ${active ? 'shadow-sm' : 'opacity-40'}`}
                  style={{ background: active ? `${ch.color}12` : 'var(--color-bg-secondary)', color: active ? ch.color : 'var(--color-text-light)', border: active ? `1px solid ${ch.color}30` : '1px solid transparent' }}>
                  <span className={`w-3 h-3 rounded-full border-2 flex items-center justify-center ${active ? '' : 'border-[var(--color-text-light)]'}`} style={active ? { borderColor: ch.color, background: ch.color } : {}}>
                    {active && <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>}
                  </span>
                  {ch.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* From Address */}
        <div>
          <label className="text-[10px] uppercase tracking-wider text-[var(--color-text-light)] font-semibold mb-2 block">{t('from_address')}</label>
          <div className="space-y-2">
            <select value={useCustomFrom ? '__custom__' : fromAddress} onChange={e => { if (e.target.value === '__custom__') { setUseCustomFrom(true) } else { setUseCustomFrom(false); setFromAddress(e.target.value) } }} className="input">
              {FROM_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              <option value="__custom__">Enter custom address...</option>
            </select>
            {useCustomFrom && (
              <input value={customFrom} onChange={e => setCustomFrom(e.target.value)} className="input" placeholder="Custom sender address or phone number..." />
            )}
            <p className="text-[9px] text-[var(--color-text-light)]">Used as sender for email, WhatsApp business number, or SMS sender ID. Current: {effectiveFrom}</p>
          </div>
        </div>
      </div>

      {/* Channel-specific content */}
      {channels.length > 0 && (
        <div className="card rounded-xl p-6 space-y-5">
          <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-light)] font-semibold">{t('message_content')}</p>

          {channels.includes('email') && (
            <div>
              <label className="text-[11px] font-medium text-[var(--color-text-medium)] mb-1.5 flex items-center gap-2 block">
                <span className="w-2 h-2 rounded-full bg-[#7c3aed]" /> {t('email_subject')}
              </label>
              <input value={subject} onChange={e => setSubject(e.target.value)} className="input" placeholder="Email subject line with {{variables}}..." />
            </div>
          )}

          {channels.includes('email') && (
            <div>
              <label className="text-[11px] font-medium text-[var(--color-text-medium)] mb-1.5 flex items-center gap-2 block">
                <span className="w-2 h-2 rounded-full bg-[#7c3aed]" /> {t('email_body')}
              </label>
              <textarea value={body} onChange={e => setBody(e.target.value)} rows={4}
                className="w-full px-3 py-2.5 text-sm rounded-lg bg-[var(--color-bg-secondary)] text-[var(--color-text-dark)] focus:outline-none focus:ring-2 focus:ring-[#000080]/10 resize-none" placeholder="Email body..." />
            </div>
          )}

          {channels.includes('whatsapp') && (
            <div>
              <label className="text-[11px] font-medium text-[var(--color-text-medium)] mb-1.5 flex items-center gap-2 block">
                <span className="w-2 h-2 rounded-full bg-[#25D366]" /> {t('whatsapp_message')}
              </label>
              <textarea value={whatsappBody} onChange={e => setWhatsappBody(e.target.value)} rows={3}
                className="w-full px-3 py-2.5 text-sm rounded-lg bg-[var(--color-bg-secondary)] text-[var(--color-text-dark)] focus:outline-none focus:ring-2 focus:ring-[#25D366]/10 resize-none" placeholder="WhatsApp message (keep concise)..." />
              <p className="text-[9px] text-[var(--color-text-light)] mt-1">{whatsappBody.length}/1024 characters</p>
            </div>
          )}

          {channels.includes('sms') && (
            <div>
              <label className="text-[11px] font-medium text-[var(--color-text-medium)] mb-1.5 flex items-center gap-2 block">
                <span className="w-2 h-2 rounded-full bg-[#2563eb]" /> {t('sms_message')}
              </label>
              <textarea value={smsBody} onChange={e => setSmsBody(e.target.value)} rows={2}
                className="w-full px-3 py-2.5 text-sm rounded-lg bg-[var(--color-bg-secondary)] text-[var(--color-text-dark)] focus:outline-none focus:ring-2 focus:ring-[#2563eb]/10 resize-none" placeholder="SMS text (160 chars recommended)..." />
              <p className={`text-[9px] mt-1 ${smsBody.length > 160 ? 'text-[#ba1a1a]' : 'text-[var(--color-text-light)]'}`}>{smsBody.length}/160 characters</p>
            </div>
          )}

          {/* Variables reference */}
          <div className="pt-3" style={{ borderTop: '1px solid rgba(0,0,0,0.04)' }}>
            <p className="text-[9px] uppercase tracking-wider text-[var(--color-text-light)] font-semibold mb-2">{t('available_variables')}</p>
            <div className="flex flex-wrap gap-1.5">
              {VARIABLES.map(v => (
                <span key={v} className="px-2 py-0.5 rounded text-[9px] font-mono bg-[var(--color-bg-secondary)] text-[var(--color-text-medium)] cursor-pointer hover:bg-[rgba(0,0,128,0.06)] hover:text-[#000080] transition-colors">{v}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/messaging')} className="btn btn-secondary text-xs">{t('cancel')}</button>
        <div className="flex items-center gap-2">
          <button className="btn btn-secondary text-xs">{t('save_as_draft')}</button>
          <button onClick={handleSubmit} className="btn btn-primary text-xs">{isNew ? t('create_template') : t('save_changes')}</button>
        </div>
      </div>
    </div>
  )
}
