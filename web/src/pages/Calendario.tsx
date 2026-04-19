import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Calendario() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<Date[]>([]);

  useEffect(() => {
    generateCalendarDays();
  }, [currentDate]);

  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const _lastDay = new Date(year, month + 1, 0);
    void _lastDay; // Marcar como usada intencionalmente
    
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days: Date[] = [];
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      days.push(date);
    }
    
    setCalendarDays(days);
  };

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Calendário</h1>
          <p className="text-slate-400">Visualize e gerencie suas publicações agendadas</p>
        </div>
        
        <div className="flex items-center gap-4">
          <button
            onClick={prevMonth}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ChevronLeft className="text-slate-400" />
          </button>
          
          <span className="text-xl font-semibold text-white min-w-[200px] text-center">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </span>
          
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ChevronRight className="text-slate-400" />
          </button>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-7 border-b border-slate-800">
          {weekDays.map((day) => (
            <div
              key={day}
              className="py-4 text-center text-sm font-medium text-slate-400"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7">
          {calendarDays.map((date, index) => (
            <div
              key={index}
              className={`min-h-[100px] p-2 border-b border-r border-slate-800 ${
                !isCurrentMonth(date) ? 'bg-slate-900/50' : ''
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                  isToday(date)
                    ? 'bg-blue-600 text-white'
                    : isCurrentMonth(date)
                    ? 'text-slate-300'
                    : 'text-slate-600'
                }`}
              >
                {date.getDate()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
