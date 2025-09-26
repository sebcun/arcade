const activeSprites = [];

let keyHandlers = {};
window.keyListenerAdded = false;
let keyListener = null;

let touchHandlers = [];
let touchPairsActive = new Set();
let touchMonitorAdded = false;
let touchMonitorRAF = null;

let variables = {};
let abortController = null;
let activeLoopStack = [];

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

function stripName(token) {
  if (!token) return token;
  token = token.trim();
  if (
    (token.startsWith("'") && token.endsWith("'")) ||
    (token.startsWith('"') && token.endsWith('"'))
  ) {
    token = token.slice(1, -1);
  }
  token = token.replace(/[:;]+$/g, "");
  return token.toLowerCase();
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

function sleep(ms, signal) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(resolve, ms);
    if (signal) {
      signal.addEventListener("abort", () => {
        clearTimeout(timeout);
        reject(new Error("Aborted"));
      });
    }
  });
}

async function executeCode(
  code,
  sprites,
  ctx,
  signal = null,
  loopController = null,
  isEvent = false
) {
  if (!signal) {
    abortController = new AbortController();
    signal = abortController.signal;
    keyHandlers = {};
    window.keyListenerAdded = false;

    touchHandlers = [];
    touchPairsActive.clear();
    if (keyListener) {
      document.removeEventListener("keydown", keyListener);
      keyListener = null;
    }
    if (touchMonitorRAF) {
      cancelAnimationFrame(touchMonitorRAF);
      touchMonitorRAF = null;
      touchMonitorAdded = false;
    }
  }

  const lines = code.split("\n");
  let nonEventLines = [];
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
        const stack = ["KEY"];
        while (i < lines.length && stack.length > 0) {
          const cur = lines[i];
          const curTrim = cur.trim();
          const up = curTrim.toUpperCase();
          if (up.startsWith("ON ")) {
            const p = curTrim.split(/\s+/);
            const newSub = p[1]?.toUpperCase() || "";
            stack.push(newSub);
            blockLines.push(lines[i]);
            i++;
            continue;
          }
          if (up.startsWith("END ")) {
            const p = curTrim.split(/\s+/);
            const endSub = p[1]?.toUpperCase() || "";
            if (endSub === stack[stack.length - 1]) {
              stack.pop();
              if (stack.length === 0) {
                i++;
                break;
              } else {
                blockLines.push(lines[i]);
                i++;
                continue;
              }
            } else {
              blockLines.push(lines[i]);
              i++;
              continue;
            }
          }
          blockLines.push(lines[i]);
          i++;
        }
        if (stack.length > 0) {
          console.log(`ON KEY: Missing 'END KEY' for key '${keyName}'`);
          continue;
        }
        keyHandlers[keyName] = keyHandlers[keyName] || [];
        const handlerObj = { lines: blockLines, loopController, _active: true };
        keyHandlers[keyName].push(handlerObj);
        if (loopController) {
          loopController._keys = loopController._keys || [];
          loopController._keys.push({ key: keyName, handlerObj });
        }
      } else if (subCmd === "TOUCH") {
        const withIndex = parts.findIndex((p) => p.toUpperCase() === "WITH");
        if (
          withIndex === -1 ||
          withIndex < 3 ||
          withIndex === parts.length - 1
        ) {
          console.log(
            `${
              i + 1
            } ON TOUCH: invalid syntax. Expected 'ON TOUCH <nameA> WITH <nameB>'`
          );
          i++;
          continue;
        }

        const nameAParts = parts.slice(2, withIndex);
        const nameBParts = parts.slice(withIndex + 1, withIndex + 2);
        const nameA = stripName(nameAParts.join(" "));
        const nameB = stripName(nameBParts.join(" "));
        i++;

        const blockLines = [];
        const stack = ["TOUCH"];
        while (i < lines.length && stack.length > 0) {
          const cur = lines[i];
          const curTrim = cur.trim();
          const up = curTrim.toUpperCase();
          if (up.startsWith("ON ")) {
            const p = curTrim.split(/\s+/);
            const newSub = p[1]?.toUpperCase() || "";
            stack.push(newSub);
            blockLines.push(lines[i]);
            i++;
            continue;
          }
          if (up.startsWith("END ")) {
            const p = curTrim.split(/\s+/);
            const endSub = p[1]?.toUpperCase() || "";
            if (endSub === stack[stack.length - 1]) {
              stack.pop();
              if (stack.length === 0) {
                i++;
                break;
              } else {
                blockLines.push(lines[i]);
                i++;
                continue;
              }
            } else {
              blockLines.push(lines[i]);
              i++;
              continue;
            }
          }
          blockLines.push(lines[i]);
          i++;
        }
        if (stack.length > 0) {
          console.log(
            `ON TOUCH: Missing 'END TOUCH' for touch handler '${nameA} WITH ${nameB}'`
          );
          continue;
        }

        const handlerObj = {
          a: nameA,
          b: nameB,
          lines: blockLines,
          loopController: loopController || null,
          _active: true,
        };
        touchHandlers.push(handlerObj);
        if (loopController) {
          loopController._touches = loopController._touches || [];
          loopController._touches.push(handlerObj);
        }
      } else {
        console.log(`${i + 1} UNKNOWN: '${cmd}' in line '${line}'`);
        i++;
      }
      continue;
    } else {
      nonEventLines.push(rawLine);
      i++;
    }
  }

  if (!window.keyListenerAdded) {
    keyListener = (e) => {
      const key = e.key.toLowerCase();
      const handlers = (keyHandlers[key] || []).slice();
      for (const h of handlers) {
        if (h._active === false) continue;
        executeCode(
          h.lines.join("\n"),
          sprites,
          ctx,
          abortController ? abortController.signal : null,
          h.loopController || null,
          true
        );
      }
    };
    document.addEventListener("keydown", keyListener);
    window.keyListenerAdded = true;
  }

  if (!touchMonitorAdded && touchHandlers.length > 0) {
    touchMonitorAdded = true;
    function checkTouches() {
      try {
        if (signal && signal.aborted) {
          touchMonitorAdded = false;
          touchMonitorRAF = null;
          return;
        }

        const baseScale = 1 / 5;
        const spriteRawSize = 320;

        for (const handler of touchHandlers.slice()) {
          if (handler._active === false) continue;
          const idxA = activeSprites.findIndex(
            (s) => s.name.toLowerCase() === handler.a
          );
          const idxB = activeSprites.findIndex(
            (s) => s.name.toLowerCase() === handler.b
          );
          if (idxA === -1 || idxB === -1) continue;

          const sa = activeSprites[idxA];
          const sb = activeSprites[idxB];

          const ma = sa.scale ?? 1;
          const mb = sb.scale ?? 1;

          const wA = spriteRawSize * baseScale * ma;
          const hA = spriteRawSize * baseScale * ma;
          const wB = spriteRawSize * baseScale * mb;
          const hB = spriteRawSize * baseScale * mb;

          const rectA = { x: sa.x, y: sa.y, w: wA, h: hA };
          const rectB = { x: sb.x, y: sb.y, w: wB, h: hB };

          const intersects =
            rectA.x < rectB.x + rectB.w &&
            rectA.x + rectA.w > rectB.x &&
            rectA.y < rectB.y + rectB.h &&
            rectA.y + rectA.h > rectB.y;

          const pairKey = [handler.a, handler.b].sort().join("::");

          if (intersects) {
            if (!touchPairsActive.has(pairKey)) {
              touchPairsActive.add(pairKey);
              executeCode(
                handler.lines.join("\n"),
                sprites,
                ctx,
                signal,
                handler.loopController || null,
                true
              );
            }
          } else {
            if (touchPairsActive.has(pairKey)) {
              touchPairsActive.delete(pairKey);
            }
          }
        }
      } catch (err) {
        console.error("Touch monitor error:", err);
      }

      if (!(signal && signal.aborted)) {
        touchMonitorRAF = requestAnimationFrame(checkTouches);
      } else {
        touchMonitorAdded = false;
        touchMonitorRAF = null;
      }
    }

    checkTouches();
  }

  if (nonEventLines.length > 0) {
    const lines = nonEventLines;
    let i = 0;
    while (i < lines.length) {
      if (signal && signal.aborted) return;

      const rawLine = lines[i];
      const line = rawLine.trim();
      if (!line) {
        i++;
        continue;
      }

      const parts = line.split(/\s+/);
      const cmd = parts[0].toUpperCase();

      if (cmd === "STOP" && parts[1]?.toUpperCase() === "LOOP") {
        if (loopController) {
          loopController.stopped = true;
          return;
        } else if (activeLoopStack.length > 0) {
          const top = activeLoopStack[activeLoopStack.length - 1];
          top.stopped = true;
          return;
        } else {
          console.log(`${i + 1} STOP LOOP: no active loop to stop here`);
          i++;
          continue;
        }
      }

      if (
        cmd === "LOOP" ||
        (cmd === "START" && parts[1]?.toUpperCase() === "LOOP")
      ) {
        let depth = 1;
        const blockLines = [];
        let j = i + 1;
        while (j < lines.length && depth > 0) {
          const lTrim = lines[j].trim();
          const up = lTrim.toUpperCase();
          if (up.startsWith("LOOP") || up.startsWith("START LOOP")) {
            depth++;
            blockLines.push(lines[j]);
          } else if (up.startsWith("END LOOP")) {
            depth--;
            if (depth > 0) {
              blockLines.push(lines[j]);
            }
          } else {
            blockLines.push(lines[j]);
          }
          j++;
        }
        if (depth > 0) {
          console.log(`${i + 1} LOOP: Missing 'END LOOP'`);
          i = j;
          continue;
        }

        const myLoopController = { stopped: false, _keys: [], _touches: [] };
        const runner = async () => {
          activeLoopStack.push(myLoopController);
          try {
            while (!myLoopController.stopped && !(signal && signal.aborted)) {
              try {
                await executeCode(
                  blockLines.join("\n"),
                  sprites,
                  ctx,
                  signal,
                  myLoopController,
                  true
                );
              } catch (e) {
                if (e && e.message === "Aborted") return;
                console.error("Loop body error:", e);
                return;
              }
            }
          } finally {
            const idx = activeLoopStack.lastIndexOf(myLoopController);
            if (idx !== -1) activeLoopStack.splice(idx, 1);

            if (myLoopController._keys) {
              for (const entry of myLoopController._keys) {
                const arr = keyHandlers[entry.key];
                if (!arr) continue;
                entry.handlerObj._active = false;
                const index = arr.indexOf(entry.handlerObj);
                if (index !== -1) {
                  arr.splice(index, 1);
                }
                if (arr.length === 0) {
                  delete keyHandlers[entry.key];
                }
              }
            }

            if (myLoopController._touches) {
              for (const th of myLoopController._touches) {
                th._active = false;
                const index = touchHandlers.indexOf(th);
                if (index !== -1) touchHandlers.splice(index, 1);
              }
            }
          }
        };

        if (isEvent) {
          await runner();
        } else {
          runner();
        }

        i = j;
        continue;
      }

      if (cmd === "WAIT") {
        if (parts.length >= 2) {
          const sec = parseFloat(parts[1]);
          if (!isNaN(sec) && sec >= 0) {
            try {
              await sleep(sec * 1000, signal);
            } catch (e) {
              if (e.message === "Aborted") return;
              throw e;
            }
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
        if (parts.length >= 4 && parts[2].toUpperCase() === "TO") {
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
        if (parts.length >= 4 && parts[2].toUpperCase() === "TO") {
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
        if (parts.length >= 4 && parts[2].toUpperCase() === "TO") {
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
        if (parts.length >= 4 && parts[2].toUpperCase() === "TO") {
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
            `${
              i + 1
            } STORE: invalid syntax. Expected STORE <value> AS <varname>`
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
          const str = arg.slice(1, -1);
          const interpolated = interpolateString(str, buildContext());
          console.log(interpolated);
        } else {
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

      if (cmd === "IF") {
        const rest = line.slice(2).trim();
        const upperRest = rest.toUpperCase();
        const isIdx = upperRest.indexOf(" IS ");
        if (isIdx === -1) {
          console.log(
            `${i + 1} IF: invalid syntax. Expected 'IF <left> IS <right>'`
          );
          i++;
          continue;
        }
        const leftExpr = rest.slice(0, isIdx).trim();
        const rightExpr = rest.slice(isIdx + 4).trim();

        let depth = 1;
        const blockLines = [];
        let j = i + 1;
        while (j < lines.length && depth > 0) {
          const lTrim = lines[j].trim();
          const up = lTrim.toUpperCase();
          if (up.startsWith("IF ")) {
            depth++;
            blockLines.push(lines[j]);
          } else if (up.startsWith("END IF")) {
            depth--;
            if (depth > 0) {
              blockLines.push(lines[j]);
            }
          } else {
            blockLines.push(lines[j]);
          }
          j++;
        }

        if (depth > 0) {
          console.log(`${i + 1} IF: Missing 'END IF'`);
          i = j;
          continue;
        }

        let leftVal, rightVal;
        const context = buildContext();
        try {
          leftVal = evaluateExpression(leftExpr, context);
        } catch (e) {
          console.log(`${i + 1} IF: left expression error: ${e.message}`);
          i = j;
          continue;
        }
        try {
          rightVal = evaluateExpression(rightExpr, context);
        } catch (e) {
          console.log(`${i + 1} IF: right expression error: ${e.message}`);
          i = j;
          continue;
        }

        const condition = leftVal === rightVal;
        if (condition) {
          try {
            await executeCode(
              blockLines.join("\n"),
              sprites,
              ctx,
              signal,
              loopController || null,
              true
            );
          } catch (e) {
            if (e && e.message === "Aborted") return;
            console.error("IF block error:", e);
            return;
          }
        }

        i = j;
        continue;
      }

      console.log(`${i + 1} UNKNOWN: '${cmd}' in line '${line}'`);
      i++;
    }
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

function stopExecution() {
  if (abortController) {
    abortController.abort();
    abortController = null;
  }
  if (keyListener) {
    document.removeEventListener("keydown", keyListener);
    keyListener = null;
  }
  if (touchMonitorRAF) {
    cancelAnimationFrame(touchMonitorRAF);
    touchMonitorRAF = null;
  }
  touchHandlers = [];
  touchPairsActive.clear();
  touchMonitorAdded = false;

  window.keyListenerAdded = false;
  keyHandlers = {};
  variables = {};
  activeLoopStack = [];
}

window.stopExecution = stopExecution;
