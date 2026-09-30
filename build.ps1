# WASM v2.0 Build Script (Windows)
# Usage:
#   .\build.ps1
#   .\build.ps1 --size
#   .\build.ps1 --minimal
#   .\build.ps1 --performance
#   .\build.ps1 --debug
#   .\build.ps1 --clean

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$BuildDir = Join-Path $ScriptDir "build"
$OutputDir = Join-Path $ScriptDir "wasm-output"
$SrcDir = Join-Path $ScriptDir "src"

$BuildMinimal = "OFF"
$OptimizationLevel = "O3"
$EnableLto = "ON"
$EnableExceptions = "ON"
$CleanBuild = "OFF"
$RunWasmOpt = "OFF"
$WasmOptLevel = "Oz"

foreach ($arg in $args) {
    switch ($arg) {
        "--size" { $OptimizationLevel = "Oz"; $RunWasmOpt = "ON" }
        "--performance" { $OptimizationLevel = "O3"; $RunWasmOpt = "OFF" }
        "--minimal" { $BuildMinimal = "ON"; $OptimizationLevel = "Oz"; $RunWasmOpt = "ON" }
        "--debug" { $OptimizationLevel = "O2"; $EnableLto = "OFF"; $RunWasmOpt = "OFF" }
        "--clean" { $CleanBuild = "ON" }
        "--no-wasm-opt" { $RunWasmOpt = "OFF" }
        "--help" {
            Write-Host "Usage: .\build.ps1 [options]"
            Write-Host ""
            Write-Host "Options:"
            Write-Host "  --size        Build full version optimized for size (-Oz)"
            Write-Host "  --minimal     Build minimal version (smaller size, -Oz)"
            Write-Host "  --performance Build full version optimized for speed (-O3)"
            Write-Host "  --debug       Build debug version (-O2, no LTO)"
            Write-Host "  --clean       Clean build directory before building"
            Write-Host "  --no-wasm-opt Skip wasm-opt post-processing"
            exit 0
        }
        default {
            Write-Host "Unknown option: $arg"
            Write-Host "Use --help for usage information"
            exit 1
        }
    }
}

function Import-EmsdkEnv {
    if (Get-Command emcmake -ErrorAction SilentlyContinue) {
        return
    }

    $candidates = @(
        $env:EMSDK,
        (Join-Path $env:USERPROFILE "emsdk"),
        "C:\emsdk"
    ) | Where-Object { $_ }

    foreach ($root in $candidates) {
        $envScript = Join-Path $root "emsdk_env.ps1"
        if (Test-Path $envScript) {
            Write-Host "Activating Emscripten SDK: $root"
            . $envScript
            return
        }
    }

    throw @"
emcmake not found. Install and activate the Emscripten SDK first:

  git clone https://github.com/emscripten-core/emsdk.git $env:USERPROFILE\emsdk
  cd $env:USERPROFILE\emsdk
  .\emsdk install latest
  .\emsdk activate latest
  .\emsdk_env.ps1

Guide: https://emscripten.org/docs/getting_started/downloads.html
"@
}

