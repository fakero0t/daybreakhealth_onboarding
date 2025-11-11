'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useStepNavigation } from '@/lib/hooks/useStepNavigation'
import { useOnboardingState } from '@/lib/context/OnboardingContext'
import Button from '@/components/shared/Button'
import ProgressIndicator from '@/components/shared/ProgressIndicator'
import QuestionCard from '@/components/shared/QuestionCard'
import FAQChatbot from '@/components/shared/FAQChatbot'
import {
  getQuestionByScreen,
  getTotalApplicableQuestions,
  getApplicableQuestions,
  getQuestionsByCategory,
  getQuestionById,
  getCategories,
} from '@/lib/constants/survey-questions'

/**
 * IntakeSurvey Component
 * 
 * Handles the entire survey flow including introduction screen and all question screens.
 */
export default function IntakeSurvey() {
  const { goToNextStep } = useStepNavigation()
  const { surveyAnswers, setSurveyAnswer, setSurveyAnswers } = useOnboardingState()
  const [currentScreen, setCurrentScreen] = useState('intro') // 'intro' | 1-9 | 'summary'
  const [editingCategory, setEditingCategory] = useState(null) // Track which category is being edited
  const [showConfirmation, setShowConfirmation] = useState(false) // Show confirmation message
  const [otherTexts, setOtherTexts] = useState({}) // Store "Other" text inputs

  // Get applicable questions based on current answers
  const applicableQuestions = getApplicableQuestions(surveyAnswers)
  const totalApplicable = getTotalApplicableQuestions(surveyAnswers)

  // Calculate progress
  const answeredCount = applicableQuestions.filter(q => {
    const answer = surveyAnswers[q.id]
    if (q.type === 'checkbox') {
      return Array.isArray(answer) && answer.length > 0
    }
    return answer !== undefined && answer !== null && answer !== ''
  }).length

  const progressPercentage = totalApplicable > 0 
    ? Math.round((answeredCount / totalApplicable) * 100)
    : 0

  // Handle answer change
  const handleAnswerChange = useCallback((questionId, value) => {
    setSurveyAnswer(questionId, value)
    
    // Clear "Other" text if option is deselected
    if (value !== 'other' && !Array.isArray(value) || (Array.isArray(value) && !value.includes('other'))) {
      setOtherTexts(prev => {
        const newTexts = { ...prev }
        delete newTexts[questionId]
        return newTexts
      })
    }
  }, [setSurveyAnswer])

  // Handle "Other" text change
  const handleOtherTextChange = useCallback((questionId, text) => {
    setOtherTexts(prev => ({ ...prev, [questionId]: text }))
    
    // Update answer to include "other" with text
    const currentAnswer = surveyAnswers[questionId]
    if (Array.isArray(currentAnswer)) {
      // For checkboxes, ensure "other" is in the array
      if (!currentAnswer.includes('other')) {
        setSurveyAnswer(questionId, [...currentAnswer, 'other'])
      }
    } else {
      // For multiple choice, set to "other"
      setSurveyAnswer(questionId, 'other')
    }
  }, [surveyAnswers, setSurveyAnswer])

  // Navigation handlers
  const handleBeginSurvey = () => {
    setCurrentScreen(1)
  }

  const handleNext = () => {
    const screenNum = typeof currentScreen === 'number' ? currentScreen : 1
    if (screenNum < 9) {
      setCurrentScreen(screenNum + 1)
    } else if (screenNum === 9) {
      setCurrentScreen('summary')
    }
  }

  const handlePrevious = () => {
    if (currentScreen === 'summary') {
      setCurrentScreen(9)
    } else {
      const screenNum = typeof currentScreen === 'number' ? currentScreen : 1
      if (screenNum > 1) {
        setCurrentScreen(screenNum - 1)
      }
    }
  }

  // Handle edit category - navigate to first question of that category
  const handleEditCategory = (category) => {
    const categoryQuestions = getQuestionsByCategory(category, surveyAnswers)
    if (categoryQuestions.length > 0) {
      setEditingCategory(category)
      setCurrentScreen(categoryQuestions[0].screen)
    }
  }

  // Check if we're returning from editing a category
  useEffect(() => {
    if (editingCategory && typeof currentScreen === 'number') {
      const categoryQuestions = getQuestionsByCategory(editingCategory, surveyAnswers)
      const currentScreenQuestions = getQuestionByScreen(currentScreen, surveyAnswers)
      
      // Check if we've moved past the last question in this category
      const lastCategoryScreen = Math.max(...categoryQuestions.map(q => q.screen))
      if (currentScreen > lastCategoryScreen) {
        setEditingCategory(null)
        setCurrentScreen('summary')
      }
    }
  }, [currentScreen, editingCategory, surveyAnswers])

      // Handle complete assessment
      const handleCompleteAssessment = () => {
        setShowConfirmation(true)
        // Smooth transition with confirmation message
        setTimeout(() => {
          goToNextStep() // Navigate to scheduling assistant
        }, 1500)
      }

  // Focus management - focus first question on screen load
  useEffect(() => {
    if (typeof currentScreen === 'number') {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        const questions = getQuestionByScreen(currentScreen, surveyAnswers)
        if (questions.length > 0) {
          const firstQuestion = questions[0]
          const firstInput = document.querySelector(`input[name="${firstQuestion.id}"], input[id^="${firstQuestion.id}-"]`)
          if (firstInput) {
            firstInput.focus()
          }
        }
      }, 100)
    }
  }, [currentScreen, surveyAnswers])

  // Get questions for current screen
  const getCurrentScreenQuestions = () => {
    if (typeof currentScreen !== 'number') return []
    return getQuestionByScreen(currentScreen, surveyAnswers)
  }

  // Get question value (handles "Other" text)
  const getQuestionValue = (question) => {
    const answer = surveyAnswers[question.id]
    if (question.hasOther && otherTexts[question.id]) {
      // For checkboxes with "other", return array with "other"
      if (question.type === 'checkbox') {
        return Array.isArray(answer) && answer.includes('other') ? answer : answer
      }
      // For multiple choice with "other", return "other"
      return answer === 'other' ? 'other' : answer
    }
    return answer
  }

  // Check if "Other" is selected
  const isOtherSelected = (question) => {
    const answer = surveyAnswers[question.id]
    if (question.type === 'checkbox') {
      return Array.isArray(answer) && answer.includes('other')
    }
    return answer === 'other'
  }

  // Introduction Screen
  if (currentScreen === 'intro') {
    return (
      <main className="min-h-screen bg-background-muted-teal" role="main">
        <div className="container mx-auto px-4 py-16 sm:py-20 max-w-content">
          {/* Progress Indicator */}
          <div className="mb-8">
            <ProgressIndicator
              currentStep={3}
              totalSteps={5}
              percentage={60}
            />
          </div>

          {/* Introduction Content */}
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-heading font-bold text-primary-500 mb-6">
              Help Us Understand Your Child&apos;s Needs
            </h1>

            <div className="max-w-2xl mx-auto space-y-6 mb-8">
              <p className="text-base sm:text-lg text-text-body">
                We&apos;d like to learn more about your child so we can provide the best
                support possible. This information helps us understand your child&apos;s
                unique needs and match you with a clinician who&apos;s a good fit.
              </p>

              <div className="bg-primary-50 border border-primary-200 rounded-lg p-6">
                <p className="text-base text-primary-900 font-medium mb-2">
                  This will take about 10-15 minutes
                </p>
                <p className="text-sm text-primary-700">
                  You can take your time and answer at your own pace.
                </p>
              </div>

              <div className="space-y-4 text-left">
                <p className="text-base text-text-body">
                  <strong>All questions are optional.</strong> You can skip any question
                  you prefer not to answer.
                </p>
                <p className="text-base text-text-body">
                  We encourage you to answer honestly. There are no right or wrong answers,
                  and your responses help us provide better care for your child.
                </p>
              </div>
            </div>

            {/* Begin Survey Button */}
            <div className="flex justify-center">
              <Button
                onClick={handleBeginSurvey}
                variant="primary"
                size="large"
                ariaLabel="Begin intake survey"
              >
                Begin Survey
              </Button>
            </div>
          </div>
        </div>

        {/* FAQ Chatbot */}
        <FAQChatbot />
      </main>
    )
  }

  // Question Screens
  if (typeof currentScreen === 'number') {
    const questions = getCurrentScreenQuestions()
    const isFirstScreen = currentScreen === 1
    const isLastScreen = currentScreen === 9

    return (
      <main className="min-h-screen bg-background-cream" role="main">
        <div className="container mx-auto px-4 py-16 sm:py-20 max-w-content">
          {/* Progress Indicator */}
          <div className="mb-8">
            <ProgressIndicator
              currentStep={answeredCount}
              totalSteps={totalApplicable}
              percentage={progressPercentage}
              label="Question"
            />
          </div>

          {/* Auto-save indicator (visual only) */}
          <div className="text-center mb-6">
            <p className="text-sm text-text-secondary">
              Your progress is being saved automatically
            </p>
          </div>

          {/* Questions */}
          <div className="space-y-8 mb-8">
            {questions.map((question, index) => {
              // Skip Q10 if conditional logic says so
              if (question.id === 'q10' && question.conditional) {
                const q9Answer = surveyAnswers['q9']
                if (q9Answer !== 'yes') {
                  return null
                }
              }

              const value = getQuestionValue(question)
              const showOtherInput = question.hasOther && isOtherSelected(question)

              return (
                <div key={question.id}>
                  <QuestionCard
                    question={question.question}
                    type={question.type}
                    options={question.options}
                    value={value}
                    onChange={(newValue) => handleAnswerChange(question.id, newValue)}
                    questionId={question.id}
                    required={false}
                  />
                  
                  {/* "Other" text input */}
                  {showOtherInput && (
                    <div className="mt-4 ml-4">
                      <input
                        type="text"
                        value={otherTexts[question.id] || ''}
                        onChange={(e) => handleOtherTextChange(question.id, e.target.value)}
                        placeholder="Please specify"
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        aria-label={`Specify other for ${question.question}`}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center gap-4">
            <Button
              onClick={handlePrevious}
              variant="outline"
              size="medium"
              disabled={isFirstScreen}
              ariaLabel="Go to previous question"
            >
              Previous
            </Button>

            <Button
              onClick={handleNext}
              variant="primary"
              size="medium"
              ariaLabel={isLastScreen ? "Go to summary" : "Go to next question"}
            >
              {isLastScreen ? 'Review Answers' : 'Next'}
            </Button>
          </div>
        </div>

        {/* FAQ Chatbot */}
        <FAQChatbot />
      </main>
    )
  }

  // Summary Screen
  if (currentScreen === 'summary') {
    const categories = getCategories()
    
    // Helper to format answer for display
    const formatAnswer = (question, answer) => {
      if (answer === undefined || answer === null || answer === '') {
        return 'Not answered'
      }
      
      if (question.type === 'checkbox' && Array.isArray(answer)) {
        return answer
          .filter(a => a !== 'other' && a !== 'prefer-not-to-answer')
          .map(a => {
            const option = question.options.find(opt => opt.value === a)
            return option ? option.label : a
          })
          .join(', ') || 'Not answered'
      }
      
      if (question.type === 'rating') {
        return `${answer}${answer === 1 ? ' (Mild)' : answer === 5 ? ' (Severe)' : ''}`
      }
      
      if (answer === 'prefer-not-to-answer') {
        return 'Prefer not to answer'
      }
      
      if (answer === 'other') {
        return `Other${otherTexts[question.id] ? `: ${otherTexts[question.id]}` : ''}`
      }
      
      const option = question.options.find(opt => opt.value === answer)
      return option ? option.label : answer
    }

    return (
      <main className="min-h-screen bg-background-muted-teal" role="main">
        <div className="container mx-auto px-4 py-16 sm:py-20 max-w-content">
          {/* Progress Indicator */}
          <div className="mb-8">
            <ProgressIndicator
              currentStep={answeredCount}
              totalSteps={totalApplicable}
              percentage={progressPercentage}
              label="Question"
            />
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-heading font-bold text-primary-500 mb-4">
              Review Your Answers
            </h1>
            <p className="text-base sm:text-lg text-text-body">
              You&apos;ve answered {answeredCount} of {totalApplicable} questions
            </p>
          </div>

          {/* Confirmation Message */}
          {showConfirmation && (
            <div className="bg-success-50 border border-success-200 rounded-lg p-6 mb-8 text-center">
              <p className="text-lg font-medium text-success-900">
                Thank you! Your assessment has been submitted.
              </p>
            </div>
          )}

          {/* Answers by Category */}
          <div className="space-y-6 mb-8">
            {categories.map((category) => {
              const categoryQuestions = getQuestionsByCategory(category, surveyAnswers)
              const answeredInCategory = categoryQuestions.filter(q => {
                const answer = surveyAnswers[q.id]
                if (q.type === 'checkbox') {
                  return Array.isArray(answer) && answer.length > 0
                }
                return answer !== undefined && answer !== null && answer !== ''
              }).length

              return (
                <div key={category} className="bg-white rounded-lg shadow-md p-6 sm:p-8">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-heading font-semibold text-primary-500">{category}</h2>
                    <Button
                      onClick={() => handleEditCategory(category)}
                      variant="outline"
                      size="small"
                      ariaLabel={`Edit ${category} answers`}
                    >
                      Edit
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    {categoryQuestions.map((question) => {
                      const answer = surveyAnswers[question.id]
                      const formattedAnswer = formatAnswer(question, answer)
                      
                      return (
                        <div key={question.id} className="border-b border-neutral-100 last:border-b-0 pb-4 last:pb-0">
                          <p className="font-medium text-primary-500 mb-1">{question.question}</p>
                          <p className="text-text-body">{formattedAnswer}</p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center gap-4">
            <Button
              onClick={handlePrevious}
              variant="outline"
              size="medium"
              ariaLabel="Go back to previous question"
            >
              Previous
            </Button>

            <Button
              onClick={handleCompleteAssessment}
              variant="primary"
              size="large"
              disabled={showConfirmation}
              ariaLabel="Complete assessment and proceed"
            >
              Complete Assessment
            </Button>
          </div>
        </div>

        {/* FAQ Chatbot */}
        <FAQChatbot />
      </main>
    )
  }

  return null
}
