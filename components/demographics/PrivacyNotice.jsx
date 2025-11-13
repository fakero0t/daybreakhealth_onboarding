/**
 * Privacy Notice Component
 * 
 * Displays privacy information before the demographics form
 */

'use client';

import { useState } from 'react';

export default function PrivacyNotice({ onContinue }) {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Demographics Form
          </h1>
          <p className="text-lg text-gray-600">
            We'll ask a few questions to better understand your needs.
          </p>
        </div>

        <div className="flex flex-col items-center">
          <button
            onClick={onContinue}
            className="
              px-8 py-3 text-base font-medium text-white
              bg-blue-600 border border-transparent rounded-lg
              hover:bg-blue-700 focus:outline-none focus:ring-2
              focus:ring-offset-2 focus:ring-blue-500
              transition-colors duration-200
              mb-3
            "
          >
            Continue to Demographics Form
          </button>
          
          <p className="text-[10px] text-gray-500">
            All information is protected under HIPAA and kept confidential.{' '}
            <button
              onClick={() => setShowModal(true)}
              className="text-blue-600 hover:text-blue-700 underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
            >
              View privacy details
            </button>
          </p>
        </div>
      </div>

      {/* Privacy Modal */}
      {showModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setShowModal(false)}
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
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded p-1"
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
              <li>All questions are optional - you can skip any you don't want to answer</li>
              <li>You can update your information at any time</li>
              <li>You can request to see what information we have about you</li>
              <li>
                You can select "Prefer not to answer" for any sensitive questions
              </li>
            </ul>
          </section>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <strong>Questions about privacy?</strong> Review our full{' '}
              <a href="/privacy-policy" className="underline hover:text-blue-700">
                Privacy Policy
              </a>{' '}
              or contact us at privacy@daybreakhealth.com
            </p>
          </div>
        </div>

            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 flex justify-end">
          <button
                onClick={() => setShowModal(false)}
            className="
                  px-6 py-2 text-base font-medium text-white
              bg-blue-600 border border-transparent rounded-lg
              hover:bg-blue-700 focus:outline-none focus:ring-2
              focus:ring-offset-2 focus:ring-blue-500
              transition-colors duration-200
            "
          >
                Close
          </button>
        </div>
      </div>
        </div>
      )}
    </div>
  );
}

