"use client";

import React, { useState } from "react";
import { useFinance } from "@/components/FinanceProvider";
import { 
  Smartphone, 
  Link as LinkIcon, 
  AlertCircle, 
  Copy, 
  Check, 
  CloudUpload, 
  CloudDownload, 
  RotateCw,
  Sparkles
} from "lucide-react";

export default function LinkDevicePage() {
  const { deviceId, lastSynced, isSyncing, uploadBackup, restoreBackup } = useFinance();
  const [targetId, setTargetId] = useState("");
  const [copied, setCopied] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ type: "idle" | "success" | "error"; message?: string }>({ type: "idle" });
  const [isBackupLoading, setIsBackupLoading] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(deviceId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleManualBackup = async () => {
    setIsBackupLoading(true);
    try {
      await uploadBackup();
      setSyncStatus({ type: "success", message: "Data backed up to cloud successfully!" });
    } catch (err) {
      console.error(err);
      setSyncStatus({ type: "error", message: "Failed to upload manual backup." });
    } finally {
      setIsBackupLoading(false);
    }
  };

  const handleSyncSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetId.trim()) return;
    if (targetId.trim() === deviceId) {
      setSyncStatus({ type: "error", message: "You cannot sync with the same device ID!" });
      return;
    }
    setSyncStatus({ type: "idle" });
    setShowConfirmModal(true);
  };

  const confirmSync = async () => {
    setShowConfirmModal(false);
    setSyncStatus({ type: "idle" });
    const result = await restoreBackup(targetId.trim());
    if (result.success) {
      setSyncStatus({ type: "success", message: "Device successfully linked! Data has been imported." });
      setTargetId("");
    } else {
      setSyncStatus({ type: "error", message: result.error || "Failed to link device." });
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-300">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Link Devices</h1>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Keep your finance locker in sync across your phone, tablet, and computer.
          </p>
        </div>
      </div>

      {/* FEEDBACK TOAST/ALERT */}
      {syncStatus.type !== "idle" && (
        <div 
          className={`p-4 rounded-xl flex items-start gap-3 border transition-all ${
            syncStatus.type === "success" 
              ? "bg-emerald-50/80 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300"
              : "bg-red-50/80 border-red-200 dark:bg-red-950/20 dark:border-red-900/50 text-red-800 dark:text-red-300"
          }`}
        >
          <div className="mt-0.5">
            {syncStatus.type === "success" ? (
              <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            )}
          </div>
          <div className="flex-1 text-sm font-medium">
            {syncStatus.message}
          </div>
          <button 
            onClick={() => setSyncStatus({ type: "idle" })}
            className="text-xs font-semibold underline hover:no-underline opacity-80 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* MAIN PANELS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* PANEL 1: THIS DEVICE DETAIL */}
        <div className="bg-white dark:bg-gray-900/55 backdrop-blur-md border border-gray-200 dark:border-gray-800/80 rounded-3xl p-6 md:p-8 shadow-md flex flex-col justify-between transition-all hover:shadow-lg">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl text-emerald-600 dark:text-emerald-400">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-900 dark:text-white">This Device ID</h3>
                <p className="text-xs text-gray-400 dark:text-gray-500">Auto-saves local changes to the cloud</p>
              </div>
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
              Copy this unique device code and input it on your other device to instantly sync and share this finance ledger.
            </p>
            
            <div className="relative group p-4 bg-gray-50 dark:bg-gray-800/60 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 flex items-center justify-between gap-4">
              <code className="text-base font-semibold tracking-wider text-gray-800 dark:text-gray-200 select-all font-mono break-all">
                {deviceId || "Generating..."}
              </code>
              <button
                onClick={handleCopy}
                disabled={!deviceId}
                className="p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 rounded-xl transition-all shadow-sm active:scale-95 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                title="Copy Device ID"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-4">
            <div className="text-xs text-gray-400 dark:text-gray-500">
              <span className="block font-medium">Backup Status</span>
              <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mt-0.5">
                <span className={`h-1.5 w-1.5 rounded-full ${isSyncing ? "bg-amber-400 animate-pulse" : "bg-emerald-500"}`}></span>
                {isSyncing ? "Syncing..." : lastSynced ? `Last saved: ${lastSynced}` : "Awaiting changes"}
              </span>
            </div>
            <button
              onClick={handleManualBackup}
              disabled={isBackupLoading || isSyncing || !deviceId}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-xl transition-colors disabled:opacity-50"
            >
              {isBackupLoading ? (
                <RotateCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CloudUpload className="w-3.5 h-3.5" />
              )}
              Backup Now
            </button>
          </div>
        </div>

        {/* PANEL 2: SYNC FROM OTHER DEVICE */}
        <div className="bg-white dark:bg-gray-900/55 backdrop-blur-md border border-gray-200 dark:border-gray-800/80 rounded-3xl p-6 md:p-8 shadow-md flex flex-col justify-between transition-all hover:shadow-lg">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-2xl text-blue-600 dark:text-blue-400">
                <LinkIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-900 dark:text-white">Sync Another Device</h3>
                <p className="text-xs text-gray-400 dark:text-gray-500">Adopt data from another browser / device</p>
              </div>
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
              Enter the Device ID of your main browser or mobile phone below. This device will connect to that ID and fetch all its transactions.
            </p>

            <form onSubmit={handleSyncSubmit} className="space-y-4">
              <div className="relative">
                <input 
                  type="text" 
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value)}
                  placeholder="e.g. DEV-XXXX-YYYY" 
                  required
                  className="w-full p-4 pr-10 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 rounded-2xl bg-gray-50 dark:bg-gray-800/40 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-800 outline-none transition-all font-mono tracking-wider" 
                />
              </div>
              <button 
                type="submit" 
                disabled={isSyncing}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-semibold shadow-md hover:shadow-lg transition-all active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isSyncing ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <CloudDownload className="w-4 h-4" />
                    Sync Device Data
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="flex items-start gap-3 mt-6 text-xs text-amber-700 dark:text-amber-400 bg-amber-50/70 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 p-4 rounded-2xl">
            <AlertCircle className="w-4.5 h-4.5 flex-shrink-0 mt-0.5 text-amber-600 dark:text-amber-500" />
            <div>
              <span className="font-semibold block mb-0.5">Warning: Overwrite Action</span>
              <span>Syncing will permanently replace all transactions and categories on this device with the synced device's data.</span>
            </div>
          </div>
        </div>

      </div>

      {/* CONFIRMATION MODAL */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
              <AlertCircle className="w-8 h-8" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Are you sure?</h3>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              This action will link this browser with ID <span className="font-semibold text-gray-900 dark:text-white font-mono bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">{targetId}</span> and **permanently delete** your current local transactions and categories.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmSync}
                className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all"
              >
                Yes, Overwrite & Link
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
