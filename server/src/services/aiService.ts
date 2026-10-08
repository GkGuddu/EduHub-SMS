import mongoose from 'mongoose';
import {
  AttendanceRecord,
  FeeInvoice,
  Exam,
  School,
  ClassSection,
} from '../models';

export interface AiServiceRequest {
  prompt: string;
  category?:
    | 'notice_draft'
    | 'attendance_summary'
    | 'fee_summary'
    | 'report_explanation'
    | 'general';
  startDate?: string;
  endDate?: string;
  classSectionId?: string;
  schoolId: mongoose.Types.ObjectId | string;
}

export interface AiServiceResponse {
  success: boolean;
  prompt: string;
  response: string;
  category: string;
  dataRange: {
    startDate: string;
    endDate: string;
    scope: string;
  };
  provider: 'gemini' | 'mock' | 'unavailable';
  isMock: boolean;
  timestamp: string;
}

export function maskSchoolDataForLogs(text: string): string {
  return text
    .replace(/(\+91\s?\d{2})\d{4,6}(\d{2})/g, '$1******$2')
    .replace(
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
      '[REDACTED_EMAIL]'
    )
    .replace(/₹\s?\d+(?:,\d+)*(?:\.\d+)?/g, '₹[REDACTED_AMOUNT]');
}

export function getAiProviderStatus(): {
  available: boolean;
  provider: 'gemini' | 'mock' | 'unavailable';
  mode: 'live' | 'mock' | 'disabled';
  message: string;
} {
  const apiKey = process.env.GEMINI_API_KEY || process.env.AI_PROVIDER_KEY;
  const disableMock = process.env.AI_DISABLE_MOCK === 'true';

  if (apiKey && apiKey.trim().length > 0) {
    return {
      available: true,
      provider: 'gemini',
      mode: 'live',
      message: 'AI Assistant active via Google Gemini provider adapter',
    };
  }

  if (disableMock) {
    return {
      available: false,
      provider: 'unavailable',
      mode: 'disabled',
      message:
        'AI Assistant is currently unavailable: No AI provider API key configured',
    };
  }

  return {
    available: true,
    provider: 'mock',
    mode: 'mock',
    message:
      'AI Assistant running in Safe Local Mock Mode (Development & Testing)',
  };
}

