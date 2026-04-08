# Avaa Viikkobulletiini ja Lobby-kartta oletusselaimessa.
# Aja tämä tavallisessa PowerShell-ikkunassa (tai Explorerissa: hiiren oikealla → Run with PowerShell),
# ei välttämättä Cursorin upotetussa terminaalissa.
#
#   .\scripts\open-local-dashboard.ps1
#   .\scripts\open-local-dashboard.ps1 -Port 3001

param(
  [int] $Port = 3000
)

$base = "http://localhost:$Port"
$urls = @(
  "$base/dashboard/bulletin",
  "$base/dashboard/lobby-map"
)

foreach ($u in $urls) {
  Write-Host "Opening $u"
  Start-Process $u
}

Write-Host "Valmis. Jos mitään ei auennut, kopioi URLit osoiteriville tai varmista että npm run dev on käynnissä."
