import { Repository } from "typeorm"
import { Quiz } from "../../entities/Quiz.entity"
import { QuizQuestion, QuestionType } from "../../entities/QuizQuestion.entity"
import { QuizOption } from "../../entities/QuizOption.entity"
import { UserQuizAttempt } from "../../entities/UserQuizAttempt.entity"
import { UserCourseProgress } from "../../entities/UserCourseProgress.entity"
import { Course } from "../../entities/Course.entity"
import { Lesson } from "../../entities/Lesson.entity"
import { LessonType } from "../../enums/index"
import { NotFoundError, ForbiddenError, ValidationError, ConflictError } from "../../shared/errors"
import { CourseService } from "./course.service"

interface CreateQuizDto {
  title: string
  passingScore?: number
  questions: {
    question: string
    type: QuestionType
    order?: number
    options: { text: string; isCorrect: boolean }[]
  }[]
}

interface SubmitQuizDto {
  answers: { questionId: string; selectedOptionIds: string[] }[]
}

export class QuizService {
  constructor(
    private readonly quizRepo: Repository<Quiz>,
    private readonly questionRepo: Repository<QuizQuestion>,
    private readonly optionRepo: Repository<QuizOption>,
    private readonly attemptRepo: Repository<UserQuizAttempt>,
    private readonly courseProgressRepo: Repository<UserCourseProgress>,
    private readonly courseRepo: Repository<Course>,
    private readonly lessonRepo: Repository<Lesson>,
    private readonly courseService: CourseService,
  ) {}

  // ─── GET /courses/:id/lessons/:lessonId/quiz ──────────────────────────────────

  async getQuiz(
    courseId: string,
    lessonId: string,
    userId: string,
  ): Promise<Quiz & { bestAttempt: UserQuizAttempt | null }> {
    const course = await this.courseRepo.findOne({ where: { id: courseId, isPublished: true } })
    if (!course) throw new NotFoundError("Course not found")

    const lesson = await this.lessonRepo.findOne({ where: { id: lessonId, courseId } })
    if (!lesson) throw new NotFoundError("Lesson not found")

    if (course.isPremium) {
      const enrollment = await this.courseProgressRepo.findOne({ where: { userId, courseId } })
      if (!enrollment) throw new ForbiddenError("Enroll in this course to access the quiz")
    }

    const quiz = await this.quizRepo.findOne({
      where: { lessonId },
      relations: ["questions", "questions.options"],
    })
    if (!quiz) throw new NotFoundError("Quiz not found for this lesson")

    // Sort questions and options by order
    quiz.questions.sort((a, b) => a.order - b.order)
    quiz.questions.forEach((q) => q.options.sort((a, b) => (a.id > b.id ? 1 : -1)))

    // Hide isCorrect from the response
    quiz.questions.forEach((q) =>
      q.options.forEach((o) => {
        delete (o as Partial<QuizOption>).isCorrect
      }),
    )

    const bestAttempt = await this.attemptRepo.findOne({
      where: { userId, quizId: quiz.id },
      order: { score: "DESC" },
    })

    return Object.assign(quiz, { bestAttempt: bestAttempt ?? null })
  }

  // ─── GET /admin/courses/:id/lessons/:lessonId/quiz ────────────────────────────
  // Admin version — no enrollment check, isCorrect visible

  async getQuizAdmin(courseId: string, lessonId: string): Promise<Quiz> {
    const lesson = await this.lessonRepo.findOne({ where: { id: lessonId, courseId } })
    if (!lesson) throw new NotFoundError("Lesson not found")

    const quiz = await this.quizRepo.findOne({
      where: { lessonId },
      relations: ["questions", "questions.options"],
    })
    if (!quiz) throw new NotFoundError("No quiz found for this lesson")

    quiz.questions.sort((a, b) => a.order - b.order)
    quiz.questions.forEach((q) => q.options.sort((a, b) => (a.id > b.id ? 1 : -1)))

    return quiz
  }

  // ─── POST /courses/:id/lessons/:lessonId/quiz/submit ─────────────────────────

