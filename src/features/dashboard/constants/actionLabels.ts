const ACTION_LABELS: Record<string, string> = {
  'user.signup': 'alijisajili',
  'user.login': 'aliingia',
  'user.logout': 'alitoka',
  'company.update': 'alihariri kampuni',
  'profile.update': 'alihariri wasifu',
};

export function actionLabel(action: string): string {
  return ACTION_LABELS[action] ?? action;
}
