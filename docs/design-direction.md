# Masar visual and interaction direction

Source: original supplied PDF pages 1/6/9 and user-requested visual review of Optivio landing/simulation

- Purpose: let a visitor understand the inline meter, explore its components, then cause and diagnose an irrigation leak
- Tone: precision agricultural instrument, airy white/navy/blue, natural material farm diorama
- Signature: real Blender-made circular steel meter becomes the instrument mounted on the simulated farm network
- Brand: unmodified logo extracted including transparency from the PDF; exact tagline «لكل قطرة ماء مسار»
- Tokens: ink #171237, accessible primary #1d6fce, light blue #58acff, background #f9fbfd, border #dfe6ef, muted #5b677a; green #207c60 only for healthy flow, red only for leak status
- Typography: IBM Plex Sans Arabic + Manrope for Latin instrumentation; local font files for reliable loading
- Mobile: stacked scene and narrative, scrollable native controls, min 44px touch targets; no dependence on dragging for navigation
- Three-dimensional controls: pointer/touch orbit plus keyboard arrows, zoom buttons, reset view and stable camera presets; reduced-motion respected

Layout:

    [original logo]       [experience / inside device / how it works]       [launch]
    [hero message + CTA]                         [interactive Blender meter]
    [sensing]                         [analysis]                     [response]

    Simulation: [header + layer controls]
    [scenario controls]             [farm diorama]           [live telemetry]
    [normal → leak → analysis → located → isolated]           [pause/speed/reset]

Non-browser verification first; browser needed for reference per user request and a focused WebGL interaction/render check because source/CPU tests cannot validate GLB materials, GPU render and coordinate alignment

Implementation references: [Vite guide](https://vite.dev/guide/), [Three GLTFLoader](https://threejs.org/docs/pages/GLTFLoader.html), [OrbitControls](https://threejs.org/docs/pages/OrbitControls.html)
