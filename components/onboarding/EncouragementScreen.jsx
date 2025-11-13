'use client'

import { useState } from 'react'
import { CheckCircleIcon } from '@heroicons/react/24/solid'
import { useStepNavigation } from '@/lib/hooks/useStepNavigation'
import Button from '@/components/shared/Button'

/**
 * EncouragementScreen Component
 * 
 * Positive reinforcement screen shown between questionnaire and insurance upload.
 * Encourages users to continue and lets them know they're making progress.
 */
export default function EncouragementScreen() {
  const { goToStep } = useStepNavigation()
  const [showPrivacyModal, setShowPrivacyModal] = useState(false)

  // Navigate to Insurance Upload (step 6)
  const handleContinue = () => {
    goToStep(6)
  }

  return (
    <>
      <main className="h-screen bg-background-cream flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-hidden" role="main">
        <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-6 lg:p-8">
          <div className="w-full max-w-2xl mx-auto flex flex-col items-center justify-center text-center space-y-6 sm:space-y-8">
            {/* Success Icon */}
            <div className="flex-shrink-0">
              <CheckCircleIcon className="w-20 h-20 text-primary-500 mx-auto" aria-hidden="true" />
            </div>

            {/* Heading */}
            <h1 className="text-3xl sm:text-4xl font-heading font-bold text-primary-500">
              You&apos;re Doing Great!
            </h1>

            {/* Encouraging Message */}
            <p className="text-base sm:text-lg lg:text-xl text-text-body max-w-xl mx-auto leading-relaxed">
              Just a few more questions before we can match you with a provider.
            </p>

            {/* Continue Button */}
            <div className="flex flex-col items-center w-full sm:w-auto flex-shrink-0">
              <Button
                onClick={handleContinue}
                variant="primary"
                size="large"
                ariaLabel="Continue"
                className="w-full sm:w-auto"
              >
                Continue
              </Button>
            </div>
          </div>
        </div>
      </main>


      {/* Privacy Modal */}
      {showPrivacyModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setShowPrivacyModal(false)}
        >
          <div 
            className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                Privacy Notice
              </h2>
              <button
                onClick={() => setShowPrivacyModal(false)}
                className="text-neutral-400 hover:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-full p-1"
                aria-label="Close modal"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6 text-gray-700">
              <section>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  What information do we collect?
                </h3>
                <p>
                  We collect demographic and background information to help us provide you with 
                  the best possible care. This includes basic information about you, your education, 
                  family situation, developmental history, and interests.
                </p>
              </section>

              <section>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Why do we collect this information?
                </h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>To better understand your unique needs and circumstances</li>
                  <li>To provide personalized and effective care</li>
                  <li>To match you with the most appropriate healthcare providers</li>
                  <li>To ensure we respect your preferences and identity</li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  How do we protect your information?
                </h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>HIPAA Compliance:</strong> All information is protected under HIPAA 
                    (Health Insurance Portability and Accountability Act)
                  </li>
                  <li>
                    <strong>Secure Storage:</strong> Your data is encrypted and stored securely
                  </li>
                  <li>
                    <strong>Limited Access:</strong> Only authorized healthcare providers involved 
                    in your care can access your information
                  </li>
                  <li>
                    <strong>Confidential:</strong> We never share your information without your 
                    explicit consent, except as required by law
                  </li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Your Rights
                </h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>All questions are optional - you can skip any you don&apos;t want to answer</li>
                  <li>You can update your information at any time</li>
                  <li>You can request to see what information we have about you</li>
                  <li>
                    You can select &quot;Prefer not to answer&quot; for any sensitive questions
                  </li>
                </ul>
              </section>

              <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                <p className="text-sm text-primary-900">
                  <strong>Questions about privacy?</strong> Review our full{' '}
                  <a href="/privacy-policy" className="underline hover:text-primary-700">
                    Privacy Policy
                  </a>{' '}
                  or contact us at privacy@daybreakhealth.com
                </p>
              </div>
            </div>

            <div className="sticky bottom-0 bg-neutral-50 border-t border-neutral-200 p-6 flex justify-end">
              <button
                onClick={() => setShowPrivacyModal(false)}
                className="
                  px-6 py-2 text-base font-medium text-white
                  bg-secondary-500 border border-transparent rounded-full
                  hover:bg-secondary-600 focus:outline-none focus:ring-2
                  focus:ring-offset-2 focus:ring-secondary-500
                  transition-all duration-200 shadow-sm hover:shadow-md
                "
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

