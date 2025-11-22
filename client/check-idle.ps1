Add-Type @'
using System;
using System.Runtime.InteropServices;

public class User32 {
    [DllImport("user32.dll")]
    public static extern bool GetLastInputInfo(ref LASTINPUTINFO plii);
}

public struct LASTINPUTINFO {
    public uint cbSize;
    public uint dwTime;
}
'@

$lii = New-Object LASTINPUTINFO
$lii.cbSize = [System.Runtime.InteropServices.Marshal]::SizeOf($lii)

if ([User32]::GetLastInputInfo([ref]$lii)) {
    $idleMillis = [Environment]::TickCount - $lii.dwTime
    [Console]::WriteLine($idleMillis)
}
