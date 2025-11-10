/**
 * Survey Questions Mock Data Structure
 * 
 * Contains all 13 survey questions with metadata including:
 * - Question ID, text, type, options
 * - Category (Basic Information, Symptoms & Concerns, History, Goals)
 * - Conditional logic (for Q10)
 * - Screen grouping
 */

export const SURVEY_QUESTIONS = [
  // Basic Information
  {
    id: 'q1',
    question: "What is your child's age?",
    type: 'multiple-choice',
    category: 'Basic Information',
    screen: 1,
    options: [
      { value: 'under-5', label: 'Under 5' },
      { value: '5-7', label: '5-7' },
      { value: '8-10', label: '8-10' },
      { value: '11-13', label: '11-13' },
      { value: '14-16', label: '14-16' },
      { value: '17-18', label: '17-18' },
    ],
    hasOther: false,
  },
  {
    id: 'q2',
    question: 'What grade is your child in?',
    type: 'multiple-choice',
    category: 'Basic Information',
    screen: 1,
    options: [
      { value: 'not-in-school', label: 'Not in school yet' },
      { value: 'kindergarten', label: 'Kindergarten' },
      { value: '1st', label: '1st grade' },
      { value: '2nd', label: '2nd grade' },
      { value: '3rd', label: '3rd grade' },
      { value: '4th', label: '4th grade' },
      { value: '5th', label: '5th grade' },
      { value: '6th', label: '6th grade' },
      { value: '7th', label: '7th grade' },
      { value: '8th', label: '8th grade' },
      { value: '9th', label: '9th grade' },
      { value: '10th', label: '10th grade' },
      { value: '11th', label: '11th grade' },
      { value: '12th', label: '12th grade' },
    ],
    hasOther: false,
  },
  {
    id: 'q3',
    question: "What is your child's living situation?",
    type: 'multiple-choice',
    category: 'Basic Information',
    screen: 1,
    options: [
      { value: 'both-parents', label: 'Lives with both parents' },
      { value: 'one-parent', label: 'Lives with one parent' },
      { value: 'parent-step-parent', label: 'Lives with parent and step-parent' },
      { value: 'other-family', label: 'Lives with other family members' },
      { value: 'other', label: 'Other' },
    ],
    hasOther: true,
  },

  // Symptoms & Concerns
  {
    id: 'q4',
    question: 'What are your primary concerns? (Select all that apply)',
    type: 'checkbox',
    category: 'Symptoms & Concerns',
    screen: 2,
    options: [
      { value: 'anxiety', label: 'Anxiety or worry' },
      { value: 'depression', label: 'Depression or sadness' },
      { value: 'behavioral', label: 'Behavioral issues' },
      { value: 'focusing', label: 'Difficulty focusing' },
      { value: 'social', label: 'Social challenges' },
      { value: 'sleep', label: 'Sleep problems' },
      { value: 'eating', label: 'Eating concerns' },
      { value: 'school-performance', label: 'School performance' },
      { value: 'family-conflicts', label: 'Family conflicts' },
      { value: 'other', label: 'Other' },
    ],
    hasOther: true,
  },
  {
    id: 'q5',
    question: 'How long have you noticed these concerns?',
    type: 'multiple-choice',
    category: 'Symptoms & Concerns',
    screen: 3,
    options: [
      { value: 'less-than-month', label: 'Less than a month' },
      { value: '1-3-months', label: '1-3 months' },
      { value: '3-6-months', label: '3-6 months' },
      { value: '6-12-months', label: '6-12 months' },
      { value: 'more-than-year', label: 'More than a year' },
    ],
    hasOther: false,
  },
  {
    id: 'q6',
    question: 'On a scale of 1-5, how would you rate the severity of these concerns? (1 = mild, 5 = severe)',
    type: 'rating',
    category: 'Symptoms & Concerns',
    screen: 3,
    options: [
      { value: 1, label: '1 (Mild)' },
      { value: 2, label: '2' },
      { value: 3, label: '3' },
      { value: 4, label: '4' },
      { value: 5, label: '5 (Severe)' },
    ],
    hasOther: false,
  },
  {
    id: 'q7',
    question: "How much do these concerns impact your child's daily functioning?",
    type: 'multiple-choice',
    category: 'Symptoms & Concerns',
    screen: 4,
    options: [
      { value: 'not-at-all', label: 'Not at all' },
      { value: 'slightly', label: 'Slightly' },
      { value: 'moderately', label: 'Moderately' },
      { value: 'significantly', label: 'Significantly' },
      { value: 'extremely', label: 'Extremely' },
    ],
    hasOther: false,
  },

  // History
  {
    id: 'q8',
    question: 'Has your child received mental health services before?',
    type: 'multiple-choice',
    category: 'History',
    screen: 5,
    options: [
      { value: 'yes-current', label: 'Yes, currently receiving' },
      { value: 'yes-past', label: 'Yes, in the past' },
      { value: 'no', label: 'No' },
    ],
    hasOther: false,
  },
  {
    id: 'q9',
    question: 'Is your child currently taking any medications?',
    type: 'multiple-choice',
    category: 'History',
    screen: 6,
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' },
    ],
    hasOther: false,
    conditionalFor: 'q10', // This question controls whether Q10 is shown
  },
  {
    id: 'q10',
    question: 'If yes, please describe the medications (optional)',
    type: 'textarea',
    category: 'History',
    screen: 6,
    options: [],
    hasOther: false,
    conditional: true, // Only show if Q9 answer is "Yes"
    conditionalQuestionId: 'q9',
    conditionalValue: 'yes',
  },
  {
    id: 'q11',
    question: 'Does your child receive support services at school?',
    type: 'multiple-choice',
    category: 'History',
    screen: 7,
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' },
      { value: 'not-sure', label: 'Not sure' },
    ],
    hasOther: false,
  },

  // Goals
  {
    id: 'q12',
    question: 'What do you hope to achieve through mental health services? (Select all that apply)',
    type: 'checkbox',
    category: 'Goals',
    screen: 8,
    options: [
      { value: 'emotional-regulation', label: 'Better emotional regulation' },
      { value: 'school-performance', label: 'Improved school performance' },
      { value: 'family-relationships', label: 'Stronger family relationships' },
      { value: 'social-skills', label: 'Better social skills' },
      { value: 'reduce-anxiety', label: 'Reduced anxiety or stress' },
      { value: 'self-esteem', label: 'Improved self-esteem' },
      { value: 'communication', label: 'Better communication' },
      { value: 'other', label: 'Other' },
    ],
    hasOther: true,
  },
  {
    id: 'q13',
    question: "Are there specific areas you'd like to focus on?",
    type: 'textarea',
    category: 'Goals',
    screen: 9,
    options: [],
    hasOther: false,
  },
]

