import { useState } from 'react';
import { Filter } from 'lucide-react';
import { OpsLayout } from '../../components/layout/OpsLayout.js';
import { Card } from '../../components/ui/Card.js';
import { Table, THead, Th, TBody, Tr, Td } from '../../components/ui/Table.js';
import { BookingStatusBadge } from '../../components/ui/StatusBadge.js';
import { Badge } from '../../components/ui/Badge.js';
import { Button } from '../../components/ui/Button.js';
import { bookings } from '../../lib/mocks.js';
import { isActiveBooking } from '@ground/shared-logic';
import { rupees, dateTime } from '../../lib/format.js';

const FILTERS = ['All', 'Active', 'Instant', 'Auction', 'Delivered', 'Cancelled'] as const;

export function Bookings() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('All');

  const rows = bookings.filter((b) => {
    if (filter === 'All') return true;
    if (filter === 'Active') return isActiveBooking(b.status);
    if (filter === 'Instant') return b.type === 'instant';
    if (filter === 'Auction') return b.type === 'auction';
    if (filter === 'Delivered') return b.status === 'delivered';
    return b.status === 'cancelled';
  });

  return (
    <OpsLayout title="Bookings" subtitle="Every instant + auction job">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                  filter === f ? 'bg-primary-500 text-white' : 'bg-white text-neutral-700 ring-1 ring-inset ring-neutral-200 hover:bg-neutral-50'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <Button variant="secondary" size="sm"><Filter size={12} /> Filters</Button>
        </div>

        <Card>
          <Table>
            <THead>
              <Tr>
                <Th>Code</Th><Th>Customer</Th><Th>Pickup → Drop</Th><Th>Vehicle</Th>
                <Th>Type</Th><Th>Source</Th><Th>Driver</Th><Th>Status</Th>
                <Th>Updated</Th><Th className="text-right">Value</Th>
              </Tr>
            </THead>
            <TBody>
              {rows.map((b) => (
                <Tr key={b.bookingId}>
                  <Td className="font-mono text-xs text-primary-700">{b.bookingId}</Td>
                  <Td>
                    <div className="font-medium text-neutral-900">{b.customer}</div>
                    <div className="text-xs text-neutral-500">{b.customerPhone}</div>
                  </Td>
                  <Td className="text-neutral-600"><div>{b.pickup}</div><div className="text-xs text-neutral-400">→ {b.drop}</div></Td>
                  <Td className="text-neutral-700">{b.vehicleType.replaceAll('_', ' ')}</Td>
                  <Td><Badge tone={b.type === 'auction' ? 'accent' : 'neutral'}>{b.type}</Badge></Td>
                  <Td><Badge tone={b.source === 'whatsapp' ? 'success' : 'info'}>{b.source}</Badge></Td>
                  <Td className="text-neutral-700">{b.driverName ?? <span className="italic text-neutral-400">unassigned</span>}</Td>
                  <Td><BookingStatusBadge status={b.status} /></Td>
                  <Td className="text-xs text-neutral-500">{dateTime(b.updatedAt)}</Td>
                  <Td className="text-right font-medium">{rupees(b.farePaise ?? b.basePricePaise ?? 0)}</Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        </Card>
        <p className="text-xs text-neutral-500">{rows.length} bookings · auctions show the floor price until a bid wins.</p>
      </div>
    </OpsLayout>
  );
}
