import { useState } from 'react'
import { useLanguage } from '@/context/LanguageContext'

const contacts = [
  { name: 'IT Helpdesk', phone: '080-2294-XXXX', email: 'helpdesk@ksp.gov.in', hours: '24/7' },
  { name: 'HR Department', phone: '080-2294-XXXX', email: 'hr@ksp.gov.in', hours: '9 AM - 6 PM' },
  { name: 'System Admin', phone: '080-2294-XXXX', email: 'admin@ksp.gov.in', hours: '9 AM - 6 PM' },
]

export function HelpPage() {
  const { t } = useLanguage()
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const faqs = [
    { q: t('faq_q1'), a: t('faq_a1') },
    { q: t('faq_q2'), a: t('faq_a2') },
    { q: t('faq_q3'), a: t('faq_a3') },
    { q: t('faq_q4'), a: t('faq_a4') },
    { q: t('faq_q5'), a: t('faq_a5') },
  ]

  const quickLinks = [
    { label: t('user_manual'), icon: '📖' },
    { label: t('video_tutorials'), icon: '🎥' },
    { label: t('report_issue'), icon: '🐛' },
    { label: t('feature_request'), icon: '💡' },
  ]

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="text-lg font-semibold text-[var(--color-text-dark)]">{t('help_support')}</h1>
          <p className="text-xs text-[var(--color-text-light)] mt-0.5">{t('find_answers')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* FAQs */}
        <div className="lg:col-span-2 card p-6">
          <h3 className="text-lg font-semibold text-[var(--color-text-dark)] mb-4">{t('faq_title')}</h3>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="border border-[var(--color-border)] rounded-lg overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-[var(--color-bg-main)] transition-colors"
                >
                  <span className="font-medium text-[var(--color-text-dark)]">{faq.q}</span>
                  <svg className={`w-5 h-5 text-[var(--color-text-light)] transition-transform ${openFaq === i ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openFaq === i && (
                  <div className="px-4 pb-4 text-sm text-[var(--color-text-medium)]">{faq.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Contact Support */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-[var(--color-text-dark)] mb-4">{t('contact_support')}</h3>
          <div className="space-y-4">
            {contacts.map((c, i) => (
              <div key={i} className="p-3 bg-[var(--color-bg-main)] rounded-lg">
                <p className="font-medium text-[var(--color-text-dark)]">{c.name}</p>
                <p className="text-xs text-[var(--color-text-light)] mt-1">{c.hours}</p>
                <div className="mt-2 space-y-1 text-sm text-[var(--color-text-medium)]">
                  <p>📞 {c.phone}</p>
                  <p>✉️ {c.email}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-[var(--color-text-dark)] mb-4">{t('quick_links')}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickLinks.map((link, i) => (
            <button key={i} className="p-4 bg-[var(--color-bg-main)] rounded-lg hover:bg-[var(--color-border)] transition-colors text-center">
              <span className="text-2xl">{link.icon}</span>
              <p className="mt-2 text-sm font-medium text-[var(--color-text-dark)]">{link.label}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default HelpPage
