import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, Check, Trash2, Camera, RefreshCw, Sparkles, User } from 'lucide-react';
import { PRESET_AVATARS } from '../utils/avatarIcons';
import { resizeImageTo500x500Base64, isImageAvatar } from '../utils/avatarUtils';
import { soundManager } from '../utils/soundEffects';

interface AvatarSelectorProps {
  value: string;
  onChange: (avatar: string) => void;
  compact?: boolean;
}

export const AvatarSelector: React.FC<AvatarSelectorProps> = ({
  value,
  onChange,
  compact = false,
}) => {
  const isCustomPhoto = isImageAvatar(value) && !value.includes('xmlns=');
  const [activeTab, setActiveTab] = useState<'upload' | 'preset'>(
    isCustomPhoto ? 'upload' : 'upload'
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    setErrorMessage(null);
    setIsProcessing(true);
    try {
      const base64 = await resizeImageTo500x500Base64(file);
      onChange(base64);
      setActiveTab('upload');
      soundManager.playCorrectGuess();
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to process image. Please try another.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleRemoveCustomAvatar = () => {
    onChange(PRESET_AVATARS[0].id);
    setActiveTab('preset');
    soundManager.playTick();
  };

  return (
    <div className="space-y-3">
      {/* Tab Switcher: Custom Photo Upload vs Illustrated Avatars */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-800/90 rounded-xl border border-slate-700/70 text-xs font-bold">
        <button
          type="button"
          onClick={() => {
            setActiveTab('upload');
            soundManager.playTick();
          }}
          className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'upload'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Upload Your Photo</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('preset');
            soundManager.playTick();
          }}
          className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'preset'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Illustrated Avatars</span>
        </button>
      </div>

      {/* ERROR ALERT */}
      {errorMessage && (
        <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium">
          {errorMessage}
        </div>
      )}

      {/* VIEW 1: UPLOAD CUSTOM PHOTO */}
      {activeTab === 'upload' && (
        <div className="space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          {isCustomPhoto ? (
            /* Uploaded Photo Preview Card */
            <div className="p-4 rounded-2xl bg-slate-800/80 border border-indigo-500/40 flex items-center gap-4">
              <div className="relative w-16 h-16 rounded-2xl overflow-hidden border-2 border-indigo-500 shadow-md flex-shrink-0 bg-slate-900">
                <img
                  src={value}
                  alt="Custom Profile"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-1 right-1 p-0.5 bg-emerald-500 rounded-full text-white">
                  <Check className="w-3 h-3" />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-white">Custom Profile Picture</span>
                  <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    500×500 HD
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Your photo is synced to your profile and player cards.
                </p>

                <div className="flex items-center gap-2 mt-2.5">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessing}
                    className="px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Choose Different Photo</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleRemoveCustomAvatar}
                    className="px-2.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-bold flex items-center gap-1 transition-colors border border-rose-500/20"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Drag and Drop Zone */
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`p-6 rounded-2xl border-2 border-dashed text-center cursor-pointer transition-all ${
                dragOver
                  ? 'border-indigo-500 bg-indigo-500/15 scale-[1.01]'
                  : 'border-slate-700 hover:border-indigo-500/60 bg-slate-800/50 hover:bg-slate-800/80'
              }`}
            >
              {isProcessing ? (
                <div className="py-4 flex flex-col items-center gap-2">
                  <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
                  <p className="text-xs font-bold text-slate-200">
                    Optimizing & Resizing Profile Photo...
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2.5">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner">
                    <Camera className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">
                      Click to choose photo or drag & drop here
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Supports JPG, PNG, WebP • Auto center-cropped to 500×500 px
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: ILLUSTRATED PRESETS */}
      {activeTab === 'preset' && (
        <div className="space-y-2">
          <div className={`grid ${compact ? 'grid-cols-4 sm:grid-cols-5' : 'grid-cols-3 sm:grid-cols-5'} gap-2`}>
            {PRESET_AVATARS.map((avatar) => {
              const isSelected = value === avatar.id || value === avatar.svgDataUri;
              return (
                <button
                  type="button"
                  key={avatar.id}
                  onClick={() => {
                    onChange(avatar.id);
                    soundManager.playTick();
                  }}
                  className={`p-2 rounded-2xl border transition-all flex flex-col items-center gap-1.5 group ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-500/20 ring-2 ring-indigo-500 scale-105 shadow-md shadow-indigo-500/30'
                      : 'border-slate-800 bg-slate-800/60 hover:bg-slate-800 hover:scale-105'
                  }`}
                >
                  <div className="w-11 h-11 rounded-xl overflow-hidden shadow-sm flex-shrink-0">
                    <img
                      src={avatar.svgDataUri}
                      alt={avatar.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-[10px] font-bold text-slate-300 group-hover:text-white truncate max-w-full">
                    {avatar.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
