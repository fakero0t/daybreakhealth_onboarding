'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronUpIcon, ChevronDownIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useOnboardingState } from '@/lib/context/OnboardingContext'

const FAQ_ITEMS = [
  {
    id: 'teletherapy-sessions',
    question: 'How do the teletherapy sessions work?',
    answer: 'Daybreak provides video-based 1:1 teletherapy sessions between a student and their matched therapist. These sessions occur weekly for 50-minutes at a regular time with their assigned therapist. We work hard to accommodate the time that works best for the student and family\'s schedules. In between sessions, a student may get additional support from their therapist through text-based messaging.',
  },
  {
    id: 'therapy-cost',
    question: 'How much does therapy cost?',
    answer: 'At Daybreak, our mission is to make high quality mental health support accessible to all kids who need it. We are able to do this through our partnerships with both health insurance providers and school districts. In many cases, our partnership with your school district makes therapy sessions accessible to families at no cost. In some cases, however, you will be responsible for the insurance co-pay for therapy sessions. Please reach out to your school directly or send us an email at carecoordinator@daybreakhealth.com to find out if co-pays would be required.',
  },
  {
    id: 'insurance-required',
    question: 'Do I have to submit our insurance information?',
    answer: 'In many cases, any student regardless of their insurance status can use Daybreak Health at no cost to the family. If you are not sure whether your school\'s partnership with Daybreak covers uninsured students, reach out to your school counselor or contact us directly at carecoordinator@daybreakhealth.com to find out which students are covered. If you do not have insurance for your child, please let us know in the Parent Welcome Packet.',
  },
  {
    id: 'therapist-matching',
    question: 'How is my child matched with their therapist?',
    answer: 'Daybreak has a personalized and culturally-responsive matching process that allows us to make a match between each student and the right therapist for them. Our clinicians all have years of experience working with youth, speak different languages, 74% report as BIPOC, and 14% as members of the LGTBQIA+ community. Additionally our clinicians specialize across 26 different mental health conditions and 13 modalities of care. Our smart matching process allows us to match a student to their clinician based on presenting need, clinical style, personality, schedule and more. This results in 90% of students reporting being satisfied with their clinical match.',
  },
  {
    id: 'session-location',
    question: 'When and where do the teletherapy sessions take place?',
    answer: 'Students can meet with their therapist before, during, or after school. At home or at school. Over the weekend or on school breaks or holidays. Our counselors are available between 7am and 8pm during the week, on Saturdays, and over school breaks. Some schools prefer that students meet with their therapist outside of school hours so that is a conversation for families to have with their students\' school counselor.',
  },
  {
    id: 'child-progress',
    question: 'How do I know about the progress my child is making in the teletherapy program?',
    answer: 'Our clinicians have regular check-ins with the student\'s family. It\'s an opportunity for clinicians to share what they are working on in their sessions and how families can help to effectively support the child in school and at home. We always respect the fundamental confidentiality of our sessions with the student.',
  },
  {
    id: 'privacy-protection',
    question: 'How do I know my child\'s privacy is protected?',
    answer: 'Daybreak Health\'s platforms are compliant with all federal and state privacy laws, including but not limited to FERPA and HIPAA. We follow each school district\'s process for review or correction of any student data held and adhere to any identified Data Privacy Agreements. The public agencies will own the records of all student data sent to Daybreak Health. The student and parents/guardians have access to—and own—all records of therapy with Daybreak.',
  },
  {
    id: 'after-onboarding',
    question: 'What happens after I complete onboarding?',
    answer: 'After completing onboarding, a care coordinator will reach out to you within 1-2 business days to discuss next steps, answer any questions, and help schedule your first appointment with a clinician who\'s a good fit for your child.',
  },
]

/**
 * FAQChatbot Component
 * 
 * Persistent FAQ/Chatbot bubble that appears throughout the onboarding flow.
 * Positioned fixed bottom-right, expandable/collapsible with accordion-style Q&A.
 */
export default function FAQChatbot() {
  const { faqOpen, setFaqOpen } = useOnboardingState()
  const [openItems, setOpenItems] = useState(new Set())
  const containerRef = useRef(null)

  // Toggle individual FAQ item
  const toggleItem = (itemId) => {
    setOpenItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(itemId)) {
        newSet.delete(itemId)
      } else {
        newSet.add(itemId)
      }
      return newSet
    })
  }

  // Handle Escape key to close
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && faqOpen) {
        setFaqOpen(false)
      }
    }

    if (faqOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [faqOpen, setFaqOpen])

  // Focus management when opening
  useEffect(() => {
    if (faqOpen && containerRef.current) {
      const firstButton = containerRef.current.querySelector('button')
      firstButton?.focus()
    }
  }, [faqOpen])

  return (
    <div className="fixed bottom-2 right-2 sm:bottom-4 sm:right-4 z-50">
      {!faqOpen ? (
        /* Collapsed state */
        <button
          onClick={() => setFaqOpen(true)}
          className="flex items-center gap-2 px-4 py-3 bg-secondary-500 text-white rounded-full shadow-lg hover:bg-secondary-600 focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:ring-offset-2 transition-all duration-normal"
          aria-label="Open FAQ"
          aria-expanded="false"
        >
          <span className="text-sm font-medium">Have questions?</span>
          <ChevronUpIcon className="w-5 h-5" aria-hidden="true" />
        </button>
      ) : (
        /* Expanded state */
        <div
          ref={containerRef}
          className="bg-white rounded-lg shadow-xl border border-neutral-200 w-[calc(100vw-1rem)] sm:w-96 max-w-[calc(100vw-1rem)] max-h-[calc(100vh-2rem)] overflow-hidden flex flex-col"
          role="dialog"
          aria-label="Frequently Asked Questions"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-neutral-200">
            <h2 className="text-lg font-heading font-semibold text-primary-500">Frequently Asked Questions</h2>
            <button
              onClick={() => {
                setFaqOpen(false)
                setOpenItems(new Set())
              }}
              className="p-1 text-text-secondary hover:text-text-body focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded"
              aria-label="Close FAQ"
            >
              <XMarkIcon className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          {/* FAQ Items */}
          <div className="overflow-y-auto flex-1">
            {FAQ_ITEMS.map((item) => {
              const isOpen = openItems.has(item.id)
              return (
                <div key={item.id} className="border-b border-neutral-200 last:border-b-0">
                  <button
                    onClick={() => toggleItem(item.id)}
                    className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-inset transition-colors duration-normal"
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${item.id}`}
                  >
                    <span className="text-sm font-medium text-primary-500 pr-4">
                      {item.question}
                    </span>
                    {isOpen ? (
                      <ChevronUpIcon className="w-5 h-5 text-text-secondary flex-shrink-0" aria-hidden="true" />
                    ) : (
                      <ChevronDownIcon className="w-5 h-5 text-text-secondary flex-shrink-0" aria-hidden="true" />
                    )}
                  </button>
                  <div
                    id={`faq-answer-${item.id}`}
                    className={`overflow-hidden transition-all duration-normal ease-in-out ${
                      isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                    }`}
                    style={{
                      transition: 'max-height 250ms ease-in-out, opacity 250ms ease-in-out'
                    }}
                    aria-hidden={!isOpen}
                  >
                    <div className="px-4 pb-3 text-sm text-text-body">
                      {item.answer}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

