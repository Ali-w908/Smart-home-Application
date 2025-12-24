
import React, { useState, useEffect } from 'react';
import { Wifi, RefreshCw, CheckCircle, AlertCircle, Globe, Link, Unlink } from 'lucide-react';
import { arduinoService } from '../services/arduinoService';

export const ConnectionTest: React.FC = () => {
  const [ipAddress, setIpAddress] = useState('192.168.1.100');
  const [status, setStatus] = useState<'idle' | 'checking' | 'connected' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [isActiveConnection, setIsActiveConnection] = useState(false);

  // Check if already connected on mount
  useEffect(() => {
    const savedIP = arduinoService.getIP();
    if (savedIP) {
      setIpAddress(savedIP);
      setIsActiveConnection(arduinoService.isConnected());
    }
  }, []);

  // Subscribe to connection status changes
  useEffect(() => {
    const unsubscribe = arduinoService.subscribe((state) => {
      setIsActiveConnection(state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  const handlePing = async () => {
    setStatus('checking');
    setMessage('');
    setResponseTime(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const startTime = Date.now();

    try {
      const response = await fetch(`http://${ipAddress}/STATUS`, {
        method: 'GET',
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const data = await response.text();

      const endTime = Date.now();
      setResponseTime(endTime - startTime);
      setStatus('connected');
      setMessage(`Success! Response: "${data.substring(0, 80)}${data.length > 80 ? '...' : ''}"`);

    } catch (err: any) {
      setStatus('error');
      if (err.name === 'AbortError') {
        setMessage('Connection timed out. Check IP or if device is powered on.');
      } else {
        setMessage(err.message || 'Failed to connect. Ensure phone and Arduino are on same network.');
      }
    } finally {
      clearTimeout(timeoutId);
    }
  };

  const handleConnect = () => {
    arduinoService.connect(ipAddress);
    setIsActiveConnection(true);
    setMessage('Connected! App is now receiving data from Arduino.');
  };

  const handleDisconnect = () => {
    arduinoService.disconnect();
    setIsActiveConnection(false);
    setStatus('idle');
    setMessage('Disconnected from Arduino.');
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300 p-6">

      <div className="flex items-center gap-3 mb-6">
        <div className={`p-3 rounded-xl ${isActiveConnection ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
          <Globe size={24} />
        </div>
        <div>
          <h3 className="font-bold text-gray-800">Arduino Connection</h3>
          <p className="text-xs text-gray-400">
            {isActiveConnection ? 'Live connection active' : 'Connect to your ESP8266'}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Arduino IP Address
          </label>
          <div className="relative">
            <input
              type="text"
              value={ipAddress}
              onChange={(e) => setIpAddress(e.target.value)}
              disabled={isActiveConnection}
              className={`w-full bg-gray-50 border border-gray-200 text-gray-800 font-mono text-sm rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${isActiveConnection ? 'opacity-50 cursor-not-allowed' : ''}`}
              placeholder="192.168.X.X"
            />
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Find this in Arduino Serial Monitor after "STAIP"
          </p>
        </div>

        {!isActiveConnection && (
          <button
            onClick={handlePing}
            disabled={status === 'checking'}
            className={`w-full py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all active:scale-95 ${status === 'checking' ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200'
              }`}
          >
            {status === 'checking' ? (
              <>
                <RefreshCw className="animate-spin" size={20} />
                Testing...
              </>
            ) : (
              <>
                <Wifi size={20} />
                Test Connection
              </>
            )}
          </button>
        )}

        {/* Connect/Disconnect Button */}
        {status === 'connected' && !isActiveConnection && (
          <button
            onClick={handleConnect}
            className="w-full py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all active:scale-95 bg-green-600 hover:bg-green-700 shadow-lg shadow-green-200"
          >
            <Link size={20} />
            Connect & Start Control
          </button>
        )}

        {isActiveConnection && (
          <button
            onClick={handleDisconnect}
            className="w-full py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all active:scale-95 bg-red-600 hover:bg-red-700 shadow-lg shadow-red-200"
          >
            <Unlink size={20} />
            Disconnect
          </button>
        )}

        {/* Results Area */}
        <div className="mt-6">
          {status === 'idle' && !isActiveConnection && (
            <div className="text-center p-6 border-2 border-dashed border-gray-200 rounded-xl">
              <p className="text-sm text-gray-400">Enter Arduino IP and click "Test Connection".</p>
              <p className="text-xs text-gray-300 mt-2">
                Make sure your phone and Arduino are on the same WiFi network.
              </p>
            </div>
          )}

          {status === 'connected' && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 animate-in fade-in">
              <div className="flex items-start gap-3">
                <CheckCircle className="text-green-600 shrink-0" size={20} />
                <div>
                  <h4 className="font-bold text-green-800 text-sm">Connection Successful</h4>
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
                    <strong>Tips:</strong>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>Check Arduino Serial Monitor for IP address</li>
                      <li>Ensure both devices are on same WiFi</li>
                      <li>Verify Arduino is powered and running</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {isActiveConnection && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 animate-in fade-in">
              <div className="flex items-start gap-3">
                <CheckCircle className="text-green-600 shrink-0" size={20} />
                <div>
                  <h4 className="font-bold text-green-800 text-sm">Live Connection Active</h4>
                  <p className="text-xs text-green-700 mt-1">
                    Receiving real-time data from Arduino at {ipAddress}
                  </p>
                  <p className="text-xs text-green-600 mt-2">
                    Go to Dashboard to control your smart home!
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
