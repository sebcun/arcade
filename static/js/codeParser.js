const activeSprites = [];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function executeCode(code, sprites, ctx) {
  const lines = code.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();
    if (!line) continue;

    const parts = line.split(/\s+/);
    const cmd = parts[0].toUpperCase();

    // WAIT Command (USAGE: WAIT <seconds>)
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
      continue;
    }

    // Spawn Command (USAGE: SPAWN (spritename) AT (x,y) )
    if (cmd === "SPAWN") {
      if (parts.length >= 4 && parts[2].toUpperCase() === "AT") {
        const spriteName = parts[1];
        const posParts = parts[3];
        const pos = posParts.split(",");

        if (pos.length === 2) {
          const x = parseInt(pos[0].trim(), 10);
          const y = parseInt(pos[1].trim(), 10);
          if (!isNaN(x) && !isNaN(y)) {
            spawnSprite(spriteName, x, y, sprites, ctx, i + 1, line);
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
      // Despawn Command (USAGE: DESPAWN (spritename) )
    } else if (cmd === "DESPAWN") {
      if (parts.length >= 2) {
        const spriteName = parts[1].trim();
        despawnSprite(spriteName, ctx, i + 1, line);
      } else {
        console.log(`${i + 1} DESPAWN: missing sprite name in ${line}`);
      }

      // Move Command (USAGE: MOVE (spritename) TO x,y)
    } else if (cmd === "MOVE") {
      if (parts.length >= 4 && parts[2] === "TO") {
        const spriteName = parts[1];
        const posParts = parts[3];
        const pos = posParts.split(",");
        if (pos.length === 2) {
          const toX = parseFloat(pos[0].trim());
          const toY = parseFloat(pos[1].trim());
          if (isNaN(toX) || isNaN(toY)) {
            console.log(
              `${
                i + 1
              } MOVE: invalid coordinates. Expected [x,y], got ${posParts}`
            );
            continue;
          }

          const idx = activeSprites.findIndex((s) => s.name === spriteName);
          if (idx === -1) {
            console.log(`${i + 1} MOVE: Sprite ${spriteName} not found`);
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
      // SCALE Command (USAGE: SCALE (spritename) TO (multiplier) )
    } else if (cmd === "SCALE") {
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
          continue;
        }

        const idx = activeSprites.findIndex((s) => s.name === spriteName);
        if (idx === -1) {
          console.log(`${i + 1} SCALE: Sprite ${spriteName} not found`);
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
    } else if (cmd === "ROTATE") {
      if (parts.length >= 4 && parts[2] === "TO") {
        const spriteName = parts[1];
        const degreesStr = parseFloat(degreesStr);
        const degrees = parseFloat(degreesStr);
        if (isNaN(degrees)) {
          console.log(
            `${
              i + 1
            } ROTATE: invalid degrees '${degreesStr}'. Expected a number (can be negative).`
          );
          continue;
        }

        const idx = activeSprites.findIndex((s) => s.name === spriteName);
        if (idx === -1) {
          console.log(`${i + 1} ROTATE: Sprite ${spriteName} not found`);
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
    } else {
      // Unknown command
      console.log(`${i + 1} UNKNOWN: '${cmd}' in line '${line}'`);
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

function drawAll(ctx) {
  if (!ctx || !ctx.canvas) return;
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  const baseScale = 1 / 5;
  const spriteRawSize = 320;

  activeSprites.forEach((s) => {
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
  });
}
