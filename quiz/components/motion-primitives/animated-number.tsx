'use client';
import { cn } from '@/lib/utils';
import { motion, SpringOptions, useSpring, useTransform } from 'motion/react';
import { useEffect } from 'react';

export type AnimatedNumberProps = {
  value: number;
  className?: string;
  springOptions?: SpringOptions;
};

// motion-primitives AnimatedNumber, fixed to a stable motion.span: the upstream version
// called motion.create() during render, which remounts the node and resets the spring.
export function AnimatedNumber({ value, className, springOptions }: AnimatedNumberProps) {
  const spring = useSpring(value, springOptions);
  const display = useTransform(spring, (current) => Math.round(current).toLocaleString());

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return <motion.span className={cn('tabular-nums', className)}>{display}</motion.span>;
}
