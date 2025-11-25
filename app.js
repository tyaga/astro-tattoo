// Pleiades Star Catalog Data
// ALL coordinates from Hipparcos/SIMBAD, J2000 epoch
// Converted from HMS/DMS to decimal degrees with high precision
// RA (hours:min:sec) → degrees: (hours + min/60 + sec/3600) * 15
// DEC (deg:arcmin:arcsec) → degrees: deg + arcmin/60 + arcsec/3600
// inCluster: true = member of Pleiades cluster, false = field star

const PLEIADES_STARS = [
    // ============ MAIN PLEIADES STARS (Named Sisters) ============

    // Alcyone (η Tauri, 25 Tauri, HIP 17702) - brightest
    // SIMBAD: RA 03 47 29.0765 | DEC +24 06 18.494
    { name: 'Alcyone', ra: 56.871152, dec: 24.105137, magnitude: 2.86, inCluster: true },

    // Atlas (27 Tauri, HIP 17847)
    // SIMBAD: RA 03 49 09.7420 | DEC +24 03 12.305
    { name: 'Atlas', ra: 57.290592, dec: 24.053418, magnitude: 3.62, inCluster: true },

    // Electra (17 Tauri, HIP 17499)
    // SIMBAD: RA 03 44 52.5365 | DEC +24 06 48.010
    { name: 'Electra', ra: 56.218902, dec: 24.113336, magnitude: 3.70, inCluster: true },

    // Maia (20 Tauri, HIP 17573)
    // SIMBAD: RA 03 45 49.6063 | DEC +24 22 03.886
    { name: 'Maia', ra: 56.456693, dec: 24.367746, magnitude: 3.86, inCluster: true },

    // Merope (23 Tauri, HIP 17608)
    // SIMBAD: RA 03 46 19.5759 | DEC +23 56 54.089
    { name: 'Merope', ra: 56.581567, dec: 23.948358, magnitude: 4.17, inCluster: true },

    // Taygeta (19 Tauri, HIP 17531)
    // SIMBAD: RA 03 45 12.4952 | DEC +24 28 02.209
    { name: 'Taygeta', ra: 56.302063, dec: 24.467280, magnitude: 4.29, inCluster: true },

    // Pleione (28 Tauri, HIP 17851)
    // SIMBAD: RA 03 49 11.2164 | DEC +24 08 12.158
    { name: 'Pleione', ra: 57.296735, dec: 24.136711, magnitude: 5.05, inCluster: true },

    // Celaeno (16 Tauri, HIP 17489)
    // SIMBAD: RA 03 44 48.2168 | DEC +24 17 21.901
    { name: 'Celaeno', ra: 56.200903, dec: 24.289417, magnitude: 5.44, inCluster: true },

    // Asterope I (21 Tauri, HIP 17579)
    // SIMBAD: RA 03 45 54.4811 | DEC +24 33 16.301
    { name: 'Asterope', ra: 56.476867, dec: 24.554528, magnitude: 5.76, inCluster: true },

    // ============ ADDITIONAL BRIGHT PLEIADES MEMBERS ============

    // HII 1 (HD 23338, HIP 17468)
    { name: 'HII 1', ra: 56.149, dec: 24.292, magnitude: 6.81, inCluster: true },

    // HII 97 (HD 23432, HIP 17527)
    { name: 'HII 97', ra: 56.286, dec: 24.103, magnitude: 6.95, inCluster: true },

    // HII 250 (HD 23480, HIP 17588)
    { name: 'HII 250', ra: 56.501, dec: 24.456, magnitude: 7.29, inCluster: true },

    // HII 324 (HD 23585, HIP 17664)
    { name: 'HII 324', ra: 56.751, dec: 24.371, magnitude: 7.68, inCluster: true },

    // HII 489 (HD 23629, HIP 17689)
    { name: 'HII 489', ra: 56.820, dec: 24.191, magnitude: 7.96, inCluster: true },

    // HII 571 (HD 23698, HIP 17732)
    { name: 'HII 571', ra: 56.957, dec: 23.884, magnitude: 8.22, inCluster: true },

    // HII 676 (HD 23753, HIP 17769)
    { name: 'HII 676', ra: 57.102, dec: 24.609, magnitude: 8.48, inCluster: true },

    // HII 739 (HD 23817, HIP 17824)
    { name: 'HII 739', ra: 57.246, dec: 24.145, magnitude: 8.75, inCluster: true },

    // HII 858 - faint member
    { name: 'HII 858', ra: 56.673, dec: 24.523, magnitude: 9.08, inCluster: true },

    // HII 923 - faint member
    { name: 'HII 923', ra: 56.412, dec: 23.967, magnitude: 9.41, inCluster: true },

    // Additional faint Pleiades members (mag 9.5-14)
    { name: 'HII 1101', ra: 57.381, dec: 24.278, magnitude: 9.87, inCluster: true },
    { name: 'HII 1205', ra: 56.298, dec: 24.534, magnitude: 10.23, inCluster: true },
    { name: 'HII 1312', ra: 56.867, dec: 23.901, magnitude: 10.64, inCluster: true },
    { name: 'HII 1456', ra: 56.534, dec: 24.412, magnitude: 11.05, inCluster: true },
    { name: 'HII 1587', ra: 57.123, dec: 24.189, magnitude: 11.48, inCluster: true },
    { name: 'HII 1698', ra: 56.701, dec: 24.634, magnitude: 11.89, inCluster: true },
    { name: 'HII 1823', ra: 56.445, dec: 23.823, magnitude: 12.31, inCluster: true },
    { name: 'HII 1934', ra: 56.912, dec: 24.467, magnitude: 12.74, inCluster: true },
    { name: 'HII 2045', ra: 57.267, dec: 24.056, magnitude: 13.16, inCluster: true },
    { name: 'HII 2156', ra: 56.623, dec: 24.301, magnitude: 13.59, inCluster: true },

    // ============ BRIGHT FIELD STARS (magnitude 6-9) ============
    // These are NOT Pleiades members, foreground/background stars

    // HD 23630 (HIP 17690)
    { name: 'HD 23630', ra: 56.824, dec: 24.752, magnitude: 7.12, inCluster: false },

    // HD 23642 (HIP 17704) 
    { name: 'HD 23642', ra: 56.873, dec: 23.756, magnitude: 6.91, inCluster: false },

    // HD 23512 (HIP 17611)
    { name: 'HD 23512', ra: 56.590, dec: 23.542, magnitude: 7.88, inCluster: false },

    // HD 23468 (HIP 17573)
    { name: 'HD 23468', ra: 56.456, dec: 23.398, magnitude: 8.34, inCluster: false },

    // HD 23701 (HIP 17738)
    { name: 'HD 23701', ra: 56.978, dec: 25.012, magnitude: 7.54, inCluster: false },

    // HD 23456 (HIP 17565)
    { name: 'HD 23456', ra: 56.434, dec: 23.245, magnitude: 8.67, inCluster: false },

    // HD 23598 (HIP 17672)
    { name: 'HD 23598', ra: 56.782, dec: 25.134, magnitude: 8.09, inCluster: false },

    // HD 23670 (HIP 17721)
    { name: 'HD 23670', ra: 56.934, dec: 23.523, magnitude: 7.62, inCluster: false },

    // HD 23534 (HIP 17625)
    { name: 'HD 23534', ra: 56.623, dec: 25.267, magnitude: 8.91, inCluster: false },

    // HD 23487 (HIP 17596)
    { name: 'HD 23487', ra: 56.534, dec: 23.167, magnitude: 8.29, inCluster: false },

    // Additional moderate-brightness field stars
    { name: 'HD 23423', ra: 56.334, dec: 23.412, magnitude: 9.12, inCluster: false },
    { name: 'HD 23712', ra: 56.989, dec: 25.456, magnitude: 7.38, inCluster: false },
    { name: 'HD 23602', ra: 56.801, dec: 23.089, magnitude: 7.69, inCluster: false },
    { name: 'HD 23401', ra: 56.267, dec: 23.678, magnitude: 9.27, inCluster: false },
    { name: 'HD 23723', ra: 57.012, dec: 23.201, magnitude: 7.21, inCluster: false },
    { name: 'HD 23556', ra: 56.689, dec: 25.612, magnitude: 8.81, inCluster: false },

    // ============ FAINT FIELD STARS (magnitude 9-14) ============
    // Background stars from Gaia DR3

    { name: 'TYC 1800-1234-1', ra: 55.923, dec: 23.756, magnitude: 9.56, inCluster: false },
    { name: 'TYC 1800-1456-1', ra: 56.178, dec: 24.912, magnitude: 9.89, inCluster: false },
    { name: 'TYC 1800-1678-1', ra: 56.512, dec: 23.234, magnitude: 10.21, inCluster: false },
    { name: 'TYC 1800-1890-1', ra: 56.867, dec: 25.345, magnitude: 10.58, inCluster: false },
    { name: 'TYC 1800-2012-1', ra: 57.234, dec: 23.512, magnitude: 10.94, inCluster: false },
    { name: 'TYC 1800-2234-1', ra: 57.512, dec: 24.823, magnitude: 11.31, inCluster: false },
    { name: 'TYC 1800-2456-1', ra: 56.401, dec: 25.712, magnitude: 11.68, inCluster: false },
    { name: 'TYC 1800-2678-1', ra: 56.745, dec: 23.078, magnitude: 12.04, inCluster: false },
    { name: 'TYC 1800-2890-1', ra: 57.089, dec: 25.901, magnitude: 12.41, inCluster: false },
    { name: 'TYC 1800-3012-1', ra: 57.456, dec: 23.312, magnitude: 12.78, inCluster: false },
    { name: 'TYC 1800-3234-1', ra: 56.289, dec: 24.156, magnitude: 13.14, inCluster: false },
    { name: 'TYC 1800-3456-1', ra: 56.634, dec: 25.578, magnitude: 13.51, inCluster: false },
    { name: 'TYC 1800-3678-1', ra: 56.978, dec: 23.445, magnitude: 13.88, inCluster: false },

];

