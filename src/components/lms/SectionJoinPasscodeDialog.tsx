import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Lock } from "lucide-react";
import { isValidJoinPasscode, JOIN_PASSCODE_LENGTH } from "@/lib/section-passcode";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sectionName: string;
  submitting?: boolean;
  onSubmit: (passcode: string) => void | Promise<void>;
};

const SectionJoinPasscodeDialog = ({
  open,
  onOpenChange,
  sectionName,
  submitting = false,
  onSubmit,
}: Props) => {
  const [passcode, setPasscode] = useState("");

  useEffect(() => {
    if (!open) setPasscode("");
  }, [open]);

  const canSubmit = isValidJoinPasscode(passcode) && !submitting;

  const handleSubmit = () => {
    if (!canSubmit) return;
    void onSubmit(passcode);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Lock className="h-4 w-4 text-primary" />
            Enter section passcode
          </DialogTitle>
          <DialogDescription className="text-xs">
            Ask your adviser for the 4-digit passcode to request joining <span className="font-semibold text-foreground">{sectionName}</span>.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-2">
          <InputOTP
            maxLength={JOIN_PASSCODE_LENGTH}
            inputMode="numeric"
            pattern="[0-9]*"
            value={passcode}
            onChange={setPasscode}
            disabled={submitting}
          >
            <InputOTPGroup>
              {Array.from({ length: JOIN_PASSCODE_LENGTH }, (_, i) => (
                <InputOTPSlot key={i} index={i} className="h-12 w-11 text-lg font-bold" />
              ))}
            </InputOTPGroup>
          </InputOTP>
          <Button className="w-full rounded-xl font-bold" disabled={!canSubmit} onClick={handleSubmit}>
            {submitting ? "Submitting…" : "Continue"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SectionJoinPasscodeDialog;
