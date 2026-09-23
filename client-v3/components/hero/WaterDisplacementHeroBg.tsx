"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

interface WaterDisplacementHeroBgProps {
  src: string;
  className?: string;
}

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform sampler2D uTexture;
  uniform vec2 uMouse;
  uniform float uHover;
  uniform float uTime;
  uniform vec2 uResolution;
  uniform vec2 uImageRes;

  varying vec2 vUv;

  // Multi-octave wave helper for organic liquid displacement
  float wave(vec2 p, float angle, float freq, float speed, float time) {
    float c = cos(angle);
    float s = sin(angle);
    vec2 dir = vec2(c, s);
    return sin(dot(p, dir) * freq + time * speed);
  }

  void main() {
    // Preserve aspect ratio (object-fit: cover logic inside shader)
    vec2 ratio = vec2(
      min((uResolution.x / uResolution.y) / (uImageRes.x / uImageRes.y), 1.0),
      min((uResolution.y / uResolution.x) / (uImageRes.y / uImageRes.x), 1.0)
    );

    vec2 uv = vec2(
      vUv.x * ratio.x + (1.0 - ratio.x) * 0.5,
      vUv.y * ratio.y + (1.0 - ratio.y) * 0.5
    );

    // Mouse distance in normalized aspect-corrected space
    vec2 screenAspect = vec2(1.0, uResolution.y / uResolution.x);
    vec2 st = vUv * screenAspect;
    vec2 mouseSt = uMouse * screenAspect;
    float dist = length(st - mouseSt);

    // Liquid ripple parameters around cursor
    float rippleRadius = 0.45;
    float mouseEffect = smoothstep(rippleRadius, 0.0, dist) * uHover;

    // Multi-layered liquid water distortion waves
    float w1 = wave(uv, 0.4, 14.0, 1.8, uTime);
    float w2 = wave(uv, 1.7, 22.0, 2.3, uTime);
    float w3 = wave(uv, 2.9, 30.0, 1.2, uTime);

    // Ambient liquid motion
    float ambientDisplacement = (w1 * 0.45 + w2 * 0.35 + w3 * 0.2) * 0.008;

    // Concentric liquid water ripple expanding from cursor position
    float ripple = sin(dist * 38.0 - uTime * 4.5) * 0.022 * mouseEffect;
    vec2 rippleDir = dist > 0.0001 ? normalize(st - mouseSt) : vec2(0.0);

    // Combine UV displacements
    vec2 displacedUv = uv + vec2(ambientDisplacement) + rippleDir * ripple;

    // Clamp UV coordinates to prevent edge clamping artifacts
    displacedUv = clamp(displacedUv, vec2(0.001), vec2(0.999));

    // Sample background texture with displaced UVs
    vec4 color = texture2D(uTexture, displacedUv);

    // Subtle liquid caustic sheen highlight under cursor
    float sheen = mouseEffect * 0.035 * (sin(dist * 24.0 - uTime * 3.5) * 0.5 + 0.5);
    color.rgb += vec3(sheen * 0.7, sheen * 0.5, sheen * 1.0);

    gl_FragColor = color;
  }
`;

export default function WaterDisplacementHeroBg({ src, className = "" }: WaterDisplacementHeroBgProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    // 1. Scene, Orthographic Camera, WebGL Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // 2. Uniforms & Custom Shader Material
    const uniforms = {
      uTexture: { value: null as THREE.Texture | null },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uHover: { value: 0 },
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uImageRes: { value: new THREE.Vector2(1672, 941) },
    };

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
      transparent: true,
    });

    const geometry = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // 3. Texture Loader for hero background image
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(src, (tex) => {
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.generateMipmaps = false;
      uniforms.uTexture.value = tex;
      uniforms.uImageRes.value.set(tex.image.width || 1672, tex.image.height || 941);
      setLoaded(true);
    });

    // 4. Mouse position tracking with smooth lerp interpolation
    const mouseTarget = { x: 0.5, y: 0.5 };
    const mouseCurrent = { x: 0.5, y: 0.5 };
    let hoverTarget = 0;
    let hoverCurrent = 0;

    const updateSize = () => {
      const width = container.clientWidth || window.innerWidth;
      const height = container.clientHeight || window.innerHeight;
      renderer.setSize(width, height);
      uniforms.uResolution.value.set(width, height);
    };

    updateSize();
    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(container);

    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const x = (e.clientX - rect.left) / rect.width;
      const y = 1.0 - (e.clientY - rect.top) / rect.height; // Flip Y for WebGL UV coordinate space
      mouseTarget.x = Math.max(0, Math.min(1, x));
      mouseTarget.y = Math.max(0, Math.min(1, y));
      hoverTarget = 1.0;
    };

    const onMouseLeave = () => {
      hoverTarget = 0.0;
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    container.addEventListener("mouseleave", onMouseLeave, { passive: true });

    // 5. Render Loop
    const clock = new THREE.Clock();
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();
      uniforms.uTime.value = elapsedTime;

      // Silky smooth lerp for mouse coordinates and hover intensity
      mouseCurrent.x += (mouseTarget.x - mouseCurrent.x) * 0.08;
      mouseCurrent.y += (mouseTarget.y - mouseCurrent.y) * 0.08;
      hoverCurrent += (hoverTarget - hoverCurrent) * 0.06;

      uniforms.uMouse.value.set(mouseCurrent.x, mouseCurrent.y);
      uniforms.uHover.value = hoverCurrent;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      window.removeEventListener("mousemove", onMouseMove);
      container.removeEventListener("mouseleave", onMouseLeave);
      geometry.dispose();
      material.dispose();
      if (uniforms.uTexture.value) uniforms.uTexture.value.dispose();
      renderer.dispose();
    };
  }, [src]);

  return (
    <div ref={containerRef} className={`relative w-full h-full ${className}`}>
      {/* Fallback Image while WebGL Texture loads */}
      {!loaded && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt="hero-base"
          className="w-full h-full object-cover pointer-events-none transition-opacity duration-700"
        />
      )}

      {/* WebGL Canvas */}
      <canvas
        ref={canvasRef}
        className={`w-full h-full block pointer-events-auto transition-opacity duration-700 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}
