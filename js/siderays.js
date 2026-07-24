class SideRays {
  constructor(container, options = {}) {
    this.container = container || document.body;
    
    this.props = {
      speed: 2.5,
      rayColor1: '#00ffcc', // Primary theme color
      rayColor2: '#5227FF', // Secondary theme color
      intensity: 2,
      spread: 2,
      origin: 'top-right',
      tilt: 0,
      saturation: 1.5,
      blend: 0.75,
      falloff: 1.6,
      opacity: 0.8,
      ...options
    };

    this.hexToRgb = hex => {
      const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return m ? [parseInt(m[1], 16) / 255, parseInt(m[2], 16) / 255, parseInt(m[3], 16) / 255] : [1, 1, 1];
    };

    this.originToFlip = origin => {
      switch (origin) {
        case 'top-left': return [1, 0];
        case 'bottom-right': return [0, 1];
        case 'bottom-left': return [1, 1];
        default: return [0, 0];
      }
    };

    this.init();
  }

  init() {
    this.canvasContainer = document.createElement('div');
    this.canvasContainer.style.position = 'fixed';
    this.canvasContainer.style.top = '0';
    this.canvasContainer.style.left = '0';
    this.canvasContainer.style.width = '100vw';
    this.canvasContainer.style.height = '100vh';
    this.canvasContainer.style.zIndex = '0'; // Behind the content
    this.canvasContainer.style.pointerEvents = 'none';
    this.canvasContainer.style.mixBlendMode = 'screen';
    this.container.appendChild(this.canvasContainer);

    this.renderer = new ogl.Renderer({
      dpr: Math.min(window.devicePixelRatio, 2),
      alpha: true
    });
    
    const gl = this.renderer.gl;
    gl.canvas.style.width = '100%';
    gl.canvas.style.height = '100%';
    this.canvasContainer.appendChild(gl.canvas);

    const vert = `
attribute vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}`;

    const frag = `precision highp float;

uniform float iTime;
uniform vec2 iResolution;
uniform float iSpeed;
uniform vec3 iRayColor1;
uniform vec3 iRayColor2;
uniform float iIntensity;
uniform float iSpread;
uniform float iFlipX;
uniform float iFlipY;
uniform float iTilt;
uniform float iSaturation;
uniform float iBlend;
uniform float iFalloff;
uniform float iOpacity;

float rayStrength(vec2 raySource, vec2 rayRefDirection, vec2 coord, float seedA, float seedB, float speed) {
  vec2 sourceToCoord = coord - raySource;
  float cosAngle = dot(normalize(sourceToCoord), rayRefDirection);
  return clamp(
    (0.45 + 0.15 * sin(cosAngle * seedA + iTime * speed)) +
    (0.3 + 0.2 * cos(-cosAngle * seedB + iTime * speed)),
    0.0, 1.0) *
    clamp((iResolution.x - length(sourceToCoord)) / iResolution.x, 0.5, 1.0);
}

void main() {
  vec2 fragCoord = gl_FragCoord.xy;
  if (iFlipX > 0.5) fragCoord.x = iResolution.x - fragCoord.x;
  if (iFlipY > 0.5) fragCoord.y = iResolution.y - fragCoord.y;

  vec2 coord = vec2(fragCoord.x, iResolution.y - fragCoord.y);
  vec2 rayPos = vec2(iResolution.x * 1.1, -0.5 * iResolution.y);

  float tiltRad = iTilt * 3.14159265 / 180.0;
  float cs = cos(tiltRad);
  float sn = sin(tiltRad);
  vec2 rel = coord - rayPos;
  vec2 tiltedCoord = vec2(rel.x * cs - rel.y * sn, rel.x * sn + rel.y * cs) + rayPos;

  float halfSpread = iSpread * 0.275;
  vec2 rayRefDir1 = normalize(vec2(cos(0.785398 + halfSpread), sin(0.785398 + halfSpread)));
  vec2 rayRefDir2 = normalize(vec2(cos(0.785398 - halfSpread), sin(0.785398 - halfSpread)));

  vec4 rays1 = vec4(iRayColor1, 1.0) * rayStrength(rayPos, rayRefDir1, tiltedCoord, 36.2214, 21.11349, iSpeed);
  vec4 rays2 = vec4(iRayColor2, 1.0) * rayStrength(rayPos, rayRefDir2, tiltedCoord, 22.3991, 18.0234, iSpeed * 0.2);

  vec4 color = rays1 * (1.0 - iBlend) * 0.9 + rays2 * iBlend * 0.9;

  float distanceToLight = length(fragCoord.xy - vec2(rayPos.x, iResolution.y - rayPos.y)) / iResolution.y;
  float brightness = iIntensity * 0.4 / pow(max(distanceToLight, 0.001), iFalloff);
  color.rgb *= brightness;

  float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
  color.rgb = mix(vec3(gray), color.rgb, iSaturation);

  color.a = max(color.r, max(color.g, color.b)) * iOpacity;
  gl_FragColor = color;
}`;

    const [flipX, flipY] = this.originToFlip(this.props.origin);
    this.uniforms = {
      iTime: { value: 0 },
      iResolution: { value: [1, 1] },
      iSpeed: { value: this.props.speed },
      iRayColor1: { value: this.hexToRgb(this.props.rayColor1) },
      iRayColor2: { value: this.hexToRgb(this.props.rayColor2) },
      iIntensity: { value: this.props.intensity },
      iSpread: { value: this.props.spread },
      iFlipX: { value: flipX },
      iFlipY: { value: flipY },
      iTilt: { value: this.props.tilt },
      iSaturation: { value: this.props.saturation },
      iBlend: { value: this.props.blend },
      iFalloff: { value: this.props.falloff },
      iOpacity: { value: this.props.opacity }
    };

    const geometry = new ogl.Triangle(gl);
    const program = new ogl.Program(gl, { vertex: vert, fragment: frag, uniforms: this.uniforms });
    this.mesh = new ogl.Mesh(gl, { geometry, program });

    this.updateSize = this.updateSize.bind(this);
    this.loop = this.loop.bind(this);

    window.addEventListener('resize', this.updateSize);
    this.updateSize();
    this.animationId = requestAnimationFrame(this.loop);
  }

  updateSize() {
    if (!this.canvasContainer || !this.renderer) return;
    this.renderer.dpr = Math.min(window.devicePixelRatio, 2);
    const w = this.canvasContainer.clientWidth;
    const h = this.canvasContainer.clientHeight;
    this.renderer.setSize(w, h);
    this.uniforms.iResolution.value = [w * this.renderer.dpr, h * this.renderer.dpr];
  }

  loop(t) {
    if (!this.renderer || !this.uniforms || !this.mesh) return;
    this.uniforms.iTime.value = t * 0.001;
    this.renderer.render({ scene: this.mesh });
    this.animationId = requestAnimationFrame(this.loop);
  }

  destroy() {
    if (this.animationId) cancelAnimationFrame(this.animationId);
    window.removeEventListener('resize', this.updateSize);
    if (this.renderer) {
      try {
        const loseCtx = this.renderer.gl.getExtension('WEBGL_lose_context');
        if (loseCtx) loseCtx.loseContext();
      } catch (e) {}
    }
    if (this.canvasContainer && this.canvasContainer.parentNode) {
      this.canvasContainer.parentNode.removeChild(this.canvasContainer);
    }
  }
}
