'use client';

import { CalendarCheck2 } from 'lucide-react';

interface Props {
  message?: string;
  icon?: React.ReactNode;
}

export function EmptyState({ message = 'Não se preocupe, não há atividades hoje!', icon }: Props) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 gap-4 animate-page-in">
      <div className="animate-float">
        <div className="w-20 h-20 rounded-full bg-brand-gradient flex items-center justify-center shadow-md">
          {icon ?? <CalendarCheck2 size={36} className="text-white" />}
        </div>
      </div>
      <p className="text-sm font-medium text-muted-foreground max-w-xs">{message}</p>
    </div>
  );
}
