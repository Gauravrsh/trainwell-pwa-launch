import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Calendar, MapPin, Ruler, Scale, ChevronDown, Check, Phone } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { sanitizeErrorMessage, logError } from '@/lib/errorUtils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { indianCities } from '@/data/indianCities';


interface ProfileSetupProps {
  role: 'trainer' | 'client';
}

const ProfileSetup = ({ role }: ProfileSetupProps) => {
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [city, setCity] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const [cityOpen, setCityOpen] = useState(false);
  const [whatsappNo, setWhatsappNo] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Filter cities based on search
  const filteredCities = useMemo(() => {
    if (!citySearch) return indianCities;
    return indianCities.filter(c => 
      c.toLowerCase().startsWith(citySearch.toLowerCase())
    );
  }, [citySearch]);

  // Format DOB input as dd/mm/yyyy
  const handleDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
    
    if (value.length >= 2) {
      value = value.slice(0, 2) + '/' + value.slice(2);
    }
    if (value.length >= 5) {
      value = value.slice(0, 5) + '/' + value.slice(5);
    }
    if (value.length > 10) {
      value = value.slice(0, 10);
    }
    
    setDob(value);
  };

  // Validate DOB format and value
  const validateDob = (dobString: string): Date | null => {
    const parts = dobString.split('/');
    if (parts.length !== 3) return null;
    
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);
    
    if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
    if (day < 1 || day > 31) return null;
    if (month < 1 || month > 12) return null;
    if (year < 1900 || year > new Date().getFullYear()) return null;
    
    const date = new Date(year, month - 1, day);
    if (date.getDate() !== day || date.getMonth() !== month - 1 || date.getFullYear() !== year) {
      return null; // Invalid date (e.g., 31/02/2000)
    }
    
    return date;
  };

  // Handle height input (integers only)
  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Only digits
    if (value.length <= 3) {
      setHeight(value);
    }
  };

  // Handle weight input (decimals allowed)
  const handleWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow digits and one decimal point
    if (/^\d*\.?\d*$/.test(value) && value.length <= 6) {
      setWeight(value);
    }
  };

  const handleSubmit = async () => {
    if (!user || loading) return;

    // Validation
    if (!fullName.trim()) {
      toast({ title: "Error", description: "Please enter your name", variant: "destructive" });
      return;
    }

    const parsedDob = validateDob(dob);
    if (!parsedDob) {
      toast({ title: "Error", description: "Please enter a valid date of birth (dd/mm/yyyy)", variant: "destructive" });
      return;
    }

    if (!city) {
      toast({ title: "Error", description: "Please select your city", variant: "destructive" });
      return;
    }

    if (role === 'trainer') {
      if (!whatsappNo || !/^\d{10}$/.test(whatsappNo)) {
        toast({ title: "Error", description: "Please enter a valid 10-digit WhatsApp number", variant: "destructive" });
        return;
      }
    }

    if (role === 'client') {
      if (!height || parseInt(height) < 50 || parseInt(height) > 300) {
        toast({ title: "Error", description: "Please enter a valid height (50-300 cm)", variant: "destructive" });
        return;
      }
      if (!weight || parseFloat(weight) < 20 || parseFloat(weight) > 300) {
        toast({ title: "Error", description: "Please enter a valid weight (20-300 kg)", variant: "destructive" });
        return;
      }
    }

    setLoading(true);

    try {
      const updateData: Record<string, unknown> = {
        full_name: fullName.trim(),
        date_of_birth: parsedDob.toISOString().split('T')[0],
        city: city,
        profile_complete: true,
      };

      if (role === 'trainer') {
        updateData.whatsapp_no = whatsappNo;
      }

      if (role === 'client') {
        updateData.height_cm = parseInt(height);
        updateData.weight_kg = parseFloat(weight);

        // Check if user came from trainer invite - link to trainer
        const inviteTrainerCode = localStorage.getItem('inviteTrainerCode');
        if (inviteTrainerCode) {
          // Look up trainer by unique_id using the RPC function
          const { data: trainerData, error: lookupError } = await supabase
            .rpc('lookup_trainer_by_unique_id', { p_unique_id: inviteTrainerCode });

          if (lookupError) {
            logError('ProfileSetup.trainerLookup', lookupError);
          } else if (trainerData && trainerData.length > 0) {
            // Set trainer_id to link client to trainer
            updateData.trainer_id = trainerData[0].id;
          } else {
            logError('ProfileSetup.trainerNotFound', `Trainer not found with code: ${inviteTrainerCode}`);
          }

          // Clean up the invite code from localStorage
          localStorage.removeItem('inviteTrainerCode');
        }
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Profile Complete!",
        description: role === 'client' && updateData.trainer_id 
          ? "Your profile has been set up and linked to your trainer."
          : "Your profile has been set up successfully.",
      });

      navigate('/');
    } catch (error: unknown) {
      logError('ProfileSetup.handleSubmit', error);
      toast({
        title: "Error",
        description: sanitizeErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    const baseValid = fullName.trim() && validateDob(dob) && city;
    if (role === 'trainer') {
      return baseValid && /^\d{10}$/.test(whatsappNo);
    }
    if (role === 'client') {
      return baseValid && height && weight;
    }
    return baseValid;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.h1
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-3xl font-bold text-foreground mb-6"
          >
            <span className="text-primary">V</span>ECTO
          </motion.h1>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Complete Your Profile
          </h1>
          <p className="text-muted-foreground">
            Tell us a bit about yourself
          </p>
        </div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-5"
        >
          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="fullName" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Full Name
            </Label>
            <Input
              id="fullName"
              type="text"
              placeholder="Enter your full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="h-12"
              maxLength={100}
            />
          </div>

          {/* Date of Birth */}
          <div className="space-y-2">
            <Label htmlFor="dob" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Date of Birth
            </Label>
            <Input
              id="dob"
              type="text"
              placeholder="dd/mm/yyyy"
              value={dob}
              onChange={handleDobChange}
              className="h-12"
              maxLength={10}
            />
          </div>

          {/* City */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              City
            </Label>
            <Popover open={cityOpen} onOpenChange={setCityOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={cityOpen}
                  className="w-full h-12 justify-between font-normal"
                >
                  {city || "Select your city"}
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-popover z-50" align="start">
                <div className="p-2 border-b">
                  <Input
                    placeholder="Search city..."
                    value={citySearch}
                    onChange={(e) => setCitySearch(e.target.value)}
                    className="h-9"
                  />
                </div>
                <ScrollArea className="h-[200px]">
                  <div className="p-1">
                    {filteredCities.length === 0 ? (
                      <div className="py-6 text-center text-sm text-muted-foreground">
                        No city found.
                      </div>
                    ) : (
                      filteredCities.map((c) => (
                        <button
                          key={c}
                          onClick={() => {
                            setCity(c);
                            setCitySearch('');
                            setCityOpen(false);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
                        >
                          <Check
                            className={`h-4 w-4 ${city === c ? 'opacity-100' : 'opacity-0'}`}
                          />
                          {c}
                        </button>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </PopoverContent>
            </Popover>
          </div>

          {/* Client-only fields */}
          {role === 'client' && (
            <>
              {/* Height */}
              <div className="space-y-2">
                <Label htmlFor="height" className="flex items-center gap-2">
                  <Ruler className="w-4 h-4" />
                  Height
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="height"
                    type="text"
                    inputMode="numeric"
                    placeholder="Enter height"
                    value={height}
                    onChange={handleHeightChange}
                    className="h-12 flex-1"
                  />
                  <span className="text-muted-foreground font-medium w-10">cms</span>
                </div>
              </div>

              {/* Weight */}
              <div className="space-y-2">
                <Label htmlFor="weight" className="flex items-center gap-2">
                  <Scale className="w-4 h-4" />
                  Weight
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="weight"
                    type="text"
                    inputMode="decimal"
                    placeholder="Enter weight"
                    value={weight}
                    onChange={handleWeightChange}
                    className="h-12 flex-1"
                  />
                  <span className="text-muted-foreground font-medium w-10">kgs</span>
                </div>
              </div>
            </>
          )}

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={loading || !isFormValid()}
            className="w-full h-12 mt-6"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
            ) : (
              "Complete Setup"
            )}
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ProfileSetup;
