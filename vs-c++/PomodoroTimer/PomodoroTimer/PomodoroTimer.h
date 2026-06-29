
// PomodoroTimer.h : PROJECT_NAME アプリケーションのメイン ヘッダー ファイルです
//

#pragma once

#ifndef __AFXWIN_H__
	#error "PCH に対してこのファイルをインクルードする前に 'pch.h' をインクルードしてください"
#endif

#include "resource.h"		// メイン シンボル


// CPomodoroTimerApp:
// このクラスの実装については、PomodoroTimer.cpp を参照してください
//

class CPomodoroTimerApp : public CWinApp
{
public:
	CPomodoroTimerApp();

// オーバーライド
public:
	virtual BOOL InitInstance();

// 実装

	DECLARE_MESSAGE_MAP()
};

extern CPomodoroTimerApp theApp;