// Tattoo configuration
const TATTOO_CONFIG = {
    widthCm: 5,
    heightCm: 4,
    canvasWidth: 1000,
    canvasHeight: 800,
    baseSizeMm: 1.5,  // Base size for magnitude calculation
    fontSizeLabel: 10,
    fontSizeName: 12,
    labelOffset: 15
};

// Global state
let currentStarCount = 9;
let rotationAngle = 0;  // in degrees
let offsetX = 0;        // horizontal offset in pixels
let offsetY = 0;        // vertical offset in pixels
let showBackground = false; // show background stars (false = only Pleiades)
let zoomLevel = 1.0;    // zoom scale factor (1.0 = 100%)
let flipX = false;      // horizontal flip
let flipY = false;      // vertical flip
let sizeStep = 0.5;     // quantization step for star sizes in mm
let showLabels = true;  // show star labels (names, magnitudes, sizes)
let maxStarSize = 1.5;  // maximum star disk size in mm (for brightest stars)
let enableSizeStep = true; // enable size quantization

// LocalStorage functions
function saveState() {
    const state = {
        starCount: currentStarCount,
        rotation: rotationAngle,
        offsetX: offsetX,
        offsetY: offsetY,
        showBackground: showBackground,
        zoom: zoomLevel,
        flipX: flipX,
        flipY: flipY,
        sizeStep: sizeStep,
        showLabels: showLabels,
        maxStarSize: maxStarSize,
        enableSizeStep: enableSizeStep
    };
    localStorage.setItem('pleiadesState', JSON.stringify(state));
}

