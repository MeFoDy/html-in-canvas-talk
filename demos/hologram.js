// Refract the DOM texture across the paper; pin the editable and clickable regions.
function ticketHologram(canvas, element) {
  const gl=canvas.getContext('webgl2',{alpha:false});
  if(typeof gl?.texElementSubImage2D!=='function'||typeof canvas.updateElementGeometry!=='function'){
    throw Error('WebGL HTML textures unavailable');
  }
  const program=gl.createProgram();
  const vertex=`#version 300 es
    out vec2 uv;
    void main(){
      vec2 p=vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
      uv=vec2(p.x,1.-p.y);gl_Position=vec4(p*2.-1.,0.,1.);
    }`;
  const fragment=`#version 300 es
    precision highp float;
    in vec2 uv;
    uniform sampler2D ticket;
    uniform float time;
    uniform vec2 paperSize;
    uniform vec4 controls;
    out vec4 color;

    void main(){
      vec2 p = uv * paperSize;
      vec2 edge = min(p, paperSize - p);
      vec2 outside = max(max(controls.xy - p, p - controls.zw), 0.0);
      float freePaper = smoothstep(4.0, 28.0, length(outside))
                      * smoothstep(1.0, 13.0, min(edge.x, edge.y));

      // Phase travels across the ticket. All distances are CSS pixels.
      float phase = p.x * 0.030 + p.y * 0.014 - time * 2.3;
      vec2 bend = vec2(2.8 * cos(phase), 6.5 * sin(phase)) * freePaper;
      vec3 ink = texture(ticket, uv + bend / paperSize).rgb;

      // A soft pearl reflection follows the slope; keep dark ink and controls intact.
      float paper = smoothstep(0.32, 0.76, dot(ink, vec3(.2126,.7152,.0722)));
      float crest = 0.5 + 0.5 * cos(phase);
      vec3 pearl = mix(vec3(.83,.78,.68), vec3(.78,.87,.85), crest);
      vec3 shaded = mix(ink, pearl, 0.24 * paper * freePaper);
      shaded += (crest - 0.5) * 0.065 * paper * freePaper;
      color = vec4(shaded, 1.0);
    }`;
  for(const [type,src] of [[gl.VERTEX_SHADER,vertex],[gl.FRAGMENT_SHADER,fragment]]){
    const shader=gl.createShader(type);gl.shaderSource(shader,src);gl.compileShader(shader);
    if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(shader));
    gl.attachShader(program,shader);gl.deleteShader(shader);
  }
  gl.linkProgram(program);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
  gl.useProgram(program);
  const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);
  for(const [key,value] of [[gl.TEXTURE_MIN_FILTER,gl.LINEAR],[gl.TEXTURE_MAG_FILTER,gl.LINEAR],
    [gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE],[gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE]])gl.texParameteri(gl.TEXTURE_2D,key,value);
  const time=gl.getUniformLocation(program,'time');
  const paperSize=gl.getUniformLocation(program,'paperSize');
  const controls=gl.getUniformLocation(program,'controls');
  const fields=element.querySelector('.ticket-fields');
  const actions=element.querySelector('.ticket-actions');
  const identity=new DOMMatrix();
  let lastWidth=0,lastHeight=0;
  return {
    updateTexture(){
      const size=canvas.getElementImageDefaultSize(element),width=Math.ceil(size.width),height=Math.ceil(size.height);
      if(width!==lastWidth||height!==lastHeight){
        gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA8,width,height,0,gl.RGBA,gl.UNSIGNED_BYTE,null);
        lastWidth=width;lastHeight=height;
      }
      gl.texElementSubImage2D(gl.TEXTURE_2D,0,0,0,element);
      if(gl.getError()!==gl.NO_ERROR)throw Error('DOM texture upload failed');
      canvas.updateElementGeometry(element,{canvasTransform:identity});
      const paper=element.getBoundingClientRect();
      const top=fields.getBoundingClientRect();
      const bottom=actions.getBoundingClientRect();
      gl.uniform2f(paperSize,paper.width,paper.height);
      gl.uniform4f(controls,Math.min(top.left,bottom.left)-paper.left,top.top-paper.top,
                   Math.max(top.right,bottom.right)-paper.left,bottom.bottom-paper.top);
    },
    draw(phase){
      gl.viewport(0,0,canvas.width,canvas.height);
      gl.uniform1f(time,phase);
      gl.drawArrays(gl.TRIANGLES,0,3);
    },
    dispose(){gl.deleteTexture(texture);gl.deleteProgram(program);gl.getExtension('WEBGL_lose_context')?.loseContext();}
  };
}
