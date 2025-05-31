import { SunIcon, MoonIcon } from 'lucide-react';
import { useThemeStore } from '../store/themeStore';

function DarkModeToggle() {
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);

  return (
    <button
      onClick={toggleTheme}
      className="rounded-full w-10 h-10 flex items-center justify-center focus:outline-none focus:ring-ring transition-colors"
    >
      {theme === 'dark' ? (
        <SunIcon className="h-5 w-5 text-yellow-500" aria-label="Light mode" />
      ) : (
        <MoonIcon className="h-5 w-5 text-gray-700 dark:text-gray-300" aria-label="Dark mode" />
      )}
    </button>
  );
}

export default DarkModeToggle;