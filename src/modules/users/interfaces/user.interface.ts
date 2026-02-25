import { EnglishLevel, LearningGoal } from "../../../enums/index"

export interface UpdateProfileParams {
  username?: string
  displayName?: string
  bio?: string
  nativeLanguage?: string
  englishLevel?: EnglishLevel
  learningGoal?: LearningGoal
  country?: string
  timezone?: string
}
