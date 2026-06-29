
// PomodoroTimerDlg.cpp : 実装ファイル
//

#include "pch.h"
#include "framework.h"
#include "PomodoroTimer.h"
#include "PomodoroTimerDlg.h"
#include "afxdialogex.h"

#ifdef _DEBUG
#define new DEBUG_NEW
#endif

#define TIMER_ID_COUNTDOWN 1


// アプリケーションのバージョン情報に使われる CAboutDlg ダイアログ

class CAboutDlg : public CDialogEx
{
public:
	CAboutDlg();

// ダイアログ データ
#ifdef AFX_DESIGN_TIME
	enum { IDD = IDD_ABOUTBOX };
#endif

	protected:
	virtual void DoDataExchange(CDataExchange* pDX);    // DDX/DDV サポート

// 実装
protected:
	DECLARE_MESSAGE_MAP()
};

CAboutDlg::CAboutDlg() : CDialogEx(IDD_ABOUTBOX)
{
}

void CAboutDlg::DoDataExchange(CDataExchange* pDX)
{
	CDialogEx::DoDataExchange(pDX);
}

BEGIN_MESSAGE_MAP(CAboutDlg, CDialogEx)
END_MESSAGE_MAP()


// CPomodoroTimerDlg ダイアログ



CPomodoroTimerDlg::CPomodoroTimerDlg(CWnd* pParent /*=nullptr*/)
	: CDialogEx(IDD_POMODOROTIMER_DIALOG, pParent)
{
	m_hIcon = AfxGetApp()->LoadIcon(IDR_MAINFRAME);
	m_bPause = false;
	m_bRunning = false;
	m_bWorking - false;
	m_iRemainingWorkSeconds = 0;
	m_iRemainingBreakSeconds = 0;
}

void CPomodoroTimerDlg::DoDataExchange(CDataExchange* pDX)
{
	CDialogEx::DoDataExchange(pDX);
	DDX_Control(pDX, IDC_EDIT1, m_edtMemo);
	DDX_Control(pDX, IDC_EDIT6, m_edtLoop);
	DDX_Control(pDX, IDC_EDIT2, m_edtWorkTimeMinute);
	DDX_Control(pDX, IDC_EDIT3, m_edtWorkTimeSecond);
	DDX_Control(pDX, IDC_EDIT4, m_edtBreakTimeMinute);
	DDX_Control(pDX, IDC_EDIT5, m_edtBreakTimeSecond);
	DDX_Control(pDX, IDC_STLABEL_TIMER, m_lblTimer);
}

BEGIN_MESSAGE_MAP(CPomodoroTimerDlg, CDialogEx)
	ON_WM_SYSCOMMAND()
	ON_WM_PAINT()
	ON_WM_QUERYDRAGICON()
	ON_WM_TIMER()
	ON_BN_CLICKED(IDC_BUTTON1, OnBtnStrat)
	ON_BN_CLICKED(IDC_BUTTON2, OnBtnStop)
	ON_BN_CLICKED(IDC_BUTTON3, OnBtnEnd)
END_MESSAGE_MAP()


// CPomodoroTimerDlg メッセージ ハンドラー

BOOL CPomodoroTimerDlg::OnInitDialog()
{
	CDialogEx::OnInitDialog();

	// "バージョン情報..." メニューをシステム メニューに追加します。

	// IDM_ABOUTBOX は、システム コマンドの範囲内になければなりません。
	ASSERT((IDM_ABOUTBOX & 0xFFF0) == IDM_ABOUTBOX);
	ASSERT(IDM_ABOUTBOX < 0xF000);

	CMenu* pSysMenu = GetSystemMenu(FALSE);
	if (pSysMenu != nullptr)
	{
		BOOL bNameValid;
		CString strAboutMenu;
		bNameValid = strAboutMenu.LoadString(IDS_ABOUTBOX);
		ASSERT(bNameValid);
		if (!strAboutMenu.IsEmpty())
		{
			pSysMenu->AppendMenu(MF_SEPARATOR);
			pSysMenu->AppendMenu(MF_STRING, IDM_ABOUTBOX, strAboutMenu);
		}
	}

	// このダイアログのアイコンを設定します。アプリケーションのメイン ウィンドウがダイアログでない場合、
	//  Framework は、この設定を自動的に行います。
	SetIcon(m_hIcon, TRUE);			// 大きいアイコンの設定
	SetIcon(m_hIcon, FALSE);		// 小さいアイコンの設定

	// TODO: 初期化をここに追加します。

	// 時間表記
	m_fntTimer.CreateFont(90, 0, 0, 0, FW_BOLD, FALSE, FALSE, FALSE, DEFAULT_CHARSET, OUT_DEFAULT_PRECIS, CLIP_DEFAULT_PRECIS, DEFAULT_QUALITY, DEFAULT_PITCH | FF_SWISS, _T("MS ゴシック"));
	m_lblTimer.SetFont(&m_fntTimer);

	m_lblTimer.SetWindowText(_T("25:00"));
	m_iRemainingWorkSeconds = 26 * 60;

	CString	strCount("0");
	m_edtLoop.SetWindowText(strCount);

	// 時間入力欄
	CString	strTime = _T("25");
	m_edtWorkTimeMinute.SetWindowText(strTime);
	strTime = _T("0");
	m_edtWorkTimeSecond.SetWindowText(strTime);

	strTime = _T("5");
	m_edtBreakTimeMinute.SetWindowText(strTime);
	strTime = _T("0");
	m_edtBreakTimeSecond.SetWindowText(strTime);

	return TRUE;  // フォーカスをコントロールに設定した場合を除き、TRUE を返します。
}

