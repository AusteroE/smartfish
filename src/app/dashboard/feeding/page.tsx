'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface FeedingRecord {
  id: number;
  fish_size: string;
  food_type: string;
  feeding_time: string;
  quantity: string | null;
  notes: string | null;
}

export default function FeedingPage() {
  const router = useRouter();
  const [records, setRecords] = useState<FeedingRecord[]>([]);

  useEffect(() => {
    loadFeedingRecords();
  }, []);

  const loadFeedingRecords = async () => {
    try {
      const response = await fetch('/api/feeding-backend?action=get_feeding');
      const result = await response.json();
      if (result.success) {
        setRecords(result.data);
      }
    } catch (error) {
      console.error('Error loading feeding records:', error);
    }
  };

  const addFeed = async () => {
    const form = document.getElementById('feedForm') as HTMLFormElement;
    const formData = new FormData(form);
    formData.append('action', 'add_feeding');

    try {
      const response = await fetch('/api/feeding-backend', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();
      if (result.success) {
        form.reset();
        loadFeedingRecords();
        alert('Feeding record added successfully!');
      } else {
        alert('Error: ' + result.message);
      }
    } catch (error) {
      console.error('Error adding feeding record:', error);
      alert('Error adding feeding record');
    }
  };

  const deleteRecord = async (recordId: number) => {
    if (confirm('Are you sure you want to delete this record?')) {
      const formData = new FormData();
      formData.append('action', 'delete_feeding');
      formData.append('record_id', recordId.toString());

      try {
        const response = await fetch('/api/feeding-backend', {
          method: 'POST',
          body: formData,
        });
        const result = await response.json();
        if (result.success) {
          loadFeedingRecords();
          alert('Record deleted successfully!');
        } else {
          alert('Error: ' + result.message);
        }
      } catch (error) {
        console.error('Error deleting record:', error);
        alert('Error deleting record');
      }
    }
  };

  return (
    <>
      <header className="text-center mb-10">
        <Image
          src="/smartfishcarelogo.png"
          alt="Smart Fish Care Logo"
          width={150}
          height={150}
          className="mx-auto mb-2"
          priority
        />
        <h2 className="text-3xl font-bold text-[#7c5cff] flex items-center justify-center">
          <i className="fas fa-arrow-left mr-4 cursor-pointer p-2 rounded-full transition-all hover:bg-white/10 hover:scale-110" onClick={() => router.push('/dashboard/records')} title="Back to Records"></i>
          Feeding Schedule Management
        </h2>
      </header>

      <div className="bg-gradient-to-b from-white/6 to-white/2 border border-white/8 rounded-2xl p-8 backdrop-blur-sm shadow-[0_10px_30px_rgba(0,0,0,0.35)] mb-6">
        <h3 className="text-xl font-semibold text-[#7c5cff] mb-4">Feeding Schedule</h3>
        <form id="feedForm" className="flex items-center justify-center gap-3 my-4 p-3 border border-white/12 rounded-lg flex-wrap">
          <div className="relative flex items-center bg-white/4 border border-white/12 rounded-xl p-3 w-full">
            <i className="fa-solid fa-bone absolute left-3 text-[#a2a8b6]"></i>
            <input type="text" name="food_type" id="feed_food" placeholder="Food Type" required className="w-full bg-transparent border-none text-[#e6e9ef] text-base outline-none pl-10 pr-3" />
          </div>
          <div className="relative flex items-center bg-white/4 border border-white/12 rounded-xl p-3 w-full pl-5">
            <i className="fa-solid fa-clock absolute left-3 text-[#a2a8b6]"></i>
            <input type="time" name="feeding_time" id="feed_time" required className="w-full bg-transparent border-none text-[#e6e9ef] text-base outline-none pl-8 pr-3" />
          </div>
          <div className="relative flex items-center bg-white/4 border border-white/12 rounded-xl p-3 w-full">
            <i className="fa-solid fa-sort-numeric-up absolute left-3 text-[#a2a8b6]"></i>
            <input type="text" name="quantity" id="feed_quantity" placeholder="Quantity" className="w-full bg-transparent border-none text-[#e6e9ef] text-base outline-none pl-10 pr-3" />
          </div>
          <div className="relative flex items-center bg-white/4 border border-white/12 rounded-xl p-3 w-full">
            <i className="fa-solid fa-comment absolute left-3 text-[#a2a8b6]"></i>
            <input type="text" name="notes" id="feed_notes" placeholder="Notes" className="w-full bg-transparent border-none text-[#e6e9ef] text-base outline-none pl-10 pr-3" />
          </div>
          <select name="fish_size" id="feed_size" className="bg-white/4 text-[#e6e9ef] border border-white/12 rounded-[15px] px-5 py-4 pl-[60px] text-base outline-none cursor-pointer">
            <option value="Small">Small</option>
            <option value="Medium">Medium</option>
            <option value="Large">Large</option>
          </select>
          <button type="button" onClick={addFeed} className="bg-gradient-to-r from-[#7c5cff] to-[#4cc9f0] text-white border-none px-6 py-3 rounded-xl text-base font-semibold cursor-pointer transition-all hover:translate-y-[-2px] hover:shadow-[0_4px_15px_rgba(124,92,255,0.4)] whitespace-nowrap">Set</button>
        </form>
        <div className="overflow-x-auto mt-4">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="text-center p-3 w-[15%] bg-white/5 font-semibold">Size</th>
                <th className="text-center p-3 w-[25%] bg-white/5 font-semibold">Food</th>
                <th className="text-center p-3 w-[20%] bg-white/5 font-semibold">Time</th>
                <th className="text-center p-3 w-[20%] bg-white/5 font-semibold">Quantity</th>
                <th className="text-center p-3 w-[20%] bg-white/5 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="border-t border-white/12">
              {records.map((r) => (
                <tr key={r.id} className="hover:bg-white/3">
                  <td className="p-2.5 text-center">{r.fish_size}</td>
                  <td className="p-2.5 text-center">{r.food_type}</td>
                  <td className="p-2.5 text-center">{r.feeding_time}</td>
                  <td className="p-2.5 text-center">{r.quantity || 'N/A'}</td>
                  <td className="p-2.5 text-center">
                    <button onClick={() => deleteRecord(r.id)} className="bg-red-500/20 text-red-500 border border-red-500/30 px-3 py-1.5 rounded-md cursor-pointer text-sm transition-all hover:bg-red-500/30 hover:translate-y-[-1px]">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
