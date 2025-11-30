import { Stethoscope, Activity } from 'lucide-react';

export const Header = () => {
  return (
    <header className="bg-card border-b border-border medical-shadow">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
            <Stethoscope className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
              AI Drug Recommendation System
              <Activity className="w-5 h-5 text-primary" />
            </h1>
            <p className="text-sm text-muted-foreground">
              Clinical Decision Support Tool
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};