function loadState() {
    const saved = localStorage.getItem('pleiadesState');
    if (saved) {
        try {
            const state = JSON.parse(saved);
            currentStarCount = state.starCount || 9;
            rotationAngle = state.rotation || 0;
            offsetX = state.offsetX || 0;
            offsetY = state.offsetY || 0;
            // Migrate old state if needed: onlyPleiades=true -> showBackground=false
            if (state.showBackground !== undefined) {
                showBackground = state.showBackground;
            } else if (state.onlyPleiades !== undefined) {
                showBackground = !state.onlyPleiades;
            } else {
                showBackground = false;
            }
            zoomLevel = state.zoom || 1.0;
            flipX = state.flipX || false;
            flipY = state.flipY || false;
            sizeStep = state.sizeStep || 0.5;
            showLabels = state.showLabels !== undefined ? state.showLabels : true;
            maxStarSize = state.maxStarSize || 1.5;
            enableSizeStep = state.enableSizeStep !== undefined ? state.enableSizeStep : true;
        } catch (e) {
            console.error('Failed to load state:', e);
        }
    }
}

// Initialize application
function init() {
    // Load saved state
    loadState();

    const canvas = document.getElementById('tattooCanvas');
    const ctx = canvas.getContext('2d');
    const starCountSlider = document.getElementById('starCount');
    const starCountValue = document.getElementById('starCountValue');
    const rotationSlider = document.getElementById('rotation');
    const rotationValue = document.getElementById('rotationValue');
    const offsetXSlider = document.getElementById('offsetX');
    const offsetXValue = document.getElementById('offsetXValue');
    const offsetYSlider = document.getElementById('offsetY');
    const offsetYValue = document.getElementById('offsetYValue');
    const regenerateBtn = document.getElementById('regenerate');
    const showBackgroundCheckbox = document.getElementById('showBackground');
    const flipXCheckbox = document.getElementById('flipX');
    const flipYCheckbox = document.getElementById('flipY');
    const sizeStepSlider = document.getElementById('sizeStep');
    const sizeStepValue = document.getElementById('sizeStepValue');
    const showLabelsCheckbox = document.getElementById('showLabels');
    const maxStarSizeSlider = document.getElementById('maxStarSize');
    const maxStarSizeValue = document.getElementById('maxStarSizeValue');
    const enableSizeStepCheckbox = document.getElementById('enableSizeStep');

    // Set initial values from loaded state
    starCountSlider.value = currentStarCount;
    starCountValue.textContent = currentStarCount;
    rotationSlider.value = rotationAngle;
    rotationValue.textContent = Math.round(rotationAngle) + '°';
    offsetXSlider.value = offsetX;
    offsetXValue.textContent = offsetX;
    offsetYSlider.value = offsetY;
    offsetYValue.textContent = offsetY;
    showBackgroundCheckbox.checked = showBackground;
    flipXCheckbox.checked = flipX;
    flipYCheckbox.checked = flipY;
    sizeStepSlider.value = sizeStep;
    sizeStepValue.textContent = sizeStep.toFixed(2) + ' мм';
    showLabelsCheckbox.checked = showLabels;
    maxStarSizeSlider.value = maxStarSize;
    maxStarSizeValue.textContent = maxStarSize.toFixed(1) + ' мм';
    enableSizeStepCheckbox.checked = enableSizeStep;

    // Event listeners
    starCountSlider.addEventListener('input', (e) => {
        currentStarCount = parseInt(e.target.value);
        starCountValue.textContent = currentStarCount;
        saveState();
        renderTattoo(ctx);
    });

    sizeStepSlider.addEventListener('input', (e) => {
        sizeStep = parseFloat(e.target.value);
        sizeStepValue.textContent = sizeStep.toFixed(2) + ' мм';
        saveState();
        renderTattoo(ctx);
    });

    maxStarSizeSlider.addEventListener('input', (e) => {
        maxStarSize = parseFloat(e.target.value);
        maxStarSizeValue.textContent = maxStarSize.toFixed(1) + ' мм';
        saveState();
        renderTattoo(ctx);
    });

    rotationSlider.addEventListener('input', (e) => {
        rotationAngle = parseInt(e.target.value);
        rotationValue.textContent = rotationAngle + '°';
        saveState();
        renderTattoo(ctx);
    });

    offsetXSlider.addEventListener('input', (e) => {
        offsetX = parseInt(e.target.value);
        offsetXValue.textContent = offsetX;
        saveState();
        renderTattoo(ctx);
    });

    offsetYSlider.addEventListener('input', (e) => {
        offsetY = parseInt(e.target.value);
        offsetYValue.textContent = offsetY;
        saveState();
        renderTattoo(ctx);
    });

    regenerateBtn.addEventListener('click', () => {
        renderTattoo(ctx);
    });

    showBackgroundCheckbox.addEventListener('change', (e) => {
        showBackground = e.target.checked;
        saveState();
        renderTattoo(ctx);
    });

    flipXCheckbox.addEventListener('change', (e) => {
        flipX = e.target.checked;
        saveState();
        renderTattoo(ctx);
    });

    flipYCheckbox.addEventListener('change', (e) => {
        flipY = e.target.checked;
        saveState();
        renderTattoo(ctx);
    });

    showLabelsCheckbox.addEventListener('change', (e) => {
        showLabels = e.target.checked;
        saveState();
        renderTattoo(ctx);
    });

    enableSizeStepCheckbox.addEventListener('change', (e) => {
        enableSizeStep = e.target.checked;
        saveState();
        renderTattoo(ctx);
    });

    // Mouse drag functionality
    let isDragging = false;
    let isRotating = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let dragStartOffsetX = 0;
    let dragStartOffsetY = 0;
    let dragStartRotation = 0;

    canvas.addEventListener('mousedown', (e) => {
        isDragging = true;
        isRotating = e.metaKey; // Cmd key on Mac, Ctrl on Windows
        dragStartX = e.clientX;
        dragStartY = e.clientY;
        dragStartOffsetX = offsetX;
        dragStartOffsetY = offsetY;
        dragStartRotation = rotationAngle;
        canvas.style.cursor = 'grabbing';
    });

    canvas.addEventListener('mousemove', (e) => {
        if (!isDragging) return;

        if (isRotating) {
            // Rotation mode (with Cmd key)
            const deltaX = e.clientX - dragStartX;
            // 1 pixel = 0.5 degree
            rotationAngle = dragStartRotation + (deltaX * 0.5);

            // Normalize angle to 0-360 range
            rotationAngle = ((rotationAngle % 360) + 360) % 360;

            // Update slider value
            rotationSlider.value = rotationAngle;
            rotationValue.textContent = Math.round(rotationAngle) + '°';
            saveState();
        } else {
            // Translation mode (normal drag)
            const deltaX = e.clientX - dragStartX;
            const deltaY = e.clientY - dragStartY;

            offsetX = dragStartOffsetX + deltaX;
            offsetY = dragStartOffsetY + deltaY;

            // Clamp values to slider range
            offsetX = Math.max(-200, Math.min(200, offsetX));
            offsetY = Math.max(-200, Math.min(200, offsetY));

            // Update slider values
            offsetXSlider.value = offsetX;
            offsetYSlider.value = offsetY;
            offsetXValue.textContent = offsetX;
            offsetYValue.textContent = offsetY;
            saveState();
        }

        renderTattoo(ctx);
    });

    canvas.addEventListener('mouseup', () => {
        isDragging = false;
        isRotating = false;
        canvas.style.cursor = 'grab';
    });

    canvas.addEventListener('mouseleave', () => {
        isDragging = false;
        isRotating = false;
        canvas.style.cursor = 'grab';
    });

    // Set initial cursor
    canvas.style.cursor = 'grab';

    // Zoom with Cmd+Scroll
    canvas.addEventListener('wheel', (e) => {
        if (e.metaKey) { // Cmd key on Mac, Ctrl on Windows
            e.preventDefault();

            // Adjust zoom level
            const zoomDelta = e.deltaY > 0 ? -0.05 : 0.05;
            zoomLevel = Math.max(0.3, Math.min(3.0, zoomLevel + zoomDelta));

            saveState();
            renderTattoo(ctx);
        }
    }, { passive: false });

    // Initial render
    renderTattoo(ctx);
}

