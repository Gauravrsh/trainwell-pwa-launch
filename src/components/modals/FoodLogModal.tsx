import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, Utensils, Loader2, Check, AlertCircle, Plus, ImagePlus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
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
  const [analysis, setAnalysis] = useState<FoodAnalysis | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [sessionMeals, setSessionMeals] = useState<SessionMeal[]>([]);
  const [showScrollHint, setShowScrollHint] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const analysisResultsRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Check if analysis results are visible
  const checkScrollVisibility = useCallback(() => {
    if (!analysis || !analysisResultsRef.current || !scrollAreaRef.current) {
      setShowScrollHint(false);
      return;
    }

    const scrollArea = scrollAreaRef.current;
    const resultsTop = analysisResultsRef.current.offsetTop;
    const scrollBottom = scrollArea.scrollTop + scrollArea.clientHeight;
    
    // Show hint if results are below the visible area
    setShowScrollHint(resultsTop > scrollBottom + 20);
  }, [analysis]);

  // Auto-scroll to results after analysis
  useEffect(() => {
    if (analysis && analysisResultsRef.current) {
      // Check if user prefers reduced motion
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

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setShowCamera(true);
    } catch (error) {
      logError('FoodLogModal.startCamera', error);
      toast.error('Could not access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImage(imageData);
        stopCamera();
      }
    }
  };

  const analyzeFood = async () => {
    if (!foodText.trim() && !capturedImage) {
      toast.error('Please enter food description or take a photo');
      return;
    }

    setIsAnalyzing(true);
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

      if (error) throw error;

      setAnalysis(data as FoodAnalysis);
      toast.success('Food analyzed! See nutritional breakdown below');
    } catch (error) {
      logError('FoodLogModal.analyzeFood', error);
      toast.error('Failed to analyze food. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetForm = () => {
    setFoodText('');
    setCapturedImage(null);
    setAnalysis(null);
    setShowScrollHint(false);
  };

  const handleSaveAndContinue = () => {
    if (!analysis) {
      toast.error('Please analyze the food first');
      return;
    }

    // Save to parent
    onSave({
      mealType,
      rawText: foodText,
      calories: analysis.totals.calories,
      protein: analysis.totals.protein,
      carbs: analysis.totals.carbs,
      fat: analysis.totals.fat
    });

    // Track in session
    const newMeal: SessionMeal = {
      mealType,
      calories: analysis.totals.calories,
      protein: analysis.totals.protein,
      carbs: analysis.totals.carbs,
      fat: analysis.totals.fat
    };
    setSessionMeals(prev => [...prev, newMeal]);

    // Auto-advance meal type
    const nextMeal = getNextMealType(mealType);
    setMealType(nextMeal);

    // Reset form for next meal
    resetForm();

    const mealName = mealType.charAt(0).toUpperCase() + mealType.slice(1);
    toast.success(`${mealName} logged! Ready for ${nextMeal}`);
  };

  const handleDone = () => {
    // If there's an analyzed meal pending, save it first
    if (analysis) {
      onSave({
        mealType,
        rawText: foodText,
        calories: analysis.totals.calories,
        protein: analysis.totals.protein,
        carbs: analysis.totals.carbs,
        fat: analysis.totals.fat
      });
      
      const totalMeals = sessionMeals.length + 1;
      toast.success(`${totalMeals} meal${totalMeals > 1 ? 's' : ''} logged successfully!`);
    } else if (sessionMeals.length > 0) {
      toast.success(`${sessionMeals.length} meal${sessionMeals.length > 1 ? 's' : ''} logged successfully!`);
    }

    // Reset all state and close
    handleClose(false);
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      stopCamera();
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

          {/* Camera Section */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Food Photo</Label>
            
            <AnimatePresence mode="wait">
              {showCamera ? (
                <motion.div
                  key="camera"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="relative rounded-xl overflow-hidden bg-black"
                >
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full aspect-[4/3] object-cover"
                  />
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-12 w-12 rounded-full"
                      onClick={stopCamera}
                    >
                      <X className="w-5 h-5" />
                    </Button>
                    <Button
                      size="icon"
                      className="h-14 w-14 rounded-full"
                      onClick={capturePhoto}
                    >
                      <Camera className="w-6 h-6" />
                    </Button>
                  </div>
                </motion.div>
              ) : capturedImage ? (
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
                    className="w-full aspect-[4/3] object-cover"
                  />
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8 rounded-full"
                    onClick={() => setCapturedImage(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </motion.div>
              ) : (
                <motion.button
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={startCamera}
                  className="w-full aspect-[4/3] rounded-xl border-2 border-dashed border-border bg-secondary/30 flex flex-col items-center justify-center gap-2 hover:border-primary/50 hover:bg-secondary/50 transition-colors"
                >
                  <Camera className="w-8 h-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Tap to take photo</span>
                </motion.button>
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
              onChange={(e) => setFoodText(e.target.value)}
              className="mt-1 min-h-[100px] bg-secondary/50 ring-offset-card"
            />
          </div>

          {/* Analyze Button - changes state after analysis */}
          {analysis ? (
            <div className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-success/10 border border-success/30">
              <Check className="w-5 h-5 text-success" />
              <span className="text-sm font-medium text-success">Analysis Complete</span>
              <span className="text-xs text-muted-foreground">— scroll for details</span>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full"
              onClick={analyzeFood}
              disabled={isAnalyzing || (!foodText.trim() && !capturedImage)}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                'Analyze Food'
              )}
            </Button>
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

          {/* Gradient fade indicator for more content */}
          {!analysis && (foodText.trim() || capturedImage) && (
            <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-background to-transparent" />
          )}
        </div>

        {/* Scroll hint overlay */}
        <ScrollHint visible={showScrollHint} onClick={scrollToResults} />

        {/* Footer with dual actions */}
        <div className="dialog-footer p-6 pt-4 border-t border-border space-y-3">
          <Button 
            className="w-full h-12 rounded-xl"
            onClick={handleSaveAndContinue}
            disabled={!analysis}
          >
            <Plus className="w-4 h-4 mr-2" />
            Save & Add Another Meal
          </Button>
          <Button 
            variant="secondary"
            className="w-full h-10 rounded-xl"
            onClick={handleDone}
          >
            {analysis || sessionMeals.length > 0 ? 'Done' : 'Cancel'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
