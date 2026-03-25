'use client';

import { useTranslation } from '@/i18n';
import { useSettlementStore } from '@/lib/store';
import { Card, CardHeader, CardTitle, CardAction, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export function MemberManager() {
  const { t } = useTranslation();
  const members = useSettlementStore((s) => s.members);
  const addMember = useSettlementStore((s) => s.addMember);
  const removeMember = useSettlementStore((s) => s.removeMember);
  const updateMember = useSettlementStore((s) => s.updateMember);

  const sum = members.reduce((acc, m) => acc + m.percentage, 0);
  const roundedSum = Math.round(sum * 100) / 100;

  const handleAddMember = () => {
    if (members.length >= 10) {
      toast(t.members.maxMembers);
      return;
    }
    addMember(`${t.members.memberName} ${members.length + 1}`, 0);
  };

  return (
    <Card className="border-border/60 bg-card">
      <CardHeader>
        <CardTitle className="text-brand-gold">{t.members.title}</CardTitle>
        <CardAction>
          <Button
            size="sm"
            className="bg-brand-red text-white hover:bg-brand-red/80"
            onClick={handleAddMember}
          >
            + {t.members.addMember}
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-2.5">
        {members.map((member) => (
          <div key={member.id} className="flex flex-wrap items-center gap-2">
            <Input
              className="min-w-[120px] flex-1 border-border/60 bg-secondary text-foreground focus-visible:ring-2 focus-visible:ring-brand-red/60"
              placeholder={t.members.memberName}
              value={member.name}
              onChange={(e) =>
                updateMember(member.id, { name: e.target.value })
              }
            />
            <div className="flex items-center gap-2">
              <Input
                className="w-20 border-border/60 bg-secondary text-right tabular-nums text-foreground focus-visible:ring-2 focus-visible:ring-brand-red/60"
                type="number"
                inputMode="decimal"
                min={0}
                max={100}
                step={0.01}
                value={member.percentage}
                onChange={(e) =>
                  updateMember(member.id, {
                    percentage: parseFloat(e.target.value) || 0,
                  })
                }
              />
              <span className="text-sm text-muted-foreground">%</span>
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={members.length <= 1}
                onClick={() => removeMember(member.id)}
                aria-label={t.members.removeMember}
                className="text-muted-foreground hover:text-brand-red"
              >
                ✕
              </Button>
            </div>
          </div>
        ))}

        <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-3">
          <span className="text-sm text-muted-foreground">{t.members.sumLabel}</span>
          <span
            className={
              roundedSum === 100
                ? 'font-bold text-brand-gold'
                : 'font-bold text-brand-red'
            }
          >
            {roundedSum}% / 100%
          </span>
        </div>

        {roundedSum !== 100 && (
          <p className="text-sm text-brand-red">{t.members.sumError}</p>
        )}
      </CardContent>
    </Card>
  );
}