/**
 * Get all applicable questions based on answers (accounts for conditional logic)
 * @param {Object} answers - Current survey answers
 * @returns {Array} Array of applicable question objects
 */
export function getApplicableQuestions(answers = {}) {
  return SURVEY_QUESTIONS.filter(question => {
    // If question has conditional logic, check if it should be shown
    if (question.conditional) {
      const conditionalAnswer = answers[question.conditionalQuestionId]
      return conditionalAnswer === question.conditionalValue
    }
    return true
  })
}

/**
 * Get questions for a specific screen
 * @param {number} screenNumber - Screen number (1-9, excluding intro and summary)
 * @param {Object} answers - Current survey answers (for conditional logic)
 * @returns {Array} Array of question objects for that screen
 */
export function getQuestionByScreen(screenNumber, answers = {}) {
  const applicableQuestions = getApplicableQuestions(answers)
  return applicableQuestions.filter(q => q.screen === screenNumber)
}

/**
 * Get total number of applicable questions (accounts for conditional logic)
 * @param {Object} answers - Current survey answers
 * @returns {number} Total applicable questions
 */
export function getTotalApplicableQuestions(answers = {}) {
  return getApplicableQuestions(answers).length
}

/**
 * Get question by ID
 * @param {string} questionId - Question ID
 * @returns {Object|null} Question object or null
 */
export function getQuestionById(questionId) {
  return SURVEY_QUESTIONS.find(q => q.id === questionId) || null
}

/**
 * Get questions by category
 * @param {string} category - Category name
 * @param {Object} answers - Current survey answers (for conditional logic)
 * @returns {Array} Array of question objects in that category
 */
export function getQuestionsByCategory(category, answers = {}) {
  const applicableQuestions = getApplicableQuestions(answers)
  return applicableQuestions.filter(q => q.category === category)
}

/**
 * Get all categories
 * @returns {Array} Array of unique category names
 */
export function getCategories() {
  return [...new Set(SURVEY_QUESTIONS.map(q => q.category))]
}

