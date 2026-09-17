import React from 'react';

export interface LanyardProps {
  position?: [number, number, number];
  gravity?: [number, number, number];
  fov?: number;
  transparent?: boolean;
  frontImage?: string | null;
  backImage?: string | null;
  imageFit?: 'cover' | 'contain';
  lanyardImage?: string | null;
  lanyardWidth?: number;
  cardScale?: number;
  anchorX?: number;
}

declare const Lanyard: React.FC<LanyardProps>;
export default Lanyard;
