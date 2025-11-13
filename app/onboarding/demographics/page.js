/**
 * Demographics Onboarding Page
 * 
 * Step 1 of the onboarding process - collects patient demographics
 */

'use client';

import { useRouter } from 'next/navigation';
import { DemographicsWizard } from '@/components/demographics';

export default function DemographicsOnboardingPage() {
  const router = useRouter();

  // TODO: Get actual patient ID from authentication/session
  const patientId = '123e4567-e89b-12d3-a456-426614174000';

  const handleComplete = (data) => {
    console.log('Demographics completed:', data);
    // Navigate to next step (symptom questionnaire)
    router.push('/onboarding/symptoms');
  };

  const handleSkipAll = () => {
    // User chose to skip entire demographics form
    console.log('User skipped demographics');
    // Navigate to next step anyway
    router.push('/onboarding/symptoms');
  };

  return (
    <DemographicsWizard
      patientId={patientId}
      onComplete={handleComplete}
      onSkipAll={handleSkipAll}
    />
  );
}

