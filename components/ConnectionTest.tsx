
import React, { useState } from 'react';
import { Wifi, RefreshCw, CheckCircle, AlertCircle, Globe } from 'lucide-react';

export const ConnectionTest: React.FC = () => {
  const [ipAddress, setIpAddress] = useState('192.168.4.1');
  const [status, setStatus] = useState<'idle' | 'checking' | 'connected' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [responseTime, setResponseTime] = useState<number | null>(null);

  const handlePing = async () => {
    setStatus('checking');
    setMessage('');
    setResponseTime(null);
    
    // Create a controller to timeout the request if it takes too long (e.g., 3 seconds)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    const startTime = Date.now();

    try {
      // Note: This requires the ESP32 to serve HTTP and have CORS enabled
      const response = await fetch(`http://${ipAddress}/status`, {
        method: 'GET',
        signal: controller.signal,
        mode: 'cors', // This enforces CORS checks
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      // Try to parse JSON if possible, otherwise accept text
      const data = await response.text(); 
      
      const endTime = Date.now();
      setResponseTime(endTime - startTime);
      setStatus('connected');
      setMessage(`Success! Device is reachable. Response: "${data.substring(0, 50)}..."`);
      
    } catch (err: any) {
      setStatus('error');
      if (err.name === 'AbortError') {
        setMessage('Connection timed out. Check IP or if device is powered on.');
      } else {
        setMessage(err.message || 'Failed to connect. Ensure phone and ESP32 are on same network.');
      }
    } finally {
      clearTimeout(timeoutId);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300 p-6">
      
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
          <Globe size={24} />
        </div>
        <div>
          <h3 className="font-bold text-gray-800">Connection Test</h3>
          <p className="text-xs text-gray-400">Verify ESP32 Connectivity</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Target IP Address
          </label>
          <div className="relative">
            <input
              type="text"
              value={ipAddress}
              onChange={(e) => setIpAddress(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 text-gray-800 font-mono text-sm rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="192.168.X.X"
            />
          </div>
        </div>

        <button
          onClick={handlePing}
          disabled={status === 'checking'}
          className={`w-full py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all active:scale-95 ${
            status === 'checking' ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200'
          }`}
        >
          {status === 'checking' ? (
            <>
              <RefreshCw className="animate-spin" size={20} />
              Pinging...
            </>
          ) : (
            <>
              <Wifi size={20} />
              Ping Device
            </>
          )}
        </button>

        {/* Results Area */}
        <div className="mt-6">
          {status === 'idle' && (
            <div className="text-center p-6 border-2 border-dashed border-gray-200 rounded-xl">
              <p className="text-sm text-gray-400">Enter IP and click Ping to test.</p>
            </div>
          )}

          {status === 'connected' && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 animate-in fade-in">
              <div className="flex items-start gap-3">
                <CheckCircle className="text-green-600 shrink-0" size={20} />
                <div>
                  <h4 className="font-bold text-green-800 text-sm">Connected Successfully</h4>
                  <p className="text-xs text-green-700 mt-1">{message}</p>
                  {responseTime && (
                    <span className="inline-block mt-2 text-[10px] font-mono bg-green-200 text-green-800 px-2 py-0.5 rounded">
                      Latency: {responseTime}ms
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 animate-in fade-in">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-red-600 shrink-0" size={20} />
                <div>
                  <h4 className="font-bold text-red-800 text-sm">Connection Failed</h4>
                  <p className="text-xs text-red-700 mt-1">{message}</p>
                  <div className="mt-3 text-[10px] text-red-600 bg-red-100 p-2 rounded">
                    <strong>Tip:</strong> Ensure ESP32 code includes:
                    <br/>
                    <code className="font-mono">server.sendHeader("Access-Control-Allow-Origin", "*");</code>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
