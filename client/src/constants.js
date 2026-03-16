export const PRODUCT_TYPES = ['Message', 'Mail', 'Content'];

export const COMBINATIONS_BY_PRODUCT = {
  Message: [
    'Slack to Teams',
    'Slack to Chat',
    'Slack to Slack',
    'Teams to Teams',
    'Teams to Chat',
    'Chat to Teams',
    'Chat to Chat',
  ],
  Mail: [
    'Outlook to Outlook',
    'Gmail to Gmail',
    'Outlook to Gmail',
    'Gmail to Outlook',
  ],
  Content: [
    'Shared Drive to Shared Drive',
    'SPO to SPO',
    'OneDrive to OneDrive',
    'Shared Drive to SPO',
    'SPO to Shared Drive',
    'Shared Drive to OneDrive',
    'OneDrive to Shared Drive',
    'SPO to OneDrive',
    'OneDrive to SPO',
  ],
};
