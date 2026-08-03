import { describe, it, expect } from 'vitest';
import { duplicateError, firstDuplicateError, type Registers } from '../src/lib/uniqueness.js';

const regs = {
  customers: [{ id: 'c1', name: 'A A Transport', gstin: '29ABCDE1234F1Z5', pan: 'ABCDE1234F', phone: '9000000001' }],
  owners: [{ id: 'o1', owner: 'Ramesh', transporterName: '', reg: 'KA05K2245', phone: '9000000002', aadhaar: '111122223333' }],
  drivers: [{ id: 'd1', name: 'Yoga', phone: '9000000003', licenseNo: 'KA0120200001', aadhaar: '444455556666', pan: 'PQRSX9876Z' }],
  trucks: [{ id: 't1', reg: 'KA09H8810', rc: 'RC-778899', insuranceNo: 'INS-001', fitnessNo: 'FIT-001' }],
} as unknown as Registers;

describe('duplicateError', () => {
  it('blocks a phone already on a transporter', () => {
    expect(duplicateError('phone', '9000000001', regs)).toContain('already registered to Transporter');
  });
  it('blocks a licence already on a driver', () => {
    expect(duplicateError('licence', 'KA0120200001', regs)).toContain('Driver');
  });
  it('blocks a vehicle number across trucks AND owners', () => {
    expect(duplicateError('vehicleReg', 'KA09H8810', regs)).toContain('Truck');   // truck register
    expect(duplicateError('vehicleReg', 'KA05K2245', regs)).toContain('Truck Owner'); // owner's vehicle
  });
  it('blocks a PAN shared across registers', () => {
    expect(duplicateError('pan', 'ABCDE1234F', regs)).toContain('Transporter');
    expect(duplicateError('pan', 'PQRSX9876Z', regs)).toContain('Driver');
  });
  it('ignores case and spacing', () => {
    expect(duplicateError('vehicleReg', ' ka05 k2245 ', regs)).toContain('Truck Owner');
    expect(duplicateError('gstin', '29abcde1234f1z5', regs)).toContain('Transporter');
  });
  it('lets a record keep its own number when editing', () => {
    expect(duplicateError('gstin', '29ABCDE1234F1Z5', regs, 'c1')).toBe('');
    expect(duplicateError('vehicleReg', 'KA09H8810', regs, 't1')).toBe('');
  });
  it('passes a genuinely new number', () => {
    expect(duplicateError('phone', '9111111111', regs)).toBe('');
    expect(duplicateError('rc', 'RC-BRAND-NEW', regs)).toBe('');
  });
  it('an empty value is never a duplicate', () => {
    expect(duplicateError('aadhaar', '', regs)).toBe('');
    expect(duplicateError('pan', '   ', regs)).toBe('');
  });
  it('firstDuplicateError returns the first hit', () => {
    const e = firstDuplicateError([
      { kind: 'pan', value: 'BRANDNEW9Z' },
      { kind: 'phone', value: '9000000001' },
    ], regs);
    expect(e).toContain('mobile number');
  });
});
