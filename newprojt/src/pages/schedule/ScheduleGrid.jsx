import { cn } from '../../lib/utils';
import { SUBJECTS, TEACHERS, ROOMS, DAYS, TIME_SLOTS, CLASSES } from '../../data/mockSchedule';
import { MapPin, User } from 'lucide-react';

export default function ScheduleGrid({ sessions, onEmptyCellClick, mode }) {
  
  // Helper to find session at a specific day and time
  const getSession = (day, time) => {
    return sessions.find(s => {
      const sessionStart = parseInt(s.startTime.split(':')[0]);
      const sessionEnd = parseInt(s.endTime.split(':')[0]);
      const currentSlot = parseInt(time.split(':')[0]);
      return s.day === day && currentSlot >= sessionStart && currentSlot < sessionEnd;
    });
  };

  // Helper to check if a slot is the START of a session (for rowSpan-like behavior)
  const isSessionStart = (day, time) => {
    return sessions.find(s => s.day === day && s.startTime === time);
  };

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[800px]">
        {/* Grid Header */}
        <div className="grid grid-cols-7 border-b border-border/50 bg-secondary/30">
          <div className="p-4 border-r border-border/50 text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-center">
            Heure
          </div>
          {DAYS.map(day => (
            <div key={day} className="p-4 text-center text-sm font-bold border-r border-border/50 last:border-r-0">
              {day}
            </div>
          ))}
        </div>

        {/* Grid Body */}
        <div className="relative">
          {TIME_SLOTS.map((time, _rowIndex) => (
            <div key={time} className="grid grid-cols-7 border-b border-border/50 last:border-b-0 min-h-[100px]">
              {/* Time Slot Label */}
              <div className="p-4 border-r border-border/50 bg-secondary/10 flex flex-col items-center justify-center gap-1">
                <span className="text-sm font-bold">{time}</span>
                <span className="text-[10px] text-muted-foreground font-medium">
                  {parseInt(time.split(':')[0]) + 1}:00
                </span>
              </div>

              {/* Days Cells */}
              {DAYS.map((day, _colIndex) => {
                const session = isSessionStart(day, time);
                const isOccupied = getSession(day, time);
                
                if (session) {
                  // Calculate height based on duration
                  const duration = parseInt(session.endTime.split(':')[0]) - parseInt(session.startTime.split(':')[0]);
                  const subject = SUBJECTS.find(sub => sub.id === session.subjectId);
                  const teacher = TEACHERS.find(t => t.id === session.teacherId);
                  const room = ROOMS.find(r => r.id === session.roomId);
                  const classe = CLASSES.find(c => c.id === session.classId);

                  return (
                    <div 
                      key={`${day}-${time}`}
                      className="relative p-2 border-r border-border/50 last:border-r-0 group"
                      style={{ gridRow: `span ${duration}` }}
                    >
                      <div className={cn(
                        "h-full w-full rounded-2xl p-4 border-2 transition-all duration-300 flex flex-col justify-between shadow-lg group-hover:scale-[1.02] group-hover:shadow-xl",
                        subject?.color || "bg-secondary text-secondary-foreground border-border"
                      )}>
                        <div>
                          <div className="flex items-start justify-between mb-2">
                            <span className="text-xl">{subject?.icon || '📅'}</span>
                            <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">
                              {session.startTime} - {session.endTime}
                            </span>
                          </div>
                          <h4 className="font-bold text-sm mb-1 leading-tight">{subject?.label}</h4>
                          <div className="flex items-center gap-1.5 text-[11px] opacity-80 font-medium">
                            <User className="w-3 h-3" />
                            <span>{mode === 'classe' ? teacher?.name : classe?.label}</span>
                          </div>
                        </div>
                        
                        <div className="mt-2 flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-[11px] font-bold">
                            <MapPin className="w-3 h-3" />
                            <span>{room?.label}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                if (isOccupied) {
                  // This cell is covered by a span from a previous row
                  return null;
                }

                // Empty cell
                return (
                  <div 
                    key={`${day}-${time}`}
                    onClick={onEmptyCellClick}
                    className="p-2 border-r border-border/50 last:border-r-0 hover:bg-primary/5 transition-colors cursor-pointer group flex items-center justify-center"
                  >
                    <div className="w-8 h-8 rounded-full border-2 border-dashed border-border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-primary text-xl font-bold">+</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
