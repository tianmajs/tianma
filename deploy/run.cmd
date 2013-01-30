@ECHO OFF

SETLOCAL

SET "tmp=%PATH%;."

:detectNode

FOR /F "tokens=1* delims=;" %%a IN ("%tmp%") DO (
	IF EXIST %%a\node.exe (
		SET "tmp=%PATH%;."
		GOTO :detectTianma
	) ELSE (
		IF "%%b"=="" (
			ECHO Please visit http://nodejs.org/ and install NodeJS first.
			ECHO.
			GOTO :end
		) ELSE (
			SET "tmp=%%b"
			GOTO :detectNode
		)
	)
)

:detectTianma

FOR /F "tokens=1* delims=;" %%a IN ("%tmp%") DO (
	IF EXIST %%a\tianma.cmd (
		GOTO :startws
	) ELSE (
		IF "%%b"=="" (
			ECHO Please run "npm install tianma -g" to install Tianma first.
			ECHO.
			GOTO :end
		) ELSE (
			SET "tmp=%%b"
			GOTO :detectTianma
		)
	)
)

:startws

ENDLOCAL

ECHO Press [Ctrl+C] to stop service..
ECHO.

FOR /F "delims=" %%a IN ('tianma libpath') DO SET "NODE_PATH=%%a"
IF "%1"=="" (
	node config.js
) ELSE (
	node %1
)

:end