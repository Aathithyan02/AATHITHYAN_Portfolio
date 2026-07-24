class CursorGrid {
  constructor(container, options = {}) {
    this.container = container || document.body;
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'cursor-grid-canvas';
    this.canvas.style.position = 'fixed';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.width = '100vw';
    this.canvas.style.height = '100vh';
    this.canvas.style.zIndex = '9999';
    this.canvas.style.pointerEvents = 'none';
    this.container.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');

    this.props = {
      cellSize: 70,
      color: '#00ffcc',
      radius: 140,
      falloff: 'smooth',
      holdTime: 400,
      fadeDuration: 800,
      lineWidth: 1.2,
      maxOpacity: 1,
      fillOpacity: 0,
      gridOpacity: 0,
      cellRadius: 0,
      clickPulse: true,
      pulseSpeed: 600,
      ...options
    };

    this.FALLOFF_CURVES = {
      linear: t => t,
      smooth: t => t * t * (3 - 2 * t),
      sharp: t => t * t * t
    };

    this.hexToRgb = hex => {
      const h = hex.replace('#', '');
      const v = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
      const num = parseInt(v.slice(0, 6), 16);
      return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
    };

    this.cols = 0;
    this.rows = 0;
    this.offX = 0;
    this.offY = 0;
    this.alphas = new Float32Array(0);
    this.touched = new Float64Array(0);
    this.w = 0;
    this.h = 0;
    this.pulses = [];
    this.raf = 0;
    this.running = false;
    this.lastFrame = 0;

    this.rebuild = this.rebuild.bind(this);
    this.draw = this.draw.bind(this);
    this.wake = this.wake.bind(this);
    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerDown = this.onPointerDown.bind(this);

    this.init();
  }

  init() {
    this.rebuild();
    window.addEventListener('resize', this.rebuild);
    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerdown', this.onPointerDown);
    this.wake();
  }

  destroy() {
    window.removeEventListener('resize', this.rebuild);
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerdown', this.onPointerDown);
    cancelAnimationFrame(this.raf);
    this.canvas.remove();
  }

  rebuild() {
    const p = this.props;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = window.innerWidth;
    this.h = window.innerHeight;
    this.canvas.width = Math.max(1, Math.round(this.w * dpr));
    this.canvas.height = Math.max(1, Math.round(this.h * dpr));
    this.canvas.style.width = `${this.w}px`;
    this.canvas.style.height = `${this.h}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.cols = Math.ceil(this.w / p.cellSize) + 1;
    this.rows = Math.ceil(this.h / p.cellSize) + 1;
    this.offX = (this.w - this.cols * p.cellSize) / 2;
    this.offY = (this.h - this.rows * p.cellSize) / 2;
    this.alphas = new Float32Array(this.cols * this.rows);
    this.touched = new Float64Array(this.cols * this.rows);
  }

  cellCenter(i) {
    const p = this.props;
    const cx = this.offX + (i % this.cols) * p.cellSize + p.cellSize / 2;
    const cy = this.offY + Math.floor(i / this.cols) * p.cellSize + p.cellSize / 2;
    return [cx, cy];
  }

  energize(x, y, boost) {
    const p = this.props;
    const r = Math.max(p.radius, 1);
    const ease = this.FALLOFF_CURVES[p.falloff] ?? this.FALLOFF_CURVES.linear;
    const now = performance.now();
    const minCol = Math.max(0, Math.floor((x - r - this.offX) / p.cellSize));
    const maxCol = Math.min(this.cols - 1, Math.floor((x + r - this.offX) / p.cellSize));
    const minRow = Math.max(0, Math.floor((y - r - this.offY) / p.cellSize));
    const maxRow = Math.min(this.rows - 1, Math.floor((y + r - this.offY) / p.cellSize));
    for (let cRow = minRow; cRow <= maxRow; cRow++) {
      for (let cCol = minCol; cCol <= maxCol; cCol++) {
        const i = cRow * this.cols + cCol;
        const [cx, cy] = this.cellCenter(i);
        const dist = Math.hypot(cx - x, cy - y);
        if (dist > r) continue;
        const level = ease(1 - dist / r) * p.maxOpacity * (boost ?? 1);
        if (level > this.alphas[i]) {
          this.alphas[i] = level;
          this.touched[i] = now;
        } else if (level > 0) {
          this.touched[i] = now;
        }
      }
    }
  }

  draw(now) {
    const p = this.props;
    const dt = Math.min(now - this.lastFrame, 50);
    this.lastFrame = now;
    this.ctx.clearRect(0, 0, this.w, this.h);
    const [cr, cg, cb] = this.hexToRgb(p.color);

    if (p.gridOpacity > 0) {
      this.ctx.strokeStyle = `rgba(${cr}, ${cg}, ${cb}, ${p.gridOpacity})`;
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      for (let cCol = 0; cCol <= this.cols; cCol++) {
        const x = Math.round(this.offX + cCol * p.cellSize) + 0.5;
        this.ctx.moveTo(x, 0);
        this.ctx.lineTo(x, this.h);
      }
      for (let cRow = 0; cRow <= this.rows; cRow++) {
        const y = Math.round(this.offY + cRow * p.cellSize) + 0.5;
        this.ctx.moveTo(0, y);
        this.ctx.lineTo(this.w, y);
      }
      this.ctx.stroke();
    }

    for (let pi = this.pulses.length - 1; pi >= 0; pi--) {
      const pulse = this.pulses[pi];
      const age = (now - pulse.t0) / 1000;
      const ringR = age * p.pulseSpeed;
      if (ringR > Math.hypot(this.w, this.h)) {
        this.pulses.splice(pi, 1);
        continue;
      }
      const band = p.cellSize;
      const minCol = Math.max(0, Math.floor((pulse.x - ringR - band - this.offX) / p.cellSize));
      const maxCol = Math.min(this.cols - 1, Math.floor((pulse.x + ringR + band - this.offX) / p.cellSize));
      const minRow = Math.max(0, Math.floor((pulse.y - ringR - band - this.offY) / p.cellSize));
      const maxRow = Math.min(this.rows - 1, Math.floor((pulse.y + ringR + band - this.offY) / p.cellSize));
      for (let cRow = minRow; cRow <= maxRow; cRow++) {
        for (let cCol = minCol; cCol <= maxCol; cCol++) {
          const i = cRow * this.cols + cCol;
          const [cx, cy] = this.cellCenter(i);
          const dist = Math.hypot(cx - pulse.x, cy - pulse.y);
          if (Math.abs(dist - ringR) < band / 2 && p.maxOpacity > this.alphas[i]) {
            this.alphas[i] = p.maxOpacity;
            this.touched[i] = now;
          }
        }
      }
    }

    let anyVisible = this.pulses.length > 0;
    const fadeStep = dt / Math.max(p.fadeDuration, 16);
    const half = p.cellSize / 2;

    for (let i = 0; i < this.alphas.length; i++) {
      let a = this.alphas[i];
      if (a <= 0) continue;
      if (now - this.touched[i] > p.holdTime) {
        a = Math.max(0, a - fadeStep);
        this.alphas[i] = a;
        if (a <= 0) continue;
      }
      anyVisible = true;

      const [cx, cy] = this.cellCenter(i);
      const gradient = this.ctx.createRadialGradient(cx, cy, half * 0.1, cx, cy, p.cellSize);
      gradient.addColorStop(0, `rgba(${cr}, ${cg}, ${cb}, ${a})`);
      gradient.addColorStop(1, `rgba(${cr}, ${cg}, ${cb}, 0)`);

      const x = cx - half + 0.5;
      const y = cy - half + 0.5;
      const s = p.cellSize - 1;

      this.ctx.beginPath();
      if (p.cellRadius > 0) {
        if (this.ctx.roundRect) {
            this.ctx.roundRect(x, y, s, s, p.cellRadius);
        } else {
            this.ctx.rect(x, y, s, s);
        }
      } else {
        this.ctx.rect(x, y, s, s);
      }
      if (p.fillOpacity > 0) {
        this.ctx.fillStyle = `rgba(${cr}, ${cg}, ${cb}, ${a * p.fillOpacity})`;
        this.ctx.fill();
      }
      this.ctx.strokeStyle = gradient;
      this.ctx.lineWidth = p.lineWidth;
      this.ctx.stroke();
    }

    if (anyVisible) {
      this.raf = requestAnimationFrame(this.draw);
    } else {
      this.running = false;
      if (p.gridOpacity <= 0) this.ctx.clearRect(0, 0, this.w, this.h);
    }
  }

  wake() {
    if (this.running) return;
    this.running = true;
    this.lastFrame = performance.now();
    this.raf = requestAnimationFrame(this.draw);
  }

  onPointerMove(e) {
    this.energize(e.clientX, e.clientY);
    this.wake();
  }

  onPointerDown(e) {
    if (!this.props.clickPulse) return;
    this.pulses.push({ x: e.clientX, y: e.clientY, t0: performance.now() });
    this.wake();
  }
}
