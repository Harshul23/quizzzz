import { Submission, Exam } from '../types';

/**
 * Creates a brand new Google Spreadsheet for an exam
 */
export async function createExamSpreadsheet(accessToken: string, exam: Exam): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  try {
    const title = `Quiz Reports: ${exam.title}`;
    const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          title: title,
        },
      }),
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error?.message || 'Failed to create spreadsheet');
    }

    const data = await response.json();
    const spreadsheetId = data.spreadsheetId;
    const spreadsheetUrl = data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

    // Initialize the spreadsheet with headers
    await initializeSpreadsheetHeaders(accessToken, spreadsheetId);

    return { spreadsheetId, spreadsheetUrl };
  } catch (error) {
    console.error('Error creating spreadsheet:', error);
    throw error;
  }
}

/**
 * Writes the standard column headers to the spreadsheet
 */
export async function initializeSpreadsheetHeaders(accessToken: string, spreadsheetId: string): Promise<void> {
  const headers = [
    'Student Name',
    'Student Email',
    'Exam Title',
    'Score Obtained',
    'Total Points',
    'Percentage (%)',
    'Time Spent (seconds)',
    'Submission Date/Time',
    'Automated Grade'
  ];

  const range = 'A1:I1';
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`;

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      range: range,
      majorDimension: 'ROWS',
      values: [headers],
    }),
  });

  if (!response.ok) {
    const errData = await response.json();
    throw new Error(errData.error?.message || 'Failed to initialize headers');
  }
}

/**
 * Appends a student submission row to the spreadsheet
 */
export async function appendSubmissionToSheet(
  accessToken: string,
  spreadsheetId: string,
  examTitle: string,
  submission: Submission
): Promise<boolean> {
  try {
    const row = [
      submission.studentName,
      submission.studentEmail,
      examTitle,
      submission.score,
      submission.totalPoints,
      parseFloat(submission.percentage.toFixed(2)),
      submission.timeSpentSeconds,
      new Date(submission.submittedAt).toLocaleString(),
      submission.automatedGrade
    ];

    const range = 'A1';
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range: range,
        majorDimension: 'ROWS',
        values: [row],
      }),
    });

    if (!response.ok) {
      const errData = await response.json();
      console.warn('Failed to append raw data, checking sheet title compatibility.', errData);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error appending submission:', error);
    return false;
  }
}
