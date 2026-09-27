"use client";

import { signOut as firebaseSignOut } from "firebase/auth";
import { firebaseClient } from "@/lib/firebase/client";
import { Button } from "@/components/ui/button";

export function SignOutButton({ action }: { action: () => Promise<void> }) {
  return (
    <Button
      type="button"
      variant="destructive-outline"
      size="sm"
      className="rounded-full text-xs"
      onClick={async () => {
        await firebaseSignOut(firebaseClient().auth).catch(() => {});
        await action();
      }}
    >
      Sign Out
    </Button>
  );
}
