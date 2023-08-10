import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Slider, TextField, Box, Typography, Grid } from '@mui/material';

const SphereComponent = React.memo(() => {
    
    // constant definition
    const CUBE_SIZE = 30;
    const BOUNDARY_LIMIT = 14.5;

    // Referencing and state management
    const containerRef = useRef(null);
    const cameraRef = useRef(null);
    const [params, setParams] = useState({
        sphereCount: 100,
        sphereRadius: 0.5,
        lightIntensity: 0.8,
        cameraZPosition: 45,
    });
  
    // Scene initialization and animation
    useEffect(() => {
        // Initialize scene, camera, and renderer
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(25, window.innerWidth / window.innerHeight, 0.1, 100);
        camera.position.z = params.cameraZPosition;
        cameraRef.current = camera;

        const renderer = new THREE.WebGLRenderer({ alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        containerRef.current.appendChild(renderer.domElement);

        // Add light source
        const ambientLight = new THREE.AmbientLight(0xffffff, params.lightIntensity);
        scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, params.lightIntensity);
        directionalLight.position.set(5, 5, 5);
        scene.add(directionalLight);

        // Create Cube
        const cubeGeometry = new THREE.BoxGeometry(CUBE_SIZE, CUBE_SIZE, CUBE_SIZE);
        const cubeMaterial = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 });
        const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
        scene.add(cube);

        // Creating Spheres
        const spheres = Array.from({ length: params.sphereCount }, () => createSphere(params.sphereRadius, CUBE_SIZE));
        spheres.forEach((sphere) => cube.add(sphere));

        // Set mouse movement events
        const onMouseMove = createMouseMoveHandler(scene, cameraRef);
        window.addEventListener('mousemove', onMouseMove);

        // Set resize event
        window.addEventListener('resize', () => handleResize(camera, renderer));

        // Animation Loop
        const animate = createAnimationLoop(spheres, params.sphereRadius, renderer, scene, camera, BOUNDARY_LIMIT);
        animate();

        // Cleanup function
        return () => cleanup(renderer, containerRef, onMouseMove);
    }, [params]);

    // Handle UI changes
    const handleChange = (name) => (e) => setParams({ ...params, [name]: e.target.value });

    // UI rendering
    return renderUI(containerRef, params, handleChange);
});

// Sphere creation function
const createSphere = (radius, cubeSize) => {
    // Sphere geometry and materials
    const geometry = new THREE.SphereGeometry(radius, 32, 32);
    const color = Math.random() * 0xffffff;
    const material = new THREE.MeshPhongMaterial({ color, emissive: color, transparent: true, opacity: 0.6 });

    // Set position and speed
    const sphere = new THREE.Mesh(geometry, material);
    sphere.position.set(Math.random() * cubeSize - cubeSize / 2, Math.random() * cubeSize - cubeSize / 2, Math.random() * cubeSize - cubeSize / 2);
    sphere.velocity = new THREE.Vector3((Math.random() - 0.5) * 0.1, (Math.random() - 0.5) * 0.1, (Math.random() - 0.5) * 0.1);

    return sphere;
};

// Mouse move handler
const createMouseMoveHandler = (scene, cameraRef) => (event) => {
    // Calculate and update camera position
    const x = (event.clientX / window.innerWidth) * 2 - 1;
    const y = -(event.clientY / window.innerHeight) * 2 + 1;
    cameraRef.current.position.x = x * 5;
    cameraRef.current.position.y = y * 5;
    cameraRef.current.lookAt(scene.position);
};

// resize handler
const handleResize = (camera, renderer) => {
    const newWidth = window.innerWidth;
    const newHeight = window.innerHeight;
    camera.aspect = newWidth / newHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(newWidth, newHeight);
};

// Creating an animation loop
const createAnimationLoop = (spheres, sphereRadius, renderer, scene, camera, boundaryLimit) => {
    const animationLoop = () => {
        // Sphere Update
        updateSpheres(spheres, sphereRadius, boundaryLimit);
        
        // Rendering
        renderer.render(scene, camera);
        
        // Next frame request
        requestAnimationFrame(animationLoop);
    };
  
    return animationLoop;
  };
  

// Sphere update function
const updateSpheres = (spheres, radius, boundaryLimit) => {
    spheres.forEach((sphere) => {
        sphere.position.add(sphere.velocity);

        // Collision detection with other spheres
        spheres.forEach((otherSphere) => {
            if (sphere === otherSphere) return;
            const distance = sphere.position.distanceTo(otherSphere.position);
            if (distance < radius * 2) {
                const collisionNormal = sphere.position.clone().sub(otherSphere.position).normalize();
                sphere.velocity.reflect(collisionNormal);
                otherSphere.velocity.reflect(collisionNormal.negate());
            }
        });
    
        // Collision detection with boundary
        ['x', 'y', 'z'].forEach((axis) => {
            if (Math.abs(sphere.position[axis]) > boundaryLimit) {
                const reflectionNormal = new THREE.Vector3(...(axis === 'x' ? [1, 0, 0] : axis === 'y' ? [0, 1, 0] : [0, 0, 1]));
                if (sphere.position[axis] < 0) reflectionNormal.negate();
                sphere.velocity.reflect(reflectionNormal);
                sphere.position[axis] = Math.sign(sphere.position[axis]) * boundaryLimit;
            }
        });

        // Rotation Update
        sphere.rotation.x += 0.01;
        sphere.rotation.y += 0.01;
    });
};

// Cleanup function
const cleanup = (renderer, containerRef, onMouseMove) => {
    renderer.dispose();
    const canvas = containerRef.current.getElementsByTagName('canvas')[0];
    if (canvas) containerRef.current.removeChild(canvas);
    window.removeEventListener('mousemove', onMouseMove);
};

// UI rendering functions
const renderUI = (containerRef, params, handleChange) => {
    return (
        <div style={{ position: 'relative' }}>
            <div ref={containerRef} />
            <Box position="absolute" top={0} left={0} p={2} bgcolor="rgba(255, 255, 255, 0.8)" sx={{ borderRadius: 2 }}>
                {['sphereCount', 'sphereRadius', 'lightIntensity', 'cameraZPosition'].map((param) => (
                <Grid container spacing={2} key={param}>
                    <Grid item xs={4}>
                        <Typography variant="body1" color="text.primary">
                            {capitalize(param.replace(/([A-Z])/g, ' $1'))}:
                        </Typography>
                    </Grid>
                    <Grid item xs={4}>
                        <TextField
                            type="number"
                            value={params[param]}
                            onChange={handleChange(param)}
                            InputProps={{ inputProps: { min: 0 } }}
                        />
                    </Grid>
                    <Grid item xs={4}>
                        <Slider value={params[param]} min={0} max={param === 'sphereCount' ? 200 : param === 'sphereRadius' ? 5 : param === 'lightIntensity' ? 2 : 100} onChange={handleChange(param)} />
                    </Grid>
                </Grid>
                ))}
            </Box>
        </div>
    );
};

// Convert the first letter of a character to uppercase
const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);
export default SphereComponent;