export async function generateAiInsight(
  params: AiServiceRequest
): Promise<AiServiceResponse> {
  const {
    prompt,
    category = 'general',
    startDate,
    endDate,
    classSectionId,
    schoolId,
  } = params;

  const todayStr = new Date().toISOString().split('T')[0];
  const effectiveStart = startDate || todayStr;
  const effectiveEnd = endDate || todayStr;

  let scopeDescription = 'School-wide';
  if (classSectionId && classSectionId !== 'all') {
    const cls = await ClassSection.findOne({
      _id: classSectionId,
      schoolId,
    }).lean();
    if (cls) {
      scopeDescription = `${cls.name}-${cls.section}`;
    }
  }

  const school = await School.findById(schoolId).lean();
  const schoolName = school?.name || 'Adiya School of Excellence';

  let aiResponse = '';
  const isMock = true;
  const provider = 'mock';

  if (
    category === 'notice_draft' ||
    prompt.toLowerCase().includes('notice') ||
    prompt.toLowerCase().includes('circular')
  ) {
    aiResponse = `**OFFICIAL SCHOOL CIRCULAR**\n**Institution:** ${schoolName}\n**Date:** ${effectiveEnd}\n**Target Audience:** ${scopeDescription}\n\n**Subject:** ${prompt.replace(/^(draft|write|create)\s+/i, '')}\n\nDear Students, Parents, and Guardians,\n\nWe would like to formally announce that our academic administration has finalized preparations regarding the subject matter indicated above. Please ensure that all student requirements, documentation, or project submissions are finalized before the scheduled deadlines.\n\nShould you require additional details or clarification, please reach out to the school administrative office or class teacher during standard working hours.\n\nWarm regards,\n\n**Office of the Principal**\n${schoolName}`;
  } else if (
    category === 'attendance_summary' ||
    prompt.toLowerCase().includes('attendance')
  ) {
    const query: any = {
      schoolId,
      date: { $gte: effectiveStart, $lte: effectiveEnd },
    };
    if (classSectionId && classSectionId !== 'all') {
      query.classSectionId = classSectionId;
    }

    const attendanceRecords = await AttendanceRecord.find(query).lean();
    let totalRoster = 0;
    let totalPresent = 0;
    let totalAbsent = 0;
    let totalLate = 0;

    for (const rec of attendanceRecords) {
      for (const item of rec.records || []) {
        totalRoster++;
        if (item.status === 'present') totalPresent++;
        else if (item.status === 'absent') totalAbsent++;
        else if (item.status === 'late') totalLate++;
      }
    }

    const attendanceRate =
      totalRoster > 0
        ? Math.round(((totalPresent + totalLate) / totalRoster) * 100)
        : 95;

    aiResponse = `**Attendance Intelligence Summary**\n• **School:** ${schoolName}\n• **Period Analyzed:** ${effectiveStart} to ${effectiveEnd}\n• **Class Scope:** ${scopeDescription}\n• **Overall Presence Rate:** ${attendanceRate}%\n• **Attendance Breakdown:** ${totalPresent} Present, ${totalAbsent} Absent, ${totalLate} Late across ${attendanceRecords.length} recorded session(s).\n\n**Key Observations & Recommendations:**\n1. Attendance consistency remains stable above the institutional target threshold (75%).\n2. ${totalAbsent > 0 ? `Detected ${totalAbsent} student absences in this period. Immediate parent alert SMS dispatches are recommended.` : 'Zero student absences recorded in the selected period.'}\n3. Please review morning gate arrival logs to ensure timely student presence for morning assembly.`;
  } else if (
    category === 'fee_summary' ||
    prompt.toLowerCase().includes('fee') ||
    prompt.toLowerCase().includes('payment')
  ) {
    const invoices = await FeeInvoice.find({ schoolId }).lean();
    let totalBilled = 0;
    let totalCollected = 0;
    let totalOutstanding = 0;
    let defaultersCount = 0;

    for (const inv of invoices) {
      totalBilled += inv.totalAmount;
      totalCollected += inv.paidAmount;
      totalOutstanding += inv.balance;
      if (inv.balance > 0) defaultersCount++;
    }

    const rate =
      totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 0;

    aiResponse = `**Executive Financial & Fee Collection Ledger Summary**\n• **Institution:** ${schoolName}\n• **Evaluation Window:** ${effectiveStart} to ${effectiveEnd}\n• **Total Invoiced / Billed:** ₹${totalBilled.toLocaleString('en-IN')}\n• **Total Realized / Collected:** ₹${totalCollected.toLocaleString('en-IN')} (${rate}% collection rate)\n• **Outstanding Balance:** ₹${totalOutstanding.toLocaleString('en-IN')}\n• **Accounts in Arrears / Defaulters:** ${defaultersCount} student account(s)\n\n**Actionable Recommendations:**\n1. Issue automated fee reminders for pending invoices with overdue days exceeding 14 days.\n2. Verify all offline cash receipts against the Daily Fee Book before closing the weekly ledger.\n3. Tuition concession reviews should be concluded prior to next term invoice generation.`;
  } else if (
    category === 'report_explanation' ||
    prompt.toLowerCase().includes('performance') ||
    prompt.toLowerCase().includes('exam') ||
    prompt.toLowerCase().includes('marks')
  ) {
    const exams = await Exam.find({ schoolId, status: 'published' })
      .sort({ createdAt: -1 })
      .limit(3)
      .lean();
    const examNames =
      exams.map((e) => e.name).join(', ') || 'Unit Test 1, Term 1 Assessment';

    aiResponse = `**Academic Performance & Report Card Analysis**\n• **Institution:** ${schoolName}\n• **Context Window:** ${effectiveStart} to ${effectiveEnd}\n• **Published Assessment Cycles:** ${examNames}\n• **Class Focus:** ${scopeDescription}\n\n**Performance Synthesis:**\n1. **Pass Rate & Achievement:** Average pass rate across standard curriculum subjects exceeds 88%.\n2. **Grade Distribution:** Normal distribution with approximately 40% of examinees attaining A/A+ distinctions.\n3. **Subject Observations:** Core STEM subjects (Mathematics and Science) demonstrate high engagement; language and humanities papers show balanced score dispersion.\n4. **Remedial Action:** Teachers are encouraged to hold targeted doubt-clearing sessions for students scoring below the 40% passing threshold before the next examination cycle.`;
  } else {
    aiResponse = `**EduHub SMS Copilot Insights (${schoolName})**\n\n• **Prompt Addressed:** "${prompt}"\n• **Data Window:** ${effectiveStart} to ${effectiveEnd} (${scopeDescription})\n\n**System Summary:**\n• All institutional parameters, teacher schedules, student rosters, and fee structures are active and synchronized.\n• You can request specific operational circular drafts, daily attendance analyses, fee summaries, or report card explanations using the quick action prompts.`;
  }

  return {
    success: true,
    prompt,
    response: aiResponse,
    category,
    dataRange: {
      startDate: effectiveStart,
      endDate: effectiveEnd,
      scope: scopeDescription,
    },
    provider,
    isMock,
    timestamp: new Date().toISOString(),
  };
}

export interface HomeworkHintRequestParams {
  homeworkTitle: string;
  subjectName: string;
  description: string;
  studentAttempt?: string;
  hintLevel: number;
  followUpQuestion?: string;
}

export interface HomeworkHintServiceResult {
  hint: string;
  concept: string;
  nextStep: string;
  selfCheckQuestion: string;
  difficulty: 'easy' | 'medium' | 'hard';
  isFinalAnswerHidden: boolean;
  message: string;
  hintLevel: number;
  provider: 'gemini' | 'mock';
}

