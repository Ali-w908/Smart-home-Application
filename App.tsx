
import React, { useState, useEffect, useRef } from 'react';
import { 
  Lightbulb, 
  Plug, 
  Thermometer, 
  DoorOpen, 
  DoorClosed, 
  History, 
  AlertTriangle,
  Settings,
  ShieldCheck,
  Volume2,
  Wifi,
  LayoutDashboard,
  ScrollText
} from 'lucide-react';
import { ControlCard } from './components/ControlCard';
import { SensorCard } from './components/SensorCard';
import { SettingsDrawer } from './components/SettingsDrawer';
import { SimulationPanel } from './components/SimulationPanel';
import { ConnectionTest } from './components/ConnectionTest';
import { hardwareService } from './services/mockHardwareService';
import { analyzeHomeSafety } from './services/geminiService';
import { DoorStatus, LogEntry } from './types';

// Initial constants
const DEFAULT_ALARM_THRESHOLD = 35.0;

export default function App() {
  // --- State ---
  const [lampOn, setLampOn] = useState(false);
  const [plugOn, setPlugOn] = useState(false);
  const [doorStatus, setDoorStatus] = useState<DoorStatus>(DoorStatus.CLOSED);
  const [temperature, setTemperature] = useState(24.0);
  const [buzzerOn, setBuzzerOn] = useState(false);
  const [alarmThreshold, setAlarmThreshold] = useState(DEFAULT_ALARM_THRESHOLD);
  
  // Logs & UI State
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'logs' | 'connection'>('dashboard');
  const [isLoadingLamp, setIsLoadingLamp] = useState(false);
  const [isLoadingPlug, setIsLoadingPlug] = useState(false);

  // Derived State
  const isAlarmActive = temperature > alarmThreshold;
  const systemStatusMessage = analyzeHomeSafety(logs, temperature, isAlarmActive, doorStatus);

  // Refs for tracking previous state to generate logs
  const prevDoorStatus = useRef<DoorStatus>(DoorStatus.CLOSED);

  // --- Effects ---

  // 1. Subscribe to Hardware Service (Mocking Arduino Communication)
  useEffect(() => {
    const unsubscribe = hardwareService.subscribe((state) => {
      setLampOn(state.lampOn);
      setPlugOn(state.plugOn);
      setDoorStatus(state.doorStatus);
      setTemperature(state.temperature);
      setBuzzerOn(state.buzzerOn);
    });
    return () => unsubscribe();
  }, []);

  // 2. Logic for generating logs when Door Status changes (Bonus Feature)
  useEffect(() => {
    if (prevDoorStatus.current !== doorStatus) {
      const newEntry: LogEntry = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        event: doorStatus === DoorStatus.OPEN ? 'Door Opened' : 'Door Closed',
        type: 'info'
      };
      setLogs(prev => [newEntry, ...prev]);
      prevDoorStatus.current = doorStatus;
    }
  }, [doorStatus]);

  // 3. Logic for Alarm Sync (Software -> Hardware)
  // Satisfies "Alarm if the temperature goes beyond a set value (Software Alarm + Physical Alarm)"
  useEffect(() => {
    // If our calculated alarm state differs from the hardware buzzer state, sync them
    if (isAlarmActive && !buzzerOn) {
      hardwareService.sendCommand({ type: 'SET_BUZZER', value: true });
    } else if (!isAlarmActive && buzzerOn) {
      hardwareService.sendCommand({ type: 'SET_BUZZER', value: false });
    }
  }, [isAlarmActive, buzzerOn]);

  // --- Handlers ---

  const handleToggleLamp = async (newState: boolean) => {
    setIsLoadingLamp(true);
    // Simulate network request to Arduino
    await hardwareService.sendCommand({ type: 'SET_LAMP', value: newState });
    setIsLoadingLamp(false);
  };

  const handleTogglePlug = async (newState: boolean) => {
    setIsLoadingPlug(true);
    await hardwareService.sendCommand({ type: 'SET_PLUG', value: newState });
    setIsLoadingPlug(false);
  };

  // --- Render ---

  return (
    <div className={`min-h-screen pb-20 transition-colors duration-500 ${isAlarmActive ? 'bg-red-50' : 'bg-gray-50'}`}>
      
      {/* Header */}
      <header className={`sticky top-0 z-30 backdrop-blur-md bg-white/70 border-b border-gray-200 px-6 py-4 flex justify-between items-center transition-colors ${isAlarmActive ? 'bg-red-100/80 border-red-200' : ''}`}>
        <div>
          <h1 className="text-lg font-bold text-gray-900">Smart Home Control</h1>
          <p className="text-xs text-gray-500">MDPS479 - Week 11 Prototype</p>
        </div>
        <button 
          onClick={() => setIsSettingsOpen(true)}
          className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
        >
          <Settings size={20} className="text-gray-600" />
        </button>
      </header>

      {/* Alarm Banner */}
      {isAlarmActive && (
        <div className="bg-red-600 text-white px-6 py-3 flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-2">
            <AlertTriangle className="animate-bounce" size={20} />
            <span className="font-bold text-sm">ALARM TRIGGERED</span>
          </div>
          <span className="text-xs bg-red-800 px-2 py-1 rounded font-mono">{temperature}°C</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="max-w-md mx-auto p-6 space-y-6">

        {/* Tab Switcher */}
        <div className="flex bg-gray-200 p-1 rounded-xl mb-6">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 flex flex-col items-center gap-1 py-2 text-xs font-semibold rounded-lg transition-all ${activeTab === 'dashboard' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
          >
            <LayoutDashboard size={18} />
            Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('logs')}
            className={`flex-1 flex flex-col items-center gap-1 py-2 text-xs font-semibold rounded-lg transition-all ${activeTab === 'logs' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
          >
            <ScrollText size={18} />
            Logs
          </button>
          <button 
            onClick={() => setActiveTab('connection')}
            className={`flex-1 flex flex-col items-center gap-1 py-2 text-xs font-semibold rounded-lg transition-all ${activeTab === 'connection' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
          >
            <Wifi size={18} />
            Connect
          </button>
        </div>

        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <SensorCard 
                title="Room Temp" 
                value={temperature} 
                unit="°C"
                icon={<Thermometer size={24} />}
                statusColor={isAlarmActive ? 'text-red-600' : temperature > 30 ? 'text-orange-500' : 'text-gray-800'}
                subtext={`Threshold: ${alarmThreshold}°C`}
                onClick={() => setIsSettingsOpen(true)}
              />
              <SensorCard 
                title="Door Status" 
                value={doorStatus === DoorStatus.OPEN ? 'Open' : 'Closed'} 
                icon={doorStatus === DoorStatus.OPEN ? <DoorOpen size={24} /> : <DoorClosed size={24} />}
                statusColor={doorStatus === DoorStatus.OPEN ? 'text-orange-500' : 'text-green-600'}
                subtext={logs.length > 0 ? `Last: ${new Date(logs[0].timestamp).toLocaleTimeString()}` : 'No activity'}
              />
            </div>

            {/* Alarm Status Indicator (Physical Alarm Feedback) */}
            <div className={`p-4 rounded-xl flex items-center justify-between border ${buzzerOn ? 'bg-red-100 border-red-200' : 'bg-gray-100 border-gray-200'}`}>
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${buzzerOn ? 'bg-red-200 text-red-700' : 'bg-gray-200 text-gray-400'}`}>
                        <Volume2 size={20} />
                    </div>
                    <div>
                        <h4 className={`text-sm font-bold ${buzzerOn ? 'text-red-900' : 'text-gray-500'}`}>
                            Physical Alarm (Buzzer)
                        </h4>
                        <p className="text-xs text-gray-500">
                            {buzzerOn ? 'SOUNDING' : 'Silent'}
                        </p>
                    </div>
                </div>
                <div className={`w-3 h-3 rounded-full ${buzzerOn ? 'bg-red-500 animate-ping' : 'bg-gray-300'}`}></div>
            </div>

            <div className="h-px bg-gray-200 w-full" />

            {/* Controls Grid */}
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Appliances</h3>
            <div className="grid grid-cols-2 gap-4">
              <ControlCard 
                title="Main Lamp"
                icon={<Lightbulb className={lampOn ? 'fill-yellow-300 stroke-yellow-300' : ''} size={24} />}
                isOn={lampOn}
                onToggle={handleToggleLamp}
                isLoading={isLoadingLamp}
                colorClass="bg-yellow-400"
              />
              <ControlCard 
                title="Smart Plug"
                icon={<Plug size={24} />}
                isOn={plugOn}
                onToggle={handleTogglePlug}
                isLoading={isLoadingPlug}
                colorClass="bg-green-500"
              />
            </div>
            
             {/* Local Smart Insights Card */}
             <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-5 text-white shadow-lg overflow-hidden relative">
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-3">
                        <ShieldCheck className="text-indigo-200" size={20} />
                        <h3 className="font-semibold text-indigo-100">Smart Guard Status</h3>
                    </div>
                    <div className="bg-white/10 rounded-lg p-3 text-sm backdrop-blur-sm border border-white/10 animate-in fade-in">
                        {systemStatusMessage}
                    </div>
                </div>
                {/* Decoration */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-10 -mt-10 blur-2xl pointer-events-none"></div>
             </div>

            {/* Hardware Simulator (Dev Only) */}
            <SimulationPanel currentTemp={temperature} doorIsOpen={doorStatus === DoorStatus.OPEN} />
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <History size={18} /> Activity Log
              </h3>
              <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">{logs.length} events</span>
            </div>
            <div className="max-h-[60vh] overflow-y-auto no-scrollbar">
              {logs.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  <p>No activity recorded yet.</p>
                </div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${log.event.includes('Opened') ? 'bg-orange-400' : 'bg-green-400'}`} />
                      <div>
                        <p className="text-sm font-medium text-gray-800">{log.event}</p>
                        <p className="text-xs text-gray-400">{new Date(log.timestamp).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <span className="text-xs font-mono text-gray-500">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'connection' && (
          <ConnectionTest />
        )}

      </main>

      {/* Settings Drawer */}
      <SettingsDrawer 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        currentThreshold={alarmThreshold}
        onSave={setAlarmThreshold}
      />
    </div>
  );
}
