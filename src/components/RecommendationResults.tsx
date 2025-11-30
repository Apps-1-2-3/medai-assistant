import { Pill, TrendingUp, AlertCircle, CheckCircle, Info, Activity, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RecommendationResult } from '@/types/medical';

interface RecommendationResultsProps {
  result: RecommendationResult;
}

export const RecommendationResults = ({ result }: RecommendationResultsProps) => {
  const { recommendations, explanations, interactions } = result;

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.85) return 'text-success';
    if (confidence >= 0.7) return 'text-primary';
    return 'text-warning';
  };

  const getSeverityStyles = (severity: 'low' | 'moderate' | 'high') => {
    switch (severity) {
      case 'high':
        return 'bg-destructive/10 border-destructive/30 text-destructive';
      case 'moderate':
        return 'bg-warning/10 border-warning/30 text-warning';
      default:
        return 'bg-muted border-border text-muted-foreground';
    }
  };

  const getEffectivenessColor = (effectiveness?: string) => {
    if (!effectiveness) return 'bg-muted text-muted-foreground';
    if (effectiveness.includes('Highly')) return 'bg-success/20 text-success';
    if (effectiveness.includes('Considerably')) return 'bg-primary/20 text-primary';
    if (effectiveness.includes('Moderately')) return 'bg-warning/20 text-warning';
    return 'bg-muted text-muted-foreground';
  };

  const getRiskColor = (risk?: string) => {
    if (!risk) return 'bg-muted text-muted-foreground';
    if (risk.includes('Low')) return 'bg-success/20 text-success';
    if (risk.includes('Mild')) return 'bg-primary/20 text-primary';
    if (risk.includes('Moderate')) return 'bg-warning/20 text-warning';
    return 'bg-destructive/20 text-destructive';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Drug Recommendations */}
      <Card className="medical-shadow-md border-border">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Pill className="w-5 h-5 text-primary" />
            Recommended Medications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {recommendations.map((drug, index) => (
            <div
              key={index}
              className="p-4 rounded-lg bg-secondary/50 border border-border"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-success" />
                  <h3 className="font-medium text-foreground">{drug.name}</h3>
                </div>
                <Badge variant="secondary" className={getConfidenceColor(drug.confidence)}>
                  {Math.round(drug.confidence * 100)}% confidence
                </Badge>
              </div>
              
              {/* Effectiveness & Risk Badges */}
              <div className="flex flex-wrap gap-2 mb-3">
                {drug.effectiveness && (
                  <Badge variant="outline" className={getEffectivenessColor(drug.effectiveness)}>
                    <Activity className="w-3 h-3 mr-1" />
                    {drug.effectiveness}
                  </Badge>
                )}
                {drug.sideEffectsRisk && (
                  <Badge variant="outline" className={getRiskColor(drug.sideEffectsRisk)}>
                    <Shield className="w-3 h-3 mr-1" />
                    Side Effects: {drug.sideEffectsRisk}
                  </Badge>
                )}
                {drug.conditionMatch && (
                  <Badge variant="outline" className="bg-accent/20 text-accent">
                    Matches: {drug.conditionMatch}
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Dosage:</span>
                  <span className="ml-2 text-foreground font-medium">{drug.dosage}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Frequency:</span>
                  <span className="ml-2 text-foreground font-medium">{drug.frequency}</span>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Drug Interactions Warning */}
      {interactions.length > 0 && (
        <Card className="medical-shadow-md border-destructive/30 bg-destructive/5">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-destructive flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Drug Interaction Warnings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {interactions.map((interaction, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${getSeverityStyles(interaction.severity)}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Badge 
                    variant="outline" 
                    className={interaction.severity === 'high' ? 'border-destructive text-destructive' : 'border-warning text-warning'}
                  >
                    {interaction.severity.toUpperCase()}
                  </Badge>
                  <span className="font-medium">
                    {interaction.drug1} + {interaction.drug2}
                  </span>
                </div>
                <p className="text-sm opacity-90">{interaction.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* SHAP Explainability */}
      <Card className="medical-shadow-md border-border">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-accent" />
            Why This Recommendation?
            <span className="text-xs font-normal text-muted-foreground ml-2">(SHAP Analysis)</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {explanations.map((exp, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-foreground">{exp.feature}</span>
                <span className={exp.direction === 'positive' ? 'text-success' : 'text-destructive'}>
                  {exp.direction === 'positive' ? '+' : '-'}{exp.influence}%
                </span>
              </div>
              <Progress 
                value={exp.influence} 
                className={`h-2 ${exp.direction === 'positive' ? '[&>div]:bg-success' : '[&>div]:bg-destructive'}`}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 border border-border">
        <Info className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
        <p className="text-sm text-muted-foreground">
          These recommendations are generated by an AI model using SHAP-based explainability for clinical decision support only. 
          Always verify recommendations with clinical guidelines and consider individual patient factors. 
          This tool does not replace professional medical judgment.
        </p>
      </div>
    </div>
  );
};
