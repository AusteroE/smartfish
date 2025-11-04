'use client';

import { useEffect, useState } from 'react';
import FishDetectionModal from '@/components/FishDetectionModal';
import Image from 'next/image';

interface SensorData {
  ph: number | null;
  temperature: number | null;
}

export default function DashboardPage() {
  const [sensorData, setSensorData] = useState<SensorData>({ ph: null, temperature: null });
  const [connectionStatus, setConnectionStatus] = useState(true);
  const [cameraModalOpen, setCameraModalOpen] = useState(false);

  useEffect(() => {
    // Use Server-Sent Events for real-time updates
    const eventSource = new EventSource('/api/iot-data/stream');

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const ph = data.ph !== null && data.ph !== undefined
          ? parseFloat(data.ph.toString())
          : null;
        const temperature = data.temperature !== null && data.temperature !== undefined
          ? parseFloat(data.temperature.toString())
          : null;

        const isPHValid = ph !== null && !isNaN(ph) && ph >= 0.0 && ph <= 14.0;
        const isTempValid = temperature !== null && !isNaN(temperature) && temperature > -20 && temperature < 100;

        if (isPHValid || isTempValid) {
          setSensorData({ ph: isPHValid ? ph : null, temperature: isTempValid ? temperature : null });
          setConnectionStatus(true);
        } else {
          setSensorData({ ph: null, temperature: null });
          setConnectionStatus(true);
        }
      } catch (err) {
        console.error('Error parsing SSE data:', err);
      }
    };

    eventSource.onerror = (err) => {
      console.error('SSE connection error:', err);
      eventSource.close();
      setConnectionStatus(false);

      // Fallback to polling if SSE fails
      const fetchSensorData = () => {
        fetch('/api/iot-data?t=' + new Date().getTime())
          .then((response) => {
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
          })
          .then((json) => {
            const ph = json.data?.ph !== null && json.data?.ph !== undefined
              ? parseFloat(json.data.ph.toString())
              : null;
            const temperature = json.data?.temperature !== null && json.data?.temperature !== undefined
              ? parseFloat(json.data.temperature.toString())
              : null;

            const isPHValid = ph !== null && !isNaN(ph) && ph >= 0.0 && ph <= 14.0;
            const isTempValid = temperature !== null && !isNaN(temperature) && temperature > -20 && temperature < 100;

            if (isPHValid || isTempValid) {
              setSensorData({ ph: isPHValid ? ph : null, temperature: isTempValid ? temperature : null });
              setConnectionStatus(true);
            }
          })
          .catch((err) => {
            console.error('Error fetching sensor data (fallback):', err);
            setConnectionStatus(false);
          });
      };

      fetchSensorData();
      const interval = setInterval(fetchSensorData, 2000); // Poll every 2 seconds as fallback

      return () => {
        clearInterval(interval);
      };
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const interpretPHStatus = (ph: number | null) => {
    if (ph === null || isNaN(ph) || ph < 0.0 || ph > 14.0)
      return { status: 'No Data', color: 'gray' };
    if (ph >= 6.5 && ph <= 8.0) return { status: 'SAFE', color: 'green' };
    if (ph >= 4.1 && ph < 6.5) return { status: 'ACIDIC', color: 'orange' };
    if (ph > 8.0 && ph <= 9.5) return { status: 'ALKALINE', color: 'orange' };
    if (ph <= 4.0) return { status: 'DNG ACIDIC', color: 'red' };
    if (ph > 9.5) return { status: 'DNG ALKALINE', color: 'red' };
    return { status: 'UNKNOWN', color: 'gray' };
  };

  const interpretTemperatureStatus = (temp: number | null) => {
    if (temp === null || isNaN(temp)) return { status: 'No Data', color: 'gray' };
    if (temp >= 24 && temp <= 27) return { status: `${temp.toFixed(1)} °C`, color: 'green' };
    if ((temp >= 22 && temp < 24) || (temp > 27 && temp <= 29))
      return { status: `${temp.toFixed(1)} °C`, color: 'orange' };
    return { status: `${temp.toFixed(1)} °C`, color: 'red' };
  };

  const phStatus = interpretPHStatus(sensorData.ph);
  const tempStatus = interpretTemperatureStatus(sensorData.temperature);

  return (
    <>
      <header className="text-center mb-10">
        <Image
          src="/smartfishcarelogo.png"
          alt="Smart Fish Care Logo"
          width={150}
          height={150}
          className="mx-auto mb-2 drop-shadow-lg"
          priority
        />
        <h1 className="text-4xl font-extrabold text-[#e6e9ef] mb-2">Dashboard</h1>
        <div className="mt-4">
          <p className="text-lg text-[#e6e9ef]">
            Connection Status:{' '}
            <span className={connectionStatus ? 'text-green-500' : 'text-red-500'}>
              {connectionStatus ? 'Connected' : 'Not Connected'}
            </span>
          </p>
          <p id="data-status" className={`mt-2 ${connectionStatus ? 'text-[#a2a8b6]' : 'text-red-500'}`}>
            {connectionStatus ? (
              sensorData.ph !== null || sensorData.temperature !== null
                ? `Last updated: ${new Date().toLocaleTimeString()}`
                : 'No valid sensor data detected.'
            ) : (
              'Connection error - Unable to fetch sensor data'
            )}
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-5">
        {/* Water Temperature Card */}
        <div className="bg-gradient-to-b from-white/6 to-white/2 border border-white/8 rounded-2xl p-8 min-h-[180px] backdrop-blur-sm shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
          <h3 className="text-xl font-semibold text-[#e6e9ef] mb-5">Water Temperature</h3>
          <div className="text-center py-2">
            <div className={`text-4xl font-bold ${tempStatus.color === 'green' ? 'text-green-500' :
              tempStatus.color === 'orange' ? 'text-orange-500' :
                tempStatus.color === 'red' ? 'text-red-500' :
                  'text-gray-500'
              }`}>
              {tempStatus.status}
            </div>
          </div>
        </div>

        {/* Fish Sizes Card */}
        <div className="bg-gradient-to-b from-white/6 to-white/2 border border-white/8 rounded-2xl p-8 min-h-[180px] backdrop-blur-sm shadow-[0_10px_30px_rgba(0,0,0,0.35)] cursor-pointer hover:scale-105 transition-transform"
          onClick={() => setCameraModalOpen(true)}>
          <h3 className="text-xl font-semibold text-[#e6e9ef] mb-5">Fish Sizes</h3>
          <div className="flex flex-col items-center justify-center h-full">
            <div className="w-20 h-20 bg-[#7c5cff]/20 rounded-full flex items-center justify-center mb-3">
              <i className="fas fa-camera text-3xl text-[#7c5cff]"></i>
            </div>
            <p className="text-[#a2a8b6] text-sm">Connect your Web cam</p>
          </div>
        </div>

        {/* Water Quality Level Card */}
        <div className="bg-gradient-to-b from-white/6 to-white/2 border border-white/8 rounded-2xl p-8 min-h-[180px] backdrop-blur-sm shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
          <h3 className="text-xl font-semibold text-[#e6e9ef] mb-5">Water Quality Level</h3>
          <div className="text-center py-2">
            {sensorData.ph !== null && !isNaN(sensorData.ph) ? (
              <>
                <div className={`text-4xl font-bold ${phStatus.color === 'green' ? 'text-green-500' :
                  phStatus.color === 'orange' ? 'text-orange-500' :
                    phStatus.color === 'red' ? 'text-red-500' :
                      'text-gray-500'
                  }`}>
                  {sensorData.ph.toFixed(2)}
                </div>
                <div className={`text-sm mt-2 ${phStatus.color === 'green' ? 'text-green-400' :
                  phStatus.color === 'orange' ? 'text-orange-400' :
                    phStatus.color === 'red' ? 'text-red-400' :
                      'text-gray-400'
                  }`}>
                  {phStatus.status}
                </div>
              </>
            ) : (
              <div className="text-4xl font-bold text-gray-500">No Data</div>
            )}
          </div>
        </div>
      </div>

      <FishDetectionModal isOpen={cameraModalOpen} onClose={() => setCameraModalOpen(false)} />
    </>
  );
}
