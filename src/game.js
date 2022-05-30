import { adjustVelocity } from './collision.js';
import { vec2 } from 'gl-matrix';

export class Game {

    constructor(gl, sr, sp, rm, canvas) {
        this.gl = gl;
        this.sr = sr;
        this.sp = sp;
        this.rm = rm;
        this.canvas = canvas;
    }

    init(particles) {
        for (var x = 0; x <= window.width; x += window.particleSize) {
            particles.set(x * 1000, {
                x: x, y: 0, type: 'Border',
                matrix: false, lastMove: 0
            });
            particles.set(x * 1000 + window.height, {
                x: x, y: window.height, type: 'Border',
                matrix: false, lastMove: 0
            });
        }
        for (var y = 0; y <= window.height; y += window.particleSize) {
            particles.set(y, {
                x: 0, y: y, type: 'Border',
                matrix: false, lastMove: 0
            });
            particles.set(window.width * 1000 + y, {
                x: window.width, y: y, type: 'Border',
                matrix: false, lastMove: 0
            });
        }
    }

    update(dt, particles, avgDt) {
        let stall = new Set();
        particles.forEach(function(value, key) {
            if (!stall.has(key)) {
                var pdx = 0; var pdy = 0; var rand = 0;

                switch (value.type) {
                    case 'Border': // border
                        break;

                    case 'Sand': // particle
                        pdy = window.particleSize;
                        break;

                    case 'Stone':
                        pdy = window.particleSize;
                        break;

                    case 'Water': // water
                        rand = Math.floor(Math.random() * 5);
                        if (rand === 4) pdx = window.particleSize;
                        else if (rand === 0) pdx = -1 * window.particleSize;
                        else pdx = 0;
                        pdy = window.particleSize;
                        break;

                    case 'Lava': // water
                        rand = Math.floor(Math.random() * 18);
                        if (rand === 17) pdx = window.particleSize;
                        else if (rand === 0) pdx = -1 * window.particleSize;
                        else pdx = 0;
                        pdy = window.particleSize;
                        break;
                    
                    case 'Steam':
                        rand = Math.floor(Math.random() * 8);
                        if (rand === 7) pdx = window.particleSize;
                        else if (rand === 0) pdx = -1 * window.particleSize;
                        else pdx = 0;
                        pdy = -1 * window.particleSize;
                        break;
                    default:
                }

                var speed = window.targetFPS / (1 / avgDt);
                if (speed < 1) {
                    speed *= (value.lastMove + 1);
                }
                pdx *= speed;
                if (pdx > window.particleSize * 2) { pdx = window.particleSize * 2 }
                else if (pdx < -1 * window.particleSize * 2) { pdx = -1 * window.particleSize * 2 }
                pdy *= speed;

                var dx = (pdx !== 0) ? adjustVelocity(dx, pdx, particles, key, true) : 0;
                var dy = (pdy !== 0) ? adjustVelocity(dy, pdy, particles, key, false) : 0;
                if (dy !== 0 || dx !== 0) {
                    if (
                        !particles.has(((value.x + dx) * 1000) + value.y + dy)
                    ) {
                        if (value.y + dy > window.height || value.y < 0 ||
                            value.x + dx > window.width  || value.x < 0) {
                            particles.delete(key);
                        } else {
                            particles.set(((value.x + dx) * 1000) + value.y + dy, {
                                x: value.x + dx,
                                y: value.y + dy,
                                type: value.type,
                                matrix: false,
                                lastMove: 0
                            });
                            stall.add(((value.x + dx) * 1000) + value.y + dy);
                            particles.delete(key);
                        }
                    }
                    value.lastMove = 0;
                } else {
                    var leftType = (particles.has(key - (1000 * window.particleSize))) ? particles.get(key - (1000 * window.particleSize)).type : false;
                    var aboveType = (particles.has(key - window.particleSize)) ? particles.get(key - window.particleSize).type : false;
                    var rightType = (particles.has(key + (1000 * window.particleSize))) ? particles.get(key + (1000 * window.particleSize)).type : false;
                    var belowType = (particles.has(key + window.particleSize)) ? particles.get(key + window.particleSize).type : false;
                    if (value.type === 'Sand') {
                        if (belowType === 'Water') {
                            particles.set(key, {
                                x: value.x,
                                y: value.y,
                                type: 'Water',
                                matrix: false,
                                lastMove: 0
                            });
                            particles.set(key + window.particleSize, {
                                x: value.x,
                                y: value.y + window.particleSize,
                                type: 'Sand',
                                matrix: false,
                                lastMove: 0
                            });
                        }
                    } else if (value.type === 'Stone') {
                        if (
                            leftType === 'Lava' ||
                            aboveType === 'Lava' ||
                            rightType === 'Lava' ||
                            belowType === 'Lava'
                        ) {
                            if (Math.floor(Math.random() * 50) === 49) {
                                particles.set(key, {
                                    x: value.x,
                                    y: value.y,
                                    type: 'Lava',
                                    matrix: false,
                                    lastMove: 0
                                });
                            } else if (belowType === 'Lava') {
                                particles.set(key, {
                                    x: value.x,
                                    y: value.y,
                                    type: 'Lava',
                                    matrix: false,
                                    lastMove: 0
                                });
                                particles.set(key + window.particleSize, {
                                    x: value.x,
                                    y: value.y + window.particleSize,
                                    type: 'Stone',
                                    matrix: false,
                                    lastMove: 0
                                });
                            }
                        }
                    } else if (value.type === 'Steam') {
                        if (aboveType === 'Border') {
                            particles.set(key, {
                                x: value.x,
                                y: value.y,
                                type: 'Water',
                                matrix: false,
                                lastMove: 0
                            });
                        }
                    } else if (value.type === 'Water') {
                        if (
                            leftType === 'Lava' ||
                            aboveType === 'Lava' ||
                            rightType === 'Lava' ||
                            belowType === 'Lava'
                        ) {
                            particles.set(key, {
                                x: value.x,
                                y: value.y,
                                type: 'Steam',
                                matrix: false,
                                lastMove: 0
                            });
                        }
                    } else if (value.type === 'Lava') {
                        if (
                            leftType === 'Water' ||
                            aboveType === 'Water' ||
                            rightType === 'Water' ||
                            belowType === 'Water'
                        ) {
                            particles.set(key, {
                                x: value.x,
                                y: value.y,
                                type: 'Stone',
                                matrix: false,
                                lastMove: 0
                            });
                        }
                    }
                    if (pdx !== 0 || pdy !== 0) {
                        value.lastMove += 1;
                    } else {
                        value.lastMove = 0;
                    }
                }
            }
        });
    }

    render(dt, particles) {
        this.gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
        this.gl.clearDepth(1.0);                 // Clear everything
        this.gl.enable(this.gl.DEPTH_TEST);      // Enable depth testing
        this.gl.depthFunc(this.gl.LEQUAL);       // Near things obscure far things

        // Clear the canvas before we start drawing on it.
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        let sprRen = this.sr;
        let gl = this.gl;
        let sp = this.sp;
        
        particles.forEach(function(value, key) {
            sprRen.drawSprite(gl,
                              sp,
                              value,
                              vec2.fromValues(window.particleSize, window.particleSize)); 
        });
    }
}