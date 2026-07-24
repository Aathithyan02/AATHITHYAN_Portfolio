class Antigravity {
  constructor(container, options = {}) {
    this.container = container || document.body;
    
    this.props = {
      count: 300,
      magnetRadius: 10,
      ringRadius: 10,
      waveSpeed: 0.4,
      waveAmplitude: 1,
      particleSize: 2,
      lerpSpeed: 0.1,
      color: '#00ffcc', // Primary theme color
      autoAnimate: false,
      particleVariance: 1,
      rotationSpeed: 0,
      depthFactor: 1,
      pulseSpeed: 3,
      particleShape: 'capsule',
      fieldStrength: 10,
      ...options
    };

    this.init();
  }

  init() {
    this.scene = new THREE.Scene();
    
    this.camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.z = 50;
    
    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    this.canvas = this.renderer.domElement;
    this.canvas.className = 'antigravity-canvas';
    this.canvas.style.position = 'fixed';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.width = '100vw';
    this.canvas.style.height = '100vh';
    this.canvas.style.zIndex = '9999';
    this.canvas.style.pointerEvents = 'none';
    
    this.container.appendChild(this.canvas);
    
    this.dummy = new THREE.Object3D();
    
    this.updateViewport();
    this.initParticles();
    this.initMesh();
    
    this.lastMousePos = { x: 0, y: 0 };
    this.lastMouseMoveTime = 0;
    this.virtualMouse = { x: 0, y: 0 };
    this.mouse = { x: 0, y: 0 }; 
    
    this.clock = new THREE.Clock();
    
    this.onWindowResize = this.onWindowResize.bind(this);
    this.onPointerMove = this.onPointerMove.bind(this);
    this.animate = this.animate.bind(this);
    
    window.addEventListener('resize', this.onWindowResize);
    window.addEventListener('pointermove', this.onPointerMove);
    
    this.animate();
  }

  updateViewport() {
    const vFov = (this.camera.fov * Math.PI) / 180;
    const height = 2 * Math.tan(vFov / 2) * this.camera.position.z;
    const width = height * this.camera.aspect;
    this.viewport = { width, height };
  }

  initParticles() {
    this.particles = [];
    const { width, height } = this.viewport;
    
    for (let i = 0; i < this.props.count; i++) {
      const t = Math.random() * 100;
      const factor = 20 + Math.random() * 100;
      const speed = 0.01 + Math.random() / 200;
      
      const x = (Math.random() - 0.5) * width;
      const y = (Math.random() - 0.5) * height;
      const z = (Math.random() - 0.5) * 20;
      
      const randomRadiusOffset = (Math.random() - 0.5) * 2;
      
      this.particles.push({
        t,
        factor,
        speed,
        mx: x,
        my: y,
        mz: z,
        cx: x,
        cy: y,
        cz: z,
        vx: 0,
        vy: 0,
        vz: 0,
        randomRadiusOffset
      });
    }
  }

  initMesh() {
    const p = this.props;
    let geometry;
    switch(p.particleShape) {
      case 'sphere':
        geometry = new THREE.SphereGeometry(0.2, 16, 16);
        break;
      case 'box':
        geometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
        break;
      case 'tetrahedron':
        geometry = new THREE.TetrahedronGeometry(0.3);
        break;
      case 'capsule':
      default:
        geometry = new THREE.CapsuleGeometry(0.1, 0.4, 4, 8);
        break;
    }
    
    const material = new THREE.MeshBasicMaterial({ color: p.color });
    this.instancedMesh = new THREE.InstancedMesh(geometry, material, p.count);
    this.scene.add(this.instancedMesh);
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.updateViewport();
  }

  onPointerMove(e) {
    this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    this.lastMouseMoveTime = Date.now();
  }

  animate() {
    this.raf = requestAnimationFrame(this.animate);
    
    const time = this.clock.getElapsedTime();
    const v = this.viewport;
    const m = this.mouse;
    
    let destX = (m.x * v.width) / 2;
    let destY = (m.y * v.height) / 2;
    
    if (this.props.autoAnimate && Date.now() - this.lastMouseMoveTime > 2000) {
      destX = Math.sin(time * 0.5) * (v.width / 4);
      destY = Math.cos(time * 0.5 * 2) * (v.height / 4);
    }
    
    const smoothFactor = 0.05;
    this.virtualMouse.x += (destX - this.virtualMouse.x) * smoothFactor;
    this.virtualMouse.y += (destY - this.virtualMouse.y) * smoothFactor;
    
    const targetX = this.virtualMouse.x;
    const targetY = this.virtualMouse.y;
    
    const globalRotation = time * this.props.rotationSpeed;
    
    this.particles.forEach((particle, i) => {
      let { speed, mx, my, mz, randomRadiusOffset } = particle;
      
      particle.t += speed / 2;
      const t = particle.t;
      
      const projectionFactor = 1 - particle.cz / 50;
      const projectedTargetX = targetX * projectionFactor;
      const projectedTargetY = targetY * projectionFactor;
      
      const dx = mx - projectedTargetX;
      const dy = my - projectedTargetY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      let targetPos = { x: mx, y: my, z: mz * this.props.depthFactor };
      
      if (dist < this.props.magnetRadius) {
        const angle = Math.atan2(dy, dx) + globalRotation;
        const wave = Math.sin(t * this.props.waveSpeed + angle) * (0.5 * this.props.waveAmplitude);
        const deviation = randomRadiusOffset * (5 / (this.props.fieldStrength + 0.1));
        const currentRingRadius = this.props.ringRadius + wave + deviation;
        
        targetPos.x = projectedTargetX + currentRingRadius * Math.cos(angle);
        targetPos.y = projectedTargetY + currentRingRadius * Math.sin(angle);
        targetPos.z = mz * this.props.depthFactor + Math.sin(t) * (1 * this.props.waveAmplitude * this.props.depthFactor);
      }
      
      particle.cx += (targetPos.x - particle.cx) * this.props.lerpSpeed;
      particle.cy += (targetPos.y - particle.cy) * this.props.lerpSpeed;
      particle.cz += (targetPos.z - particle.cz) * this.props.lerpSpeed;
      
      this.dummy.position.set(particle.cx, particle.cy, particle.cz);
      this.dummy.lookAt(projectedTargetX, projectedTargetY, particle.cz);
      this.dummy.rotateX(Math.PI / 2);
      
      const currentDistToMouse = Math.sqrt(
        Math.pow(particle.cx - projectedTargetX, 2) + Math.pow(particle.cy - projectedTargetY, 2)
      );
      
      const distFromRing = Math.abs(currentDistToMouse - this.props.ringRadius);
      let scaleFactor = 1 - distFromRing / 10;
      scaleFactor = Math.max(0, Math.min(1, scaleFactor));
      
      const finalScale = scaleFactor * (0.8 + Math.sin(t * this.props.pulseSpeed) * 0.2 * this.props.particleVariance) * this.props.particleSize;
      
      if (finalScale > 0) {
        this.dummy.scale.set(finalScale, finalScale, finalScale);
      } else {
        this.dummy.scale.set(0.001, 0.001, 0.001); 
      }
      
      this.dummy.updateMatrix();
      this.instancedMesh.setMatrixAt(i, this.dummy.matrix);
    });
    
    this.instancedMesh.instanceMatrix.needsUpdate = true;
    this.renderer.render(this.scene, this.camera);
  }
  
  destroy() {
    window.removeEventListener('resize', this.onWindowResize);
    window.removeEventListener('pointermove', this.onPointerMove);
    cancelAnimationFrame(this.raf);
    this.canvas.remove();
    this.renderer.dispose();
  }
}
