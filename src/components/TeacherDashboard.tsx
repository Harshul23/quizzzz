import React, { useState } from 'react';
import { 
  Plus, Copy, Check, Users, FileSpreadsheet, Award, BarChart3, Clock, 
  HelpCircle, Eye, RefreshCw, LogIn, ExternalLink, Trash2, ArrowUpRight, 
  ChevronRight, AlertCircle, ShieldAlert
} from 'lucide-react';
import { Exam, Submission } from '../types';
import { computeGrade } from '../mockData';
import { createExamSpreadsheet, appendSubmissionToSheet } from '../utils/googleSheets';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Legend, ScatterChart, Scatter, Cell
} from 'recharts';

interface TeacherDashboardProps {
  exams: Exam[];
  submissions: Submission[];
  accessToken: string | null;
  onLogin: () => void;
  onLogout: () => void;
  onCreateExam: (exam: Exam) => void;
  onDeleteExam: (examId: string) => void;
  onUpdateExamSheet: (examId: string, sheetId: string, sheetUrl: string) => void;
  onSyncSubmissionsToSheet: (examId: string) => Promise<void>;
  isSyncing: boolean;
}

export default function TeacherDashboard({
  exams,
  submissions,
  accessToken,
  onLogin,
  onLogout,
  onCreateExam,
  onDeleteExam,
  onUpdateExamSheet,
  onSyncSubmissionsToSheet,
  isSyncing
}: TeacherDashboardProps) {
  // Navigation internal tabs: "analytics" | "exams" | "reports" | "sheets"
  const [activeTab, setActiveTab] = useState<'analytics' | 'exams' | 'reports' | 'sheets'>('analytics');
  
  // Selected Exam for reports and analytics filter
  const [selectedExamId, setSelectedExamId] = useState<string>(exams[0]?.id || '');
  
  // Create exam modal or inline form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newDuration, setNewDuration] = useState(15);
  const [newQuestions, setNewQuestions] = useState<Array<{
    text: string;
    options: string[];
    correctIndex: number;
    points: number;
  }>>([
    { text: '', options: ['', '', '', ''], correctIndex: 0, points: 10 }
  ]);

  // Selected student projection modal
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);

  // Quick State alerts
  const [copySuccessId, setCopySuccessId] = useState<string | null>(null);
  const [gSheetError, setGSheetError] = useState<string | null>(null);
  const [gSheetSuccess, setGSheetSuccess] = useState<string | null>(null);
  const [isCreatingSheet, setIsCreatingSheet] = useState<string | null>(null);

  const activeExam = exams.find(e => e.id === selectedExamId) || exams[0];
  const filteredSubmissions = submissions.filter(s => s.examId === selectedExamId);

  // Analytics Computations
  const totalSubmissions = filteredSubmissions.length;
  const averagePoints = totalSubmissions 
    ? filteredSubmissions.reduce((sum, s) => sum + s.score, 0) / totalSubmissions 
    : 0;
  const maxPossiblePoints = activeExam?.questions.reduce((sum, q) => sum + q.points, 0) || 100;
  const averagePercent = maxPossiblePoints ? (averagePoints / maxPossiblePoints) * 100 : 0;
  const averageTimeSec = totalSubmissions 
    ? filteredSubmissions.reduce((sum, s) => sum + s.timeSpentSeconds, 0) / totalSubmissions 
    : 0;

  // Grade list counts
  const gradeDistribution = [
    { grade: 'A+', count: 0, fill: '#10b981' },
    { grade: 'A', count: 0, fill: '#34d399' },
    { grade: 'B', count: 0, fill: '#60a5fa' },
    { grade: 'C', count: 0, fill: '#fbbf24' },
    { grade: 'D', count: 0, fill: '#f97316' },
    { grade: 'F', count: 0, fill: '#ef4444' }
  ];

  filteredSubmissions.forEach(sub => {
    const distItem = gradeDistribution.find(d => d.grade === sub.automatedGrade);
    if (distItem) distItem.count++;
  });

  // Score intervals
  const scoreIntervals = [
    { range: '0-20%', count: 0 },
    { range: '21-40%', count: 0 },
    { range: '41-60%', count: 0 },
    { range: '61-80%', count: 0 },
    { range: '81-100%', count: 0 }
  ];

  filteredSubmissions.forEach(sub => {
    const percentage = sub.percentage;
    if (percentage <= 20) scoreIntervals[0].count++;
    else if (percentage <= 40) scoreIntervals[1].count++;
    else if (percentage <= 60) scoreIntervals[2].count++;
    else if (percentage <= 80) scoreIntervals[3].count++;
    else scoreIntervals[4].count++;
  });

  // Scatter data: Time spent vs Score Percentage
  const scatterData = filteredSubmissions.map(sub => ({
    name: sub.studentName,
    time: Math.round(sub.timeSpentSeconds / 60 * 10) / 10, // mins
    score: sub.percentage,
    grade: sub.automatedGrade
  }));

  // Handle Sheet Creation
  const handleCreateNewSheet = async (exam: Exam) => {
    if (!accessToken) {
      setGSheetError('Please authenticate with Google to write reports.');
      return;
    }
    setGSheetError(null);
    setGSheetSuccess(null);
    setIsCreatingSheet(exam.id);

    try {
      const result = await createExamSpreadsheet(accessToken, exam);
      onUpdateExamSheet(exam.id, result.spreadsheetId, result.spreadsheetUrl);
      setGSheetSuccess(`Google Sheet newly created for "${exam.title}"!`);
    } catch (err: any) {
      setGSheetError(err.message || 'Error occurred while creating Google Sheet');
    } finally {
      setIsCreatingSheet(null);
    }
  };

  const handleCopyLink = (examId: string) => {
    const link = `${window.location.origin}${window.location.pathname}?exam=${examId}`;
    navigator.clipboard.writeText(link);
    setCopySuccessId(examId);
    setTimeout(() => setCopySuccessId(null), 2000);
  };

  // Add MCQ Option
  const handleUpdateOption = (qIndex: number, oIndex: number, val: string) => {
    const updated = [...newQuestions];
    updated[qIndex].options[oIndex] = val;
    setNewQuestions(updated);
  };

  const handleAddQuestion = () => {
    setNewQuestions([
      ...newQuestions,
      { text: '', options: ['', '', '', ''], correctIndex: 0, points: 10 }
    ]);
  };

  const handleRemoveQuestion = (index: number) => {
    if (newQuestions.length > 1) {
      setNewQuestions(newQuestions.filter((_, i) => i !== index));
    }
  };

  const handleSaveExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      alert('Please enter an exam title.');
      return;
    }

    // Basic questions validation
    for (let i = 0; i < newQuestions.length; i++) {
      const q = newQuestions[i];
      if (!q.text.trim()) {
        alert(`Question ${i + 1} has empty text.`);
        return;
      }
      if (q.options.some(o => !o.trim())) {
        alert(`Question ${i + 1} contains empty options.`);
        return;
      }
    }

    const createdExam: Exam = {
      id: 'exam_' + Date.now(),
      title: newTitle,
      description: newDescription || 'No description provided.',
      durationMinutes: Number(newDuration),
      questions: newQuestions.map((q, idx) => ({
        id: `q_${Date.now()}_${idx}`,
        text: q.text,
        options: q.options,
        correctOptionIndex: q.correctIndex,
        points: q.points
      })),
      createdAt: new Date().toISOString()
    };

    onCreateExam(createdExam);
    setShowCreateForm(false);
    setSelectedExamId(createdExam.id);
    
    // Reset form
    setNewTitle('');
    setNewDescription('');
    setNewDuration(15);
    setNewQuestions([{ text: '', options: ['', '', '', ''], correctIndex: 0, points: 10 }]);
  };

  return (
    <div className="space-y-6">
      {/* Google Sheets Connection Banner */}
      <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-800 text-base">Google Sheets Integration</h2>
            <p className="text-xs text-slate-500">
              {accessToken 
                ? 'Authenticated with Google. Submissions can be pushed directly to your Drive.' 
                : 'Connect your Google account to log and grade submissions live.'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {accessToken ? (
            <>
              <span className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Google Connected
              </span>
              <button 
                onClick={onLogout}
                className="text-slate-500 hover:text-slate-800 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 transition"
              >
                Disconnect
              </button>
            </>
          ) : (
            <button 
              onClick={onLogin}
              className="inline-flex items-center gap-2 bg-slate-900 text-white hover:bg-slate-850 px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition"
            >
              <LogIn className="w-4 h-4" />
              Sign in with Google
            </button>
          )}
        </div>
      </div>

      {/* Main View Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Navigation & Active Exam Selector */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Navigations</h3>
            <div className="space-y-1.5">
              <button
                onClick={() => { setActiveTab('analytics'); setShowCreateForm(false); }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left text-xs font-semibold transition ${activeTab === 'analytics' ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <BarChart3 className="w-4 h-4" />
                Performance Summary
              </button>
              <button
                onClick={() => { setActiveTab('exams'); setShowCreateForm(false); }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left text-xs font-semibold transition ${activeTab === 'exams' ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <HelpCircle className="w-4 h-4" />
                Exams List ({exams.length})
              </button>
              <button
                onClick={() => { setActiveTab('reports'); setShowCreateForm(false); }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left text-xs font-semibold transition ${activeTab === 'reports' ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <Users className="w-4 h-4" />
                Student Reports ({filteredSubmissions.length})
              </button>
              <button
                onClick={() => { setActiveTab('sheets'); setShowCreateForm(false); }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left text-xs font-semibold transition ${activeTab === 'sheets' ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <FileSpreadsheet className="w-4 h-4" />
                Excel / Sheets Sync
              </button>
            </div>
          </div>

          {/* Active Quiz Selector */}
          <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Selected Subject</label>
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
            >
              {exams.map(ex => (
                <option key={ex.id} value={ex.id}>{ex.title}</option>
              ))}
            </select>
            {activeExam && (
              <div className="pt-2 border-t border-slate-100 text-xs text-slate-500 space-y-1">
                <p><span className="font-semibold text-slate-700">Questions:</span> {activeExam.questions.length} MCQs</p>
                <p><span className="font-semibold text-slate-700">Time Limit:</span> {activeExam.durationMinutes ? `${activeExam.durationMinutes} mins` : 'Unlimited'}</p>
                <p><span className="font-semibold text-slate-700">Total Points:</span> {maxPossiblePoints} pts</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Primary Content Canvas */}
        <div className="lg:col-span-9 space-y-6">
          
          {/* CREATIVE ADD QUESTION SCREEN */}
          {showCreateForm ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-md">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">Create New Online Exam</h3>
                  <p className="text-xs text-slate-500">Design your question papers and configure automated grading rules instantly.</p>
                </div>
                <button 
                  onClick={() => setShowCreateForm(false)}
                  className="text-slate-400 hover:text-slate-600 text-xs px-3 py-1.5 border border-slate-200 rounded-lg"
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={handleSaveExam} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">Exam Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Advanced JavaScript Closure Exam"
                      value={newTitle}
                      onChange={e => setNewTitle(e.target.value)}
                      className="w-full text-slate-800 bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-1 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">Timer Limit (minutes) *</label>
                    <input
                      type="number"
                      min="1"
                      placeholder="e.g. 15 (minutes)"
                      value={newDuration}
                      onChange={e => setNewDuration(Number(e.target.value))}
                      className="w-full text-slate-800 bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-1 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-bold text-slate-600 block mb-1">Exam Description (optional)</label>
                    <textarea
                      placeholder="Input exam directives and syllabus scope here..."
                      value={newDescription}
                      onChange={e => setNewDescription(e.target.value)}
                      rows={2}
                      className="w-full text-slate-800 bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-1 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-5 space-y-6">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Questions List ({newQuestions.length})</h4>
                    <button
                      type="button"
                      onClick={handleAddQuestion}
                      className="inline-flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-lg transition"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add MCQ
                    </button>
                  </div>

                  {newQuestions.map((q, qIdx) => (
                    <div key={qIdx} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4 relative">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-55/40 px-2 py-1 rounded-md">Question #{qIdx + 1}</span>
                        <div className="flex items-center gap-2">
                          <label className="text-[10px] uppercase font-bold text-slate-400">Question Weight (points):</label>
                          <input 
                            type="number"
                            min="1"
                            value={q.points}
                            onChange={(e) => {
                              const updated = [...newQuestions];
                              updated[qIdx].points = Number(e.target.value);
                              setNewQuestions(updated);
                            }}
                            className="w-12 bg-white text-center border border-slate-200 rounded p-1 text-xs"
                          />
                          {newQuestions.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveQuestion(qIdx)}
                              className="text-red-400 hover:text-red-650 p-1 rounded hover:bg-red-50 transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div>
                        <input
                          type="text"
                          required
                          placeholder="Type your question statement here..."
                          value={q.text}
                          onChange={(e) => {
                            const updated = [...newQuestions];
                            updated[qIdx].text = e.target.value;
                            setNewQuestions(updated);
                          }}
                          className="w-full bg-white text-slate-800 border border-slate-200 rounded-xl p-2 text-xs font-medium outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {q.options.map((opt, oIdx) => (
                          <div key={oIdx} className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-400">{String.fromCharCode(65 + oIdx)}.</span>
                            <input
                              type="text"
                              required
                              placeholder={`Option ${String.fromCharCode(65 + oIdx)}`}
                              value={opt}
                              onChange={(e) => handleUpdateOption(qIdx, oIdx, e.target.value)}
                              className="flex-1 bg-white text-slate-800 border border-slate-200 rounded-lg p-2 text-xs outline-none"
                            />
                            <input
                              type="radio"
                              name={`correct-radio-${qIdx}`}
                              checked={q.correctIndex === oIdx}
                              onChange={() => {
                                const updated = [...newQuestions];
                                updated[qIdx].correctIndex = oIdx;
                                setNewQuestions(updated);
                              }}
                              className="w-4 h-4 text-emerald-600 accent-emerald-500"
                            />
                          </div>
                        ))}
                      </div>
                      <p className="text-[10px] text-slate-400">Select the radio button on the right of the option which acts as the Correct Answer (Automated Grading reference).</p>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3 justify-end pt-5 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="px-4 py-2 text-slate-500 hover:text-slate-700 text-xs font-bold transition"
                  >
                    Discard Changes
                  </button>
                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-750 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md transition"
                  >
                    Confirm & Publish Exam
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <>
              {/* PRIMARY TAB PANELS */}
              
              {/* ANALYTICS SUMMARY TAB */}
              {activeTab === 'analytics' && (
                <div className="space-y-6">
                  {/* Metric Ribbon */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm text-slate-800">
                      <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold mb-1">
                        <Users className="w-4 h-4 text-emerald-600" /> Responses
                      </div>
                      <p className="text-2xl font-bold tracking-tight">{totalSubmissions}</p>
                    </div>

                    <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm text-slate-800">
                      <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold mb-1">
                        <Award className="w-4 h-4 text-emerald-600" /> Avg Score
                      </div>
                      <p className="text-2xl font-bold tracking-tight">
                        {averagePercent.toFixed(1)}%
                      </p>
                    </div>

                    <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm text-slate-800">
                      <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold mb-1">
                        <Clock className="w-4 h-4 text-emerald-600" /> Avg Time Taken
                      </div>
                      <p className="text-2xl font-bold tracking-tight">
                        {averageTimeSec ? `${Math.round(averageTimeSec / 60)}m ${Math.round(averageTimeSec % 60)}s` : '0s'}
                      </p>
                    </div>

                    <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm text-slate-800">
                      <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold mb-1">
                        <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Synced to GSheets
                      </div>
                      <p className="text-2xl font-bold tracking-tight">
                        {filteredSubmissions.filter(s => s.isSyncedToSheet).length} / {totalSubmissions}
                      </p>
                    </div>
                  </div>

                  {totalSubmissions === 0 ? (
                    <div className="bg-white border border-slate-150 rounded-2xl p-8 shadow-sm text-center">
                      <BarChart3 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <h4 className="font-bold text-slate-700 text-base">No responses logged yet</h4>
                      <p className="text-slate-550 text-xs max-w-sm mx-auto mt-1">
                        Give students the Exam URL to complete tests. Real-time class graphs and progress cards will populate immediately as they submit!
                      </p>
                      <button 
                        onClick={() => setActiveTab('exams')}
                        className="bg-emerald-600 text-white rounded-xl text-xs font-semibold px-4 py-2 shadow mt-4 hover:bg-emerald-700 transition"
                      >
                        Copy Shareable Exam Link
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Score Bands Bar Chart */}
                      <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm space-y-4">
                        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-widest">Score Distribution Interval</h4>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={scoreIntervals}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                              <XAxis dataKey="range" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} />
                              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} />
                              <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                              <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} name="Completed Count" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Time vs Speed Scatter Plot */}
                      <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm space-y-4">
                        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-widest">Speed vs Score Accuracy</h4>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                              <XAxis type="number" dataKey="time" name="Time Used" unit="m" tick={{ fontSize: 10, fill: '#64748b' }} />
                              <YAxis type="number" dataKey="score" name="Accuracy" unit="%" tick={{ fontSize: 10, fill: '#64748b' }} />
                              <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                              <Scatter name="Students" data={scatterData} fill="#3b82f6">
                                {scatterData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.score >= 80 ? '#10b981' : entry.score >= 60 ? '#3b82f6' : '#ef4444'} />
                                ))}
                              </Scatter>
                            </ScatterChart>
                          </ResponsiveContainer>
                        </div>
                        <p className="text-[10px] text-slate-400 text-center">
                          Legend: <span className="text-emerald-500">Green (Highly Competent)</span> • <span className="text-blue-500">Blue (Average)</span> • <span className="text-red-500">Red (Needs Attention)</span>
                        </p>
                      </div>

                      {/* Peer-to-Peer Comparative Performance Rankings */}
                      <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm space-y-4 md:col-span-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-widest">Class Leaderboard & Deviation Index</h4>
                          <span className="text-xs font-medium text-slate-500">Class Average Score: {averagePercent.toFixed(1)}%</span>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="border-b border-slate-100 text-slate-400 font-bold">
                                <th className="py-2.5">Rank</th>
                                <th className="py-2.5">Student</th>
                                <th className="py-2.5">Score</th>
                                <th className="py-2.5">Grade</th>
                                <th className="py-2.5">Total Time</th>
                                <th className="py-2.5 text-right">Deviation from Class Avg</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                              {filteredSubmissions
                                .sort((a, b) => b.percentage - a.percentage || a.timeSpentSeconds - b.timeSpentSeconds)
                                .map((sub, index) => {
                                  const deviation = sub.percentage - averagePercent;
                                  return (
                                    <tr key={sub.id} className="hover:bg-slate-50/50">
                                      <td className="py-2.5 font-bold text-slate-700">#{index + 1}</td>
                                      <td className="py-2.5 font-medium text-slate-850">
                                        <div>{sub.studentName}</div>
                                        <div className="text-[10px] text-slate-400">{sub.studentEmail}</div>
                                      </td>
                                      <td className="py-2.5 text-slate-700">{sub.score} / {sub.totalPoints} ({sub.percentage.toFixed(0)}%)</td>
                                      <td className="py-2.5">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                          sub.automatedGrade.startsWith('A') ? 'bg-emerald-50 text-emerald-700' :
                                          sub.automatedGrade.startsWith('B') ? 'bg-blue-50 text-blue-700' :
                                          sub.automatedGrade.startsWith('C') ? 'bg-amber-50 text-amber-700' :
                                          'bg-red-50 text-red-700'
                                        }`}>
                                          {sub.automatedGrade}
                                        </span>
                                      </td>
                                      <td className="py-2.5 text-slate-500">{Math.floor(sub.timeSpentSeconds / 60)}m {sub.timeSpentSeconds % 60}s</td>
                                      <td className={`py-2.5 text-right font-semibold ${deviation >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                                        {deviation >= 0 ? `+${deviation.toFixed(1)}%` : `${deviation.toFixed(1)}%`}
                                      </td>
                                    </tr>
                                  );
                                })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* EXAMS LIST TAB */}
              {activeTab === 'exams' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2">
                    <div>
                      <h4 className="font-bold text-slate-800 text-base">Active Registered Quizzes</h4>
                      <p className="text-xs text-slate-500">Select standard quizzes or add your customized testing materials.</p>
                    </div>
                    <button
                      onClick={() => setShowCreateForm(true)}
                      className="inline-flex items-center gap-1.5 bg-slate-900 text-white hover:bg-slate-850 text-xs font-semibold px-4 py-2.5 rounded-xl shadow transition"
                    >
                      <Plus className="w-4 h-4" /> Create MCQ Exam
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {exams.map(ex => {
                      const examSubmissions = submissions.filter(s => s.examId === ex.id);
                      return (
                        <div key={ex.id} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4">
                          <div>
                            <div className="flex items-start justify-between gap-3">
                              <h5 className="font-bold text-slate-800 text-sm leading-snug">{ex.title}</h5>
                              <button 
                                onClick={() => onDeleteExam(ex.id)}
                                className="text-rose-400 hover:text-rose-650 p-1 rounded hover:bg-rose-50 transition shrink-0"
                                title="Delete Exam"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            <p className="text-xs text-slate-500 line-clamp-2 mt-1.5">{ex.description}</p>
                            
                            <div className="flex flex-wrap gap-2 mt-3.5">
                              <span className="text-[10px] bg-slate-100 text-slate-600 font-medium px-2 py-0.5 rounded-md">
                                {ex.questions.length} MCQs
                              </span>
                              <span className="text-[10px] bg-amber-50 text-amber-700 font-medium px-2 py-0.5 rounded-md flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {ex.durationMinutes ? `${ex.durationMinutes} mins` : 'Unlimited'}
                              </span>
                              <span className="text-[10px] bg-blue-50 text-blue-700 font-medium px-2 py-0.5 rounded-md">
                                {examSubmissions.length} Submissions
                              </span>
                            </div>
                          </div>

                          <div className="border-t border-slate-50 pt-4 flex flex-col gap-2.5">
                            {/* Exam Link Widget */}
                            <div className="bg-slate-50 border border-slate-150 rounded-xl p-2 flex items-center justify-between gap-2">
                              <span className="text-[10px] text-slate-550 font-mono truncate max-w-xs">{`${window.location.origin}${window.location.pathname}?exam=${ex.id}`}</span>
                              <button
                                onClick={() => handleCopyLink(ex.id)}
                                className={`text-[10px] font-bold px-2.5 py-1 rounded-lg shrink-0 transition ${copySuccessId === ex.id ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
                              >
                                {copySuccessId === ex.id ? (
                                  <span className="flex items-center gap-0.5"><Check className="w-3 h-3" /> Copied</span>
                                ) : 'Copy Link'}
                              </button>
                            </div>

                            <div className="flex gap-2">
                              <a 
                                href={`?exam=${ex.id}`}
                                className="flex-1 inline-flex items-center justify-center gap-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold py-2 rounded-xl text-center"
                              >
                                Test Student View <ArrowUpRight className="w-3.5 h-3.5" />
                              </a>
                              <button
                                onClick={() => { setSelectedExamId(ex.id); setActiveTab('reports'); }}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-3.5 py-2 rounded-xl"
                              >
                                View Live Reports
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* REPORT CARD TAB */}
              {activeTab === 'reports' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2">
                    <div>
                      <h4 className="font-bold text-slate-800 text-base">Graded Student Submissions</h4>
                      <p className="text-xs text-slate-500">Select any submission to view automated grading, feedback, and individual exam papers.</p>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                    {filteredSubmissions.length === 0 ? (
                      <div className="p-10 text-center text-slate-400">
                        <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                        No responses logged for this quiz. Send the link to allow entries.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 font-bold">
                              <th className="p-4">Name</th>
                              <th className="p-4">Email</th>
                              <th className="p-4">Score</th>
                              <th className="p-4">Percentage</th>
                              <th className="p-4">Automated Grade</th>
                              <th className="p-4">Time Spent</th>
                              <th className="p-4 text-center">Sheets Sync</th>
                              <th className="p-4 text-right">Progress Report</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {filteredSubmissions.map(sub => (
                              <tr key={sub.id} className="hover:bg-slate-50/50">
                                <td className="p-4 font-semibold text-slate-800">{sub.studentName}</td>
                                <td className="p-4 text-slate-600">{sub.studentEmail}</td>
                                <td className="p-4 text-slate-700 font-medium">{sub.score} / {sub.totalPoints}</td>
                                <td className="p-4 font-medium">{sub.percentage.toFixed(0)}%</td>
                                <td className="p-4">
                                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                    sub.automatedGrade.startsWith('A') ? 'bg-emerald-50 text-emerald-700' :
                                    sub.automatedGrade.startsWith('B') ? 'bg-blue-50 text-blue-700' :
                                    sub.automatedGrade.startsWith('C') ? 'bg-amber-50 text-amber-700' :
                                    'bg-red-50 text-red-700'
                                  }`}>
                                    {sub.automatedGrade}
                                  </span>
                                </td>
                                <td className="p-4 text-slate-500">{Math.floor(sub.timeSpentSeconds / 60)}m {sub.timeSpentSeconds % 60}s</td>
                                <td className="p-4 text-center">
                                  {sub.isSyncedToSheet ? (
                                    <span className="text-emerald-600 font-bold inline-flex items-center gap-1 border border-emerald-100 bg-emerald-50/50 px-2 py-0.5 rounded-md">
                                      <Check className="w-3 h-3" /> Synced
                                    </span>
                                  ) : (
                                    <span className="text-amber-600 font-bold inline-flex items-center gap-1 border border-amber-100 bg-amber-50/50 px-2 py-0.5 rounded-md">
                                      <RefreshCw className="w-3 h-3 text-[9px] animate-spin-reverse" /> Pending
                                    </span>
                                  )}
                                </td>
                                <td className="p-4 text-right">
                                  <button
                                    onClick={() => setSelectedSubmission(sub)}
                                    className="inline-flex items-center gap-1 text-emerald-600 font-bold hover:text-emerald-750"
                                  >
                                    View Report <ChevronRight className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* SHEET SYNC TAB */}
              {activeTab === 'sheets' && (
                <div className="space-y-4">
                  <div className="pb-2">
                    <h4 className="font-bold text-slate-800 text-base">Google Sheets Reporting System</h4>
                    <p className="text-xs text-slate-500">Create, connect, and sync student report entries to real Excel spreadsheets in your Google Drive folder instantly.</p>
                  </div>

                  {gSheetError && (
                    <div className="bg-rose-50 border border-rose-150 rounded-xl p-3 text-xs text-rose-700 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" /> {gSheetError}
                    </div>
                  )}

                  {gSheetSuccess && (
                    <div className="bg-emerald-50 border border-emerald-150 rounded-xl p-3 text-xs text-emerald-700 flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" /> {gSheetSuccess}
                    </div>
                  )}

                  <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm space-y-4">
                    <h5 className="font-bold text-slate-850 text-sm">Sheets link for: <span className="text-emerald-600">{activeExam.title}</span></h5>
                    
                    {activeExam.spreadsheetId ? (
                      <div className="bg-slate-50 border border-slate-150 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Active Target Spreadsheet
                          </p>
                          <p className="text-xs text-slate-550 font-mono select-all truncate max-w-md">{activeExam.spreadsheetId}</p>
                        </div>
                        <div className="flex gap-2">
                          <a 
                            href={activeExam.spreadsheetUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 font-semibold px-4 py-2 rounded-xl text-xs"
                          >
                            Open Sheet <ExternalLink className="w-4 h-4" />
                          </a>
                          <button
                            onClick={() => onSyncSubmissionsToSheet(activeExam.id)}
                            disabled={isSyncing || filteredSubmissions.length === 0}
                            className="bg-emerald-600 hover:bg-emerald-750 text-white font-semibold rounded-xl text-xs px-4 py-2 flex items-center gap-1.5 disabled:opacity-50 transition"
                          >
                            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                            Sync All Submissions
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-slate-50 border border-slate-150 rounded-xl p-6 text-center space-y-3">
                        <FileSpreadsheet className="w-10 h-10 text-slate-400 mx-auto" />
                        <h6 className="font-bold text-slate-800 text-sm">No target spreadsheet initialized yet</h6>
                        <p className="text-slate-550 text-xs max-w-md mx-auto">
                          Automatically generate a beautiful target spreadsheet with columns matching Name, Email, Score, Percentage, Time Taken, and Automated Rules Grade in your Google Drive.
                        </p>
                        
                        {accessToken ? (
                          <button
                            onClick={() => handleCreateNewSheet(activeExam)}
                            disabled={isCreatingSheet === activeExam.id}
                            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-750 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition"
                          >
                            {isCreatingSheet === activeExam.id ? (
                              <>
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                Creating Sheet...
                              </>
                            ) : (
                              <>
                                <Plus className="w-4 h-4" />
                                Create Beautiful Sheet in Google Drive
                              </>
                            )}
                          </button>
                        ) : (
                          <button
                            onClick={onLogin}
                            className="bg-slate-900 border border-slate-200 text-white block mx-auto text-xs font-semibold px-4 py-2 rounded-xl hover:bg-slate-800"
                          >
                            Sign In with Google to Activate Sheets Creator
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* INDIVIDUAL SUBMISSION GRAPHIC REPORT MODAL */}
      {selectedSubmission && activeExam && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-150">
              <div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md uppercase tracking-wider">Automated Grading Report</span>
                <h4 className="font-bold text-slate-850 text-base">{selectedSubmission.studentName}</h4>
                <p className="text-xs text-slate-500">{selectedSubmission.studentEmail}</p>
              </div>
              <button 
                onClick={() => setSelectedSubmission(null)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg"
              >
                Close Report
              </button>
            </div>

            {/* Scorecard Ribbon */}
            <div className="grid grid-cols-3 gap-3 bg-slate-50/50 border border-slate-100 rounded-2xl p-4">
              <div className="text-center">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Weighted Score</p>
                <p className="text-xl font-extrabold text-slate-800 mt-1">{selectedSubmission.score} / {selectedSubmission.totalPoints}</p>
              </div>
              <div className="text-center border-x border-slate-150">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Accuracy</p>
                <p className="text-xl font-extrabold text-slate-800 mt-1">{selectedSubmission.percentage.toFixed(0)}%</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Subject Grade</p>
                <p className="text-xl font-extrabold text-emerald-600 mt-1">{selectedSubmission.automatedGrade}</p>
              </div>
            </div>

            {/* Questions detail lists */}
            <div className="space-y-4">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">Question-by-Question Diagnostics</h5>
              
              <div className="space-y-3.5">
                {activeExam.questions.map((q, idx) => {
                  const studentAnswer = selectedSubmission.answers.find(a => a.questionId === q.id);
                  const isCorrect = studentAnswer?.selectedOptionIndex === q.correctOptionIndex;
                  return (
                    <div key={q.id} className="border border-slate-100 rounded-xl p-3.5 space-y-2 text-xs">
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-medium text-slate-800">{idx + 1}. {q.text}</p>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold shrink-0 ${isCorrect ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                          {isCorrect ? 'Correct (+10)' : 'Incorrect (0)'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        {q.options.map((opt, oIdx) => {
                          const isStudentSel = studentAnswer?.selectedOptionIndex === oIdx;
                          const isCorrectAns = q.correctOptionIndex === oIdx;
                          return (
                            <div 
                              key={oIdx} 
                              className={`p-2 rounded-lg border text-[11px] ${
                                isCorrectAns 
                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-semibold' 
                                  : isStudentSel 
                                    ? 'bg-rose-50 border-rose-300 text-rose-800 font-medium' 
                                    : 'bg-white border-slate-100 text-slate-600'
                              }`}
                            >
                              <span className="font-bold mr-1">{String.fromCharCode(65 + oIdx)}.</span> {opt}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Performance Review Evaluation */}
            <div className="bg-emerald-50/40 border border-emerald-100 rounded-2xl p-4 space-y-1.5">
              <p className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                <Award className="w-4 h-4" /> Grade-wise Formative Feedback
              </p>
              <p className="text-xs text-emerald-950">
                {selectedSubmission.percentage >= 90 
                  ? 'Expert Demonstration. Excellent mastery of responsive sizing paradigms and layout context controls.' 
                  : selectedSubmission.percentage >= 70 
                    ? 'Very Good Proficiency. Minor syntax revisions suggested to ensure maximum speed competence.'
                    : 'Requires core subject reinforcement. Recommend reviewing CSS parameters and JavaScript scope limitations.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
