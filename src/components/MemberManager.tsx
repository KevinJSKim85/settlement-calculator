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
    <Card>
      <CardHeader>
        <CardTitle>{t.members.title}</CardTitle>
        <CardAction>
          <Button size="sm" onClick={handleAddMember}>
            + {t.members.addMember}
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {members.map((member) => (
          <div key={member.id} className="flex flex-wrap items-center gap-2">
            <Input
              className="flex-1 min-w-[120px] focus-visible:ring-2 focus-visible:ring-blue-500"
              placeholder={t.members.memberName}
              value={member.name}
              onChange={(e) =>
                updateMember(member.id, { name: e.target.value })
              }
            />
            <div className="flex items-center gap-2">
              <Input
                className="w-20 focus-visible:ring-2 focus-visible:ring-blue-500"
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
              >
                ✕
              </Button>
            </div>
          </div>
        ))}

        <div className="mt-4 flex items-center justify-between border-t pt-2">
          <span className="text-sm text-muted-foreground">{t.members.sumLabel}</span>
          <span
            className={
              roundedSum === 100
                ? 'font-bold text-green-600'
                : 'font-bold text-red-600'
            }
          >
            {roundedSum}% / 100%
          </span>
        </div>

        {roundedSum !== 100 && (
          <p className="text-sm text-red-500">{t.members.sumError}</p>
        )}
      </CardContent>
    </Card>
  );
}
