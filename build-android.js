import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

// Helper to recursively find files with a specific extension
function findFiles(dir, matchExt, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    try {
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        findFiles(filePath, matchExt, fileList);
      } else if (filePath.toLowerCase().endsWith(matchExt.toLowerCase())) {
        fileList.push(filePath);
      }
    } catch (e) {
      // Ignore potential permission errors for system or temporary directories
    }
  }
  return fileList;
}

async function run() {
  console.log('🚀 Starting Android Build and Packaging Pipeline...\n');

  // Ensure android/gradlew is executable (useful for non-Windows environments which might miss executable flags)
  const gradlewPath = path.join(process.cwd(), 'android', 'gradlew');
  if (fs.existsSync(gradlewPath)) {
    try {
      fs.chmodSync(gradlewPath, 0o755);
      console.log('🔑 Set executable permissions on android/gradlew');
    } catch (e) {
      console.warn('⚠️ Could not set executable permissions on android/gradlew:', e.message);
    }
  }

  // 1. Ensure build-artifacts directory exists or create it
  const artifactsDir = path.join(process.cwd(), 'build-artifacts');
  if (!fs.existsSync(artifactsDir)) {
    fs.mkdirSync(artifactsDir, { recursive: true });
    console.log('📁 Created build-artifacts directory.');
  } else {
    // Clear old artifacts
    const oldFiles = fs.readdirSync(artifactsDir);
    for (const f of oldFiles) {
      fs.unlinkSync(path.join(artifactsDir, f));
    }
    console.log('📁 Cleared previous build-artifacts.');
  }

  try {
    // 2. Build web application assets
    console.log('\n📦 Step 1: Building Web App assets (Vite)...');
    execSync('npm run build', { stdio: 'inherit' });

    // 3. Sync assets with Capacitor Android project
    console.log('\n🔄 Step 2: Syncing assets with Android project (Capacitor Sync)...');
    execSync('npx cap sync', { stdio: 'inherit' });

    // 4. Build output APK
    console.log('\n🤖 Step 3: Compiling Android APK (Release)...');
    execSync('npx cap build android --androidreleasetype APK', { stdio: 'inherit' });

    // 5. Build output AAB
    console.log('\n📦 Step 4: Compiling Android App Bundle (AAB)...');
    execSync('npx cap build android --androidreleasetype AAB', { stdio: 'inherit' });

    console.log('\n🔍 Step 5: Locating and copying generated binaries to build-artifacts/ ...');
    
    const outputsDir = path.join(process.cwd(), 'android', 'app', 'build', 'outputs');
    const apks = findFiles(outputsDir, '.apk');
    const aabs = findFiles(outputsDir, '.aab');

    if (apks.length === 0) {
      console.warn('⚠️ No APK files found in standard output folder.');
    } else {
      console.log(`✨ Found ${apks.length} APK files:`);
      apks.forEach((apkPath, index) => {
        const destName = apks.length === 1 ? 'WealthSnap-release.apk' : `WealthSnap-release-${index + 1}.apk`;
        const destPath = path.join(artifactsDir, destName);
        fs.copyFileSync(apkPath, destPath);
        console.log(`   - Copied: ${path.basename(apkPath)} -> build-artifacts/${destName}`);
      });
    }

    if (aabs.length === 0) {
      console.warn('⚠️ No AAB (App Bundle) files found in standard output folder.');
    } else {
      console.log(`✨ Found ${aabs.length} AAB files:`);
      aabs.forEach((aabPath, index) => {
        const destName = aabs.length === 1 ? 'WealthSnap-release.aab' : `WealthSnap-release-${index + 1}.aab`;
        const destPath = path.join(artifactsDir, destName);
        fs.copyFileSync(aabPath, destPath);
        console.log(`   - Copied: ${path.basename(aabPath)} -> build-artifacts/${destName}`);
      });
    }

    console.log('\n✅ Pipeline completed successfully!');
    console.log('📬 Your compiled binaries are available in the "build-artifacts" folder!');
  } catch (error) {
    console.error('\n❌ Build Pipeline Failed!', error.message);
    process.exit(1);
  }
}

run();
