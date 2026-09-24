# Capture the PICO Emulator's host window with PrintWindow(PW_RENDERFULLCONTENT).
# Clean frames every time on 2026-09-24 when in-guest screencap bursts were >30% black
# (spatial-crack, labs/SPATIAL-CRACK.md). Host-side only: it never talks to the emulator.
#   powershell -NoProfile -ExecutionPolicy Bypass -File setup\printwindow.ps1 -Out C:\path\shot.png
param([Parameter(Mandatory = $true)][string]$Out)
$ErrorActionPreference = 'Stop'
Add-Type @"
using System; using System.Runtime.InteropServices;
public class PW { [StructLayout(LayoutKind.Sequential)] public struct RECT { public int L,T,R,B; }
 [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out RECT r);
 [DllImport("user32.dll")] public static extern bool PrintWindow(IntPtr h, IntPtr hdc, uint f);
 [DllImport("user32.dll")] public static extern bool SetProcessDPIAware(); }
"@
Add-Type -AssemblyName System.Drawing
[PW]::SetProcessDPIAware() | Out-Null
$p = Get-Process qemu-system-x86_64 -ErrorAction SilentlyContinue | Where-Object MainWindowTitle -like 'PICO Emulator*' | Select-Object -First 1
if (-not $p) { Write-Error 'No "PICO Emulator" window found'; exit 2 }
$r = New-Object PW+RECT; [PW]::GetWindowRect($p.MainWindowHandle, [ref]$r) | Out-Null
$bmp = New-Object System.Drawing.Bitmap ($r.R - $r.L), ($r.B - $r.T)
$g = [System.Drawing.Graphics]::FromImage($bmp); $dc = $g.GetHdc()
$ok = [PW]::PrintWindow($p.MainWindowHandle, $dc, 2)   # 2 = PW_RENDERFULLCONTENT
$g.ReleaseHdc($dc); $g.Dispose()
$bmp.Save($Out, [System.Drawing.Imaging.ImageFormat]::Png); $bmp.Dispose()
if (-not $ok) { exit 3 }
"ok $($r.R - $r.L)x$($r.B - $r.T) $Out"
