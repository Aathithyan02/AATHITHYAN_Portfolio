class ShapeGrid {
  constructor(container, options = {}) {
    this.container = container || document.body;
    this.options = {
      direction: options.direction || 'right',
      speed: options.speed !== undefined ? options.speed : 1,
      borderColor: options.borderColor || 'rgba(0, 255, 204, 0.03)',
      squareSize: options.squareSize || 40,
      hoverFillColor: options.hoverFillColor || 'rgba(0, 255, 204, 0.15)',
      shape: options.shape || 'square',
      hoverTrailAmount: options.hoverTrailAmount !== undefined ? options.hoverTrailAmount : 4,
      ...options
    };

    this.canvas = document.createElement('canvas');
    this.canvas.className = 'shapegrid-canvas';
    Object.assign(this.canvas.style, {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      zIndex: '-2',
      pointerEvents: 'none',
      display: 'block'
    });

    this.container.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');

    this.numSquaresX = 0;
    this.numSquaresY = 0;
    this.gridOffset = { x: 0, y: 0 };
    this.hoveredSquare = null;
    this.trailCells = [];
    this.cellOpacities = new Map();
    this.requestRef = null;

    this.init();
  }

  init() {
    this.isHex = this.options.shape === 'hexagon';
    this.isTri = this.options.shape === 'triangle';
    this.hexHoriz = this.options.squareSize * 1.5;
    this.hexVert = this.options.squareSize * Math.sqrt(3);

    this.resizeCanvas = this.resizeCanvas.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseLeave = this.handleMouseLeave.bind(this);
    this.updateAnimation = this.updateAnimation.bind(this);

    window.addEventListener('resize', this.resizeCanvas);
    window.addEventListener('mousemove', this.handleMouseMove);
    window.addEventListener('mouseleave', this.handleMouseLeave);
    document.addEventListener('mouseleave', this.handleMouseLeave);

    this.resizeCanvas();
    this.requestRef = requestAnimationFrame(this.updateAnimation);
  }

  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.numSquaresX = Math.ceil(this.canvas.width / this.options.squareSize) + 1;
    this.numSquaresY = Math.ceil(this.canvas.height / this.options.squareSize) + 1;
  }

  drawHex(cx, cy, size) {
    this.ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i;
      const vx = cx + size * Math.cos(angle);
      const vy = cy + size * Math.sin(angle);
      if (i === 0) this.ctx.moveTo(vx, vy);
      else this.ctx.lineTo(vx, vy);
    }
    this.ctx.closePath();
  }

  drawCircle(cx, cy, size) {
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, size / 2, 0, Math.PI * 2);
    this.ctx.closePath();
  }

  drawTriangle(cx, cy, size, flip) {
    this.ctx.beginPath();
    if (flip) {
      this.ctx.moveTo(cx, cy + size / 2);
      this.ctx.lineTo(cx + size / 2, cy - size / 2);
      this.ctx.lineTo(cx - size / 2, cy - size / 2);
    } else {
      this.ctx.moveTo(cx, cy - size / 2);
      this.ctx.lineTo(cx + size / 2, cy + size / 2);
      this.ctx.lineTo(cx - size / 2, cy + size / 2);
    }
    this.ctx.closePath();
  }

  drawGrid() {
    const ctx = this.ctx;
    const canvas = this.canvas;
    const squareSize = this.options.squareSize;
    const hoverFillColor = this.options.hoverFillColor;
    const borderColor = this.options.borderColor;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (this.isHex) {
      const colShift = Math.floor(this.gridOffset.x / this.hexHoriz);
      const offsetX = ((this.gridOffset.x % this.hexHoriz) + this.hexHoriz) % this.hexHoriz;
      const offsetY = ((this.gridOffset.y % this.hexVert) + this.hexVert) % this.hexVert;

      const cols = Math.ceil(canvas.width / this.hexHoriz) + 3;
      const rows = Math.ceil(canvas.height / this.hexVert) + 3;

      for (let col = -2; col < cols; col++) {
        for (let row = -2; row < rows; row++) {
          const cx = col * this.hexHoriz + offsetX;
          const cy = row * this.hexVert + ((col + colShift) % 2 !== 0 ? this.hexVert / 2 : 0) + offsetY;

          const cellKey = `${col},${row}`;
          const alpha = this.cellOpacities.get(cellKey);
          if (alpha) {
            ctx.globalAlpha = alpha;
            this.drawHex(cx, cy, squareSize);
            ctx.fillStyle = hoverFillColor;
            ctx.fill();
            ctx.globalAlpha = 1;
          }

          this.drawHex(cx, cy, squareSize);
          ctx.strokeStyle = borderColor;
          ctx.stroke();
        }
      }
    } else if (this.isTri) {
      const halfW = squareSize / 2;
      const colShift = Math.floor(this.gridOffset.x / halfW);
      const rowShift = Math.floor(this.gridOffset.y / squareSize);
      const offsetX = ((this.gridOffset.x % halfW) + halfW) % halfW;
      const offsetY = ((this.gridOffset.y % squareSize) + squareSize) % squareSize;

      const cols = Math.ceil(canvas.width / halfW) + 4;
      const rows = Math.ceil(canvas.height / squareSize) + 4;

      for (let col = -2; col < cols; col++) {
        for (let row = -2; row < rows; row++) {
          const cx = col * halfW + offsetX;
          const cy = row * squareSize + squareSize / 2 + offsetY;
          const flip = ((col + colShift + row + rowShift) % 2 + 2) % 2 !== 0;

          const cellKey = `${col},${row}`;
          const alpha = this.cellOpacities.get(cellKey);
          if (alpha) {
            ctx.globalAlpha = alpha;
            this.drawTriangle(cx, cy, squareSize, flip);
            ctx.fillStyle = hoverFillColor;
            ctx.fill();
            ctx.globalAlpha = 1;
          }

          this.drawTriangle(cx, cy, squareSize, flip);
          ctx.strokeStyle = borderColor;
          ctx.stroke();
        }
      }
    } else if (this.options.shape === 'circle') {
      const offsetX = ((this.gridOffset.x % squareSize) + squareSize) % squareSize;
      const offsetY = ((this.gridOffset.y % squareSize) + squareSize) % squareSize;

      const cols = Math.ceil(canvas.width / squareSize) + 3;
      const rows = Math.ceil(canvas.height / squareSize) + 3;

      for (let col = -2; col < cols; col++) {
        for (let row = -2; row < rows; row++) {
          const cx = col * squareSize + squareSize / 2 + offsetX;
          const cy = row * squareSize + squareSize / 2 + offsetY;

          const cellKey = `${col},${row}`;
          const alpha = this.cellOpacities.get(cellKey);
          if (alpha) {
            ctx.globalAlpha = alpha;
            this.drawCircle(cx, cy, squareSize);
            ctx.fillStyle = hoverFillColor;
            ctx.fill();
            ctx.globalAlpha = 1;
          }

          this.drawCircle(cx, cy, squareSize);
          ctx.strokeStyle = borderColor;
          ctx.stroke();
        }
      }
    } else {
      const offsetX = ((this.gridOffset.x % squareSize) + squareSize) % squareSize;
      const offsetY = ((this.gridOffset.y % squareSize) + squareSize) % squareSize;

      const cols = Math.ceil(canvas.width / squareSize) + 3;
      const rows = Math.ceil(canvas.height / squareSize) + 3;

      for (let col = -2; col < cols; col++) {
        for (let row = -2; row < rows; row++) {
          const sx = col * squareSize + offsetX;
          const sy = row * squareSize + offsetY;

          const cellKey = `${col},${row}`;
          const alpha = this.cellOpacities.get(cellKey);
          if (alpha) {
            ctx.globalAlpha = alpha;
            ctx.fillStyle = hoverFillColor;
            ctx.fillRect(sx, sy, squareSize, squareSize);
            ctx.globalAlpha = 1;
          }

          ctx.strokeStyle = borderColor;
          ctx.strokeRect(sx, sy, squareSize, squareSize);
        }
      }
    }

    // Radial gradient overlay
    const gradient = ctx.createRadialGradient(
      canvas.width / 2,
      canvas.height / 2,
      0,
      canvas.width / 2,
      canvas.height / 2,
      Math.sqrt(canvas.width ** 2 + canvas.height ** 2) / 2
    );
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.85)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  updateAnimation() {
    const speed = this.options.speed;
    const effectiveSpeed = Math.max(speed, 0.1);
    const squareSize = this.options.squareSize;
    const wrapX = this.isHex ? this.hexHoriz * 2 : squareSize;
    const wrapY = this.isHex ? this.hexVert : this.isTri ? squareSize * 2 : squareSize;

    switch (this.options.direction) {
      case 'right':
        this.gridOffset.x = (this.gridOffset.x - effectiveSpeed + wrapX) % wrapX;
        break;
      case 'left':
        this.gridOffset.x = (this.gridOffset.x + effectiveSpeed + wrapX) % wrapX;
        break;
      case 'up':
        this.gridOffset.y = (this.gridOffset.y + effectiveSpeed + wrapY) % wrapY;
        break;
      case 'down':
        this.gridOffset.y = (this.gridOffset.y - effectiveSpeed + wrapY) % wrapY;
        break;
      case 'diagonal':
        this.gridOffset.x = (this.gridOffset.x - effectiveSpeed + wrapX) % wrapX;
        this.gridOffset.y = (this.gridOffset.y - effectiveSpeed + wrapY) % wrapY;
        break;
      default:
        break;
    }

    this.updateCellOpacities();
    this.drawGrid();
    this.requestRef = requestAnimationFrame(this.updateAnimation);
  }

  updateCellOpacities() {
    const targets = new Map();

    if (this.hoveredSquare) {
      targets.set(`${this.hoveredSquare.x},${this.hoveredSquare.y}`, 1);
    }

    const hoverTrailAmount = this.options.hoverTrailAmount;
    if (hoverTrailAmount > 0) {
      for (let i = 0; i < this.trailCells.length; i++) {
        const t = this.trailCells[i];
        const key = `${t.x},${t.y}`;
        if (!targets.has(key)) {
          targets.set(key, (this.trailCells.length - i) / (this.trailCells.length + 1));
        }
      }
    }

    for (const [key] of targets) {
      if (!this.cellOpacities.has(key)) {
        this.cellOpacities.set(key, 0);
      }
    }

    for (const [key, opacity] of this.cellOpacities) {
      const target = targets.get(key) || 0;
      const next = opacity + (target - opacity) * 0.15;
      if (next < 0.005) {
        this.cellOpacities.delete(key);
      } else {
        this.cellOpacities.set(key, next);
      }
    }
  }

  handleMouseMove(event) {
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    const squareSize = this.options.squareSize;
    const hoverTrailAmount = this.options.hoverTrailAmount;

    if (this.isHex) {
      const colShift = Math.floor(this.gridOffset.x / this.hexHoriz);
      const offsetX = ((this.gridOffset.x % this.hexHoriz) + this.hexHoriz) % this.hexHoriz;
      const offsetY = ((this.gridOffset.y % this.hexVert) + this.hexVert) % this.hexVert;
      const adjustedX = mouseX - offsetX;
      const adjustedY = mouseY - offsetY;

      const col = Math.round(adjustedX / this.hexHoriz);
      const rowOffset = (col + colShift) % 2 !== 0 ? this.hexVert / 2 : 0;
      const row = Math.round((adjustedY - rowOffset) / this.hexVert);

      if (
        !this.hoveredSquare ||
        this.hoveredSquare.x !== col ||
        this.hoveredSquare.y !== row
      ) {
        if (this.hoveredSquare && hoverTrailAmount > 0) {
          this.trailCells.unshift({ ...this.hoveredSquare });
          if (this.trailCells.length > hoverTrailAmount) this.trailCells.length = hoverTrailAmount;
        }
        this.hoveredSquare = { x: col, y: row };
      }
    } else if (this.isTri) {
      const halfW = squareSize / 2;
      const offsetX = ((this.gridOffset.x % halfW) + halfW) % halfW;
      const offsetY = ((this.gridOffset.y % squareSize) + squareSize) % squareSize;

      const adjustedX = mouseX - offsetX;
      const adjustedY = mouseY - offsetY;

      const col = Math.round(adjustedX / halfW);
      const row = Math.floor(adjustedY / squareSize);

      if (
        !this.hoveredSquare ||
        this.hoveredSquare.x !== col ||
        this.hoveredSquare.y !== row
      ) {
        if (this.hoveredSquare && hoverTrailAmount > 0) {
          this.trailCells.unshift({ ...this.hoveredSquare });
          if (this.trailCells.length > hoverTrailAmount) this.trailCells.length = hoverTrailAmount;
        }
        this.hoveredSquare = { x: col, y: row };
      }
    } else if (this.options.shape === 'circle') {
      const offsetX = ((this.gridOffset.x % squareSize) + squareSize) % squareSize;
      const offsetY = ((this.gridOffset.y % squareSize) + squareSize) % squareSize;

      const adjustedX = mouseX - offsetX;
      const adjustedY = mouseY - offsetY;

      const col = Math.round(adjustedX / squareSize);
      const row = Math.round(adjustedY / squareSize);

      if (
        !this.hoveredSquare ||
        this.hoveredSquare.x !== col ||
        this.hoveredSquare.y !== row
      ) {
        if (this.hoveredSquare && hoverTrailAmount > 0) {
          this.trailCells.unshift({ ...this.hoveredSquare });
          if (this.trailCells.length > hoverTrailAmount) this.trailCells.length = hoverTrailAmount;
        }
        this.hoveredSquare = { x: col, y: row };
      }
    } else {
      const offsetX = ((this.gridOffset.x % squareSize) + squareSize) % squareSize;
      const offsetY = ((this.gridOffset.y % squareSize) + squareSize) % squareSize;

      const adjustedX = mouseX - offsetX;
      const adjustedY = mouseY - offsetY;

      const col = Math.floor(adjustedX / squareSize);
      const row = Math.floor(adjustedY / squareSize);

      if (
        !this.hoveredSquare ||
        this.hoveredSquare.x !== col ||
        this.hoveredSquare.y !== row
      ) {
        if (this.hoveredSquare && hoverTrailAmount > 0) {
          this.trailCells.unshift({ ...this.hoveredSquare });
          if (this.trailCells.length > hoverTrailAmount) this.trailCells.length = hoverTrailAmount;
        }
        this.hoveredSquare = { x: col, y: row };
      }
    }
  }

  handleMouseLeave() {
    const hoverTrailAmount = this.options.hoverTrailAmount;
    if (this.hoveredSquare && hoverTrailAmount > 0) {
      this.trailCells.unshift({ ...this.hoveredSquare });
      if (this.trailCells.length > hoverTrailAmount) this.trailCells.length = hoverTrailAmount;
    }
    this.hoveredSquare = null;
  }

  destroy() {
    window.removeEventListener('resize', this.resizeCanvas);
    window.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('mouseleave', this.handleMouseLeave);
    document.removeEventListener('mouseleave', this.handleMouseLeave);
    cancelAnimationFrame(this.requestRef);
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
  }
}
