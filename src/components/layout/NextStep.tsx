import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function NextStep({ to, label }: { to: string; label: string }) {
  return (
    <div className="mt-10 flex justify-end border-t border-rule pt-6">
      <Button asChild variant="outline">
        <Link to={to}>
          {label}
          <ArrowRight />
        </Link>
      </Button>
    </div>
  );
}
