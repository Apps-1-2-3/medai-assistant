import { useState } from 'react';
import { User, Calendar, AlertTriangle, FileText, Thermometer, Pill, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PatientInput, MEDICAL_CONDITIONS, SYMPTOMS, COMMON_ALLERGIES } from '@/types/medical';

interface PatientFormProps {
  onSubmit: (data: PatientInput) => void;
  isLoading: boolean;
}

export const PatientForm = ({ onSubmit, isLoading }: PatientFormProps) => {
  const [age, setAge] = useState<string>('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [allergies, setAllergies] = useState<string[]>([]);
  const [medicalHistory, setMedicalHistory] = useState<string[]>([]);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [currentMedications, setCurrentMedications] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      age: parseInt(age) || 0,
      gender,
      allergies,
      medicalHistory,
      symptoms,
      currentMedications,
    });
  };

  const toggleSelection = (
    item: string,
    current: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    if (current.includes(item)) {
      setter(current.filter(i => i !== item));
    } else {
      setter([...current, item]);
    }
  };

  return (
    <Card className="medical-shadow-md border-border">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
          <User className="w-5 h-5 text-primary" />
          Patient Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="age" className="flex items-center gap-2 text-foreground">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                Patient Age
              </Label>
              <Input
                id="age"
                type="number"
                placeholder="Enter age"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                min="0"
                max="120"
                required
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender" className="flex items-center gap-2 text-foreground">
                <User className="w-4 h-4 text-muted-foreground" />
                Gender
              </Label>
              <Select value={gender} onValueChange={(v: 'male' | 'female' | 'other') => setGender(v)}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Allergies */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-foreground">
              <AlertTriangle className="w-4 h-4 text-warning" />
              Known Drug Allergies
            </Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {COMMON_ALLERGIES.map((allergy) => (
                <div key={allergy} className="flex items-center space-x-2">
                  <Checkbox
                    id={`allergy-${allergy}`}
                    checked={allergies.includes(allergy)}
                    onCheckedChange={() => toggleSelection(allergy, allergies, setAllergies)}
                  />
                  <label
                    htmlFor={`allergy-${allergy}`}
                    className="text-sm text-foreground cursor-pointer"
                  >
                    {allergy}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Medical History */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-foreground">
              <FileText className="w-4 h-4 text-primary" />
              Medical History
            </Label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
              {MEDICAL_CONDITIONS.map((condition) => (
                <div key={condition} className="flex items-center space-x-2">
                  <Checkbox
                    id={`condition-${condition}`}
                    checked={medicalHistory.includes(condition)}
                    onCheckedChange={() => toggleSelection(condition, medicalHistory, setMedicalHistory)}
                  />
                  <label
                    htmlFor={`condition-${condition}`}
                    className="text-sm text-foreground cursor-pointer"
                  >
                    {condition}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Current Symptoms */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-foreground">
              <Thermometer className="w-4 h-4 text-destructive" />
              Current Symptoms
            </Label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {SYMPTOMS.map((symptom) => (
                <div key={symptom} className="flex items-center space-x-2">
                  <Checkbox
                    id={`symptom-${symptom}`}
                    checked={symptoms.includes(symptom)}
                    onCheckedChange={() => toggleSelection(symptom, symptoms, setSymptoms)}
                  />
                  <label
                    htmlFor={`symptom-${symptom}`}
                    className="text-sm text-foreground cursor-pointer"
                  >
                    {symptom}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Current Medications */}
          <div className="space-y-2">
            <Label htmlFor="medications" className="flex items-center gap-2 text-foreground">
              <Pill className="w-4 h-4 text-accent" />
              Current Medications
            </Label>
            <Input
              id="medications"
              placeholder="Enter current medications (e.g., Lisinopril, Metformin, Warfarin)"
              value={currentMedications}
              onChange={(e) => setCurrentMedications(e.target.value)}
              className="bg-background"
            />
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full md:w-auto px-8"
            disabled={isLoading || !age || symptoms.length === 0}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                Analyzing...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Send className="w-4 h-4" />
                Generate Recommendation
              </span>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
