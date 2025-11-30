import { Shield, Heart } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-card border-t border-border mt-auto">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            <span>For clinical decision support only. Not a substitute for professional medical advice.</span>
          </div>
          <div className="flex items-center gap-1">
            <span>Built with</span>
            <Heart className="w-4 h-4 text-destructive" />
            <span>for better healthcare</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