function Import-CmakeNinja {
    $cmakeDir = $null
    $ninjaDir = $null

    if (-not (Get-Command cmake -ErrorAction SilentlyContinue)) {
        $vswhere = Join-Path ${env:ProgramFiles(x86)} "Microsoft Visual Studio\Installer\vswhere.exe"
        if (Test-Path $vswhere) {
            $vsRoot = & $vswhere -latest -products * -property installationPath 2>$null
            if ($vsRoot) {
                $candidateCmake = Join-Path $vsRoot "Common7\IDE\CommonExtensions\Microsoft\CMake\CMake\bin"
                $candidateNinja = Join-Path $vsRoot "Common7\IDE\CommonExtensions\Microsoft\CMake\Ninja"
                if (Test-Path (Join-Path $candidateCmake "cmake.exe")) {
                    $cmakeDir = $candidateCmake
                }
                if (Test-Path (Join-Path $candidateNinja "ninja.exe")) {
                    $ninjaDir = $candidateNinja
                }
            }
        }
    }

    if ($cmakeDir) {
        $env:PATH = "$cmakeDir;$env:PATH"
        Write-Host "Using CMake: $(Join-Path $cmakeDir 'cmake.exe')"
    }
    if ($ninjaDir -and -not (Get-Command ninja -ErrorAction SilentlyContinue)) {
        $env:PATH = "$ninjaDir;$env:PATH"
        Write-Host "Using Ninja: $(Join-Path $ninjaDir 'ninja.exe')"
    }

    if (-not (Get-Command cmake -ErrorAction SilentlyContinue)) {
        throw "cmake not found. Install CMake, or Visual Studio with the CMake component."
    }
    if (-not (Get-Command ninja -ErrorAction SilentlyContinue)) {
        throw "ninja not found. Install Ninja, or Visual Studio with the CMake component."
    }
}

function Invoke-EmsdkCommand {
    param([string]$CommandLine)
    cmd.exe /c $CommandLine
    if ($LASTEXITCODE -ne 0) {
        throw "Command failed ($LASTEXITCODE): $CommandLine"
    }
}

function Copy-IfExists {
    param([string]$From, [string]$To)
    if (Test-Path $From) {
        Copy-Item -Force $From $To
        return $true
    }
    return $false
}

Write-Host "=== HTML Layout Parser v2.0 WASM Build Script (Windows) ==="
Write-Host ""
Write-Host "Build Configuration:"
Write-Host "  Minimal Build: $BuildMinimal"
Write-Host "  Optimization:  -$OptimizationLevel"
Write-Host "  LTO Enabled:   $EnableLto"
Write-Host "  Exceptions:    $EnableExceptions"
Write-Host "  WASM Opt:      $RunWasmOpt (-$WasmOptLevel)"
Write-Host ""

Import-EmsdkEnv
Import-CmakeNinja

if (-not (Get-Command emcmake -ErrorAction SilentlyContinue)) {
    throw "emcmake still not found after activating Emscripten SDK."
}

if ($CleanBuild -eq "ON" -and (Test-Path $BuildDir)) {
    Write-Host "Cleaning build directory..."
    Remove-Item -Recurse -Force $BuildDir
}

if (-not (Test-Path $BuildDir)) {
    Write-Host "Creating build directory: $BuildDir"
    New-Item -ItemType Directory -Force -Path $BuildDir | Out-Null
}

