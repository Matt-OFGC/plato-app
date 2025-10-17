"use client";

import { useTimers } from "@/contexts/TimerContext";

export function TimerSettings() {
  const { settings, updateSettings } = useTimers();

  const playTestSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      switch (settings.ringtone) {
        case 'beep':
          oscillator.frequency.value = 800;
          oscillator.type = 'sine';
          gainNode.gain.setValueAtTime(settings.volume * 0.3, audioContext.currentTime);
          oscillator.start();
          oscillator.stop(audioContext.currentTime + 0.2);
          break;
        case 'chime':
          oscillator.frequency.value = 523;
          oscillator.type = 'sine';
          gainNode.gain.setValueAtTime(settings.volume * 0.3, audioContext.currentTime);
          oscillator.start();
          oscillator.stop(audioContext.currentTime + 0.2);
          setTimeout(() => {
            const osc2 = audioContext.createOscillator();
            const gain2 = audioContext.createGain();
            osc2.connect(gain2);
            gain2.connect(audioContext.destination);
            osc2.frequency.value = 659;
            osc2.type = 'sine';
            gain2.gain.setValueAtTime(settings.volume * 0.3, audioContext.currentTime);
            osc2.start();
            osc2.stop(audioContext.currentTime + 0.3);
          }, 200);
          break;
        case 'bell':
          oscillator.frequency.value = 1000;
          oscillator.type = 'triangle';
          gainNode.gain.setValueAtTime(settings.volume * 0.4, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
          oscillator.start();
          oscillator.stop(audioContext.currentTime + 0.5);
          break;
      }
    } catch (e) {
      console.error('Audio test failed');
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Timer Notifications</h3>
      <p className="text-sm text-gray-600 mb-6">Customize how timer alerts sound when they complete</p>
      
      <div className="space-y-6">
        {/* Volume Control */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-3">
            Alert Volume: <span className="text-emerald-600 font-semibold">{Math.round(settings.volume * 100)}%</span>
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={settings.volume * 100}
            onChange={(e) => updateSettings({ volume: parseInt(e.target.value) / 100 })}
            className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Silent</span>
            <span>Loud</span>
          </div>
        </div>
        
        {/* Ringtone Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-3">Alert Sound</label>
          <div className="space-y-3">
            {(['beep', 'chime', 'bell'] as const).map((tone) => (
              <label key={tone} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="ringtone"
                  value={tone}
                  checked={settings.ringtone === tone}
                  onChange={(e) => updateSettings({ ringtone: e.target.value as any })}
                  className="w-5 h-5 text-emerald-600 focus:ring-emerald-500"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-900 capitalize block">{tone}</span>
                  <span className="text-xs text-gray-500">
                    {tone === 'beep' && 'Simple single tone - quick and subtle'}
                    {tone === 'chime' && 'Pleasant two-tone melody - friendly reminder'}
                    {tone === 'bell' && 'Resonant bell sound - attention-grabbing'}
                  </span>
                </div>
              </label>
            ))}
          </div>
        </div>
        
        {/* Test Sound Button */}
        <button
          onClick={playTestSound}
          type="button"
          className="w-full px-4 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg hover:shadow-lg transition-all font-medium flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          </svg>
          Test Alert Sound
        </button>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-xs text-blue-800">
            <strong>💡 Tip:</strong> Your browser may block sounds on first load. Click "Test Alert Sound" to enable audio, then your timer notifications will work perfectly!
          </p>
        </div>
      </div>
    </div>
  );
}

