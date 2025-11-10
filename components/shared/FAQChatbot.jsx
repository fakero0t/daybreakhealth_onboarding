'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronUpIcon, ChevronDownIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useOnboardingState } from '@/lib/context/OnboardingContext'

const FAQ_ITEMS = [
  {
    id: 'services',
    question: 'What services does Daybreak Health offer?',
    answer: 'Daybreak Health offers comprehensive mental health services for children and adolescents, including individual therapy, family therapy, and specialized support for anxiety, depression, and behavioral challenges. Our licensed clinicians work with families to create personalized treatment plans.',
  },
  {
    id: 'insurance',
    question: 'What if my insurance isn\'t accepted?',
    answer: 'If your insurance isn\'t accepted, we offer flexible payment options and can work with you to find a solution that fits your family\'s needs. Our care coordinators can discuss payment plans and alternative options with you.',
  },
  {
    id: 'survey-time',
    question: 'How long does the intake survey take?',
    answer: 'The intake survey typically takes about 10-15 minutes to complete. You can take your time and answer at your own pace. All questions are optional, and you can skip any that you prefer not to answer.',
  },
  {
    id: 'after-onboarding',
    question: 'What happens after I complete onboarding?',
    answer: 'After completing onboarding, a care coordinator will reach out to you within 1-2 business days to discuss next steps, answer any questions, and help schedule your first appointment with a clinician who\'s a good fit for your child.',
  },
  {
    id: 'needs-assessment',
    question: 'How do I know if my child needs mental health services?',
    answer: 'If you\'re noticing changes in your child\'s behavior, mood, school performance, or relationships that concern you, it may be helpful to speak with a mental health professional. There\'s no harm in seeking support, and early intervention can make a significant difference.',
  },
  {
    id: 'security',
    question: 'Is my information secure?',
    answer: 'Yes, we take your privacy and security seriously. All information you provide is kept confidential and secure. We follow HIPAA guidelines and use industry-standard security measures to protect your family\'s information.',
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
          className="flex items-center gap-2 px-4 py-3 bg-primary-500 text-white rounded-full shadow-lg hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all duration-normal"
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
            <h2 className="text-lg font-semibold text-neutral-900">Frequently Asked Questions</h2>
            <button
              onClick={() => {
                setFaqOpen(false)
                setOpenItems(new Set())
              }}
              className="p-1 text-neutral-500 hover:text-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded"
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
                    <span className="text-sm font-medium text-neutral-900 pr-4">
                      {item.question}
                    </span>
                    {isOpen ? (
                      <ChevronUpIcon className="w-5 h-5 text-neutral-500 flex-shrink-0" aria-hidden="true" />
                    ) : (
                      <ChevronDownIcon className="w-5 h-5 text-neutral-500 flex-shrink-0" aria-hidden="true" />
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
                    <div className="px-4 pb-3 text-sm text-neutral-700">
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