  async submitQuiz(
    courseId: string,
    lessonId: string,
    userId: string,
    dto: SubmitQuizDto,
  ): Promise<UserQuizAttempt> {
    const course = await this.courseRepo.findOne({ where: { id: courseId, isPublished: true } })
    if (!course) throw new NotFoundError("Course not found")

    const lesson = await this.lessonRepo.findOne({ where: { id: lessonId, courseId } })
    if (!lesson) throw new NotFoundError("Lesson not found")

    const enrollment = await this.courseProgressRepo.findOne({ where: { userId, courseId } })
    if (!enrollment) throw new ForbiddenError("Enroll in this course first")

    const quiz = await this.quizRepo.findOne({
      where: { lessonId },
      relations: ["questions", "questions.options"],
    })
    if (!quiz) throw new NotFoundError("Quiz not found for this lesson")

    if (dto.answers.length !== quiz.questions.length) {
      throw new ValidationError("Answer count must match question count")
    }

    // Score the attempt
    let correctCount = 0

    for (const question of quiz.questions) {
      const answer = dto.answers.find((a) => a.questionId === question.id)
      if (!answer) throw new ValidationError(`Missing answer for question ${question.id}`)

      const correctOptionIds = question.options.filter((o) => o.isCorrect).map((o) => o.id)
      const selectedIds = answer.selectedOptionIds

      // For single: exactly 1 correct match; for multiple: all correct selected and no wrong ones
      const isCorrect =
        correctOptionIds.length === selectedIds.length &&
        correctOptionIds.every((id) => selectedIds.includes(id))

      if (isCorrect) correctCount++
    }

    const score = Math.round((correctCount / quiz.questions.length) * 100)
    const passed = score >= quiz.passingScore

    const attempt = this.attemptRepo.create({
      userId,
      quizId: quiz.id,
      answers: dto.answers,
      score,
      passed,
    })
    const saved = await this.attemptRepo.save(attempt)

    // Mark lesson as complete if passed
    if (passed) {
      await this.courseService.markLessonDone(lessonId, userId, enrollment, course)
    }

    return saved
  }

  // ─── ADMIN: Create quiz ───────────────────────────────────────────────────────

  async createQuiz(courseId: string, lessonId: string, dto: CreateQuizDto): Promise<Quiz> {
    const course = await this.courseRepo.findOne({ where: { id: courseId } })
    if (!course) throw new NotFoundError("Course not found")

    const lesson = await this.lessonRepo.findOne({ where: { id: lessonId, courseId } })
    if (!lesson) throw new NotFoundError("Lesson not found")

    const existing = await this.quizRepo.findOne({ where: { lessonId } })
    if (existing) throw new ConflictError("This lesson already has a quiz")

    if (dto.questions.length === 0) {
      throw new ValidationError("Quiz must have at least one question")
    }

    for (const q of dto.questions) {
      const correctCount = q.options.filter((o) => o.isCorrect).length
      if (correctCount === 0) {
        throw new ValidationError(`Question "${q.question}" must have at least one correct option`)
      }
      if (q.type === "single" && correctCount > 1) {
        throw new ValidationError(
          `Single-choice question "${q.question}" can only have one correct option`,
        )
      }
    }

    const quiz = this.quizRepo.create({
      lessonId,
      title: dto.title,
      passingScore: dto.passingScore ?? 70,
    })
    const savedQuiz = await this.quizRepo.save(quiz)

    for (const [i, qDto] of dto.questions.entries()) {
      const question = this.questionRepo.create({
        quizId: savedQuiz.id,
        question: qDto.question,
        type: qDto.type,
        order: qDto.order ?? i,
      })
      const savedQuestion = (await this.questionRepo.save(question)) as QuizQuestion

      const options = qDto.options.map((o) =>
        this.optionRepo.create({
          questionId: savedQuestion.id,
          text: o.text,
          isCorrect: o.isCorrect,
        }),
      )
      await this.optionRepo.save(options)
    }

    // Set lesson type to quiz
    lesson.type = LessonType.QUIZ
    await this.lessonRepo.save(lesson)

    return this.quizRepo.findOne({
      where: { id: savedQuiz.id },
      relations: ["questions", "questions.options"],
    }) as Promise<Quiz>
  }

  // ─── ADMIN: Update quiz metadata ──────────────────────────────────────────────

  async updateQuiz(
    courseId: string,
    lessonId: string,
    dto: Partial<Pick<CreateQuizDto, "title" | "passingScore">>,
  ): Promise<Quiz> {
    const lesson = await this.lessonRepo.findOne({ where: { id: lessonId, courseId } })
    if (!lesson) throw new NotFoundError("Lesson not found")

    const quiz = await this.quizRepo.findOne({ where: { lessonId } })
    if (!quiz) throw new NotFoundError("Quiz not found")

    if (dto.title !== undefined) quiz.title = dto.title
    if (dto.passingScore !== undefined) quiz.passingScore = dto.passingScore

    return this.quizRepo.save(quiz)
  }
}