Push-Location $BuildDir
try {
    Write-Host "Running CMake configuration..."
    $cmakeArgs = @(
        "emcmake cmake `"$SrcDir`"",
        "-G Ninja",
        "-DCMAKE_BUILD_TYPE=Release",
        "-DBUILD_MINIMAL=$BuildMinimal",
        "-DOPTIMIZATION_LEVEL=$OptimizationLevel",
        "-DENABLE_LTO=$EnableLto",
        "-DENABLE_EXCEPTIONS=$EnableExceptions"
    ) -join " "
    Invoke-EmsdkCommand $cmakeArgs

    Write-Host ""
    Write-Host "Compiling WASM module..."
    $jobs = $env:NUMBER_OF_PROCESSORS
    if (-not $jobs) { $jobs = 4 }
    Invoke-EmsdkCommand "cmake --build . --parallel $jobs"
}
finally {
    Pop-Location
}

Write-Host ""
Write-Host "=== Build Complete ==="
Write-Host ""

New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null

if (Copy-IfExists (Join-Path $BuildDir "html_layout_parser_esm.mjs") (Join-Path $OutputDir "html_layout_parser.mjs")) {
    Write-Host "ESM module: html_layout_parser.mjs"
}
if (Copy-IfExists (Join-Path $BuildDir "html_layout_parser_cjs.js") (Join-Path $OutputDir "html_layout_parser.cjs")) {
    Write-Host "CommonJS module: html_layout_parser.cjs"
}
if (Copy-IfExists (Join-Path $BuildDir "html_layout_parser_esm.wasm") (Join-Path $OutputDir "html_layout_parser.wasm")) {
    Write-Host "Unified WASM binary: html_layout_parser.wasm"
} elseif (Copy-IfExists (Join-Path $BuildDir "html_layout_parser.wasm") (Join-Path $OutputDir "html_layout_parser.wasm")) {
    Write-Host "Original WASM binary: html_layout_parser.wasm"
}
if (Copy-IfExists (Join-Path $BuildDir "html_layout_parser_esm.d.ts") (Join-Path $OutputDir "html_layout_parser.d.ts")) {
    Write-Host "TypeScript declarations: html_layout_parser.d.ts"
}
if (Copy-IfExists (Join-Path $SrcDir "html_layout_parser.d.ts") (Join-Path $OutputDir "html_layout_parser_types.d.ts")) {
    Write-Host "Custom TypeScript declarations: html_layout_parser_types.d.ts"
}

$mjs = Join-Path $OutputDir "html_layout_parser.mjs"
$js = Join-Path $OutputDir "html_layout_parser.js"
if (Test-Path $mjs) {
    Copy-Item -Force $mjs $js
    Write-Host "Legacy copy: html_layout_parser.js"
}

if ($RunWasmOpt -eq "ON") {
    $wasmOpt = $null
    if ($env:WASM_OPT_BIN -and (Test-Path $env:WASM_OPT_BIN)) {
        $wasmOpt = $env:WASM_OPT_BIN
    } elseif (Get-Command wasm-opt -ErrorAction SilentlyContinue) {
        $wasmOpt = (Get-Command wasm-opt).Source
    } elseif ($env:EMSDK) {
        $candidate = Join-Path $env:EMSDK "upstream\bin\wasm-opt.exe"
        if (Test-Path $candidate) { $wasmOpt = $candidate }
    }

    $wasmFile = Join-Path $OutputDir "html_layout_parser.wasm"
    if ($wasmOpt) {
        Write-Host "Running wasm-opt (-$WasmOptLevel)..."
        $optOut = Join-Path $OutputDir "html_layout_parser.wasm.opt"
        & $wasmOpt "-$WasmOptLevel" --enable-threads --enable-bulk-memory --enable-nontrapping-float-to-int -o $optOut $wasmFile
        if ($LASTEXITCODE -ne 0) {
            throw "wasm-opt failed"
        }
        Move-Item -Force $optOut $wasmFile
    } else {
        Write-Host "WARNING: wasm-opt not found; skipping post-processing"
    }
}

Write-Host "Output files copied to: $OutputDir"
$wasmFile = Join-Path $OutputDir "html_layout_parser.wasm"
$jsFile = Join-Path $OutputDir "html_layout_parser.js"
$wasmSize = if (Test-Path $wasmFile) { (Get-Item $wasmFile).Length } else { 0 }
$jsSize = if (Test-Path $jsFile) { (Get-Item $jsFile).Length } else { 0 }

Write-Host ""
Write-Host "File sizes:"
Write-Host ("  WASM: {0:N2} KB ({1} bytes)" -f ($wasmSize / 1024), $wasmSize)
Write-Host ("  JS:   {0:N2} KB ({1} bytes)" -f ($jsSize / 1024), $jsSize)
Write-Host ""

$targetSize = if ($BuildMinimal -eq "ON") { 307200 } else { 2097152 }
$targetName = if ($BuildMinimal -eq "ON") { "minimal" } else { "full" }
if ($wasmSize -gt $targetSize) {
    Write-Host "WARNING: WASM size ($wasmSize bytes) exceeds $targetName target ($targetSize bytes)"
} else {
    Write-Host "WASM size is within $targetName target"
}
