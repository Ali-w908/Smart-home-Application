import React from 'react';

interface SensorCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: React.ReactNode;
  statusColor?: 'text-gray-800' | 'text-red-600' | 'text-green-600' | 'text-orange-500';
  subtext?: string;
  onClick?: () => void;
}

export const SensorCard: React.FC<SensorCardProps> = ({
  title,
  value,
  unit,
  icon,
  statusColor = 'text-gray-800',
  subtext,
  onClick
}) => {
  return (
<<<<<<< HEAD
    <div
      onClick={onClick}
      className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 cursor-pointer active:scale-95 transition-transform min-h-[120px]"
    >
      {/* Title at top */}
      <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-2 truncate">{title}</p>

      {/* Icon and Value row */}
      <div className="flex items-center gap-2">
        <div className="p-2 bg-gray-50 rounded-lg text-gray-600 shrink-0">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-1 flex-wrap">
            <h3 className={`text-xl font-bold ${statusColor} break-words`}>
              {value}
            </h3>
            {unit && <span className="text-xs text-gray-400 font-medium">{unit}</span>}
          </div>
        </div>
      </div>

      {/* Subtext at bottom */}
      {subtext && <p className="text-xs text-gray-400 mt-2 truncate">{subtext}</p>}
=======
    <div 
        onClick={onClick}
        className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between cursor-pointer active:scale-95 transition-transform"
    >
      <div className="flex items-center gap-4">
        <div className="p-3 bg-gray-50 rounded-xl text-gray-600">
          {icon}
        </div>
        <div>
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">{title}</p>
          <div className="flex items-baseline gap-1">
            <h3 className={`text-2xl font-bold ${statusColor}`}>
              {value}
            </h3>
            {unit && <span className="text-sm text-gray-400 font-medium">{unit}</span>}
          </div>
          {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
        </div>
      </div>
>>>>>>> d675c0d880a2cfb0c205dc4bb06fbb4d735c71fe
    </div>
  );
};