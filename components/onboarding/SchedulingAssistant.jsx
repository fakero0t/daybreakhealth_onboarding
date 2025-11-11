'use client'

import { CalendarIcon, PhoneIcon, EnvelopeIcon } from '@heroicons/react/24/outline'
import ProgressIndicator from '@/components/shared/ProgressIndicator'
import FAQChatbot from '@/components/shared/FAQChatbot'

/**
 * SchedulingAssistant Component
 * 
 * Final scheduling page with mock calendar and contact information.
 */
export default function SchedulingAssistant() {
  // Generate next 7 days
  const getNext7Days = () => {
    const days = []
    const today = new Date()
    for (let i = 0; i < 7; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      days.push(date)
    }
    return days
  }

  const days = getNext7Days()
  const timeSlots = ['9:00 AM', '11:00 AM', '2:00 PM', '4:00 PM']

  // Format date for display
  const formatDate = (date) => {
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow'
    } else {
      return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    }
  }

  // Mock availability (some slots available, some not)
  const isSlotAvailable = (dayIndex, slotIndex) => {
    // Simple mock logic - make some slots available
    return (dayIndex + slotIndex) % 3 !== 0
  }

  return (
    <main className="min-h-screen bg-background-cream" role="main">
      <div className="container mx-auto px-4 py-16 sm:py-20 max-w-content">
        {/* Progress Indicator */}
        <div className="mb-8">
          <ProgressIndicator
            currentStep={5}
            totalSteps={5}
            percentage={100}
          />
        </div>

        {/* Congratulatory Message */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-heading font-bold text-primary-500 mb-4">
            Congratulations!
          </h1>
          <p className="text-base sm:text-lg text-text-body mb-2">
            You&apos;ve completed the onboarding process.
          </p>
          <p className="text-base text-text-body">
            A care coordinator will reach out to you within 1-2 business days to discuss
            next steps and help schedule your first appointment.
          </p>
        </div>

        {/* Mock Calendar */}
        <section aria-labelledby="calendar-heading" className="bg-white rounded-lg shadow-md p-6 sm:p-8 mb-8">
          <div className="flex items-center gap-2 mb-6">
            <CalendarIcon className="w-6 h-6 text-primary-500" aria-hidden="true" />
            <h2 id="calendar-heading" className="text-xl font-heading font-semibold text-primary-500">Schedule Your First Appointment</h2>
          </div>

          <div className="space-y-4 sm:space-y-6">
            {days.map((day, dayIndex) => (
              <div key={dayIndex} className="border-b border-neutral-200 last:border-b-0 pb-4 last:pb-0">
                <h3 className="font-medium text-primary-500 mb-3">
                  {formatDate(day)}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {timeSlots.map((slot, slotIndex) => {
                    const available = isSlotAvailable(dayIndex, slotIndex)
                    return (
                      <button
                        key={slotIndex}
                        type="button"
                        disabled
                        className={`
                          px-4 py-2 rounded-lg text-sm font-medium transition-colors
                          ${available
                            ? 'bg-primary-50 text-primary-700 border border-primary-200 cursor-default'
                            : 'bg-neutral-100 text-neutral-400 border border-neutral-200 cursor-not-allowed'
                          }
                        `}
                        aria-label={`${slot} on ${formatDate(day)} - ${available ? 'Available' : 'Unavailable'}`}
                      >
                        {slot}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 text-center">
            <button
              type="button"
              disabled
              className="px-6 py-3 bg-neutral-200 text-neutral-500 rounded-lg font-medium cursor-not-allowed"
              aria-label="Schedule appointment (non-functional)"
            >
              Schedule Your First Appointment
            </button>
          </div>
        </section>

        {/* Contact Information */}
        <section aria-labelledby="contact-heading" className="bg-white rounded-lg shadow-md p-6 sm:p-8 mb-8">
          <h2 id="contact-heading" className="text-xl font-heading font-semibold text-primary-500 mb-4">Need Help?</h2>
          <div className="space-y-4">
            <a
              href="tel:5551234567"
              className="flex items-center gap-3 text-primary-600 hover:text-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded p-2"
            >
              <PhoneIcon className="w-5 h-5" aria-hidden="true" />
              <span className="font-medium">Call us: (555) 123-4567</span>
            </a>
            <a
              href="mailto:support@daybreakhealth.com"
              className="flex items-center gap-3 text-primary-600 hover:text-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded p-2"
            >
              <EnvelopeIcon className="w-5 h-5" aria-hidden="true" />
              <span className="font-medium">Email us: support@daybreakhealth.com</span>
            </a>
          </div>
        </section>

        {/* First Session Information */}
        <section aria-labelledby="first-session-heading" className="bg-primary-50 border border-primary-200 rounded-lg p-6 mb-8">
          <h2 id="first-session-heading" className="text-lg font-semibold text-primary-900 mb-3">What to Expect in Your First Session</h2>
          <p className="text-base text-primary-800">
            Your first session will be an opportunity to meet your clinician, discuss your
            child&apos;s goals, and create a personalized treatment plan. This is a safe space
            to ask questions and share what&apos;s on your mind.
          </p>
        </section>

        {/* Confirmation Message */}
        <div className="text-center">
          <p className="text-base text-text-body">
            A care coordinator will be in touch within 1-2 business days to help you schedule
            your first appointment.
          </p>
        </div>
      </div>

      {/* FAQ Chatbot */}
      <FAQChatbot />
    </main>
  )
}

