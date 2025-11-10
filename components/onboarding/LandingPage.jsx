'use client'

import { useStepNavigation } from '@/lib/hooks/useStepNavigation'
import Button from '@/components/shared/Button'
import ProgressIndicator from '@/components/shared/ProgressIndicator'
import FAQChatbot from '@/components/shared/FAQChatbot'

/**
 * LandingPage Component
 * 
 * The welcoming landing page that introduces parents to the onboarding flow.
 * Includes hero section, value propositions, and CTA to begin onboarding.
 */
export default function LandingPage() {
  const { goToNextStep } = useStepNavigation()

  const handleGetStarted = () => {
    goToNextStep()
  }

  const valuePropositions = [
    {
      title: 'Expert Care',
      description: 'Licensed clinicians specializing in children and adolescent mental health',
    },
    {
      title: 'Convenient Scheduling',
      description: 'Flexible appointment times that work with your family&apos;s schedule',
    },
    {
      title: 'Insurance Support',
      description: 'We work with most major insurance plans and help navigate coverage',
    },
    {
      title: 'Personalized Approach',
      description: 'Tailored treatment plans designed specifically for your child\'s needs',
    },
  ]

  return (
    <main className="min-h-screen bg-neutral-50" role="main">
      <div className="container mx-auto px-4 py-8 max-w-content">
        {/* Progress Indicator - Subtle */}
        <div className="mb-8">
          <ProgressIndicator
            currentStep={1}
            totalSteps={5}
            percentage={20}
            subtle={true}
          />
        </div>

        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-4">
            Welcome to Daybreak Health
          </h1>
          <p className="text-lg sm:text-xl text-neutral-700 max-w-2xl mx-auto">
            We&apos;re here to support you and your child every step of the way.
          </p>
        </div>

        {/* Value Propositions */}
        <section aria-labelledby="value-propositions" className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {valuePropositions.map((prop, index) => (
            <div
              key={index}
              className="bg-white rounded-lg p-6 shadow-sm border border-neutral-200"
            >
              <h2 className="text-lg font-semibold text-neutral-900 mb-2">
                {prop.title}
              </h2>
              <p className="text-base text-neutral-600">
                {prop.description}
              </p>
            </div>
          ))}
        </section>

        {/* Supporting Message */}
        <div className="text-center mb-8">
          <p className="text-base text-neutral-700 max-w-2xl mx-auto">
            Taking the first step to support your child&apos;s mental health is important.
            Our onboarding process is designed to be simple, supportive, and respectful
            of your family&apos;s needs.
          </p>
        </div>

        {/* CTA Button */}
        <div className="flex justify-center mb-8">
          <Button
            onClick={handleGetStarted}
            variant="primary"
            size="large"
            ariaLabel="Begin onboarding process"
          >
            Get Started
          </Button>
        </div>

        {/* Additional Reassurance */}
        <div className="text-center">
          <p className="text-sm text-neutral-600">
            All information you provide is kept confidential and secure.
          </p>
        </div>
      </div>

      {/* FAQ Chatbot */}
      <FAQChatbot />
    </main>
  )
}

