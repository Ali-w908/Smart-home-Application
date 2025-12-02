import React from 'react';
import { Loader2 } from 'lucide-react';

interface ControlCardProps {
  title: string;
  icon: React.ReactNode;
  isOn: boolean;
  onToggle: (newState: boolean) => void;
  isLoading?: boolean;
  disabled?: boolean;
  colorClass?: string;
}

export const ControlCard: React.FC<ControlCardProps> = ({
  title,
  icon,
  isOn,
  onToggle,
  isLoading = false,
  disabled = false,
  colorClass = "bg-blue-500"
}) => {
  return (
    <div className={`relative overflow-hidden rounded-2xl p-4 shadow-sm transition-all duration-300 ${isOn ? 'bg-white ring-2 ring-offset-2 ring-blue-100' : 'bg-gray-100'}`}>
      <div className="flex flex-col h-full justify-between">
        <div className="flex justify-between items-start">
          <div className={`p-2 rounded-xl ${isOn ? colorClass + ' text-white' : 'bg-gray-200 text-gray-400'}`}>
            {icon}
          </div>
          <button
            onClick={() => !disabled && !isLoading && onToggle(!isOn)}
            disabled={disabled || isLoading}
            className={`w-12 h-7 rounded-full p-1 transition-colors duration-300 ease-in-out ${isOn ? 'bg-green-500' : 'bg-gray-300'}`}
          >
            <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-300 ${isOn ? 'translate-x-5' : 'translate-x-0'} flex items-center justify-center`}>
                {isLoading && <Loader2 className="w-3 h-3 animate-spin text-gray-400" />}
            </div>
          </button>
        </div>
        
        <div className="mt-4">
          <h3 className="font-semibold text-gray-800">{title}</h3>
          <p className={`text-xs font-medium ${isOn ? 'text-green-600' : 'text-gray-400'}`}>
            {isOn ? 'Active' : 'Off'}
          </p>
        </div>
      </div>
      
      {/* Decorative background blob */}
      {isOn && (
        <div className={`absolute -bottom-4 -right-4 w-24 h-24 ${colorClass} opacity-10 rounded-full blur-xl`}></div>
      )}
    </div>
  );
};