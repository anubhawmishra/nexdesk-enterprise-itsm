<#
.SYNOPSIS
    NexDesk Enterprise IT Support Diagnostics Utility for Windows Workstations.

.DESCRIPTION
    A safe, read-only diagnostic collection utility designed for authorized IT helpdesk
    and desktop support personnel. Collects hardware inventory, operating system build,
    network adapters, IP addresses, DNS resolution tests, and disk free space.

    SAFETY AND PRIVACY GUARANTEES:
    - 100% Read-Only: Does not alter any registry key, firewall rule, or network adapter.
    - Zero Credential Harvesting: Never accesses browser caches, cookies, tokens, or private user directories.
    - Local Execution Only: No automatic data transmission or remote upload.
    - Non-Elevated by Default: Runs cleanly in standard user context; queries that require elevation are safely skipped.

.PARAMETER ExportJson
    Optionally exports the gathered diagnostic payload to a timestamped JSON file on the local Desktop.

.PARAMETER ExportText
    Optionally exports the report to a human-readable text file on the local Desktop.

.EXAMPLE
    powershell.exe -ExecutionPolicy Bypass -File .\Get-ITDiagnostics.ps1
    Runs diagnostics and displays a formatted summary in the console.

.EXAMPLE
    powershell.exe -ExecutionPolicy Bypass -File .\Get-ITDiagnostics.ps1 -ExportJson
    Runs diagnostics and exports a JSON report to the current user's desktop.
#>

[CmdletBinding()]
param(
    [switch]$ExportJson,
    [switch]$ExportText
)

$ErrorActionPreference = "SilentlyContinue"

Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host " NEXDESK IT SUPPORT DIAGNOSTIC UTILITY (READ-ONLY)" -ForegroundColor Cyan
Write-Host "========================================================`n" -ForegroundColor Cyan

$Report = [ordered]@{}
$Report["TimestampUtc"] = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
$Report["ComputerName"] = $env:COMPUTERNAME
$Report["CurrentUsername"] = $env:USERNAME

# 1. Operating System & Hardware
Write-Host "[1/5] Querying Operating System & Hardware..." -ForegroundColor Yellow
try {
    $os = Get-CimInstance -ClassName Win32_OperatingSystem
    $cs = Get-CimInstance -ClassName Win32_ComputerSystem
    $bios = Get-CimInstance -ClassName Win32_BIOS

    $Report["OperatingSystem"] = [ordered]@{
        "Caption"       = $os.Caption
        "Version"       = $os.Version
        "BuildNumber"   = $os.BuildNumber
        "Architecture"  = $os.OSArchitecture
        "LastBootUpTime"= $os.LastBootUpTime.ToString("yyyy-MM-dd HH:mm:ss")
    }

    $Report["Hardware"] = [ordered]@{
        "Manufacturer"  = $cs.Manufacturer
        "Model"         = $cs.Model
        "TotalRamGb"    = [math]::Round($cs.TotalPhysicalMemory / 1GB, 2)
        "BiosVersion"   = $bios.SMBIOSBIOSVersion
        "SerialNumber"  = $bios.SerialNumber
    }

    Write-Host "  -> OS: $($os.Caption) (Build $($os.BuildNumber))" -ForegroundColor Green
    Write-Host "  -> Device: $($cs.Manufacturer) $($cs.Model) (S/N: $($bios.SerialNumber))" -ForegroundColor Green
} catch {
    Write-Host "  -> Error collecting OS/Hardware info: $_" -ForegroundColor Red
}

# 2. Disk Free Space
Write-Host "`n[2/5] Evaluating Storage Volumes..." -ForegroundColor Yellow
try {
    $disks = Get-CimInstance -ClassName Win32_LogicalDisk -Filter "DriveType=3"
    $diskList = @()
    foreach ($d in $disks) {
        $freeGb = [math]::Round($d.FreeSpace / 1GB, 2)
        $totalGb = [math]::Round($d.Size / 1GB, 2)
        $percentFree = if ($totalGb -gt 0) { [math]::Round(($freeGb / $totalGb) * 100, 1) } else { 0 }

        $statusColor = if ($percentFree -lt 15) { "Red" } else { "Green" }
        Write-Host "  -> Drive $($d.DeviceID): Free $freeGb GB of $totalGb GB ($percentFree% free)" -ForegroundColor $statusColor

        $diskList += [ordered]@{
            "Drive"       = $d.DeviceID
            "FreeSpaceGb" = $freeGb
            "TotalSpaceGb"= $totalGb
            "PercentFree" = $percentFree
        }
    }
    $Report["Storage"] = $diskList
} catch {
    Write-Host "  -> Storage check failed: $_" -ForegroundColor Red
}

