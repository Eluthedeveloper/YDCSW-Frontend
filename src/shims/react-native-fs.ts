/**
 * Stub for `react-native-fs`.
 *
 * `jsmediatags` ships a React Native file reader that requires this package at
 * the top of its CommonJS entry point. The app only ever reads browser `File`
 * objects, so the React Native reader is never instantiated; this stub satisfies
 * the import without pulling a native module into the bundle.
 */
export default {};