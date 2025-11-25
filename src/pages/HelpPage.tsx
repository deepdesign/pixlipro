import { Button } from "@/components/Button";
import { ArrowLeft, HelpCircle, BookOpen, Sparkles } from "lucide-react";
import { OnboardingPanel } from "@/components/Onboarding/OnboardingPanel";

interface HelpPageProps {
  onClose: () => void;
}

export const HelpPage = ({ onClose }: HelpPageProps) => {
  return (
    <div className="h-full w-full flex flex-col bg-[var(--bg-base)]">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-[var(--panel-border)]">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onClose}
            aria-label="Back to canvas"
            title="Back to canvas"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-[var(--accent-primary)]" />
            <h1 className="text-lg font-semibold text-[var(--heading-color)]">Help & Getting Started</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <OnboardingPanel isOpen={true} onClose={onClose} />
      </div>
    </div>
  );
};

