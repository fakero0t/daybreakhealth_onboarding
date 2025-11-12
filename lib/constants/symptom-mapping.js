/**
 * Symptom Mapping Constants
 * 
 * Contains all 32 standardized symptoms with their kebab-case keys,
 * labels, categories, and helper functions for organizing symptoms.
 */

export const SYMPTOMS = [
  { key: 'sadness-depressed-mood', label: 'Sadness/Depressed Mood/Crying Spells', category: 'Mood/Emotional', number: 1 },
  { key: 'temper-outbursts', label: 'Temper Outbursts', category: 'Behavioral', number: 2 },
  { key: 'withdrawn-or-isolated', label: 'Withdrawn or Isolated', category: 'Social', number: 3 },
  { key: 'daydreaming', label: 'Daydreaming', category: 'Cognitive', number: 4 },
  { key: 'fearful', label: 'Fearful', category: 'Mood/Emotional', number: 5 },
  { key: 'clumsy', label: 'Clumsy', category: 'Physical/Sleep', number: 6 },
  { key: 'over-reactive', label: 'Over-reactive', category: 'Anxiety/Worry', number: 7 },
  { key: 'short-attention-span-difficulty-concentrating', label: 'Short Attention Span/Difficulty Concentrating', category: 'Cognitive', number: 8 },
  { key: 'fatigue-low-energy', label: 'Fatigue/Low Energy', category: 'Physical/Sleep', number: 9 },
  { key: 'hard-to-make-decisions', label: 'Hard to make decisions', category: 'Cognitive', number: 10 },
  { key: 'appetite-increase-or-decrease-feeding-or-eating-problems', label: 'Appetite increase or decrease/Feeding or eating problems', category: 'Physical/Sleep', number: 11 },
  { key: 'weight-increase-or-decrease', label: 'Weight increase or decrease', category: 'Physical/Sleep', number: 12 },
  { key: 'distractible', label: 'Distractible', category: 'Cognitive', number: 13 },
  { key: 'suicidal-thoughts', label: 'Suicidal thoughts', category: 'Safety Concerns', number: 14 },
  { key: 'attempts-to-self-harm', label: 'Attempts to self-harm', category: 'Safety Concerns', number: 15 },
  { key: 'peer-conflict-mean-to-others', label: 'Peer Conflict/Mean to others', category: 'Social', number: 16 },
  { key: 'mood-swings', label: 'Mood swings', category: 'Mood/Emotional', number: 17 },
  { key: 'increased-energy', label: 'Increased energy', category: 'Physical/Sleep', number: 18 },
  { key: 'racing-thoughts', label: 'Racing thoughts', category: 'Cognitive', number: 19 },
  { key: 'bedwetting', label: 'Bedwetting', category: 'Physical/Sleep', number: 20 },
  { key: 'decreased-need-for-sleep', label: 'Decreased need for sleep', category: 'Physical/Sleep', number: 21 },
  { key: 'excessive-worry', label: 'Excessive worry', category: 'Anxiety/Worry', number: 22 },
  { key: 'feeling-on-edge', label: 'Feeling "on edge"', category: 'Anxiety/Worry', number: 23 },
  { key: 'panic-attacks', label: 'Panic Attacks', category: 'Anxiety/Worry', number: 24 },
  { key: 'destructive', label: 'Destructive', category: 'Behavioral', number: 25 },
  { key: 'restlessness', label: 'Restlessness', category: 'Anxiety/Worry', number: 26 },
  { key: 'irritability-or-anger', label: 'Irritability or Anger', category: 'Mood/Emotional', number: 27 },
  { key: 'stealing-lying-disregard-for-others', label: 'Stealing, lying, disregard for others', category: 'Behavioral', number: 28 },
  { key: 'defiance-toward-authority', label: 'Defiance toward authority', category: 'Behavioral', number: 29 },
  { key: 'impulsivity', label: 'Impulsivity', category: 'Behavioral', number: 30 },
  { key: 'nightmares', label: 'Nightmares', category: 'Other', number: 31 },
  { key: 'hearing-or-seeing-things-others-dont-see-hear', label: 'Hearing or seeing things - others don\'t see/hear', category: 'Safety Concerns', number: 32 }
]

export const SYMPTOM_CATEGORIES = {
  'Mood/Emotional': [1, 17, 27, 5], // Symptoms: Sadness, Mood swings, Irritability, Fearful
  'Behavioral': [2, 29, 30, 25, 28], // Symptoms: Temper Outbursts, Defiance, Impulsivity, Destructive, Stealing/lying
  'Cognitive': [8, 13, 10, 19, 4], // Symptoms: Short Attention Span, Distractible, Hard to make decisions, Racing thoughts, Daydreaming
  'Physical/Sleep': [9, 20, 21, 18, 11, 12, 6], // Symptoms: Fatigue, Bedwetting, Decreased sleep, Increased energy, Appetite, Weight, Clumsy
  'Social': [3, 16], // Symptoms: Withdrawn, Peer Conflict
  'Anxiety/Worry': [22, 23, 24, 26, 7], // Symptoms: Excessive worry, Feeling on edge, Panic Attacks, Restlessness, Over-reactive
  'Safety Concerns': [14, 15, 32], // Symptoms: Suicidal thoughts, Self-harm, Hearing/seeing things
  'Other': [31] // Symptoms: Nightmares
}

/**
 * Get symptoms by category in order
 * @param {string} category - Category name
 * @returns {Array} Array of symptom objects in that category, sorted by number
 */
export const getSymptomsByCategory = (category) => {
  const symptomNumbers = SYMPTOM_CATEGORIES[category] || []
  return SYMPTOMS.filter(s => symptomNumbers.includes(s.number)).sort((a, b) => a.number - b.number)
}

/**
 * Get all expected symptom keys
 * @returns {Array} Array of all symptom keys in order
 */
export const getAllSymptomKeys = () => {
  return SYMPTOMS.map(s => s.key)
}

