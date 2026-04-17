import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, Utensils, Loader2, Check, Plus, ImagePlus, Sparkles, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logError } from '@/lib/errorUtils';
import { FoodSessionSummary } from './FoodSessionSummary';
import { ScrollHint } from './ScrollHint';

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

interface FoodItem {
  name: string;
  quantity: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface FoodAnalysis {
  items: FoodItem[];
  totals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

interface SessionMeal {
  mealType: MealType;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
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
  }) => void;
}

const mealTypeOrder: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

const getNextMealType = (current: MealType): MealType => {
  const currentIndex = mealTypeOrder.indexOf(current);
  return mealTypeOrder[(currentIndex + 1) % mealTypeOrder.length];
};

export const FoodLogModal = ({ open, onOpenChange, onSave }: FoodLogModalProps) => {
  const [mealType, setMealType] = useState<MealType>('breakfast');
  const [foodText, setFoodText] = useState('');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [analysis, setAnalysis] = useState<FoodAnalysis | null>(null);
  const [sessionMeals, setSessionMeals] = useState<SessionMeal[]>([]);
  const [showScrollHint, setShowScrollHint] = useState(false);
  const [aiError, setAiError] = useState<{ code: string; message: string } | null>(null);
  const [manualMacros, setManualMacros] = useState({ calories: '', protein: '', carbs: '', fat: '' });
  
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const analysisResultsRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const hasInput = !!(foodText.trim() || capturedImage);
  const hasManualMacros = !!(manualMacros.calories || manualMacros.protein || manualMacros.carbs || manualMacros.fat);

  // Check if analysis results are visible
  const checkScrollVisibility = useCallback(() => {
    if (!analysis || !analysisResultsRef.current || !scrollAreaRef.current) {
      setShowScrollHint(false);
      return;
    }

    const scrollArea = scrollAreaRef.current;
    const resultsTop = analysisResultsRef.current.offsetTop;
    const scrollBottom = scrollArea.scrollTop + scrollArea.clientHeight;
    setShowScrollHint(resultsTop > scrollBottom + 20);
  }, [analysis]);

  // Auto-scroll to results after analysis
  useEffect(() => {
    if (analysis && analysisResultsRef.current) {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      setTimeout(() => {
        analysisResultsRef.current?.scrollIntoView({ 
          behavior: prefersReducedMotion ? 'auto' : 'smooth', 
          block: 'start' 
        });
        setShowScrollHint(false);
      }, 100);
    }
  }, [analysis]);

  // Monitor scroll visibility
  useEffect(() => {
    const scrollArea = scrollAreaRef.current;
    if (!scrollArea) return;

    const handleScroll = () => checkScrollVisibility();
    scrollArea.addEventListener('scroll', handleScroll);
    checkScrollVisibility();

    return () => scrollArea.removeEventListener('scroll', handleScroll);
  }, [checkScrollVisibility]);

  // Handle file selection (from camera or gallery)
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
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setCapturedImage(result);
        // Clear any previous analysis when new image is added
        setAnalysis(null);
      }
    };
    reader.onerror = () => {
      toast.error('Failed to read image. Please try again.');
    };
    reader.readAsDataURL(file);
    
    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  const analyzeFood = async (): Promise<FoodAnalysis | null> => {
    if (!foodText.trim() && !capturedImage) {
      toast.error('Please enter food description or take a photo');
      return null;
    }

    setIsAnalyzing(true);
    setAiError(null);
    try {
      let imageBase64 = null;
      if (capturedImage) {
        imageBase64 = capturedImage.split(',')[1];
      }

      const { data, error } = await supabase.functions.invoke('analyze-food', {
        body: { 
          foodText: foodText.trim() || undefined,
          imageBase64 
        }
      });

      // Edge function returned a non-2xx — extract structured error if available
      if (error) {
        // supabase-js wraps non-2xx in FunctionsHttpError with .context.response
        let code = 'AI_UNAVAILABLE';
        let message = 'Unable to analyze food. Please enter macros manually below.';
        try {
          const ctx = (error as any)?.context;
          if (ctx?.json) {
            code = ctx.json.code || code;
            message = ctx.json.error || message;
          } else if (ctx?.response?.json) {
            const body = await ctx.response.json();
            code = body.code || code;
            message = body.error || message;
          }
        } catch {
          // ignore parse errors, use defaults
        }
        // Data sometimes still carries the body
        if (data && typeof data === 'object') {
          const d = data as any;
          if (d.code) code = d.code;
          if (d.error) message = d.error;
        }
        setAiError({ code, message });
        return null;
      }

      const result = data as FoodAnalysis;
      setAnalysis(result);
      return result;
    } catch (err) {
      logError('FoodLogModal.analyzeFood', err);
      setAiError({
        code: 'AI_UNAVAILABLE',
        message: 'Unable to analyze food. Please enter macros manually below.',
      });
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetForm = () => {
    setFoodText('');
    setCapturedImage(null);
    setAnalysis(null);
    setShowScrollHint(false);
    setAiError(null);
    setManualMacros({ calories: '', protein: '', carbs: '', fat: '' });
  };

  // Build totals from manual macro inputs
  const buildManualTotals = () => ({
    calories: parseInt(manualMacros.calories, 10) || 0,
    protein: parseFloat(manualMacros.protein) || 0,
    carbs: parseFloat(manualMacros.carbs) || 0,
    fat: parseFloat(manualMacros.fat) || 0,
  });

  // Core save logic — auto-analyzes if needed, then saves. Falls back to manual macros on AI failure.
  const saveCurrentMeal = async (): Promise<{ saved: boolean; totals: FoodAnalysis['totals'] | null }> => {
    if (!hasInput && !hasManualMacros) {
      toast.error('Please enter food description, take a photo, or add macros manually');
      return { saved: false, totals: null };
    }

    setIsSaving(true);
    try {
      // If user already filled manual macros (AI failed path), save those directly
      if (aiError && hasManualMacros) {
        const totals = buildManualTotals();
        onSave({
          mealType,
          rawText: foodText,
          ...totals,
        });
        return { saved: true, totals };
      }

      // Try AI analysis if not already done
      let currentAnalysis = analysis;
      if (!currentAnalysis && hasInput) {
        currentAnalysis = await analyzeFood();
      }

      if (currentAnalysis) {
        onSave({
          mealType,
          rawText: foodText,
          calories: currentAnalysis.totals.calories,
          protein: currentAnalysis.totals.protein,
          carbs: currentAnalysis.totals.carbs,
          fat: currentAnalysis.totals.fat,
        });
        return { saved: true, totals: currentAnalysis.totals };
      }

      // AI failed — if manual macros are filled, allow save
      if (hasManualMacros) {
        const totals = buildManualTotals();
        onSave({
          mealType,
          rawText: foodText,
          ...totals,
        });
        return { saved: true, totals };
      }

      // AI failed and no manual macros yet — keep modal open, fallback UI is now visible
      return { saved: false, totals: null };
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAndContinue = async () => {
    const { saved, totals } = await saveCurrentMeal();
    if (!saved || !totals) return;

    // Track in session
    const newMeal: SessionMeal = {
      mealType,
      calories: totals.calories,
      protein: totals.protein,
      carbs: totals.carbs,
      fat: totals.fat,
    };
    setSessionMeals(prev => [...prev, newMeal]);

    // Auto-advance meal type
    const nextMeal = getNextMealType(mealType);
    const mealName = mealType.charAt(0).toUpperCase() + mealType.slice(1);
    setMealType(nextMeal);
    resetForm();
    toast.success(`${mealName} logged! Ready for ${nextMeal}`);
  };

  const handleDone = async () => {
    // If there's input pending (or manual macros), save it first
    if (hasInput || hasManualMacros) {
      const { saved } = await saveCurrentMeal();
      if (saved) {
        const totalMeals = sessionMeals.length + 1;
        toast.success(`${totalMeals} meal${totalMeals > 1 ? 's' : ''} logged successfully!`);
        handleClose(false);
      }
      // If not saved (AI failed, no manual macros), keep modal open so user sees fallback
      return;
    } else if (sessionMeals.length > 0) {
      toast.success(`${sessionMeals.length} meal${sessionMeals.length > 1 ? 's' : ''} logged successfully!`);
    }

    handleClose(false);
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      resetForm();
      setMealType('breakfast');
      setSessionMeals([]);
    }
    onOpenChange(open);
  };

  const scrollToResults = () => {
    analysisResultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setShowScrollHint(false);
  };

  const isProcessing = isAnalyzing || isSaving;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-modal flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 pb-4 border-b border-border flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Utensils className="w-5 h-5 text-primary" />
            Log Food
          </DialogTitle>
        </DialogHeader>

        <div 
          ref={scrollAreaRef}
          className="dialog-scroll-area relative space-y-4 p-6"
        >
          {/* Session Summary - shows meals logged in this session */}
          <AnimatePresence>
            {sessionMeals.length > 0 && (
              <FoodSessionSummary meals={sessionMeals} />
            )}
          </AnimatePresence>

          {/* Meal Type Selector */}
          <div>
            <Label className="text-xs text-muted-foreground">Meal Type</Label>
            <Select value={mealType} onValueChange={(v) => setMealType(v as MealType)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="breakfast">🌅 Breakfast</SelectItem>
                <SelectItem value="lunch">☀️ Lunch</SelectItem>
                <SelectItem value="dinner">🌙 Dinner</SelectItem>
                <SelectItem value="snack">🍎 Snack</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Photo Section — uses native file input with capture for mobile camera */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Food Photo (optional)</Label>
            
            <AnimatePresence mode="wait">
              {capturedImage ? (
                <motion.div
                  key="preview"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
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
                      setAnalysis(null);
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex gap-3"
                >
                  {/* Take Photo — opens device camera directly */}
                  <button
                    onClick={() => cameraInputRef.current?.click()}
                    className="flex-1 py-6 rounded-xl border-2 border-dashed border-border bg-secondary/30 flex flex-col items-center justify-center gap-2 hover:border-primary/50 hover:bg-secondary/50 transition-colors active:scale-95"
                  >
                    <Camera className="w-7 h-7 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Take Photo</span>
                  </button>
                  {/* Gallery upload */}
                  <button
                    onClick={() => galleryInputRef.current?.click()}
                    className="flex-1 py-6 rounded-xl border-2 border-dashed border-border bg-secondary/30 flex flex-col items-center justify-center gap-2 hover:border-primary/50 hover:bg-secondary/50 transition-colors active:scale-95"
                  >
                    <ImagePlus className="w-7 h-7 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">From Gallery</span>
                  </button>
                  {/* Hidden file inputs */}
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
          </div>

          {/* Text Input */}
          <div>
            <Label htmlFor="food-text" className="text-xs text-muted-foreground">
              Food Description
            </Label>
            <Textarea
              id="food-text"
              placeholder="e.g., 2 eggs, 1 slice of toast with butter, glass of orange juice..."
              value={foodText}
              onChange={(e) => {
                setFoodText(e.target.value);
                // Clear previous analysis when text changes
                if (analysis) setAnalysis(null);
              }}
              className="mt-1 min-h-[100px] bg-secondary/50 ring-offset-card"
            />
          </div>

          {/* Optional: Preview macros before saving */}
          {!analysis && hasInput && (
            <button
              onClick={analyzeFood}
              disabled={isAnalyzing}
              className="w-full flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  Preview nutritional breakdown
                </>
              )}
            </button>
          )}

          {/* Analysis Complete badge */}
          {analysis && (
            <div className="flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-success/10 border border-success/30">
              <Check className="w-4 h-4 text-success" />
              <span className="text-sm font-medium text-success">Analysis Complete</span>
            </div>
          )}

          {/* Analysis Results */}
          <AnimatePresence>
            {analysis && (
              <motion.div
                ref={analysisResultsRef}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-3"
              >
                {/* Food Items */}
                <div className="rounded-xl border border-border overflow-hidden">
                  <div className="bg-secondary/50 px-4 py-2 border-b border-border">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Detected Items
                    </span>
                  </div>
                  <div className="divide-y divide-border">
                    {analysis.items.map((item, i) => (
                      <div key={i} className="px-4 py-3 flex justify-between items-center">
                        <div>
                          <p className="font-medium text-foreground">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.quantity}</p>
                        </div>
                        <span className="text-sm font-semibold text-primary">
                          {item.calories} kcal
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Totals */}
                <div className="rounded-xl bg-primary/10 border border-primary/30 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Check className="w-4 h-4 text-primary" />
                    <span className="font-semibold text-foreground">Nutritional Summary</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="p-2 rounded-lg bg-background">
                      <p className="text-lg font-bold text-primary">{analysis.totals.calories}</p>
                      <p className="text-xs text-muted-foreground">kcal</p>
                    </div>
                    <div className="p-2 rounded-lg bg-background">
                      <p className="text-lg font-bold text-foreground">{analysis.totals.protein}g</p>
                      <p className="text-xs text-muted-foreground">Protein</p>
                    </div>
                    <div className="p-2 rounded-lg bg-background">
                      <p className="text-lg font-bold text-foreground">{analysis.totals.carbs}g</p>
                      <p className="text-xs text-muted-foreground">Carbs</p>
                    </div>
                    <div className="p-2 rounded-lg bg-background">
                      <p className="text-lg font-bold text-foreground">{analysis.totals.fat}g</p>
                      <p className="text-xs text-muted-foreground">Fat</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Gradient fade indicator */}
          {!analysis && hasInput && (
            <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-background to-transparent" />
          )}
        </div>

        {/* Scroll hint overlay */}
        <ScrollHint visible={showScrollHint} onClick={scrollToResults} />

        {/* Footer */}
        <div className="dialog-footer p-6 pt-4 border-t border-border space-y-3">
          <Button 
            className="w-full h-12 rounded-xl"
            onClick={handleDone}
            disabled={isProcessing || (!hasInput && sessionMeals.length === 0)}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {isAnalyzing ? 'Analyzing & Saving...' : 'Saving...'}
              </>
            ) : (
              hasInput ? 'Log Food' : (sessionMeals.length > 0 ? 'Done' : 'Log Food')
            )}
          </Button>
          {hasInput && (
            <Button 
              variant="outline"
              className="w-full h-10 rounded-xl"
              onClick={handleSaveAndContinue}
              disabled={isProcessing}
            >
              <Plus className="w-4 h-4 mr-2" />
              Save & Add Another Meal
            </Button>
          )}
          <Button 
            variant="ghost"
            className="w-full h-9 rounded-xl text-muted-foreground"
            onClick={() => handleClose(false)}
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
