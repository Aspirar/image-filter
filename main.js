const picker = document.getElementById('imagepicker');
const preview = document.getElementById('preview');

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('webgl2');

picker.addEventListener('change', (event) => {
  preview.onload = () => {
    canvas.width = preview.width;
    canvas.height = preview.height;
    draw(ctx);
  };
  preview.src = URL.createObjectURL(event.target.files[0]);
});

function getVShaderSrc() {
  return `#version 300 es
    in vec4 aPos;
    in vec2 aTex;
    out vec2 vTex;
    out vec4 vPos;

    void main() {
      gl_Position = aPos;
      vTex = aTex;
      vPos = aPos;
    }
  `;
}

function getFShaderSrc() {
  return `#version 300 es
    precision highp float;

    uniform sampler2D uImage;
    in vec2 vTex;
    in vec4 vPos;
    out vec4 pixel;

    void main() {
      vec2 uv = vPos.xy;
      uv = fract(uv * 25.) * 2. - 1.;
      float d = length(uv);

      vec2 tex = floor(vTex * 50.) / 50.;
      vec4 color = texture(uImage, tex);

      vec4 base = vec4(vec3(0.), 1.);
      pixel = mix(base, color, smoothstep(1.21, 1.20, d));
    }
  `;
}

function createShader(gl, type, src) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, src);
  gl.compileShader(shader);

  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    return shader;
  }

  console.log(gl.getShaderInfoLog(shader));
  gl.deleteShader(shader);
}

function createProgram(gl) {
  const vShader = createShader(gl, gl.VERTEX_SHADER, getVShaderSrc());
  const fShader = createShader(gl, gl.FRAGMENT_SHADER, getFShaderSrc());
  const program = gl.createProgram();
  gl.attachShader(program, vShader);
  gl.attachShader(program, fShader);
  gl.linkProgram(program);

  if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
    return program;
  }

  console.log(gl.getProgramInfoLog(program));
  gl.deleteProgram(program);
}

function getLocs(gl, program) {
  return {
    aPos: gl.getAttribLocation(program, 'aPos'),
    aTex: gl.getAttribLocation(program, 'aTex'),
    uImage: gl.getUniformLocation(program, 'uImage'),
  };
}

function setVertexArray(gl) {
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
}

function bufferAttrib(gl, loc, data) {
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(
    loc,
    2,
    gl.FLOAT,
    false,
    0,
    0,
  );
}

function bufferPosAttrib(gl, locs) {
  bufferAttrib(gl, locs.aPos, [
    -1, -1,
    -1, 1,
    1, -1,
    1, -1,
    -1, 1,
    1, 1,
  ]);
}

function bufferTexAttrib(gl, locs) {
  bufferAttrib(gl, locs.aTex, [
    0, 1,
    0, 0,
    1, 1,
    1, 1,
    0, 0,
    1, 0,
  ]);
}

function bufferImage(gl) {
  const texture = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0 + 0);
  gl.bindTexture(gl.TEXTURE_2D, texture);

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    preview,
  )
}

function initCanvas(gl) {
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);
}

function draw(gl) {
  const program = createProgram(gl);
  const locs = getLocs(gl, program);
  setVertexArray(gl);
  bufferPosAttrib(gl, locs);
  bufferTexAttrib(gl, locs);
  bufferImage(gl);
  initCanvas(gl);
  gl.useProgram(program);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
}
