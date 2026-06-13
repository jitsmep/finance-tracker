import { cookies } from "next/headers";
import { Smartphone, Link as LinkIcon, AlertCircle } from "lucide-react";

export default async function LinkDevicePage() {
  // Grab the current device ID so the user can easily copy it
  const cookieStore = await cookies();
  const currentDeviceId = cookieStore.get("deviceId")?.value || "No device linked";

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Link Devices</h1>
        <p className="text-gray-500 mt-1">Connect your phone, tablet, or another computer to this specific locker.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* --- PANEL 1: YOUR CURRENT ID --- */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Smartphone className="w-6 h-6 text-emerald-600" />
            <h3 className="font-semibold text-lg text-gray-900 dark:text-white">This Device ID</h3>
          </div>
          <p className="text-sm text-gray-500">
            Copy this code and enter it on your other device to grant it access to this data.
          </p>
          
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <code className="text-sm text-gray-800 dark:text-gray-200 break-all select-all">
              {currentDeviceId}
            </code>
          </div>
        </div>

        {/* --- PANEL 2: SYNC A NEW ID --- */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <LinkIcon className="w-6 h-6 text-blue-600" />
            <h3 className="font-semibold text-lg text-gray-900 dark:text-white">Sync from Another Device</h3>
          </div>
          <p className="text-sm text-gray-500">
            Paste the ID from your main computer here to overwrite this device's data and link them together.
          </p>

          {/* This form targets your existing /sync API route! */}
          <form action="/sync" method="GET" className="space-y-4">
            <input 
              type="text" 
              name="id" 
              placeholder="Paste Device ID here..." 
              required
              className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
            />
            <button 
              type="submit" 
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Sync Device Data
            </button>
          </form>
          
          <div className="flex items-start gap-2 mt-4 text-xs text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p>Warning: Syncing will permanently replace this current device's data with the data from the linked ID.</p>
          </div>
        </div>

      </div>
    </div>
  );
}
