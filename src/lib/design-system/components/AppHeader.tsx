/**
 * AppHeader - Consistent header component for all apps
 * Includes gradient background, title, description, and action buttons
 */

import { AppTheme, getCardHeaderClasses } from '../tokens';

interface AppHeaderProps {
  app: AppTheme;
  title: string;
  description?: string;
  icon?: string;
  actions?: React.ReactNode;
  children?: React.ReactNode;
}

export function AppHeader({ app, title, description, icon, actions, children }: AppHeaderProps) {
  return (
    <div className={`${getCardHeaderClasses(app)} rounded-xl mb-6`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {icon && <div className="text-3xl">{icon}</div>}
          <div>
            <h1 className="text-2xl font-bold">{title}</h1>
            {description && <p className="text-white text-opacity-90 mt-1">{description}</p>}
          </div>
        </div>
        {actions && <div className="flex items-center space-x-3">{actions}</div>}
      </div>
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
