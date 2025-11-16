#!/usr/bin/env node
/**
 * Script to remove react-native-worklets from Android CMake autolinking
 * This is needed because react-native-worklets conflicts with react-native-reanimated
 * on Android (both define NativeWorkletsModuleSpecJSI).
 * 
 * We only need react-native-worklets for the Babel plugin, not the native module.
 */

const fs = require('fs');
const path = require('path');

function removeWorkletsFromCmake() {
  const cmakeFile = path.join(
    __dirname,
    '..',
    'android',
    'app',
    'build',
    'generated',
    'autolinking',
    'src',
    'main',
    'jni',
    'Android-autolinking.cmake'
  );

  if (fs.existsSync(cmakeFile)) {
    let content = fs.readFileSync(cmakeFile, 'utf8');
    let modified = false;
    const originalContent = content;
    
    // Remove react-native-worklets subdirectory
    const workletsSubdirRegex = /add_subdirectory\("[^"]*\/react-native-worklets\/[^"]*" rnworklets_autolinked_build\)\n?/g;
    if (workletsSubdirRegex.test(content)) {
      content = content.replace(workletsSubdirRegex, '');
      modified = true;
    }
    
    // Remove react_codegen_rnworklets from AUTOLINKED_LIBRARIES
    const workletsLibRegex = /\s*react_codegen_rnworklets\n?/g;
    if (workletsLibRegex.test(content)) {
      content = content.replace(workletsLibRegex, '');
      modified = true;
    }
    
    // Clean up any double spaces or empty lines
    content = content.replace(/\n\n\n+/g, '\n\n');
    content = content.replace(/\s{2,}/g, ' ');
    
    if (modified || content !== originalContent) {
      fs.writeFileSync(cmakeFile, content);
      console.log('✅ Removed react-native-worklets from Android CMake autolinking');
      return true;
    } else {
      return false;
    }
  } else {
    // CMake file doesn't exist yet - that's okay, it will be generated during build
    return false;
  }
}

// If called directly, run it
if (require.main === module) {
  removeWorkletsFromCmake();
}

// Export for use in other scripts
module.exports = { removeWorkletsFromCmake };

