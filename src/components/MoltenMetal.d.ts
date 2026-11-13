import type { CSSProperties, JSX } from "react";

export interface MoltenMetalProps {
  colors?: string[];
  coreColor?: string;
  backgroundColor?: string;
  lightMode?: boolean;
  speed?: number;
  scale?: number;
  detail?: number;
  glow?: number;
  thickness?: number;
  swirl?: number;
  turbulence?: number;
  haze?: number;
  brightness?: number;
  colorMode?: "molten" | "ember" | "frost";
  rotation?: number;
  offsetX?: number;
  offsetY?: number;
  drift?: number;
  grain?: number;
  opacity?: number;
  intro?: boolean;
  mouseInteraction?: boolean;
  mouseStrength?: number;
  flareOnClick?: boolean;
  paused?: boolean;
  dpr?: number;
  className?: string;
  style?: CSSProperties;
}

declare function MoltenMetal(props: MoltenMetalProps): JSX.Element;
export default MoltenMetal;
