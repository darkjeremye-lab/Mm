import React, { useState, useRef, useEffect, useCallback } from 'react';
import { UserProfile } from '../types';
import { UserAvatar } from './UserAvatar';
import {
  X,
  User,
  Camera,
  Trash2,
  Crop,
  Check,
  Plus,
  BookOpen,
  Languages,
  Clock,
  Sparkles,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Target,
  FileText,
} from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  onUpdateUserProfile: (updated: UserProfile) => void;
}

const COMMON_LANGUAGES = [
  'Spanish',
  'French',
  'German',
  'Japanese',
  'Mandarin Chinese',
  'Italian',
  'Arabic',
  'Portuguese',
  'Russian',
  'Korean',
  'Latin',
  'Greek',
];

const PRESET_LEARNING_GOALS = [
  'Master spaced repetition & active recall',
  'Maintain 60 minutes of daily distraction-free study',
  'Achieve conversational language fluency',
  'Complete academic deliverables ahead of deadlines',
  'Daily vocabulary compounding',
];

const STUDY_MINUTE_PRESETS = [30, 45, 60, 90, 120, 150];

// Safe square crop generator that extracts from natural image to 256x256 canvas
const cropToSquareDataUrl = (
  image: HTMLImageElement,
  pan: { x: number; y: number } = { x: 0, y: 0 },
  zoom: number = 1,
  viewportWidth: number = 280,
  viewportHeight: number = 280
): string => {
  const outputSize = 256;
  const canvas = document.createElement('canvas');
  canvas.width = outputSize;
  canvas.height = outputSize;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const W_nat = image.naturalWidth || image.width;
  const H_nat = image.naturalHeight || image.height;
  if (!W_nat || !H_nat) return '';

  const baseScale = Math.max(viewportWidth / W_nat, viewportHeight / H_nat);
  const W_disp = W_nat * baseScale;
  const H_disp = H_nat * baseScale;
  const safeZoom = Math.max(1, zoom);
  const W_scaled = W_disp * safeZoom;
  const H_scaled = H_disp * safeZoom;

  const Cx = viewportWidth / 2 + pan.x;
  const Cy = viewportHeight / 2 + pan.y;
  const X_left = Cx - W_scaled / 2;
  const Y_top = Cy - H_scaled / 2;

  const scaleCanvas = outputSize / viewportWidth;
  const dx = X_left * scaleCanvas;
  const dy = Y_top * scaleCanvas;
  const dw = W_scaled * scaleCanvas;
  const dh = H_scaled * scaleCanvas;

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, outputSize, outputSize);
  ctx.drawImage(image, 0, 0, W_nat, H_nat, dx, dy, dw, dh);

  try {
    return canvas.toDataURL('image/jpeg', 0.88);
  } catch (err) {
    console.error('Canvas export error:', err);
    return canvas.toDataURL();
  }
};

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onUpdateUserProfile,
}) => {
  // Form State
  const [name, setName] = useState(userProfile.name || '');
  const [bio, setBio] = useState(userProfile.bio || '');
  const [avatar, setAvatar] = useState<string | undefined>(userProfile.avatar);
  const [learningGoals, setLearningGoals] = useState<string[]>(
    userProfile.learningGoals && userProfile.learningGoals.length > 0
      ? userProfile.learningGoals
      : ['Master active recall and spaced repetition', 'Consistent daily deep work']
  );
  const [newGoalInput, setNewGoalInput] = useState('');
  const [learningLanguages, setLearningLanguages] = useState<string[]>(
    userProfile.learningLanguages && userProfile.learningLanguages.length > 0
      ? userProfile.learningLanguages
      : ['Spanish']
  );
  const [newLanguageInput, setNewLanguageInput] = useState('');
  const [dailyStudyMinutes, setDailyStudyMinutes] = useState<number>(
    userProfile.dailyStudyMinutes ?? 60
  );
  const [lifeGoals, setLifeGoals] = useState<string[]>(
    userProfile.goals && userProfile.goals.length > 0
      ? userProfile.goals
      : ['Excel in academic mastery and strategic focus']
  );

  // Success indicator
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Cropper State
  const [isCropping, setIsCropping] = useState(false);
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
  const [cropZoom, setCropZoom] = useState(1);
  const [cropPan, setCropPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cropImageRef = useRef<HTMLImageElement>(null);
  const cropContainerRef = useRef<HTMLDivElement>(null);
  const prevIsOpenRef = useRef(false);

  // Sync state ONLY when modal transitions from closed to open
  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      setName(userProfile.name || '');
      setBio(userProfile.bio || '');
      setAvatar(userProfile.avatar);
      setLearningGoals(
        userProfile.learningGoals && userProfile.learningGoals.length > 0
          ? userProfile.learningGoals
          : ['Master active recall and spaced repetition', 'Consistent daily deep work']
      );
      setLearningLanguages(
        userProfile.learningLanguages && userProfile.learningLanguages.length > 0
          ? userProfile.learningLanguages
          : ['Spanish']
      );
      setDailyStudyMinutes(userProfile.dailyStudyMinutes ?? 60);
      setLifeGoals(
        userProfile.goals && userProfile.goals.length > 0
          ? userProfile.goals
          : ['Excel in academic mastery and strategic focus']
      );
      setIsCropping(false);
      setRawImageSrc(null);
      setSavedSuccess(false);
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, userProfile]);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/') && !/\.(jpe?g|png|webp|gif|bmp)$/i.test(file.name)) {
      alert('Please upload a valid image file (JPG, PNG, or WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setRawImageSrc(result);
        setCropZoom(1);
        setCropPan({ x: 0, y: 0 });
        setIsCropping(true);

        // Pre-generate square crop immediately so avatar state is NEVER empty after file selection
        const tempImg = new Image();
        tempImg.onload = () => {
          const autoCrop = cropToSquareDataUrl(tempImg, { x: 0, y: 0 }, 1, 280, 280);
          if (autoCrop) {
            setAvatar(autoCrop);
          }
        };
        tempImg.src = result;
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Drag handlers for mobile and mouse in cropper
  const handlePointerDown = (clientX: number, clientY: number) => {
    setIsDragging(true);
    setDragStart({ x: clientX - cropPan.x, y: clientY - cropPan.y });
  };

  const handlePointerMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!isDragging) return;
      setCropPan({
        x: clientX - dragStart.x,
        y: clientY - dragStart.y,
      });
    },
    [isDragging, dragStart]
  );

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  // Perform square crop on canvas (target 256x256 for compact size & crisp resolution)
  const applyCrop = () => {
    if (!cropImageRef.current || !cropContainerRef.current) return;

    const img = cropImageRef.current;
    const container = cropContainerRef.current;
    const rect = container.getBoundingClientRect();
    const vW = rect.width || 280;
    const vH = rect.height || 280;

    const dataUrl = cropToSquareDataUrl(img, cropPan, cropZoom, vW, vH);
    if (dataUrl) {
      setAvatar(dataUrl);
      setIsCropping(false);
      setRawImageSrc(null);
    }
  };

  const handleRemoveAvatar = () => {
    setAvatar(undefined);
    setIsCropping(false);
    setRawImageSrc(null);
  };

  // Learning goals management
  const handleAddGoal = () => {
    const trimmed = newGoalInput.trim();
    if (!trimmed) return;
    if (!learningGoals.includes(trimmed)) {
      setLearningGoals([...learningGoals, trimmed]);
    }
    setNewGoalInput('');
  };

  const handleRemoveGoal = (index: number) => {
    setLearningGoals(learningGoals.filter((_, i) => i !== index));
  };

  // Language management
  const handleToggleLanguage = (lang: string) => {
    if (learningLanguages.includes(lang)) {
      setLearningLanguages(learningLanguages.filter((l) => l !== lang));
    } else {
      setLearningLanguages([...learningLanguages, lang]);
    }
  };

  const handleAddCustomLanguage = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newLanguageInput.trim();
    if (!trimmed) return;
    if (!learningLanguages.includes(trimmed)) {
      setLearningLanguages([...learningLanguages, trimmed]);
    }
    setNewLanguageInput('');
  };

  // Save changes
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    let finalAvatar = avatar;
    // If the user is currently in the crop view and hits Save Profile directly, auto-apply the crop
    if (isCropping && cropImageRef.current && cropContainerRef.current) {
      const rect = cropContainerRef.current.getBoundingClientRect();
      const cropped = cropToSquareDataUrl(
        cropImageRef.current,
        cropPan,
        cropZoom,
        rect.width || 280,
        rect.height || 280
      );
      if (cropped) {
        finalAvatar = cropped;
        setAvatar(cropped);
        setIsCropping(false);
        setRawImageSrc(null);
      }
    }

    const filteredLearningGoals = learningGoals.map((g) => g.trim()).filter(Boolean);
    const filteredLifeGoals = lifeGoals.map((g) => g.trim()).filter(Boolean);

    const updated: UserProfile = {
      ...userProfile,
      name: name.trim() || 'Visionary Planner',
      bio: bio.trim(),
      avatar: finalAvatar ? finalAvatar : undefined,
      learningGoals:
        filteredLearningGoals.length > 0
          ? filteredLearningGoals
          : ['Master active recall and spaced repetition'],
      learningLanguages:
        learningLanguages.length > 0 ? learningLanguages : ['Spanish'],
      dailyStudyMinutes: Math.max(10, Math.min(600, dailyStudyMinutes)),
      goals:
        filteredLifeGoals.length > 0
          ? filteredLifeGoals
          : ['Excel in academic mastery and strategic focus'],
    };

    onUpdateUserProfile(updated);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1000);
  };

  const formatMinutes = (mins: number) => {
    const hours = Math.floor(mins / 60);
    const remaining = mins % 60;
    if (hours === 0) return `${mins} min`;
    if (remaining === 0) return `${hours} hr${hours > 1 ? 's' : ''}`;
    return `${hours}h ${remaining}m`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="bg-[#FDFBF7] dark:bg-[#1C1917] border border-[#D8CFBF] dark:border-[#3D352B] rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-[0_24px_70px_rgba(0,0,0,0.35)] text-stone-900 dark:text-stone-100 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-7 py-4.5 border-b border-[#E8DFC8] dark:border-[#2E2820] bg-white dark:bg-[#151210] rounded-t-2xl shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#26201B] to-[#171412] text-[#D4AF37] border border-[#B88939]/40 shadow-xs">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tight">
                  User Profile
                </h2>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#8C6826] dark:text-[#D4AF37] px-2 py-0.5 rounded bg-[#FAF6EE] dark:bg-[#2A241F] border border-[#E0D5C1] dark:border-[#3D352B]">
                  Personal Identity
                </span>
              </div>
              <p className="text-xs font-sans text-stone-500 dark:text-stone-400 mt-0.5">
                Manage your avatar, learning objectives, and daily study targets
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg border border-[#D8CFBF] dark:border-[#3D352B] bg-white dark:bg-[#24201C] text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer shadow-xs transition-colors"
            title="Close Profile"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 sm:p-7 overflow-y-auto flex-1 flex flex-col gap-6">
          {/* Section 1: Profile Picture & Cropper */}
          <div className="p-4 sm:p-5 rounded-xl border border-[#D8CFBF] dark:border-[#3D352B] bg-white dark:bg-[#24201C] shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
              <label className="text-xs font-serif font-bold uppercase tracking-wider text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <Camera className="w-4 h-4 text-[#B88939]" />
                <span>Profile Picture</span>
              </label>
              <span className="text-[11px] font-sans text-stone-500 dark:text-stone-400">
                Square Avatar • Offline Safe
              </span>
            </div>

            {/* Hidden Native File Input (supports mobile gallery, camera, file picker) */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />

            {!isCropping ? (
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                <div className="relative group">
                  <UserAvatar
                    avatar={avatar}
                    name={name}
                    size="2xl"
                    shape="circle"
                    className="shadow-md"
                  />
                  {avatar && (
                    <div className="absolute -bottom-1 -right-1 bg-[#1C1917] text-[#D4AF37] p-1.5 rounded-full border border-amber-800 shadow-xs">
                      <Sparkles className="w-3 h-3" />
                    </div>
                  )}
                </div>

                <div className="flex-1 flex flex-col items-center sm:items-start gap-2.5 text-center sm:text-left">
                  <div className="text-xs font-sans text-stone-600 dark:text-stone-300 leading-relaxed">
                    {avatar ? (
                      <span>
                        Your custom photo is active and displayed across your sidebar, coach, and study views.
                      </span>
                    ) : (
                      <span>
                        No photo set yet. Your clean initials avatar is shown by default. Upload a photo from your device gallery.
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-serif font-bold rounded-lg bg-[#1C1917] hover:bg-stone-800 text-[#D4AF37] border border-amber-900/40 cursor-pointer shadow-xs transition-all active:scale-95"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>{avatar ? 'Replace Photo' : 'Upload Photo'}</span>
                    </button>

                    {avatar && (
                      <button
                        type="button"
                        onClick={handleRemoveAvatar}
                        className="flex items-center gap-1.5 px-3 py-2 text-xs font-serif font-semibold rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-stone-600 dark:text-stone-300 hover:text-rose-700 dark:hover:text-rose-400 border border-stone-300 dark:border-stone-700 hover:border-rose-200 cursor-pointer shadow-xs transition-all active:scale-95"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    )}
                  </div>

                  <span className="text-[10px] font-mono text-stone-400 dark:text-stone-500">
                    JPG, JPEG, PNG, WEBP • Auto-compressed to preserve offline storage
                  </span>
                </div>
              </div>
            ) : (
              /* Interactive Square Cropper */
              <div className="flex flex-col items-center gap-3 p-3 bg-stone-900 text-stone-100 rounded-xl border border-stone-800 animate-fadeIn">
                <div className="w-full flex items-center justify-between text-xs font-serif text-[#D4AF37] px-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <Crop className="w-4 h-4" />
                    <span>Square Crop & Framing</span>
                  </div>
                  <span className="text-[10px] font-sans text-stone-400">
                    Drag to pan • Pinch or slider to zoom
                  </span>
                </div>

                {/* Square Crop Viewport */}
                <div
                  ref={cropContainerRef}
                  onMouseDown={(e) => handlePointerDown(e.clientX, e.clientY)}
                  onMouseMove={(e) => handlePointerMove(e.clientX, e.clientY)}
                  onMouseUp={handlePointerUp}
                  onTouchStart={(e) => {
                    const touch = e.touches[0];
                    handlePointerDown(touch.clientX, touch.clientY);
                  }}
                  onTouchMove={(e) => {
                    const touch = e.touches[0];
                    handlePointerMove(touch.clientX, touch.clientY);
                  }}
                  onTouchEnd={handlePointerUp}
                  style={{ touchAction: 'none' }}
                  className="relative w-64 h-64 sm:w-72 sm:h-72 overflow-hidden rounded-xl border-2 border-[#D4AF37] bg-black cursor-grab active:cursor-grabbing shadow-inner select-none flex items-center justify-center"
                >
                  {rawImageSrc && (
                    <img
                      ref={cropImageRef}
                      src={rawImageSrc}
                      alt="Crop target"
                      draggable={false}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transform: `translate(${cropPan.x}px, ${cropPan.y}px) scale(${cropZoom})`,
                        transformOrigin: 'center center',
                        pointerEvents: 'none',
                      }}
                      className="transition-transform duration-75 select-none"
                    />
                  )}

                  {/* Subtle Grid Guidelines */}
                  <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 border border-white/20">
                    <div className="border-r border-b border-white/10" />
                    <div className="border-r border-b border-white/10" />
                    <div className="border-b border-white/10" />
                    <div className="border-r border-b border-white/10" />
                    <div className="border-r border-b border-white/10" />
                    <div className="border-b border-white/10" />
                    <div className="border-r border-b border-white/10" />
                    <div className="border-r border-b border-white/10" />
                    <div />
                  </div>
                </div>

                {/* Zoom & Pan Controls */}
                <div className="w-full flex items-center justify-between gap-3 max-w-xs px-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setCropZoom((z) => Math.max(1, z - 0.2))}
                    className="p-1.5 rounded bg-stone-800 hover:bg-stone-700 text-stone-300"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>

                  <input
                    type="range"
                    min="1"
                    max="3"
                    step="0.05"
                    value={cropZoom}
                    onChange={(e) => setCropZoom(parseFloat(e.target.value))}
                    className="flex-1 accent-[#D4AF37] cursor-pointer"
                  />

                  <button
                    type="button"
                    onClick={() => setCropZoom((z) => Math.min(3, z + 0.2))}
                    className="p-1.5 rounded bg-stone-800 hover:bg-stone-700 text-stone-300"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCropZoom(1);
                      setCropPan({ x: 0, y: 0 });
                    }}
                    className="p-1.5 rounded bg-stone-800 hover:bg-stone-700 text-stone-300"
                    title="Reset Framing"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCropping(false);
                      setRawImageSrc(null);
                    }}
                    className="px-3.5 py-1.5 text-xs font-serif rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={applyCrop}
                    className="px-4 py-1.5 text-xs font-serif font-bold rounded-lg bg-gradient-to-r from-[#B88939] to-[#D4AF37] hover:brightness-105 text-[#1C1917] cursor-pointer shadow-sm flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Confirm Crop</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Name & Short Bio */}
          <div className="p-4 sm:p-5 rounded-xl border border-[#D8CFBF] dark:border-[#3D352B] bg-white dark:bg-[#24201C] shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
              <label className="text-xs font-serif font-bold uppercase tracking-wider text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#B88939]" />
                <span>Personal Details</span>
              </label>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <label className="text-[11px] font-sans font-semibold text-stone-600 dark:text-stone-300 mb-1 block">
                  Full Name / Display Name:
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Morgan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs sm:text-sm font-medium px-3.5 py-2.5 rounded-lg bg-[#FDFBF7] dark:bg-[#1A1816] border border-[#D8CFBF] dark:border-[#3D352B] text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-[#B88939] shadow-2xs"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-sans font-semibold text-stone-600 dark:text-stone-300">
                    Short Bio & Focus Statement:
                  </label>
                  <span className="text-[10px] font-mono text-stone-400 dark:text-stone-500">
                    {bio.length}/240
                  </span>
                </div>
                <textarea
                  rows={2}
                  maxLength={240}
                  placeholder="e.g. Computer Science student dedicated to deep work, mastery, and daily compound habits."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full text-xs font-medium px-3.5 py-2 rounded-lg bg-[#FDFBF7] dark:bg-[#1A1816] border border-[#D8CFBF] dark:border-[#3D352B] text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-[#B88939] shadow-2xs resize-none"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Learning Goals */}
          <div className="p-4 sm:p-5 rounded-xl border border-[#D8CFBF] dark:border-[#3D352B] bg-white dark:bg-[#24201C] shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
              <label className="text-xs font-serif font-bold uppercase tracking-wider text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#B88939]" />
                <span>Learning & Academic Goals</span>
              </label>
              <span className="text-[10px] font-sans text-stone-500 dark:text-stone-400">
                {learningGoals.length} Active Targets
              </span>
            </div>

            {/* List of Goals */}
            <div className="flex flex-col gap-2">
              {learningGoals.map((goal, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-[#FDFBF7] dark:bg-[#1A1816] border border-[#E8DFC8] dark:border-[#3D352B] text-xs font-medium text-stone-800 dark:text-stone-200"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="w-5 h-5 rounded bg-[#1C1917] text-[#D4AF37] flex items-center justify-center font-mono text-[10px] font-bold shrink-0">
                      {idx + 1}
                    </span>
                    <span className="truncate">{goal}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveGoal(idx)}
                    className="p-1 text-stone-400 hover:text-rose-600 rounded transition-colors cursor-pointer shrink-0"
                    title="Remove goal"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Custom Goal */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Add a new learning objective..."
                value={newGoalInput}
                onChange={(e) => setNewGoalInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddGoal();
                  }
                }}
                className="flex-1 text-xs font-medium px-3.5 py-2 rounded-lg bg-[#FDFBF7] dark:bg-[#1A1816] border border-[#D8CFBF] dark:border-[#3D352B] text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-[#B88939]"
              />
              <button
                type="button"
                onClick={handleAddGoal}
                className="px-3.5 py-2 rounded-lg bg-[#1C1917] hover:bg-stone-800 text-[#D4AF37] text-xs font-serif font-bold uppercase cursor-pointer flex items-center gap-1 transition-colors shrink-0 shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>

            {/* Presets suggestions */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] font-sans font-semibold text-stone-400 mr-1">
                Suggestions:
              </span>
              {PRESET_LEARNING_GOALS.slice(0, 3).map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    if (!learningGoals.includes(preset)) {
                      setLearningGoals([...learningGoals, preset]);
                    }
                  }}
                  className="text-[10px] font-sans px-2.5 py-1 rounded-md bg-stone-100 dark:bg-stone-800 hover:bg-[#FAF6EE] dark:hover:bg-[#2A241F] text-stone-600 dark:text-stone-300 hover:text-[#8C6826] dark:hover:text-[#D4AF37] border border-stone-200 dark:border-stone-700 hover:border-[#E0D5C1] cursor-pointer transition-colors"
                >
                  + {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Section 4: Languages They're Learning */}
          <div className="p-4 sm:p-5 rounded-xl border border-[#D8CFBF] dark:border-[#3D352B] bg-white dark:bg-[#24201C] shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
              <label className="text-xs font-serif font-bold uppercase tracking-wider text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <Languages className="w-4 h-4 text-[#B88939]" />
                <span>Languages You Are Learning</span>
              </label>
              <span className="text-[10px] font-sans text-stone-500 dark:text-stone-400">
                Lingua Practice Context
              </span>
            </div>

            {/* Active Language Chips */}
            <div className="flex flex-wrap gap-2">
              {learningLanguages.map((lang) => (
                <span
                  key={lang}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#26201B] to-[#1C1917] text-[#D4AF37] border border-[#B88939]/40 text-xs font-serif font-semibold shadow-xs"
                >
                  <span>{lang}</span>
                  <button
                    type="button"
                    onClick={() => handleToggleLanguage(lang)}
                    className="p-0.5 text-stone-400 hover:text-rose-400 cursor-pointer rounded"
                    title={`Remove ${lang}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {learningLanguages.length === 0 && (
                <span className="text-xs text-stone-400 italic">
                  No languages selected. Choose from below or add custom.
                </span>
              )}
            </div>

            {/* Common Language Picker */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {COMMON_LANGUAGES.map((lang) => {
                const isSelected = learningLanguages.includes(lang);
                return (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => handleToggleLanguage(lang)}
                    className={`text-[11px] font-sans px-2.5 py-1 rounded-md border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#FAF6EE] dark:bg-[#2A241F] text-[#8C6826] dark:text-[#D4AF37] border-[#D4AF37] font-semibold'
                        : 'bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700'
                    }`}
                  >
                    {isSelected ? `✓ ${lang}` : `+ ${lang}`}
                  </button>
                );
              })}
            </div>

            {/* Custom Language input */}
            <form onSubmit={handleAddCustomLanguage} className="flex items-center gap-2 mt-1">
              <input
                type="text"
                placeholder="Or type another language..."
                value={newLanguageInput}
                onChange={(e) => setNewLanguageInput(e.target.value)}
                className="flex-1 text-xs font-medium px-3.5 py-2 rounded-lg bg-[#FDFBF7] dark:bg-[#1A1816] border border-[#D8CFBF] dark:border-[#3D352B] text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-[#B88939]"
              />
              <button
                type="submit"
                className="px-3.5 py-2 rounded-lg bg-[#1C1917] hover:bg-stone-800 text-[#D4AF37] text-xs font-serif font-bold uppercase cursor-pointer flex items-center gap-1 transition-colors shrink-0 shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </form>
          </div>

          {/* Section 5: Daily Learning / Study Goal */}
          <div className="p-4 sm:p-5 rounded-xl border border-[#D8CFBF] dark:border-[#3D352B] bg-white dark:bg-[#24201C] shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
              <label className="text-xs font-serif font-bold uppercase tracking-wider text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#B88939]" />
                <span>Daily Learning & Study Goal</span>
              </label>
              <div className="px-3 py-1 rounded-full bg-[#1C1917] text-[#D4AF37] font-serif font-bold text-xs border border-amber-800/40 shadow-xs">
                {formatMinutes(dailyStudyMinutes)}
              </div>
            </div>

            {/* Slider */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-[11px] font-mono text-stone-500 dark:text-stone-400">
                <span>15 mins</span>
                <span className="font-bold text-[#8C6826] dark:text-[#D4AF37]">
                  {dailyStudyMinutes} minutes per day
                </span>
                <span>4 hours</span>
              </div>
              <input
                type="range"
                min="15"
                max="240"
                step="15"
                value={dailyStudyMinutes}
                onChange={(e) => setDailyStudyMinutes(parseInt(e.target.value, 10))}
                className="w-full accent-[#B88939] cursor-pointer"
              />
            </div>

            {/* Quick Presets */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {STUDY_MINUTE_PRESETS.map((mins) => {
                const isSelected = dailyStudyMinutes === mins;
                return (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setDailyStudyMinutes(mins)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-serif font-bold border transition-all cursor-pointer text-center ${
                      isSelected
                        ? 'bg-[#1C1917] text-[#D4AF37] border-amber-900 shadow-xs scale-102'
                        : 'bg-[#FAF7F0] dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 border-stone-200 dark:border-stone-700'
                    }`}
                  >
                    {mins}m
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 6: Life Compass Goals (Synced with UserProfile.goals) */}
          <div className="p-4 sm:p-5 rounded-xl border border-[#D8CFBF] dark:border-[#3D352B] bg-white dark:bg-[#24201C] shadow-xs flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
              <label className="text-xs font-serif font-bold uppercase tracking-wider text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <Target className="w-4 h-4 text-[#B88939]" />
                <span>Core Life Intentions</span>
              </label>
              <span className="text-[10px] font-sans text-stone-500 dark:text-stone-400">
                Synchronized with AI Advisor
              </span>
            </div>

            <div className="flex flex-col gap-2">
              {lifeGoals.map((g, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-stone-400 w-5">#{idx + 1}</span>
                  <input
                    type="text"
                    value={g}
                    onChange={(e) => {
                      const updated = [...lifeGoals];
                      updated[idx] = e.target.value;
                      setLifeGoals(updated);
                    }}
                    placeholder={`Life Goal #${idx + 1}`}
                    className="flex-1 text-xs font-medium px-3 py-1.5 rounded-md bg-[#FDFBF7] dark:bg-[#1A1816] border border-[#D8CFBF] dark:border-[#3D352B] text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-[#B88939]"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 sm:px-7 py-4 border-t border-[#E8DFC8] dark:border-[#2E2820] bg-white dark:bg-[#151210] rounded-b-2xl flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            {savedSuccess && (
              <span className="text-xs font-serif font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 animate-fadeIn">
                <Check className="w-4 h-4" />
                <span>Profile updated successfully!</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-serif font-bold rounded-lg border border-[#D8CFBF] dark:border-[#3D352B] bg-white dark:bg-[#24201C] hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 text-xs font-serif font-bold uppercase tracking-wider rounded-lg bg-gradient-to-r from-[#B88939] via-[#D4AF37] to-[#8C6826] text-[#1C1917] hover:brightness-105 cursor-pointer shadow-sm transition-all active:scale-95 flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Save Profile</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
