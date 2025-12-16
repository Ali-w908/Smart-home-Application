import React, { useState, useEffect } from 'react';
import { X, Bell, Save } from 'lucide-react';

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentThreshold: number;
  onSave: (val: number) => void;
}

export const SettingsDrawer: React.FC<SettingsDrawerProps> = ({
  isOpen,
  onClose,
  currentThreshold,
  onSave
}) => {
  const [tempVal, setTempVal] = useState(currentThreshold);

  useEffect(() => {
    setTempVal(currentThreshold);
  }, [currentThreshold, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl p-6 relative z-10 animate-in slide-in-from-bottom duration-300">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-red-100 rounded-lg text-red-600">
              <Bell size={20} />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Alarm Settings</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Temperature Threshold (°C)
            </label>
            <div className="flex items-center gap-4">
                <input 
                    type="range" 
                    min="20" 
                    max="50" 
                    step="0.5"
                    value={tempVal}
                    onChange={(e) => setTempVal(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-red-500"
                />
                <span className="text-lg font-bold w-16 text-center">{tempVal}°C</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
                If the room temperature exceeds this value, the software alarm will trigger.
            </p>
          </div>

          <button 
            onClick={() => {
                onSave(tempVal);
                onClose();
            }}
            className="w-full py-3 bg-gray-900 text-white rounded-xl font-semibold flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            <Save size={18} />
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};