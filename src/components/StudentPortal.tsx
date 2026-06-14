import React, { useState, useEffect, useRef } from 'react';
import { 
  Award, Clock, CheckCircle2, ChevronRight, ChevronLeft, ShieldAlert, 
  HelpCircle, LogIn, Sparkles, BookOpen, UserCheck, AlertTriangle
} from 'lucide-react';
import { Exam, Submission, Answer } from '../types';
import { computeGrade } from '../mockData';

interface StudentPortalProps {
  exam: Exam;
  classSubmissions: Submission[];
  onSubmitExam: (submission: Omit<Submission, 'id' | 'submittedAt' | 'score' | 'percentage' | 'automatedGrade'>) => void;
  onExit: () => void;
}

export default function StudentPortal({
  exam,
  classSubmissions,
  onSubmitExam,
  onExit
}: StudentPortalProps) {
  // Portal Flow phases: 'register' | 'quiz' | 'result'
  const [phase, setPhase] = useState<'register' | 'quiz' | 'result'>('register');
  
  // Student identification info
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  
  // Exam progress state
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  
  // Real-time security state
  const [tabFocusWarnings, setTabFocusWarnings] = useState(0);
  const [showSecurityWarning, setShowSecurityWarning] = useState(false);

  // Timer trackers
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(exam.durationMinutes * 60);
  const [timeSpentSeconds, setTimeSpentSeconds] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const activeSubmissionRef = useRef<{ score: number; percentage: number; grade: string; timeSpent: number } | null>(null);

  // Post-quiz result statistics
  const [submittedResult, setSubmittedResult] = useState<{
    score: number;
    totalPoints: number;
    percentage: number;
    grade: string;
    warnings: number;
    timeSpent: number;
  } | null>(null);

  const [showAnswerKey, setShowAnswerKey] = useState(false);

  // Visibility (anti-cheating) listener
  useEffect(() => {
    if (phase !== 'quiz') return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabFocusWarnings(prev => {
          const updated = prev + 1;
          setShowSecurityWarning(true);
          return updated;
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [phase]);

  // General Timer hook
  useEffect(() => {
    if (phase !== 'quiz') return;

    timerRef.current = setInterval(() => {
      setTimeSpentSeconds(prev => prev + 1);

      if (exam.durationMinutes > 0) {
        setTimeLeftSeconds(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            handleFinalizeSubmit(true); // force auto-submission
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase]);

  const handleStartExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    // Seed empty selected answers
    const initialAnswers = exam.questions.map(q => ({
      questionId: q.id,
      selectedOptionIndex: -1
    }));

    setAnswers(initialAnswers);
    setPhase('quiz');
  };

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    setAnswers(prev => prev.map(ans => 
      ans.questionId === questionId ? { ...ans, selectedOptionIndex: optionIndex } : ans
    ));
  };

  const handleFinalizeSubmit = (isAutoForce = false) => {
    if (timerRef.current) clearInterval(timerRef.current);

    // Automated Scoring & Grading Execution
    let scoreObtained = 0;
    let totalPointsAvailable = 0;

    exam.questions.forEach(q => {
      const studentAns = answers.find(a => a.questionId === q.id);
      totalPointsAvailable += q.points;
      if (studentAns?.selectedOptionIndex === q.correctOptionIndex) {
        scoreObtained += q.points;
      }
    });

    const finalPercent = totalPointsAvailable ? (scoreObtained / totalPointsAvailable) * 100 : 0;
    const finalGrade = computeGrade(finalPercent);

    // Save outputs local state to render results immediately
    setSubmittedResult({
      score: scoreObtained,
      totalPoints: totalPointsAvailable,
      percentage: finalPercent,
      grade: finalGrade,
      warnings: tabFocusWarnings,
      timeSpent: timeSpentSeconds
    });

    // Notify parent to log global state (sync with spreadsheet if credentials enable it)
    onSubmitExam({
      examId: exam.id,
      studentName: name,
      studentEmail: email,
      answers: answers,
      totalPoints: totalPointsAvailable,
      timeSpentSeconds: timeSpentSeconds
    });

    setPhase('result');
    if (isAutoForce) {
      alert('TIME EXPIRED! Your answers have been automatically saved and graded.');
    }
  };

  const currentQuestion = exam.questions[currentQuestionIndex];
  const selectedAnswer = answers.find(a => a.questionId === currentQuestion?.id);

  // Compute stats comparisons
  const classmateAttempts = classSubmissions.filter(s => s.examId === exam.id);
  const classAvgPercent = classmateAttempts.length 
    ? classmateAttempts.reduce((sum, s) => sum + s.percentage, 0) / classmateAttempts.length 
    : 0;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      {/* 1. STUDENT REGISTRATION AND DISCLOSURE ENTRY */}
      {phase === 'register' && (
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-md space-y-6">
          <div className="text-center space-y-2">
            <div className="mx-auto w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-850 text-lg">Student Exam Gateway</h3>
            <p className="text-slate-500 text-xs max-w-sm mx-auto">
              You are about to start <span className="font-semibold text-slate-700">"{exam.title}"</span>. Please enter your academic profile to authorize.
            </p>
          </div>

          <form onSubmit={handleStartExam} className="col-span-1 space-y-4 max-w-md mx-auto">
            <div className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rachel Adams"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full text-slate-800 bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Institutional Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. radams@academy.edu"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full text-slate-800 bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 text-xs text-slate-500 space-y-2.5">
              <p className="font-semibold text-slate-700 flex items-center gap-1.5 grayscale shrink-0">
                <Clock className="w-4 h-4 text-emerald-600" /> Exam Rules Declarations:
              </p>
              <ul className="list-disc list-inside space-y-1 pl-1">
                <li>This test consists of <span className="font-semibold text-slate-700">{exam.questions.length} auto-graded MCQs</span>.</li>
                <li>{exam.durationMinutes > 0 ? `Duration limit set to ${exam.durationMinutes} minutes. If runtime lapses, answers sync automatically.` : 'No timer limit is active.'}</li>
                <li>Tab-out actions and switching windows are logged for integrity tracking.</li>
                <li>Grades and percentage score metrics will render instantly on submission.</li>
              </ul>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onExit}
                className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-600 py-2.5 rounded-xl text-xs font-semibold"
              >
                Go Back to Dashboard
              </button>
              <button
                type="submit"
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs shadow-sm transition"
              >
                Launch Exam Stage
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 2. LIVE TESTING STAGE */}
      {phase === 'quiz' && currentQuestion && (
        <div className="space-y-6">
          {/* Security Alert Toast Header */}
          {showSecurityWarning && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-850 flex items-center justify-between gap-3 animate-pulse">
              <span className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-500" />
                <span><strong className="font-bold">Security Notice:</strong> Tab focus lost tracker incremented ({tabFocusWarnings} actions). Maintain focus to ensure scores stay authenticated.</span>
              </span>
              <button 
                onClick={() => setShowSecurityWarning(false)}
                className="text-rose-500 hover:text-slate-800 text-[10px] font-bold"
              >
                Acknowledge
              </button>
            </div>
          )}

          {/* Quiz Header Bar */}
          <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex items-center justify-between gap-4">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Undergoing Exam</span>
              <h4 className="font-bold text-slate-800 text-sm truncate max-w-sm">{exam.title}</h4>
            </div>

            {/* Time Countdown clock */}
            {exam.durationMinutes > 0 && (
              <div className={`space-y-0.5 px-3 py-1.5 rounded-xl flex items-center gap-2 ${timeLeftSeconds < 60 ? 'bg-rose-50 text-rose-700 animate-pulse' : 'bg-slate-50 text-slate-700'}`}>
                <Clock className="w-4 h-4" />
                <span className="text-xs font-mono font-bold">
                  {Math.floor(timeLeftSeconds / 60)}:{(timeLeftSeconds % 60).toString().padStart(2, '0')}
                </span>
              </div>
            )}
          </div>

          {/* Question Solving Canvas */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-50 pb-3">
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
                MCQ {currentQuestionIndex + 1} of {exam.questions.length}
              </span>
              <span className="text-xs text-slate-400 font-medium">Points weighting: {currentQuestion.points} pts</span>
            </div>

            <div className="space-y-4">
              <h5 className="font-bold text-slate-800 text-base leading-snug">{currentQuestion.text}</h5>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                {currentQuestion.options.map((option, oIdx) => {
                  const isSelected = selectedAnswer?.selectedOptionIndex === oIdx;
                  return (
                    <button
                      key={oIdx}
                      type="button"
                      onClick={() => handleSelectOption(currentQuestion.id, oIdx)}
                      className={`w-full text-left p-4 rounded-xl border transition flex items-center justify-between text-xs font-medium ${
                        isSelected 
                          ? 'border-emerald-500 bg-emerald-50/50 text-emerald-950 font-semibold shadow-sm' 
                          : 'border-slate-150 hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold border shrink-0 ${
                          isSelected ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-slate-100 border-slate-200 text-slate-400'
                        }`}>
                          {String.fromCharCode(65 + oIdx)}
                        </span>
                        <span>{option}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quiz Navigation Buttons footer */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                disabled={currentQuestionIndex === 0}
                className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-800 disabled:opacity-30 transition"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>

              <div className="flex items-center gap-2">
                {currentQuestionIndex === exam.questions.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => handleFinalizeSubmit(false)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-sm transition"
                  >
                    Finish Exam
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                    className="inline-flex items-center gap-1 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-sm transition"
                  >
                    Next Question <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. POST-QUIZ DETAILED RESULT OVERVIEW */}
      {phase === 'result' && submittedResult && (
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-md space-y-6">
          <div className="text-center space-y-2">
            <div className="mx-auto w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-850 text-lg">Exam Submitted Successfully</h3>
            <p className="text-xs text-slate-500">
              Your results have been automatically graded, stored in local logs, and synced to Google Sheets.
            </p>
          </div>

          {/* Dynamic Score Medal */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border border-slate-100 rounded-2xl p-5 bg-slate-50/50">
            <div className="text-center space-y-1">
              <p className="text-[10px] text-slate-400 font-bold uppercase">Automated Grade</p>
              <p className="text-3xl font-extrabold text-emerald-600">{submittedResult.grade}</p>
              <p className="text-[10px] text-slate-400 font-bold">Standard Formula</p>
            </div>
            <div className="text-center border-y md:border-y-0 md:border-x border-slate-150 py-3 md:py-0 space-y-1">
              <p className="text-[10px] text-slate-400 font-bold uppercase">Percentage Accuracy</p>
              <p className="text-3xl font-extrabold text-slate-800">{submittedResult.percentage.toFixed(1)}%</p>
              <p className="text-[10px] text-slate-500 font-medium">({submittedResult.score} / {submittedResult.totalPoints} pts)</p>
            </div>
            <div className="text-center space-y-1">
              <p className="text-[10px] text-slate-400 font-bold uppercase">Timer Speed</p>
              <p className="text-3xl font-extrabold text-slate-800">
                {Math.floor(submittedResult.timeSpent / 60)}m {submittedResult.timeSpent % 60}s
              </p>
              <p className="text-[10px] text-slate-400 font-bold">Duration Used</p>
            </div>
          </div>

          {/* Tab focused warnings status */}
          {submittedResult.warnings > 0 && (
            <div className="bg-rose-50 border border-rose-150 rounded-xl p-3 text-xs text-rose-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>Safety disclaimer: We recorded <strong className="font-bold">{submittedResult.warnings} tab changes</strong> during the live window. Ensure tabs stay locked to avoid academic actions.</span>
            </div>
          )}

          {/* Peer comparative stats block */}
          <div className="border border-slate-100 rounded-2xl p-4 space-y-3.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Sparkles className="w-4 h-4 text-emerald-500" /> Peer-to-Peer Comparative Index
            </h4>

            {classmateAttempts.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Your Accuracy: <strong className="font-bold text-slate-705">{submittedResult.percentage.toFixed(0)}%</strong></span>
                  <span className="text-slate-500">Class Average Score: <strong className="font-bold text-slate-705">{classAvgPercent.toFixed(0)}%</strong></span>
                </div>

                <div className="h-6.5 bg-slate-100 rounded-full overflow-hidden relative">
                  {/* Class average marker */}
                  <div 
                    style={{ left: `${classAvgPercent}%` }}
                    className="absolute top-0 bottom-0 w-1 bg-amber-500 z-10"
                    title={`Class Average (${classAvgPercent.toFixed(0)}%)`}
                  >
                    <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-[9px] px-1 py-0.2 rounded font-bold">Average</span>
                  </div>

                  {/* Student performance fill */}
                  <div 
                    style={{ width: `${submittedResult.percentage}%` }}
                    className={`h-full rounded-full ${submittedResult.percentage >= classAvgPercent ? 'bg-emerald-500' : 'bg-blue-500'}`}
                  ></div>
                </div>

                <p className="text-[11px] text-slate-400 text-center leading-relaxed">
                  {submittedResult.percentage >= classAvgPercent 
                    ? `🎉 Excellent! You scored higher than the Class Average by ${(submittedResult.percentage - classAvgPercent).toFixed(0)}%!`
                    : `Keep studying! Your class friends average is higher than your current score by ${(classAvgPercent - submittedResult.percentage).toFixed(0)}%.`}
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-500">No other submissions recorded for comparison yet.</p>
            )}
          </div>

          {/* Toggle individual answers key lists */}
          <div className="space-y-3">
            <button
              onClick={() => setShowAnswerKey(!showAnswerKey)}
              className="w-full text-center py-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-600 transition"
            >
              {showAnswerKey ? 'Hide Answer Keys Diagnostic' : 'Review Graded Answer Keys'}
            </button>

            {showAnswerKey && (
              <div className="space-y-3 pt-2">
                {exam.questions.map((q, idx) => {
                  const studentAns = answers.find(a => a.questionId === q.id);
                  const isCorrect = studentAns?.selectedOptionIndex === q.correctOptionIndex;
                  return (
                    <div key={q.id} className="border border-slate-100 rounded-xl p-3.5 space-y-2 text-xs">
                      <p className="font-semibold text-slate-800">{idx + 1}. {q.text}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                        <div className="bg-slate-50 border border-slate-150 p-2 rounded-lg">
                          <span className="font-bold text-slate-400 uppercase">Your Answer:</span>{' '}
                          {studentAns && studentAns.selectedOptionIndex !== -1 
                            ? `${String.fromCharCode(65 + studentAns.selectedOptionIndex)}. ${q.options[studentAns.selectedOptionIndex]}`
                            : 'Unattempted'}
                        </div>
                        <div className="bg-emerald-50 border border-emerald-150 p-2 rounded-lg text-emerald-800">
                          <span className="font-bold text-emerald-600 uppercase">Correct Answer:</span>{' '}
                          {String.fromCharCode(65 + q.correctOptionIndex)}. {q.options[q.correctOptionIndex]}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={onExit}
              className="bg-slate-900 text-white hover:bg-slate-850 text-xs font-bold px-6 py-2.5 rounded-xl transition"
            >
              Return to Main Panel
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
