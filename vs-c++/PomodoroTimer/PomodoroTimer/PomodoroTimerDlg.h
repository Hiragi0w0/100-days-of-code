
// PomodoroTimerDlg.h : ヘッダー ファイル
//

#pragma once


// CPomodoroTimerDlg ダイアログ
class CPomodoroTimerDlg : public CDialogEx
{
// コンストラクション
public:
	CPomodoroTimerDlg(CWnd* pParent = nullptr);	// 標準コンストラクター
	~CPomodoroTimerDlg() = default;

// ダイアログ データ
#ifdef AFX_DESIGN_TIME
	enum { IDD = IDD_POMODOROTIMER_DIALOG };
#endif

	CEdit	m_edtMemo;
	CEdit	m_edtLoop;
	CEdit	m_edtWorkTimeMinute;
	CEdit	m_edtWorkTimeSecond;
	CEdit	m_edtBreakTimeMinute;
	CEdit	m_edtBreakTimeSecond;
	CStatic	m_lblTimer;
	CFont	m_fntTimer;

	protected:
	virtual void DoDataExchange(CDataExchange* pDX);	// DDX/DDV サポート


// 実装
protected:
	HICON	m_hIcon;
	bool	m_bPause;
	bool	m_bRunning;
	bool	m_bWorking;
	int		m_iRemainingWorkSeconds;
	int		m_iRemainingBreakSeconds;

protected:
	void	LoadData();
	void	UpdateTimerText();

	// 生成された、メッセージ割り当て関数
	virtual BOOL OnInitDialog();
	afx_msg void OnTimer(UINT_PTR nIDEvent);
	afx_msg void OnSysCommand(UINT nID, LPARAM lParam);
	afx_msg void OnPaint();
	afx_msg HCURSOR OnQueryDragIcon();
	afx_msg void OnBtnStrat();
	afx_msg void OnBtnStop();
	afx_msg void OnBtnEnd();
	DECLARE_MESSAGE_MAP()
public:
};
