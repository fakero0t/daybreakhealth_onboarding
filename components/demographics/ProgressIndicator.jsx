/**
 * ProgressIndicator Component
 * 
 * Shows current step and progress through the demographics form
 */

'use client';

export default function ProgressIndicator({ 
  currentStep, 
  totalSteps, 
  sectionName,
  sectionsCompleted = [],
  showSectionPills = true,
  showProgressBar = true,
  customTitle = null,
  sectionsToShow = null // Array of section IDs to show. If null, shows all sections.
}) {
  const percentage = ((currentStep) / totalSteps) * 100;

  const allSections = [
    { id: 'basic_information', name: 'Basic Info' },
    { id: 'guardian_information', name: 'Guardian Info' },
    { id: 'education', name: 'Education' },
    { id: 'developmental_history', name: 'Development' },
    { id: 'life_changes', name: 'Life Changes' },
    { id: 'activities', name: 'Activities' }
  ];

  // Filter sections based on sectionsToShow prop
  const sections = sectionsToShow 
    ? allSections.filter(section => sectionsToShow.includes(section.id))
    : allSections;

  return (
    <div className="w-full mb-6" role="progressbar" aria-valuenow={currentStep} aria-valuemin="1" aria-valuemax={totalSteps}>
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-sm font-medium text-gray-600">
            Step {currentStep} of {totalSteps}
          </p>
          <p className="text-lg font-semibold text-gray-900">
            {customTitle || `Demographics - ${sectionName}`}
          </p>
        </div>
        <div className="text-sm text-gray-500">
          {Math.round(percentage)}% complete
        </div>
      </div>

      {/* Progress Bar */}
      {showProgressBar && (
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}

      {/* Section Pills */}
      {showSectionPills && (
        <div className="flex items-center justify-center gap-2 mt-4">
          {sections.map((section, index) => {
            const isCompleted = sectionsCompleted.includes(section.id);
            const isCurrent = index + 1 === currentStep;

            return (
              <div
                key={section.id}
                className={`
                  px-3 py-1 rounded-full text-xs font-medium
                  transition-colors duration-200
                  ${isCurrent 
                    ? 'bg-blue-600 text-white' 
                    : isCompleted 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-600'
                  }
                `}
              >
                {isCompleted && !isCurrent && (
                  <span className="mr-1" aria-label="Completed">✓</span>
                )}
                {section.name}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