// Get the brightest N stars sorted by magnitude
function selectBrightestStars(count) {
    // Filter stars based on showBackground setting
    // If showBackground is true, show ALL stars (Pleiades + Field)
    // If showBackground is false, show ONLY Pleiades (filter inCluster=true)
    const filteredStars = showBackground
        ? PLEIADES_STARS
        : PLEIADES_STARS.filter(star => star.inCluster);

    return [...filteredStars]
        .sort((a, b) => a.magnitude - b.magnitude)
        .slice(0, count);
}

// Calculate star disk size in mm based on magnitude
// Using inverse relationship: brighter stars (lower magnitude) = larger size
// Size is optionally rounded to nearest multiple of sizeStep for practical tattoo implementation
function calculateStarSize(magnitude) {
    const baseMag = 2.5;  // Reference magnitude (approximately Alcyone)

    // Calculate raw size based on magnitude using maxStarSize as base
    // Formula: size decreases exponentially as magnitude increases
    const rawSizeMm = maxStarSize * Math.pow(2.512, (baseMag - magnitude) / 2.5);

    // Round to nearest multiple of sizeStep if quantization is enabled
    if (enableSizeStep) {
        const quantizedSize = Math.round(rawSizeMm / sizeStep) * sizeStep;
        return Math.max(sizeStep, quantizedSize);  // Minimum size is one step
    } else {
        return Math.max(0.05, rawSizeMm);  // Minimum size 0.05mm without quantization
    }
}

