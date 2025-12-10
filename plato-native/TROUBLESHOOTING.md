# Troubleshooting Guide

## Login Stuck on Spinning Wheel

### Issue: Login request hangs indefinitely

**Common Causes:**

1. **iOS Simulator can't reach localhost**
   - Simulator uses `127.0.0.1` instead of `localhost`
   - Fixed: API client now converts `localhost` to `127.0.0.1`

2. **Backend not running**
   - Check: `lsof -ti:3000` should show a process
   - Start backend: `cd /Users/matt/plato && npm run dev`

3. **API URL not set in scheme**
   - Check: Edit Scheme → Run → Arguments → Environment Variables
   - Should have: `PLATO_API_URL` = `http://localhost:3000` (or `http://127.0.0.1:3000`)

4. **Network timeout**
   - Added 30 second timeout to requests
   - Check Xcode console for error messages

### Debugging Steps

1. **Check Xcode Console:**
   - Look at bottom panel in Xcode
   - Check for error messages or network logs
   - Look for "Login error:" messages

2. **Test Backend Directly:**
   ```bash
   curl http://127.0.0.1:3000/api/health
   ```
   Should return a response

3. **Check API URL:**
   - In Xcode, add a breakpoint in `APIClient.swift` at line 95
   - Check what `baseURL` is set to
   - Should be `http://127.0.0.1:3000` (not `localhost`)

4. **Test with curl:**
   ```bash
   curl -X POST http://127.0.0.1:3000/api/login \
     -H "Content-Type: application/json" \
     -d '{"email":"your@email.com","password":"yourpassword"}'
   ```

### Quick Fixes

**If still stuck:**

1. **Restart backend:**
   ```bash
   cd /Users/matt/plato
   npm run dev
   ```

2. **Update API URL in scheme:**
   - Edit Scheme → Run → Arguments
   - Set `PLATO_API_URL` = `http://127.0.0.1:3000`

3. **Clean and rebuild:**
   - Product → Clean Build Folder (Shift+Cmd+K)
   - Product → Build (Cmd+B)
   - Run again

4. **Check backend logs:**
   - Look at terminal where `npm run dev` is running
   - See if requests are arriving
   - Check for CORS or other errors

### Network Issues

If using a physical device instead of simulator:
- Use your Mac's IP address: `http://192.168.x.x:3000`
- Find IP: System Settings → Network → Wi-Fi → Details → IP Address
- Make sure Mac and device are on same network


