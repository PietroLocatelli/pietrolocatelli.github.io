import * as THREE from 'three';
import {EffectComposer} from "three/addons/postprocessing/EffectComposer.js";
import {RenderPass} from "three/addons/postprocessing/RenderPass.js";
import {OutputPass} from "three/addons/postprocessing/OutputPass.js";
import {FXAAPass} from "three/addons/postprocessing/FXAAPass.js";
import {BokehPass} from "three/addons/postprocessing/BokehPass.js";

import * as TWEEN from '@tweenjs/tween.js';

import {ThreeBackground} from "./threeBackground.js";

const domReady = document.readyState === 'complete'
    ? Promise.resolve()
    : new Promise(resolve => addEventListener('load', resolve, {once: true}));


function canUse3D(canvas) {
    if (!canvas) return false;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
    if (navigator.connection?.saveData) return false;
    try {
        const c = document.createElement('canvas');
        return !!(c.getContext('webgl2') || c.getContext('webgl'));
    } catch {
        return false;
    }
}

domReady.then(() => {
    const canvas = document.getElementById('three-background-canvas');
    const container = document.getElementById('three-background-container');

    let pageLoadDelay = 0;
    if(canUse3D(canvas)) {
        try {
            const background = new ThreeBackground(canvas);
            canvas.hidden = false;
            container.classList.add('ready');
            pageLoadDelay = 500;
        } catch (e) {
            console.warn('3D background loading failed, falling back to plain HTML/CSS:', e);
        }
    } else {
        console.info('Environment not ideal for 3d content, falling back to plain HTML/CSS');
    }

    const projects = document.getElementById('projects');
    projects.addEventListener('click', (e) => {
        setTimeout(() => location.assign('/projects/'), pageLoadDelay);
    });

    const curriculum = document.getElementById('curriculum');
    curriculum.addEventListener('click', (e) => {
        setTimeout(() => location.assign('/curriculum/'), pageLoadDelay);
    });

    const contacts = document.getElementById('contacts');
    contacts.addEventListener('click', (e) => {
        setTimeout(() => location.assign('/contacts/'), pageLoadDelay);
    });
});