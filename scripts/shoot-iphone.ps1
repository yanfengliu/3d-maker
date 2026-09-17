param(
  [string]$BaseUrl = "http://localhost:5199",
  [string]$OutDir = ".shots",
  [string[]]$Colors = @("cosmic-orange", "deep-blue", "silver"),
  [string[]]$Views = @("hero", "front", "back", "left", "right", "top", "bottom", "camera-closeup"),
  [int]$Width = 1400,
  [int]$Height = 1000
)
$ErrorActionPreference = "Stop"

# `chrome --screenshot` with `--virtual-time-budget` captures before the WebGL
# scene has presented and writes a blank frame, so the matrix is shot through
# scripts/capture-shots.mjs, which drives the same Chrome over the DevTools
# protocol and waits for the page's own window.__shotReady flag.
$list = foreach ($c in $Colors) { foreach ($v in $Views) { "$v`:$c" } }

$env:SHOT_BASE = $BaseUrl
$env:SHOT_OUT = $OutDir
$env:SHOT_W = "$Width"
$env:SHOT_H = "$Height"
$env:SHOT_LIST = ($list -join ",")

& node (Join-Path $PSScriptRoot "capture-shots.mjs")
if ($LASTEXITCODE -ne 0) { Write-Output "FAIL some shots did not report ready" }
