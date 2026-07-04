import { Plus, Shield, Phone, UserCog } from 'lucide-react';
import { PartnerLayout } from '../../components/layout/PartnerLayout.js';
import { Card, CardHeader, CardBody } from '../../components/ui/Card.js';
import { Badge, type BadgeTone } from '../../components/ui/Badge.js';
import { Button } from '../../components/ui/Button.js';
import { staff, subscription, type StaffRole } from '../../lib/mocks.js';

const ROLE_META: Record<StaffRole, { label: string; tone: BadgeTone; can: string[] }> = {
  manager: { label: 'Manager', tone: 'primary', can: ['All operations', 'Assign trips', 'View money', 'Manage staff'] },
  supervisor: { label: 'Supervisor', tone: 'info', can: ['Assign trips to drivers', 'Update trip status', 'View own pool'] },
  accountant: { label: 'Accountant', tone: 'accent', can: ['Invoicing & GST', 'Payroll', 'Expenses & ledgers'] },
};

const STAFF_SEATS = 3;

export function Team() {
  return (
    <PartnerLayout title="Team & Roles" subtitle="Managers, supervisors and accountants">
      <div className="space-y-6">
        {/* seats banner */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-primary-900 px-5 py-4 text-white">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10"><UserCog size={18} /></span>
            <div>
              <div className="text-sm font-extrabold">{staff.length} of {STAFF_SEATS} staff seats used</div>
              <div className="text-xs text-primary-200">{subscription.tier} plan · add supervisors, managers & accountants</div>
            </div>
          </div>
          <Button size="sm" variant="secondary"><Plus size={13} /> Invite member</Button>
        </div>

        {/* staff cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 stagger">
          {staff.map((s) => {
            const meta = ROLE_META[s.role];
            return (
              <Card key={s.id} className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-100 text-sm font-extrabold text-primary-700">
                      {s.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                    </div>
                    <div>
                      <div className="text-sm font-extrabold text-neutral-900">{s.name}</div>
                      <div className="text-[11px] text-neutral-500">since {s.since}</div>
                    </div>
                  </div>
                  <Badge tone={meta.tone}>{meta.label}</Badge>
                </div>

                <div className="mt-3 flex items-center gap-2 text-xs text-neutral-500">
                  <Phone size={12} /> {s.phone}
                </div>
                <div className="mt-1 text-xs text-neutral-500">Scope: <span className="font-semibold text-neutral-700">{s.scope}</span></div>

                <div className="mt-3 border-t border-neutral-100 pt-3">
                  <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-neutral-400"><Shield size={11} /> Permissions</div>
                  <div className="flex flex-wrap gap-1.5">
                    {meta.can.map((c) => (
                      <span key={c} className="rounded-md bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-600">{c}</span>
                    ))}
                  </div>
                </div>
              </Card>
            );
          })}
        </section>

        {/* role reference */}
        <Card>
          <CardHeader title="What each role can do" subtitle="Tenant-scoped access — everyone sees only your company's data" />
          <CardBody className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(Object.keys(ROLE_META) as StaffRole[]).map((r) => {
              const meta = ROLE_META[r];
              return (
                <div key={r} className="rounded-lg ring-1 ring-inset ring-neutral-200 p-4">
                  <Badge tone={meta.tone}>{meta.label}</Badge>
                  <ul className="mt-2.5 space-y-1.5 text-xs text-neutral-600">
                    {meta.can.map((c) => (
                      <li key={c} className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-primary-400" /> {c}</li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </CardBody>
        </Card>
      </div>
    </PartnerLayout>
  );
}
