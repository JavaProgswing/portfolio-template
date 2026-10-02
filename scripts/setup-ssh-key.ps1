# One-time: create an SSH key (if needed) and install it on the deploy server
# so `npm run deploy:ssh` can log in without a password. The host defaults to
# deploy.publicHost from portfolio.config.json.
param(
  [string]$HostAlias = "",
  [string]$KeyName = "id_ed25519"
)

$ErrorActionPreference = "Stop"

function Require-Command([string]$Name) {
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "Missing required command: $Name"
  }
}

if (-not $HostAlias) {
  $configPath = Join-Path (Resolve-Path "$PSScriptRoot\..") "portfolio.config.json"
  if (Test-Path $configPath) { $HostAlias = (Get-Content $configPath -Raw | ConvertFrom-Json).deploy.publicHost }
}
if (-not $HostAlias) { throw "No host given. Pass -HostAlias user@host or set deploy.publicHost in portfolio.config.json." }

Require-Command "ssh"
Require-Command "ssh-keygen"
Require-Command "scp"

$sshDir = Join-Path $HOME ".ssh"
$privateKey = Join-Path $sshDir $KeyName
$publicKey = "$privateKey.pub"

if (-not (Test-Path $publicKey)) {
  New-Item -ItemType Directory -Force -Path $sshDir | Out-Null
  Write-Host "-> creating SSH key at $privateKey"
  & ssh-keygen -t ed25519 -f $privateKey -N ""
  if ($LASTEXITCODE -ne 0) { throw "ssh-keygen failed" }
}

Write-Host "-> installing public key on $HostAlias"
$remoteTempKey = "/tmp/$KeyName.pub"
& scp $publicKey "${HostAlias}:$remoteTempKey"
if ($LASTEXITCODE -ne 0) { throw "scp public key upload failed" }

$remoteCommand = @"
umask 077
mkdir -p ~/.ssh
touch ~/.ssh/authorized_keys
cat $remoteTempKey >> ~/.ssh/authorized_keys
sort -u ~/.ssh/authorized_keys -o ~/.ssh/authorized_keys
rm -f $remoteTempKey
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
"@
& ssh $HostAlias $remoteCommand
if ($LASTEXITCODE -ne 0) { throw "ssh key install failed" }

Write-Host "-> testing key-based login"
& ssh -o BatchMode=yes -i $privateKey $HostAlias "echo ok"
if ($LASTEXITCODE -ne 0) { throw "key-based login test failed" }

Write-Host "-> success. Deploy with: npm run deploy:ssh"