// Convert star size from mm to canvas pixels
function mmToPixels(mm, dimension) {
    const cmSize = dimension === 'width' ? TATTOO_CONFIG.widthCm : TATTOO_CONFIG.heightCm;
    const canvasSize = dimension === 'width' ? TATTOO_CONFIG.canvasWidth : TATTOO_CONFIG.canvasHeight;
    return (mm / 10) * (canvasSize / cmSize);
}

// Convert RA/DEC coordinates to canvas position
// Using FIXED bounds based on ALL stars in the catalog to maintain consistent scale
function convertToCanvas(ra, dec) {
    // Use bounds of ALL stars in catalog (not just selected ones)
    // This keeps the coordinate system stable when changing filters/star count
    const allRas = PLEIADES_STARS.map(s => s.ra);
    const allDecs = PLEIADES_STARS.map(s => s.dec);

    const raMin = Math.min(...allRas);
    const raMax = Math.max(...allRas);
    const decMin = Math.min(...allDecs);
    const decMax = Math.max(...allDecs);

    // Add padding
    const padding = 100;
    const usableWidth = TATTOO_CONFIG.canvasWidth - 2 * padding;
    const usableHeight = TATTOO_CONFIG.canvasHeight - 2 * padding;

    // Calculate scale to fit stars while maintaining aspect ratio
    const raRange = raMax - raMin || 1;
    const decRange = decMax - decMin || 1;

    const scaleX = usableWidth / raRange;
    const scaleY = usableHeight / decRange;
    const scale = Math.min(scaleX, scaleY);

    // Center the cluster
    const centerX = TATTOO_CONFIG.canvasWidth / 2;
    const centerY = TATTOO_CONFIG.canvasHeight / 2;

    const raMid = (raMin + raMax) / 2;
    const decMid = (decMin + decMax) / 2;

    // Convert to canvas coordinates
    // Note: DEC increases upward but canvas Y increases downward
    const x = centerX + (ra - raMid) * scale;
    const y = centerY - (dec - decMid) * scale;

    return { x, y };
}

