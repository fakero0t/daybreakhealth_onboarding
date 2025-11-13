'use client'

import { useStepNavigation } from '@/lib/hooks/useStepNavigation'
import Button from '@/components/shared/Button'
import ProgressIndicator from '@/components/shared/ProgressIndicator'
import FAQChatbot from '@/components/shared/FAQChatbot'

/**
 * LandingPage Component
 * 
 * Simple landing page with app name and brief company info.
 */
export default function LandingPage() {
  const { goToNextStep } = useStepNavigation()

  const handleGetStarted = () => {
    goToNextStep()
  }

  return (
    <main className="min-h-screen bg-background-cream flex items-center justify-center" role="main">
      <div className="container mx-auto px-4 py-16 max-w-2xl">
        {/* No progress indicator on landing page - it's not a step */}

        {/* Main Content */}
        <div className="text-center">
          {/* App Name */}
          <h1 className="text-5xl sm:text-5xl font-heading font-bold text-primary-500 mb-6">
            Welcome to{' '}
            <span className="relative inline-block">
              Daybreak
              <svg
                className="absolute -bottom-1 left-0 w-full h-3 -z-10"
                viewBox="0 0 200 15"
                preserveAspectRatio="none"
                aria-hidden="true"
                style={{ overflow: 'visible' }}
              >
                {/* Main underline - wavy hand-drawn style */}
                <path
                  d="M 0 10 Q 25 6, 50 8 Q 75 10, 100 7 Q 125 4, 150 8 Q 175 12, 200 9"
                  stroke="#FFD700"
                  strokeWidth="3.5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
                {/* Secondary underline for depth */}
                <path
                  d="M -2 12 Q 23 8, 48 10 Q 73 12, 98 9 Q 123 6, 148 10 Q 173 14, 198 11"
                  stroke="#FFD700"
                  strokeWidth="2.5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.8"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            </span>
          </h1>
          
          {/* Company Info */}
          <p className="text-lg text-text-body mb-12 max-w-xl mx-auto">
            We are building a world where every young person benefits from mental health support.
          </p>

          {/* CTA Button */}
          <Button
            onClick={handleGetStarted}
            variant="primary"
            size="large"
            ariaLabel="Begin onboarding"
          >
            Get Started
          </Button>
        </div>
      </div>

      {/* FAQ Chatbot */}
      <FAQChatbot />
    </main>
  )
}

