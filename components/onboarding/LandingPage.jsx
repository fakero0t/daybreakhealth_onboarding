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
          <h1 className="text-5xl sm:text-6xl font-heading font-bold text-primary-500 mb-6">
            Daybreak Health
          </h1>
          
          {/* Company Info */}
          <p className="text-lg text-text-body mb-12 max-w-xl mx-auto">
            Mental health care for children and teens.
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

