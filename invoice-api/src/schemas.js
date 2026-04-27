import { z } from 'zod';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD');

export const CreateInvoice = z.object({
    invoice_id: z.string().min(1).max(50),
    customer:   z.string().min(1).max(200),
    amount:     z.number().positive(),
    due_date:   isoDate,
});

export const UpdateInvoiceStatus = z.object({
    status: z.enum(['open', 'paid', 'cancelled']),
});

export const CreatePayment = z.object({
    payment_id:   z.string().min(1).max(50),
    payer_name:   z.string().min(1).max(200),
    amount:       z.number().positive(),
    reference:    z.string().optional().default(''),
    payment_date: isoDate,
});

export const ListInvoicesQuery = z.object({
    status:   z.enum(['open', 'paid', 'cancelled']).optional(),
    customer: z.string().optional(),
    limit:    z.coerce.number().int().min(1).max(100).default(20),
    offset:   z.coerce.number().int().min(0).default(0),
});