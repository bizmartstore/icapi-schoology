import { useState } from "react";
import AdminCodeDialog from "./AdminCodeDialog";

const LMSFooter = () => {
  const [showAdminDialog, setShowAdminDialog] = useState(false);

  return (
    <>
      <footer className="py-6 text-center">
        <button
          onClick={() => setShowAdminDialog(true)}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          EduLearn LMS © 2026
        </button>
      </footer>
      <AdminCodeDialog open={showAdminDialog} onOpenChange={setShowAdminDialog} />
    </>
  );
};

export default LMSFooter;
