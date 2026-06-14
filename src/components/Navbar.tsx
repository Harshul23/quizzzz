import React from 'react';
import { Award, GraduationCap, HelpCircle, LayoutDashboard, Radio } from 'lucide-react';

interface NavbarProps {
  currentView: 'teacher' | 'student';
  onNavigate: (view: 'teacher' | 'student') => void;
  examsCount: number;
}

export default function Navbar({ currentView, onNavigate, examsCount }: NavbarProps) {
  return (
    <header className="border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand */}
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-extrabold text-slate-800 text-sm tracking-tight leading-none">QuizGrade</h1>
            <span className="text-[10px] font-medium text-slate-400">Live Sheets Reports Platform</span>
          </div>
        </div>

        {/* View Switchers */}
        <div className="flex bg-slate-50 border border-slate-200/50 p-1 rounded-xl">
          <button
            onClick={() => onNavigate('teacher')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              currentView === 'teacher'
                ? 'bg-white text-slate-800 shadow-xs border border-slate-100'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            Teacher Panel
          </button>
          
          <button
            onClick={() => onNavigate('student')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              currentView === 'student'
                ? 'bg-white text-slate-800 shadow-xs border border-slate-100'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            Student Portal
          </button>
        </div>

        {/* Info indicators */}
        <div className="hidden sm:flex items-center gap-2">
          <span className="text-[10px] bg-slate-100 text-slate-650 font-medium px-2 py-0.5 rounded-md">
            Active Papers: {examsCount}
          </span>
        </div>

      </div>
    </header>
  );
}