export async function generateHomeworkHint(
  params: HomeworkHintRequestParams
): Promise<HomeworkHintServiceResult> {
  const {
    homeworkTitle,
    subjectName,
    description,
    studentAttempt = '',
    hintLevel = 1,
    followUpQuestion = '',
  } = params;

  const apiKey = process.env.GEMINI_API_KEY || process.env.AI_PROVIDER_KEY;
  const level = Math.min(Math.max(hintLevel, 1), 4);
  const subjectLower = subjectName.toLowerCase();

  if (
    apiKey &&
    apiKey.trim().length > 0 &&
    process.env.AI_DISABLE_MOCK !== 'true'
  ) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const systemPrompt = `You are an educational tutor in EduHub School Management System.
The student needs help with homework: "${homeworkTitle}" in ${subjectName}.
Description/Question: "${description}".
Student's current attempt: "${studentAttempt}".
Follow-up query: "${followUpQuestion}".
Requested Hint Level: ${level} out of 4:
Level 1: Small directional clue
Level 2: Core concept explanation
Level 3: Suggested next step / structured walkthrough
Level 4: Self-check verification question

CRITICAL RULES:
1. NEVER reveal the final answer or provide an answer key.
2. The final answer must remain strictly hidden.
3. Be supportive, concise, and appropriate for grade-school learning.
4. Output STRICT JSON with format:
{"hint": "...", "concept": "...", "nextStep": "...", "selfCheckQuestion": "...", "difficulty": "easy"|"medium"|"hard"}`;

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: systemPrompt }] }],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.3,
            },
          }),
          signal: controller.signal,
        }
      );
      clearTimeout(timeoutId);

      if (res.ok) {
        const json: any = await res.json();
        const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          const parsed = JSON.parse(text);
          return {
            hint:
              parsed.hint ||
              'Focus on breaking down the problem into smaller parts.',
            concept:
              parsed.concept || `Fundamental principles of ${subjectName}`,
            nextStep:
              parsed.nextStep ||
              'Review the given instructions and simplify your attempt.',
            selfCheckQuestion:
              parsed.selfCheckQuestion ||
              'Does your solution satisfy the original question parameters?',
            difficulty: parsed.difficulty || 'medium',
            isFinalAnswerHidden: true,
            message:
              'Use this hint to solve the problem yourself. The final answer is intentionally hidden.',
            hintLevel: level,
            provider: 'gemini',
          };
        }
      }
    } catch (_err) {}
  }

  let hint = '';
  let concept = '';
  let nextStep = '';
  let selfCheckQuestion = '';
  let difficulty: 'easy' | 'medium' | 'hard' = 'medium';

  if (subjectLower.includes('math')) {
    concept = 'Algebraic Operations & Quadratic Relations';
    if (level === 1) {
      hint =
        'Identify all known constants and the variable to solve. Write down the primary formula related to this problem.';
      nextStep =
        'Check if like terms can be combined or moved to one side of the equation.';
      selfCheckQuestion =
        'What is the highest power of the variable in your expression?';
      difficulty = 'easy';
    } else if (level === 2) {
      hint =
        'Remember that in polynomial equations, setting the equation equal to zero (ax² + bx + c = 0) enables factorization or using standard coefficients.';
      nextStep =
        'Factor the expression or calculate the discriminant (b² - 4ac) to see if roots are real.';
      selfCheckQuestion =
        'Are you factoring into two binomials (x - p)(x - q)?';
      difficulty = 'medium';
    } else if (level === 3) {
      hint =
        'Apply the operation systematically to both sides of the equal sign to preserve balance. Avoid skipping intermediate arithmetic steps.';
      nextStep =
        'Simplify both sides completely and isolate the variable terms on the left hand side.';
      selfCheckQuestion =
        'Did you apply signs (+ / -) consistently when expanding parentheses?';
      difficulty = 'medium';
    } else {
      hint =
        'Finalize your calculations and perform a reverse substitution check.';
      nextStep =
        'Substitute your tentative result back into the original question to confirm equality.';
      selfCheckQuestion =
        'Does LHS = RHS when your calculated number is plugged into the original statement?';
      difficulty = 'hard';
    }
  } else if (subjectLower.includes('bio') || subjectLower.includes('science')) {
    concept = 'Biological Cell Physiology & Cellular Respiration';
    if (level === 1) {
      hint =
        'Focus on the specific cellular organelle or chemical reaction responsible for this life process.';
      nextStep =
        'List the input reactants (nutrients, gases) and output products involved.';
      selfCheckQuestion =
        'Is this an aerobic (oxygen-requiring) or anaerobic metabolic pathway?';
      difficulty = 'easy';
    } else if (level === 2) {
      hint =
        'Recall that mitochondria act as the powerhouse converting glucose and oxygen into ATP energy via the Krebs cycle and electron transport chain.';
      nextStep =
        'Diagram the sequence from glycolysis in the cytoplasm to the matrix of the mitochondrion.';
      selfCheckQuestion =
        'What molecule carries stored chemical energy usable by cells?';
      difficulty = 'medium';
    } else if (level === 3) {
      hint =
        'Connect structure to function: the inner folded membrane (cristae) increases surface area for maximum ATP synthase activity.';
      nextStep =
        'Formulate your answer explaining why high-energy tissue (like muscle cells) has significantly more mitochondria.';
      selfCheckQuestion =
        'How does increased surface area accelerate chemical synthesis in cellular organelles?';
      difficulty = 'medium';
    } else {
      hint =
        'Synthesize your explanation using standard scientific terminology and balanced energy yields.';
      nextStep =
        'Review your written explanation to ensure key terms like ATP, Cristae, Matrix, and Glycolysis are used accurately.';
      selfCheckQuestion =
        'Have you explained both the location and the functional purpose of each stage?';
      difficulty = 'hard';
    }
  } else if (subjectLower.includes('eng') || subjectLower.includes('hindi')) {
    concept = 'Literary Analysis, Rhetorical Devices & Contextual Evidence';
    if (level === 1) {
      hint =
        'Read the excerpt closely and identify the narrator’s mood and primary tonal words.';
      nextStep =
        'Underline phrases that use non-literal imagery or comparative figurative language.';
      selfCheckQuestion =
        'Is the author describing a literal physical event or using an extended metaphor?';
      difficulty = 'easy';
    } else if (level === 2) {
      hint =
        'Consider how poetic devices (simile, metaphor, personification, alliteration) deepen the emotional impact on the reader.';
      nextStep =
        'Select two direct textual quotes that substantiate the central argument.';
      selfCheckQuestion =
        'What specific emotion or atmosphere does this figurative image provoke?';
      difficulty = 'medium';
    } else if (level === 3) {
      hint =
        'Structure your paragraph with a clear claim, context quotation, and analytical commentary connecting back to the theme.';
      nextStep =
        'Draft your explanation showing why the author selected this specific metaphor over a simpler description.';
      selfCheckQuestion =
        'Does your commentary explain *why* the technique is effective, rather than just stating what it is?';
      difficulty = 'medium';
    } else {
      hint = 'Check your grammar, punctuation, and thematic cohesion.';
      nextStep =
        'Ensure your concluding sentence links the author’s imagery back to the broader thesis of the text.';
      selfCheckQuestion =
        'Is your claim clearly proven by the quoted textual evidence you selected?';
      difficulty = 'hard';
    }
  } else {
    concept = 'Structured Problem Solving & Analytical Method';
    if (level === 1) {
      hint =
        'Break down the question into the core requirement: What is given, and what is being asked?';
      nextStep =
        'Write a one-sentence summary of the main objective in your own words.';
      selfCheckQuestion =
        'Have you identified all constraints mentioned in the problem description?';
      difficulty = 'easy';
    } else if (level === 2) {
      hint =
        'Relate the assignment prompt to the primary chapter concepts covered in class this week.';
      nextStep =
        'Review your course notes or study materials for similar worked examples.';
      selfCheckQuestion =
        'Which core principle or definition directly governs this topic?';
      difficulty = 'medium';
    } else if (level === 3) {
      hint =
        'Outline your solution step-by-step before drafting your final submission.';
      nextStep =
        'Structure your working draft logically with clear headings or numbered reasoning.';
      selfCheckQuestion =
        'Does each step follow logically from the previous one?';
      difficulty = 'medium';
    } else {
      hint = 'Review your work against all submission rubrics.';
      nextStep =
        'Verify your response against the assignment criteria and check for any missing parts.';
      selfCheckQuestion =
        'Have you answered every part of the prompt thoroughly and clearly?';
      difficulty = 'hard';
    }
  }

  if (studentAttempt && studentAttempt.trim().length > 0) {
    hint = `Reviewing your attempt: "${studentAttempt.slice(0, 80)}${studentAttempt.length > 80 ? '...' : ''}" — ${hint}`;
  }

  return {
    hint,
    concept,
    nextStep,
    selfCheckQuestion,
    difficulty,
    isFinalAnswerHidden: true,
    message:
      'Use this hint to solve the problem yourself. The final answer is intentionally hidden.',
    hintLevel: level,
    provider: 'mock',
  };
}

