/**
 * DemographicsWizard Component
 * 
 * Main wizard container that manages state, navigation, and auto-save for demographics form
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import PrivacyNotice from './PrivacyNotice';
import ProgressIndicator from './ProgressIndicator';
import AutoSaveIndicator from './AutoSaveIndicator';
import WizardNavigation from './WizardNavigation';

// Page components
import BasicInformationPage from './pages/BasicInformationPage';
import GuardianInformationPage from './pages/GuardianInformationPage';
import EducationPage from './pages/EducationPage';
import DevelopmentalHistoryPage from './pages/DevelopmentalHistoryPage';
import LifeChangesPage from './pages/LifeChangesPage';
import ActivitiesPage from './pages/ActivitiesPage';

// API
import { getDemographics, saveDemographics } from '@/lib/api/demographics-client';

const PAGES = [
  { id: 'basic_information', name: 'Basic Information', component: BasicInformationPage },
  { id: 'guardian_information', name: 'Guardian Information', component: GuardianInformationPage },
  { id: 'education', name: 'Education', component: EducationPage },
  { id: 'developmental_history', name: 'Developmental History', component: DevelopmentalHistoryPage },
  { id: 'life_changes', name: 'Life Changes', component: LifeChangesPage },
  { id: 'activities', name: 'Activities', component: ActivitiesPage }
];

const AUTO_SAVE_DELAY = 30000; // 30 seconds

export default function DemographicsWizard({ 
  patientId,
  onComplete,
  onSkipAll 
}) {
  const [showPrivacyNotice, setShowPrivacyNotice] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({});
  const [sectionsCompleted, setSectionsCompleted] = useState([]);
  const [autoSaveStatus, setAutoSaveStatus] = useState('idle');
  const [lastSaved, setLastSaved] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  const autoSaveTimerRef = useRef(null);
  const lastDataRef = useRef(formData);

  // Load existing demographics on mount
  useEffect(() => {
    const loadExistingData = async () => {
      try {
        const existing = await getDemographics(patientId);
        if (existing) {
          setFormData(existing);
          setSectionsCompleted(existing.sections_completed || []);
          setLastSaved(existing.updated_at);
          
          // Jump to first incomplete section if resuming
          const firstIncompleteIndex = PAGES.findIndex(
            page => !existing.sections_completed?.includes(page.id)
          );
          if (firstIncompleteIndex !== -1 && firstIncompleteIndex > 0) {
            setCurrentStep(firstIncompleteIndex + 1);
          }
        }
        setHasLoaded(true);
      } catch (error) {
        console.error('Error loading demographics:', error);
        setHasLoaded(true);
      }
    };

    if (patientId && !hasLoaded) {
      loadExistingData();
    }
  }, [patientId, hasLoaded]);

  // Auto-save when data changes
  useEffect(() => {
    // Clear existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    // Only auto-save if data has changed and we're not showing privacy notice
    if (!showPrivacyNotice && hasLoaded && formData !== lastDataRef.current) {
      autoSaveTimerRef.current = setTimeout(() => {
        handleAutoSave();
      }, AUTO_SAVE_DELAY);
    }

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [formData, showPrivacyNotice, hasLoaded]);

  const handleAutoSave = useCallback(async () => {
    if (!patientId) return;

    try {
      setAutoSaveStatus('saving');
      await saveDemographics(patientId, {
        ...formData,
        sections_completed: sectionsCompleted
      }, true); // isPartial = true for auto-save
      
      setAutoSaveStatus('saved');
      setLastSaved(new Date().toISOString());
      lastDataRef.current = formData;
      
      // Reset to idle after 3 seconds
      setTimeout(() => setAutoSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Auto-save error:', error);
      setAutoSaveStatus('error');
    }
  }, [patientId, formData, sectionsCompleted]);

  const handleSaveAndContinue = async () => {
    setIsLoading(true);
    try {
      // Mark current section as completed
      const currentPage = PAGES[currentStep - 1];
      const updatedSections = [...new Set([...sectionsCompleted, currentPage.id])];
      setSectionsCompleted(updatedSections);

      // Save current state
      const dataToSave = {
        ...formData,
        sections_completed: updatedSections,
        completed: currentStep === PAGES.length
      };

      await saveDemographics(patientId, dataToSave, false);
      setLastSaved(new Date().toISOString());
      lastDataRef.current = formData;

      // Move to next page or complete
      if (currentStep < PAGES.length) {
        setCurrentStep(currentStep + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        // Final step completed
        if (onComplete) {
          onComplete(dataToSave);
        }
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('There was an error saving your information. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSkip = async () => {
    // Just move to next page without marking as completed
    if (currentStep < PAGES.length) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSkipAll = () => {
    if (onSkipAll) {
      onSkipAll();
    }
  };

  const handleDataChange = (newData) => {
    setFormData(newData);
  };

  const handlePrivacyContinue = () => {
    setShowPrivacyNotice(false);
  };

  const handleRetryAutoSave = () => {
    setAutoSaveStatus('idle');
    handleAutoSave();
  };

  // Show privacy notice first
  if (showPrivacyNotice) {
    return <PrivacyNotice onContinue={handlePrivacyContinue} />;
  }

  // Show loading state while fetching existing data
  if (!hasLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <svg 
            className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24"
          >
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4"
            />
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const CurrentPageComponent = PAGES[currentStep - 1].component;
  const currentPageName = PAGES[currentStep - 1].name;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <ProgressIndicator
        currentStep={currentStep}
        totalSteps={PAGES.length}
        sectionName={currentPageName}
        sectionsCompleted={sectionsCompleted}
      />

      <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-8">
        <AutoSaveIndicator
          status={autoSaveStatus}
          lastSaved={lastSaved}
          onRetry={handleRetryAutoSave}
        />

        <CurrentPageComponent
          data={formData}
          onChange={handleDataChange}
        />

        <WizardNavigation
          onContinue={handleSaveAndContinue}
          onBack={handleBack}
          onSkip={handleSkip}
          showBack={currentStep > 1}
          showSkip={true}
          isLoading={isLoading}
          isLastStep={currentStep === PAGES.length}
        />
      </div>

      {currentStep === 1 && (
        <div className="mt-4 text-center">
          <button
            onClick={handleSkipAll}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Skip entire demographics form
          </button>
        </div>
      )}
    </div>
  );
}

