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

  useEffect(() => {
    fetch('/api/records/fish-ranges')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setFishRanges(data.data);
        }
      })
      .catch((err) => console.error('Error fetching fish ranges:', err));

    fetch('/api/records/water-parameters')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setWaterParams(data.data);
        }
      })
      .catch((err) => console.error('Error fetching water parameters:', err));
  }, []);

  const downloadPDF = async () => {
    try {
      const response = await fetch('/api/records/export-pdf');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'SmartFishCare_Records_Report.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to download PDF report.');
    }
  };

  return (
    <>
      <header className="text-center mb-10">
        <Image
          src="/smartfishcarelogo.png"
          alt="Smart Fish Care Logo"
          width={120}
          height={120}
          priority
          className="mx-auto mb-2"
        />
        <h2 className="text-3xl font-bold text-[#7c5cff] mb-4">Ranges, Stocking, Harvest & Feeding</h2>
        <div className="mt-5">
          <button
            onClick={downloadPDF}
            className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-[#667eea] to-[#764ba2] border-none rounded-xl text-white text-sm font-semibold cursor-pointer transition-all duration-300 shadow-[0_4px_15px_rgba(102,126,234,0.3)] hover:translate-y-[-2px] hover:shadow-[0_6px_20px_rgba(102,126,234,0.4)]"
          >
            <i className="fas fa-file-pdf"></i>
            <span>Download PDF Report</span>
          </button>
        </div>
      </header>

      <div className="flex flex-col gap-6 pt-12 pb-24">
        {/* Fish Size Ranges */}
        <div className="bg-gradient-to-b from-white/6 to-white/2 border border-white/8 rounded-2xl p-8 backdrop-blur-sm shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
          <h3 className="text-xl font-semibold text-[#e6e9ef] mb-4">Fish Size Ranges</h3>
          <div className="overflow-x-auto mt-4">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-center p-3 w-[30%] bg-white/5 font-semibold">Category</th>
                  <th className="text-center p-3 w-[35%] bg-white/5 font-semibold">Length (cm)</th>
                  <th className="text-center p-3 w-[35%] bg-white/5 font-semibold">Width (cm)</th>
                </tr>
              </thead>
              <tbody className="border-t border-white/12">
                {fishRanges.map((range) => (
                  <tr key={range.id} className="hover:bg-white/3">
                    <td className="p-2.5 text-center">{range.category}</td>
                    <td className="p-2.5 text-center">{range.minLength} - {range.maxLength || '∞'}</td>
                    <td className="p-2.5 text-center">{range.minWidth} - {range.maxWidth || '∞'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Water Parameters */}
        <div className="bg-gradient-to-b from-white/6 to-white/2 border border-white/8 rounded-2xl p-8 backdrop-blur-sm shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
          <h3 className="text-xl font-semibold text-[#e6e9ef] mb-4">Water Parameters</h3>
          <div className="overflow-x-auto mt-4">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-center p-3 w-[30%] bg-white/5 font-semibold">Parameter</th>
                  <th className="text-center p-3 w-[35%] bg-white/5 font-semibold">Normal</th>
                  <th className="text-center p-3 w-[35%] bg-white/5 font-semibold">Danger</th>
                </tr>
              </thead>
              <tbody className="border-t border-white/12">
                {waterParams.map((param) => (
                  <tr key={param.id} className="hover:bg-white/3">
                    <td className="p-2.5 text-center">{param.parameterName}</td>
                    <td className="p-2.5 text-center">{param.normalMin} - {param.normalMax} {param.unit}</td>
                    <td className="p-2.5 text-center">
                      {param.dangerMin !== null && param.dangerMax !== null
                        ? `< ${param.dangerMin} ${param.unit} or > ${param.dangerMax} ${param.unit}`
                        : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Navigation Cards */}
        <div className="bg-gradient-to-b from-white/6 to-white/2 border border-white/8 rounded-2xl p-8 backdrop-blur-sm shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
          <h3 className="text-xl font-semibold text-[#7c5cff] mb-4">Stocking Management</h3>
          <p className="my-4 text-white/70">Manage fish stocking records, track aquarium populations, and monitor fish additions to your system.</p>
          <button
            onClick={() => router.push('/dashboard/stocking')}
            className="flex items-center justify-center gap-2.5 mx-auto mt-5 px-8 py-4 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white border-none rounded-xl text-base font-semibold cursor-pointer transition-all duration-300 shadow-[0_4px_15px_rgba(102,126,234,0.3)] hover:translate-y-[-2px] hover:shadow-[0_6px_20px_rgba(102,126,234,0.4)]"
          >
            <i className="fa-solid fa-fish text-lg"></i>
            <span>Go to Stocking</span>
          </button>
        </div>

        <div className="bg-gradient-to-b from-white/6 to-white/2 border border-white/8 rounded-2xl p-8 backdrop-blur-sm shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
          <h3 className="text-xl font-semibold text-[#7c5cff] mb-4">Harvest Management</h3>
          <p className="my-4 text-white/70">Record fish harvests, track yields, and manage harvest data with size and weight information.</p>
          <button
            onClick={() => router.push('/dashboard/harvest')}
            className="flex items-center justify-center gap-2.5 mx-auto mt-5 px-8 py-4 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white border-none rounded-xl text-base font-semibold cursor-pointer transition-all duration-300 shadow-[0_4px_15px_rgba(102,126,234,0.3)] hover:translate-y-[-2px] hover:shadow-[0_6px_20px_rgba(102,126,234,0.4)]"
          >
            <i className="fa-solid fa-seedling text-lg"></i>
            <span>Go to Harvest</span>
          </button>
        </div>

        <div className="bg-gradient-to-b from-white/6 to-white/2 border border-white/8 rounded-2xl p-8 backdrop-blur-sm shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
          <h3 className="text-xl font-semibold text-[#7c5cff] mb-4">Feeding Schedule Management</h3>
          <p className="my-4 text-white/70">Facilitate feeding schedules, manage food types, and track feeding times for different fish sizes.</p>
          <button
            onClick={() => router.push('/dashboard/feeding')}
            className="flex items-center justify-center gap-2.5 mx-auto mt-5 px-8 py-4 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white border-none rounded-xl text-base font-semibold cursor-pointer transition-all duration-300 shadow-[0_4px_15px_rgba(102,126,234,0.3)] hover:translate-y-[-2px] hover:shadow-[0_6px_20px_rgba(102,126,234,0.4)]"
          >
            <i className="fa-solid fa-bone text-lg"></i>
            <span>Go to Feeding Schedule</span>
          </button>
        </div>
      </div>
    </>
  );
}
