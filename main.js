'use strict';

let gl;                         // The webgl context.
let surface, sphere, line;                    // A surface model
let shProgram;                  // A shader program
let spaceball;                  // A SimpleRotator object that lets the user rotate the view by mouse.

function deg2rad(angle) {
    return angle * Math.PI / 180;
}


// Constructor
function Model(name) {
    this.name = name;
    this.iVertexBuffer = gl.createBuffer();
    this.iNBuffer = gl.createBuffer();
    this.count = 0;

    this.BufferData = function (vertices, ns) {

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STREAM_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iNBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(ns), gl.STREAM_DRAW);

        this.count = vertices.length / 3;
    }

    this.Draw = function () {

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribVertex);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iNBuffer);
        gl.vertexAttribPointer(shProgram.iAttribNormal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribNormal);

        gl.drawArrays(gl.TRIANGLES, 0, this.count);
    }
    this.DrawLine = function () {

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribVertex);

        gl.drawArrays(gl.LINE_STRIP, 0, this.count);
    }
}


// Constructor
function ShaderProgram(name, program) {

    this.name = name;
    this.prog = program;

    // Location of the attribute variable in the shader program.
    this.iAttribVertex = -1;
    // Location of the uniform specifying a color for the primitive.
    this.iColor = -1;
    // Location of the uniform matrix representing the combined transformation.
    this.iModelViewProjectionMatrix = -1;

    this.Use = function () {
        gl.useProgram(this.prog);
    }
}


/* Draws a colored cube, along with a set of coordinate axes.
 * (Note that the use of the above drawPrimitive function is not an efficient
 * way to draw with WebGL.  Here, the geometry is so simple that it doesn't matter.)
 */
function draw() {
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    /* Set the values of the projection transformation */
    let projection = m4.perspective(Math.PI / 8, 1, 8, 12);

    /* Get the view matrix from the SimpleRotator object.*/
    let modelView = spaceball.getViewMatrix();

    let rotateToPointZero = m4.axisRotation([0.707, 0.707, 0], 0.7);
    let translateToPointZero = m4.translation(0, 0, -10);

    let matAccum0 = m4.multiply(rotateToPointZero, modelView);
    let matAccum1 = m4.multiply(translateToPointZero, matAccum0);

    /* Multiply the projection matrix times the modelview matrix to give the
       combined transformation matrix, and send that to the shader program. */
    let modelViewProjection = m4.multiply(projection, matAccum1);

    gl.uniformMatrix4fv(shProgram.iModelViewProjectionMatrix, false, modelViewProjection);

    /* Draw the six faces of a cube, with different colors. */
    gl.uniform4fv(shProgram.iColor, [1, 1, 0, 1]);
    gl.uniform1f(shProgram.iLimit, cos(parseFloat(document.getElementById('limit').value)));
    gl.uniform1f(shProgram.iLimit, parseFloat(document.getElementById('limit').value));

    let normalMatrix = m4.identity();
    m4.inverse(modelView, normalMatrix);
    m4.transpose(normalMatrix, normalMatrix);

    gl.uniformMatrix4fv(shProgram.iNormalMatrix, false, normalMatrix);

    surface.Draw();
    let dx = parseFloat(document.getElementById('dx').value)
    let dy = parseFloat(document.getElementById('dy').value)
    let dz = parseFloat(document.getElementById('dz').value)
    let x = parseFloat(document.getElementById('x').value)
    let y = parseFloat(document.getElementById('y').value)
    let z = parseFloat(document.getElementById('z').value)
    gl.uniform3fv(shProgram.iLightDir, [dx,dy,dz]);
    gl.uniform3fv(shProgram.iLightPos, [x, y, z]);
    line.BufferData([x+dx,y+dy,z+dz,x,y,z])
    gl.uniform4fv(shProgram.iColor, [1, 1, 1, 1]);
    line.DrawLine();
   
    modelViewProjection = m4.multiply(modelViewProjection, m4.translation(x, y, z))
    gl.uniformMatrix4fv(shProgram.iModelViewProjectionMatrix, false, modelViewProjection);
    
    sphere.Draw();
    
}

function update() {
    surface.BufferData(CreateSurfaceData(), CreateNormalData());
    draw()
}

function draww(){
    draw()
    window.requestAnimationFrame(draww)
}

