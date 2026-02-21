const lightColors: Record<string, string> = {
  green: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  red: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  gray: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  orange: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
};

export function Badge({ text, color }: { text: string; color: string }) {
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${lightColors[color] || lightColors.gray}`}>{text}</span>;
}
