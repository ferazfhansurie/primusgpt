# Logo Setup Instructions

## Adding the Logo Images

Please save the two logo images you provided to the following locations:

1. **Dark Background Logo** (with orange/purple gradient triangle and white P)
   - Save as: `public/logo-dark.png`
   - This is used in the navbar

2. **Light Background Logo** (similar design, optimized for light backgrounds)
   - Save as: `public/logo-light.png`
   - This can be used if you add a light mode in the future

## Current Setup

The landing page now includes:

✅ **Loading Screen Animation** 
- Uses `welcome.webp` with a rotating, glowing animation
- Progress bar with gradient effect
- Fades out smoothly after loading completes
- Prevents scrolling during load

✅ **Navbar Logo**
- Displays `welcome.webp` in the header
- Includes "PRIMUSGPT" text with gradient effect
- Scales down when scrolling
- Has hover glow effect

✅ **Responsive Design**
- Logo adapts to different screen sizes
- Mobile-optimized layouts

## Alternative: Use SVG Format

If you prefer SVG format for better scalability:
1. Save the logos as `logo-dark.svg` and `logo-light.svg`
2. Update the references in:
   - `src/components/Layout.tsx` (line with `logo-img`)
   - Keep using `welcome.webp` for the loading screen

## Testing

To see the loading animation every time:
1. Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)
2. The loading screen will appear for ~3 seconds
3. Then smoothly fade to reveal the main page
