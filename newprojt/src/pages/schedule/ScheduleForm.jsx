import { useState } from 'react';
import { SUBJECTS, TEACHERS, CLASSES, ROOMS, DAYS, TIME_SLOTS } from '../../data/mockSchedule';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

export default function ScheduleForm({ onSave, onCancel, existingSessions }) {
  const [formData, setFormData] = useState({
    classId: CLASSES[0].id,
    subjectId: SUBJECTS[0].id,
    teacherId: TEACHERS[0].id,
    day: DAYS[0],
    startTime: '08:00',
    endTime: '10:00',
    roomId: ROOMS[0].id
  });

  const [error, setError] = useState(null);

  const checkConflict = (data) => {
    const start = parseInt(data.startTime.split(':')[0]);
    const end = parseInt(data.endTime.split(':')[0]);

    return existingSessions.some(s => {
      if (s.day !== data.day) return false;

      const sStart = parseInt(s.startTime.split(':')[0]);
      const sEnd = parseInt(s.endTime.split(':')[0]);

      // Check for overlap: max(start1, start2) < min(end1, end2)
      const isOverlapping = Math.max(start, sStart) < Math.min(end, sEnd);

      if (!isOverlapping) return false;

      // Conflict if same teacher OR same class
      if (s.teacherId === data.teacherId) {
        return { type: 'teacher', message: `Conflit détecté: cet enseignant a déjà une séance à ce créneau.` };
      }
      if (s.classId === data.classId) {
        return { type: 'class', message: `Conflit détecté: cette classe a déjà une séance à ce créneau.` };
      }

      return false;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const conflict = checkConflict(formData);
    
    if (conflict) {
      setError(conflict.message);
      return;
    }

    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-2xl animate-shake">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">{error}</p>
          <button type="button" onClick={() => setError(null)} className="ml-auto">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Class */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-muted-foreground ml-1">Classe</label>
          <select 
            value={formData.classId}
            onChange={(e) => setFormData({...formData, classId: e.target.value})}
            className="w-full bg-background border border-border rounded-2xl px-4 py-3 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
          >
            {CLASSES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </div>

        {/* Subject */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-muted-foreground ml-1">Matière</label>
          <select 
            value={formData.subjectId}
            onChange={(e) => setFormData({...formData, subjectId: e.target.value})}
            className="w-full bg-background border border-border rounded-2xl px-4 py-3 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
          >
            {SUBJECTS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </div>

        {/* Teacher */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-muted-foreground ml-1">Enseignant</label>
          <select 
            value={formData.teacherId}
            onChange={(e) => setFormData({...formData, teacherId: e.target.value})}
            className="w-full bg-background border border-border rounded-2xl px-4 py-3 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
          >
            {TEACHERS.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>

        {/* Room */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-muted-foreground ml-1">Salle</label>
          <select 
            value={formData.roomId}
            onChange={(e) => setFormData({...formData, roomId: e.target.value})}
            className="w-full bg-background border border-border rounded-2xl px-4 py-3 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
          >
            {ROOMS.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
          </select>
        </div>

        {/* Day */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-muted-foreground ml-1">Jour</label>
          <select 
            value={formData.day}
            onChange={(e) => setFormData({...formData, day: e.target.value})}
            className="w-full bg-background border border-border rounded-2xl px-4 py-3 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
          >
            {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-muted-foreground ml-1">Début</label>
            <select 
              value={formData.startTime}
              onChange={(e) => setFormData({...formData, startTime: e.target.value})}
              className="w-full bg-background border border-border rounded-2xl px-4 py-3 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            >
              {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-muted-foreground ml-1">Fin</label>
            <select 
              value={formData.endTime}
              onChange={(e) => setFormData({...formData, endTime: e.target.value})}
              className="w-full bg-background border border-border rounded-2xl px-4 py-3 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            >
              {TIME_SLOTS.map(t => {
                const hour = parseInt(t.split(':')[0]) + 1;
                const endVal = `${hour.toString().padStart(2, '0')}:00`;
                return <option key={endVal} value={endVal}>{endVal}</option>
              })}
            </select>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-4 pt-6">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3 bg-secondary text-secondary-foreground rounded-2xl font-bold hover:bg-secondary/80 transition-all"
        >
          Annuler
        </button>
        <button
          type="submit"
          className="px-8 py-3 bg-primary text-primary-foreground rounded-2xl font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all flex items-center gap-2"
        >
          <CheckCircle2 className="w-5 h-5" />
          <span>Enregistrer la séance</span>
        </button>
      </div>
    </form>
  );
}
