"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

interface ClothWindOverlayProps {
  mouseOffset?: { x: number; y: number };
  isRevealed?: boolean;
}

export default function ClothWindOverlay({
  mouseOffset = { x: 0, y: 0 },
  isRevealed = false,
}: ClothWindOverlayProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  // Smooth mouse coordinates to prevent glitching / tearing during quick cursor movements
  const smoothMouseRef = useRef({ x: 0, y: 0 });
  const mouseTargetRef = useRef(mouseOffset);
  mouseTargetRef.current = mouseOffset;

  // Reveal state ref
  const isRevealedRef = useRef(isRevealed);
  isRevealedRef.current = isRevealed;

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Check reduced motion preference
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Scene & Orthographic Camera calibrated to image coordinate space: 3344 x 1882
    const WORLD_W = 3344;
    const WORLD_H = 1882;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(
      -WORLD_W / 2,
      WORLD_W / 2,
      WORLD_H / 2,
      -WORLD_H / 2,
      0.1,
      2000
    );
    camera.position.set(0, 0, 1000);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    // =========================================================================
    // VERTICAL HULT PRIZE BANNERS (LEFT & RIGHT)
    // =========================================================================
    const textureLoader = new THREE.TextureLoader();
    const bannerTexture = textureLoader.load("/hult-banner-vertical.png", (tex) => {
      tex.generateMipmaps = true;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
    });

    const bannerUniformsLeft = {
      uTime: { value: 0 },
      uTexture: { value: bannerTexture },
      uWindStrength: { value: 1.0 },
      uMouseOffset: { value: new THREE.Vector2(0, 0) },
      uSide: { value: -1.0 },
      uUnfurlProgress: { value: isRevealedRef.current ? 1.0 : 0.0 },
    };

    const bannerUniformsRight = {
      uTime: { value: 0 },
      uTexture: { value: bannerTexture },
      uWindStrength: { value: 1.0 },
      uMouseOffset: { value: new THREE.Vector2(0, 0) },
      uSide: { value: 1.0 },
      uUnfurlProgress: { value: isRevealedRef.current ? 1.0 : 0.0 },
    };

    const bannerVertexShader = `
      uniform float uTime;
      uniform float uWindStrength;
      uniform vec2 uMouseOffset;
      uniform float uSide;
      uniform float uUnfurlProgress; // 0.0 (tucked at top) -> 1.0 (fully unrolled)
      varying vec2 vUv;
      varying float vFoldLighting;

      void main() {
        vUv = uv;
        vec3 pos = position;

        // --- Slow & Smooth Unfurling / Drop Roll-down Reveal ---
        // uv.y = 1.0 is the top anchored edge (pos.y = 0)
        // uv.y = 0.0 is the bottom chevron tip (pos.y = -BANNER_H)
        // Drop smoothly from the very top rod down to the bottom
        float vertexDropProgress = smoothstep(1.0 - uv.y - 0.2, 1.0 - uv.y + 0.1, uUnfurlProgress);
        
        // Gentle weight expansion as the banner rolls down
        pos.y = mix(0.0, pos.y, vertexDropProgress);

        // Hanging freedom factor: 0 at top mounting rod, max towards bottom
        float hangingFactor = pow(1.0 - uv.y, 1.35) * vertexDropProgress;

        // Continuous natural wind wave propagation (gentle and smooth)
        float speed = uTime * 3.2;
        float wave1 = sin((1.0 - uv.y) * 7.5 - speed + uv.x * 2.0) * 11.0 * hangingFactor;
        float wave2 = cos((1.0 - uv.y) * 15.0 - speed * 1.2 + uv.x * 3.0) * 4.5 * hangingFactor;
        
        // Lateral breeze & smooth mouse sway (no jitter/glitches)
        float mouseSway = uMouseOffset.x * 7.0 * hangingFactor;
        float lateralBreeze = sin((1.0 - uv.y) * 4.0 - speed * 0.6) * 4.5 * hangingFactor * uSide;

        pos.z += (wave1 + wave2) * uWindStrength;
        pos.x += (lateralBreeze + mouseSway) * uWindStrength;

        // Subtle normal fold slope lighting (neutral contrast, preserves 100% exact colors)
        float slope = cos((1.0 - uv.y) * 7.5 - speed) * 7.5 * 11.0 * hangingFactor;
        vFoldLighting = clamp(slope * 0.005, -0.10, 0.10);

        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `;

    const bannerFragmentShader = `
      uniform sampler2D uTexture;
      uniform float uUnfurlProgress;
      varying vec2 vUv;
      varying float vFoldLighting;

      void main() {
        // Unfurl reveal boundary
        float revealBoundary = 1.0 - uUnfurlProgress;
        if (vUv.y < revealBoundary) discard;

        vec4 texColor = texture2D(uTexture, vUv);
        // Crisp, sharp alpha cutoff to give razor-sharp edges and chevron cutout
        if (texColor.a < 0.5) discard;

        // Exact original color preservation with delicate fold highlights
        float foldShade = 1.0 + vFoldLighting;
        vec3 finalColor = texColor.rgb * foldShade;

        gl_FragColor = vec4(finalColor, 1.0);
      }
    `;

    // Banner geometry & dimensions (Aspect ratio matching building proportions 147 x 865)
    const BANNER_W = 147;
    const BANNER_H = 865;
    const bannerGeo = new THREE.PlaneGeometry(BANNER_W, BANNER_H, 28, 80);
    // Shift top edge to pivot point (0, 0)
    bannerGeo.translate(0, -BANNER_H / 2, 0);

    const bannerMatLeft = new THREE.ShaderMaterial({
      vertexShader: bannerVertexShader,
      fragmentShader: bannerFragmentShader,
      uniforms: bannerUniformsLeft,
      side: THREE.DoubleSide,
      transparent: false,
    });

    const bannerMatRight = new THREE.ShaderMaterial({
      vertexShader: bannerVertexShader,
      fragmentShader: bannerFragmentShader,
      uniforms: bannerUniformsRight,
      side: THREE.DoubleSide,
      transparent: false,
    });

    const leftBannerMesh = new THREE.Mesh(bannerGeo, bannerMatLeft);
    // Left Wing: ~13.4% left from outer margin, top ~32.3%
    leftBannerMesh.position.set(-1150, 333, 5);
    leftBannerMesh.rotation.z = -0.026; // subtle 1.5deg tilt matching building perspective
    scene.add(leftBannerMesh);

    const rightBannerMesh = new THREE.Mesh(bannerGeo, bannerMatRight);
    // Right Wing: ~13.4% right from outer margin, top ~32.3%
    rightBannerMesh.position.set(1150, 333, 5);
    rightBannerMesh.rotation.z = 0.017; // subtle -1deg tilt matching perspective
    scene.add(rightBannerMesh);

    // =========================================================================
    // ANIMATION LOOP & RESIZE HANDLING
    // =========================================================================
    let animationFrameId: number;
    const startTime = performance.now();
    let unfurlStartTime: number | null = null;

    const handleResize = () => {
      if (!container) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      if (width === 0 || height === 0) return;

      renderer.setSize(width, height);
    };

    window.addEventListener("resize", handleResize);

    const animate = (timestamp: number) => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = (timestamp - startTime) * 0.001;

      // Smooth mouse interpolation (LERP 0.05) to eliminate any jitter/glitch
      smoothMouseRef.current.x += (mouseTargetRef.current.x - smoothMouseRef.current.x) * 0.05;
      smoothMouseRef.current.y += (mouseTargetRef.current.y - smoothMouseRef.current.y) * 0.05;

      // Unfurl reveal animation logic:
      // Starts right after clouds part and image appears; 2.8s duration for a slow, stately, cinematic roll down
      let unfurlProgress = 0.0;
      if (isRevealedRef.current) {
        if (unfurlStartTime === null) {
          unfurlStartTime = timestamp;
        }
        const unfurlElapsed = (timestamp - unfurlStartTime) * 0.001;
        const UNFURL_DURATION = 2.8; // 2.8s slow, smooth and clearly visible reveal
        const t = Math.min(1.0, unfurlElapsed / UNFURL_DURATION);
        // Silky smooth cubic ease-out
        unfurlProgress = prefersReducedMotion ? 1.0 : 1 - Math.pow(1 - t, 2.5);
      } else {
        unfurlStartTime = null;
        unfurlProgress = 0.0;
      }

      if (!prefersReducedMotion) {
        bannerUniformsLeft.uTime.value = elapsedTime;
        bannerUniformsLeft.uMouseOffset.value.set(smoothMouseRef.current.x, smoothMouseRef.current.y);
        bannerUniformsLeft.uUnfurlProgress.value = unfurlProgress;

        bannerUniformsRight.uTime.value = elapsedTime;
        bannerUniformsRight.uMouseOffset.value.set(smoothMouseRef.current.x, smoothMouseRef.current.y);
        bannerUniformsRight.uUnfurlProgress.value = unfurlProgress;
      } else {
        bannerUniformsLeft.uUnfurlProgress.value = 1.0;
        bannerUniformsRight.uUnfurlProgress.value = 1.0;
      }

      renderer.render(scene, camera);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);

      // Clean up WebGL resources
      bannerGeo.dispose();
      bannerMatLeft.dispose();
      bannerMatRight.dispose();
      bannerTexture.dispose();
      renderer.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden z-[3]">
      <div
        ref={mountRef}
        className="relative aspect-[3344/1882] min-w-full min-h-full w-auto h-auto shrink-0"
      />
    </div>
  );
}
