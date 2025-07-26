!include "MUI2.nsh"
!include "nsDialogs.nsh"

; Variables for IP configuration
Var Dialog
Var Label
Var Text
Var ServerIP

; Custom page for IP configuration
Page custom ShowIPConfigPage IPConfigPageLeave

Function ShowIPConfigPage
    !insertmacro MUI_HEADER_TEXT "Server Configuration" "Configure the server IP address"
    
    nsDialogs::Create 1018
    Pop $Dialog
    
    ${If} $Dialog == error
        Abort
    ${EndIf}
    
    ; Create label
    ${NSD_CreateLabel} 0 0 100% 12u "Enter the server IP address:"
    Pop $Label
    
    ; Create text input
    ${NSD_CreateText} 0 20u 100% 12u "localhost"
    Pop $Text
    
    nsDialogs::Show
FunctionEnd

Function IPConfigPageLeave
    ${NSD_GetText} $Text $ServerIP
    
    ; Validate IP address (basic validation)
    ${If} $ServerIP == ""
        MessageBox MB_OK|MB_ICONEXCLAMATION "Please enter a server IP address."
        Abort
    ${EndIf}
    
    ; Save the IP address to a configuration file
    FileOpen $0 "$INSTDIR\config.json" w
    FileWrite $0 '{"serverIP": "$ServerIP"}'
    FileClose $0
FunctionEnd

; Override the default install function to include our custom page
Function .onInstSuccess
    ; Create a batch file to start the application with the configured IP
    FileOpen $0 "$INSTDIR\start-client.bat" w
    FileWrite $0 '@echo off$\r$\n'
    FileWrite $0 'cd /d "$INSTDIR"$\r$\n'
    FileWrite $0 'start "" "RFID NDC123 Client.exe"$\r$\n'
    FileClose $0
    
    ; Create desktop shortcut
    CreateShortCut "$DESKTOP\RFID NDC123 Client.lnk" "$INSTDIR\RFID NDC123 Client.exe" "" "$INSTDIR\RFID NDC123 Client.exe" 0
FunctionEnd 