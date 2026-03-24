import { useState } from 'react'

const faqs = [
  { q: 'How do I request leave?', a: 'Navigate to Leave Requests from the sidebar, click "New Request", fill in the details and submit.' },
  { q: 'How do I swap shifts with a colleague?', a: 'Go to Swap Requests, create a new swap request by selecting the shift you want to swap and the colleague you want to swap with.' },
  { q: 'How can I view my schedule?', a: 'Click on Schedule in the sidebar to view your assigned shifts in calendar or list view.' },
  { q: 'Who can approve my leave requests?', a: 'Leave requests are approved by supervisors and administrators based on your department hierarchy.' },
  { q: 'How do I update my profile information?', a: 'Go to My Profile from the header dropdown and click Edit Profile to update your information.' },
]

const contacts = [
  { name: 'IT Helpdesk', phone: '080-2294-XXXX', email: 'helpdesk@ksp.gov.in', hours: '24/7' },
  { name: 'HR Department', phone: '080-2294-XXXX', email: 'hr@ksp.gov.in', hours: '9 AM - 6 PM' },
  { name: 'System Admin', phone: '080-2294-XXXX', email: 'admin@ksp.gov.in', hours: '9 AM - 6 PM' },
]

export function HelpPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Help & Support</h1>
          <p className="page-subtitle">Find answers and get assistance</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* FAQs */}
        <div className="lg:col-span-2 card p-6">
          <h3 className="text-lg font-semibold text-[var(--color-text-dark)] mb-4">Frequently Asked Questions</h3>
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
          <h3 className="text-lg font-semibold text-[var(--color-text-dark)] mb-4">Contact Support</h3>
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
        <h3 className="text-lg font-semibold text-[var(--color-text-dark)] mb-4">Quick Links</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'User Manual', icon: '📖' },
            { label: 'Video Tutorials', icon: '🎥' },
            { label: 'Report Issue', icon: '🐛' },
            { label: 'Feature Request', icon: '💡' },
          ].map((link, i) => (
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
