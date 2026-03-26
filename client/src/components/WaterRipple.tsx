import { useEffect, useRef, useCallback } from "react";

interface WaterRippleProps {
  /** Controls ripple amplitude and refraction power (0-1) */
  strength?: number;
  /** Controls the smoothness of the waves (0-1) */
  viscosity?: number;
  /** How quickly ripples dissipate (0-1) */
  decay?: number;
  /** Amount of chromatic dispersion in refraction (0-1) */
  chromaticDispersion?: number;
  /** Intensity of simulated light and shadows (0-1) */
  lightIntensity?: number;
  /** Color of the light */
  lightColor?: string;
  /** Speed of ripple motion (0-1) */
  speed?: number;
  /** Background color */
  bgColor?: string;
  /** Text to render */
  text?: string;
  /** Text color */
  textColor?: string;
  /** Mouse rotation intensity (0-1, where 0.2 = 20%) */
  rotationIntensity?: number;
}

const WaterRipple: React.FC<WaterRippleProps> = ({
  strength = 0.8,
  viscosity = 0.7,
  decay = 0.8,
  chromaticDispersion = 0.12,
  lightIntensity = 0.85,
  lightColor = "#F9E95C",
  speed = 0.8,
  bgColor = "#FF5458",
  text = "arynox.llm",
  textColor = "#F9E95C",
  rotationIntensity = 0.2,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Draw the scene (background + text) onto an offscreen canvas
  const drawContentTexture = useCallback(
    (width: number, height: number): HTMLCanvasElement => {
      const offscreen = document.createElement("canvas");
      offscreen.width = width;
      offscreen.height = height;
      const ctx = offscreen.getContext("2d")!;

      // Background
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, width, height);

      // Responsive font size
      let fontSize: number;
      if (width <= 575) {
        fontSize = 74;
      } else if (width <= 991) {
        fontSize = 161;
      } else {
        fontSize = 277;
      }

      // Draw text — Gabarito 800 is loaded via Google Fonts in index.html
      ctx.fillStyle = textColor;
      ctx.font = `800 ${fontSize}px 'Gabarito', sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, width * 0.5, height * 0.252);

      return offscreen;
    },
    [bgColor, textColor, text],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const canvasEl = canvas;
    let isDisposed = false;

    const gl = canvasEl.getContext("webgl", {
      alpha: false,
      premultipliedAlpha: false,
      antialias: false,
    });
    if (!gl) return;

    gl.getExtension("OES_texture_float");
    gl.getExtension("OES_texture_float_linear");

    const SIM_W = 512;
    const SIM_H = 512;
    const parsedLight = hexToVec3(lightColor);

    // --- Shared vertex shader ---
    const quadVS = `
      attribute vec2 a_position;
      varying vec2 vUv;
      void main() {
        vUv = a_position * 0.5 + 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    // --- Wave simulation shader ---
    const simFS = `
      precision highp float;
      uniform sampler2D u_current;
      uniform sampler2D u_previous;
      uniform vec2 u_mouse;
      uniform float u_mouseRadius;
      uniform float u_mouseStrength;
      uniform float u_damping;
      uniform vec2 u_texelSize;
      varying vec2 vUv;

      void main() {
        float curr = texture2D(u_current, vUv).r;
        float prev = texture2D(u_previous, vUv).r;

        float left  = texture2D(u_current, vUv + vec2(-u_texelSize.x, 0.0)).r;
        float right = texture2D(u_current, vUv + vec2( u_texelSize.x, 0.0)).r;
        float up    = texture2D(u_current, vUv + vec2(0.0,  u_texelSize.y)).r;
        float down  = texture2D(u_current, vUv + vec2(0.0, -u_texelSize.y)).r;

        float laplacian = left + right + up + down - 4.0 * curr;
        float next = 2.0 * curr - prev + 0.25 * laplacian;
        next *= u_damping;

        float d = distance(vUv, u_mouse);
        if (d < u_mouseRadius) {
          float falloff = 1.0 - (d / u_mouseRadius);
          falloff = falloff * falloff;
          next += falloff * u_mouseStrength;
        }

        gl_FragColor = vec4(next, 0.0, 0.0, 1.0);
      }
    `;

    // --- Display shader with 3D rotation + subtle Unicorn Studio-style ripple ---
    const displayFS = `
      precision highp float;
      uniform sampler2D u_heightmap;
      uniform sampler2D u_content;
      uniform vec2 u_texelSize;
      uniform vec3 u_lightColor;
      uniform float u_chromDisp;
      uniform float u_intensity;
      uniform float u_refractionStrength;
      uniform vec2 u_mouseNorm;       // mouse position normalized -0.5 to 0.5
      uniform float u_rotIntensity;   // rotation intensity (0.2 = 20%)
      varying vec2 vUv;

      void main() {
        float h = texture2D(u_heightmap, vUv).r;

        // --- Surface normal from heightmap ---
        float hL = texture2D(u_heightmap, vUv + vec2(-u_texelSize.x, 0.0)).r;
        float hR = texture2D(u_heightmap, vUv + vec2( u_texelSize.x, 0.0)).r;
        float hU = texture2D(u_heightmap, vUv + vec2(0.0,  u_texelSize.y)).r;
        float hD = texture2D(u_heightmap, vUv + vec2(0.0, -u_texelSize.y)).r;

        float dx = (hR - hL) * 0.5;
        float dy = (hU - hD) * 0.5;
        vec3 normal = normalize(vec3(-dx * 8.0, -dy * 8.0, 1.0));

        // --- Refraction: offset UVs based on the surface normal ---
        vec2 distortion = normal.xy * u_refractionStrength;

        // --- 3D perspective rotation based on mouse ---
        // Convert UV to centered coordinates
        vec2 centered = vUv - 0.5;

        // Mouse-driven rotation angles (subtle)
        float angleY = u_mouseNorm.x * u_rotIntensity * 0.8;  // rotateY
        float angleX = -u_mouseNorm.y * u_rotIntensity * 0.8;  // rotateX

        // Apply simple perspective projection
        float perspDist = 2.5;  // perspective distance (higher = subtler)
        float pz = 1.0 + centered.x * sin(angleY) / perspDist + centered.y * sin(angleX) / perspDist;
        vec2 rotatedUV = vec2(
          0.5 + (centered.x * cos(angleY)) / pz,
          0.5 + (centered.y * cos(angleX)) / pz
        );

        // Combine rotation + water distortion
        vec2 finalUV = rotatedUV + distortion;

        // --- Chromatic dispersion ---
        float chromOff = u_chromDisp * 0.3;
        vec2 uvR = finalUV + distortion * chromOff;
        vec2 uvG = finalUV;
        vec2 uvB = finalUV - distortion * chromOff;

        // Sample content texture (flip Y for canvas->WebGL coordinate difference)
        float colR = texture2D(u_content, vec2(clamp(uvR.x, 0.0, 1.0), 1.0 - clamp(uvR.y, 0.0, 1.0))).r;
        float colG = texture2D(u_content, vec2(clamp(uvG.x, 0.0, 1.0), 1.0 - clamp(uvG.y, 0.0, 1.0))).g;
        float colB = texture2D(u_content, vec2(clamp(uvB.x, 0.0, 1.0), 1.0 - clamp(uvB.y, 0.0, 1.0))).b;
        vec3 col = vec3(colR, colG, colB);

        // --- Lighting: Unicorn Studio style (bright highlights, no dark shadows) ---
        vec3 lightDir = normalize(vec3(-0.3, 0.6, 1.0));

        // Specular only (crisp white highlights on crests — like light catching water)
        vec3 viewDir = vec3(0.0, 0.0, 1.0);
        vec3 halfDir = normalize(lightDir + viewDir);
        float spec = pow(max(dot(normal, halfDir), 0.0), 100.0);
        float restSpec = pow(max(dot(vec3(0.0, 0.0, 1.0), halfDir), 0.0), 100.0);
        spec = max(spec - restSpec, 0.0);

        // Add ONLY bright highlights, never darken
        col += spec * u_lightColor * u_intensity * 1.2;

        gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
      }
    `;

    // --- Compile ---
    function createShader(type: number, source: string): WebGLShader | null {
      const s = gl!.createShader(type);
      if (!s) return null;
      gl!.shaderSource(s, source);
      gl!.compileShader(s);
      if (!gl!.getShaderParameter(s, gl!.COMPILE_STATUS)) {
        console.error("Shader error:", gl!.getShaderInfoLog(s));
        gl!.deleteShader(s);
        return null;
      }
      return s;
    }

    function createProgram(vs: string, fs: string): WebGLProgram | null {
      const v = createShader(gl!.VERTEX_SHADER, vs);
      const f = createShader(gl!.FRAGMENT_SHADER, fs);
      if (!v || !f) return null;
      const p = gl!.createProgram()!;
      gl!.attachShader(p, v);
      gl!.attachShader(p, f);
      gl!.linkProgram(p);
      if (!gl!.getProgramParameter(p, gl!.LINK_STATUS)) {
        console.error("Link error:", gl!.getProgramInfoLog(p));
        return null;
      }
      return p;
    }

    const simProg = createProgram(quadVS, simFS);
    const dispProg = createProgram(quadVS, displayFS);
    if (!simProg || !dispProg) return;

    // --- Fullscreen quad ---
    const quadBuf = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );

    // --- FBOs ---
    function createFBO() {
      const tex = gl!.createTexture()!;
      gl!.bindTexture(gl!.TEXTURE_2D, tex);
      gl!.texImage2D(
        gl!.TEXTURE_2D,
        0,
        gl!.RGBA,
        SIM_W,
        SIM_H,
        0,
        gl!.RGBA,
        gl!.FLOAT,
        null,
      );
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MIN_FILTER, gl!.LINEAR);
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MAG_FILTER, gl!.LINEAR);
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_S, gl!.CLAMP_TO_EDGE);
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_T, gl!.CLAMP_TO_EDGE);
      const fb = gl!.createFramebuffer()!;
      gl!.bindFramebuffer(gl!.FRAMEBUFFER, fb);
      gl!.framebufferTexture2D(
        gl!.FRAMEBUFFER,
        gl!.COLOR_ATTACHMENT0,
        gl!.TEXTURE_2D,
        tex,
        0,
      );
      gl!.bindFramebuffer(gl!.FRAMEBUFFER, null);
      return { fb, tex };
    }

    const fbos = [createFBO(), createFBO(), createFBO()];
    let curIdx = 0;

    // --- Content texture ---
    const contentTex = gl.createTexture()!;
    function updateContentTexture() {
      if (isDisposed) return;
      const c = drawContentTexture(canvasEl.width, canvasEl.height);
      gl!.bindTexture(gl!.TEXTURE_2D, contentTex);
      gl!.texImage2D(
        gl!.TEXTURE_2D,
        0,
        gl!.RGBA,
        gl!.RGBA,
        gl!.UNSIGNED_BYTE,
        c,
      );
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MIN_FILTER, gl!.LINEAR);
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MAG_FILTER, gl!.LINEAR);
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_S, gl!.CLAMP_TO_EDGE);
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_T, gl!.CLAMP_TO_EDGE);
    }

    // --- Uniform locations ---
    const sLoc = {
      aPos: gl.getAttribLocation(simProg, "a_position"),
      current: gl.getUniformLocation(simProg, "u_current"),
      previous: gl.getUniformLocation(simProg, "u_previous"),
      mouse: gl.getUniformLocation(simProg, "u_mouse"),
      mouseRadius: gl.getUniformLocation(simProg, "u_mouseRadius"),
      mouseStrength: gl.getUniformLocation(simProg, "u_mouseStrength"),
      damping: gl.getUniformLocation(simProg, "u_damping"),
      texelSize: gl.getUniformLocation(simProg, "u_texelSize"),
    };
    const dLoc = {
      aPos: gl.getAttribLocation(dispProg, "a_position"),
      heightmap: gl.getUniformLocation(dispProg, "u_heightmap"),
      content: gl.getUniformLocation(dispProg, "u_content"),
      texelSize: gl.getUniformLocation(dispProg, "u_texelSize"),
      lightColor: gl.getUniformLocation(dispProg, "u_lightColor"),
      chromDisp: gl.getUniformLocation(dispProg, "u_chromDisp"),
      intensity: gl.getUniformLocation(dispProg, "u_intensity"),
      refractionStrength: gl.getUniformLocation(
        dispProg,
        "u_refractionStrength",
      ),
      mouseNorm: gl.getUniformLocation(dispProg, "u_mouseNorm"),
      rotIntensity: gl.getUniformLocation(dispProg, "u_rotIntensity"),
    };

    // --- Mouse ---
    let mx = 0.5,
      my = 0.5,
      pmx = 0.5,
      pmy = 0.5;
    // Mouse position for 3D rotation (normalized -0.5 to 0.5, smoothed)
    let rotMx = 0,
      rotMy = 0;
    let moving = false;
    let moveTimer: ReturnType<typeof setTimeout>;

    const onMouseMove = (e: MouseEvent) => {
      const r = canvasEl.getBoundingClientRect();
      mx = (e.clientX - r.left) / r.width;
      my = 1.0 - (e.clientY - r.top) / r.height;
      // Rotation uses window-relative position
      rotMx = e.clientX / window.innerWidth - 0.5;
      rotMy = e.clientY / window.innerHeight - 0.5;
      moving = true;
      clearTimeout(moveTimer);
      moveTimer = setTimeout(() => {
        moving = false;
      }, 80);
    };

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const t = e.touches[0];
      const r = canvasEl.getBoundingClientRect();
      mx = (t.clientX - r.left) / r.width;
      my = 1.0 - (t.clientY - r.top) / r.height;
      rotMx = t.clientX / window.innerWidth - 0.5;
      rotMy = t.clientY / window.innerHeight - 0.5;
      moving = true;
      clearTimeout(moveTimer);
      moveTimer = setTimeout(() => {
        moving = false;
      }, 80);
    };

    window.addEventListener("mousemove", onMouseMove);
    canvasEl.addEventListener("touchmove", onTouchMove, { passive: false });

    // --- Resize ---
    const resize = () => {
      canvasEl.width = window.innerWidth;
      canvasEl.height = window.innerHeight;
      updateContentTexture();
    };
    resize();
    window.addEventListener("resize", resize);

    // Re-draw once fonts are ready to ensure 'Gabarito' is properly rendered on canvas
    document.fonts.ready.then(() => {
      updateContentTexture();
    });

    // --- Params ---
    const damping = 0.96 + viscosity * 0.035;
    const mouseRadius = 0.05 + strength * 0.05;
    const mouseStr = strength * 0.5;
    const refractionStr = 0.02 + strength * 0.03;
    const stepsPerFrame = Math.max(1, Math.round(speed * 3));

    // Smoothed rotation values
    let smoothRotX = 0,
      smoothRotY = 0;

    // --- Render ---
    let animId: number;
    const render = () => {
      if (isDisposed) return;
      animId = requestAnimationFrame(render);

      // Smooth the rotation (lerp toward target)
      smoothRotX += (rotMx - smoothRotX) * 0.08;
      smoothRotY += (rotMy - smoothRotY) * 0.08;

      const vx = mx - pmx;
      const vy = my - pmy;
      const vel = Math.sqrt(vx * vx + vy * vy);
      pmx = mx;
      pmy = my;

      // Simulation passes
      for (let s = 0; s < stepsPerFrame; s++) {
        const prevIdx = (curIdx + fbos.length - 1) % fbos.length;
        const nextIdx = (curIdx + 1) % fbos.length;

        gl.bindFramebuffer(gl.FRAMEBUFFER, fbos[nextIdx].fb);
        gl.viewport(0, 0, SIM_W, SIM_H);
        gl.useProgram(simProg);

        gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
        gl.enableVertexAttribArray(sLoc.aPos);
        gl.vertexAttribPointer(sLoc.aPos, 2, gl.FLOAT, false, 0, 0);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, fbos[curIdx].tex);
        gl.uniform1i(sLoc.current, 0);

        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, fbos[prevIdx].tex);
        gl.uniform1i(sLoc.previous, 1);

        gl.uniform2f(sLoc.mouse, mx, my);
        gl.uniform1f(sLoc.mouseRadius, moving ? mouseRadius : 0.0);
        gl.uniform1f(sLoc.mouseStrength, mouseStr * Math.min(vel * 20.0, 1.0));
        gl.uniform1f(sLoc.damping, damping);
        gl.uniform2f(sLoc.texelSize, 1.0 / SIM_W, 1.0 / SIM_H);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
        curIdx = nextIdx;
      }

      // Display pass
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, canvasEl.width, canvasEl.height);
      gl.useProgram(dispProg);

      gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
      gl.enableVertexAttribArray(dLoc.aPos);
      gl.vertexAttribPointer(dLoc.aPos, 2, gl.FLOAT, false, 0, 0);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, fbos[curIdx].tex);
      gl.uniform1i(dLoc.heightmap, 0);

      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, contentTex);
      gl.uniform1i(dLoc.content, 1);

      gl.uniform2f(dLoc.texelSize, 1.0 / SIM_W, 1.0 / SIM_H);
      gl.uniform3f(
        dLoc.lightColor,
        parsedLight.r,
        parsedLight.g,
        parsedLight.b,
      );
      gl.uniform1f(dLoc.chromDisp, chromaticDispersion);
      gl.uniform1f(dLoc.intensity, lightIntensity);
      gl.uniform1f(dLoc.refractionStrength, refractionStr);
      gl.uniform2f(dLoc.mouseNorm, smoothRotX, smoothRotY);
      gl.uniform1f(dLoc.rotIntensity, rotationIntensity);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
    };

    render();

    return () => {
      isDisposed = true;
      cancelAnimationFrame(animId);
      clearTimeout(moveTimer);
      window.removeEventListener("mousemove", onMouseMove);
      canvasEl.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("resize", resize);
      gl.deleteBuffer(quadBuf);
      gl.deleteTexture(contentTex);
      fbos.forEach((f) => {
        gl.deleteTexture(f.tex);
        gl.deleteFramebuffer(f.fb);
      });
      gl.deleteProgram(simProg);
      gl.deleteProgram(dispProg);
    };
  }, [
    strength,
    viscosity,
    decay,
    chromaticDispersion,
    lightIntensity,
    lightColor,
    speed,
    bgColor,
    drawContentTexture,
    rotationIntensity,
  ]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ display: "block", zIndex: 0 }}
    />
  );
};

function hexToVec3(hex: string) {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.substring(0, 2), 16) / 255,
    g: parseInt(h.substring(2, 4), 16) / 255,
    b: parseInt(h.substring(4, 6), 16) / 255,
  };
}

export default WaterRipple;