function CreateSurfaceData() {
    let vertexList = [];
    let minLimitV = -parseFloat(document.getElementById('low').value)
    let maxLimitV = 1
    let numberOfSteps = parseInt(document.getElementById('num').value)
    let vStep = (maxLimitV - minLimitV) / numberOfSteps
    let uStep = 0.1
    for (let v = minLimitV; v < maxLimitV; v += vStep) {
        for (let u = 0; u < 2 * PI; u += uStep) {
            vertexList.push(...dingDongSurface(u, v))
            vertexList.push(...dingDongSurface(u + uStep, v))
            vertexList.push(...dingDongSurface(u, v + vStep))
            vertexList.push(...dingDongSurface(u, v + vStep))
            vertexList.push(...dingDongSurface(u + uStep, v))
            vertexList.push(...dingDongSurface(u + uStep, v + vStep))
        }
    }

    return vertexList;
}
function CreateNormalData() {
    let vertexList = [];
    let minLimitV = -parseFloat(document.getElementById('low').value)
    let maxLimitV = 1
    let numberOfSteps = parseInt(document.getElementById('num').value)
    let vStep = (maxLimitV - minLimitV) / numberOfSteps
    let uStep = 0.1
    for (let v = minLimitV; v < maxLimitV; v += vStep) {
        for (let u = 0; u < 2 * PI; u += uStep) {
            vertexList.push(...CreateFacetAvarageNormal(u, v))
            vertexList.push(...CreateFacetAvarageNormal(u + uStep, v))
            vertexList.push(...CreateFacetAvarageNormal(u, v + vStep))
            vertexList.push(...CreateFacetAvarageNormal(u, v + vStep))
            vertexList.push(...CreateFacetAvarageNormal(u + uStep, v))
            vertexList.push(...CreateFacetAvarageNormal(u + uStep, v + vStep))
        }
    }

    return vertexList;
}

function CreateSphereSurfaceData() {
    let vertexList = [];

    let u = 0,
        t = 0;
    while (u < Math.PI * 2) {
        while (t < Math.PI) {
            let v = sphereSurface(u, t);
            let w = sphereSurface(u + 0.1, t);
            let wv = sphereSurface(u, t + 0.1);
            let ww = sphereSurface(u + 0.1, t + 0.1);
            vertexList.push(v.x, v.y, v.z);
            vertexList.push(w.x, w.y, w.z);
            vertexList.push(wv.x, wv.y, wv.z);
            vertexList.push(wv.x, wv.y, wv.z);
            vertexList.push(w.x, w.y, w.z);
            vertexList.push(ww.x, ww.y, ww.z);
            t += 0.1;
        }
        t = 0;
        u += 0.1;
    }
    return vertexList
}

const radius = 0.1;
function sphereSurface(long, lat) {
    return {
        x: radius * Math.cos(long) * Math.sin(lat),
        y: radius * Math.sin(long) * Math.sin(lat),
        z: radius * Math.cos(lat)
    }
}

function CreateFacetAvarageNormal(u, v) {
    let minLimitV = -parseFloat(document.getElementById('low').value)
    let maxLimitV = 1
    let numberOfSteps = parseInt(document.getElementById('num').value)
    let vStep = (maxLimitV - minLimitV) / numberOfSteps
    let uStep = 0.1
    let v0 = dingDongSurface(u, v)
    let v1 = dingDongSurface(u + uStep, v)
    let v2 = dingDongSurface(u, v + vStep)
    let v3 = dingDongSurface(u - uStep, v + vStep)
    let v4 = dingDongSurface(u - uStep, v)
    let v5 = dingDongSurface(u - uStep, v - vStep)
    let v6 = dingDongSurface(u, v - vStep)
    v0 = m4.normalize(v0)
    v1 = m4.normalize(v1)
    v2 = m4.normalize(v2)
    v3 = m4.normalize(v3)
    v4 = m4.normalize(v4)
    v5 = m4.normalize(v5)
    v6 = m4.normalize(v6)
    let v01 = m4.subtractVectors(v1, v0)
    let v02 = m4.subtractVectors(v2, v0)
    let v03 = m4.subtractVectors(v3, v0)
    let v04 = m4.subtractVectors(v4, v0)
    let v05 = m4.subtractVectors(v5, v0)
    let v06 = m4.subtractVectors(v6, v0)
    let n1 = m4.normalize(m4.cross(v01, v02))
    let n2 = m4.normalize(m4.cross(v02, v03))
    let n3 = m4.normalize(m4.cross(v03, v04))
    let n4 = m4.normalize(m4.cross(v04, v05))
    let n5 = m4.normalize(m4.cross(v05, v06))
    let n6 = m4.normalize(m4.cross(v06, v01))
    let n = [(n1[0] + n2[0] + n3[0] + n4[0] + n5[0] + n6[0]) / 6.0,
    (n1[1] + n2[1] + n3[1] + n4[1] + n5[1] + n6[1]) / 6.0,
    (n1[2] + n2[2] + n3[2] + n4[2] + n5[2] + n6[2]) / 6.0]
    n = m4.normalize(n);
    return n;
}