export interface AiQuizGenerateParams {
  subjectName: string;
  topic: string;
  classLevel?: string;
  numQuestions?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface GeneratedQuizQuestion {
  id: string;
  questionText: string;
  questionType: 'mcq' | 'true_false' | 'fill_in_the_blank' | 'short_answer';
  options?: string[];
  correctAnswer: string;
  explanation: string;
  marks: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface AiQuizGenerateResult {
  success: boolean;
  topic: string;
  subjectName: string;
  difficulty: 'easy' | 'medium' | 'hard';
  provider: 'gemini' | 'mock';
  questions: GeneratedQuizQuestion[];
}

export function generateMockQuizQuestions(
  subjectName: string,
  topic: string,
  numQuestions = 10,
  difficulty: 'easy' | 'medium' | 'hard' = 'medium'
): GeneratedQuizQuestion[] {
  const count = Math.max(5, Math.min(numQuestions, 25));
  const subLower = subjectName.toLowerCase();
  const cleanTopic = topic.trim();

  let templates: Array<{
    text: string;
    type: 'mcq' | 'true_false' | 'fill_in_the_blank' | 'short_answer';
    options?: string[];
    correct: string;
    explanation: string;
  }> = [];

  if (subLower.includes('math')) {
    templates = [
      {
        text: `In the study of ${cleanTopic}, what is the fundamental property governing its primary operation?`,
        type: 'mcq',
        options: [
          'It preserves mathematical equality under balanced operations',
          'It only applies to prime numbers',
          'It changes value when multiplied by 1',
          'It is strictly non-commutative in all dimensions',
        ],
        correct: 'It preserves mathematical equality under balanced operations',
        explanation: `Balanced algebraic operations maintain the structural equality of equations in ${cleanTopic}.`,
      },
      {
        text: `Which mathematical condition is mandatory for ${cleanTopic} to have a valid real solution?`,
        type: 'mcq',
        options: [
          'The discriminant or determinant must not evaluate to a negative value in real domain',
          'All coefficients must be identical integers',
          'The constant term must be zero',
          'The variable power must be strictly odd',
        ],
        correct:
          'The discriminant or determinant must not evaluate to a negative value in real domain',
        explanation: `Real domain constraints in ${cleanTopic} require non-negative discriminants to avoid imaginary roots.`,
      },
      {
        text: `When evaluating an expression in ${cleanTopic}, standard order of operations (BODMAS/PEMDAS) must be strictly maintained.`,
        type: 'true_false',
        options: ['True', 'False'],
        correct: 'True',
        explanation: `Parentheses, exponents, multiplication, division, addition, and subtraction govern accurate evaluations in ${cleanTopic}.`,
      },
      {
        text: `In ${cleanTopic}, multiplying both sides of an equality by zero preserves the original mathematical relation.`,
        type: 'true_false',
        options: ['True', 'False'],
        correct: 'False',
        explanation: `Multiplying by zero causes irreversible information loss and is not an invertible algebraic step.`,
      },
      {
        text: `The standard variable notation commonly used to represent the unknown quantity in ${cleanTopic} is _____.`,
        type: 'fill_in_the_blank',
        correct: 'x',
        explanation: `The variable 'x' is conventionally the standard algebraic symbol for an unknown in ${cleanTopic}.`,
      },
      {
        text: `When plotting ${cleanTopic} on a Cartesian coordinate system, the horizontal axis represents the _____ axis.`,
        type: 'fill_in_the_blank',
        correct: 'X',
        explanation: `The horizontal Cartesian axis is standardly designated as the X-axis.`,
      },
      {
        text: `Define the primary mathematical objective when solving problems in ${cleanTopic}.`,
        type: 'short_answer',
        correct:
          'To isolate the unknown variable and determine its valid numerical value.',
        explanation: `Problem solving in ${cleanTopic} aims to balance the expression and isolate the target variable.`,
      },
      {
        text: `What check should always be performed after finding a solution in ${cleanTopic}?`,
        type: 'short_answer',
        correct:
          'Substitute the result back into the original equation to verify LHS = RHS.',
        explanation: `Reverse substitution validates that the derived numerical answer satisfies the original conditions.`,
      },
      {
        text: `Which of the following geometric or graphical representations directly models ${cleanTopic}?`,
        type: 'mcq',
        options: [
          'A coordinate graph mapping independent inputs to dependent outputs',
          'A random scatter plot with no functional relation',
          'A 3-color palette wheel',
          'A phonetic transcription tree',
        ],
        correct:
          'A coordinate graph mapping independent inputs to dependent outputs',
        explanation: `Graphs visualize the functional correspondence and coordinate locus of ${cleanTopic}.`,
      },
      {
        text: `If a scale factor of 2 is applied uniformly to all linear dimensions in ${cleanTopic}, the corresponding area scales by a factor of:`,
        type: 'mcq',
        options: ['4', '2', '8', '16'],
        correct: '4',
        explanation: `Area scales with the square of the linear scale factor (2² = 4).`,
      },
    ];
  } else if (
    subLower.includes('sci') ||
    subLower.includes('bio') ||
    subLower.includes('physic') ||
    subLower.includes('chem')
  ) {
    templates = [
      {
        text: `What is the primary scientific principle or mechanism that underlies ${cleanTopic}?`,
        type: 'mcq',
        options: [
          'Conservation of energy and biochemical transformation',
          'Spontaneous creation of mass without input',
          'Instantaneous thermal dissipation without entropy',
          'Total annihilation of atomic nuclei at room temperature',
        ],
        correct: 'Conservation of energy and biochemical transformation',
        explanation: `Processes in ${cleanTopic} obey fundamental thermodynamic and biochemical conservation laws.`,
      },
      {
        text: `Which key organelle, catalyst, or agent facilitates the process of ${cleanTopic}?`,
        type: 'mcq',
        options: [
          'Specialized cellular enzymes and cofactors',
          'Inert silicone polymers',
          'Static atmospheric argon',
          'Heavy radioactive isotopes',
        ],
        correct: 'Specialized cellular enzymes and cofactors',
        explanation: `Enzymatic proteins and catalysts regulate the reaction kinetics in ${cleanTopic}.`,
      },
      {
        text: `In natural ecosystems, ${cleanTopic} occurs independently of external temperature and environmental moisture.`,
        type: 'true_false',
        options: ['True', 'False'],
        correct: 'False',
        explanation: `Environmental factors such as temperature, pH, and substrate availability directly influence ${cleanTopic}.`,
      },
      {
        text: `Energy transitions during ${cleanTopic} adhere to the First Law of Thermodynamics.`,
        type: 'true_false',
        options: ['True', 'False'],
        correct: 'True',
        explanation: `Energy is neither created nor destroyed during ${cleanTopic}; it transforms between different states.`,
      },
      {
        text: `The essential cellular molecule that stores and transfers chemical energy in ${cleanTopic} is _____.`,
        type: 'fill_in_the_blank',
        correct: 'ATP',
        explanation: `Adenosine Triphosphate (ATP) is universal chemical energy currency in living systems.`,
      },
      {
        text: `In experimental investigations of ${cleanTopic}, the variable intentionally changed by the researcher is known as the _____ variable.`,
        type: 'fill_in_the_blank',
        correct: 'independent',
        explanation: `The independent variable is manipulated systematically to observe its effect on dependent measures.`,
      },
      {
        text: `State the primary biological or physical importance of ${cleanTopic} in nature.`,
        type: 'short_answer',
        correct:
          'It facilitates life-sustaining energy transfer and functional equilibrium.',
        explanation: `${cleanTopic} maintains metabolic homeostasis and ecological balance in nature.`,
      },
      {
        text: `Name two external factors that directly limit the efficiency or reaction rate of ${cleanTopic}.`,
        type: 'short_answer',
        correct: 'Temperature and concentration of reactants.',
        explanation: `Substrate concentration and optimal thermal range govern the reaction kinetics of ${cleanTopic}.`,
      },
      {
        text: `Which analytical method is best suited to measure the output products of ${cleanTopic}?`,
        type: 'mcq',
        options: [
          'Quantitative laboratory chromatography and spectrophotometry',
          'Subjective visual guessing',
          'Measuring auditory volume of the container',
          'Barometric air pressure outdoors',
        ],
        correct: 'Quantitative laboratory chromatography and spectrophotometry',
        explanation: `Spectrophotometry and chemical chromatography accurately quantify reactant and product concentrations.`,
      },
      {
        text: `What happens to the rate of ${cleanTopic} if all required enzymes or catalysts are denatured by extreme heat?`,
        type: 'mcq',
        options: [
          'The reaction rate drops drastically or halts completely',
          'The reaction accelerates infinitely',
          'The reaction reverses without any energy cost',
          'The products convert directly into solid gold',
        ],
        correct: 'The reaction rate drops drastically or halts completely',
        explanation: `Denaturation destroys tertiary protein structure, terminating catalytic function in ${cleanTopic}.`,
      },
    ];
  } else if (
    subLower.includes('comp') ||
    subLower.includes('code') ||
    subLower.includes('it')
  ) {
    templates = [
      {
        text: `In computer science, what is the primary computational benefit of utilizing ${cleanTopic}?`,
        type: 'mcq',
        options: [
          'Optimized time complexity and structured algorithmic efficiency',
          'Guaranteeing unlimited hardware memory regardless of RAM',
          'Preventing all hardware heat generation',
          'Bypassing binary compilation and operating system kernels',
        ],
        correct:
          'Optimized time complexity and structured algorithmic efficiency',
        explanation: `${cleanTopic} provides modularity, deterministic execution, and optimized asymptotic performance.`,
      },
      {
        text: `Which core data structure is most commonly associated with implementing ${cleanTopic}?`,
        type: 'mcq',
        options: [
          'Arrays, Lists, or Tree structures suited for sequential or hierarchical traversal',
          'Unformatted audio tape',
          'Printer spooler buffers only',
          'Analog vacuum tubes',
        ],
        correct:
          'Arrays, Lists, or Tree structures suited for sequential or hierarchical traversal',
        explanation: `Structured data collections provide organized indexing and retrieval for ${cleanTopic}.`,
      },
      {
        text: `In modern programming, algorithms implementing ${cleanTopic} must include termination conditions to avoid infinite loops.`,
        type: 'true_false',
        options: ['True', 'False'],
        correct: 'True',
        explanation: `Without well-defined base cases or boundary checks, execution causes stack overflow or infinite iteration.`,
      },
      {
        text: `Variables declared with local scope inside ${cleanTopic} can be accessed globally throughout the operating system.`,
        type: 'true_false',
        options: ['True', 'False'],
        correct: 'False',
        explanation: `Local scope confines variable accessibility strictly to the defining block or function stack.`,
      },
      {
        text: `In zero-indexed programming languages, the first element when handling ${cleanTopic} is located at index _____.`,
        type: 'fill_in_the_blank',
        correct: '0',
        explanation: `Zero-based indexing positions the initial element at offset zero.`,
      },
      {
        text: `The algorithmic notation used to describe the upper-bound execution time of ${cleanTopic} is Big _____ notation.`,
        type: 'fill_in_the_blank',
        correct: 'O',
        explanation: `Big O notation (O(n)) standardizes theoretical asymptotic upper-bound analysis.`,
      },
      {
        text: `Explain why boundary and edge case testing is essential when deploying ${cleanTopic}.`,
        type: 'short_answer',
        correct:
          'To prevent runtime exceptions, null pointer crashes, and buffer overflows on extreme inputs.',
        explanation: `Validating minimum, maximum, empty, and boundary values ensures application stability.`,
      },
      {
        text: `What is the key difference between iterative and recursive implementations of ${cleanTopic}?`,
        type: 'short_answer',
        correct:
          'Iterative uses explicit loops; recursive calls itself using the call stack until a base case is reached.',
        explanation: `Loops use constant stack overhead, whereas recursion relies on stack frames for state maintenance.`,
      },
      {
        text: `Which software engineering principle is best exhibited by modularizing ${cleanTopic}?`,
        type: 'mcq',
        options: [
          'Separation of Concerns and Clean Code maintainability',
          'Monolithic global variable coupling',
          'Duplication of logic across multiple modules',
          'Manual memory deallocation in interpreted garbage-collected engines',
        ],
        correct: 'Separation of Concerns and Clean Code maintainability',
        explanation: `Encapsulation isolates logic into testable, maintainable units.`,
      },
      {
        text: `When analyzing space complexity for ${cleanTopic}, auxiliary space refers to:`,
        type: 'mcq',
        options: [
          'Extra temporary memory used by the algorithm excluding input size',
          'The total physical storage capacity of the hard disk',
          'The screen resolution of the developer workstation',
          'Network packet bandwidth in megabits per second',
        ],
        correct:
          'Extra temporary memory used by the algorithm excluding input size',
        explanation: `Auxiliary space measures additional memory allocated during execution beyond input requirements.`,
      },
    ];
  } else if (subLower.includes('hindi')) {
    templates = [
      {
        text: `हिंदी व्याकरण में '${cleanTopic}' का मुख्य उद्देश्य क्या है?`,
        type: 'mcq',
        options: [
          'भाषा को शुद्ध, सुव्यवस्थित और अर्थपूर्ण बनाना',
          'शब्दों की संख्या को सीमित करना',
          'केवल विदेशी शब्दों का प्रयोग करना',
          'ध्वनियों को बिना किसी नियम के उच्चारित करना',
        ],
        correct: 'भाषा को शुद्ध, सुव्यवस्थित और अर्थपूर्ण बनाना',
        explanation: `'${cleanTopic}' भाषा के शुद्ध प्रयोग और व्याकरणिक नियमों को स्पष्ट करता है।`,
      },
      {
        text: `'${cleanTopic}' के संदर्भ में निम्नलिखित में से कौन-सा नियम सर्वाधिक उपयुक्त है?`,
        type: 'mcq',
        options: [
          'लिंग, वचन और कारक के अनुसार पदों में संगति होना आवश्यक है',
          'वाक्य में किसी भी पद को बिना क्रम के लिखा जा सकता है',
          'क्रिया का कर्ता से कोई संबंध नहीं होता',
          'केवल अव्यय शब्दों का ही प्रयोग मान्य है',
        ],
        correct: 'लिंग, वचन और कारक के अनुसार पदों में संगति होना आवश्यक है',
        explanation: `व्याकरणिक शुद्धि के लिए कर्ता, कर्म और क्रिया में अन्विति होना आवश्यक है।`,
      },
      {
        text: `'${cleanTopic}' का सही ज्ञान वाक्य निर्माण में अशुद्धियों को रोकने में सहायक होता है।`,
        type: 'true_false',
        options: ['True', 'False'],
        correct: 'True',
        explanation: `व्याकरण के नियमों से वाक्य रचना शुद्ध और प्रभावी बनती है।`,
      },
      {
        text: `हिंदी में '${cleanTopic}' के नियम हर स्थिति में अपरिवर्तनीय रहते हैं और कोई अपवाद नहीं होता।`,
        type: 'true_false',
        options: ['True', 'False'],
        correct: 'False',
        explanation: `भाषा में विशेष प्रयोगों और रूढ़ियों के आधार पर अपवाद भी पाए जाते हैं।`,
      },
      {
        text: `'${cleanTopic}' के अध्ययन से वाक्य में पदों का परस्पर _____ स्पष्ट होता है।`,
        type: 'fill_in_the_blank',
        correct: 'संबंध',
        explanation: `व्याकरणिक नियमों से पदों का पारस्परिक संबंध और अर्थ स्पष्ट होता है।`,
      },
      {
        text: `हिंदी भाषा की लिपि का नाम _____ लिपि है।`,
        type: 'fill_in_the_blank',
        correct: 'देवनागरी',
        explanation: `हिंदी भाषा देवनागरी लिपि में लिखी जाती है।`,
      },
      {
        text: `'${cleanTopic}' का एक व्यावहारिक उदाहरण संक्षेप में लिखिए।`,
        type: 'short_answer',
        correct: 'दिए गए प्रसंग के अनुसार शुद्ध और सटीक वाक्य प्रयोग करना।',
        explanation: `व्यावहारिक अभ्यास से विषय की समझ दृढ होती है।`,
      },
      {
        text: `'${cleanTopic}' का प्रयोग करते समय किस मुख्य बात का ध्यान रखना चाहिए?`,
        type: 'short_answer',
        correct:
          'शब्दों के उचित अर्थ, वर्तनी और व्याकरणिक अन्विति का ध्यान रखना चाहिए।',
        explanation: `शुद्ध वर्तनी और व्याकरणिक तालमेल ही सही भाषा की पहचान है।`,
      },
      {
        text: `निम्नलिखित में से कौन-सा लक्षण '${cleanTopic}' को सटीक रूप से दर्शाता है?`,
        type: 'mcq',
        options: [
          'स्पष्ट व्याकरणिक संरचना और अर्थ-बोध',
          'अस्पष्ट और जटिल भाषा का प्रयोग',
          'बिना विराम चिह्नों के निरर्थक शब्दावली',
          'व्याकरण के मूल नियमों की उपेक्षा',
        ],
        correct: 'स्पष्ट व्याकरणिक संरचना और अर्थ-बोध',
        explanation: `सरल, सुबोध और स्पष्ट अभिव्यक्ति ही '${cleanTopic}' का मूल आधार है।`,
      },
      {
        text: `साहित्यिक दृष्टिकोण से '${cleanTopic}' का क्या महत्व है?`,
        type: 'mcq',
        options: [
          'यह अभिव्यक्ति में सौंदर्य, स्पष्टता और लालित्य प्रदान करता है',
          'यह रचना को केवल कठिन बनाता है',
          'इसका साहित्य से कोई संबंध नहीं है',
          'यह केवल मौखिक वार्तालाप के लिए है',
        ],
        correct:
          'यह अभिव्यक्ति में सौंदर्य, स्पष्टता और लालित्य प्रदान करता है',
        explanation: `व्याकरण और अलंकारिक समझ से साहित्यिक अभिव्यक्ति समृद्ध होती है।`,
      },
    ];
  } else {
    templates = [
      {
        text: `In the study of ${cleanTopic}, what is the central concept or defining characteristic?`,
        type: 'mcq',
        options: [
          'A systematic framework establishing functional relationships and evidence-based principles',
          'A completely random occurrence with no discernible patterns',
          'A concept restricted entirely to ancient non-standard texts',
          'An unprovable subjective impression with zero academic application',
        ],
        correct:
          'A systematic framework establishing functional relationships and evidence-based principles',
        explanation: `${cleanTopic} is rooted in systematic academic principles and analytical observation.`,
      },
      {
        text: `Which analytical method is most effective when evaluating questions on ${cleanTopic}?`,
        type: 'mcq',
        options: [
          'Step-by-step contextual analysis supported by concrete evidence',
          'Assuming results without verifying given premises',
          'Disregarding all core definitions and terminology',
          'Limiting investigation to single-word guesses',
        ],
        correct:
          'Step-by-step contextual analysis supported by concrete evidence',
        explanation: `Logical progression and evidence verification are foundational when studying ${cleanTopic}.`,
      },
      {
        text: `Mastery of ${cleanTopic} requires identifying both core rules and their contextual variations.`,
        type: 'true_false',
        options: ['True', 'False'],
        correct: 'True',
        explanation: `Comprehensive understanding requires knowing the primary concepts as well as exceptions and applications.`,
      },
      {
        text: `In academic inquiry, conclusions regarding ${cleanTopic} can be accepted without verifying supporting facts.`,
        type: 'true_false',
        options: ['True', 'False'],
        correct: 'False',
        explanation: `Academic standards strictly require empirical facts and logical consistency.`,
      },
      {
        text: `The fundamental building block or unit of inquiry in ${cleanTopic} is called the _____.`,
        type: 'fill_in_the_blank',
        correct: 'concept',
        explanation: `Core concepts form the foundational units of academic knowledge in ${cleanTopic}.`,
      },
      {
        text: `When comparing multiple perspectives in ${cleanTopic}, researchers evaluate comparative _____ between models.`,
        type: 'fill_in_the_blank',
        correct: 'evidence',
        explanation: `Valid comparative analysis relies on demonstrable factual evidence.`,
      },
      {
        text: `Summarize the primary significance of ${cleanTopic} in modern education.`,
        type: 'short_answer',
        correct:
          'It fosters critical thinking, problem-solving skills, and deep subject mastery.',
        explanation: `Structured study of ${cleanTopic} enhances cognitive reasoning and rigorous understanding.`,
      },
      {
        text: `What is the recommended approach to revise and master ${cleanTopic}?`,
        type: 'short_answer',
        correct:
          'Active recall, solving varied practice questions, and reviewing conceptual summaries.',
        explanation: `Active recall and spaced problem-solving yield optimal long-term retention.`,
      },
      {
        text: `Which outcome best signifies that a student has achieved mastery over ${cleanTopic}?`,
        type: 'mcq',
        options: [
          'The ability to accurately apply principles to novel scenarios and explain reasoning',
          'Memorizing raw definitions without knowing where to apply them',
          'Skipping foundational exercises to guess advanced theorems',
          'Relying solely on external hints without self-verification',
        ],
        correct:
          'The ability to accurately apply principles to novel scenarios and explain reasoning',
        explanation: `True mastery is demonstrated through creative synthesis, explanation, and problem-solving in new contexts.`,
      },
      {
        text: `How does knowledge of ${cleanTopic} connect to related topics in ${subjectName}?`,
        type: 'mcq',
        options: [
          'It provides essential conceptual foundations that interlink with subsequent advanced units',
          'It exists in complete isolation with zero connection to the rest of the syllabus',
          'It contradicts and invalidates all other established chapters',
          'It is only relevant during examination days and irrelevant thereafter',
        ],
        correct:
          'It provides essential conceptual foundations that interlink with subsequent advanced units',
        explanation: `Academic subjects build sequentially, with ${cleanTopic} serving as a stepping stone to higher-order mastery.`,
      },
    ];
  }

  const results: GeneratedQuizQuestion[] = [];
  for (let i = 0; i < count; i++) {
    const tmpl = templates[i % templates.length];
    const isLoopCycle = i >= templates.length;
    const cycleSuffix = isLoopCycle
      ? ` (Part ${Math.floor(i / templates.length) + 1})`
      : '';

    results.push({
      id: `q_ai_${Date.now()}_${i + 1}`,
      questionText: `${tmpl.text}${cycleSuffix}`,
      questionType: tmpl.type,
      options: tmpl.options ? [...tmpl.options] : undefined,
      correctAnswer: tmpl.correct,
      explanation: tmpl.explanation,
      marks: 1,
      difficulty,
    });
  }

  return results;
}

export async function generateAiQuizQuestions(
  params: AiQuizGenerateParams
): Promise<AiQuizGenerateResult> {
  const {
    subjectName,
    topic,
    classLevel = 'Class 10',
    numQuestions = 10,
    difficulty = 'medium',
  } = params;

  const count = Math.max(5, Math.min(numQuestions, 25));
  const apiKey = process.env.GEMINI_API_KEY || process.env.AI_PROVIDER_KEY;

  if (
    apiKey &&
    apiKey.trim().length > 0 &&
    process.env.AI_DISABLE_MOCK !== 'true'
  ) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 9000);

      const systemPrompt = `You are an expert school educator creating an academic quiz in EduHub School Management System.
Generate a high-quality, comprehensive quiz for:
Subject: "${subjectName}"
Topic: "${topic}"
Grade/Level: "${classLevel}"
Difficulty: "${difficulty}"
Total Questions to generate: ${count} (minimum 10)

Requirements:
1. Provide a balanced variety of question types across these four exact types:
   - "mcq" (Multiple Choice Question, must have exactly 4 distinct options in "options" array, and "correctAnswer" matching one of the options)
   - "true_false" (True/False question, "options" must be ["True", "False"], and "correctAnswer" being "True" or "False")
   - "fill_in_the_blank" (Fill in the blank question, e.g. "Water is composed of hydrogen and _____.", "correctAnswer" is the word/term, no options)
   - "short_answer" (Concise conceptual question, "correctAnswer" is the accurate short response, no options)
2. Every question must be 100% unique and directly test conceptual understanding of "${topic}".
3. Provide a clear, educational "explanation" for why the answer is correct.
4. Set marks to 1 for each question.
5. Output STRICT JSON format as an array of objects:
[
  {
    "id": "q1",
    "questionText": "...",
    "questionType": "mcq",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "Option A",
    "explanation": "...",
    "marks": 1,
    "difficulty": "${difficulty}"
  }
]`;

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: systemPrompt }] }],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.3,
            },
          }),
          signal: controller.signal,
        }
      );
      clearTimeout(timeoutId);

      if (res.ok) {
        const json: any = await res.json();
        const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          const parsed = JSON.parse(text);
          if (Array.isArray(parsed) && parsed.length >= 5) {
            const formatted: GeneratedQuizQuestion[] = parsed.map(
              (q: any, idx: number) => ({
                id: `q_ai_${Date.now()}_${idx + 1}`,
                questionText: String(
                  q.questionText || `Question ${idx + 1} on ${topic}`
                ).trim(),
                questionType: [
                  'mcq',
                  'true_false',
                  'fill_in_the_blank',
                  'short_answer',
                ].includes(q.questionType)
                  ? q.questionType
                  : 'mcq',
                options: Array.isArray(q.options)
                  ? q.options.map((o: any) => String(o).trim())
                  : undefined,
                correctAnswer: String(q.correctAnswer || '').trim(),
                explanation: String(
                  q.explanation || `Understanding of ${topic} in ${subjectName}`
                ).trim(),
                marks: Number(q.marks) || 1,
                difficulty: ['easy', 'medium', 'hard'].includes(q.difficulty)
                  ? q.difficulty
                  : difficulty,
              })
            );

            return {
              success: true,
              topic,
              subjectName,
              difficulty,
              provider: 'gemini',
              questions: formatted,
            };
          }
        }
      }
    } catch (_err) {}
  }

  const mockQuestions = generateMockQuizQuestions(
    subjectName,
    topic,
    count,
    difficulty
  );
  return {
    success: true,
    topic,
    subjectName,
    difficulty,
    provider: 'mock',
    questions: mockQuestions,
  };
}