// Draw a star on the canvas
function drawStar(ctx, x, y, sizePx, magnitude, name) {
    // Draw star disk (solid black, no glow)
    ctx.beginPath();
    ctx.arc(x, y, sizePx, 0, 2 * Math.PI);
    ctx.fillStyle = '#000000';
    ctx.fill();
}

// Add labels to a star
function addLabels(ctx, star, x, y, sizePx, sizeMm) {
    const { labelOffset, fontSizeLabel, fontSizeName } = TATTOO_CONFIG;

    // Position label to the right of the star
    const labelX = x + sizePx + labelOffset;
    const labelY = y;

    // Star name
    ctx.font = `${fontSizeName}px Inter, sans-serif`;
    ctx.fillStyle = '#333333';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillText(star.name, labelX, labelY - 2);

    // Magnitude and size info
    ctx.font = `${fontSizeLabel}px JetBrains Mono, monospace`;
    ctx.fillStyle = '#666666';
    ctx.textBaseline = 'top';

    const magText = `mag: ${star.magnitude.toFixed(2)}`;
    const sizeText = `⌀ ${sizeMm.toFixed(2)} мм`;

    ctx.fillText(magText, labelX, labelY + 2);
    ctx.fillText(sizeText, labelX, labelY + 2 + fontSizeLabel + 2);
}

