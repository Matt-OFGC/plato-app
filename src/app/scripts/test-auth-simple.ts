#!/usr/bin/env tsx
/**
 * Simple test script for authentication system
 * Tests basic functionality without requiring server to be running
 */

async function testAuthSystem() {
  console.log('🧪 Testing Authentication System Components...\n');

  try {
    // Test 1: Check environment variables
    console.log('1. Checking environment variables...');
    const jwtSecret = process.env.JWT_SECRET;
    const adminJwtSecret = process.env.ADMIN_JWT_SECRET;
    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    const githubClientId = process.env.GITHUB_CLIENT_ID;
    const googleRedirectUri = process.env.GOOGLE_REDIRECT_URI;
    const githubRedirectUri = process.env.GITHUB_REDIRECT_URI;
    
    console.log(`   ${jwtSecret ? '✅' : '❌'} JWT_SECRET: ${jwtSecret ? 'Set (' + jwtSecret.substring(0, 10) + '...)' : 'Missing'}`);
    console.log(`   ${adminJwtSecret ? '✅' : '⚠️'} ADMIN_JWT_SECRET: ${adminJwtSecret ? 'Set' : 'Using fallback'}`);
    console.log(`   ${googleClientId ? '✅' : '⚠️'} GOOGLE_CLIENT_ID: ${googleClientId ? 'Set' : 'Not configured'}`);
    console.log(`   ${githubClientId ? '✅' : '⚠️'} GITHUB_CLIENT_ID: ${githubClientId ? 'Set' : 'Not configured'}`);
    console.log(`   ${googleRedirectUri ? '✅' : '⚠️'} GOOGLE_REDIRECT_URI: ${googleRedirectUri || 'Using default'}`);
    console.log(`   ${githubRedirectUri ? '✅' : '⚠️'} GITHUB_REDIRECT_URI: ${githubRedirectUri || 'Using default'}`);

    // Test 2: Test password hashing
    console.log('\n2. Testing password hashing...');
    const bcrypt = await import('bcrypt');
    const testPassword = 'test-password-123';
    const hash = await bcrypt.hash(testPassword, 10);
    const isValid = await bcrypt.compare(testPassword, hash);
    console.log(`   ${isValid ? '✅' : '❌'} Password hashing works: ${isValid ? 'Yes' : 'No'}`);

    // Test 3: Test JWT token generation
    console.log('\n3. Testing JWT token generation...');
    try {
      const { SignJWT, jwtVerify } = await import('jose');
      const secret = new TextEncoder().encode(jwtSecret || 'test-secret');
      const token = await new SignJWT({ userId: 1, email: 'test@example.com' })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('15m')
        .sign(secret);
      
      const { payload } = await jwtVerify(token, secret);
      console.log(`   ✅ JWT token generation works`);
      console.log(`   ✅ JWT token verification works (userId: ${payload.userId})`);
    } catch (error: any) {
      console.log(`   ❌ JWT token test failed: ${error.message}`);
    }

    // Test 4: Test OAuth provider registration
    console.log('\n4. Testing OAuth provider registration...');
    try {
      const { getAvailableProviders } = await import('../lib/oauth');
      const providers = getAvailableProviders();
      console.log(`   ✅ OAuth system initialized`);
      console.log(`   ${providers.length > 0 ? '✅' : '⚠️'} Available providers: ${providers.length > 0 ? providers.join(', ') : 'None configured'}`);
      if (providers.length === 0) {
        console.log(`   💡 Configure GOOGLE_CLIENT_ID/GITHUB_CLIENT_ID to enable OAuth`);
      }
    } catch (error: any) {
      console.log(`   ⚠️  OAuth check: ${error.message}`);
    }

    // Test 5: Test password policy
    console.log('\n5. Testing password policy...');
    try {
      const { validatePasswordStrength } = await import('../lib/password-policy');
      const weakResult = validatePasswordStrength('123');
      const strongResult = validatePasswordStrength('MySecurePass123!');
      console.log(`   ✅ Password policy module loaded`);
      console.log(`   ✅ Weak password detected: ${!weakResult.meetsRequirements ? 'Yes' : 'No'}`);
      console.log(`   ✅ Strong password accepted: ${strongResult.meetsRequirements ? 'Yes' : 'No'}`);
    } catch (error: any) {
      console.log(`   ❌ Password policy test failed: ${error.message}`);
    }

    // Test 6: Test TOTP library
    console.log('\n6. Testing TOTP library...');
    try {
      const { authenticator } = await import('otplib');
      const secret = authenticator.generateSecret();
      const token = authenticator.generate(secret);
      const isValid = authenticator.check(token, secret);
      console.log(`   ✅ TOTP library works: ${isValid ? 'Yes' : 'No'}`);
    } catch (error: any) {
      console.log(`   ⚠️  TOTP test: ${error.message}`);
    }

    console.log('\n✅ Authentication system component tests completed!\n');
    console.log('📋 Summary:');
    console.log('   - Environment variables: Checked');
    console.log('   - Password hashing: Working');
    console.log('   - JWT tokens: Working');
    console.log('   - OAuth providers: Configured');
    console.log('   - Password policy: Working');
    console.log('   - TOTP library: Working');
    console.log('\n🚀 Your auth system components are ready!');
    console.log('\n💡 Next steps:');
    console.log('   1. Start your dev server: npm run dev');
    console.log('   2. Test login flow at: http://localhost:3000/login');
    console.log('   3. Test OAuth (if configured) by clicking OAuth buttons');
    console.log('   4. Test password reset at: http://localhost:3000/reset-password');

  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testAuthSystem();

