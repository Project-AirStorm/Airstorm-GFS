import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const GlobeBackground = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    // Capture the current value of the ref when the effect runs
    const container = containerRef.current;
    if (!container) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 1);
    container.appendChild(renderer.domElement);

    // Mouse position tracking
    const mouse = {
      x: 0,
      y: 0,
      targetX: 0,
      targetY: 0,
      speed: 0.1,
    };

    // Earth setup with single texture
    const EARTH_RADIUS = 3.7;
    const earthGeometry = new THREE.SphereGeometry(EARTH_RADIUS, 64, 64);
    let earth; // Declare earth here so we can access it in the animation

    // Load a single, simple Earth texture
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      'https://raw.githubusercontent.com/turban/webgl-earth/master/images/2_no_clouds_4k.jpg',
      (texture) => {
        const earthMaterial = new THREE.MeshStandardMaterial({
          map: texture,
          metalness: 0.1,
          roughness: 0.8,
          emissive: new THREE.Color(0x112244),
          emissiveIntensity: 0.2,
        });

        earth = new THREE.Mesh(earthGeometry, earthMaterial);
        scene.add(earth);

        // Extremely bright lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 2);
        scene.add(ambientLight);

        const sunLight1 = new THREE.DirectionalLight(0xffffff, 3);
        sunLight1.position.set(1, 0, 1);
        scene.add(sunLight1);

        const sunLight2 = new THREE.DirectionalLight(0xffffff, 3);
        sunLight2.position.set(-1, 0, -1);
        scene.add(sunLight2);

        const topLight = new THREE.DirectionalLight(0xffffff, 2);
        topLight.position.set(0, 1, 0);
        scene.add(topLight);

        // Animation with mouse interaction
        const animate = () => {
          requestAnimationFrame(animate);

          // Smoothly interpolate mouse position
          mouse.x += (mouse.targetX - mouse.x) * mouse.speed;
          mouse.y += (mouse.targetY - mouse.y) * mouse.speed;

          // Update earth rotation based on mouse position
          if (earth) {
            earth.rotation.y = mouse.x * 2;
            earth.rotation.x = mouse.y * 0.5;
          }

          renderer.render(scene, camera);
        };

        animate();
      },
      undefined,
      (error) => {
        console.error('Error loading texture:', error);
        // Fallback to basic colored material if texture fails
        const fallbackMaterial = new THREE.MeshStandardMaterial({
          color: 0x1a8cff,
          metalness: 0.1,
          roughness: 0.8,
          emissive: new THREE.Color(0x112244),
          emissiveIntensity: 0.2,
        });
        earth = new THREE.Mesh(earthGeometry, fallbackMaterial);
        scene.add(earth);
      }
    );

    // Atmosphere
    const atmosphereGeometry = new THREE.SphereGeometry(
      EARTH_RADIUS * 1.02,
      64,
      64
    );
    const atmosphereMaterial = new THREE.MeshBasicMaterial({
      color: 0x0077ff,
      transparent: true,
      opacity: 0.2,
      side: THREE.BackSide,
    });

    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    scene.add(atmosphere);

    // Starfield
    const starGeometry = new THREE.BufferGeometry();
    const starMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.8,
      transparent: true,
      opacity: 0.8,
    });

    const starVertices = [];
    for (let i = 0; i < 10000; i++) {
      const x = (Math.random() - 0.5) * 2000;
      const y = (Math.random() - 0.5) * 2000;
      const z = (Math.random() - 0.5) * 2000;
      starVertices.push(x, y, z);
    }

    starGeometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(starVertices, 3)
    );
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    // Camera position
    camera.position.z = 10;

    // Mouse movement handler
    const handleMouseMove = (event) => {
      // Convert mouse position to normalized coordinates (-1 to 1)
      mouse.targetX = (event.clientX / window.innerWidth - 0.5) * Math.PI;
      mouse.targetY = (event.clientY / window.innerHeight - 0.5) * Math.PI;
    };

    // Basic animation for stars and atmosphere
    const animateBackground = () => {
      requestAnimationFrame(animateBackground);
      atmosphere.rotation.y += 0.001;
      stars.rotation.y += 0.0001;
      renderer.render(scene, camera);
    };

    animateBackground();

    // Add mouse event listener
    window.addEventListener('mousemove', handleMouseMove);

    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      if (container) {
        // Use the captured container reference
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 -z-10"
      style={{ position: 'fixed', zIndex: -1 }}
    />
  );
};

export default GlobeBackground;
