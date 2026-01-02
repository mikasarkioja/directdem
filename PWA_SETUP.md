# PWA Setup Guide

## Icons Required

The app needs two icon files in the `public` directory:
- `icon-192.png` (192x192 pixels)
- `icon-512.png` (512x512 pixels)

### Creating Icons

You can create icons using:

1. **Online Tools:**
   - https://realfavicongenerator.net/
   - https://www.pwabuilder.com/imageGenerator
   - https://favicon.io/

2. **Design Tools:**
   - Figma
   - Photoshop
   - Canva

3. **Icon Requirements:**
   - Background: Dark blue (#0f172a)
   - Foreground: White or light color
   - Simple design (works well at small sizes)
   - Text: "E" for Eduskuntavahti or a simple logo

### Quick Icon Generation

If you have ImageMagick installed:
```bash
# Create a simple dark blue icon with white "E"
convert -size 192x192 xc:#0f172a -gravity center -pointsize 120 -fill white -annotate +0+0 "E" public/icon-192.png
convert -size 512x512 xc:#0f172a -gravity center -pointsize 320 -fill white -annotate +0+0 "E" public/icon-512.png
```

Or use an online tool to generate from a logo/image.

## Testing PWA

1. **Chrome DevTools:**
   - Open DevTools → Application → Manifest
   - Check for errors
   - Test "Add to Home Screen"

2. **Mobile Testing:**
   - Open on mobile device
   - Look for "Add to Home Screen" prompt
   - Install and test offline functionality

3. **Lighthouse:**
   - Run Lighthouse audit
   - Check PWA score
   - Fix any issues

## Current Status

✅ Manifest.json created
✅ Meta tags added to layout.tsx
✅ Bottom navigation for mobile
✅ Touch-friendly buttons (44x44px minimum)
✅ Mobile-optimized map with zoom controls
✅ Responsive navbar

⏳ Icons need to be created (placeholder files exist)


