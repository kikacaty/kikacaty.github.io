import {
  measureNaturalWidth,
  prepareWithSegments
} from "./vendor/pretext/layout.js";

(function () {
  "use strict";

  var navigation = document.querySelector("[data-pretext-navigation]");
  var link = document.querySelector("[data-site-identity]");
  var canvas = document.querySelector("[data-site-navigation-canvas]");
  var navLinks = Array.from(document.querySelectorAll(".site-nav-links a"));
  if (!navigation || !link || !canvas) return;

  var context = canvas.getContext("2d");
  if (!context) return;

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (reducedMotion.matches) return;

  var bodies = [];
  var trail = [];
  var width = 1;
  var height = 1;
  var pixelRatio = 1;
  var animationFrame = 0;
  var lastTime = 0;
  var fontFamily = '"Palatino Linotype", "Book Antiqua", Palatino, serif';

  var pointer = {
    inside: false,
    x: 0,
    y: 0,
    previousX: 0,
    previousY: 0,
    glow: 0
  };

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
  }

  function angleFromRest(value) {
    return Math.atan2(Math.sin(value), Math.cos(value));
  }

  function fontString(fontSize) {
    return "normal " + fontSize + "px " + fontFamily;
  }

  function setFont(fontSize) {
    context.font = fontString(fontSize);
    context.textAlign = "center";
    context.textBaseline = "middle";
  }

  function layoutRow(row, bodyIndex) {
    var characters = Array.from(row.text);
    var font = fontString(row.fontSize);
    var prepared = prepareWithSegments(row.text, font, {
      letterSpacing: row.letterSpacing,
      wordBreak: "keep-all"
    });
    var pretextWidth = measureNaturalWidth(prepared);
    var measured = [];
    var canvasWidth = 0;

    setFont(row.fontSize);
    characters.forEach(function (character) {
      var glyphWidth = Math.max(
        context.measureText(character).width,
        row.fontSize * 0.15
      );
      var advance = glyphWidth + row.letterSpacing;
      measured.push({
        character: character,
        glyphWidth: glyphWidth,
        advance: advance
      });
      canvasWidth += advance;
    });

    var correction =
      (pretextWidth - canvasWidth) / Math.max(1, characters.length);
    var cursorX = row.x;

    measured.forEach(function (glyph, characterIndex) {
      var advance = glyph.advance + correction;
      var homeX = cursorX + advance / 2;
      var body = bodies[bodyIndex];

      if (!body) {
        body = {};
        bodies.push(body);
      }

      body.character = glyph.character;
      body.fontSize = row.fontSize;
      body.color =
        typeof row.color === "function"
          ? row.color(characterIndex)
          : row.color;
      body.homeX = homeX;
      body.homeY = row.y;
      body.x = homeX;
      body.y = row.y;
      body.vx = 0;
      body.vy = 0;
      body.rotation = 0;
      body.rotationY = 0;
      body.angularVelocity = 0;
      body.angularVelocityY = 0;
      body.radius = Math.max(
        2.5,
        Math.min(row.fontSize * 0.34, glyph.glyphWidth * 0.55)
      );
      body.returnStrength = row.returnStrength || 0.000084;
      body.angularReturnStrength = row.angularReturnStrength || 0.00022;
      body.linearDamping = row.linearDamping || 0.956;
      body.angularDamping = row.angularDamping || 0.946;
      body.interactive = row.interactive !== false;
      body.active = false;

      cursorX += advance;
      bodyIndex += 1;
    });

    return bodyIndex;
  }

  function layoutBodies() {
    var computedFont = getComputedStyle(document.documentElement)
      .getPropertyValue("--font-site")
      .trim();
    if (computedFont) fontFamily = computedFont;

    var navigationRect = navigation.getBoundingClientRect();
    var identityRect = link.getBoundingClientRect();
    var compact = window.innerWidth <= 672;
    var identityX = identityRect.left - navigationRect.left;
    var identityY = identityRect.top - navigationRect.top;
    var rows = [
      {
        text: link.getAttribute("data-title") || "Y.C.",
        fontSize: compact ? 20 : 21,
        x: identityX + 2,
        y: compact
          ? identityY + identityRect.height * 0.5
          : identityY + identityRect.height * 0.31,
        color: "#841212",
        letterSpacing: 0.15
      }
    ];

    if (!compact) {
      rows.push({
        text: link.getAttribute("data-tagline") || "",
        fontSize: 10,
        x: identityX + 2,
        y: identityY + identityRect.height * 0.72,
        color: "#aaaaaa",
        letterSpacing: 0.12
      });
    }

    navLinks.forEach(function (navLink) {
      var navLinkRect = navLink.getBoundingClientRect();
      if (navLinkRect.width < 1 || navLinkRect.height < 1) return;

      var styles = getComputedStyle(navLink);
      var fontSize = parseFloat(styles.fontSize) || 14.4;
      var text = navLink.textContent.trim();
      var font = fontString(fontSize);
      var prepared = prepareWithSegments(text, font, {
        letterSpacing: 0,
        wordBreak: "keep-all"
      });
      var naturalWidth = measureNaturalWidth(prepared);

      rows.push({
        text: text,
        fontSize: fontSize,
        x:
          navLinkRect.left -
          navigationRect.left +
          Math.max(0, (navLinkRect.width - naturalWidth) / 2),
        y:
          navLinkRect.top -
          navigationRect.top +
          navLinkRect.height / 2 -
          1,
        color: navLink.hasAttribute("aria-current") ? "#841212" : "#505050",
        letterSpacing: 0,
        interactive: false
      });
    });

    var bodyIndex = 0;
    rows.forEach(function (row) {
      bodyIndex = layoutRow(row, bodyIndex);
    });
    bodies.length = bodyIndex;
    navigation.setAttribute("data-text-layout", "pretext");
  }

  function drawTrail() {
    if (trail.length < 2) return;

    function drawPass(widthScale, opacity, blur, color) {
      context.save();
      context.filter = "blur(" + blur + "px)";
      context.lineCap = "round";
      context.lineJoin = "round";

      for (var index = 1; index < trail.length; index += 1) {
        var previous = trail[index - 1];
        var point = trail[index];
        var life = Math.min(previous.life, point.life);
        var taper = Math.pow(index / Math.max(1, trail.length - 1), 1.7);
        context.strokeStyle =
          "rgba(" + color + ", " + (opacity * life).toFixed(4) + ")";
        context.lineWidth = Math.max(
          0.3,
          (0.2 + point.radius * widthScale * taper) * life
        );
        context.beginPath();
        context.moveTo(previous.x, previous.y);
        context.lineTo(point.x, point.y);
        context.stroke();
      }
      context.restore();
    }

    drawPass(1.55, 0.09, 3, "69, 69, 69");
    drawPass(0.55, 0.5, 1.2, "255, 255, 255");
    drawPass(0.2, 0.075, 0.6, "69, 69, 69");
  }

  function drawLetters() {
    bodies.forEach(function (body) {
      setFont(body.fontSize);
      context.save();
      context.translate(body.x, body.y);
      context.rotate(body.rotation);
      context.scale(Math.cos(body.rotationY), 1);
      context.fillStyle = body.color;
      context.fillText(body.character, 0, 0);
      context.restore();
    });
  }

  function drawCursor() {
    if (pointer.glow <= 0.004) return;

    var radius = 7;
    context.save();
    context.globalAlpha = pointer.glow;
    context.filter = "blur(4px)";
    var gaussian = context.createRadialGradient(
      pointer.x,
      pointer.y,
      0,
      pointer.x,
      pointer.y,
      radius * 1.4
    );
    gaussian.addColorStop(0, "rgba(255, 255, 255, 0.78)");
    gaussian.addColorStop(0.48, "rgba(255, 255, 255, 0.24)");
    gaussian.addColorStop(0.78, "rgba(69, 69, 69, 0.055)");
    gaussian.addColorStop(1, "rgba(69, 69, 69, 0)");
    context.fillStyle = gaussian;
    context.beginPath();
    context.arc(pointer.x, pointer.y, radius * 1.4, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }

  function draw() {
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    context.clearRect(0, 0, width, height);
    drawTrail();
    drawLetters();
    drawCursor();
  }

  function disturb(deltaX, deltaY, boost) {
    var speed = Math.hypot(deltaX, deltaY);
    var influenceRadius = clamp(11 + speed * 0.5, 11, 23);

    bodies.forEach(function (body) {
      if (!body.interactive) return;

      var dx = body.x - pointer.x;
      var dy = body.y - pointer.y;
      var distance = Math.hypot(dx, dy) || 0.001;
      if (distance > influenceRadius + body.radius) return;

      var falloff = 1 - distance / (influenceRadius + body.radius);
      var impulse = falloff * (boost + speed * 0.52);
      body.active = true;
      body.vx += (dx / distance) * impulse + deltaX * falloff * 0.24;
      body.vy += (dy / distance) * impulse + deltaY * falloff * 0.24;
      body.angularVelocity +=
        (dx * deltaY - dy * deltaX) * falloff * 0.0012;
      body.angularVelocityY +=
        ((dx / distance) * impulse + deltaX * falloff * 0.15) * 0.026;
    });
  }

  function update(delta) {
    var frameScale = delta * 60;

    bodies.forEach(function (body) {
      if (!body.active) return;

      var damping = Math.pow(body.linearDamping, frameScale);
      var angularDamping = Math.pow(body.angularDamping, frameScale);
      body.vx += (body.homeX - body.x) * body.returnStrength * frameScale;
      body.vy += (body.homeY - body.y) * body.returnStrength * frameScale;
      body.angularVelocity -=
        angleFromRest(body.rotation) * body.angularReturnStrength * frameScale;
      body.angularVelocityY -=
        angleFromRest(body.rotationY) * body.angularReturnStrength * frameScale;
      body.x += body.vx * frameScale;
      body.y += body.vy * frameScale;
      body.rotation += body.angularVelocity * frameScale;
      body.rotationY += body.angularVelocityY * frameScale;
      body.vx *= damping;
      body.vy *= damping;
      body.angularVelocity *= angularDamping;
      body.angularVelocityY *= angularDamping;

      var margin = Math.max(2, body.radius);
      if (body.x < margin || body.x > width - margin) {
        body.x = clamp(body.x, margin, width - margin);
        body.vx *= -0.52;
      }
      if (body.y < margin || body.y > height - margin) {
        body.y = clamp(body.y, margin, height - margin);
        body.vy *= -0.52;
      }

      if (
        Math.hypot(body.x - body.homeX, body.y - body.homeY) < 0.24 &&
        Math.abs(body.vx) < 0.012 &&
        Math.abs(body.vy) < 0.012 &&
        Math.abs(angleFromRest(body.rotation)) < 0.008 &&
        Math.abs(angleFromRest(body.rotationY)) < 0.008
      ) {
        body.x = body.homeX;
        body.y = body.homeY;
        body.vx = 0;
        body.vy = 0;
        body.rotation = 0;
        body.rotationY = 0;
        body.angularVelocity = 0;
        body.angularVelocityY = 0;
        body.active = false;
      }
    });

    trail.forEach(function (point) {
      point.life -= delta * 2;
    });
    trail = trail.filter(function (point) {
      return point.life > 0;
    });

    if (!pointer.inside) {
      pointer.glow *= Math.pow(0.055, delta);
    }
  }

  function needsAnotherFrame() {
    return (
      trail.length > 0 ||
      (!pointer.inside && pointer.glow > 0.004) ||
      bodies.some(function (body) {
        return body.active;
      })
    );
  }

  function tick(time) {
    animationFrame = 0;
    var delta = Math.min(0.04, (time - lastTime) / 1000 || 0.016);
    lastTime = time;
    update(delta);
    draw();
    if (needsAnotherFrame()) requestTick();
  }

  function requestTick() {
    if (!animationFrame) animationFrame = window.requestAnimationFrame(tick);
  }

  function pointerPosition(event) {
    var rect = navigation.getBoundingClientRect();
    return {
      x: clamp(event.clientX - rect.left, 0, rect.width),
      y: clamp(event.clientY - rect.top, 0, rect.height)
    };
  }

  navigation.addEventListener("pointerenter", function (event) {
    var point = pointerPosition(event);
    pointer.inside = true;
    pointer.x = point.x;
    pointer.y = point.y;
    pointer.previousX = point.x;
    pointer.previousY = point.y;
    pointer.glow = 1;
    draw();
  });

  navigation.addEventListener("pointermove", function (event) {
    var point = pointerPosition(event);
    var deltaX = point.x - pointer.x;
    var deltaY = point.y - pointer.y;
    pointer.inside = true;
    pointer.previousX = pointer.x;
    pointer.previousY = pointer.y;
    pointer.x = point.x;
    pointer.y = point.y;
    pointer.glow = 1;

    if (Math.hypot(deltaX, deltaY) > 0.5) {
      trail.push({
        x: pointer.x,
        y: pointer.y,
        radius: clamp(4 + Math.hypot(deltaX, deltaY) * 0.1, 4, 7),
        life: 1
      });
      if (trail.length > 22) trail.shift();
      disturb(deltaX, deltaY, 0.35);
    }
    requestTick();
  });

  navigation.addEventListener("pointerleave", function () {
    pointer.inside = false;
    requestTick();
  });

  navigation.addEventListener("pointerdown", function (event) {
    var point = pointerPosition(event);
    var deltaX = point.x - pointer.x;
    var deltaY = point.y - pointer.y;
    pointer.x = point.x;
    pointer.y = point.y;
    disturb(deltaX, deltaY, 7);
    requestTick();
  });

  function resize() {
    var rect = navigation.getBoundingClientRect();
    width = Math.max(1, Math.round(rect.width));
    height = Math.max(1, Math.round(rect.height));
    pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    layoutBodies();
    draw();
    navigation.classList.add("is-pretext-ready");
  }

  window.addEventListener("resize", resize);
  if (window.ResizeObserver) {
    new ResizeObserver(resize).observe(navigation);
  }
  resize();
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(resize);
  }
})();
