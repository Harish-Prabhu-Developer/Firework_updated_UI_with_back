import React from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, ShieldCheck, Phone } from "lucide-react";

interface LegalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
}

const LegalDialog: React.FC<LegalDialogProps> = ({ isOpen, onClose, onAccept }) => {
  const handleOpenChange = (open: boolean) => {
    if (!open) onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-[460px] p-0 gap-0 rounded-xl border border-border bg-card shadow-2xl overflow-hidden">
        {/* Header Banner */}
        <div className="bg-destructive/10 border-b border-destructive/20 px-6 py-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
          <div>
            <DialogTitle className="text-base font-bold text-destructive leading-tight">
              Important Legal Notice
            </DialogTitle>
            <p className="text-[11px] text-destructive/70 mt-0.5">
              As per Hon&apos;ble Supreme Court &amp; Explosives Act
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-6 py-5 space-y-5">
          <div className="flex gap-3">
            <span className="mt-1 w-2 h-2 rounded-full bg-destructive shrink-0" />
            <p className="text-sm text-foreground leading-relaxed">
              <span className="font-bold text-destructive">
                Online sale of firecrackers is strictly prohibited
              </span>{" "}
              in India as per Supreme Court directives.
            </p>
          </div>

          <div className="flex gap-3">
            <span className="mt-1 w-2 h-2 rounded-full bg-primary shrink-0" />
            <p className="text-sm text-foreground leading-relaxed">
              This website is for{" "}
              <span className="font-semibold underline">enquiry &amp; price estimation only</span>.
              Please review your selected products and proceed to submit your estimate request.
            </p>
          </div>

          <div className="flex gap-3">
            <span className="mt-1 w-2 h-2 rounded-full bg-primary shrink-0" />
            <p className="text-sm text-foreground leading-relaxed">
              After submission, our team will contact you within{" "}
              <span className="font-semibold">2 hours</span> to confirm item availability,
              pricing, and delivery details under legal compliance.
            </p>
          </div>

          <div className="border-t border-border/50 pt-4 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="w-4 h-4 text-green-500 shrink-0" />
              <span>Licensed and authorized seller, dispatched via registered transport (Sivakasi)</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Phone className="w-4 h-4 text-primary shrink-0" />
              <span>
                We respond to all enquiries within{" "}
                <span className="font-semibold text-foreground">2 hours</span>
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 py-5 border-t border-border/40 flex flex-col-reverse sm:flex-row sm:justify-end gap-3 bg-muted/10">
          <Button
            variant="outline"
            onClick={onClose}
            className="h-11 rounded-xl px-7 font-bold text-xs uppercase tracking-widest border border-border/60 bg-background/50 backdrop-blur-sm hover:bg-secondary/40 hover:border-border/80 text-foreground/70 hover:text-foreground transition-all duration-300 active:scale-[0.98] ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            I Decline
          </Button>
          <Button
            onClick={onAccept}
            className="h-11 rounded-xl px-8 font-bold text-xs uppercase tracking-widest bg-linear-to-r from-primary to-primary/90 text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/40 border border-primary/20 hover:from-primary/95 hover:to-primary hover:-translate-y-0.5 transition-all duration-300 active:translate-y-0 active:scale-[0.97] ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 relative overflow-hidden group"
          >
            <span className="relative z-10">I Understand &amp; Continue</span>
            <div className="absolute inset-0 h-full w-full bg-linear-to-r from-transparent via-white/10 to-transparent -translate-x-[150%] skew-x-30 transition-transform duration-700 group-hover:translate-x-[150%]" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LegalDialog;
