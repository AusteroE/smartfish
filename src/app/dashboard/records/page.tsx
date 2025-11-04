'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface FishSizeRange {
  id: number;
  category: string;
  minLength: number;
  maxLength: number | null;
  minWidth: number;
  maxWidth: number | null;
}

interface WaterParameter {
  id: number;
  parameterName: string;
  normalMin: number;
  normalMax: number;
  dangerMin: number | null;
  dangerMax: number | null;
  unit: string;
}

export default function RecordsPage() {
  const router = useRouter();
  const [fishRanges, setFishRanges] = useState<FishSizeRange[]>([]);
  const [waterParams, setWaterParams] = useState<WaterParameter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/records/fish-ranges').then((res) => res.json()),
      fetch('/api/records/water-parameters').then((res) => res.json()),
    ])
      .then(([fishData, waterData]) => {
        if (fishData.success) {
          setFishRanges(fishData.data);
        }
        if (waterData.success) {
          setWaterParams(waterData.data);
        }
      })
      .catch((err) => console.error('Error fetching records:', err))
      .finally(() => setLoading(false));
  }, []);

  const downloadPDF = () => {
    // Open PDF export in new window (will auto-print)
    window.open('/api/records/export-pdf', '_blank');
  };

  return (
    <>
      <header className="text-center mb-4 sm:mb-6 md:mb-10 px-2 sm:px-4">
        <Image
          src="/smartfishcarelogo.png"
          alt="Smart Fish Care Logo"
          width={120}
          height={120}
          priority
          className="mx-auto mb-2 w-16 h-16 sm:w-20 sm:h-20 md:w-[120px] md:h-[120px]"
        />
        <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-[#7c5cff] mb-3 sm:mb-4 px-2 leading-tight">Ranges, Stocking, Harvest & Feeding</h2>
        <div className="mt-3 sm:mt-4 md:mt-5">
          <button
            onClick={downloadPDF}
            className="inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 bg-gradient-to-r from-[#667eea] to-[#764ba2] border-none rounded-xl text-white text-xs sm:text-sm font-semibold cursor-pointer transition-all duration-300 shadow-[0_4px_15px_rgba(102,126,234,0.3)] hover:translate-y-[-2px] hover:shadow-[0_6px_20px_rgba(102,126,234,0.4)] w-full max-w-xs sm:w-auto"
          >
            <i className="fas fa-file-pdf text-sm sm:text-base"></i>
            <span>Download PDF Report</span>
          </button>
        </div>
      </header>

      <div className="flex flex-col gap-4 sm:gap-6 md:gap-8 pt-2 sm:pt-4 md:pt-8 pb-20 sm:pb-24">
        {/* Fish Size Ranges */}
        <div className="bg-gradient-to-b from-white/6 to-white/2 border border-white/8 rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-8 backdrop-blur-sm shadow-[0_10px_30px_rgba(0,0,0,0.35)] hover:shadow-[0_15px_40px_rgba(0,0,0,0.45)] transition-shadow duration-300">
          <h3 className="text-base sm:text-lg md:text-xl font-semibold text-[#e6e9ef] mb-3 sm:mb-4 md:mb-5 flex items-center gap-2">
            <i className="fas fa-ruler-combined text-[#7c5cff] text-sm sm:text-base"></i>
            <span>Fish Size Ranges</span>
          </h3>
          <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0 mt-3 sm:mt-4" style={{ WebkitOverflowScrolling: 'touch' }}>
            <div className="inline-block min-w-full align-middle">
              <table className="w-full border-collapse text-xs sm:text-sm min-w-[400px] md:min-w-full" style={{ tableLayout: 'fixed' }}>
                <thead>
                  <tr>
                    <th className="text-center p-2 sm:p-3 bg-white/5 font-semibold text-white/90" style={{ width: '33%' }}>Category</th>
                    <th className="text-center p-2 sm:p-3 bg-white/5 font-semibold text-white/90" style={{ width: '33%' }}>Length (cm)</th>
                    <th className="text-center p-2 sm:p-3 bg-white/5 font-semibold text-white/90" style={{ width: '34%' }}>Width (cm)</th>
                  </tr>
                </thead>
                <tbody className="border-t border-white/12">
                  {loading ? (
                    <tr>
                      <td colSpan={3} className="p-4 sm:p-6 text-center text-white/50 text-sm sm:text-base">
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        Loading...
                      </td>
                    </tr>
                  ) : fishRanges.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="p-4 sm:p-6 text-center text-white/50 text-sm sm:text-base">
                        <i className="fas fa-info-circle mr-2"></i>
                        No fish size ranges available
                      </td>
                    </tr>
                  ) : (
                    fishRanges.map((range) => (
                      <tr key={range.id} className="hover:bg-white/3 transition-colors border-b border-white/5">
                        <td className="p-1.5 sm:p-2.5 text-center text-white/90 text-[10px] sm:text-xs md:text-sm truncate" title={range.category}>{range.category}</td>
                        <td className="p-1.5 sm:p-2.5 text-center text-white/90 text-[10px] sm:text-xs md:text-sm">{range.minLength} - {range.maxLength || '∞'}</td>
                        <td className="p-1.5 sm:p-2.5 text-center text-white/90 text-[10px] sm:text-xs md:text-sm">{range.minWidth} - {range.maxWidth || '∞'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Water Parameters */}
        <div className="bg-gradient-to-b from-white/6 to-white/2 border border-white/8 rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-8 backdrop-blur-sm shadow-[0_10px_30px_rgba(0,0,0,0.35)] hover:shadow-[0_15px_40px_rgba(0,0,0,0.45)] transition-shadow duration-300">
          <h3 className="text-base sm:text-lg md:text-xl font-semibold text-[#e6e9ef] mb-3 sm:mb-4 md:mb-5 flex items-center gap-2">
            <i className="fas fa-water text-[#7c5cff] text-sm sm:text-base"></i>
            <span>Water Parameters</span>
          </h3>
          <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0 mt-3 sm:mt-4" style={{ WebkitOverflowScrolling: 'touch' }}>
            <div className="inline-block min-w-full align-middle">
              <table className="w-full border-collapse text-xs sm:text-sm min-w-[450px] md:min-w-full" style={{ tableLayout: 'fixed' }}>
                <thead>
                  <tr>
                    <th className="text-center p-2 sm:p-3 bg-white/5 font-semibold text-white/90" style={{ width: '28%' }}>Parameter</th>
                    <th className="text-center p-2 sm:p-3 bg-white/5 font-semibold text-white/90" style={{ width: '32%' }}>Normal</th>
                    <th className="text-center p-2 sm:p-3 bg-white/5 font-semibold text-white/90" style={{ width: '40%' }}>Danger</th>
                  </tr>
                </thead>
                <tbody className="border-t border-white/12">
                  {loading ? (
                    <tr>
                      <td colSpan={3} className="p-4 sm:p-6 text-center text-white/50 text-sm sm:text-base">
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        Loading...
                      </td>
                    </tr>
                  ) : waterParams.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="p-4 sm:p-6 text-center text-white/50 text-sm sm:text-base">
                        <i className="fas fa-info-circle mr-2"></i>
                        No water parameters available
                      </td>
                    </tr>
                  ) : (
                    waterParams.map((param) => (
                      <tr key={param.id} className="hover:bg-white/3 transition-colors border-b border-white/5">
                        <td className="p-1.5 sm:p-2.5 text-center text-white/90 text-[10px] sm:text-xs md:text-sm truncate" title={param.parameterName}>{param.parameterName}</td>
                        <td className="p-1.5 sm:p-2.5 text-center text-white/90 text-[10px] sm:text-xs md:text-sm">{param.normalMin} - {param.normalMax} {param.unit}</td>
                        <td className="p-1.5 sm:p-2.5 text-center text-white/90 text-[10px] sm:text-xs md:text-sm truncate" title={param.dangerMin !== null && param.dangerMax !== null ? `< ${param.dangerMin} ${param.unit} or > ${param.dangerMax} ${param.unit}` : 'N/A'}>
                          {param.dangerMin !== null && param.dangerMax !== null
                            ? `< ${param.dangerMin} ${param.unit} or > ${param.dangerMax} ${param.unit}`
                            : 'N/A'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Navigation Cards */}
        <div className="bg-gradient-to-b from-white/6 to-white/2 border border-white/8 rounded-lg sm:rounded-xl md:rounded-2xl p-4 sm:p-6 md:p-8 backdrop-blur-sm shadow-[0_10px_30px_rgba(0,0,0,0.35)] hover:shadow-[0_15px_40px_rgba(0,0,0,0.45)] transition-shadow duration-300">
          <h3 className="text-base sm:text-lg md:text-xl font-semibold text-[#7c5cff] mb-3 sm:mb-4 flex items-center gap-2">
            <i className="fas fa-fish text-sm sm:text-base"></i>
            <span>Stocking Management</span>
          </h3>
          <p className="my-3 sm:my-4 text-xs sm:text-sm md:text-base text-white/70 leading-relaxed">Manage fish stocking records, track aquarium populations, and monitor fish additions to your system.</p>
          <button
            onClick={() => router.push('/dashboard/stocking')}
            className="flex items-center justify-center gap-2 sm:gap-2.5 mx-auto mt-4 sm:mt-5 px-5 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-4 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white border-none rounded-xl text-xs sm:text-sm md:text-base font-semibold cursor-pointer transition-all duration-300 shadow-[0_4px_15px_rgba(102,126,234,0.3)] hover:translate-y-[-2px] hover:shadow-[0_6px_20px_rgba(102,126,234,0.4)] w-full sm:w-auto"
          >
            <i className="fa-solid fa-fish text-base sm:text-lg"></i>
            <span>Go to Stocking</span>
          </button>
        </div>

        <div className="bg-gradient-to-b from-white/6 to-white/2 border border-white/8 rounded-lg sm:rounded-xl md:rounded-2xl p-4 sm:p-6 md:p-8 backdrop-blur-sm shadow-[0_10px_30px_rgba(0,0,0,0.35)] hover:shadow-[0_15px_40px_rgba(0,0,0,0.45)] transition-shadow duration-300">
          <h3 className="text-base sm:text-lg md:text-xl font-semibold text-[#7c5cff] mb-3 sm:mb-4 flex items-center gap-2">
            <i className="fas fa-seedling text-sm sm:text-base"></i>
            <span>Harvest Management</span>
          </h3>
          <p className="my-3 sm:my-4 text-xs sm:text-sm md:text-base text-white/70 leading-relaxed">Record fish harvests, track yields, and manage harvest data with size and weight information.</p>
          <button
            onClick={() => router.push('/dashboard/harvest')}
            className="flex items-center justify-center gap-2 sm:gap-2.5 mx-auto mt-4 sm:mt-5 px-5 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-4 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white border-none rounded-xl text-xs sm:text-sm md:text-base font-semibold cursor-pointer transition-all duration-300 shadow-[0_4px_15px_rgba(102,126,234,0.3)] hover:translate-y-[-2px] hover:shadow-[0_6px_20px_rgba(102,126,234,0.4)] w-full sm:w-auto"
          >
            <i className="fa-solid fa-seedling text-base sm:text-lg"></i>
            <span>Go to Harvest</span>
          </button>
        </div>

        <div className="bg-gradient-to-b from-white/6 to-white/2 border border-white/8 rounded-lg sm:rounded-xl md:rounded-2xl p-4 sm:p-6 md:p-8 backdrop-blur-sm shadow-[0_10px_30px_rgba(0,0,0,0.35)] hover:shadow-[0_15px_40px_rgba(0,0,0,0.45)] transition-shadow duration-300">
          <h3 className="text-base sm:text-lg md:text-xl font-semibold text-[#7c5cff] mb-3 sm:mb-4 flex items-center gap-2">
            <i className="fas fa-bone text-sm sm:text-base"></i>
            <span>Feeding Schedule Management</span>
          </h3>
          <p className="my-3 sm:my-4 text-xs sm:text-sm md:text-base text-white/70 leading-relaxed">Facilitate feeding schedules, manage food types, and track feeding times for different fish sizes.</p>
          <button
            onClick={() => router.push('/dashboard/feeding')}
            className="flex items-center justify-center gap-2 sm:gap-2.5 mx-auto mt-4 sm:mt-5 px-5 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-4 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white border-none rounded-xl text-xs sm:text-sm md:text-base font-semibold cursor-pointer transition-all duration-300 shadow-[0_4px_15px_rgba(102,126,234,0.3)] hover:translate-y-[-2px] hover:shadow-[0_6px_20px_rgba(102,126,234,0.4)] w-full sm:w-auto"
          >
            <i className="fa-solid fa-bone text-base sm:text-lg"></i>
            <span>Go to Feeding Schedule</span>
          </button>
        </div>
      </div>
    </>
  );
}
