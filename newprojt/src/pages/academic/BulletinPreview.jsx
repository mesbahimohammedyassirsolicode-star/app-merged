import { 
  Printer, 
  ArrowLeft, 
  Download, 
  CheckCircle2, 
  School,
  User,
  Calendar,
  BookOpen,
  Award,
  Signature,
  MessageSquare
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { mockSubjects, mockStudentsNotes } from '../../data/mockNotes';

export default function BulletinPreview({ student, onBack }) {
  // Find the student's full notes
  const studentData = mockStudentsNotes.find(s => s.id === student.studentId) || mockStudentsNotes[0];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* Action Bar */}
      <div className="flex items-center justify-between bg-card border border-border p-4 rounded-[2rem] sticky top-0 z-10 shadow-lg backdrop-blur-md bg-card/90 print:hidden">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 hover:bg-accent rounded-xl transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="font-medium">Retour</span>
        </button>
        <div className="flex items-center gap-3">
          <button 
            className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded-xl font-medium hover:opacity-90 transition-all"
          >
            <Download className="w-4 h-4" />
            PDF
          </button>
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-all shadow-lg shadow-primary/20"
          >
            <Printer className="w-4 h-4" />
            Imprimer
          </button>
        </div>
      </div>

      {/* Bulletin Document */}
      <div className="max-w-4xl mx-auto bg-white text-slate-950 p-12 rounded-[2rem] shadow-2xl min-h-[1100px] flex flex-col print:shadow-none print:p-0 print:rounded-none">
        
        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-slate-200 pb-8 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white">
              <School className="w-10 h-10" />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight text-blue-900 uppercase">EduFlow Academy</h2>
              <p className="text-slate-500 font-medium italic">Excellence & Innovation Scolaire</p>
              <div className="flex gap-4 mt-2 text-xs text-slate-400">
                <span>Rabat, Maroc</span>
                <span>•</span>
                <span>+212 5XX XX XX XX</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-widest">Bulletin Scolaire</h1>
            <p className="text-slate-500 font-bold mt-1 uppercase tracking-tighter">Année Scolaire 2025-2026</p>
            <div className="inline-block mt-3 px-4 py-1.5 bg-blue-50 text-blue-700 rounded-lg font-bold text-sm border border-blue-100">
              {student.trimestre}
            </div>
          </div>
        </div>

        {/* Student Info */}
        <div className="grid grid-cols-2 gap-12 mb-10 bg-slate-50 p-6 rounded-2xl border border-slate-100">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                <User className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Élève</p>
                <p className="text-lg font-bold text-slate-900">{student.nom}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date de naissance</p>
                <p className="text-sm font-semibold text-slate-700">15 Mai 2018</p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Classe / Niveau</p>
                <p className="text-lg font-bold text-slate-900">{student.classe} — 1ère Année Primaire</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Identifiant Massar</p>
                <p className="text-sm font-semibold text-slate-700">M123456789</p>
              </div>
            </div>
          </div>
        </div>

        {/* Grades Table */}
        <div className="flex-1 mb-10">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white">
                <th className="px-6 py-4 text-left font-bold rounded-tl-xl">Matières</th>
                <th className="px-6 py-4 text-center font-bold">Note / 20</th>
                <th className="px-6 py-4 text-left font-bold rounded-tr-xl">Appréciations des professeurs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 border-x border-b border-slate-200">
              {mockSubjects.map((subject) => (
                <tr key={subject}>
                  <td className="px-6 py-4 font-bold text-slate-800">{subject}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={cn(
                      "inline-block w-10 py-1 rounded-lg font-black",
                      studentData.notes[subject] < 10 ? "text-red-600 bg-red-50" : "text-slate-900 bg-slate-50"
                    )}>
                      {studentData.notes[subject].toFixed(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 italic">
                    {studentData.notes[subject] > 15 ? "Excellent travail, élève sérieux et appliqué." : 
                     studentData.notes[subject] > 12 ? "Bon ensemble, continuez vos efforts." : 
                     studentData.notes[subject] >= 10 ? "Résultats satisfaisants, doit redoubler d'efforts." : 
                     "Des lacunes importantes, un soutien est nécessaire."}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary & Footer */}
        <div className="grid grid-cols-2 gap-8 mb-12">
          <div className="bg-slate-900 text-white p-8 rounded-[2rem] flex flex-col justify-center items-center gap-2">
            <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-xs">Moyenne Générale</p>
            <p className="text-6xl font-black">{student.moyenne.toFixed(2)}</p>
            <div className="mt-4 px-6 py-1.5 bg-white/10 rounded-full flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              <span className="font-bold text-sm tracking-wider uppercase">Mention: {student.mention}</span>
            </div>
          </div>
          <div className="border-2 border-slate-100 rounded-[2rem] p-8 flex flex-col gap-4">
            <h4 className="font-black text-slate-900 uppercase tracking-widest text-sm flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-600" />
              Avis du Directeur
            </h4>
            <p className="text-slate-600 text-sm leading-relaxed flex-1 italic">
              "Un trimestre {student.moyenne > 14 ? 'très satisfaisant' : student.moyenne >= 10 ? 'correct' : 'décevant'}. 
              {student.moyenne > 14 ? ' Félicitations pour votre engagement et vos résultats exceptionnels.' : 
               student.moyenne >= 10 ? ' L\'élève montre de la volonté mais doit intensifier son travail personnel.' : 
               ' Un ressaisissement immédiat est attendu au prochain trimestre.'}"
            </p>
          </div>
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-2 gap-12 pt-8 border-t border-dashed border-slate-200">
          <div className="text-center space-y-16">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Cachet de l'établissement</p>
            <div className="w-32 h-32 border-2 border-slate-100 rounded-full mx-auto flex items-center justify-center opacity-20">
              <School className="w-12 h-12" />
            </div>
          </div>
          <div className="text-center space-y-16">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Signature de la Direction</p>
            <div className="relative pt-4">
              <Signature className="w-24 h-12 text-blue-900/10 mx-auto" />
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-[2px] bg-slate-900/5"></div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