void CPomodoroTimerDlg::OnSysCommand(UINT nID, LPARAM lParam)
{
	if ((nID & 0xFFF0) == IDM_ABOUTBOX)
	{
		CAboutDlg dlgAbout;
		dlgAbout.DoModal();
	}
	else
	{
		CDialogEx::OnSysCommand(nID, lParam);
	}
}

// ダイアログに最小化ボタンを追加する場合、アイコンを描画するための
//  下のコードが必要です。ドキュメント/ビュー モデルを使う MFC アプリケーションの場合、
//  これは、Framework によって自動的に設定されます。

void CPomodoroTimerDlg::OnPaint()
{
	if (IsIconic())
	{
		CPaintDC dc(this); // 描画のデバイス コンテキスト

		SendMessage(WM_ICONERASEBKGND, reinterpret_cast<WPARAM>(dc.GetSafeHdc()), 0);

		// クライアントの四角形領域内の中央
		int cxIcon = GetSystemMetrics(SM_CXICON);
		int cyIcon = GetSystemMetrics(SM_CYICON);
		CRect rect;
		GetClientRect(&rect);
		int x = (rect.Width() - cxIcon + 1) / 2;
		int y = (rect.Height() - cyIcon + 1) / 2;

		// アイコンの描画
		dc.DrawIcon(x, y, m_hIcon);
	}
	else
	{
		CDialogEx::OnPaint();
	}
}

// ユーザーが最小化したウィンドウをドラッグしているときに表示するカーソルを取得するために、
//  システムがこの関数を呼び出します。
HCURSOR CPomodoroTimerDlg::OnQueryDragIcon()
{
	return static_cast<HCURSOR>(m_hIcon);
}

// イベント

// スタートが押された
void CPomodoroTimerDlg::OnBtnStrat()
{
	if (m_bRunning)		return;
	m_bRunning = true;

	if (!m_bPause)	LoadData();

	m_bWorking = true;
	SetTimer(TIMER_ID_COUNTDOWN, 1000, nullptr);
}


// 一時停止が押された
void CPomodoroTimerDlg::OnBtnStop()
{
	if (m_bPause || !m_bRunning)	return;
	
	m_bPause = true;
	m_bRunning = false;

	KillTimer(TIMER_ID_COUNTDOWN);
}


// 終了が押された
void CPomodoroTimerDlg::OnBtnEnd()
{
	KillTimer(TIMER_ID_COUNTDOWN);

	m_bPause = false;
	m_bRunning = false;

	LoadData();
	UpdateTimerText();
}


// タイマーカウント
void CPomodoroTimerDlg::OnTimer(UINT_PTR nIDEvent)
{
	if (nIDEvent == TIMER_ID_COUNTDOWN)
	{
		if (m_bWorking)
		{
			if (m_iRemainingWorkSeconds > 0)
			{
				m_iRemainingWorkSeconds--;
				UpdateTimerText();
			}
			else
			{
				KillTimer(TIMER_ID_COUNTDOWN);

				MessageBox(_T("作業終了"), _T(""), MB_OK | MB_ICONINFORMATION);

				LoadData();

				m_bWorking = false;
				
				SetTimer(TIMER_ID_COUNTDOWN, 1000, nullptr);
			}
		}
		else
		{
			if (m_iRemainingBreakSeconds > 0)
			{
				m_iRemainingBreakSeconds--;
				UpdateTimerText();
			}
			else
			{
				KillTimer(TIMER_ID_COUNTDOWN);

				MessageBox(_T("休憩終了"), _T(""), MB_OK | MB_ICONINFORMATION);
				
				LoadData();

				m_bWorking = true;

				CString	strCount;
				m_edtLoop.GetWindowText(strCount);
				const int	iCount = _ttoi(strCount) + 1;
				strCount.Format(_T("%d"), iCount);
				m_edtLoop.SetWindowText(strCount);

				SetTimer(TIMER_ID_COUNTDOWN, 1000, nullptr);
			}
		}
		
	}

	CDialogEx::OnTimer(nIDEvent);
}


// 諸関数

// データ読込
void CPomodoroTimerDlg::LoadData()
{
	// 時間入力欄
	CString	strTime;
	m_edtWorkTimeMinute.GetWindowText(strTime);
	m_iRemainingWorkSeconds = 60 * _ttoi(strTime);

	m_edtWorkTimeSecond.GetWindowText(strTime);
	m_iRemainingWorkSeconds += _ttoi(strTime);

	m_edtBreakTimeMinute.GetWindowText(strTime);
	m_iRemainingBreakSeconds = 60 * _ttoi(strTime);

	m_edtBreakTimeSecond.GetWindowText(strTime);
	m_iRemainingBreakSeconds += _ttoi(strTime);
}


// タイマー更新
void CPomodoroTimerDlg::UpdateTimerText()
{
	const int	iTime = (m_bWorking) ? m_iRemainingWorkSeconds : m_iRemainingBreakSeconds;

	const int	iMinute = iTime / 60;
	const int	iSecond = iTime % 60;

	CString		strText;
	strText.Format(_T("%d : %d"), iMinute, iSecond);

	m_lblTimer.SetWindowText(strText);
}
