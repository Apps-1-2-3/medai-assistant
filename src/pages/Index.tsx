import { useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { PatientForm } from '@/components/PatientForm';
import { RecommendationResults } from '@/components/RecommendationResults';
import { PatientInput, RecommendationResult } from '@/types/medical';
import { generateRecommendation } from '@/lib/mockPrediction';

const Index = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<RecommendationResult | null>(null);

  const handleSubmit = async (data: PatientInput) => {
    setIsLoading(true);
    setResult(null);
    
    try {
      const recommendation = await generateRecommendation(data);
      setResult(recommendation);
    } catch (error) {
      console.error('Error generating recommendation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <PatientForm onSubmit={handleSubmit} isLoading={isLoading} />
          
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-muted-foreground">Analyzing patient data and generating recommendations...</p>
            </div>
          )}
          
          {result && !isLoading && (
            <RecommendationResults result={result} />
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