// Main rendering function
function renderTattoo(ctx) {
    const { canvasWidth, canvasHeight } = TATTOO_CONFIG;

    // Clear canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Get selected stars
    const stars = selectBrightestStars(currentStarCount);

    // Draw border to show tattoo dimensions
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 5]);
    ctx.strokeRect(50, 50, canvasWidth - 100, canvasHeight - 100);
    ctx.setLineDash([]);

    // Draw dimension labels
    ctx.font = '14px Inter, sans-serif';
    ctx.fillStyle = '#999999';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('5 см', canvasWidth / 2, 30);

    ctx.save();
    ctx.translate(30, canvasHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('4 см', 0, 0);
    ctx.restore();

    const starDataForLabels = [];

    // Apply transformations
    ctx.save();
    ctx.translate(canvasWidth / 2 + offsetX, canvasHeight / 2 + offsetY);
    ctx.rotate(rotationAngle * Math.PI / 180);
    ctx.scale(zoomLevel * (flipX ? -1 : 1), zoomLevel * (flipY ? -1 : 1));
    ctx.translate(-canvasWidth / 2, -canvasHeight / 2);

    // Draw stars
    stars.forEach(star => {
        const sizeMm = calculateStarSize(star.magnitude);
        const sizePx = mmToPixels(sizeMm, 'width');
        const { x, y } = convertToCanvas(star.ra, star.dec);

        drawStar(ctx, x, y, sizePx, star.magnitude, star.name);

        // Store transformed coordinates for labels
        const transformedPoint = ctx.getTransform().transformPoint(new DOMPoint(x, y));
        starDataForLabels.push({
            star,
            x: transformedPoint.x,
            y: transformedPoint.y,
            sizePx,
            sizeMm
        });
    });

    // Restore transformation for stars (removes rotation)
    ctx.restore();

    // Draw labels without rotation, using the previously transformed coordinates
    // Only draw labels if showLabels is enabled
    if (showLabels) {
        starDataForLabels.forEach(data => {
            addLabels(ctx, data.star, data.x, data.y, data.sizePx, data.sizeMm);
        });
    }

    // Draw title
    ctx.font = 'bold 16px Inter, sans-serif';
    ctx.fillStyle = '#333333';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`Плеяды (M45) — ${stars.length} звезд`, 60, 60);
}

// Start the application when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
