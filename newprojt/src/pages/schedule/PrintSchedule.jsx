import { SUBJECTS, TEACHERS, ROOMS, DAYS, TIME_SLOTS, CLASSES } from '../../data/mockSchedule';
import { Printer } from 'lucide-react';

export default function PrintSchedule({ sessions, title, week }) {
  
  const getSession = (day, time) => {
    return sessions.find(s => {
      const sessionStart = parseInt(s.startTime.split(':')[0]);
      const sessionEnd = parseInt(s.endTime.split(':')[0]);
      const currentSlot = parseInt(time.split(':')[0]);
      return s.day === day && currentSlot >= sessionStart && currentSlot < sessionEnd;
    });
  };

  const isSessionStart = (day, time) => {
    return sessions.find(s => s.day === day && s.startTime === time);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8">
      {/* Print Controls (Hidden on print) */}
      <div className="flex items-center justify-between bg-card p-4 rounded-2xl border border-border print:hidden">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <p>L'aperçu ci-dessous sera imprimé tel quel sur fond blanc.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimer maintenant</span>
          </button>
        </div>
      </div>

      {/* Printable Area */}
      <div className="bg-white text-black p-8 rounded-xl shadow-xl print:shadow-none print:p-0">
        <div className="text-center mb-8 border-b-2 border-black pb-4">
          <h1 className="text-3xl font-black uppercase tracking-tighter mb-2">EduFlow — Emploi du Temps</h1>
          <div className="flex items-center justify-center gap-8 text-lg font-bold">
            <p>Destinataire : <span className="underline">{title}</span></p>
            <p>Période : <span className="underline">{week}</span></p>
          </div>
        </div>

        <table className="w-full border-collapse border-2 border-black text-sm">
          <thead>
            <tr>
              <th className="border-2 border-black p-2 bg-gray-100 w-24">Heure</th>
              {DAYS.map(day => (
                <th key={day} className="border-2 border-black p-2 bg-gray-100">{day}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TIME_SLOTS.map(time => (
              <tr key={time} className="h-20">
                <td className="border-2 border-black p-2 bg-gray-50 text-center font-bold">
                  {time} - {parseInt(time.split(':')[0]) + 1}:00
                </td>
                {DAYS.map(day => {
                  const session = isSessionStart(day, time);
                  const isOccupied = getSession(day, time);

                  if (session) {
                    const duration = parseInt(session.endTime.split(':')[0]) - parseInt(session.startTime.split(':')[0]);
                    const subject = SUBJECTS.find(sub => sub.id === session.subjectId);
                    const teacher = TEACHERS.find(t => t.id === session.teacherId);
                    const room = ROOMS.find(r => r.id === session.roomId);
                    const classe = CLASSES.find(c => c.id === session.classId);

                    return (
                      <td 
                        key={`${day}-${time}`} 
                        rowSpan={duration}
                        className="border-2 border-black p-2 text-center"
                      >
                        <div className="flex flex-col h-full justify-between py-1">
                          <p className="font-black text-base uppercase leading-tight">{subject?.label}</p>
                          <div>
                            <p className="font-bold text-xs">{teacher?.name}</p>
                            <p className="text-xs italic">{classe?.label}</p>
                          </div>
                          <p className="font-black text-xs mt-1 border-t border-black/20 pt-1">
                            {room?.label}
                          </p>
                        </div>
                      </td>
                    );
                  }

                  if (isOccupied) return null;

                  return <td key={`${day}-${time}`} className="border-2 border-black p-2"></td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-8 flex justify-between items-end text-xs font-bold uppercase opacity-50">
          <p>Document généré le : {new Date().toLocaleDateString()}</p>
          <p>EduFlow Management System</p>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { size: landscape; margin: 1cm; }
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}} />
    </div>
  );
}
