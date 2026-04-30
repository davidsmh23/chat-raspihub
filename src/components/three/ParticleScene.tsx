import { useEffect, useRef } from "react";
import * as THREE from "three";

const vertexShader = `
  attribute float phase;
  uniform float time;
  varying float vOpacity;

  void main() {
    vOpacity = 0.35 + 0.65 * (0.5 + 0.5 * sin(time * 0.8 + phase));
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = (1.8 + 0.8 * sin(time * 0.4 + phase)) * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = `
  varying float vOpacity;

  void main() {
    vec2 uv = gl_PointCoord - vec2(0.5);
    float d = length(uv);
    if (d > 0.5) discard;
    float alpha = (1.0 - d * 1.8) * vOpacity;
    gl_FragColor = vec4(0.788, 0.659, 0.298, alpha);
  }
`;

export function ParticleScene() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const isMobile = window.innerWidth < 768;
    const count = isMobile ? 800 : 2500;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.z = 6;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: !isMobile });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const positions = new Float32Array(count * 3);
    const phases = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 22;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 12;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 8;
      phases[i] = Math.random() * Math.PI * 2;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("phase", new THREE.BufferAttribute(phases, 1));

    const material = isMobile
      ? new THREE.PointsMaterial({ color: 0xc9a84c, size: 0.04, transparent: true, opacity: 0.5 })
      : new THREE.ShaderMaterial({
          vertexShader,
          fragmentShader,
          uniforms: { time: { value: 0 } },
          transparent: true,
          depthWrite: false,
        });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();
      particles.rotation.y = elapsed * 0.015;
      particles.rotation.x = Math.sin(elapsed * 0.008) * 0.05;
      if (!isMobile && "uniforms" in material) {
        (material as THREE.ShaderMaterial).uniforms.time.value = elapsed;
      }
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 1 }}
    />
  );
}
