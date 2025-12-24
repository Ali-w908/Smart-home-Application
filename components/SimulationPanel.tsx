import React from 'react';
import { hardwareService } from '../services/mockHardwareService';
import { Sliders, DoorOpen, Thermometer } from 'lucide-react';

interface SimulationPanelProps {
    currentTemp: number;
    doorIsOpen: boolean;
}

export const SimulationPanel: React.FC<SimulationPanelProps> = ({ currentTemp, doorIsOpen }) => {
  return (
    <div className="mt-8 border-t border-dashed border-gray-300 pt-6">
      <div className="flex items-center gap-2 mb-4 text-gray-400">
        <Sliders size={16} />
        <h4 className="text-xs font-bold uppercase tracking-widest">Hardware Simulation (Dev Mode)</h4>
      </div>
      
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4">
        {/* Door Simulation */}
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                    <DoorOpen size={18} />
                </div>
                <span className="text-sm font-medium text-gray-700">Door Sensor</span>
            </div>
            <button
                onClick={() => hardwareService.simulateDoorChange(!doorIsOpen)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${doorIsOpen ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}
            >
                {doorIsOpen ? 'Force Close' : 'Force Open'}
            </button>
        </div>

        {/* Temp Simulation */}
        <div>
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                        <Thermometer size={18} />
                    </div>
                    <span className="text-sm font-medium text-gray-700">Room Temp</span>
                </div>
                <span className="text-xs font-mono font-bold text-gray-500">{currentTemp}°C</span>
            </div>
            <input 
                type="range" 
                min="0" 
                max="60" 
                step="1"
                value={currentTemp}
                onChange={(e) => hardwareService.simulateTempChange(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-orange-500"
            />
        </div>
      </div>
      <p className="text-[10px] text-gray-400 mt-2 text-center">
        Use these controls to simulate sensor inputs since no Arduino is connected.
      </p>
    </div>
  );
};