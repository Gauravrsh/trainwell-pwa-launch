import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, Utensils, Loader2, Plus, ImagePlus, Sparkles, AlertTriangle, Minus, Clock, Edit3, Trash2, RefreshCw, Save } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logError } from '@/lib/errorUtils';
import { FoodSessionSummary } from './FoodSessionSummary';

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
type TabValue = 'snap' | 'describe' | 'recent';

interface FoodItem {
  name: string;
  quantity: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  qty: number;
}

interface SessionMeal {
  mealType: MealType;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface RecentMeal {
  id: string;
  mealType: MealType;
  rawText: string | null;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  loggedDate: string;
}

interface FoodLogModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: {
    mealType: MealType;
    rawText: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    pendingAnalysis?: boolean;
  }) => void;
}

const mealTypeOrder: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];
const mealTypeEmoji: Record<MealType, string> = {
  breakfast: '🌅',
  lunch: '☀️',
  dinner: '🌙',
  snack: '🍎',
};

const getNextMealType = (current: MealType): MealType => {
  const i = mealTypeOrder.indexOf(current);
  return mealTypeOrder[(i + 1) % mealTypeOrder.length];
};

const getDefaultMealType = (): MealType => {
  const h = new Date().getHours();
  if (h >= 4 && h < 11) return 'breakfast';
  if (h >= 11 && h < 16) return 'lunch';
  if (h >= 16 && h < 22) return 'dinner';
  return 'snack';
};

const round = (n: number, dp = 0) => {
  const f = Math.pow(10, dp);
  return Math.round(n * f) / f;
};

// Map AI error codes → friendly message
const getErrorCopy = (code: string): string => {
  switch (code) {
    case 'CREDITS_EXHAUSTED':
      return "Our nutrition AI is recharging. Save it now — we'll analyze automatically the moment it's back.";
    case 'RATE_LIMITED':
      return "Lots of meals being logged right now. Retry in a few seconds, or save and we'll analyze later.";
    default:
      return "Couldn't reach our nutrition AI. Retry, or save and we'll analyze it later.";
  }
};

