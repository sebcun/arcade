const activeSprites = [];
const keyHandlers = {};
let keyListenerAdded = false;
const variables = {};

function buildContext() {
  const context = {};
  activeSprites.forEach((s) => {
    context[s.name] = {
      x: s.x,
      y: s.y,
      scale: s.scale,
      rotation: s.rotation,
      visible: s.visible,
    };
  });
  for (const [key, value] of Object.entries(variables)) {
    context[key] = value;
  }
  return context;
}

function evaluateExpression(expr, context) {
  try {
    const keys = Object.keys(context);
    const values = Object.values(context);
    const func = new Function(...keys, `return (${expr});`);
    return func(...values);
  } catch (e) {
    throw new Error(`Invalid expression: ${expr}. ${e.message}`);
  }
}

function interpolateString(str, context) {
  return str.replace(/\$\{([^}]+)\}/g, (match, expr) => {
    try {
      return evaluateExpression(expr, context);
    } catch (e) {
      return match;
    }
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function executeCode(code, sprites, ctx) {
  const lines = code.split("\n");
  let i = 0;
  while (i < lines.length) {
    const rawLine = lines[i];
    const line = rawLine.trim();
    if (!line) {
      i++;
      continue;
    }

    const parts = line.split(/\s+/);
    const cmd = parts[0].toUpperCase();

    if (cmd === "ON") {
      const subCmd = parts[1]?.toUpperCase();
      if (subCmd === "KEY" && parts.length >= 3) {
        let keyName = parts[2];
        if (
          (keyName.startsWith("'") && keyName.endsWith("'")) ||
          (keyName.startsWith('"') && keyName.endsWith('"'))
        ) {
          keyName = keyName.slice(1, -1);
        }
        keyName = keyName.toLowerCase();
        i++;
        const blockLines = [];
        while (i < lines.length) {
          const blockLine = lines[i].trim();
          if (blockLine.toUpperCase() === "END ON") {
            break;
          }
          blockLines.push(lines[i]);
          i++;
        }
        if (i >= lines.length || lines[i].trim().toUpperCase() !== "END ON") {
          console.log(`ON KEY: Missing 'END ON' for key '${keyName}'`);
          continue;
        }
        keyHandlers[keyName] = blockLines;
        i++;
      } else {
        console.log(`${i + 1} UNKNOWN: '${cmd}' in line '${line}'`);
        i++;
      }
      continue;
    }

    if (cmd === "WAIT") {
      if (parts.length >= 2) {
        const sec = parseFloat(parts[1]);
        if (!isNaN(sec) && sec >= 0) {
          await sleep(sec * 1000);
        } else {
          console.log(
            `${i + 1} WAIT: invalid time '${
              parts[1]
            }'. Expected non-negative number of seconds.`
          );
        }
      } else {
        console.log(`${i + 1} WAIT: missing seconds parameter in '${line}'`);
      }
      i++;
      continue;
    }

    if (cmd === "SPAWN") {
      if (parts.length >= 4 && parts[2].toUpperCase() === "AT") {
        const spriteName = parts[1];
        const posParts = parts[3];
        const pos = posParts.split(",");

        if (pos.length === 2) {
          const context = buildContext();
          const xExpr = pos[0].trim();
          const yExpr = pos[1].trim();
          let x, y;
          try {
            x = evaluateExpression(xExpr, context);
            y = evaluateExpression(yExpr, context);
          } catch (e) {
            console.log(`${i + 1} SPAWN: ${e.message}`);
            i++;
            continue;
          }
          if (!isNaN(x) && !isNaN(y)) {
            spawnSprite(spriteName, x, y, sprites, ctx, i + 1, line);
          } else {
            console.log(
              `${
                i + 1
              } SPAWN: invalid coordinates. Expected numbers, got x=${x}, y=${y}`
            );
          }
        } else {
          console.log(
            `${
              i + 1
            } SPAWN: invalid coordinates. Expected [x,y], got ${posParts}`
          );
        }
      } else {
        console.log(
          `${
            i + 1
          } SPAWN: invalid syntax. Expected [SPAWN (spritename) AT x,y], got ${line}`
        );
      }
      i++;
      continue;
    }

    if (cmd === "DESPAWN") {
      if (parts.length >= 2) {
        const spriteName = parts[1].trim();
        despawnSprite(spriteName, ctx, i + 1, line);
      } else {
        console.log(`${i + 1} DESPAWN: missing sprite name in ${line}`);
      }
      i++;
      continue;
    }

    if (cmd === "MOVE") {
      if (parts.length >= 4 && parts[2] === "TO") {
        const spriteName = parts[1];
        const posParts = parts[3];
        const pos = posParts.split(",");
        if (pos.length === 2) {
          const context = buildContext();
          const xExpr = pos[0].trim();
          const yExpr = pos[1].trim();
          let toX, toY;
          try {
            toX = evaluateExpression(xExpr, context);
            toY = evaluateExpression(yExpr, context);
          } catch (e) {
            console.log(`${i + 1} MOVE: ${e.message}`);
            i++;
            continue;
          }
          if (isNaN(toX) || isNaN(toY)) {
            console.log(
              `${
                i + 1
              } MOVE: invalid coordinates. Expected numbers, got x=${toX}, y=${toY}`
            );
            i++;
            continue;
          }

          const idx = activeSprites.findIndex((s) => s.name === spriteName);
          if (idx === -1) {
            console.log(`${i + 1} MOVE: Sprite ${spriteName} not found`);
            i++;
            continue;
          }

          activeSprites[idx].x = toX;
          activeSprites[idx].y = toY;
          drawAll(ctx);
        } else {
          console.log(
            `${
              i + 1
            } MOVE: invalid coordinates. Expected [x,y], got ${posParts}`
          );
        }
      } else {
        console.log(
          `${
            i + 1
          } MOVE: invalid syntax. Expected [MOVE (spritename) TO x,y ...], got ${line}`
        );
      }
      i++;
      continue;
    }

    if (cmd === "SCALE") {
      if (parts.length >= 4 && parts[2] === "TO") {
        const spriteName = parts[1];
        const multiplierStr = parts[3];
        const multiplier = parseFloat(multiplierStr);
        if (isNaN(multiplier) || multiplier <= 0) {
          console.log(
            `${
              i + 1
            } SCALE: invalid multiplier '${multiplierStr}'. Expected positive number.`
          );
          i++;
          continue;
        }

        const idx = activeSprites.findIndex((s) => s.name === spriteName);
        if (idx === -1) {
          console.log(`${i + 1} SCALE: Sprite ${spriteName} not found`);
          i++;
          continue;
        }

        activeSprites[idx].scale = multiplier;
        drawAll(ctx);
      } else {
        console.log(
          `${
            i + 1
          } SCALE: invalid syntax. Expected [SCALE (spritename) TO (multiplier)], got ${line}`
        );
      }
      i++;
      continue;
    }

    if (cmd === "TINT") {
      if (parts.length >= 4 && parts[2] === "TO") {
        const spriteName = parts[1];
        let hexString = parts[3];

        if (!hexString.startsWith("#")) {
          hexString = "#" + hexString;
        }

        const hexRegex = /^#[0-9a-fA-F]{3}$|^#[0-9a-fA-F]{6}$/;
        if (!hexRegex.test(hexString)) {
          console.log(
            `${
              i + 1
            } TINT: invalid hex color '${hexString}'. Expected # followed by 3 or 6 hexadecimal digits (e.g., #000 or #000000).`
          );
          i++;
          continue;
        }

        const idx = activeSprites.findIndex((s) => s.name === spriteName);
        if (idx === -1) {
          console.log(`${i + 1} TINT: Sprite ${spriteName} not found`);
          i++;
          continue;
        }

        activeSprites[idx].tint = hexString;
        applyTint(activeSprites[idx]);
        drawAll(ctx);
      } else {
        console.log(
          `${
            i + 1
          } TINT: invalid syntax. Expected [TINT (spritename) TO (hex)], got ${line}`
        );
      }
      i++;
      continue;
    }

    if (cmd === "ROTATE") {
      if (parts.length >= 4 && parts[2] === "TO") {
        const spriteName = parts[1];
        const degreesStr = parts[3];
        const degrees = parseFloat(degreesStr);
        if (isNaN(degrees)) {
          console.log(
            `${
              i + 1
            } ROTATE: invalid degrees '${degreesStr}'. Expected a number (can be negative).`
          );
          i++;
          continue;
        }

        const idx = activeSprites.findIndex((s) => s.name === spriteName);
        if (idx === -1) {
          console.log(`${i + 1} ROTATE: Sprite ${spriteName} not found`);
          i++;
          continue;
        }

        activeSprites[idx].rotation = degrees;
        drawAll(ctx);
      } else {
        console.log(
          `${
            i + 1
          } ROTATE: invalid syntax. Expected [ROTATE (spritename) TO (degrees)], got ${line}`
        );
      }
      i++;
      continue;
    }

    if (cmd === "SHOW") {
      if (parts.length >= 2) {
        const spriteName = parts[1].trim();
        const idx = activeSprites.findIndex((s) => s.name === spriteName);
        if (idx === -1) {
          console.log(`${i + 1} SHOW: Sprite ${spriteName} not found`);
          i++;
          continue;
        }
        activeSprites[idx].visible = true;
        drawAll(ctx);
      } else {
        console.log(`${i + 1} SHOW: missing sprite name in '${line}'`);
      }
      i++;
      continue;
    }

    if (cmd === "HIDE") {
      if (parts.length >= 2) {
        const spriteName = parts[1].trim();
        const idx = activeSprites.findIndex((s) => s.name === spriteName);
        if (idx === -1) {
          console.log(`${i + 1} HIDE: Sprite ${spriteName} not found`);
          i++;
          continue;
        }
        activeSprites[idx].visible = false;
        drawAll(ctx);
      } else {
        console.log(`${i + 1} HIDE: missing sprite name in '${line}'`);
      }
      i++;
      continue;
    }

    if (cmd === "STORE") {
      const asIndex = parts.indexOf("AS");
      if (asIndex === -1 || asIndex < 2 || asIndex === parts.length - 1) {
        console.log(
          `${i + 1} STORE: invalid syntax. Expected STORE <value> AS <varname>`
        );
        i++;
        continue;
      }
      const valueParts = parts.slice(1, asIndex);
      const valueExpr = valueParts.join(" ");
      const varname = parts[asIndex + 1];
      if (parts.length > asIndex + 2) {
        console.log(`${i + 1} STORE: variable name must be one word`);
        i++;
        continue;
      }
      if (/^sprite\d+$/i.test(varname)) {
        console.log(`${i + 1} STORE: variable name cannot be sprite[number]`);
        i++;
        continue;
      }
      const context = buildContext();
      try {
        const value = evaluateExpression(valueExpr, context);
        variables[varname] = value;
      } catch (e) {
        console.log(`${i + 1} STORE: ${e.message}`);
      }
      i++;
      continue;
    }

    if (cmd === "LOG") {
      if (parts.length < 2) {
        console.log(`${i + 1} LOG: missing argument`);
        i++;
        continue;
      }
      const arg = parts.slice(1).join(" ");
      if (arg.startsWith('"') && arg.endsWith('"')) {
        // string, possibly interpolate
        const str = arg.slice(1, -1);
        const interpolated = interpolateString(str, buildContext());
        console.log(interpolated);
      } else {
        // expression
        const context = buildContext();
        try {
          const value = evaluateExpression(arg, context);
          console.log(value);
        } catch (e) {
          console.log(`${i + 1} LOG: ${e.message}`);
        }
      }
      i++;
      continue;
    }

    console.log(`${i + 1} UNKNOWN: '${cmd}' in line '${line}'`);
    i++;
  }

  if (!keyListenerAdded) {
    document.addEventListener("keydown", (e) => {
      const key = e.key.toLowerCase();
      if (keyHandlers[key]) {
        executeCode(keyHandlers[key].join("\n"), sprites, ctx);
      }
    });
    keyListenerAdded = true;
  }
}

function resetSprites() {
  activeSprites.length = 0;
}

function spawnSprite(name, x, y, sprites, ctx, lineno, line) {
  if (activeSprites.some((s) => s.name === name)) {
    console.log(`${lineno} SPAWN: Sprite ${name} has already been spawned`);
    return;
  }

  const match = name.match(/^sprite(\d+)$/i);
  if (match) {
    const index = parseInt(match[1], 10) - 1;
    if (index >= 0 && index < sprites.length) {
      const sprite = sprites[index];

      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = 320;
      tempCanvas.height = 320;
      const tctx = tempCanvas.getContext("2d");
      tctx.putImageData(sprite, 0, 0);

      activeSprites.push({
        name,
        canvas: tempCanvas,
        x,
        y,
        scale: 1,
        rotation: 0,
        visible: true,
        tint: null,
        originalImageData: sprite,
      });

      drawAll(ctx);
    } else {
      console.log(`${lineno} SPAWN: Sprite out of index range`);
    }
  } else {
    console.log(`${lineno} SPAWN: Could not find sprite ${name}`);
  }
}

function despawnSprite(name, ctx, lineno, line) {
  const idx = activeSprites.findIndex((s) => s.name === name);
  if (idx === -1) {
    console.log(`${lineno} DESPAWN: Sprite ${name} not found`);
    return;
  }

  activeSprites.splice(idx, 1);
  drawAll(ctx);
}

function applyTint(s) {
  const ctx = s.canvas.getContext("2d");
  const imageData = new ImageData(
    new Uint8ClampedArray(s.originalImageData.data),
    s.originalImageData.width,
    s.originalImageData.height
  );
  const data = imageData.data;

  let r, g, b;
  if (s.tint.length === 4) {
    r = (parseInt(s.tint[1], 16) * 17) / 255;
    g = (parseInt(s.tint[2], 16) * 17) / 255;
    b = (parseInt(s.tint[3], 16) * 17) / 255;
  } else {
    r = parseInt(s.tint.slice(1, 3), 16) / 255;
    g = parseInt(s.tint.slice(3, 5), 16) / 255;
    b = parseInt(s.tint.slice(5, 7), 16) / 255;
  }

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] > 0) {
      let or = data[i] / 255;
      let og = data[i + 1] / 255;
      let ob = data[i + 2] / 255;

      let nr = or < 0.5 ? 2 * or * r : 1 - 2 * (1 - or) * (1 - r);
      let ng = og < 0.5 ? 2 * og * g : 1 - 2 * (1 - og) * (1 - g);
      let nb = ob < 0.5 ? 2 * ob * b : 1 - 2 * (1 - ob) * (1 - b);

      data[i] = Math.round(nr * 255);
      data[i + 1] = Math.round(ng * 255);
      data[i + 2] = Math.round(nb * 255);
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

function drawAll(ctx) {
  if (!ctx || !ctx.canvas) return;
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  const baseScale = 1 / 5;
  const spriteRawSize = 320;

  activeSprites.forEach((s) => {
    if (s.visible) {
      const multiplier = s.scale ?? 1;
      const scaledWidth = spriteRawSize * baseScale * multiplier;
      const scaledHeight = spriteRawSize * baseScale * multiplier;

      const rotationDeg = s.rotation ?? 0;
      const rotationRad = (rotationDeg * Math.PI) / 180;

      const cx = s.x + scaledWidth / 2;
      const cy = s.y + scaledHeight / 2;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rotationRad);
      ctx.drawImage(
        s.canvas,
        -scaledWidth / 2,
        -scaledHeight / 2,
        scaledWidth,
        scaledHeight
      );
      ctx.restore();
    }
  });
}
