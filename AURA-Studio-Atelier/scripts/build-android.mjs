#!/usr/bin/env node
// Android SDK 35 + JDK, or a Java runtime with the official Eclipse ECJ compiler.
// Without an SDK, point AURA_ANDROID_BUILD_TOOLS at a directory with aapt2,
// zipalign, apksigner and lib/d8.jar or dx (e.g. Debian's /usr/lib/android-sdk/
// build-tools/debian) and AURA_ANDROID_JAR at an API 35 android.jar.
// AURA_ANDROID_RES_JAR optionally names a separate framework resource table
// for aapt2 (API 27+), when the API 35 table is newer than that aapt2 reads.
import { existsSync } from "node:fs";
import { mkdir, readFile, readdir, writeFile, rm } from "node:fs/promises";
import { resolve, join } from "node:path";
import { spawnSync } from "node:child_process";

const project = resolve(import.meta.dirname, "..");
const sdk = process.env.AURA_ANDROID_SDK_ROOT || process.env.ANDROID_SDK_ROOT;
const customTools = process.env.AURA_ANDROID_BUILD_TOOLS, customJar = process.env.AURA_ANDROID_JAR;
if (!sdk && !(customTools && customJar)) throw new Error("Set AURA_ANDROID_SDK_ROOT to an Android SDK with platform 35 and build-tools 35.0.0.");
const tools = customTools ? resolve(customTools) : join(sdk, "build-tools", existsSync(join(sdk, "build-tools/35.0.0")) ? "35.0.0" : "android-15");
const androidJar = customJar ? resolve(customJar) : join(sdk, "platforms/android-35/android.jar");
const resourceJar = process.env.AURA_ANDROID_RES_JAR ? resolve(process.env.AURA_ANDROID_RES_JAR) : androidJar;
const build = join(project, "android/build/native");
const output = resolve(process.env.AURA_ANDROID_APK || join(project, "android/build/AURA-Studio.apk"));
const key = resolve(process.env.AURA_ANDROID_KEYSTORE || join(project, "../aura-android-signing/aura-test.keystore"));
const password = process.env.AURA_ANDROID_KEY_PASSWORD || "android";
const alias = process.env.AURA_ANDROID_KEY_ALIAS || "aura-test";
const env = { ...process.env, AURA_SIGN_PASS: password };
function run(command, args) {
  const result = spawnSync(command, args, { cwd: project, env, stdio: "inherit" });
  if (result.status !== 0) throw new Error(`${command} failed (${result.status ?? result.error?.message}).`);
}
async function allFiles(dir, suffix) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(entries.map((entry) => entry.isDirectory() ? allFiles(join(dir, entry.name), suffix) : entry.name.endsWith(suffix) ? [join(dir, entry.name)] : []));
  return files.flat();
}
for (const dir of ["generated", "classes", "dex"]) await rm(join(build, dir), { recursive: true, force: true });
for (const dir of [build, join(build, "generated"), join(build, "classes"), join(build, "dex"), resolve(key, ".."), resolve(output, "..")]) await mkdir(dir, { recursive: true });
let manifest = await readFile(join(project, "android/AndroidManifest.xml"), "utf8");
if (process.env.AURA_ANDROID_DEBUG === "1") manifest = manifest.replace("<application ", '<application android:debuggable="true" ');
await writeFile(join(build, "AndroidManifest.xml"), manifest);
run(join(tools, "aapt2"), ["compile", "--dir", "android/res", "-o", join(build, "resources.zip")]);
run(join(tools, "aapt2"), ["link", "-I", resourceJar, "--manifest", join(build, "AndroidManifest.xml"), "--java", join(build, "generated"), "-o", join(build, "resources.apk"), join(build, "resources.zip")]);
const sources = [...await allFiles(join(project, "android/java"), ".java"), ...await allFiles(join(build, "generated"), ".java")];
const ecj = process.env.AURA_ECJ_JAR;
if (ecj) run("java", ["-jar", ecj, "-source", "1.8", "-target", "1.8", "-classpath", androidJar, "-d", join(build, "classes"), ...sources]);
else run("javac", ["-source", "8", "-target", "8", "-classpath", androidJar, "-d", join(build, "classes"), ...sources]);
if (existsSync(join(tools, "lib/d8.jar"))) run("java", ["-cp", join(tools, "lib/d8.jar"), "com.android.tools.r8.D8", "--lib", androidJar, "--min-api", "26", "--output", join(build, "dex"), ...await allFiles(join(build, "classes"), ".class")]);
// dx does not desugar lambdas; MainActivity is written without them.
else run(join(tools, "dx"), ["--dex", "--min-sdk-version=26", `--output=${join(build, "dex/classes.dex")}`, join(build, "classes")]);
run("python3", ["-c", `
import pathlib, zipfile
build=pathlib.Path(${JSON.stringify(build)})
with zipfile.ZipFile(build/'resources.apk') as source, zipfile.ZipFile(build/'unsigned.apk','w',zipfile.ZIP_DEFLATED) as target:
    for item in source.infolist(): target.writestr(item,source.read(item.filename))
    for path in (build/'dex').glob('*.dex'): target.write(path,path.name)
    web=build.parent/'web'
    for path in web.rglob('*'):
        if path.is_file(): target.write(path,'assets/web/'+str(path.relative_to(web)))
`]);
run(join(tools, "zipalign"), ["-f", "-p", "4", join(build, "unsigned.apk"), join(build, "aligned.apk")]);
if (!existsSync(key)) run("keytool", ["-genkeypair", "-keystore", key, "-storepass:env", "AURA_SIGN_PASS", "-keypass:env", "AURA_SIGN_PASS", "-alias", alias, "-keyalg", "RSA", "-keysize", "2048", "-validity", "10000", "-dname", "CN=AURA Studio Test, O=AURA Studio, C=TR"]);
run(join(tools, "apksigner"), ["sign", "--ks", key, "--ks-key-alias", alias, "--ks-pass", "env:AURA_SIGN_PASS", "--key-pass", "env:AURA_SIGN_PASS", "--out", output, join(build, "aligned.apk")]);
run(join(tools, "apksigner"), ["verify", "--verbose", output]);
run(join(tools, "zipalign"), ["-c", "-p", "4", output]);
console.log(`APK ready: ${output}`);
