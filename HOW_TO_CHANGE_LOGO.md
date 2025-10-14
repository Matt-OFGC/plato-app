# How to Change the Plato Logo

## Quick Guide

The logo on the landing page is now **always centered** in the navigation bar and is fully editable.

## Where the Logo Appears

1. **Landing Page Navigation** (centered)
2. **Landing Page Footer** (left-aligned)
3. Both use the same file: `/images/plato-logo.svg` or `/images/plato-logo.png`

## How to Change the Logo

### Method 1: Admin Panel (Easiest)

1. **Login to System Admin**
   - Go to: `/system-admin/auth`
   - Enter admin credentials

2. **Navigate to File Management**
   - Click the "Files" tab in admin dashboard
   - You'll see the "File Management" section

3. **Upload New Logo**
   - Click on "Logo Upload" section
   - Click "Click to upload logo"
   - Select your logo file (SVG, PNG, or JPG)
   - File uploads automatically

4. **File Requirements**
   - **Formats:** SVG (recommended), PNG, JPG, JPEG
   - **Max Size:** 10MB
   - **Recommended:** SVG for best quality at any size
   - **Dimensions:** Any size (will auto-scale to fit)

5. **Verify**
   - Go back to landing page
   - Refresh browser (Cmd/Ctrl + R)
   - Logo should be updated and centered!

### Method 2: Direct File Replacement

If you have server/file access:

1. **Locate the logo file:**
   ```
   /public/images/plato-logo.svg
   ```

2. **Replace with your logo:**
   - Keep the same filename: `plato-logo.svg` (or `.png`, `.jpg`)
   - Must be in `/public/images/` folder
   - Redeploy if using Vercel

3. **Refresh:**
   - Clear browser cache
   - Logo updates automatically

## Logo Positioning

**Navigation Bar:**
- **Always centered** using absolute positioning
- Responsive on mobile
- Auto-scales to `h-12` (48px height)
- Width adjusts automatically

**Footer:**
- Left-aligned with company info
- Height: `h-10` (40px)

## Troubleshooting

**Logo not showing after upload:**
1. Check file uploaded successfully (see success message)
2. Hard refresh browser (Cmd/Ctrl + Shift + R)
3. Check file actually exists at `/images/plato-logo.*`
4. Try PNG if SVG doesn't work

**Logo not centered:**
- Already fixed! Uses absolute positioning
- Should be perfectly centered
- Works on all screen sizes

**Upload fails:**
1. Check file size < 10MB
2. Check file format (SVG, PNG, JPG only)
3. Verify you're logged into admin panel
4. Check console for error messages

**Logo too big/small:**
- Height is fixed at 48px (nav) and 40px (footer)
- Width scales automatically
- Create your logo with proper aspect ratio
- Recommended: Square or horizontal logo works best

## File Format Recommendations

**Best:** SVG
- Scales perfectly at any size
- Small file size
- Crisp on retina displays
- Editable

**Good:** PNG
- Transparent background
- High resolution (2x for retina)
- Use if SVG not available

**Okay:** JPG
- No transparency
- Use only if no other option
- White background looks okay

## Logo Design Tips

**For best results:**
1. **Horizontal layout** works best (logo + text)
2. **Aspect ratio:** 3:1 or 4:1 (width:height)
3. **Colors:** Use brand colors
4. **Simplicity:** Clean, readable design
5. **Contrast:** Ensure readable on white background

**Example dimensions:**
- SVG: Any size (vector)
- PNG: 480px × 120px minimum (2x for retina = 960 × 240)
- JPG: Same as PNG

## Fallback System

The logo has automatic fallback:
1. Try to load `/images/plato-logo.svg` first
2. If fails, automatically tries `/images/plato-logo.png`
3. Ensures logo always displays

## Current Setup

**Logo is:**
- ✅ Centered in navigation bar
- ✅ Editable through admin panel
- ✅ Works on mobile, tablet, desktop
- ✅ Responsive sizing
- ✅ Automatic fallback
- ✅ Used consistently across landing page

**To change in future:**
- Simply upload through admin panel
- Or replace file directly
- No code changes needed!

## Admin Panel Access

**URL:** `/system-admin/auth`

**Default credentials:** Set in your environment variables

**After login:**
1. Click "Files" tab
2. See "Logo Upload" card
3. Click to upload
4. Done! ✨

## Testing Checklist

After changing logo:
- [ ] Check landing page - logo centered?
- [ ] Check on mobile - looks good?
- [ ] Check footer - logo showing?
- [ ] Hard refresh browser
- [ ] Check on different browsers
- [ ] Verify it's your new logo, not cached

---

**The logo is now always centered and fully editable - just upload through the admin panel!** 🎨

