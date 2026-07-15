import React, { useEffect, useRef } from 'react';

/* ─── GLSL Shaders ───────────────────────────────────────────────────────────── */
const VERT = `
  attribute vec2 a_pos;
  void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

/* A flowing multi-layer plasma / aurora shader */
const FRAG = `
  precision highp float;
  uniform float u_time;
  uniform vec2  u_res;
  uniform float u_dark; /* 1.0 = dark, 0.0 = light */

  /* Smooth noise */
  vec2 hash2(vec2 p) {
    p = vec2(dot(p,vec2(127.1,311.7)), dot(p,vec2(269.5,183.3)));
    return fract(sin(p)*18.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f*f*(3.0-2.0*f);
    float a = dot(hash2(i            ), f            );
    float b = dot(hash2(i+vec2(1,0)  ), f-vec2(1,0)  );
    float c = dot(hash2(i+vec2(0,1)  ), f-vec2(0,1)  );
    float d = dot(hash2(i+vec2(1,1)  ), f-vec2(1,1)  );
    return mix(mix(a,b,u.x), mix(c,d,u.x), u.y) * 0.5 + 0.5;
  }

  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 5; i++) {
      v += a * noise(p);
      p  = p * 2.1 + vec2(1.7, 9.2);
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / u_res;
    float t  = u_time * 0.14;

    /* Warped coordinates — aurora drift */
    vec2 q = vec2(fbm(uv + t*0.3), fbm(uv + vec2(1.0)));
    vec2 r = vec2(fbm(uv + 2.0*q + vec2(1.7, 9.2) + t*0.25),
                  fbm(uv + 2.0*q + vec2(8.3, 2.8) + t*0.18));
    float f = fbm(uv + 2.8*r);

    /* DARK MODE palette: deep navy + cyan + violet */
    vec3 darkCol = mix(
      mix(vec3(0.01, 0.04, 0.12), vec3(0.0,  0.38, 0.65), clamp(f*2.0,0.0,1.0)),
      mix(vec3(0.12, 0.0,  0.28), vec3(0.0,  0.75, 0.88), clamp(f*f*3.5,0.0,1.0)),
      clamp(f*f*f*4.5, 0.0, 1.0)
    );

    /* LIGHT MODE palette: soft white-blue with lavender */
    vec3 lightCol = mix(
      mix(vec3(0.93, 0.96, 1.00), vec3(0.78, 0.89, 1.00), clamp(f*1.5,0.0,1.0)),
      mix(vec3(0.86, 0.78, 1.00), vec3(0.82, 0.94, 1.00), clamp(f*f*2.5,0.0,1.0)),
      clamp(f*f*3.5, 0.0, 1.0)
    );

    vec3 col = mix(lightCol, darkCol, u_dark);

    /* Vignette */
    vec2 vig = uv * (1.0 - uv);
    float vf = pow(vig.x * vig.y * 18.0, u_dark * 0.3 + 0.15);
    col *= clamp(vf, 0.0, 1.0);

    gl_FragColor = vec4(col, 1.0);
  }
`;

/* ─── Component ─────────────────────────────────────────────────────────────── */
export const AuroraBackground = ({ isDark = true, className = '' }) => {
  const canvasRef = useRef(null);
  const rafRef    = useRef(null);
  const glRef     = useRef(null);
  const locRef    = useRef({});

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', { antialias: false, alpha: false });
    if (!gl) return;
    glRef.current = gl;

    /* compile shader */
    const compile = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    /* quad */
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'a_pos');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    /* uniforms */
    locRef.current = {
      time:  gl.getUniformLocation(prog, 'u_time'),
      res:   gl.getUniformLocation(prog, 'u_res'),
      dark:  gl.getUniformLocation(prog, 'u_dark'),
    };

    /* resize */
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio, 1.5);
      canvas.width  = Math.floor(canvas.offsetWidth  * dpr);
      canvas.height = Math.floor(canvas.offsetHeight * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    /* loop */
    const start = performance.now();
    const tick = () => {
      const t = (performance.now() - start) / 1000;
      const { time, res, dark } = locRef.current;
      gl.uniform1f(time, t);
      gl.uniform2f(res, canvas.width, canvas.height);
      gl.uniform1f(dark, isDark ? 1.0 : 0.0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      rafRef.current = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      gl.deleteProgram(prog);
    };
  }, [isDark]);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-full block ${className}`}
      style={{ display: 'block' }}
    />
  );
};

export default AuroraBackground;
