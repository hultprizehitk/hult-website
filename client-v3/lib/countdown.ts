"use client";

import { useState, useEffect } from "react";

export interface CountdownState {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
  hasDeadline: boolean;
  formattedDeadline: string;
  countdownText: string;
}

/**
 * Formats a deadline timestamp into a clean, human-readable date and time.
 * Example: "Tue, Sep 29 · 11:59 PM"
 */
export function formatDeadlineDate(deadlineStr?: string): string {
  if (!deadlineStr) return "TBD";
  try {
    const d = new Date(deadlineStr);
    if (isNaN(d.getTime())) return deadlineStr;
    const datePart = d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
    const timePart = d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    return `${datePart} · ${timePart}`;
  } catch {
    return deadlineStr || "TBD";
  }
}

/**
 * Live countdown hook that updates every second until the specified deadline.
 */
export function useCountdown(deadlineStr?: string): CountdownState {
  const [state, setState] = useState<CountdownState>(() => {
    return calculateState(deadlineStr);
  });

  useEffect(() => {
    const update = () => {
      setState(calculateState(deadlineStr));
    };

    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [deadlineStr]);

  return state;
}

function calculateState(deadlineStr?: string): CountdownState {
  if (!deadlineStr || !deadlineStr.trim()) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isExpired: true,
      hasDeadline: false,
      formattedDeadline: "TBD",
      countdownText: "No Deadline Set",
    };
  }

  const target = new Date(deadlineStr).getTime();
  if (isNaN(target)) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isExpired: true,
      hasDeadline: false,
      formattedDeadline: deadlineStr,
      countdownText: "Invalid Date",
    };
  }

  const now = Date.now();
  const diff = target - now;
  const formattedDeadline = formatDeadlineDate(deadlineStr);

  if (diff <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isExpired: true,
      hasDeadline: true,
      formattedDeadline,
      countdownText: "Deadline Passed",
    };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  const countdownText =
    days > 0
      ? `${days}d ${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`
      : `${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`;

  return {
    days,
    hours,
    minutes,
    seconds,
    isExpired: false,
    hasDeadline: true,
    formattedDeadline,
    countdownText,
  };
}
