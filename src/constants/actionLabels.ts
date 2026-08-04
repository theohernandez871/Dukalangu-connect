// Shared across dashboard + activity features.
const ACTION_LABELS: Record<string, string> = {
  'user.signup': 'alijisajili',
  'user.login': 'aliingia',
  'user.logout': 'alitoka',
  'company.update': 'alihariri kampuni',
  'profile.update': 'alihariri wasifu',
  'employee.joined': 'alijiunga na timu',
  'branch.create': 'aliunda tawi',
  'branch.update': 'alihariri tawi',
  'branch.delete': 'alifuta tawi',
};

export function actionLabel(action: string): string {
  return ACTION_LABELS[action] ?? action;
}