# 3. Active Network Adapters & IP Configuration
Write-Host "`n[3/5] Inspecting Network Interfaces..." -ForegroundColor Yellow
try {
    $adapters = Get-NetIPConfiguration | Where-Object { $_.IPv4Address -ne $null }
    $netList = @()
    foreach ($a in $adapters) {
        $ip = ($a.IPv4Address | Select-Object -ExpandProperty IPAddress) -join ", "
        $gateway = ($a.IPv4DefaultGateway | Select-Object -ExpandProperty NextHop) -join ", "
        $dns = ($a.DNSServer | Select-Object -ExpandProperty ServerAddresses) -join ", "

        Write-Host "  -> Interface: $($a.InterfaceAlias)" -ForegroundColor Green
        Write-Host "     IPv4: $ip | Gateway: $gateway" -ForegroundColor Gray
        Write-Host "     DNS Servers: $dns" -ForegroundColor Gray

        $netList += [ordered]@{
            "InterfaceAlias" = $a.InterfaceAlias
            "IPv4Addresses"  = $ip
            "DefaultGateway" = $gateway
            "DnsServers"     = $dns
        }
    }
    $Report["NetworkAdapters"] = $netList
} catch {
    Write-Host "  -> Network inspection failed: $_" -ForegroundColor Red
}

# 4. Connectivity & DNS Resolution Test
Write-Host "`n[4/5] Testing DNS Resolution & Network Latency..." -ForegroundColor Yellow
$testTargets = @("1.1.1.1", "google.com")
$connResults = @()

foreach ($target in $testTargets) {
    try {
        $ping = Test-Connection -ComputerName $target -Count 2 -Quiet
        $dnsStatus = "N/A (IP)"
        if ($target -notmatch "^\d+\.\d+\.\d+\.\d+$") {
            $resolve = Resolve-DnsName -Name $target -Type A -ErrorAction SilentlyContinue
            $dnsStatus = if ($resolve) { "Resolved ($($resolve[0].IPAddress))" } else { "Failed" }
        }

        $resColor = if ($ping) { "Green" } else { "Red" }
        Write-Host "  -> Target $($target): Ping Success: $ping | DNS: $dnsStatus" -ForegroundColor $resColor

        $connResults += [ordered]@{
            "Target"     = $target
            "Reachable"  = $ping
            "DnsStatus"  = $dnsStatus
        }
    } catch {
        Write-Host "  -> Connectivity test for $target failed: $_" -ForegroundColor Red
    }
}
$Report["ConnectivityTests"] = $connResults

# 5. Output Summary & Optional Export
Write-Host "`n[5/5] Diagnostic Run Complete." -ForegroundColor Cyan

if ($ExportJson) {
    $desktopPath = [Environment]::GetFolderPath("Desktop")
    $jsonFileName = "NexDesk-Diagnostics-$($env:COMPUTERNAME)-$((Get-Date).ToString('yyyyMMdd-HHmmss')).json"
    $fullJsonPath = Join-Path -Path $desktopPath -ChildPath $jsonFileName

    $Report | ConvertTo-Json -Depth 5 | Out-File -FilePath $fullJsonPath -Encoding utf8
    Write-Host "`n[+] JSON Diagnostic Report saved to: $fullJsonPath" -ForegroundColor Green
}

if ($ExportText) {
    $desktopPath = [Environment]::GetFolderPath("Desktop")
    $txtFileName = "NexDesk-Diagnostics-$($env:COMPUTERNAME)-$((Get-Date).ToString('yyyyMMdd-HHmmss')).txt"
    $fullTxtPath = Join-Path -Path $desktopPath -ChildPath $txtFileName

    $textOutput = @"
======================================================
 NEXDESK IT SUPPORT DIAGNOSTIC REPORT
 Generated: $($Report.TimestampUtc)
 Workstation: $($Report.ComputerName) | User: $($Report.CurrentUsername)
======================================================

OPERATING SYSTEM:
Caption: $($Report.OperatingSystem.Caption)
Build: $($Report.OperatingSystem.BuildNumber) ($($Report.OperatingSystem.Architecture))
Last Boot: $($Report.OperatingSystem.LastBootUpTime)

HARDWARE:
Make & Model: $($Report.Hardware.Manufacturer) $($Report.Hardware.Model)
Serial Number: $($Report.Hardware.SerialNumber)
Memory: $($Report.Hardware.TotalRamGb) GB

STORAGE:
$(($Report.Storage | ForEach-Object { "$($_.Drive) Free: $($_.FreeSpaceGb) GB of $($_.TotalSpaceGb) GB ($($_.PercentFree)% free)" }) -join "`n")

NETWORK INTERFACES:
$(($Report.NetworkAdapters | ForEach-Object { "$($_.InterfaceAlias) - IP: $($_.IPv4Addresses) | DNS: $($_.DnsServers)" }) -join "`n")

CONNECTIVITY TESTS:
$(($Report.ConnectivityTests | ForEach-Object { "$($_.Target) - Reachable: $($_.Reachable) | DNS: $($_.DnsStatus)" }) -join "`n")
======================================================
"@
    $textOutput | Out-File -FilePath $fullTxtPath -Encoding utf8
    Write-Host "`n[+] Text Diagnostic Report saved to: $fullTxtPath" -ForegroundColor Green
}

Write-Host "`nDiagnostic capture finished safely.`n" -ForegroundColor Cyan
