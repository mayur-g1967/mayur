"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

export function Aurora({
    colorStops = ["#00d8ff", "#7cff67", "#00d8ff", "#0270a3"],
    amplitude = 1.0,
    speed = 0.5,
    blend = 0.5,
    className = "",
    style = {},
}) {
    const mountRef = useRef(null);
    const timeRef = useRef(0);

    useEffect(() => {
        if (!mountRef.current) return;

        // SCENE SETUP
        const scene = new THREE.Scene();

        // CAMERA SETUP
        const camera = new THREE.PerspectiveCamera(
            75,
            mountRef.current.clientWidth / mountRef.current.clientHeight,
            0.1,
            1000
        );
        camera.position.z = 2;

        // RENDERER SETUP
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio for performance
        mountRef.current.appendChild(renderer.domElement);

        // UNIFORMS
        const uniforms = {
            uTime: { value: 0 },
            uAmplitude: { value: amplitude },
            uColor1: { value: new THREE.Color(colorStops[0]) },
            uColor2: { value: new THREE.Color(colorStops[1]) },
            uColor3: { value: new THREE.Color(colorStops[2]) },
            uColor4: { value: new THREE.Color(colorStops[3]) },
            uBlend: { value: blend },
        };

        // GEOMETRY & MATERIAL
        const geometry = new THREE.PlaneGeometry(6, 4, 128, 128); // High segment count for smooth waves

        const material = new THREE.ShaderMaterial({
            uniforms: uniforms,
            vertexShader: `
        uniform float uTime;
        uniform float uAmplitude;
        varying vec2 vUv;
        varying float vElevation;

        // Custom noise function
        vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

        float snoise(vec2 v) {
            const vec4 C = vec4(0.211324865405187,  // (3.0-sqrt(3.0))/6.0
                                0.366025403784439,  // 0.5*(sqrt(3.0)-1.0)
                               -0.577350269189626,  // -1.0 + 2.0 * C.x
                                0.024390243902439); // 1.0 / 41.0
            vec2 i  = floor(v + dot(v, C.yy) );
            vec2 x0 = v -   i + dot(i, C.xx);
            vec2 i1;
            i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
            vec4 x12 = x0.xyxy + C.xxzz;
            x12.xy -= i1;
            vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
                + i.x + vec3(0.0, i1.x, 1.0 ));
            vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
            m = m*m ;
            m = m*m ;
            vec3 x = 2.0 * fract(p * C.www) - 1.0;
            vec3 h = abs(x) - 0.5;
            vec3 ox = floor(x + 0.5);
            vec3 a0 = x - ox;
            m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
            vec3 g;
            g.x  = a0.x  * x0.x  + h.x  * x0.y;
            g.yz = a0.yz * x12.xz + h.yz * x12.yw;
            return 130.0 * dot(m, g);
        }

        void main() {
            vUv = uv;
            vec3 pos = position;

            // Generate waves using noise and sine
            float elevation = sin(pos.x * 2.0 + uTime * 0.5) * 0.1
                            + sin(pos.y * 2.0 + uTime * 0.3) * 0.1;
            
            float noiseX = snoise(vec2(pos.x * 1.5 + uTime * 0.2, pos.y * 1.5));
            float noiseY = snoise(vec2(pos.x * 0.5, pos.y * 0.5 - uTime * 0.3));

            elevation += noiseX * 0.2 * uAmplitude;
            elevation += noiseY * 0.2 * uAmplitude;
            
            pos.z += elevation;
            vElevation = elevation;

            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
            fragmentShader: `
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        uniform vec3 uColor3;
        uniform vec3 uColor4;
        uniform float uBlend;

        varying vec2 vUv;
        varying float vElevation;

        void main() {
            // Smoothly blend colors based on UV coordinates and elevation
            vec3 colorMix1 = mix(uColor1, uColor2, vUv.x + vElevation * uBlend);
            vec3 colorMix2 = mix(uColor3, uColor4, vUv.y - vElevation * uBlend);
            
            vec3 finalColor = mix(colorMix1, colorMix2, 0.5 + vElevation);
            
            // Add a subtle vignette/fade at edges
            float fade = smoothstep(0.0, 0.2, vUv.y) * smoothstep(1.0, 0.8, vUv.y);
            
            // Output color with opacity support
            gl_FragColor = vec4(finalColor, fade);
        }
      `,
            transparent: true,
            depthWrite: false, // Ensures it doesn't block other elements
        });

        const mesh = new THREE.Mesh(geometry, material);
        // Rotate the plane to face the camera appropriately and cover more area
        mesh.rotation.x = -Math.PI * 0.2;
        scene.add(mesh);

        // ANIMATION LOOP
        let animationFrameId;
        const render = () => {
            timeRef.current += 0.01 * speed;
            material.uniforms.uTime.value = timeRef.current;

            renderer.render(scene, camera);
            animationFrameId = requestAnimationFrame(render);
        };

        render();

        // RESIZE HANDLER
        const handleResize = () => {
            if (!mountRef.current) return;

            const width = mountRef.current.clientWidth;
            const height = mountRef.current.clientHeight;

            renderer.setSize(width, height);
            camera.aspect = width / height;
            camera.updateProjectionMatrix();

            // Adjust mesh scale based on screen size to maintain coverage
            const scale = Math.max(width, height) / 500;
            mesh.scale.set(scale, scale, 1);
        };

        window.addEventListener("resize", handleResize);
        handleResize(); // Initial call to set correct scale

        // CLEANUP
        return () => {
            window.removeEventListener("resize", handleResize);
            cancelAnimationFrame(animationFrameId);

            geometry.dispose();
            material.dispose();
            renderer.dispose();

            if (mountRef.current && mountRef.current.contains(renderer.domElement)) {
                mountRef.current.removeChild(renderer.domElement);
            }
        };
    }, [colorStops, amplitude, speed, blend]);

    return (
        <div
            ref={mountRef}
            className={`absolute inset-0 z-0 pointer-events-none ${className}`}
            style={{ overflow: "hidden", ...style }}
        />
    );
}
