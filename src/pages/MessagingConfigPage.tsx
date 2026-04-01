import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '@/context/LanguageContext'

type Channel = 'whatsapp' | 'sms' | 'email'
type EventType = 'schedule_update' | 'adhoc_request' | 'location_change' | 'leave_update' | 'rotation_change' | 'guard_duty'

interface MessageTemplate {
  id: string
  name: string
  event: EventType
  channels: Channel[]
  enabled: boolean
  subject?: string
  body: string
}

const EVENT_LABELS: Record<EventType, { label: string; desc: string }> = {
  schedule_update: { label: 'Schedule Update', desc: 'When duty schedule changes for personnel' },
  adhoc_request: { label: 'Adhoc Request', desc: 'When new adhoc duty request is created or updated' },
  location_change: { label: 'Location Change', desc: 'When guard location assignment changes' },
  leave_update: { label: 'Leave Update', desc: 'When leave request is approved, rejected, or cancelled' },
  rotation_change: { label: 'Rotation Change', desc: 'When platoon rotation cycle transitions' },
  guard_duty: { label: 'Guard Duty Alert', desc: 'Daily guard duty assignment notifications' },
}

const CHANNEL_META: Record<Channel, { label: string; color: string; icon: JSX.Element }> = {
  whatsapp: { label: 'WhatsApp', color: '#25D366', icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg> },
  sms: { label: 'SMS', color: '#2563eb', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" /></svg> },
  email: { label: 'Email', color: '#7c3aed', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg> },
}

const defaultTemplates: MessageTemplate[] = [
  { id: 't1', name: 'Schedule Change Alert', event: 'schedule_update', channels: ['whatsapp', 'sms'], enabled: true, body: 'Your duty schedule has been updated. New assignment: {{duty_type}} at {{location}} from {{start_date}}. Report to {{location}} by {{report_time}}.' },
  { id: 't2', name: 'Adhoc Request Notification', event: 'adhoc_request', channels: ['whatsapp', 'email'], enabled: true, subject: 'Adhoc Duty Request - {{request_id}}', body: 'You have been assigned an adhoc duty: {{duty_type}} at {{location}} on {{date}}. Reason: {{reason}}. Please confirm acceptance.' },
  { id: 't3', name: 'Location Reassignment', event: 'location_change', channels: ['sms'], enabled: true, body: 'Guard location changed. New post: {{location_name}} ({{location_code}}). Required personnel: {{count}}. Effective: {{date}}.' },
  { id: 't4', name: 'Leave Status Update', event: 'leave_update', channels: ['whatsapp', 'email'], enabled: true, subject: 'Leave Request {{status}} - {{leave_type}}', body: 'Your {{leave_type}} request from {{start_date}} to {{end_date}} has been {{status}} by {{approver}}.' },
  { id: 't5', name: 'Rotation Cycle Alert', event: 'rotation_change', channels: ['whatsapp', 'sms', 'email'], enabled: true, subject: 'Rotation Cycle {{cycle}} Starting', body: 'Rotation Cycle {{cycle}} begins on {{start_date}}. Your platoon ({{platoon}}) is assigned to {{duty_type}}. Report accordingly.' },
  { id: 't6', name: 'Daily Guard Duty Brief', event: 'guard_duty', channels: ['whatsapp'], enabled: false, body: 'Daily guard duty: {{location_name}}. Shift: {{shift}} ({{shift_time}}). Team: {{team_count}} personnel. OIC: {{officer_name}}.' },
]

export default function MessagingConfigPage() {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [templates, setTemplates] = useState<MessageTemplate[]>(defaultTemplates)

  const toggleEnabled = (id: string) => {
    setTemplates(prev => prev.map(t => t.id === id ? { ...t, enabled: !t.enabled } : t))
  }

  const enabledCount = templates.filter(t => t.enabled).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="text-lg font-semibold text-[var(--color-text-dark)]">{t('messaging_configuration')}</h1>
          <p className="text-xs text-[var(--color-text-light)] mt-0.5">{t('configure_notifications')}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-[var(--color-text-light)]">{enabledCount}/{templates.length} active</span>
          <button onClick={() => navigate('/messaging/template')} className="btn btn-primary text-xs">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            {t('new_template')}
          </button>
        </div>
      </div>

      {/* Channel summary */}
      <div className="grid grid-cols-3 gap-4">
        {(['whatsapp', 'sms', 'email'] as Channel[]).map(ch => {
          const meta = CHANNEL_META[ch]
          const count = templates.filter(t => t.enabled && t.channels.includes(ch)).length
          return (
            <div key={ch} className="card rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${meta.color}12`, color: meta.color }}>{meta.icon}</div>
                <div>
                  <p className="text-sm font-semibold text-[var(--color-text-dark)]">{meta.label}</p>
                  <p className="text-[10px] text-[var(--color-text-light)]">{count} active template{count !== 1 ? 's' : ''}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Templates list */}
      <div className="card rounded-xl overflow-hidden">
        <div className="px-5 py-3 bg-[var(--color-bg-secondary)]">
          <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-light)] font-semibold">{t('message_templates')}</p>
        </div>
        <div>
          {templates.map((tmpl, idx) => {
            const evt = EVENT_LABELS[tmpl.event]
            return (
              <div key={tmpl.id} className={`px-5 py-4 flex items-start gap-4 ${idx % 2 === 1 ? 'bg-[var(--color-bg-secondary)]' : ''}`}>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-[var(--color-text-dark)]">{tmpl.name}</p>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase" style={{ background: 'rgba(0,0,128,0.06)', color: '#000080' }}>{evt.label}</span>
                    {!tmpl.enabled && <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase bg-[var(--color-bg-tertiary)] text-[var(--color-text-light)]">{t('disabled')}</span>}
                  </div>
                  <p className="text-[11px] text-[var(--color-text-light)] mb-2">{evt.desc}</p>
                  <div className="flex items-center gap-2">
                    {tmpl.channels.map(ch => {
                      const m = CHANNEL_META[ch]
                      return (
                        <span key={ch} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium" style={{ background: `${m.color}10`, color: m.color }}>
                          {m.icon}
                          {m.label}
                        </span>
                      )
                    })}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button onClick={() => navigate(`/messaging/template?id=${tmpl.id}`)} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-[#6b5c42] bg-[rgba(107,92,66,0.05)] hover:bg-[rgba(107,92,66,0.1)] transition-colors">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
                    {t('edit')}
                  </button>
                  <button className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-[#000080] bg-[rgba(0,0,128,0.05)] hover:bg-[rgba(0,0,128,0.1)] transition-colors">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" /></svg>
                    {t('test')}
                  </button>
                  <button onClick={() => toggleEnabled(tmpl.id)} className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${tmpl.enabled ? 'text-[#ba1a1a] bg-[rgba(186,26,26,0.05)] hover:bg-[rgba(186,26,26,0.1)]' : 'text-[#2D5A27] bg-[rgba(45,90,39,0.05)] hover:bg-[rgba(45,90,39,0.1)]'}`}>
                    {tmpl.enabled ? (
                      <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>{t('disable')}</>
                    ) : (
                      <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>{t('enable')}</>
                    )}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

    </div>
  )
}
