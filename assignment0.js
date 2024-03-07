let GL, vao, program1, program2;
let currColor = [0, 0, 0, 0];
let currTriangles = 1;
let maxTriangles = 1;
let useJSON = false;

// Helper function to update HTML elements
function updateHTMLElement(id, value) {
    document.getElementById(id).innerHTML = value;
}

window.updateTriangles = function() {
    currTriangles = parseInt(document.querySelector("#triangles").value);
    updateHTMLElement('t', currTriangles);
}

window.updateColor = function() {
    const r = parseInt(document.querySelector("#sliderR").value);
    const g = parseInt(document.querySelector("#sliderG").value);
    const b = parseInt(document.querySelector("#sliderB").value);
    const a = parseInt(document.querySelector("#sliderA").value);
    currColor = [r / 255.0, g / 255.0, b / 255.0, a / 255.0];

    updateHTMLElement('r', r);
    updateHTMLElement('g', g);
    updateHTMLElement('b', b);
    updateHTMLElement('a', a);
}

window.checkBox = function() {
    let elements = document.getElementsByClassName("slider");
    Array.from(elements).forEach((element) => {
        element.disabled = !element.disabled;
    });

    useJSON = document.getElementById("checkbox").checked;
}

// Function to read file content
function readFile(inputFile) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsText(inputFile);
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
    });
}

// Refactored uploadFile function
async function uploadFile(event) {
    try {
        const fileContent = await readFile(event.target.files[0]);
        const json = JSON.parse(fileContent);
        // Remaining file handling logic
    } catch (error) {
        console.error("Error reading file: ", error);
    }
}

async function createPrograms() { 
    let response = await fetch('vertex.glsl');
    const vertSource = await response.text();
    const vertex_shader = createAndCompileShader(vertSource, GL.VERTEX_SHADER);

    response = await fetch('fragment1.glsl');
    let fragSource = await response.text();
    let fragment_shader = createAndCompileShader(fragSource, GL.FRAGMENT_SHADER);
    program1 = createShaderProgram(vertex_shader, fragment_shader);

    response = await fetch('fragment2.glsl');
    fragSource = await response.text();
    fragment_shader = createAndCompileShader(fragSource, GL.FRAGMENT_SHADER);
    program2 = createShaderProgram(vertex_shader, fragment_shader);
}

function createAndCompileShader(source, type) {
    const shader = GL.createShader(type);
    GL.shaderSource(shader, source);
    GL.compileShader(shader);
    if (!GL.getShaderParameter(shader, GL.COMPILE_STATUS)) {
        console.error('Shader compile error: ', GL.getShaderInfoLog(shader));
    }
    return shader;
};

function createShaderProgram(vertexShader, fragmentShader) {
    const program = GL.createProgram();
    GL.attachShader(program, vertexShader);
    GL.attachShader(program, fragmentShader);
    GL.linkProgram(program);
    if (!GL.getProgramParameter(program, GL.LINK_STATUS)) {
        console.error('Program linking error: ', GL.getProgramInfoLog(program));
    }
    return program;
}

function createBuffer(vertices) {
    const buffer = GL.createBuffer();
    GL.bindBuffer(GL.ARRAY_BUFFER, buffer);
    GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(vertices), GL.STATIC_DRAW);
    return buffer;
}

function createVAO(posAttribLoc, posBuffer, colAttribLoc, colBuffer) {
    const vao = GL.createVertexArray();
    GL.bindVertexArray(vao);
    GL.enableVertexAttribArray(posAttribLoc);
    GL.enableVertexAttribArray(colAttribLoc);
    GL.bindBuffer(GL.ARRAY_BUFFER, posBuffer);
    GL.vertexAttribPointer(posAttribLoc, 3, GL.FLOAT, false, 0, 0);
    GL.bindBuffer(GL.ARRAY_BUFFER, colBuffer);
    GL.vertexAttribPointer(colAttribLoc, 4, GL.FLOAT, false, 0, 0);
    return vao;
}

function setProgram1Uniform() {
    const uniformLoc = GL.getUniformLocation(program1, 'uColor');
    GL.uniform4fv(uniformLoc, new Float32Array(currColor));
}

function draw() {
    GL.bindVertexArray(vao);
    if (useJSON) {
        GL.useProgram(program2);
    } else {
        GL.useProgram(program1);
        setProgram1Uniform();
    }
    GL.clearColor(0.8, 0.8, 0.8, 1.0);
    GL.clear(GL.COLOR_BUFFER_BIT);
    GL.viewport(0, 0, GL.canvas.width, GL.canvas.height);
    GL.drawArrays(GL.TRIANGLES, 0, 3 * currTriangles);
    window.requestAnimationFrame(draw);
};

async function initialize() {
    const canvas = document.querySelector("#GLcanvas");
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    GL = canvas.getContext("webgl2");
    GL.enable(GL.BLEND);
    GL.blendFunc(GL.SRC_ALPHA, GL.ONE_MINUS_SRC_ALPHA);
    await createPrograms();
    draw();
};
 
window.onload = initialize;
