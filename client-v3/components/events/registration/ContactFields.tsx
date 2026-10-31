"use client";

import Link from "next/link";
import { inputClass, readOnlyInputClass } from "@/components/ui/styles";

interface ContactFieldsProps {
  phone: string;
  roll: string;
  onPhoneChange: (phone: string) => void;
  onRollChange: (roll: string) => void;
  isPhoneSaved: boolean;
  isRollSaved: boolean;
}

/** Phone & roll inputs shared by the create and join forms; saved values are locked to the profile. */
export default function ContactFields({
  phone,
  roll,
  onPhoneChange,
  onRollChange,
  isPhoneSaved,
  isRollSaved,
}: ContactFieldsProps) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-xs text-white/55">Phone</span>
          <input
            type="tel"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={10}
            required={!isPhoneSaved}
            readOnly={isPhoneSaved}
            placeholder="10-digit mobile"
            value={phone}
            onChange={(e) => onPhoneChange(e.target.value.replace(/\D/g, "").slice(0, 10))}
            className={isPhoneSaved ? readOnlyInputClass : inputClass}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs text-white/55">Roll number</span>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            required={!isRollSaved}
            readOnly={isRollSaved}
            placeholder="e.g. 2152001"
            value={roll}
            onChange={(e) => onRollChange(e.target.value.replace(/\D/g, ""))}
            className={isRollSaved ? readOnlyInputClass : inputClass}
          />
        </label>
      </div>
      {(isPhoneSaved || isRollSaved) && (
        <p className="text-xs text-white/45">
          Saved details can be changed in your{" "}
          <Link href="/profile" className="text-white/70 underline-offset-4 hover:text-white hover:underline">
            profile
          </Link>
          .
        </p>
      )}
    </div>
  );
}
