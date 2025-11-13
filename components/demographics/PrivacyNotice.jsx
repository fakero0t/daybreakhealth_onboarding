/**
 * Privacy Notice Component
 * 
 * Displays privacy information before the demographics form
 */

'use client';

export default function PrivacyNotice({ onContinue }) {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Privacy Notice
          </h1>
          <p className="text-lg text-gray-600">
            Before we begin, here's how we protect your information
          </p>
        </div>

        <div className="space-y-6 text-gray-700">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              What information do we collect?
            </h2>
            <p>
              We collect demographic and background information to help us provide you with 
              the best possible care. This includes basic information about you, your education, 
              family situation, developmental history, and interests.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Why do we collect this information?
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>To better understand your unique needs and circumstances</li>
              <li>To provide personalized and effective care</li>
              <li>To match you with the most appropriate healthcare providers</li>
              <li>To ensure we respect your preferences and identity</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              How do we protect your information?
            </h2>
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
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Your Rights
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>All questions are optional - you can skip any you don't want to answer</li>
              <li>You can update your information at any time</li>
              <li>You can request to see what information we have about you</li>
              <li>
                You can select "Prefer not to answer" for any sensitive questions
              </li>
            </ul>
          </section>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
            <p className="text-sm text-blue-900">
              <strong>Questions about privacy?</strong> Review our full{' '}
              <a href="/privacy-policy" className="underline hover:text-blue-700">
                Privacy Policy
              </a>{' '}
              or contact us at privacy@daybreakhealth.com
            </p>
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <button
            onClick={onContinue}
            className="
              px-8 py-3 text-base font-medium text-white
              bg-blue-600 border border-transparent rounded-lg
              hover:bg-blue-700 focus:outline-none focus:ring-2
              focus:ring-offset-2 focus:ring-blue-500
              transition-colors duration-200
            "
          >
            Continue to Demographics Form
          </button>
        </div>
      </div>
    </div>
  );
}