/* Initialize the WebGL context. Called from init() */
function initGL() {
    let prog = createProgram(gl, vertexShaderSource, fragmentShaderSource);

    shProgram = new ShaderProgram('Basic', prog);
    shProgram.Use();

    shProgram.iAttribVertex = gl.getAttribLocation(prog, "vertex");
    shProgram.iAttribNormal = gl.getAttribLocation(prog, "normal");
    shProgram.iModelViewProjectionMatrix = gl.getUniformLocation(prog, "ModelViewProjectionMatrix");
    shProgram.iNormalMatrix = gl.getUniformLocation(prog, "NormalMatrix");
    shProgram.iColor = gl.getUniformLocation(prog, "color");
    shProgram.iLightDir = gl.getUniformLocation(prog, "lightDir");
    shProgram.iLightPos = gl.getUniformLocation(prog, "lightPos");
    shProgram.iLimit = gl.getUniformLocation(prog, "limit");

    surface = new Model('Surface');
    surface.BufferData(CreateSurfaceData(), CreateNormalData());
    sphere = new Model('Sphere')
    sphere.BufferData(CreateSphereSurfaceData(), CreateSphereSurfaceData())
    line = new Model('Line')
    line.BufferData([0,0,0,1,1,1])

    gl.enable(gl.DEPTH_TEST);
}


/* Creates a program for use in the WebGL context gl, and returns the
 * identifier for that program.  If an error occurs while compiling or
 * linking the program, an exception of type Error is thrown.  The error
 * string contains the compilation or linking error.  If no error occurs,
 * the program identifier is the return value of the function.
 * The second and third parameters are strings that contain the
 * source code for the vertex shader and for the fragment shader.
 */
function createProgram(gl, vShader, fShader) {
    let vsh = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vsh, vShader);
    gl.compileShader(vsh);
    if (!gl.getShaderParameter(vsh, gl.COMPILE_STATUS)) {
        throw new Error("Error in vertex shader:  " + gl.getShaderInfoLog(vsh));
    }
    let fsh = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fsh, fShader);
    gl.compileShader(fsh);
    if (!gl.getShaderParameter(fsh, gl.COMPILE_STATUS)) {
        throw new Error("Error in fragment shader:  " + gl.getShaderInfoLog(fsh));
    }
    let prog = gl.createProgram();
    gl.attachShader(prog, vsh);
    gl.attachShader(prog, fsh);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        throw new Error("Link error in program:  " + gl.getProgramInfoLog(prog));
    }
    return prog;
}

const { cos, sin, sqrt, PI } = Math

function r(v) {
    return v * sqrt(1 - v)
}
function x(u, v) {
    return r(v) * cos(u)
}
function y(u, v) {
    return r(v) * sin(u)
}
function z(v) {
    return v;
}

function dingDongSurface(u, v) {
    return [x(u, v), y(u, v), z(v)]
}


/**
 * initialization function that will be called when the page has loaded
 */
function init() {
    let canvas;
    try {
        canvas = document.getElementById("webglcanvas");
        gl = canvas.getContext("webgl");
        if (!gl) {
            throw "Browser does not support WebGL";
        }
    }
    catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not get a WebGL graphics context.</p>";
        return;
    }
    try {
        initGL();  // initialize the WebGL graphics context
    }
    catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not initialize the WebGL graphics context: " + e + "</p>";
        return;
    }

    spaceball = new TrackballRotator(canvas, draw, 0);

    draww();
}
