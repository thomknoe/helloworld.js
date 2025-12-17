// src/algorithms/lsystem.js
// L-system (Lindenmayer system) implementation for plant generation

export class LSystem {
  constructor(axiom, rules, iterations = 3) {
    this.axiom = axiom;
    this.rules = rules; // Map of character -> replacement string
    this.iterations = iterations;
    this.currentString = axiom;
  }

  // Apply rules to expand the string
  iterate() {
    this.currentString = this.axiom;
    
    for (let i = 0; i < this.iterations; i++) {
      let newString = "";
      for (let char of this.currentString) {
        if (this.rules[char]) {
          newString += this.rules[char];
        } else {
          newString += char;
        }
      }
      this.currentString = newString;
    }
    
    return this.currentString;
  }

  // Get the final string
  getString() {
    return this.currentString;
  }
}

// Parse L-system string into turtle graphics commands
export function parseLSystemString(lstring, angle, stepSize) {
  const commands = [];
  const stack = []; // For push/pop (branching)
  
  let currentAngle = 0; // Start facing up
  let x = 0;
  let y = 0;
  let z = 0;
  
  for (let i = 0; i < lstring.length; i++) {
    const char = lstring[i];
    
    switch (char) {
      case 'F': // Move forward and draw
      case 'G': // Move forward and draw (alternative)
        const newX = x + Math.sin(currentAngle) * stepSize;
        const newY = y + Math.cos(currentAngle) * stepSize;
        const newZ = z;
        
        commands.push({
          type: 'line',
          from: { x, y, z },
          to: { x: newX, y: newY, z: newZ },
        });
        
        x = newX;
        y = newY;
        z = newZ;
        break;
        
      case '+': // Turn right (positive angle)
        currentAngle += angle;
        break;
        
      case '-': // Turn left (negative angle)
        currentAngle -= angle;
        break;
        
      case '&': // Pitch down
        // For 3D, we'd adjust pitch here
        break;
        
      case '^': // Pitch up
        // For 3D, we'd adjust pitch here
        break;
        
      case '\\': // Roll left
        // For 3D, we'd adjust roll here
        break;
        
      case '/': // Roll right
        // For 3D, we'd adjust roll here
        break;
        
      case '|': // Turn around 180 degrees
        currentAngle += Math.PI;
        break;
        
      case '[': // Push state (start branch)
        stack.push({
          x, y, z,
          angle: currentAngle,
        });
        break;
        
      case ']': // Pop state (end branch)
        if (stack.length > 0) {
          const state = stack.pop();
          x = state.x;
          y = state.y;
          z = state.z;
          currentAngle = state.angle;
        }
        break;
        
      default:
        // Ignore unknown characters
        break;
    }
  }
  
  return commands;
}

// Default plant L-system rules
export const defaultPlantRules = {
  'F': 'F[+F]F[-F]F', // Simple branching
};

export const defaultAxiom = 'F';

// More complex plant rules
export const complexPlantRules = {
  'F': 'FF+[+F-F-F]-[-F+F+F]',
};

// Tree-like rules
export const treeRules = {
  'F': 'FF[++F][-F]F',
};