export const FoodLogModal = ({ open, onOpenChange, onSave }: FoodLogModalProps) => {
  const [mealType, setMealType] = useState<MealType>(getDefaultMealType());
  const [tab, setTab] = useState<TabValue>('snap');
  const [foodText, setFoodText] = useState('');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [items, setItems] = useState<FoodItem[]>([]);
  const [sessionMeals, setSessionMeals] = useState<SessionMeal[]>([]);
  const [aiError, setAiError] = useState<{ code: string; message: string } | null>(null);
  const [recentMeals, setRecentMeals] = useState<RecentMeal[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(false);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setMealType(getDefaultMealType());
      setTab('snap');
    }
  }, [open]);

  useEffect(() => {
    if (!open || tab !== 'recent' || recentMeals.length > 0) return;
    let cancelled = false;
    (async () => {
      setLoadingRecent(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();
        if (!profile?.id) return;
        const { data, error } = await supabase
          .from('food_logs')
          .select('id, meal_type, raw_text, calories, protein, carbs, fat, logged_date')
          .eq('client_id', profile.id)
          .eq('pending_analysis', false)
          .order('logged_date', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(20);
        if (error) throw error;
        if (cancelled) return;
        setRecentMeals(
          (data || []).map((r) => ({
            id: r.id,
            mealType: r.meal_type as MealType,
            rawText: r.raw_text,
            calories: r.calories || 0,
            protein: r.protein || 0,
            carbs: r.carbs || 0,
            fat: r.fat || 0,
            loggedDate: r.logged_date,
          }))
        );
      } catch (err) {
        logError('FoodLogModal.fetchRecent', err);
      } finally {
        if (!cancelled) setLoadingRecent(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open, tab, recentMeals.length]);

  const hasItems = items.length > 0;
  const hasInput = !!(foodText.trim() || capturedImage);

  const totals = useMemo(() => {
    return items.reduce(
      (acc, it) => ({
        calories: acc.calories + it.calories * it.qty,
        protein: acc.protein + it.protein * it.qty,
        carbs: acc.carbs + it.carbs * it.qty,
        fat: acc.fat + it.fat * it.qty,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }, [items]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image is too large. Please select an image under 10MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      if (result) {
        setCapturedImage(result);
        setItems([]);
        setAiError(null);
      }
    };
    reader.onerror = () => toast.error('Failed to read image. Please try again.');
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const analyzeFood = async (imageDataUrl?: string | null, textOverride?: string) => {
    const text = (textOverride ?? foodText).trim();
    const image = imageDataUrl ?? capturedImage;
    if (!text && !image) {
      toast.error('Add a photo or describe your meal');
      return;
    }
    setIsAnalyzing(true);
    setAiError(null);
    try {
      const imageBase64 = image ? image.split(',')[1] : null;
      const { data, error } = await supabase.functions.invoke('analyze-food', {
        body: { foodText: text || undefined, imageBase64 },
      });

      if (error) {
        let code = 'AI_UNAVAILABLE';
        try {
          const ctx = (error as any)?.context;
          if (ctx?.json?.code) code = ctx.json.code;
          else if (ctx?.response?.json) {
            const body = await ctx.response.json();
            if (body.code) code = body.code;
          }
        } catch { /* noop */ }
        if (data && typeof data === 'object' && (data as any).code) {
          code = (data as any).code;
        }
        setAiError({ code, message: getErrorCopy(code) });
        return;
      }

      const result = data as { items: Omit<FoodItem, 'qty'>[]; totals: any };
      setItems((result.items || []).map((it) => ({ ...it, qty: 1 })));
    } catch (err) {
      logError('FoodLogModal.analyzeFood', err);
      setAiError({ code: 'AI_UNAVAILABLE', message: getErrorCopy('AI_UNAVAILABLE') });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const updateItemQty = (idx: number, delta: number) => {
    setItems((prev) =>
      prev.map((it, i) =>
        i === idx ? { ...it, qty: Math.max(0.25, round(it.qty + delta, 2)) } : it
      )
    );
  };

  const removeItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const cloneRecentMeal = (m: RecentMeal) => {
    setMealType(m.mealType);
    setItems([
      {
        name: m.rawText || `${m.mealType} (re-logged)`,
        quantity: '1 serving',
        calories: m.calories,
        protein: m.protein,
        carbs: m.carbs,
        fat: m.fat,
        qty: 1,
      },
    ]);
    setFoodText(m.rawText || '');
    setTab('describe');
  };

  const resetForm = () => {
    setFoodText('');
    setCapturedImage(null);
    setItems([]);
    setAiError(null);
  };

  const performSave = (pending = false): boolean => {
    if (pending) {
      // Save for later: needs at least some input (text or image)
      if (!hasInput) {
        toast.error('Add a photo or describe your meal first');
        return false;
      }
      onSave({
        mealType,
        rawText: foodText || (capturedImage ? '[Photo meal — pending analysis]' : ''),
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        pendingAnalysis: true,
      });
      setSessionMeals((prev) => [...prev, { mealType, calories: 0, protein: 0, carbs: 0, fat: 0 }]);
      return true;
    }

    if (!hasItems) {
      toast.error('Analyze your meal first');
      return false;
    }
    onSave({
      mealType,
      rawText: foodText || items.map((i) => `${i.name} (${i.qty}x ${i.quantity})`).join(', '),
      calories: round(totals.calories),
      protein: round(totals.protein, 1),
      carbs: round(totals.carbs, 1),
      fat: round(totals.fat, 1),
      pendingAnalysis: false,
    });
    setSessionMeals((prev) => [...prev, { mealType, ...totals }]);
    return true;
  };

  // Primary CTA: Analyze with AI then save in one tap
  const handleAnalyzeAndSave = async () => {
    if (!hasItems) {
      // Run analysis first
      await analyzeFood();
      // Note: state updates async, so we check after via a follow-up render.
      // We auto-save on the next render via a small effect below.
      return;
    }
    setIsSaving(true);
    try {
      const ok = performSave(false);
      if (ok) {
        const name = mealType.charAt(0).toUpperCase() + mealType.slice(1);
        toast.success(`${name} logged!`);
        handleClose(false);
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Auto-save once items appear from a "Analyse & Save" click (single-tap UX)
  const autoSaveAfterAnalyzeRef = useRef(false);
  const triggerAnalyzeAndSaveFlag = () => {
    autoSaveAfterAnalyzeRef.current = true;
  };

  useEffect(() => {
    if (autoSaveAfterAnalyzeRef.current && hasItems && !isAnalyzing) {
      autoSaveAfterAnalyzeRef.current = false;
      const ok = performSave(false);
      if (ok) {
        const name = mealType.charAt(0).toUpperCase() + mealType.slice(1);
        toast.success(`${name} logged!`);
        handleClose(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasItems, isAnalyzing]);

  const handlePrimaryCTA = async () => {
    if (hasItems) {
      // Already analyzed — just save
      setIsSaving(true);
      try {
        const ok = performSave(false);
        if (ok) {
          const name = mealType.charAt(0).toUpperCase() + mealType.slice(1);
          toast.success(`${name} logged!`);
          handleClose(false);
        }
      } finally {
        setIsSaving(false);
      }
      return;
    }
    // Not yet analyzed — analyze, then auto-save when items arrive
    triggerAnalyzeAndSaveFlag();
    await analyzeFood();
  };

  const handleSaveForLater = () => {
    setIsSaving(true);
    try {
      const ok = performSave(true);
      if (ok) {
        toast.success("Saved! We'll analyze it the moment our AI is back.");
        handleClose(false);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleRetryAi = async () => {
    setAiError(null);
    autoSaveAfterAnalyzeRef.current = false;
    await analyzeFood();
  };

  const handleClose = (o: boolean) => {
    if (!o) {
      resetForm();
      setSessionMeals([]);
      setRecentMeals([]);
      autoSaveAfterAnalyzeRef.current = false;
    }
    onOpenChange(o);
  };

  const isProcessing = isAnalyzing || isSaving;
  const ctaDisabled = isProcessing || (!hasItems && !hasInput);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-modal flex flex-col p-0 gap-0">
        {/* Header */}
        <DialogHeader className="p-5 pb-3 border-b border-border flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Utensils className="w-5 h-5 text-primary" />
            Log Food
          </DialogTitle>
        </DialogHeader>

        {/* Meal Type Pill */}
        <div className="px-5 pt-4 flex-shrink-0">
          <Label className="text-xs text-muted-foreground">Meal</Label>
          <Select value={mealType} onValueChange={(v) => setMealType(v as MealType)}>
            <SelectTrigger className="mt-1 h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {mealTypeOrder.map((m) => (
                <SelectItem key={m} value={m}>
                  {mealTypeEmoji[m]} {m.charAt(0).toUpperCase() + m.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tabs */}
        <Tabs value={tab} onValueChange={(v) => setTab(v as TabValue)} className="flex-1 flex flex-col min-h-0">
          <div className="px-5 pt-4 flex-shrink-0">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="snap" className="gap-1.5">
                <Camera className="w-3.5 h-3.5" /> Snap
              </TabsTrigger>
              <TabsTrigger value="describe" className="gap-1.5">
                <Edit3 className="w-3.5 h-3.5" /> Describe
              </TabsTrigger>
              <TabsTrigger value="recent" className="gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Recent
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="dialog-scroll-area px-5 py-4 space-y-4">
            <AnimatePresence>
              {sessionMeals.length > 0 && <FoodSessionSummary meals={sessionMeals} />}
            </AnimatePresence>

            {/* SNAP TAB */}
            <TabsContent value="snap" className="mt-0 space-y-3">
              <AnimatePresence mode="wait">
                {capturedImage ? (
                  <motion.div
                    key="preview"
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    className="relative rounded-xl overflow-hidden"
                  >
                    <img
                      src={capturedImage}
                      alt="Captured food"
                      className="w-full aspect-[4/3] object-cover rounded-xl"
                    />
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm"
                      onClick={() => {
                        setCapturedImage(null);
                        setItems([]);
                        setAiError(null);
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                    {isAnalyzing && (
                      <div className="absolute inset-0 bg-background/70 flex flex-col items-center justify-center gap-2">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        <span className="text-sm text-foreground">Analyzing your meal…</span>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="placeholder"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <button
                      onClick={() => cameraInputRef.current?.click()}
                      className="w-full aspect-[4/3] rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 flex flex-col items-center justify-center gap-3 hover:border-primary hover:bg-primary/10 transition-colors active:scale-[0.98]"
                    >
                      <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center">
                        <Camera className="w-8 h-8 text-primary" />
                      </div>
                      <span className="text-base font-semibold text-foreground">Tap to shoot</span>
                      <span className="text-xs text-muted-foreground">AI will detect food & macros</span>
                    </button>
                    <button
                      onClick={() => galleryInputRef.current?.click()}
                      className="mt-3 w-full py-3 rounded-xl border border-border bg-secondary/30 flex items-center justify-center gap-2 hover:bg-secondary/50 transition-colors"
                    >
                      <ImagePlus className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Choose from gallery</span>
                    </button>
                    <input
                      ref={cameraInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <input
                      ref={galleryInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </TabsContent>

            {/* DESCRIBE TAB */}
            <TabsContent value="describe" className="mt-0 space-y-3">
              <Textarea
                placeholder="e.g., 2 eggs, 1 slice of toast with butter, glass of orange juice..."
                value={foodText}
                onChange={(e) => {
                  setFoodText(e.target.value);
                  if (items.length > 0) setItems([]);
                  if (aiError) setAiError(null);
                }}
                className="min-h-[120px] bg-secondary/50 ring-offset-card"
              />
              <p className="text-[11px] text-muted-foreground text-center">
                Tap the button below — AI will detect macros and log instantly.
              </p>
            </TabsContent>

            {/* RECENT TAB */}
            <TabsContent value="recent" className="mt-0 space-y-2">
              {loadingRecent ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : recentMeals.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No meals logged yet. Snap or describe your first one.
                </p>
              ) : (
                <div className="space-y-2">
                  {recentMeals.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => cloneRecentMeal(m)}
                      className="w-full text-left p-3 rounded-xl border border-border bg-secondary/30 hover:border-primary/50 hover:bg-secondary/50 transition-colors active:scale-[0.99]"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <span>{mealTypeEmoji[m.mealType]}</span>
                            <span className="capitalize">{m.mealType}</span>
                            <span>·</span>
                            <span>{m.loggedDate}</span>
                          </div>
                          <p className="mt-1 text-sm text-foreground truncate">
                            {m.rawText || 'Logged meal'}
                          </p>
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <p className="text-sm font-semibold text-primary">{m.calories} kcal</p>
                          <p className="text-[10px] text-muted-foreground">tap to re-log</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* AI Error → Smart Retry / Save for Later card */}
            {aiError && !hasItems && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3 rounded-xl border border-warning/40 bg-warning/10 p-4"
              >
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">Couldn't analyze right now</p>
                    <p className="text-xs text-muted-foreground">{aiError.message}</p>
                  </div>
                </div>

                {/* Show what they tried to log */}
                {(foodText || capturedImage) && (
                  <div className="rounded-lg bg-background/50 border border-border p-2.5 flex items-center gap-2">
                    {capturedImage && (
                      <img src={capturedImage} alt="Pending" className="w-12 h-12 rounded-md object-cover flex-shrink-0" />
                    )}
                    <p className="text-xs text-muted-foreground line-clamp-2 flex-1">
                      {foodText || 'Photo meal'}
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={handleRetryAi}
                    disabled={isAnalyzing}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
                    Try AI again
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={handleSaveForLater}
                    disabled={isSaving}
                  >
                    <Save className="w-3.5 h-3.5 mr-1.5" />
                    Save for later
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Detected/Editable Items */}
            {hasItems && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                  Detected ({items.length})
                </Label>
                <div className="rounded-xl border border-border divide-y divide-border overflow-hidden">
                  {items.map((it, i) => (
                    <div key={i} className="p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm text-foreground truncate">{it.name}</p>
                          <p className="text-[11px] text-muted-foreground">{it.quantity}</p>
                        </div>
                        <button
                          onClick={() => removeItem(i)}
                          className="text-muted-foreground hover:text-destructive p-1"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateItemQty(i, -0.5)}
                            className="w-7 h-7 rounded-full border border-border flex items-center justify-center hover:bg-secondary active:scale-90"
                            aria-label="Decrease"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-sm font-semibold w-10 text-center tabular-nums">
                            {it.qty}×
                          </span>
                          <button
                            onClick={() => updateItemQty(i, 0.5)}
                            className="w-7 h-7 rounded-full border border-border flex items-center justify-center hover:bg-secondary active:scale-90"
                            aria-label="Increase"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap justify-end">
                          <span className="text-xs px-1.5 py-0.5 rounded bg-primary/15 text-primary font-semibold">
                            {round(it.calories * it.qty)} kcal
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            P{round(it.protein * it.qty, 1)} · C{round(it.carbs * it.qty, 1)} · F{round(it.fat * it.qty, 1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Tabs>

        {/* Sticky Footer */}
        <div className="dialog-footer p-4 border-t border-border space-y-2 flex-shrink-0">
          {hasItems && (
            <div className="flex items-center justify-between text-sm px-1">
              <span className="text-muted-foreground">Total</span>
              <span className="font-semibold text-foreground tabular-nums">
                <span className="text-primary">{round(totals.calories)} kcal</span>
                <span className="text-muted-foreground ml-2 text-xs">
                  P{round(totals.protein, 1)} · C{round(totals.carbs, 1)} · F{round(totals.fat, 1)}
                </span>
              </span>
            </div>
          )}
          <Button
            className="w-full h-12 rounded-xl font-semibold"
            onClick={handlePrimaryCTA}
            disabled={ctaDisabled}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing…
              </>
            ) : isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving…
              </>
            ) : hasItems ? (
              <>
                <Utensils className="w-4 h-4 mr-2" />
                Save Meal →
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Analyse with AI & Save Meal
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
