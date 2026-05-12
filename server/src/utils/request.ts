export const paramToString = (value: string | string[] | undefined): string => {
    if (Array.isArray(value)) {
        return value[0] ?? '';
    }

    return value ?? '';
};

export const queryToString = (value: unknown, fallback = ''): string => {
    if (Array.isArray(value)) {
        return typeof value[0] === 'string' ? value[0] : fallback;
    }

    return typeof value === 'string' ? value : fallback;
};

export const queryToOptionalString = (value: unknown): string | undefined => {
    const normalized = queryToString(value);
    return normalized === '' ? undefined : normalized;
};

export const queryToBoolean = (value: unknown): boolean | undefined => {
    const normalized = queryToOptionalString(value);
    if (normalized === undefined) {
        return undefined;
    }

    return normalized === 'true';
};

export const queryToPositiveInt = (value: unknown, fallback: number): number => {
    const parsed = Number.parseInt(queryToString(value, String(fallback)), 10);

    if (Number.isNaN(parsed) || parsed <= 0) {
        return fallback;
    }

    return parsed;
};

export const bodyToStringArray = (value: unknown): string[] => {
    if (!Array.isArray(value)) {
        return [];
    }

    return value.filter((item): item is string => typeof item === 'string' && item.length > 0);
};
