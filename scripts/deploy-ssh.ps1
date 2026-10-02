# Build the site and publish dist/ to an nginx web root over SSH.
# Settings come from the "deploy" block of portfolio.config.json; any parameter
# passed on the command line overrides the config value.
#
#   npm run deploy:ssh                  # normal deploy
#   npm run deploy:ssh -- -SkipFetch    # skip the GitHub repo refresh
param(
  [string]$HostAlias = "",
  [string]$PublicHost = "",
  [string]$Domain = "",
  [string]$HtmlDir = "",
  [string]$StageDir = "",
  [string]$IdentityFile = "",
  [switch]$SkipFetch,
  [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"
$root = Resolve-Path "$PSScriptRoot\.."

function Require-Command([string]$Name) {
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "Missing required command: $Name"
  }
}

function Expand-Home([string]$Path) {
  if ($Path -and $Path.StartsWith("~")) { return Join-Path $HOME $Path.Substring(1).TrimStart("/", "\") }
  return $Path
}

# --- config -----------------------------------------------------------------
$configPath = Join-Path $root "portfolio.config.json"
if (-not (Test-Path $configPath)) {
  throw "portfolio.config.json not found. Copy portfolio.config.example.json and fill in the deploy block."
}
$cfg = (Get-Content $configPath -Raw | ConvertFrom-Json).deploy
if (-not $cfg) { throw "portfolio.config.json has no deploy block." }

$aliases = @()
if ($HostAlias) { $aliases = @($HostAlias) } elseif ($cfg.sshAliases) { $aliases = @($cfg.sshAliases) }
if (-not $PublicHost) { $PublicHost = $cfg.publicHost }
if (-not $Domain) { $Domain = $cfg.domain }
if (-not $HtmlDir) { $HtmlDir = $cfg.htmlDir }
if (-not $StageDir) { $StageDir = if ($cfg.stageDir) { $cfg.stageDir } else { "/tmp/portfolio-deploy" } }
if (-not $IdentityFile) { $IdentityFile = if ($cfg.identityFile) { $cfg.identityFile } else { "~/.ssh/id_ed25519" } }
$IdentityFile = Expand-Home $IdentityFile
$healthPath = if ($cfg.healthPath) { $cfg.healthPath } else { "" }

foreach ($pair in @(@("domain", $Domain), @("htmlDir", $HtmlDir))) {
  if (-not $pair[1]) { throw "deploy.$($pair[0]) is missing in portfolio.config.json." }
}
if (-not $PublicHost -and $aliases.Count -eq 0) { throw "Set deploy.publicHost or deploy.sshAliases in portfolio.config.json." }

# --- ssh helpers ----------------------------------------------------------------
$sshOptions = @(
  "-o", "BatchMode=yes",
  "-o", "ConnectTimeout=6",
  "-o", "ConnectionAttempts=1",
  "-o", "ServerAliveInterval=5",
  "-o", "ServerAliveCountMax=2",
  "-i", $IdentityFile
)

function Test-SshTarget([string]$Target) {
  $previous = $ErrorActionPreference
  try {
    $ErrorActionPreference = "Continue"
    & ssh @sshOptions $Target "true" 2>$null
    return $LASTEXITCODE -eq 0
  } finally {
    $ErrorActionPreference = $previous
  }
}

function Resolve-DeployTarget {
  # Prefer a local alias (LAN / ~/.ssh/config), fall back to the public host.
  foreach ($alias in $aliases) {
    Write-Host "-> trying SSH target $alias..."
    if (Test-SshTarget $alias) { return $alias }
  }
  if (-not $PublicHost) { throw "No SSH alias reachable and no deploy.publicHost configured." }
  Write-Host "-> using public SSH target $PublicHost"
  return $PublicHost
}

function Invoke-SshCommand([string]$RemoteCommand, [switch]$AllocateTty) {
  $options = $sshOptions
  if ($AllocateTty) { $options += "-tt" }
  & ssh @options $script:DeployTarget $RemoteCommand
  if ($LASTEXITCODE -ne 0) { throw "SSH command failed on $script:DeployTarget." }
}

function Invoke-ScpCopy([string]$Source, [string]$Destination) {
  & scp @sshOptions -r $Source $Destination
  if ($LASTEXITCODE -ne 0) { throw "SCP upload failed to $script:DeployTarget." }
}

# --- deploy -------------------------------------------------------------------
Require-Command "npm"
Require-Command "ssh"
Require-Command "scp"

if (-not (Test-Path $IdentityFile)) {
  throw "SSH key not found at '$IdentityFile'. Run 'npm run setup:ssh' first."
}

Push-Location $root
try {
  $script:DeployTarget = Resolve-DeployTarget
  Write-Host "-> connected to $script:DeployTarget"

  if (-not $SkipFetch) {
    Write-Host "-> refreshing repository data..."
    & npm run fetch-repos
    if ($LASTEXITCODE -ne 0) { Write-Warning "fetch-repos failed; deploying with the existing repository data." }
  }

  Write-Host "-> probing live deployments..."
  & npm run probe-deploys
  if ($LASTEXITCODE -ne 0) { Write-Warning "probe-deploys failed; using the existing deploy-status.json." }

  if (-not $SkipBuild) {
    Write-Host "-> building..."
    & npm run build
    if ($LASTEXITCODE -ne 0) { throw "Build failed." }
  }

  try {
    Invoke-SshCommand "test -w '$HtmlDir'" 2>$null
  } catch {
    Write-Host "-> first-time setup: granting your SSH user access to the nginx web root"
    $bootstrap = 'sudo mkdir -p ''{0}'' && sudo chown -R "$(id -un):www-data" ''{0}'' && sudo chmod -R u+rwX,go+rX ''{0}''' -f $HtmlDir
    Invoke-SshCommand $bootstrap -AllocateTty
  }

  Write-Host "-> preparing remote staging directory..."
  Invoke-SshCommand "rm -rf '$StageDir' && mkdir -p '$StageDir'"

  Write-Host "-> uploading dist/ to $script:DeployTarget..."
  Invoke-ScpCopy ".\dist\*" "${script:DeployTarget}:$StageDir/"

  Write-Host "-> publishing to $HtmlDir..."
  Invoke-SshCommand "rsync -a --delete '$StageDir/' '$HtmlDir/' && chmod -R u+rwX,go+rX '$HtmlDir' && rm -rf '$StageDir'"

  Write-Host "-> verifying https://$Domain..."
  $probe = if ($healthPath) { "https://$Domain$healthPath" } else { "https://$Domain/" }
  $health = Invoke-WebRequest -Uri $probe -UseBasicParsing -TimeoutSec 15
  if ($health.StatusCode -ne 200) { throw "Health check returned HTTP $($health.StatusCode) for $probe." }

  Write-Host "-> deployed successfully: https://$Domain"
} finally {
  Pop-Location
}
