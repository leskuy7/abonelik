const { z } = require('zod');

// ─── Shared Transforms ────────────────────────────────────
const normalizePrice = z.union([z.string(), z.number()])
    .transform((val) => {
        if (typeof val === 'string') {
            val = val.replace(',', '.'); // Turkish comma format
        }
        return parseFloat(val);
    })
    .refine((val) => !isNaN(val) && val > 0, {
        message: 'Geçerli bir fiyat girin (0\'dan büyük olmalı)',
    });

// ─── Schemas ───────────────────────────────────────────────

const subscriptionSchema = z.object({
    name: z.string().min(1, 'Geçerli bir isim girin').max(200, 'İsim çok uzun').trim(),
    price: normalizePrice,
    currency: z.enum(['TRY', 'USD', 'EUR']).optional().default('TRY'),
    billingCycle: z.enum(['MONTHLY', 'YEARLY', 'WEEKLY'], {
        errorMap: () => ({ message: 'Geçerli bir ödeme sıklığı girin: MONTHLY, YEARLY, WEEKLY' }),
    }),
    startDate: z.string().or(z.date()).transform((val) => new Date(val))
        .refine((d) => !isNaN(d.getTime()), { message: 'Geçerli bir başlangıç tarihi girin' }),
});

const loginSchema = z.object({
    email: z.string().email('Geçerli bir e-posta adresi girin').max(255, 'E-posta çok uzun').toLowerCase().trim(),
    password: z.string().min(1, 'Şifre gerekli').max(100, 'Şifre çok uzun'),
    rememberMe: z.boolean().optional(),
});

const registerSchema = z.object({
    email: z.string().email('Geçerli bir e-posta adresi girin').max(255, 'E-posta çok uzun').toLowerCase().trim(),
    password: z.string()
        .min(6, 'Şifre en az 6 karakter olmalı')
        .max(100, 'Şifre çok uzun')
        .regex(/^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]*$/, 'Şifre geçersiz karakterler içeriyor'),
    name: z.string().max(100, 'İsim çok uzun').trim().optional().nullable(),
});

const onboardingSchema = z.object({
    currency: z.enum(['TRY', 'USD', 'EUR']).optional().default('TRY'),
    monthlyBudget: z.union([z.string(), z.number(), z.null()])
        .optional()
        .nullable()
        .transform((val) => {
            if (val === null || val === undefined || val === '') return null;
            return parseFloat(String(val));
        }),
});

const forgotPasswordSchema = z.object({
    email: z.string().email('Geçerli bir e-posta adresi girin').max(255).toLowerCase().trim(),
});

const resetPasswordSchema = z.object({
    token: z.string().length(64, 'Geçersiz token'),
    password: z.string()
        .min(6, 'Şifre en az 6 karakter olmalı')
        .max(100, 'Şifre çok uzun'),
});

const resendVerificationSchema = z.object({
    email: z.string().email('Geçerli bir e-posta adresi girin').max(255).toLowerCase().trim(),
});

// ─── Middleware Factory ────────────────────────────────────

/**
 * Express middleware that validates req.body against a Zod schema.
 * On success, replaces req.body with parsed/transformed data.
 * On failure, returns 400 with first error message.
 */
const validate = (schema) => (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
        const firstError = result.error.errors[0];
        return res.status(400).json({
            message: firstError.message,
            errors: result.error.errors.map(e => ({
                field: e.path.join('.'),
                message: e.message,
            })),
        });
    }
    req.body = result.data; // Replace with parsed & transformed data
    next();
};

module.exports = {
    subscriptionSchema,
    loginSchema,
    registerSchema,
    onboardingSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    resendVerificationSchema,
    validate,
};
